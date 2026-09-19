---
title: Alchemy Recipe (alchemy_recipe)
description: An alchemy recipe combines materials, aura, temperature and furnace tier to produce pills, with both outcomes decided by the recipe.
---

# Alchemy Recipe (alchemy_recipe)

An alchemy recipe is a vanilla recipe type registered by the mod. It tells an alchemy workstation which materials it accepts, what temperature and furnace tier it needs, how long a batch runs and what it produces on success or on failure.

## File Location

Alchemy recipes are ordinary recipe files, so they go in `data/<namespace>/recipe/` within your data pack, exactly like a crafting or smelting recipe.

**Purpose**: Vanilla recipe type (`mxt:alchemy`), not a datapack registry.

The filename corresponds to its ID. For example, `data/example/recipe/toxicity_pill.json` has the ID `example:toxicity_pill`.

Every file declares the mod's recipe type:

```json
{
  "type": "mxt:alchemy"
}
```

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | String | **required** | Must be `mxt:alchemy`. |
| `inputs` | `Identifier[]` | **required** | The item IDs the workstation must hold. At least one entry. Order does not matter: the list is compared with the input items as a multiset, so an item used twice has to be listed twice. |
| `target_temperature` | `NumberProvider` | **required** | The temperature the batch is supposed to run at. |
| `temperature_tolerance` | `NumberProvider` | `0` | How far the workstation temperature may deviate from `target_temperature`. A tick outside the tolerance spoils the batch. |
| `minimum_furnace_tier` | Integer | `0` | The minimum furnace tier of the workstation. A lower tier rejects the start. |
| `duration` | `NumberProvider` | **required** | The number of ticks the batch runs. It must be finite and greater than `0`. |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | The minimum amount of each aura at the workstation position. Every listed entry has to be satisfied; a zone that sets `alchemy_env_bonus` satisfies the whole requirement by itself. |
| `success_outputs` | `Identifier[]` | **required** | The item IDs produced when the batch finishes unspoiled. At least one entry; each ID yields one item. |
| `failure_outputs` | `Identifier[]` | `[]` | The item IDs produced when the batch is spoiled. Each ID yields one item. |
| `success_action` | `EntityAction` | `mxt:no_op` | The action run on the owner when the batch finishes unspoiled. |
| `failure_action` | `EntityAction` | `mxt:no_op` | The action run on the owner when the batch is spoiled. |
| `success_block_action` | `BlockAction` | `mxt:no_op` | The block action run at the workstation when the batch finishes unspoiled. |
| `failure_block_action` | `BlockAction` | `mxt:no_op` | The block action run at the workstation when the batch is spoiled. |

## Behaviour

A batch can start when the workstation holds exactly the declared `inputs`, its furnace tier is at least `minimum_furnace_tier`, and the aura at its position satisfies `minimum_aura`. It then runs for `duration` ticks while the workstation temperature is compared against `target_temperature` within `temperature_tolerance`; a single tick outside the tolerance spoils the rest of the batch. When the last tick passes, the recipe emits `success_outputs` or `failure_outputs` depending on whether it was spoiled, and then runs the matching entity action on the owner and the matching block action at the workstation.

The workstation environment is described by [Aura Zone](./aura_zone.md): the aura the recipe asks for is read from the position, and a zone whose `rules` set `alchemy_env_bonus` satisfies `minimum_aura` by itself, because the flag is a plain yes/no with no magnitude to scale an aura pool by. Without that flag the recipe's own minimums are compared against the zone's actual pools, exactly as before.

::: warning Unresolvable aura keys are dropped
`minimum_aura` is decoded as a map, and an entry whose key is not a resolvable `aura` ID is dropped with a warning in the log instead of failing the load. A typo therefore reads as "this aura is not required" rather than as an error.
:::

## Example

```json
{
  "type": "mxt:alchemy",
  "inputs": ["minecraft:red_mushroom", "minecraft:honey_bottle"],
  "target_temperature": 600,
  "temperature_tolerance": 50,
  "minimum_furnace_tier": 1,
  "duration": 200,
  "minimum_aura": { "mxt:common": 200 },
  "success_outputs": ["minecraft:honey_bottle"],
  "failure_outputs": ["minecraft:glass_bottle"],
  "success_action": { "type": "mxt:add_resource", "resource": "mxt:common", "amount": 5 },
  "success_block_action": { "type": "mxt:change_aura", "aura": { "mxt:common": 20 } }
}
```

The items it produces are given their pill and toxicity rules by [Pill Binding](./pill_binding.md), and its materials can be declared as spirit herbs by [Spirit Herb](./spirit_herb.md).

