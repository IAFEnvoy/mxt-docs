---
title: Alchemy Recipe (alchemy_recipe)
description: "An alchemy recipe combines materials, aura, temperature and furnace tier into pills, and the recipe decides both the success and the failure outcome."
aside: false
---

# Alchemy Recipe (alchemy_recipe)

An alchemy recipe is a **vanilla recipe type** registered by the mod. It declares which materials the alchemy workstation takes, what temperature and furnace tier it needs, how long a batch runs, and what success or failure produces.

::: warning There is no alchemy workstation yet

What is settled is the **recipe format** and the rules an alchemy workstation has to follow. Recipe files load and validate as usual, but **the workstation itself does not exist yet**: no block matches a recipe and starts a batch. A recipe written today therefore never runs in game, and nothing can satisfy `minimum_furnace_tier` or `target_temperature` yet.

:::

## File Location

Alchemy recipes go in `data/<namespace>/recipe/` inside a data pack, the same tree as crafting and smelting recipes. The file name is its ID: `data/example/recipe/toxicity_pill.json` has the ID `example:toxicity_pill`.

Every file declares `"type": "mxt:alchemy"`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | String | **required** | Must be `mxt:alchemy`. |
| `inputs` | Item ID list | **required** | The items the workstation must hold. At least one entry. |
| `target_temperature` | `NumberProvider` | **required** | The temperature the batch is supposed to run at. |
| `temperature_tolerance` | `NumberProvider` | `0` | How far the workstation temperature may deviate from `target_temperature`. |
| `minimum_furnace_tier` | Integer | `0` | The minimum furnace tier of the workstation; a lower tier rejects the start. |
| `duration` | `NumberProvider` | **required** | The number of ticks this batch runs. |
| `minimum_aura` | Map of aura ID to [NumberProvider](../types/number_provider_types) | `{}` | The minimum amount of each aura at the workstation position. |
| `success_outputs` | Item ID list | **required** | The items produced when the batch does not fail. At least one entry; each ID yields one item. |
| `failure_outputs` | Item ID list | `[]` | The items produced when the batch fails; each ID yields one item. |
| `success_action` | `EntityAction` | `mxt:no_op` | The action run on the workstation owner when the batch does not fail. |
| `failure_action` | `EntityAction` | `mxt:no_op` | The action run on the workstation owner when the batch fails. |
| `success_block_action` | `BlockAction` | `mxt:no_op` | The block action run at the workstation position when the batch does not fail. |
| `failure_block_action` | `BlockAction` | `mxt:no_op` | The block action run at the workstation position when the batch fails. |

`inputs` **is order-independent**: the list is compared against the inputs the workstation holds as a multiset, so the same item used twice has to be listed twice.

`temperature_tolerance` defaults to `0`, which means the temperature has to be **exactly** `target_temperature`: any deviation falls outside that tolerance.

Every entry listed in `minimum_aura` has to be satisfied; if one is not, the batch does not start.

`duration` is evaluated once, when the batch starts. If the result is not a finite number, is less than or equal to `0`, or exceeds the tick range that can be represented, the batch is rejected.

## Behaviour

A batch can start when the workstation holds exactly the declared `inputs`, its furnace tier is not below `minimum_furnace_tier`, and the aura at its position satisfies `minimum_aura`. It then runs for `duration` ticks, comparing the workstation temperature against `target_temperature` within `temperature_tolerance`: **a single tick outside the tolerance spoils the rest of the batch.** When the last tick passes, the recipe produces `success_outputs` or `failure_outputs` depending on whether the batch failed, then runs the matching entity action on the owner and the matching block action at the workstation.

The workstation environment is described by [Aura Zone](./aura_zone.md): the aura the recipe asks for is read from the position, and an aura zone whose `rules` turn on `alchemy_env_bonus` **satisfies `minimum_aura` by itself**. That switch is a plain yes/no with no magnitude to scale an aura pool by, so it stands in for the whole requirement rather than enlarging the pool. Without that switch the recipe's own minimums are compared entry by entry against the zone's actual aura pools.

::: warning Unresolvable aura keys are dropped

When a key in `minimum_aura` is not a resolvable `aura` ID, that entry is only dropped with a warning in the log and loading passes as usual. A misspelled name therefore reads as "this aura is not required" rather than as an error.

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

Alchemy and [Spirit Crafting](./spirit_crafting.md) are two paths that never meet: `mxt:alchemy` is only read by the alchemy workstation, and `mxt:spirit_shaped` / `mxt:spirit_shapeless` only by the spirit crafting table.

The items it produces are given their pill and toxicity rules by [Pill Binding](./pill_binding.md), and its materials can be declared as spirit herbs by [Spirit Herb](./spirit_herb.md).
