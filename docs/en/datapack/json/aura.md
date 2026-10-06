---
title: Aura (aura)
description: "Hangs an aura identity and cultivation behaviour on one stored value: element marker, realm chain entry, regeneration, conversions and the use gate."
aside: false
---

# Aura (aura)

[resource](./resource.md) only stores one number per entity: its bounds and how it is shown. An `aura` definition hangs an aura identity and cultivation behaviour on **one** value — which element it belongs to, which realm chain it enters through, how it regenerates on its own, how it converts back and forth with cultivation progress, and when it can be spent on purpose. The two are **one to one**: a value has at most one aura definition, and the server rejects a duplicate outright while it builds its cache.

## File Location

Aura files go in `data/<namespace>/mxt/aura/` within your datapack.

**Purpose**: The aura definition of a single value: what it is (element marker, spirit power ray amount), its realm chain entry, regeneration, conversions and availability.

The filename corresponds to its ID, which is independent of the value it describes. For example, `data/example/mxt/aura/qi.json` has the ID `example:qi` and points at `example:qi` in the `resource` registry.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `aura.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `aura.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `resource` | Value ID | **required** | The value this aura describes. |
| `first_realm` | Realm ID | none | The first realm of the realm chain of this value; it only determines the target realm of a mortal's first breakthrough. Omitted, there is no realm chain and no cultivation. |
| `start_exp` | `NumberProvider` | `0` | The cultivation progress a mortal needs for the first breakthrough, and at the same time the progress cap of the mortal stage; once reached it no longer increases and only a breakthrough can be attempted. |
| `start_cultivate_conditions` | `CultivateConditions` | empty object | Conditions checked when a mortal starts cultivating and before the first breakthrough, useful for conflict or identity restrictions. All definitions that carry a `first_realm` have to be satisfied before cultivation can start. |
| `cultivation_to_resource` | Object | `multiplier=1,max_per_tick=1` | Draws value recovery out of the cultivation progress counter. |
| `resource_to_cultivation` | Object | `multiplier=1,max_per_tick=1` | Converts the value back into cultivation progress, only in cultivation mode. |
| `regen` | `NumberProvider` | `0` | Natural recovery per tick; it applies while the cultivation behaviour has not taken the value over, and the formula can read this value's realm variables. |
| `aura_type` | Element ID | none | The aura marker of this value. It is used for aura type checks (spirit roots, creature element preferences, environment aura rendering) and shown next to the value's name, for example by `/mxt aura query`. |
| `burst_amount` | `NumberProvider` | `0` | When greater than `0` the value can be spent by the Fire Spirit Power keybind and is the amount of each spirit power ray. A datapack should configure only one default spirit power value with this greater than `0`. |
| `use_condition` | `EntityCondition` | `mxt:always` | Controls whether an entity can spend the value on purpose and decides whether its resource bars are shown; it does not affect cultivation, environmental absorption, natural regeneration or breakthrough. |
| `show_cultivation_info` | Boolean | `true` | Whether the character information panel shows the realm and cultivation progress of this value. |

`aura_type` is also what a spirit burst depends on: an aura without this marker cannot be fired by a spirit burst, and both firing paths require it to exist.

The value's own bounds (`min` / `max` / `default_value`), icon, ray colour and resource bars all live on the [resource](./resource.md) side and are not written out a second time here. A value with no matching aura definition is a plain counter: it can still be spent, compared and read by formulas, but it **cannot be stored in an item** — the access interfaces exchange auras, and a plain counter has no aura identity.

`resource` takes a **single value ID only**: no `#tag`, and no array — one aura describes one value.

A `CultivateConditions` object contains `conditions`, an optional `triggers` and an optional `action`. Starting cultivation and the breakthrough entry point check `conditions` immediately (all of them); only after the breakthrough stage is reached does the current value register runtime subscriptions from `triggers`, and a matching event then makes it attempt a breakthrough. Subscriptions are never serialised directly: they are rebuilt from the cultivation state after a save is loaded or the registries are loaded.

The two fields of `cultivation_to_resource` and `resource_to_cultivation` are:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `multiplier` | `NumberProvider` | `1` | Multiplier that converts the source value into the target value. |
| `max_per_tick` | `NumberProvider` | `1` | Maximum source value consumed per tick; the limit applies to the source, not the target. |

## Example

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "bars": [{"context": "mxt:self_hud", "anchor": "left", "order": 0, "renderer": {"type": "mxt:boss_bar", "bar_index": 1}}]
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "start_exp": 100,
  "regen": 0.25,
  "aura_type": "example:common",
  "burst_amount": 10,
  "cultivation_to_resource": {"multiplier": 1, "max_per_tick": 2},
  "resource_to_cultivation": {"multiplier": 0.5, "max_per_tick": 1},
  "use_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "show_cultivation_info": true
}
```

::: info Server-authoritative
Cultivation absorption by default only restores the value that belongs to the current realm, and reverse conversion is allowed only while in the cultivation state. `regen` and `resource.max` are both evaluated on the server; the client takes no part in the settlement.
:::

::: info Realm chains
The chain belongs to this aura definition: every `realm_stage` points back at it with its `aura` field, and the chain's entry is given by `first_realm`, so reading realm state never has to look the value up again. `first_realm` must be a stage on that value's chain, and the server checks this while it builds the realm index. An aura without `first_realm` has no chain, and only `regen`'s natural recovery is left.
:::

`aura` is one of the 24 registries that may also carry an optional `name` / `description`; omitting them falls back to the generated key. The generation rules and how to write the language files are in [Datapack Overview](../overview.md).
