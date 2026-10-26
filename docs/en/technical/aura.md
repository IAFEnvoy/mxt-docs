---
title: Aura Calculation
description: A source-level walkthrough of how the aura value at a position is computed — how the static template is picked, how chunk stock and block emitters are merged, where the caches and the approximation error are, and which half the client sees.
---

# Aura Calculation

This page is about how "how much aura is at this position" is computed. For the fields themselves see [aura](../datapack/json/aura.md) and [aura_zone](../datapack/json/aura_zone.md).

## Where the code lives

| Class | Responsibility |
| --- | --- |
| `runtime.world.AuraService` | The one query entry point: zone resolution, stock, weighted block contributions, consumption, queries. |
| `runtime.world.AuraQueryCache` | Per-tick memo: results, static zone, pools, biome, availability… |
| `runtime.world.AuraChunkTicker` | Periodic work: section rescan, visitor counts, stock regeneration. |
| `runtime.world.AuraZoneEventBridge` | The entity-tick query gate, zone enter/leave events, snapshots to clients. |
| `attachment.AuraChunkAttachment` | The chunk stock: authoritative, persisted, consumable, regenerating. |
| `runtime.world.BlockAuraService` | Block emitters: scans chunks, builds the per-section aggregates. |
| `runtime.world.BlockAuraSectionCache` | One sub-chunk's aggregate value and source positions. |
| `runtime.world.AuraWorldAttachment` | Artificial aura areas (persistent, rectangular). |
| `runtime.world.AuraClientState` | The interpolated client snapshot. |
| `runtime.cultivation.AuraDistributionService` | Splitting one chunk's stock between the players in it. |
| `runtime.aura.AuraLookup` | Definition lookups: value → aura, and enumerating all of them. |

## Two things to keep apart

- **`mxt:aura` is an identity, not a number**: an `Aura` only says *which* aura it is (which `resource` it is measured in, which element it belongs to, its burst amount…).
- **The answer for a position is an `AuraResult`**: a table of `aura → AuraPool(amount, maximum, regenPerTick, supplied)`, plus rules, a source and a `SourceKind`. Which auras are in the table is exactly "what this place is made of".

`supplied` records how much of that amount comes from the block emitters underfoot, because a consumer allowed to spend the ground it stands on (a formation drawing the environment) has to subtract its own share or it would count the same aura twice.

## The resolution flow

```mermaid
flowchart TD
    Q["Query aura at a position"] --> FLUSH["Rebuild chunks marked dirty this tick"]
    FLUSH --> MEMO{"Already in this tick's result table?"}
    MEMO -->|yes| DONE["Return it"]
    MEMO -->|no| CHUNK["Read the chunk's aura attachment"]
    CHUNK --> NEED{"Initialised, and still the current static zone?"}
    NEED -->|no| INIT["Initialise the stock from the template<br/>environment pools + block contribution"]
    NEED -->|yes| ZONE
    INIT --> ZONE["Resolve the static template"]
    ZONE --> BIOME["Pick a zone by biome"]
    BIOME --> DIM["A dimension binding replaces the biome zone"]
    DIM --> FALLBACK["Otherwise fall back to the empty zone"]
    DIM --> CUSTOM["An artificial area overrides it"]
    CUSTOM --> FORM["The nearest formation aura zone overrides it"]
    FORM --> EVENT{"Was the override event cancelled?"}
    EVENT -->|cancelled| POOLS
    EVENT -->|not cancelled| POOLS["Start from the chunk stock<br/>and apply the formation's maximum bonus"]
    POOLS --> BLOCK["Scan the 7×7×7 sections<br/>and weight block emitters by distance"]
    BLOCK --> MERGE["Subtract this chunk's aggregate<br/>and add the weighted view back"]
    MERGE --> RESULT["Assemble the AuraResult"]
    RESULT --> CACHE["Write this tick's memo tables"]
    CACHE --> SYNC["Sync a snapshot every 5 ticks"]
```

The diagram below opens the same chain up sideways: on the left, where the state a query reads comes from; on the right, where the two concentrations end up.

```mermaid
flowchart LR
    POS["Query position"] --> STOCK["Chunk stock<br/>consumable and regenerating"]
    POS --> BLOCKCACHE["Block aura cache<br/>per-section aggregates"]
    BLOCKCACHE --> SCAN["Scan the 7×7×7 sections<br/>weighted by 1 / max(1, d²)"]
    STOCK --> AVAIL["Availability: consumed share<br/>split between visitors"]
    SCAN --> AVAIL
    STOCK --> MERGE["Subtract this chunk's aggregate<br/>and add the weighted view back"]
    SCAN --> MERGE
    POS --> TEMPLATE["Resolve the static template"]
    TEMPLATE --> ZONE["Pick a zone by biome<br/>or a dimension binding replaces it"]
    ZONE --> AREA["Artificial area overrides<br/>rectangular and persistent"]
    AREA --> FORM["Nearest formation aura zone overrides"]
    MERGE --> RESULT["Assemble the AuraResult"]
    FORM --> RESULT
    RESULT --> ACTUAL["Actual concentration<br/>stock plus block contributions"]
    RESULT --> ENV["Environment concentration<br/>template recomputed alone"]
    ACTUAL --> SNAP["Server computes every 5 ticks<br/>and sends each player a snapshot"]
    ENV --> SNAP
    SNAP --> CLIENT["Client interpolates about 0.25 s"]
    CLIENT --> RENDER["Fog, resource bars and HUD<br/>formula contexts"]
```

A few easy misreadings:

- **Zone resolution replaces, it never adds.** A biome zone wins if one matches, otherwise a dimension binding; neither means the empty zone. An artificial area overrides both, and a formation aura zone overrides that — exactly one template survives.
- **Within one layer `priority` decides**, and a tie goes to the **lower** registry id; the empty zone has `Integer.MIN_VALUE`, so it always loses.
- **A formation is picked as the nearest one that can give an aura zone**, not the highest priority one: otherwise an inner ward would hide the aura zone of the array it stands in.
- **The override event can veto** the formation step; when cancelled the previously resolved template stays.
- **The stock is only re-seeded when a section has none yet or the template changed.** The stock is a state that has already been consumed from, so it cannot be recomputed from scratch on every query; seeding is done for the whole chunk at once.
- **A query writes state**: `AuraChunkTicker` initialising an unseeded chunk is itself a query at the chunk's midpoint.

## How the environmental stock is computed

The template decides what the **environment** here can give (block emitters aside):

```java
double initial = Math.max(0.0D, (value.amount() + noise(pos)) / 10.0D - 5.0D);
double fluctuation = factor(zone, gameTime);
new AuraPool(initial * fluctuation, value.max().resolve(initial), value.regenPerTick());
```

- `amount` first goes through a `/10 - 5` shift and scale (`amount` defaults to `0`, so an undeclared aura is simply zero), then a 2D value noise is added.
- **Fluctuation only scales `amount`**: `maximum` resolves `max` from the **unscaled** `initial` (with the default `mxt:initial_multiplier` at a multiplier of `1`, the ceiling is the local initial value).
- Cycles: a day cycle of `24000` ticks and a moon cycle of `192000`, `1 + amplitude * sin(...)` floored at 0; `static` or disabled reads `1.0`.
- `AuraPool` requires finite, non-negative values with `maximum` allowed to be `+∞`, and clamps `amount` to `maximum` whenever the maximum is finite — so regeneration never crosses the ceiling while an unlimited pool has no ceiling at all.

## Block emitters: 7×7×7 sections

Block contributions are gathered per **sub-chunk** by `applyBlockDistance` over the **7×7×7** sections around the query point's section, `dx, dz, dy ∈ [-3, 3]`:

| Distance from the query point | What is used | Distance |
| --- | --- | --- |
| Within 3×3×3 sections | each entry of `sources()`, at its **real block position** | block centre to query point |
| Outside 3×3×3 but still inside 7×7×7 | the section's **aggregate value**, at the **section centre** | section centre to query point |
| Beyond 7×7×7 | nothing | — |

A section outside the cube is already at least 64 blocks away, where `1 / max(1, d²)` is `1/4096` or less, so the cutoff changes nothing measurable — it just stops paying for the work.

The weight is `1 / max(1, d²)` in both cases (the `max` keeps a zero distance from producing infinity). Every term is then multiplied by an availability factor:

```java
double available = Math.clamp((shared.amount() - environmental) / aggregate.amount(), 0.0D, 1.0D);
return available / Math.max(1, visitors);
```

That is "how much of the shared stock has already been consumed", scaled, and then split between **visitors** — one patch of block aura cannot be taken in full by every player asking for it. Finally the current chunk's stock is rewritten as "subtract this chunk's aggregate, add the weighted view back" for amount, maximum and regeneration alike, and `supplied` records the weighted amount that was added.

Unloaded chunks are skipped outright: **aura reads low at chunk borders**, which is a deliberate trade (no terrain generation to answer a query).

## How the block cache is built (and why the palette)

The unit is a **sub-chunk**, not a whole column. Each section goes through three steps, and a section that fails any of the first two never reads a single cell:

1. `hasOnlyAir()` — an all-air section is skipped in O(1);
2. `maybeHas(state in the block index)` — this walks **palette entries only** (1 test for a single-value section, ≤16 for a linear palette, ≤256 for a hash palette), never the 4096 cells;
3. only a section that passes gets `count()`: a one-value palette answers "this state × 4096" directly, anything else walks the packed storage once and tallies how many cells each state has.

The sections visited are the **highest non-air section ∪ the sections already cached**: a section that was mined out now sits beyond the filled range, so only the union still clears it.

These three steps only run on a full rebuild — chunk load, rescan, the cache-clearing command. A player break or placement applies a single-block delta and reads no cells at all.

### Why counts can stand in for positions

`N` identical contributions add up to the same value scaled once (`AuraValue.scale(int)`): amounts add, ceilings add after each is resolved, regeneration adds, and the colour is weighted by amount (the same colour weighted is itself). So "this state appears N times" and "merge it in one at a time N times" agree field by field — this is exact, not an approximation.

Positions are needed in exactly two places, and both compute them **on demand** instead of storing them: the 3×3×3-section exact ring around a query, and the sections a formation's sphere cuts through.

### Complexity

An overworld chunk has 24 sections of 4096 cells, so a whole column is 98,304 cells.

| Work | Whole-column scan (the naive way) | Now |
| --- | --- | --- |
| Building one chunk's cache | 98,304 cell reads, whether or not the chunk has an emitter; one object allocated per matching block | 24 all-air tests plus ≤24 palette scans; only the sections that pass read 4096 cells (O(1) for a one-value section) |
| The block part of one query | read a stored position per block | one aggregate read per section; the exact ring computes ≤27 sections × (palette gate + one pass over the sections that pass) |
| Raising a formation of radius R | mark every covered chunk dirty and rescan the full column (≈8 million cells at R = 64) | once per 20 ticks: covered chunks × sections × 2 distance tests, plus one pass over the sections on the sphere's surface; raising it marks nothing dirty and loads nothing |
| Save data and memory | one row per emitting block (position + values + absorbent list) | one row per section that has an emitter (aura → value) |

**Availability** — how much of a section is left, thinned out by how many players can see it — is a **section** quantity: the stock share, the visitor count and the environmental concentration do not vary between blocks. So it is resolved once per section, and inside the exact ring each block only multiplies its own falloff. A distant section contributes straight from the attachment's stored aggregate, once per section, never cell by cell. The volume is 7×7×7 sections; anything beyond it contributes nothing.

Two edges are worth knowing:

- `count()` on a mixed section allocates a small tally table and walks the packed storage once; the O(1) shortcut exists only for a section whose palette holds a single value;
- wherever **positions** are needed (the exact ring, the sections a sphere cuts through) cells still have to be walked; the palette only removes the sections that contain nothing of interest.

::: warning The global palette only affects the gate, not `count()`
A section with more than 256 distinct states switches to the global palette, whose "maybe has" answers **yes** unconditionally, so such a section always passes the gate and can never be skipped. `count()` itself is unaffected: it picks between the O(1) shortcut and one pass over the packed storage purely by "does the palette hold a single value", regardless of the palette kind; reading each distinct state goes through the registry instead of a small palette array, which is still O(1). Such a section therefore costs exactly what any mixed section costs — one pass over 4096 cells plus a small tally table.
:::

## How large is the approximation error

The only approximation is collapsing emitters beyond 3×3×3 onto the section centre. The repository's error study (`research/15_子区块灵气缓存误差研究.md`) quantifies it for a **single block with contribution 1**:

![One-block actual aura value: mean, P95 and the cached value](/images/aura/aura_subchunk_value.png)

*The x axis is the player's distance from the section centre in blocks (log), the y axis is the aura value (log). The dashed line is the P95 of the true value, the dotted line is what the cache reads after collapsing to the centre.*

![Absolute error of the one-block cache: mean and P95](/images/aura/aura_subchunk_error.png)

*The absolute error of the same model. Summary: at 1 block from the centre the mean error is 1.310 and the P95 is 3.229; at 4 blocks 0.0513 / 0.0694; at 8 blocks 0.0182 / 0.0438; at 16 blocks 0.00205 / 0.00657. Keeping the P95 error within `0.01` would need a per-block range of 15 blocks, and within `0.001` about 28 blocks.*

Three things to keep in mind while reading them:

1. **They model a single block**, not a terrain full of them; a block's contribution scales linearly, so a contribution of `s` scales the thresholds too.
2. **The study uses a `1/r²` falloff while the runtime uses `1/max(1, d²)`**, so treat the figures as an order of magnitude rather than an acceptance test (the study says so itself).
3. **Near the source the worst case is far above the mean**: when the player stands next to the source block while the source got collapsed to a distant section centre, the error can exceed the P95. The code's exact region is 3×3×3 sections (about a 16 block radius), which sits right at the 15 blocks the study suggests.

## The order inside one tick

```mermaid
sequenceDiagram
    participant T as AuraChunkTicker
    participant B as AuraZoneEventBridge
    participant G as entity tick
    T->>T: every tick: build the pools of chunks loaded last tick
    T->>T: every tick: rescan due sections in bounded batches
    T->>T: every tick: update player coverage incrementally
    T->>T: every tick: regenerate due chunks within the count budget
    B->>B: advance the query cache epoch
    B->>G: send a snapshot every 5 ticks
    G->>G: entity gate: new entity / moved a block / window elapsed
    G->>T: only a real question resolves, and it is memoised for this tick
```

- **Chunk load**: the whole column's block cache is rebuilt once, and its pools are built on the next tick — zone resolution deliberately does not run inside the load callback, where the chunk is not fully ready.
- **Block changes**: break/place events apply a **single-block delta on the spot** at the lowest priority, re-evaluating only that block and never scanning a section; a cancelled event never touches the cache.
- **Rescan**: each section has a random target interval of `600..1199` ticks (about 30–60 seconds). Each tick processes due sections in order, up to `max(8, ceil(registered sections / 600))`. A backlog delays execution; the next random interval starts when the rescan actually runs, without replaying missed cycles. This picks up `/setblock`, `/fill`, pistons and TNT, which no event reports.
- **Force refresh**: the command synchronously rebuilds the whole column of every loaded chunk in range and restarts those chunks' random rescan deadlines from the current tick.
- **Regeneration**: **Server Config → Aura → Block Aura Period** sets the target interval, defaulting to 10 ticks. Each chunk has one recurring task whose first deadline uses a least-loaded phase. Each tick processes at most `max(1, ceil(registered chunks / period))` due chunks. Payment uses `amount + regenPerTick * actual elapsed ticks`; the first cycle counts only time since stock initialization, and unloaded time earns nothing. Full pools, empty pools with negative regeneration, and zero rates cause no writes; overflow remains finite.
- **Visitor counts**: each tick compares player section positions and updates coverage boundaries only on movement, joining or leaving. Stationary players cause no coverage writes. Moving one section along one axis updates 98 entries, clipped to the level height. Counts remain in the runtime attachments of loaded chunks; newly loaded chunks are populated from the recorded player positions.
- **Per-tick memoisation**: results, static zone, pools, biome and availability are memoised per "position + this tick", and the epoch is advanced by `AuraZoneEventBridge` at the **end** of a tick. Stock regeneration and player coverage changes explicitly invalidate position results so subsequent queries recompute. Other writes still depend on their own invalidation paths, and **a formation activated this tick is only visible next tick**.
- **The entity gate**: entity ticks no longer query unconditionally; only a new entity, a changed block position, a changed dimension or an elapsed window resolves. The window is **Server Config → Aura → Entity Aura Period** (10 ticks by default, 1–1200; set it to 1 to query every entity every tick). The price is that a stationary entity's zone enter/leave events can be delayed by that many ticks.

## Performance: where the 140 µs of one query goes

`research/17_灵气解析性能与记忆化.md` measured an uncached query in stages (test pack, 5 aura zones):

| Stage | Cost |
| --- | --- |
| `biome` (`getBiome` + id lookup, **57 calls per query**) | ≈ 23 µs |
| `static` (registry zone selection) | ≈ 6 µs |
| `pools` (environment stock) | ≈ 0.5 µs |
| `sources` (block source availability) | ≈ 7 µs |
| total | ≈ 140 µs |

The conclusion is counter-intuitive: **the bottleneck is `getBiome`, not the registry scan** — every one of the 7×7 block sources asks for its biome first. Memoisation took a repeated query from 155.6 µs to 5.8 µs (about 27×), and the few microseconds of registry selection are simply not a problem in a pack with a handful of zones — which is why **`aura_zone` has no index**; that only becomes worth doing at a hundred zones, as an "biome/dimension → candidate zones" table.

The memo tables are keyed by position, or by position plus definition, hold at most 16384 entries each and are replaced wholesale when they overflow (the worst case is a recompute); **a stale value is never returned**.

The outer layer is one table per world, keyed weakly by the world object itself: once a world closes, its memo is gone with it, and no module has to walk the tables on unload.

## What the client sees is a snapshot

The client does not run the same computation and does not sync the attachments: the server computes once per player every 5 ticks (**Server Config → Aura → Sync Period**) and sends a "source + actual + environment" payload, which `AuraClientState` keeps as a target snapshot and interpolates with a time constant of about 0.25 s (non-finite values are sanitised away).

Who uses it:

- **Fog**: `client_render` on the zone sets the fog colour and the far distance, with a strength of "environment concentration / the sum of the zone's aura values".
- **Resource bars and the HUD**: `client_hud` on the zone draws the concentration bar.
- **Formula contexts**: `mxt:actual_concentration` / `mxt:environment_concentration` read the snapshot on a client and a live query on the server — the same name, two different sources.
- **Particles** are sent by the server directly, not through the snapshot.

Note that "actual" includes the stock and the block contributions while the environment value (`getSensedAura`) recomputes the template alone; both are called concentration, so do not conflate them.

## Configuration and datapack surface

| Setting | Default | Effect |
| --- | --- | --- |
| **Server Config → Aura → Block Aura Period** | 10 | Target period in ticks for staggered stock regeneration; visitor counts update incrementally every tick and section caches have separate random rescan deadlines. |
| **Server Config → Aura → Entity Aura Period** | 10 | Window in ticks before a stationary entity re-resolves. |
| **Server Config → Aura → Sync Period** | 5 | Interval in ticks between snapshots sent to clients. |
| **Server Config → Aura → Timing Stats** | off | Prints query stage timings to the log every 10 seconds; diagnostics only. |
| **Server Config → Formations → Draw Environment** | off | Whether formations may spend the environment aura at their controller. |

A formation is **another consumer** of that stock: every 20 ticks it splits each sub-chunk with anyone cultivating in it, weighted by `upkeep_weight` on `mxt:aura`, and what it is granted pays its upkeep. The stock itself is stored per sub-chunk (16 blocks of height), so the aura underfoot and the aura 16 blocks up are two separate pools; the block cache carries no ownership information.

Four registries take part, and they do not play the same role:

| Registry | How it takes part in a position's aura |
| --- | --- |
| `aura_zone` | **The main one**: template, environment stock, ceiling, regeneration, fluctuation, noise, priority, client presentation. |
| `block_aura` | Block emitters: matching blocks contribute `amount/max/regen` per aura. |
| `mxt:aura` | Identity only: which resource it is measured in, which element it belongs to (which drives the client's environment colour and element conditions). |
| `item_aura` | **Does not take part**: it writes aura into the holder's own resource pool. |

The repository ships a single `block_aura` entry (the spirit stone block, `amount 50 / max 50 / regen 0.1`) and **no `aura_zone` file at all** — so out of the box every position resolves to the empty zone (`source = mxt:empty`, `SourceKind.CHUNK`) plus block emitters. Seeing environmental aura means writing your own `aura_zone`.

## Costs and limits

- **Unloaded chunks do not count**: a query window containing unloaded chunks simply skips them, so chunk borders, other dimensions and unloaded formations all read low. The search covers 7×7×7 sections and it **never generates terrain to answer**.
- **A per-tick staleness window**: stock changes inside one tick (a formation just activated, a block changed but not yet flushed) only reach a query on the next tick; the period settings above are the size of that window.
- **Splitting between visitors is bookkeeping**: a "visitor" is recorded for each player's 7×7×7 sections without checking whether they can actually see the section, and the table is rebuilt every 10 ticks. It guarantees that one patch of terrain aura is not taken in full by every player, but it is not a visibility test.
- **`SourceKind.CHUNK` is easy to misread**: it means "no biome, dimension or area template matched", not "came from the chunk stock".
- **Hot and slow spots**: `getBiome` is the single largest cost; the block cache is built per section, so all-air sections and sections whose palette holds nothing of interest read no cells at all, and only the sections that pass walk 4096 cells; the cache-clearing commands rebuild every loaded chunk in a radius synchronously and will hitch. The block-to-definition index is resident and rebuilt by the datapack hook when a pack or tag changes, so the `block_aura` tags are no longer re-resolved on every block event.
- **Diagnostics are incomplete**: the memo tables count hits and misses, but the pipeline's result table counts hits only — its miss rate cannot be read off the log.

## See also

- [aura](../datapack/json/aura.md) / [aura_zone](../datapack/json/aura_zone.md) / [block_aura](../datapack/json/block_aura.md) / [item_aura](../datapack/json/item_aura.md) — what every field means.
- [Define the Aura Environment](../tutorial/aura-environment.md) — putting the pieces together into a working pack.
- Scripted entry points: [MxtAura](../kubejs/api/aura.md); Java side: [Java API](../java/api.md) — `AuraService` and `AuraLookup`.
- [Foe Identification](./identification.md) and [Damage System](./damage.md) — the other two source-level walkthroughs.
