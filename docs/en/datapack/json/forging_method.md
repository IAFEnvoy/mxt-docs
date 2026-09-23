---
title: Forging Method (forging_method)
description: A forging method is one hammering operation at the Forge Table, defined by its meter shift, cost and condition.
aside: false
---

# Forging Method (forging_method)

A forging method defines a single hammering operation that a player can perform while forging at the Forge Table: how far it moves the forging meter, what it costs and when it may be used.

## File Location

Forging method JSON files go in `data/<namespace>/mxt/forging_method/` within your data pack.

**Purpose**: A single forging strike method.

The filename corresponds to its ID. For example, `data/example/mxt/forging_method/heavy_strike.json` has the ID `example:heavy_strike`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value_delta` | Integer | **required** | The forging meter shift. It must not be `0`. |
| `costs` | `List<Cost>` | `[]` | What one strike costs, paid by the player who strikes, all or nothing as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `condition` | `EntityCondition` | `mxt:always_true` | The condition for using this method. |
| `icon` | [Icon Reference](../types/shared_data_types.md#icon-reference) | none | The icon drawn in the interface. An item icon also supplies the name the method is listed under. |
| `cooldown` | Integer | `0` | The strike cooldown in ticks, range `0..72000`. Consecutive strikes by the same player on the same Forge Table are rate-limited by the server. |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | The sound played at the Forge Table position when a strike with this method succeeds. |

## Sound

`sound` is played after the strike actually happens, for every player near the table rather than only for the one who struck, through the `blocks` volume channel, at volume and pitch `1.0`. A rejected strike (not enough resources, condition not met, cooling down, out of range) plays nothing. The field is resolved to a sound event by its ID at load time, so a wrong ID rejects that entry instead of loading a method that never makes a sound.

::: tip Silent methods

Write `minecraft:intentionally_empty` (the vanilla empty sound) for a method that should produce no sound at all.

:::

## Example

```json
{
  "value_delta": 2,
  "costs": [{ "id": "mxt_test:spirit_power", "amount": 1 }],
  "condition": { "type": "mxt:health", "comparison": ">=", "compare_to": 1 },
  "icon": {"item": "minecraft:iron_ingot"},
  "cooldown": 10,
  "sound": "minecraft:block.anvil.land"
}
```

Methods are unlocked by tools, which reference them through [Tool Binding](./tool_binding.md), and are accepted by a blueprint through its `allowed_methods` list in [Forging Blueprint](./forging_blueprint.md).

