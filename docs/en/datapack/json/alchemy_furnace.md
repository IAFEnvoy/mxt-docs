---
title: Alchemy Furnace (alchemy_furnace)
description: A furnace specification covering main and auxiliary slot counts, per-batch capacity and cooling rate.
aside: false
---

# Alchemy Furnace (alchemy_furnace) {#alchemy_furnace}

An `alchemy_furnace` is a **furnace specification**, not the block in the world. It says how many main and auxiliary slots the furnace has, how many ingredients one batch may hold, and how much heat it loses per tick once it is above the set point or the heat stops. **`quality` is optional**: every specification shares the same block item `mxt:alchemy_furnace`, so the item itself cannot say which tier it is — only the specification the stack carries can: a furnace built to this specification starts on that tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) data map.

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
| `quality` | Quality id | none | Optional. The tier a furnace built to this specification starts on. |
| `main_slots` | Integer | **required** | Main ingredient slots, `1..2`. |
| `auxiliary_slots` | Integer | `0` | Auxiliary ingredient slots, `0..2`. |
| `capacity` | Integer | **required** | Ingredient count per batch, `1..320`; the item's own stack limit still applies. |
| `cooling_per_tick` | Double | **required** | How much heat is lost per tick while the furnace sits above the set point or has no heat block, a finite positive number that never crosses the set point: with a heat block in the cell the temperature is pushed towards the set point, and when that cell is empty or holds a block with no heat it falls all the way to `0`. |

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

The `quality` a specification writes is the furnace's tier, and it only reaches display and use conditions: the furnace's own alchemy modifier does not shorten the duration, and changing only the quality component on the item changes none of the specification's parameters.

## Furnace Structure

A furnace is not a single block: players build a fixed 3×3×3 by hand, with no datapack structure schema and no custom shape.

| Position | Block | Role |
| --- | --- | --- |
| Middle cell of the front layer | Furnace core | Holds the batch and carries the furnace specification; the heat readout and Set / Start / Abort sit on its page. |
| Left cell behind the core | Main ingredient input | Two main ingredient slots. |
| Right cell behind the core | Auxiliary ingredient input | Two auxiliary slots plus one catalyst slot. |
| **Above** the middle centre cell (the centre of the top layer) | Alchemy output | Four output slots, extraction only. |
| The other 18 cells | Furnace casing | Each carries one wall material and opens no screen. |

Facing defaults to north, and a horizontal rotation turns the whole shell together; 22 cells are checked in all (the four bottom corners plus the two layers above). **Only the four corners count as structure in the bottom layer**, and the other five cells are not checked at all: whatever sits there, or nothing, and whether their chunk is loaded makes no difference to forming, and they are never claimed; the corner blocks each draw a quarter of the base, so those five cells can stay empty and it still reads as complete. The **centre cell of that bottom layer is the heat cell**: what a player puts there is up to them, and only a heat block supplies heat, see [heat_source](./heat_source.md). An incomplete shell, a missing or invalid wall material, or a cell claimed by another furnace all stop it from forming and from starting; the screen spells out in words what is missing.

## Temperature Ceiling

The set point a player may enter is capped by **the lower of two numbers**: the lowest temperature limit among the 18 casings, and the heat block's `max_temperature`. The set point must be finite and lie between `0` and that cap, it may be changed while running, and an invalid request is rejected; the first batch also requires it to fall inside the recipe's temperature tolerance.

The heat block stands in the **centre cell of the bottom layer** (local index 4, directly below the centre of the furnace above) and is read through the [`mxt:heat_source`](./heat_source.md) table; a block that implements `AlchemyHeatSource` answers for itself instead. The mod ships no default heat block and no bundled values for lava or fire. The specification has no temperature field: how hot a furnace may run depends on which [wall materials](./alchemy_wall_material.md) are built in and which heat block stands in that cell.
