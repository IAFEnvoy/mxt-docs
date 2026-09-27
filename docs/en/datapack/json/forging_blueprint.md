---
title: Forging Blueprint (forging_blueprint)
description: A forging blueprint declares what materials one forge run needs, which striking methods are allowed, the meter and target range, the finishing pattern, the quality ladder and the failure settlement.
aside: false
---

# Forging Blueprint (forging_blueprint)

File location: `data/<namespace>/mxt/forging_blueprint/<path>.json`

**Purpose**: Forging targets and quality settlement.

A blueprint describes one complete forge run: what materials it needs, which striking methods are allowed, which range the current value has to land in, what pattern the final strike has to make, what quality a good run yields and what is left when you ruin it. How a blueprint reaches the player is covered by [Blueprint Binding](./blueprint_binding.md), and how a single strike is written is in [Forging Method](./forging_method.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `input` | material requirement array | **required** | Unordered material requirement; each entry is `{ "id": <item ID>, "count": <count> }`, where `count` defaults to `1`. |
| `allowed_methods` | forging method ID, `#tag` or array | empty | The forging methods this blueprint allows. |
| `meter_min` / `meter_max` | Integer | **required** | The forging meter bounds; they must cross `0`. |
| `target_min` / `target_max` | Integer | **required** | The success range; it must sit inside the meter bounds. |
| `finish_pattern` | finishing pattern object | empty pattern | The six-step pattern of the final strike. |
| `max_steps` | Integer | `0` | Maximum number of steps. Writing `0` or omitting it means this blueprint never fails on step count. |
| `quality_by_extra_steps` | tier array | **required** | An ascending map from extra steps to quality. The last entry must be `2147483647`. |
| `result` | Identifier | **required** | The item ID produced on success. |
| `complete_action` | `EntityAction` | `mxt:no_op` | Success action, run on the player. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Failure action, run on the player. |
| `failure_settlement` | failure settlement object | destroy input | The return and material loss on failure. |

## `input`

**Order does not matter**: the Forge Table only requires that its 15 input slots together hold the declared count of every entry, and which slots the materials come from does not affect the check.

Loading refuses an empty list, more than 15 entries, the same item appearing twice and item IDs that cannot be resolved. Because datapack registries are parsed before item component bindings, `input` uses `id` + `count` rather than an item stack.

Materials are matched by **item**, not by the components on the stack: a stack carrying a quality component counts exactly the same as a plain item of the same name as far as "is there enough" goes.

## `allowed_methods`

Omitting the field or writing an empty list means **no restriction**, and the usable methods are decided entirely by the tools. A tag counts as a restriction declaration even when not one of its members resolved, which is not the same thing as an empty list: a tag's members cannot be read at load time, so all that is checked here is whether the field was written.

## Meter and target range

`meter_min` / `meter_max` / `target_min` / `target_max` are validated together: `meter_min` must be less than `0`, `meter_max` must be greater than `0`, and `meter_min ≤ target_min ≤ target_max ≤ meter_max`.

## `finish_pattern`

The fields are `steps` (six forging methods) and `required_suffix_steps` (`0..6`). When `required_suffix_steps > 0` you must provide a six-step pattern, meaning `steps` holds exactly six entries; when it is written as `0`, `steps` is either empty or also holds all six. **Only the last `N` entries of `steps` are checked**; the first `6-N` are neither shown nor checked — in the interface they are barrier slots.

Success requires the final value to fall inside the target range and the required trailing steps to match exactly; the number of extra steps decides the quality.

## `quality_by_extra_steps`

Each entry is `{ "max_extra_steps": <extra step ceiling>, "quality": <quality ID> }`; the tiers must be **ascending**, and the `max_extra_steps` of the last entry must be `2147483647`.

The quality is the first tier satisfying `effective extra steps ≤ max_extra_steps`. **Extra steps = actual steps − minimum steps**, where the minimum step count is worked out when the session starts, not "how far the value overshot the target"; the forging modifier of the materials is applied to that extra step count first (`effective extra steps = extra steps ÷ modifier`), and the modifier comes from the materials **locked by this session**, taking the lowest tier among several materials.

**That tier table is drawn line by line in this blueprint's tooltip** (each line in its own tier's `color`, with the last entry written as "any number of extra steps"); after a piece is handed in, the readout on the right adds a "Quality: `<name>`" line, taken from the tier the server wrote onto the result — the screen **never predicts** the tier.

## `max_steps`

`max_steps` is the **only** source of failure, and the default `0` means no step limit. Once it is written as a positive number, a strike made when the step count has already reached it does not run at all and goes straight to failure settlement; when it is omitted (or written as `0`) the player can keep striking until the conditions are met.

## `failure_settlement`

The returns on failure.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `result` | Identifier | none | The "scrap" that may be produced on failure. |
| `input_return_ratio` | Double `0..1` | `0` | The chance to return the whole material set untouched. |
| `material_loss_ratio` | Double `0..1` | `1` | The material loss ratio; its complement `1 - this value` is the chance to produce scrap. |

Settlement is **two independent rolls**: first `input_return_ratio` decides whether the locked materials go back into the input slots (whatever does not fit is dropped to the player), then `1 - material_loss_ratio` decides whether an extra piece of scrap is handed out. So "materials returned and scrap received" does happen. Omitting `failure_settlement` entirely returns nothing, and **writing `result` without lowering `material_loss_ratio` below `1` means that scrap never appears**.

## Example

```json
{
  "input": [
    { "id": "minecraft:iron_ingot", "count": 2 },
    { "id": "minecraft:stick", "count": 1 }
  ],
  "allowed_methods": [
    "example:light_strike", "example:heavy_strike",
    "example:quench", "example:temper"
  ],
  "meter_min": -8,
  "meter_max": 8,
  "target_min": 2,
  "target_max": 4,
  "finish_pattern": {
    "steps": [
      "example:light_strike", "example:heavy_strike", "example:light_strike",
      "example:heavy_strike", "example:light_strike", "example:heavy_strike"
    ],
    "required_suffix_steps": 2
  },
  "max_steps": 24,
  "quality_by_extra_steps": [
    { "max_extra_steps": 0, "quality": "example:flawless" },
    { "max_extra_steps": 4, "quality": "example:refined" },
    { "max_extra_steps": 2147483647, "quality": "example:common" }
  ],
  "result": "minecraft:iron_sword",
  "complete_action": { "type": "mxt:add_resource", "resource": "example:qi", "amount": 5 },
  "fail_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 100 },
  "failure_settlement": {
    "result": "minecraft:iron_nugget",
    "input_return_ratio": 0.25,
    "material_loss_ratio": 0.75
  }
}
```
