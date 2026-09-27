---
title: Forging Method (forging_method)
description: "A forging method is a single strike: how far it pushes the meter, what it costs, when it may be used, how long it cools down and what sound a successful strike plays."
aside: false
---

# Forging Method (forging_method) {#forging_method}

File location: `data/<namespace>/mxt/forging_method/<path>.json`

**Purpose**: One way of striking.

It pushes the current value by `value_delta`, takes a price from whoever strikes, and uses the condition and the cooldown to decide whether that strike counts. Which methods a player can reach in the interface is settled by [Tool Binding](./tool_binding.md), and a blueprint's `allowed_methods` narrows it down again; what one forging run has to end up as is in [Forging Blueprint](./forging_blueprint.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value_delta` | Integer | **required** | The forging meter shift. It must not be `0`. |
| `costs` | `Cost[]` | `[]` | What one strike costs, taken from whoever strikes; the array as a whole is **all or nothing**. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `condition` | `EntityCondition` | `mxt:always` | The condition for using this method. |
| `icon` | **Icon Reference** | none | The icon drawn in the interface; an item icon also supplies the name this method is listed under. |
| `cooldown` | Integer | `0` | The strike cooldown in ticks, range `0..72000`. |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | The sound played at the Forge Table position when a strike with this method succeeds. |

With an item `icon`, the method's name in the list is that item's hover name; only a method with no icon falls back to the entry's own ID.

## Judging a strike

**A strike that would leave the meter is refused outright.** Before every strike the game works out whether the value would still sit inside the meter afterwards, and refuses if it would not — do not count on one oversized hammer shoving the number back into the range.

**The cooldown is recorded before the cost is paid and before the condition is checked.** A strike turned away for lack of resources or for an unmet condition still burns that cooldown. Cooldowns are tracked per (player, Forge Table), so consecutive strikes by the same player on the same table are rate-limited by the server.

## `sound`

`sound` is played after the strike **actually happens**, for every player near the table rather than only the one who struck, through the `blocks` volume channel, at volume and pitch `1.0`. A refused strike (not enough resources, condition unmet, cooling down, out of range) makes no sound.

The field is resolved to a sound event by its ID at load time, so a wrong ID rejects that entry instead of leaving it silent. A method that needs to be **silent** writes `minecraft:intentionally_empty` (the vanilla empty sound).

## Example

```json
// data/example/mxt/forging_method/heavy_strike.json
{
  "value_delta": 3,
  "costs": [
    { "type": "mxt:resource", "resource": "example:stamina", "amount": 5 }
  ],
  "cooldown": 20,
  "sound": "minecraft:block.anvil.land"
}
```

A silent finishing method:

```json
{
  "value_delta": -2,
  "sound": "minecraft:intentionally_empty"
}
```
