---
title: Formation Actions (formation_action_type)
description: Every built-in module of mxt:formation_action_type, with its fields, defaults and decision rules.
---

# Formation Actions (formation_action_type)

## `formation_action_type`

The `actions` array of a [formation](../../json/formation.md) holds these function modules. Each entry picks a module by writing its ID in `type` and carries only the fields it needs — structure, radius, costs and `spare_friends` stay at the top level of the formation. A datapack only picks an existing module and never adds one; an unknown `type` fails the load rather than degrading into doing nothing.

The same module may appear more than once, and the list is not merged: two attack modules with different parameters are two strikes. **The execution order is the list order**, and there is no second order.

### The four beats

Every module is offered four beats, and which of them it answers is its own choice (not answering one means not writing that method):

| Beat | The array itself | Per entity |
| --- | --- | --- |
| `activate` | once, after a successful activation and the index write | when an entity enters the radius (including everything already inside on the first period) |
| `tick` | once every upkeep period | once per covered entity, every upkeep period |
| `interval` | the same, but only on the beats this module's `interval_ticks` is due for | the same |
| `inactivate` | once, when the formation is dismantled | when an entity leaves the radius, or when the formation is dismantled |

`tick` and `interval` cover exactly the same ground and differ only in throttling: write `mxt:tick` to run on the upkeep period, and one of the modules that carries its own `interval_ticks` for any other rhythm. **Both sides have to be recognised by the module**: a module that only works on entities (`mxt:attack` / `mxt:buff` / `mxt:send_message`) does nothing on the array's own pass, and one that only works on the array (`mxt:particle`) does nothing on the per-entity pass.

**`interval_ticks` is a field shared by all four throttled modules** (`attack` / `buff` / `send_message` / `particle`); its unit is **ticks**, it must be a **multiple of 10** (any other value fails the whole definition), and it runs from `10` to `24000`. A formation takes a beat every **10 ticks**, while the upkeep bill, `mxt:tick` and the enter/exit check are counted in the **20-tick** upkeep period — a display being allowed to refresh faster than the array pays is exactly why this field exists. The phase comes from the **world clock** rather than a counter kept per module, so every entity inside one formation — and every formation running one definition — runs **on the same beat**; a larger interval never makes the people inside one formation receive a message in turn.

### The context

The array's own passes know nothing but **`Level`**, so their formulas only have `zero` and `random`. The per-entity passes are evaluated against that entity and additionally carry `formation_radius` / `distance` / `formation_x` / `formation_y` / `formation_z`, and can read the formation carrier (which `mxt:formation_owner` and `mxt:formation_ally` consume).

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:aura", "aura_zone": "example:fireland"},
    {"type": "mxt:particle", "shape": "mxt:five"}
  ]
}
```

### `mxt:empty`

An empty module that does nothing. It is also the default entry of this dispatch table, and writing it is the same as not writing it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields, and no beat answered. |

```json
{"type": "mxt:empty"}
```

### `mxt:attack`

Attacks entities inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `0` | Damage applied to every affected entity each period |
| `damage_type` | Damage type ID | none | The damage type used for the hit; without it the vanilla "the owner hit it" reading applies |
| `attribute_to_owner` | Boolean | `true` | Credits the **first owner** (the head of the list, the one who raised the formation) as the attacker |
| `effects` | Array | `[]` | Status effects applied each period; the fields are exactly those of `mxt:apply_effect`: `effect` / `duration_ticks` / `amplifier` |
| `target_condition` | `EntityCondition` | always true | An extra filter on the **target entity** (undead only, players only, …), evaluated after the friend-or-foe decision |
| `interval_ticks` | Integer, a multiple of 10, `10..24000` | `20` | How often to strike, in ticks (`20` = one upkeep period) |

```json
{"type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt"}
```

This module only says **what** to hit, not **who** to hit: it hits every entity the formation covers, and whether the owner and friends are spared is up to the top-level `spare_friends` — leave it out and the owner is hit along with everyone else. When it cannot tell friend from foe, a formation that declares `spare_friends` holds fire (the reason is under "Friend or foe" on the [formation](../../json/formation.md) page).

`attribute_to_owner` decides kill credit, mob aggro and every condition that reads the attacker; set it to `false` for an unowned, "environmental" hit.

Every hit goes through the shared damage pipeline: the owner (when `attribute_to_owner` is true) takes part as the attacker in the **first** layer of element overcoming, and the entity hit gets the **second** layer of reduction from its own element adaptation — the owner having a fire spirit root and the target a water one makes the hit harder, while a target adapted to fire takes less. Those multipliers are written in the `mxt:element` definitions, not here.

When the damage resolves to a non-finite value or one ≤ 0 the hit is not struck, but `effects` are applied as usual — the default `damage: 0` is a formation that only applies status effects and deals no damage.

### `mxt:buff`

Grants abilities to entities inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | List of ability IDs or `#tags` | `[]` | Abilities granted to matching entities |
| `target` | Enum | `all` | Which entities the module applies to: `all`, `allies` or `owner` |
| `interval_ticks` | Integer, a multiple of 10, `10..24000` | `20` | How often to re-grant, in ticks |

```json
{"type": "mxt:buff", "abilities": ["example:blessing"], "target": "allies"}
```

A granted ability is revoked automatically when the entity leaves the radius, when the formation is dismantled, or when it is no longer selected; the `source` is automatically `mxt:formation/<namespace>/<path>`.

The three `target` settings are one rule at three widths: `all` filters nothing; `allies` requires the friend check to answer `true` — the check asks **every** owner on the list, any one of them recognising you is enough, and **an owner counts as a friend of themselves**, so `allies` includes the whole list; when it cannot identify, it gives nothing. `owner` only reads the UUID list and is a narrower way of writing the same thing.

Attribute bonuses do not look for a field here: passive attributes are the `modifiers` field of the `mxt:modifier` ability itself, so granting an `mxt:modifier` ability is the same as granting its attribute modifiers; there is no second entry point, or the same thing would have two sets of rules — including the easiest part to get wrong, "a modifier outliving the formation that granted it".

Overriding the aura of the formation's ground is not here either; that is the separate `mxt:aura`.

`interval_ticks` only makes the **re-granting** sparser and does not affect **revoking**: granting is idempotent, so an ability already handed out stays in force through the beats that are skipped. Leaving the radius and dismantling the formation are the two revoke paths that **ignore this field** and take effect at once; only "standing still while an owner stops treating you as a friend" waits for the next due beat, because that one is decided in passing during the re-granting pass.

### `mxt:aura`

Replaces the aura resolved at the formation's own position and raises its ceiling. It **answers no beat** — it is a declaration, and the aura query reads it directly.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura_zone` | Aura zone ID | **required** | A high-priority runtime aura override that replaces the aura resolved at the formation's position |
| `max_bonus` | Map from aura ID to `NumberProvider` | `{}` | Extra capacity per aura, for the zone the override selected |
| `upkeep_weight` | `NumberProvider` | `1` | This formation's weight when it shares a chunk's aura with cultivators |

```json
{"type": "mxt:aura", "aura_zone": "example:fireland", "max_bonus": {"mxt:common": 50}, "upkeep_weight": 3}
```

`aura_zone` outranks the biome / dimension / artificial regions, and the override is only in force while the formation is registered; for the full rules see "Aura overrides" on the [formation](../../json/formation.md) page.

`max_bonus` is only applied together with the override: with no override there is nowhere to add it, and an aura the zone does not provide cannot be raised either (it does not conjure aura out of nothing). When several bonuses land on the same aura, the highest wins.

`upkeep_weight` applies when a formation **competes with players for the same chunk aura**: it asks for the block emitters inside its radius, chunk by chunk, and splits each of those chunks with whoever is cultivating there under that zone's `distribution`; this is its weight in that split. What it is granted pays the maintenance bill, and only the rest is covered by the formation's store and then its owner. Under `realm_weighted` it is compared against the players' weights directly. With several `mxt:aura` modules the largest weight wins.

That is why `aura_zone` is **required**: a module writing only `max_bonus` would never have anything to apply to, so it is refused as a mistake.

### `mxt:protection`

Denies each listed kind of interference inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_break` | Boolean | `true` | Deny block breaking |
| `block_place` | Boolean | `true` | Deny block placing |
| `block_interact` | Boolean | `true` | Deny right-clicking blocks (chests, doors, crafting tables, …), and "using an item on a block" as well |
| `explosions` | Boolean | `true` | Deny explosions from changing the terrain; only blocks are removed, entities still take damage |
| `mob_griefing` | Boolean | `true` | Deny mob destruction (an enderman carrying a block, and the like) |
| `entity_interact` | Boolean | `true` | Deny right-clicking entities (villagers, horses, armour stands, …) |
| `attack_entity` | Boolean | `true` | Deny **melee** attacks on entities |
| `item_use` | Boolean | `true` | Deny item use (buckets, potions and drawing a bow on nothing or on yourself, …) |
| `spare_friends` | Boolean | `true` | Exempt the owner's friends |
| `delegate_to_claims` | Boolean | `false` | Hand protection over to a claim plugin (FTB Chunks, say): while a claim protection is in force, the nine switches above are only a declaration and are no longer enforced |

```json
{"type": "mxt:protection", "spare_friends": true}
```

All nine switches default to `true`: declaring this module is that whole sentence, and you write `false` explicitly for the one thing you want to open up. Three of them cost more than the rest and are worth turning off when you do not need them: `block_interact` covers every block with a screen, and `explosions` and `mob_griefing` sweep the registered formations on high-frequency paths (per-block explosion resolution, every mob destruction).

#### The decision: both ends of the action count

There is only one question: **if the actor, or the block / entity being acted on, is inside the radius, the switch applies.**

- Standing **outside** and clicking a chest **inside** → denied (the chest is in the formation).
- Standing **inside** and clicking a chest **outside** → denied (the player is in the formation).
- `item_use` has no target, so only the actor is looked at.
- Explosions and mob griefing have no actor and only look at the position, so **an owner's own explosion is denied too** — write `"explosions": false` if you want a way through.

#### Exemptions and other rules

- **The owner is always exempt**, and no configuration changes that — locking yourself out of your own house is a bug, not a rule.
- **The friend exemption** needs `spare_friends` to be true **and** the server setting "Formations → Friend or Foe" to be on.
- **When it cannot identify, it protects as usual**: a formation that declares `spare_friends` holds fire when it cannot identify an entity, while a protecting formation keeps blocking. A wrong guess should point at the safe side.
- Only **registered formations** are in force, and dismantling ends that at once; an ownerless formation exempts nobody (otherwise an abandoned formation would lock a piece of land forever).
- The base ships no land protection of its own: when you need claims, an external claim mod provides them, and this layer steps aside through `delegate_to_claims` below.

#### Handing it to a claim plugin (`delegate_to_claims`)

When it is true **and a claim protection really is in force**, **not one of the nine switches above is enforced**: what actually stops people is the claim plugin's own rules. With FTB Chunks, for instance, it already protects its claims on its own, so "handing it over" needs no API call — the formation merely stops adding its own layer.

The "is a claim protection in force" test looks at FTB Chunks: **it is installed, and its global `disable_protection` has not been turned off**. It **cannot see team-level** settings — when a team sets all four privacy modes of its claim to public, this still counts as "protected" (recomputing that layer would mean copying the claim plugin's decision a second time, which is exactly what handing it over is meant to avoid).

The server setting "Compat → Delegation Needs Claim Protection" (**on by default**) decides what happens when there is no claim protection:

| Setting | Behaviour |
| --- | --- |
| On (default) | It only hands over when there really is claim protection; otherwise it **falls back to the nine switches above** and logs a warning at activation, from the definition. |
| Off | Read literally: it always hands over, and with no claim protection **nothing is protected at all**. |

Either way the two costs are the setter's:

- After handing over, the formation only protects **claimed** places, and **its own `radius` no longer takes part in the protection decision**;
- in the **fallback branch** the formation protects what is **inside its own radius**, independently of the claim plugin's decision.

#### The relationship with claim plugins: three modes (server setting)

That switch is a **content pack's** declaration for one formation; a separate server setting (on the "Compat" tab) decides how **all** protecting formations get along with a claim plugin — "Compat → Claim Integration":

| Value | Behaviour |
| --- | --- |
| No integration (default) | **No integration**: a formation applies its own switches anywhere, and when both are present it is an "and" — either one refusing counts as a refusal. |
| Claim only | **A protecting formation may only be raised inside a claim**: the chunk the controller sits in has to be claimed already (by any team), or activation fails with a message (`item.mxt.formation_plate.failed.not_claimed`). It only applies to formations **with a protection module**. |
| Claim first | **A formation can be raised anywhere, but inside a claim it switches to that claim's rules**: once the chunk the controller sits in is claimed, the nine switches of this formation are handed over entirely and the claim plugin decides; **outside a claim it still uses its own switches**. |

Three boundaries:

- "Inside a claim" is decided by **the chunk the controller sits in**, not by every affected position — a formation straddling a claim border is either wholly under the claim or wholly outside it.
- "Claim only" does not require **your own** claim: being able to stand there means the landowner allows it (otherwise he would have stopped you long ago), and this option is about "do not raise a warding formation on land that has no owner".
- **With no claim plugin on the server neither mode does anything, rather than stopping formations from being raised**: there is no claim to require and no claim rule to hand over to. That case logs one warning for "Claim only" (once per session), because "the option did nothing" and "the option worked but nobody came" look exactly the same in game.

#### Protecting formations cannot be raised on someone else's claim

Server setting "Compat → Raising Needs Permission" (**on by default**, independent of the enum above):

**When the controller falls inside a chunk claimed by someone else, only three kinds of player may raise a protecting formation.**

1. **Someone with edit permission** — the claim plugin itself is asked "would you let him place this block", rather than rewriting the privacy mode rules here: whether a public claim, a team rank, an ally or a permitted fake player counts is its rule, and a second copy would only be a copy that drifts.
2. **A friend of the landowner** — the same friend system the protecting formation uses (so with FTB Teams installed, **teammates and allies already count as friends** and pass on their own).
3. **Unclaimed land** — a place nobody has claimed has "no landowner", and anyone may raise a formation there.

Everything else is refused, including an **actor that cannot be resolved** (the console, a command source): nobody can agree on the landowner's behalf.

A protecting formation is a claim of jurisdiction, not just a building: being allowed to place blocks on someone's land is not the same as being allowed to raise a law there, and when the structure is already standing (the template matches natural terrain, or something somebody else built), block protection alone cannot stop anyone.

> With no claim plugin this rule is **inert** in the same way (there is no one else's claim to judge), so it changes nothing on a pure Mxt server. The message on refusal is `item.mxt.formation_plate.failed.foreign_claim`, which says more than "the structure does not match" would.

> Also on record elsewhere: FTB Chunks **does not block item use by default** (only `ftbchunks:right_click_blacklist` can) and **does not block attacking entities** either. So once `item_use` and `attack_entity` are handed over, nobody is minding them.

#### Known gaps

**Projectiles.** `attack_entity` blocks melee swings (the event the game fires on the **attacker's** side), so an arrow shot from inside the formation does not count as "the attacker is attacking right now" when it lands, and is not blocked.

### `mxt:particle`

Draws a formation's figure with particles: the figure is one [`formation_shape`](../../json/formation_shape.md) definition, and both the outer ring and the star inside it are strokes of it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `shape` | Figure id | **required** | Which figure to draw, naming a [`formation_shape`](../../json/formation_shape.md). The mod ships `mxt:five` (ring plus pentagram), `mxt:six` (ring plus two triangles) and `mxt:eight` (ring plus two squares). |
| `duration_ticks` | Integer `0..24000` | `0` | How many ticks the figure takes to draw itself from the moment the array was raised; `0` skips the animation and the first order already carries the whole figure |
| `interval_ticks` | Integer, a multiple of 10, `10..24000` | `10` | How often a keep-alive is sent, in ticks (the default is every beat). It only decides how often the server confirms "still drawing" and re-aligns the progress, **not how smooth the picture is** |
| `display_distance` | Double `1..4096` | unset follows the view distance | How far past the array's own radius the figure is still sent, in blocks. A smaller value narrows what is drawn; a larger one changes nothing, because the client has no chunks out there anyway |

```json
{"type": "mxt:particle", "shape": "mxt:five"}
```

**The figure's coordinates, where its strokes start, their colour, their density and their window are all on the figure's own page**: coordinates are in units of the array's radius, direction 0 is due east, and every stroke is cut at its own length and its own `start` / `end` window. Colour, `spacing` and `size` are written on the stroke, and this module knows about none of them. What it decides is how that figure is drawn:

`duration_ticks` makes the figure grow out of the controller: progress is "ticks since the array was raised divided by `duration_ticks`" and stops changing at 1. **The clock that draws it belongs to the client**: each beat the server sends one "still drawing" order carrying the progress so far and the time left, and the client lays out the part that already exists at once and grows the rest on its own timer. The figure therefore moves at the client's frame rate and no value of `interval_ticks` makes it stutter; walking up late, logging in mid-draw-in, or picking the orders back up after a local hitch all show the **correct progress** rather than a replay. `0` means no animation. Raising the array again restarts the timing; a formation read back from an older save counts as already drawn.

- It is only sent to **players who can see it**: within the radius **+ the server's view distance** (`view-distance` × 16, 32 blocks minimum). Vanilla's broadcast call is pinned at 32 blocks, so this sends per player instead — otherwise a formation with a radius above 32 would have a ring of its outline cut off. **One packet per player per beat**: the packet carries only the figure's id and the client reads its own copy of the definition, so a dense figure costs nothing extra on this wire. The module can also tighten that margin itself with `display_distance`, which suits a formation that only has to be legible from up close.
- The client **adds only the piece that has just grown** on each of its ticks and re-lays the whole figure every 10 ticks (dust lives longer than that, so the older part never goes out first): a `duration_ticks` draw-in lays out about one figure's worth of points in total, so being smooth costs nothing extra.
- Once the keep-alives stop, so does the drawing: that covers an array being taken down and a player walking out of range. The window is twice `interval_ticks` (at least 30 and at most 200 client ticks), and the dust already placed fades on its own — taking an array down is "stop drawing, then fade", not a snap.
- It draws `minecraft:dust`, which is **not culled by the 32-block distance check or by the particle setting**, so the far half of a large ring is drawn too.
- It is drawn **0.1 blocks above the bottom of the controller block**, flat on the ground. How dense the line is and how big its dusts are is up to each stroke's own `spacing` and `size`; scale those up together for a large radius.
- It only acts on the formation itself: it affects no entity, does not make the formation hostile, and takes no part in the friend-or-foe decision; a formation that does not write this module costs nothing at all.
- It runs before the per-entity passes, so **cancelling that beat of `TickEffects` stops the range from being drawn along with it**.
- Several may be written to layer different colours.

### `mxt:send_message`

Sends a message to the players a formation covers.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | Text | **required** | A string is read as a translation key, an object as a full text component |
| `channel` | Enum | `chat` | `chat` puts it in the chat log, `action_bar` above the hotbar |
| `recipients` | `EntityCondition` | always true | Asked **per covered entity**; when it does not hold, that entity is not told |
| `interval_ticks` | Integer, a multiple of 10, `10..24000` | `20` | How often to send, in ticks |

```json
{"type": "mxt:send_message", "message": "example.array.warning", "channel": "action_bar"}
```

It runs on the upkeep period (20 ticks) and **runs once per covered entity**, so each person gets their own message rather than the whole area getting one broadcast. It is not addressed to the owner: whoever stands inside the radius receives it, the owner included.

`recipients` is evaluated per person, so only some of them can be warned (only the owner's enemies, only friends, only one kind of creature). Non-player entities receive nothing, and asking the condition about them means nothing.

It only affects the recipients: it takes no part in the friend-or-foe decision and does not change whether the formation is hostile.

### `mxt:activate`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_action` | Block action | `mxt:no_op` | Run once on the array itself after a successful activation, with a **Level** context |
| `entity_action` | Entity action | `mxt:no_op` | Run once on an entity when it enters the radius |

```json
{"type": "mxt:activate", "entity_action": {"type": "mxt:apply_effect", "effect": "minecraft:glowing", "duration_ticks": 200}}
```

`entity_action` also runs for the entities that were **already inside when the formation was raised** (there is no "who was inside last period" record yet), so it has to be idempotent: unloading and loading a chunk, or restarting the server, makes it run again.

Writing only one of the two fields is fine, and writing neither is the same as `mxt:empty`.

### `mxt:tick`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_action` | Block action | `mxt:no_op` | Run once on the array itself every period, with a **Level** context |
| `entity_action` | Entity action | `mxt:no_op` | Run once per **every** covered entity inside the radius each period |

```json
{"type": "mxt:tick", "block_action": {"type": "mxt:no_op"}}
```

This is the **upkeep period** setting (20 ticks) and does not throttle itself; for any other rhythm use one of the four modules that carry their own `interval_ticks`: `mxt:attack` / `mxt:buff` / `mxt:send_message` / `mxt:particle`.

### `mxt:inactivate`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_action` | Block action | `mxt:no_op` | Run once on the array itself when it is dismantled, with a **Level** context |
| `entity_action` | Entity action | `mxt:no_op` | Run once on an entity when it leaves the radius, or when the formation is dismantled |

```json
{"type": "mxt:inactivate", "block_action": {"type": "mxt:no_op"}}
```

When a formation is dismantled, **every entity it was tracking runs first** (its `entity_action` and the release of what it was granted), and only then does `block_action` run — a block action cannot see entities, so that is the only order available.
