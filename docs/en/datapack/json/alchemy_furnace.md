---
title: Alchemy Furnace (alchemy_furnace)
description: A furnace specification covering main and auxiliary slot counts, per-batch capacity, cooling rate and default quality.
aside: false
---

# Alchemy Furnace (alchemy_furnace) {#alchemy_furnace}

An `alchemy_furnace` is a **furnace specification**, not the block in the world. It says how many main and auxiliary slots the furnace has, how many ingredients one batch may hold, how much heat it loses per tick once it is above the set point or the fire is gone, and which quality tier the specification itself uses.

The furnace core carries a specification through the `mxt:alchemy_furnace` component. Without that component, or when the definition it points at is not in the registry, the furnace cannot be started, and it is never quietly replaced by a built-in specification; placing, saving and breaking the core all keep the component.

## File Location

Furnace files go in `data/<namespace>/mxt/alchemy_furnace/` within your data pack.

**Purpose**: Furnace specifications.

The filename corresponds to its ID. For example, `data/example/mxt/alchemy_furnace/clay_kiln.json` has the ID `example:clay_kiln`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `alchemy_furnace.mxt.<namespace>.<path>` | The furnace's display name. |
| `description` | Text Component | the same key plus `.description` | The furnace's description. |
| `main_slots` | Integer | **required** | Main ingredient slots, `1..2`. |
| `auxiliary_slots` | Integer | `0` | Auxiliary ingredient slots, `0..2`. |
| `quality` | quality id | **required** | The furnace's default quality. Display and use conditions only; it derives no slots, capacity, cooling or temperature limit. |
| `capacity` | Integer | **required** | Ingredient count per batch, `1..320`; the item's own stack limit still applies. |
| `cooling_per_tick` | Double | **required** | How much heat is lost per tick while the furnace sits away from the set point or has no fire, a finite positive number: with a fire in place the temperature is pushed towards the set point without overshooting it, and once the fire is gone it falls all the way to `0`. |

The catalyst is fixed to the third slot of the auxiliary store and is not a field. The physical inventories are fixed too: two main slots, three auxiliary slots (two auxiliary plus one catalyst) and four output slots; the main or auxiliary slots a specification does not use cannot be filled. Starting a batch consumes **every item in each occupied slot** of both input stores, not one item per slot.

```json
{
  "main_slots": 2,
  "auxiliary_slots": 2,
  "quality": "example:common",
  "capacity": 64,
  "cooling_per_tick": 0.5
}
```

A furnace's `quality` only reaches display and use conditions: the furnace's own alchemy modifier does not shorten the duration, and changing only the quality component on the item changes none of the specification's parameters.

## Furnace Structure

A furnace is not a single block: players build a fixed 3×3×3 by hand, with no datapack structure schema and no custom shape.

| Position | Block | Role |
| --- | --- | --- |
| Middle cell of the front layer | Furnace core | Holds the exotic fire and the batch, and carries the furnace specification. |
| Left cell behind the core | Main ingredient input | Two main ingredient slots. |
| Right cell behind the core | Auxiliary ingredient input | Two auxiliary slots plus one catalyst slot. |
| **Above** the centre cell | Alchemy output | Four output slots, extraction only. |
| The other 22 cells | Furnace casing | Each carries one wall material and opens no screen. |
| The centre cell | Empty | Must be air. |

Facing defaults to north, and a horizontal rotation turns the whole shell together; 26 cells are occupied. An incomplete shell, a missing or invalid wall material, or a cell claimed by another furnace all stop it from forming and from starting; the screen spells out in words what is missing.

## Temperature Ceiling

The set point a player may enter is capped by **the lower of two numbers**: the lowest temperature limit among the 22 casings, and the exotic fire's own maximum temperature. The set point must be finite and lie between `0` and that cap, it may be changed while running, and an invalid request is rejected; the first batch also requires it to fall inside the recipe's temperature tolerance.

The exotic fire is one item installed in the core; it answers for its own maximum temperature and heating rate, and the mod ships no default fire. The specification has no temperature field: how hot a furnace may run depends on which [wall materials](./alchemy_wall_material.md) are built in and which exotic fire is installed.
