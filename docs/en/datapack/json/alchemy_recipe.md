---
title: Alchemy Recipe (alchemy_recipe)
description: "A pill recipe matches on medicinal properties: it declares how much main, auxiliary and catalyst power it needs, its target temperature, duration and environment aura gate, and what success and failure produce."
aside: false
---

# Alchemy Recipe (alchemy_recipe)

A pill recipe is the **vanilla recipe type `mxt:alchemy`**, not a data pack registry entry. It judges by **medicinal property** rather than by a fixed item list: the materials in one batch add up into property values per role — main, auxiliary and catalyst — and a recipe declares how much of each it wants. Whatever satisfies that matches.

## File Location

Pill recipes go in `data/<namespace>/recipe/` inside a data pack, the same tree as crafting and smelting recipes. The file name is its ID: `data/example/recipe/warming_pill.json` has the ID `example:warming_pill`.

Every file declares `"type": "mxt:alchemy"`. A file placed in `mxt/alchemy_recipe/` is never read and is not a pill recipe.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | String | **required** | Must be `mxt:alchemy`. |
| `name` | Text Component | empty | Optional metadata. The furnace shows no recipe name and has no viewer. When omitted the key is `recipe.mxt.<namespace>.<path>`, with `/` in the path replaced by `.`. |
| `description` | Text Component | empty | Optional metadata; the furnace does not display it. When omitted it is the name key plus `.description`. |
| `main_requirements` | Map of medicinal property ID to [`NumberProvider`](../types/number_provider_types) | **required**, non-empty | Main-role property to positive power threshold. A constant must be positive. |
| `auxiliary_requirements` | same as above | `{}` | Auxiliary role thresholds. May be left empty. |
| `catalyst_requirement` | `NumberProvider` | **required** | The catalyst's harmonising power threshold. A constant must be positive. |
| `balance_tolerance` | `NumberProvider` | `0` | Thermal balance tolerance; a constant must lie in `[0,1]`. |
| `target_temperature` | `NumberProvider` | **required** | Target furnace temperature, finite and non-negative, in the same unit as furnace temperature. |
| `temperature_tolerance` | `NumberProvider` | `0` | Furnace temperature tolerance, finite and non-negative. |
| `duration` | `NumberProvider` | **required** | Crafting duration, finite and positive, in ticks. At start it is divided by the material alchemy modifier, floored at `1` tick, then frozen. |
| `max_bad_ticks` | Integer | `0` | Out-of-range ticks the crafting phase tolerates in total before the batch is spoiled. Returning into range does not reset the count. |
| `minimum_aura` | Map of aura ID to NumberProvider | `{}` | The environment gate. Not a cost, and not heat. |
| `furnace_quality` | Object | none | Requires the **furnace core** item's tier to satisfy this requirement: `quality` is a membership list (tier IDs, or `#`-prefixed quality tags), `min_quality` is "at least this tier", compared by position on the ladder the core's own tier sits on, and a tier from another ladder never passes. Write at least one of the two; an empty object is refused. A core that falls short refuses the start, consuming no materials and not touching the heat block. It is about the core, not about the materials put in. |
| `input_quality` | Object | none | Requires the tier of **every non-empty item in the furnace's input stores** to satisfy this requirement, in exactly the shape `furnace_quality` uses (`quality` membership list and/or `min_quality`, at least one of the two, an empty object refused). Main, auxiliary and catalyst materials all count, judged slot by slot; one slot falling short refuses the start, consuming no materials and not touching the heat block. |
| `success_outputs` | `ItemStackTemplate[]` | **required** | The items produced on success, `1`–`4` entries. Each must fit in one output slot and may carry a count and components. |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | The items produced on failure, `0`–`4` entries. The recipe declares them; the mod does not force dregs in. |
| `success_action` / `failure_action` | `EntityAction` | `mxt:no_op` | Run once while the original operator is online. Nothing is replayed offline and nothing is handed to whoever opens the furnace later. |
| `success_block_action` / `failure_block_action` | `BlockAction` | `mxt:no_op` | Run in the same completion transition as the player action, once each. |
| `guide` | Object | none | Optional example metadata that takes no part in matching. The furnace neither reads nor shows it and there is no viewer. `main` holds at most `2`, `auxiliary` at most `2` and `catalyst` at most `1`; values are item stack templates. |

## How a Mixture Adds Up

The role comes from the slot, not from the recipe: two main-input slots, two auxiliary slots, and the catalyst fixed in the third auxiliary slot. Each material's power comes from the [spirit herb](./spirit_herb.md) it matches: the main role reads `main_effects`, the auxiliary role reads `auxiliary_effects`, the catalyst reads `catalyst_power`. Property values are summed as **count × power per item**.

- Splitting and merging stacks inside one role changes nothing; moving material to another role recomputes it under that role.
- A non-zero main or auxiliary property the recipe does not ask for makes the recipe **not match** — it is not ignored.
- Excess of a demanded property is allowed, and the materials are still all consumed: no extra output, no quality upgrade, no refund.
- A material with zero power cannot go into that role.
- There is no hidden success rate and no proficiency.

Thermal bias is `Σ(count × power per item in that role × thermal bias) / Σ(count × power per item in that role)`. For the main and auxiliary roles the power per item is the sum of the matching property values, and for the catalyst it is `catalyst_power`; the denominator must be greater than `0`. The batch only counts as balanced when `abs(bias) <= balance_tolerance`.

## Which Recipe Wins

Among the full matches, only a single demand vector is kept, and it must **strictly dominate** every other one: the same set of property keys, every value greater than or equal to the other's (the catalyst requirement included), and at least one value strictly greater. Quality names, ladder positions, total power, temperature, duration, recipe ID and load order are not compared.

When no single vector dominates, that is a mixture conflict: no materials are spent and the player is not asked to choose a recipe. Zero matches still report the shortfall, the conflict or the imbalance. This decision runs before the quality, specification, environment, temperature and output-capacity checks; an out-of-reach temperature or a full output store never switches to another recipe. One click decides once, and the result is frozen into the batch.

## Environment Gate and Duration

`minimum_aura` reads the **environment aura** at the furnace position and compares it entry by entry against the zone's actual pools. It neither consumes aura nor supplies heat. Inside an [aura zone](./aura_zone.md) whose `rules.alchemy_env_bonus` is on, that whole gate **counts as satisfied**: it is a switch with no scalable quantity, so it stands in for the requirement rather than enlarging the pool.

`duration` is evaluated once at start, then divided by **the product of two alchemy modifiers**, rounded, floored at `1` tick and written into the frozen batch. The two are: the **material side**, the lowest tier among the materials in the furnace that **do carry a tier** (materials with no tier are skipped, as they always were); and the **core side**, the `alchemy_modifier` of **the furnace core's own tier**, which counts as `1.0` when the core has no tier. So giving a high furnace tier `alchemy_modifier: 2` makes that furnace brew **every** recipe faster, with no formula written at all.

The recipe's own formula fields can also read the variable **`furnace_rank`**, which is where the core's tier sits on its own ladder (counted from the entry tier, so `0` is the entry tier and also the only number a core with no tier — or a tier no ladder holds — can give; a formula cannot tell those apart), for example `"duration": "200 - furnace_rank * 20"`. It goes into **the recipe's own formula fields only**: `main_requirements` / `auxiliary_requirements` thresholds, `catalyst_requirement`, `balance_tolerance`, `target_temperature`, `temperature_tolerance`, `duration` and `minimum_aura`. A core with no tier, or a tier no walked ladder holds, reads `0`; a path with no core in hand (a plain recipe-manager match, for instance) reads `0` as well. **The potency formulas cannot read it** (a spirit herb's `main_effects` / `auxiliary_effects` / `catalyst_power`): potency decides the mixture and the mixture decides which recipe matches, so swapping the core must not change whether a batch can be made at all. **No tier's `alchemy_modifier` formula can read it either**: a better furnace is faster through the product above, not by reading its own rank inside a modifier. It is not a formula variable the registry provides, so a misspelled name is **not** refused at load: it logs once and takes part as `0`.

When the reachable temperature ceiling and the recipe's required range do not overlap, the start is refused: no materials are spent and the heat block is left alone. Starting also runs quality in a fixed order: first whether the **furnace's own core item** has a tier at all (no tier refuses the start), then, when the recipe writes `furnace_quality`, whether that tier is good enough for this formula (falling short is `furnace_tier`), then, when the recipe writes `input_quality`, every non-empty item in the input stores slot by slot (one falling short is `input_tier`), and only then that core tier's own use condition. Every one of those refusals spends no materials and leaves the heat block alone, and with `input_quality` left out that requirement takes no part at all. The materials only contribute their lowest tier to the duration modifier — the core tier's own modifier enters that division too (see above) — and a material tier's own `condition` is never evaluated on its own (filtering materials by tier is what `input_quality` writes); beyond that only slots and capacity are checked, and neither quality tier nor pill grade is compared. The temperature ceiling is the lowest of three: the furnace specification's own optional `max_temperature`, the `18` wall blocks' lowest wall material temperature, and the highest temperature the heat block gives, as described under [Furnace Specification](./alchemy_furnace.md) and [Wall Material](./alchemy_wall_material.md).

## Example

```json
{
  "type": "mxt:alchemy",
  "main_requirements": { "example:nourish": 6 },
  "auxiliary_requirements": { "example:calm": 6 },
  "catalyst_requirement": 1,
  "balance_tolerance": 0,
  "target_temperature": 100,
  "temperature_tolerance": 5,
  "duration": 200,
  "max_bad_ticks": 2,
  "minimum_aura": { "example:fire_qi": 10 },
  "success_outputs": [
    {
      "id": "mxt:pill",
      "count": 1,
      "components": { "mxt:pill": { "pill": "example:warming_pill" } }
    }
  ],
  "failure_outputs": [{ "id": "mxt:alchemy_dregs" }],
  "guide": {
    "main": [{ "id": "example:herb_a", "count": 2 }],
    "auxiliary": [{ "id": "example:herb_c", "count": 2 }],
    "catalyst": [{ "id": "example:herb_d" }]
  }
}
```

`guide` is only an example and takes no part in the decision: the property rules themselves are the recipe. Putting materials in does not start a batch on its own; once the player starts one at the core, the output is decided from the properties actually sitting in the slots at that moment.

## Related Systems

A pill recipe is a back-end property rule, not a fixed list of item IDs. Medicinal properties come from [Medicinal Property](./medicinal_property.md), a material only has power once it is recognised as a [Spirit Herb](./spirit_herb.md), the pills it produces get what they do from [Pill](./pill.md), and which items they hang on and how often they may be taken from [Pill Binding](./pill_binding.md).

Alchemy and [Spirit Crafting](./spirit_crafting.md) are two paths that never meet: `mxt:alchemy` is only read by the furnace, and `mxt:spirit_shaped` / `mxt:spirit_shapeless` only by the spirit crafting table.
