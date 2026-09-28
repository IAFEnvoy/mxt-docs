---
title: Alchemy Wall Material (alchemy_wall_material)
description: The temperature rating of a furnace wall, how hot one casing block may get, and why a furnace takes the lowest value.
aside: false
---

# Alchemy Wall Material (alchemy_wall_material) {#alchemy_wall_material}

An `alchemy_wall_material` describes **how hot one casing block may get** and nothing else: a name, a description and a finite temperature limit. Slots, capacity and cooling rate belong to the [furnace specification](./alchemy_furnace.md) and are not written here.

A furnace's temperature limit is the **lowest** `max_temperature` among its 22 casings. When materials are mixed the weak spot decides, and hotter casings never average a weak one away.

## File Location

Wall material files go in `data/<namespace>/mxt/alchemy_wall_material/` within your data pack.

**Purpose**: The temperature limit of one casing block.

The filename corresponds to its ID. For example, `data/example/mxt/alchemy_wall_material/bronze.json` has the ID `example:bronze`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `alchemy_wall_material.mxt.<namespace>.<path>` | The material's display name. |
| `description` | Text Component | the same key plus `.description` | The material's description. |
| `max_temperature` | Double | **required** | This material's temperature limit; finite and greater than `0`. |

```json
{
  "name": "material.mxt.example.bronze",
  "max_temperature": 800
}
```

The example supplies its own name translation key; omitting `name` and `description` still uses the two keys generated from the entry id. The value of `max_temperature` is yours to pick — the mod ships no table of copper, iron or spirit material temperatures.

## Carrying and Forming

Casing items carry the material identity through the `mxt:alchemy_wall_material` component: placing, saving, synchronizing, creative pick-block and a normal break all keep it. When the definition is not in the registry the material cannot form, and the mod does not fall back to a hard-coded number.

All 22 casings must be valid before the furnace forms, and the set point a player may enter is the lower of the furnace's temperature limit and the exotic fire's maximum temperature — see [alchemy_furnace](./alchemy_furnace.md). Representative materials live only in the test data pack; production content comes from content packs.
