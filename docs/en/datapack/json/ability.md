---
title: Ability (ability)
description: Defines an active, passive or triggered ability with its costs, cooldown, conditions and behaviour.
---

# Ability (ability)

An `ability` defines an active, passive or triggered ability, including its resource costs, cooldown, availability condition and the behaviour it executes.

## File Location

Ability files go in `data/<namespace>/mxt/ability/` within your datapack.

**Purpose**: Active, passive and triggered abilities.

The filename corresponds to its ID. For example, `data/example/mxt/ability/fireball.json` has the ID `example:fireball`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ability` | `AbilityType` object | **required** | Built-in ability type object; the object must contain a `type` dispatch key. |
| `costs` | `List<Cost>` | `[]` | Costs paid before the ability executes. An entry is a `Cost`: `mxt:resource` (the plain `{"id": ..., "amount": ...}` shorthand is read as this), `mxt:item`, or `mxt:js` for a script-defined cost. A cost that is not a `resource` cost means the ability can only be used by a player. |
| `cast_time` | `NumberProvider` | `0` | Cast time. |
| `cooldown` | `NumberProvider` | `0` | Cooldown. |
| `icon` | [Icon Reference](../types/shared_data_types.md#icon-reference) | none | Optional hotbar icon for active abilities; it must define exactly one of `texture` (a 16x16 GUI texture) or `item`, because an icon with neither or both is rejected. |
| `components` | `List<DataStorage>` | `[]` | State kinds the ability declares: `mxt:cooldown`, `mxt:charges`, `mxt:toggle`, `mxt:timer`, `mxt:resource` and `mxt:target_lock`. A kind's class is the slot it fills, the declared fields carry its parameters, and the values live in this ability's own holder inside `mxt:ability_holder`, addressed by the ability's id. See [Data Storage Types](/en/datapack/types/other/ability-and-curse#data-storage-type). |
| `modifiers` | `List<AttributeEntry>` | `[]` | Passive vanilla attribute modifiers; an entry contains `attribute`, `id`, `amount` and `operation`, plus an optional `value` formula. |
| `damage_condition` | `DamageCondition` | `mxt:always_true` | Restriction on damage triggers. |
| `condition` | `EntityCondition` | `mxt:always_true` | Condition for the ability to be usable. For the passive types `mxt:modifier` and `mxt:aura` it is not a one-off gate: it is re-evaluated every tick, and the passive effect is dropped while it fails. |
| `entity_action` | `EntityAction` | `mxt:no_op` | Behaviour executed on the caster. |
| `target_selector` | `AbilityTargetSelector` | `mxt:self` | Which entities `bi_entity_action` applies to: `mxt:self` selects only the caster, `mxt:area` takes `radius` (required, capped at `128`) and `include_actor` (default `false`), and `mxt:js` asks a server script. |
| `target_condition` | `BiEntityCondition` | `mxt:always_true` | Target relation condition. |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Behaviour executed on the caster and the target. |
| `element_affinity` | `HolderOrTag<element>[]` | `[]` | Element affinity markers of the ability. |

### ability.type

`ability.type` is an extensible built-in dispatch table, `mxt:ability_type`, with the built-in types `empty`, `active`, `triggered`, `modifier`, `aura`, `channelled`, `composite` and `word`. Two of them change when behaviour is executed:

| Type | Exclusive Fields | Behaviour Execution Timing |
|------|------------------|----------------------------|
| `mxt:channelled` | `tick_interval` (default `1`), `upkeep_costs` (default `[]`) | Executes `entity_action` and the target behaviour once on activation, then once per `tick_interval` after the upkeep resources have been deducted successfully, until it is released or the upkeep fails. It is the only behaviour entry point of a sustained effect. |
| `mxt:composite` | `abilities` (**required**), `all_required` (default `true`) | Does not execute behaviour itself; with `all_required: false` only the first ability in the list is executed, while with `true` the costs of every ability are submitted in list order and then the behaviour of each child ability is executed in turn. |

The remaining types that own fields are:

| Type | Exclusive Fields | Meaning |
|------|------------------|---------|
| `mxt:active` | `slot` (default `primary`, must not be blank) | A hotbar ability bound to the named slot. |
| `mxt:triggered` | `triggers` (default `[]`), `chance` (default `1`) | Runs its behaviour whenever one of its triggers fires, subject to `chance`. |
| `mxt:modifier` | none | A passive ability: its `modifiers` apply for as long as the ability is granted, and its `condition` is re-evaluated every tick so the modifiers disappear while the condition fails. |
| `mxt:aura` | `interval` (default `20`), `radius` (default `4`) | A periodic ability applied to the entities inside `radius` every `interval` ticks. |
| `mxt:word` | `effect` (**required**), `requires_operator` (default `true`), `amount` (default `0`) | A terminal payload. `effect` is one of the code-whitelisted word effects `self_heal` and `purge_self_curses`; a datapack cannot supply an arbitrary command. |

The effects of `mxt:channelled` and `mxt:composite` are both produced through the same set of fields: `entity_action` applies to the caster, `target_selector` and `bi_entity_action` apply to the selected target, while the `word` type is a terminal payload that does not execute target behaviour any more.

Every entry of `mxt:triggered.triggers` is a `trigger_type` entry. Besides the built-in signals, `mxt:js` lets the ability wait for a **custom** signal a server script publishes; see [`trigger_type`](/en/datapack/types/other/trigger-and-cost#trigger-type).

## Example

```json
{
  "ability": {
    "type": "mxt:triggered",
    "triggers": [{"type": "mxt:item_use"}]
  },
  "costs": [
    {"id": "example:qi", "amount": "10 + level"}
  ],
  "cooldown": 100,
  "condition": {"type": "mxt:sneaking"},
  "entity_action": {"type": "mxt:damage", "amount": "4 + level"}
}
```

A channelled ability that pays upkeep every 20 ticks:

```json
{
  "ability": { "type": "mxt:channelled", "tick_interval": 20, "upkeep_costs": [{"id": "example:qi", "amount": 1}] },
  "entity_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
}
```

A top-level ability that should be a channelled ability released from the ability hotbar must use `mxt:channelled` as a child ability of `mxt:composite`: `mxt:active` and `mxt:channelled` are mutually exclusive single `type`s, and only the child abilities of a composite ability become the active channel.

```json
{
  "ability": { "type": "mxt:composite", "abilities": ["example:meditate_channel"] },
  "cooldown": 100
}
```

::: info Server-authoritative
Numeric fields of abilities uniformly use `NumberProvider`. An ability must pass its condition and all resource costs before its behaviour is executed. Ability behaviour is handled on the server; the client hotbar only sends use and cancel requests.

Abilities can read the entity variables plus the ability and trigger variables (`element_modifier`, `damage`, `target_health`, …); see [Formula Variables](../types/formula_variables.md).
:::

