---
title: Alchemy Wall Material (alchemy_wall_material)
description: The temperature rating of a furnace wall, how hot one casing block may get, and why a furnace takes the lowest value.
aside: false
---

# Alchemy Wall Material (alchemy_wall_material) {#alchemy_wall_material}

An `alchemy_wall_material` describes **one casing block** and nothing else: a name, a description, a finite temperature limit and an optional tier. Slots, capacity and cooling rate belong to the [furnace specification](./alchemy_furnace.md) and are not written here.

A furnace's temperature limit is the **lowest** `max_temperature` among its 18 casings. When materials are mixed the weak spot decides, and hotter casings never average a weak one away.

## File Location

Wall material files go in `data/<namespace>/mxt/alchemy_wall_material/` within your data pack.

**Purpose**: The temperature limit and starting tier of one casing block.

The filename corresponds to its ID. For example, `data/example/mxt/alchemy_wall_material/bronze.json` has the ID `example:bronze`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `alchemy_wall_material.mxt.<namespace>.<path>` | The material's display name. |
| `description` | Text Component | the same key plus `.description` | The material's description. |
| `quality` | Quality id | none | Optional. The tier a casing block of this material starts on. |
| `max_temperature` | Double | **required** | This material's temperature limit; finite and greater than `0`. |

```json
{
  "name": "material.mxt.example.bronze",
  "max_temperature": 800
}
```

The example supplies its own name translation key; omitting `name` and `description` still uses the two keys generated from the entry id. The value of `max_temperature` is yours to pick — the mod ships no table of copper, iron or spirit material temperatures.

`quality` is optional: casing blocks are the one kind of block every wall material shares, so a block cannot say which tier it is — only the material the stack carries can: a casing block of this material starts on that tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) data map.

## Carrying and Forming

Casing items carry the material identity through the `mxt:alchemy_wall_material` component: placing, saving, synchronizing, creative pick-block and a normal break all keep it. When the definition is not in the registry the material cannot form, and the mod does not fall back to a hard-coded number.

The core, the three stores and all 18 casings must be in place before the furnace forms, and the set point a player may enter is the lower of the furnace's temperature limit and the heat block's maximum temperature — see [alchemy_furnace](./alchemy_furnace.md). Representative materials live only in the test data pack; production content comes from content packs.
