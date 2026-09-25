---
title: Forging Blueprint (forging_blueprint)
description: A forging blueprint declares the materials, the allowed methods, the meter target and the quality ladder for one forged result.
aside: false
---

# Forging Blueprint (forging_blueprint)

A forging blueprint describes one item that can be forged at the Forge Table: which materials the table must hold, which methods are allowed, what the forging meter has to reach and what quality the extra steps buy.

## File Location

Forging blueprint JSON files go in `data/<namespace>/mxt/forging_blueprint/` within your data pack.

**Purpose**: Forging targets and quality settlement.

The filename corresponds to its ID. For example, `data/example/mxt/forging_blueprint/iron_sword.json` has the ID `example:iron_sword`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `input` | `List<ForgingMaterial>` | **required** | Unordered material requirement; each entry is `{ "id": <item ID>, "count": <count> }`, where `count` defaults to `1`. |
| `allowed_methods` | `HolderSet<forging_method>` | empty | The forging methods this blueprint allows. You may write a list of IDs, a single `"#namespace:tag"`, or omit the field entirely. **Omitting it or writing an empty list means no restriction**, and the usable methods are decided entirely by the tools. |
| `meter_min` / `meter_max` | Integer | **required** | The forging meter bounds. They must cross `0`. |
| `target_min` / `target_max` | Integer | **required** | The success range. It must lie inside the meter bounds. |
| `finish_pattern` | Object | empty pattern | The last six steps pattern. |
| `max_steps` | Integer | none | The maximum number of steps. **If it is omitted, this blueprint can never fail because of the step count.** |
| `quality_by_extra_steps` | `List<QualityThreshold>` | **required** | An ascending map from extra steps to quality. The last entry must be `2147483647`. |
| `result` | Identifier | **required** | The item ID produced on success. |
| `complete_action` | `EntityAction` | `mxt:no_op` | The action run on success. |
| `fail_action` | `EntityAction` | `mxt:no_op` | The action run on failure. |
| `failure_settlement` | Object | destroy input | The return and material loss on failure. |

## Input

`input` is **order-independent**: the Forge Table only requires that the 15 input slots together hold the declared count of every entry, and which slots the materials come from does not affect the check. Datapack loading rejects an empty list, more than 15 entries, the same item appearing twice and item IDs that cannot be resolved. Because native datapack registries are parsed before item component bindings, `input` uses `id` + `count` instead of an `ItemStack`.

## Finish Pattern

`finish_pattern` has the fields `steps` (six forging methods) and `required_suffix_steps` (`0..6`). When `required_suffix_steps > 0` you must provide all six steps. **Only the last `N` entries of `steps` are checked**; the first `6-N` entries are neither shown nor checked, and in the interface they are barrier slots. Success requires the final value to fall inside the target range and the required trailing steps to match exactly; the number of extra steps decides the quality. **That tier table is drawn line by line in the Forge Table's blueprint tooltip** (each line in its own tier's `color`, with the last entry written as "any number of extra steps"), and once a piece is finished the readout on the right adds a "Quality: name" line taken from the tier the server wrote onto the result - the screen never predicts it.

## Step Limit

`max_steps` is the **only** source of failure: once it is defined, reaching that step count without meeting the completion conditions fails the attempt. When it is not defined, the player can keep striking until the conditions are met. Writing `0` is the same as omitting the field, because `0` is the sentinel for "no limit".

A blueprint that declares a step limit shows that limit in the Forge Table's blueprint tooltip, so a tight plan can be told from a generous one before the first strike. A blueprint without a limit shows no such line.

## Example

```json
{
  "input": [
    { "id": "minecraft:iron_sword", "count": 1 }
  ],
  "allowed_methods": [
    "mxt_test:heavy_strike", "mxt_test:light_strike", "mxt_test:draw_out", "mxt_test:flatten",
    "mxt_test:quench", "mxt_test:temper", "mxt_test:fold", "mxt_test:punch", "mxt_test:grind", "mxt_test:polish"
  ],
  "meter_min": -10,
  "meter_max": 10,
  "target_min": 2,
  "target_max": 4,
  "finish_pattern": {
    "steps": [
      "mxt_test:heavy_strike", "mxt_test:light_strike", "mxt_test:heavy_strike",
      "mxt_test:light_strike", "mxt_test:light_strike", "mxt_test:heavy_strike"
    ],
    "required_suffix_steps": 3
  },
  "max_steps": 32,
  "quality_by_extra_steps": [
    { "max_extra_steps": 0, "quality": "mxt_test:excellent" },
    { "max_extra_steps": 5, "quality": "mxt_test:normal" },
    { "max_extra_steps": 2147483647, "quality": "mxt_test:poor" }
  ],
  "result": "minecraft:iron_sword",
  "complete_action": { "type": "mxt:add_resource", "resource": "mxt_test:true_essence", "amount": 5 },
  "fail_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 100 },
  "failure_settlement": { "result": "minecraft:iron_nugget", "input_return_ratio": 0.25, "material_loss_ratio": 0.75 }
}
```

The methods it names are defined by [Forging Method](./forging_method.md), made available by the tools in [Tool Binding](./tool_binding.md), offered to the player through [Blueprint Binding](./blueprint_binding.md), and its quality ladder points at entries of [Quality](./quality.md).

