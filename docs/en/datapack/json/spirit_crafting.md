---
title: Spirit Crafting Recipes (spirit_crafting)
description: "Spirit crafting recipes come in two types, mxt:spirit_shaped and mxt:spirit_shapeless, which spend aura on top of their materials and only run in the Spirit Crafting Table."
aside: false
---

# Spirit Crafting Recipes (spirit_crafting)

The Spirit Crafting Table (block `mxt:spirit_crafting_table`) reuses the vanilla crafting table layout but does exactly one thing: **spirit crafting**, in the two recipe types `mxt:spirit_shaped` and `mxt:spirit_shapeless`. On top of the usual materials, every recipe also declares an aura cost, paid out of the table's own store.

## File Location

Spirit crafting recipes are ordinary recipe files, so they go in `data/<namespace>/recipe/` within your data pack. The filename corresponds to its ID: `data/example/recipe/spirit_iron_ingot.json` has the ID `example:spirit_iron_ingot`.

**Purpose**: vanilla recipe types (`mxt:spirit_shaped`, `mxt:spirit_shapeless`) registered by the mod, not a datapack registry.

The type is written in the file itself: `"type": "mxt:spirit_shaped"` or `"type": "mxt:spirit_shapeless"`.

::: warning Spirit crafting and alchemy are separate tracks
The table only accepts the two types above. `mxt:alchemy` recipes never run here, and whatever is in the table never enters the alchemy flow — nothing converts between the two.
:::

## Recipe Types

`type` is one of the two values below.

### `mxt:spirit_shaped` (Shaped)

Matched against the shape of `pattern`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | String | **required** | Must be `mxt:spirit_shaped`. |
| `pattern` | String[] | **required** | One to three rows, each one to three characters. |
| `key` | Character-to-ingredient map | **required** | Maps every symbol used in `pattern` to its ingredient. Each key must be a single non-space character. |
| `result` | `ItemStackTemplate` | **required** | The item produced, written in the vanilla item stack template shape. |
| `aura` | `Cost` array limited to `mxt:aura` entries | **required** | The aura cost of one craft, paid out of the table's own store, in whole units rounded up. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |

```json
{
  "type": "mxt:spirit_shaped",
  "pattern": [
    "FF",
    "FF"
  ],
  "key": {
    "F": "minecraft:fire_charge"
  },
  "result": {
    "id": "minecraft:magma_block"
  },
  "aura": [
    {"type": "mxt:aura", "aura": "mxt:common", "amount": 20}
  ]
}
```

`pattern` is tried at every possible offset in the 3×3 grid, and any slot the pattern does not cover has to be empty.

### `mxt:spirit_shapeless` (Shapeless)

The ingredients have to match the non-empty slots of the grid exactly, in any order, so the grid may not hold unrelated items.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | String | **required** | Must be `mxt:spirit_shapeless`. |
| `ingredients` | Ingredient array | **required** | One to nine ingredients, matched in any order. |
| `result` | `ItemStackTemplate` | **required** | The item produced, written in the vanilla item stack template shape. |
| `aura` | `Cost` array limited to `mxt:aura` entries | **required** | The aura cost of one craft, paid out of the table's own store, in whole units rounded up. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |

```json
{
  "type": "mxt:spirit_shapeless",
  "ingredients": [
    "minecraft:blaze_powder",
    "minecraft:prismarine_shard"
  ],
  "result": {
    "id": "minecraft:sea_lantern"
  },
  "aura": [
    {"type": "mxt:aura", "aura": "mxt:common", "amount": 8}
  ]
}
```

## The `aura` Field

`aura` is a `Cost` array that **takes only `mxt:aura` entries** — any other type is a load error, and so is an empty array. An entry's `aura` is an **aura identity**, not a stored number: what is spent is that aura itself, identified by its definition; the definition's own `resource` field says which value it is counted in, see [`mxt:aura`](./aura.md). The table's own store pays here, so the charge is that aura, not the value it is measured in.

The whole array has to be paid in one go: if a single aura is missing, nothing is crafted — there is no partial deduction. Whether it can be paid depends only on the table's own store, never on how much anyone else carries.

`amount` is a number provider, evaluated when the recipe matches and rounded up. If the value is not finite, is negative, or falls outside the integer range, that craft does not happen and the store is not corrupted. The same aura can also be written as an "aura id to number" map, where each entry is read as an `mxt:aura` entry.

The table keeps aura for the recipe it currently matches, and nothing else: **changing the grid, or matching a different recipe, discards whatever was stored**, and a grid that matches nothing clears it too. The table takes at most `99 ×` the amount one craft needs per aura, and anything sent beyond that is handed back unchanged. This store is **not saved to disk** — reloading the table restores the grid and the result slot only.

## Check Order

Shaped recipes are checked before shapeless ones, so a shapeless recipe is only used when no shaped recipe matches.

The matched recipe's craft conditions are checked once per tick: enough aura, and the result slot empty or holding the same result with room for more. When they hold, one craft happens that tick. When they do not, nothing happens — the inputs and the stored aura stay where they are — and it simply waits for the next tick. On a successful craft every non-empty input slot loses `1` item, the aura comes out of the table's own store, and the result lands in the result slot; **the input items are not cleared all at once**.

Recipes are vanilla recipe files rather than registry entries, so they do reload with `/reload`.
