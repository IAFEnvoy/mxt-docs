---
title: Spirit Crafting Recipes (spirit_crafting)
description: "The Spirit Crafting Table accepts mxt:spirit_shaped and mxt:spirit_shapeless recipes, which spend aura as well as materials."
aside: false
---

# Spirit Crafting Recipes (spirit_crafting)

The Spirit Crafting Table reuses the vanilla crafting table layout but accepts only the two **spirit crafting** recipe types, `mxt:spirit_shaped` and `mxt:spirit_shapeless`. On top of the usual ingredients, each recipe declares an aura cost.

## File Location

Spirit crafting recipes are ordinary recipe files, so they go in `data/<namespace>/recipe/` within your data pack.

**Purpose**: Vanilla recipe types (`mxt:spirit_shaped`, `mxt:spirit_shapeless`), not a datapack registry.

The filename corresponds to its ID. For example, `data/example/recipe/spirit_iron_ingot.json` has the ID `example:spirit_iron_ingot`.

The recipe type is written in the file itself: `"type": "mxt:spirit_shaped"` or `"type": "mxt:spirit_shapeless"`.

## Shaped Recipes

A shaped recipe has the following fields.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pattern` | String[] | **required** | One to three rows, each one to three characters. |
| `key` | `Map<String, Ingredient>` | **required** | Maps every symbol used in the pattern to its ingredient. Each key must be a single non-space character. |
| `result` | `ItemStackTemplate` | **required** | The item produced, written in the vanilla item stack template shape. |
| `aura` | `List<Cost>`, limited to `mxt:aura` entries | **required** | The aura cost of one craft, paid from the **Spirit Crafting Table's own store** in whole units (rounded up). Only `mxt:aura` entries are accepted (any other type is a load error); the older `{"<aura id>": NumberProvider}` map form is still read for compatibility, but the array form is what gets written. It must not be empty. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |

The pattern is matched against the 3x3 grid at every possible offset, and slots the pattern leaves out have to be empty.

## Shapeless Recipes

A shapeless recipe has the following fields.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ingredients` | `Ingredient[]` | **required** | One to nine ingredients, matched in any order. |
| `result` | `ItemStackTemplate` | **required** | The item produced, written in the vanilla item stack template shape. |
| `aura` | `List<Cost>`, limited to `mxt:aura` entries | **required** | The aura cost of one craft, paid from the **Spirit Crafting Table's own store** in whole units (rounded up). Only `mxt:aura` entries are accepted (any other type is a load error); the older `{"<aura id>": NumberProvider}` map form is still read for compatibility, but the array form is what gets written. It must not be empty. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |

The ingredients have to match the non-empty slots of the grid exactly, so a shapeless recipe may not leave unrelated items in the grid.

## Behaviour

Shaped recipes are checked before shapeless ones, so a shapeless recipe is only used when no shaped recipe matches.

The aura a recipe declares is a `Cost` array limited to `mxt:aura` entries, with each `amount` given as a number provider; the value is evaluated when the recipe matches and rounded up. While a matching recipe is present the table accepts that recipe's aura and keeps it for that recipe only, so changing the grid or the matched recipe discards what it had stored. The cost is paid when the result is taken out, by the shared cost transaction, out of the **Spirit Crafting Table's own store**, and the input items stay in the grid.

The entries of `aura` name `mxt:aura` identities, not stored values: what is spent is an aura, identified by its definition, and each definition names the value it is counted in through its own `resource` field. Here the table's own store pays, so it is that aura itself that is charged, not the value it is measured in.

## Example

A shaped recipe:

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

A shapeless recipe, listing one ingredient per item:

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

The aura a recipe spends belongs to an aura defined by the [`mxt:aura` registry](./aura.md), whose `resource` field names the value that aura is measured in. Recipes are not a registry, so unlike the data tables they do reload with `/reload`.

