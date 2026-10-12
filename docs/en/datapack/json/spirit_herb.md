---
title: Spirit Herb (spirit_herb)
description: Marks existing blocks as spirit herbs with medicinal power, thermal bias and age, plus their fruit and growth clock.
aside: false
---

# Spirit Herb (spirit_herb) {#spirit_herb}

`spirit_herb` marks some **existing blocks** as spirit herbs, gives them medicinal power and a thermal bias, names their **fruit**, and gives them a growth clock. It registers no block and no item: both the herb and its fruit come from a content pack or another mod. **The definition has no `quality` field**: it carries no item identity, so the stack holds no component naming a definition and there is nothing on it to ask; this herb's tier defaults to the [default_quality](./default_quality.md) registry under the fruit's item id or a `#`-prefixed tag, and a pack that wants the tier to follow age writes `quality_by_age`, which the harvest stamps into the component (see [Age and Quality](#age-and-quality)).

## File Location

Spirit herb files go in `data/<namespace>/mxt/spirit_herb/` within your data pack.

The filename is its ID. For example, `data/example/mxt/spirit_herb/fire_ginseng.json` has the ID `example:fire_ginseng`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `blocks` | Array of block IDs or `#block tags` | **required**, non-empty | The blocks this herb grows as. It registers no new block. |
| `priority` | `Integer` | `0` | Order between definitions matching one block. |
| `default_age` | `Integer` | `0` | The age used when the fruit stack carries no `mxt:herb_age` component. Non-negative. |
| `quality_by_age` | `Object[]` | `[]` | The age-to-tier ladder, see [Age and Quality](#age-and-quality). |
| `element_tags` | Array of element IDs or `#tags` | `[]` | Elemental affinity, **not** a medicinal property. |
| `material_tags` | `Identifier[]` | `[]` | Material classification. |
| `main_effects` | Map of medicinal property ID to `NumberProvider` | `{}` | The power each item provides in the main role. |
| `auxiliary_effects` | same as above | `{}` | The power each item provides in the auxiliary role. |
| `catalyst_power` | `NumberProvider` | `0` | The harmonising power each item provides as the catalyst. Non-negative. |
| `thermal_bias` | `Double` | `0` | Thermal bias; finite and in `[-1,1]`. |
| `growth` | `Object` | none | Growth and fruit, see the table below. Omitting it means this block keeps no age and bears no fruit, though it still counts as this herb's block. |

### `growth`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `mature_age` | `Integer` | **required** | A positive integer. Once reached the plant can be harvested, and it may also keep growing. |
| `max_age` | `Integer` | **required** | A positive integer at least `mature_age`. Once reached it stops growing. |
| `growth_rate` | `NumberProvider` | **required** | Age added per `20` ticks the plant is actually loaded. Non-negative. |
| `condition` | `BlockCondition` | `mxt:always` | Light, biome, neighbours, `aura_range` and so on. |
| `costs` | `Cost[]` | `[]` | Accepts only `mxt:aura` entries, paid from the aura pool of the place the plant stands in. |
| `drops` | Array of item IDs or `#item tags` | **required**, non-empty | This herb's **fruit**: on a break, only drops matching it are stamped with the age. |
| `wild_age` | `NumberProvider` | `0` | The starting age rolled for a naturally generated plant the first time it is read. |

`blocks` accepts a single block ID, a single `#namespace:tag`, or an array mixing both. The larger `priority` goes first; ties fall back to registry order — but **one block claimed by two definitions of equal priority, or one fruit claimed by two, is a load error**: the block decides which herb grows in a spot and the fruit decides which plant an item came from, and neither can be settled by registry order.

`element_tags` and `material_tags` are properties of the herb, not of the fruit, so a content pack can write "any fire spirit herb" without knowing which items get bound to that herb later. They are matched by `mxt:herb_tag`'s `element` and `material` respectively.

A negative `thermal_bias` is cold and a positive one is hot, and neither is the same thing as a fire or water element.

`blocks` and `growth.drops` are two separate lists: what it grows as and what it bears need not be related at all. **The fruit is decided by `drops`** — that is the route by which a fruit is traced back to the plant it came from. **A herb that writes no `growth` bears no fruit**, so it falls back to being recognised by the item form of the blocks it claims; without that, the power fields of a furnace-only herb could never be triggered by any item. A herb that does write `growth` never matches by its block, so one stack never belongs to two definitions.

## Age

Age is extra metadata about the herb's fruit, stored in the item component **`mxt:herb_age`** as a non-negative integer. There is one reading order: the component when the stack carries one, otherwise the definition's `default_age`.

A stack never ages on its own — inventories, containers and dropped items all leave it alone. Stacks of different ages form separate stacks by the vanilla component rules: they never merge, never average and never refresh each other.

Age is a **formula input**, not a second multiplier: while `main_effects` / `auxiliary_effects` / `catalyst_power` are evaluated, the current age is readable as the local variable `herb_age`, so a pack that wants a century-old herb to be worth more writes the bonus into the expression, for example `"3 * (1 + herb_age / 100)"`. Formulas evaluated in the ground read the same variable, holding **the age the plant stands at right now** (see [Growth](#growth-and-planting)).

## Age and Quality {#age-and-quality}

`quality_by_age` is an age-to-tier ladder, used to make older herbs worth more. Breaking a mature plant looks the ladder up with the age rounded down, and writes the matching tier into the `mxt:quality` component, so that stack's tier comes from layer 1 and the three-layer [quality](./quality.md#resolution) resolution is unchanged. Below the lowest rung, or with no ladder, nothing is written and the stack still falls back to `default_quality`.

The ladder is only evaluated **at the moment of harvest**: a stack handed out by `/give`, carrying only the definition's `default_age`, was never grown in the ground and is never given a tier. The ladder must ascend by `min_age` with no repeats; out-of-order or repeated rungs are reported at load time.

```json
"quality_by_age": [
  { "min_age": 100, "quality": "example:spirit" },
  { "min_age": 500, "quality": "example:immortal" }
]
```

## Growth {#growth-and-planting}

Everything in this section is behaviour **every block claimed by `blocks` gets**, regardless of how that block is written: it needs to implement no interface and write no Java.

### How age is recorded

Age is not stored on the block but in the **chunk attachment** `mxt:herb_chunk`: one row is `position → {age, gameTime}`.

- **The age** is how old the plant has actually grown. It is **stored state**, not something re-derived on each read, so reading it any number of times answers the same thing — Jade reads it every frame.
- **The gameTime** is the moment everything has been settled up to, meaning "how long the world has been alive". It travels with the save and **only advances while loaded**: chunk unload, server shutdown, `/tick freeze` and single-player pause all leave it alone — which is exactly the semantics "only grows while loaded" asks for, so being offline needs no catch-up logic at all. Reading it, `current gameTime − that number` is the span the plant still owes, and settling a span advances the number by exactly that span, so time is never charged twice and never lost.
- **A negative number** means "naturally generated and never touched": the rolled age is parked in the age field and the negative number is only the "not settled yet" marker, which the first read turns into a real row.
- The attachment is **server-side only** (never synced to the client); appearance goes through the block's own blockstate or renderer.

### Placing is planting

A claimed block **opens a row the moment it lands**, at age `0` and dated to that moment. There is no sowing interaction, no seedling and no vanilla growth simulation — planting means nothing more than "this spot now holds a herb, and its age counts from here", and it makes no difference whether a player, a dispenser or another mod put it there.

Placing twice in one spot never grows a second plant: one row is one position. When the block is replaced by something this herb no longer claims, that row is dropped on the next settlement.

### Settlement every 20 ticks

Once every `20` ticks the chunk is **actually loaded**, each row is walked: the definition still exists, `max_age` is not reached, `condition` holds, the growth amount is valid, and then `costs` is paid as one group. A failed payment pauses it — no partial bill is charged and the plant never dies.

That growth amount is **`growth_rate` evaluated and then multiplied once by `max(0, 1 + spirit_plant_bonus)`**; the pipeline applies it once, so never multiply it again inside the formula. The `herb_age` read while evaluating is the age **before** this settlement. Age caps at `max_age`, and once it is there **even `costs` stops being charged**.

A settlement that fails (condition unmet, not enough aura, `growth_rate ≤ 0`) **only advances the clock and leaves the age alone**: growth resumes the instant the condition returns, and nothing is banked up to be paid out in one go.

### Naturally generated plants

A plant placed by world generation (or `/setblock`, a structure, another mod) **starts with no row at all**, so it has no "moment it was placed". **The first time anyone reads its age** (looking at it with Jade installed, or any `ageAt` call) its starting point is decided like this:

```
starting age = min(max_age, roll(wild_age) + growth from gameTime 0 until now)
```

The baseline is **gameTime 0 (the moment the world was created)** — "this wild patch has been growing since the world began" — so naturally generated herbs in an old save are old. That catch-up **walks period by period** (each period `20` ticks, each one evaluating `growth_rate` at the age of that moment, through the same formula the live settlement uses, so writings like `"2 + herb_age"` keep their meaning), and it is **capped at one year**, taken from `ticks_per_year` in the lifespan config (default `24000`, see the server config's "Lifespan" page); tens of millions of ticks on an old server will not make one read run tens of millions of evaluations.

`wild_age` is only used when the herb was never placed: there is no baseline age to read while evaluating it, so write a constant or an expression carrying a random number (such as `{"type":"mxt:uniform","min":1,"max":3}`).

The result of that catch-up is **written into the chunk record**, and the herb is an ordinary plant from then on: it follows the [`Settlement every 20 ticks`](#settlement-every-20-ticks) path, with the same condition, `growth_rate` and `costs`, **aura included**. `wild_age` only decides the starting point at the moment of that first read. A wild plant nobody has read is never written down and never charged aura, exactly as it was when generated.

> Because this happens **on a read**, merely looking at a wild herb starts it growing by the rules above and charging aura. A chunk nobody looks at is not written to at all.

### Harvesting

**Breaking the block** is where the framework hooks `BlockDropsEvent` and writes this plant's current age **onto every drop matching `growth.drops`** (the age component being the current age rounded down, plus the tier from `quality_by_age`). A drop that does not match `drops` is left completely untouched, so anything else a block happens to drop is never mislabelled. The plant's record is cleared at the same time: the herb is gone, and that clock has nothing left to describe.

**There is no right-click interaction at all**: maturity does not change what drops (that is the block's own loot table), the framework only stamps the age onto the fruit. To vary output by maturity, write the block's own loot table, or narrow `drops` to the item that only falls when mature.

**When the definition cannot be found** (a pack dropped the herb): the record is **kept** rather than killed off — on the next settlement no herb claims that row's block any more, so the row is discarded.

## Example

```json
{
  "blocks": ["example:spirit_soil", "#example:herb_blocks"],
  "default_age": 100,
  "element_tags": ["example:fire"],
  "material_tags": ["example:herb"],
  "main_effects": { "example:nourish": "3 * (1 + herb_age / 100)" },
  "thermal_bias": 1,
  "growth": {
    "mature_age": 100,
    "max_age": 200,
    "growth_rate": 25,
    "costs": [{ "type": "mxt:aura", "aura": "example:spirit_power", "amount": 1 }],
    "drops": "minecraft:red_mushroom",
    "wild_age": { "type": "mxt:uniform", "min": 1, "max": 3 }
  }
}
```

## Relationship to Other Systems

- Alchemy: the herb's **fruit** is a material for [alchemy recipes](./alchemy_recipe.md); `main_effects` / `auxiliary_effects` / `catalyst_power` are the power the main, auxiliary and catalyst slots read, and the properties themselves are defined by [medicinal_property](./medicinal_property.md).
- Matching: `mxt:herb_tag` is an entry type of the item matcher, recognising "is this stack that kind of herb's produce" by `element` or `material`, so it can be written anywhere an `ItemMatcher` is accepted. At least one of the two fields must be given, and every field given must hold on the herb.
- Quality: a spirit herb definition **declares no `quality` field** — it carries no item identity, so there is no definition-identity component on the stack to ask, and this herb's tier defaults to [default_quality](./default_quality.md) by the fruit's item id or `#`-prefixed tag; a herb that writes `quality_by_age` has its tier stamped into layer 1 at harvest, see [Age and Quality](#age-and-quality) and [Which Tier](./quality.md#resolution).
- Jade: with Jade installed, looking at a herb shows its name, age and whether it is mature.
