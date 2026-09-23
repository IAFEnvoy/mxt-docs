---
title: Contract Type (contract_type)
description: Define the owner and creature conditions, follow and combat behaviour, break behaviour and penalty for a contract between a player and a spirit beast.
aside: false
---

# Contract Type (contract_type)

A Contract Type defines the rules of a contract between a player and a creature: who may be an owner, which creatures may be contracted, how the spirit beast follows and fights, and what happens when the contract is broken or the creature dies.

## File Location

Contract Type JSON files go in `data/<namespace>/mxt/contract_type/` within your data pack.

**Purpose**: Contract lifecycle.

The filename corresponds to its ID. For example, `data/example/mxt/contract_type/master_servant.json` has the ID `example:master_servant`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `contract_type.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `contract_type.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `owner_condition` | Entity Condition | `mxt:always_true` | The owner condition. |
| `creature_condition` | Entity Condition | `mxt:always_true` | The spirit beast condition. |
| `follow_action` | Entity Action | `mxt:no_op` | The follow behaviour. |
| `combat_action` | BiEntity Action | `mxt:no_op` | The combat behaviour. |
| `break_action` | Entity Action | `mxt:no_op` | The contract breaking behaviour. |
| `penalty_action` | Entity Action | `mxt:no_op` | The penalty for violating the contract or dying. |

`owner_condition` is checked against the player and `creature_condition` against the creature that is being contracted. The creature side is a union: the creature also qualifies when the [Creature Profile](./creature_profile.md) applied to it lists this contract type — or a `mxt:contract_type` tag this type belongs to — in its `contract_tags`, so a profile can widen a contract's reach but never narrow it. `combat_action` is a BiEntity Action, so it receives both the actor and the target entity; the other lifecycle fields are ordinary Entity Actions.

## Example

```json
{
  "follow_action": { "type": "mxt:apply_effect", "effect": "minecraft:speed", "duration_ticks": 40 },
  "combat_action": {
    "type": "mxt:target_action",
    "action": { "type": "mxt:set_on_fire", "ticks": 40 }
  },
  "break_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200 },
  "penalty_action": { "type": "mxt:set_on_fire", "ticks": 100 }
}
```

A contract type with an explicit owner condition:

```json
{
  "owner_condition": {
    "type": "mxt:has_realm",
    "resource": "example:spirit_power"
  },
  "creature_condition": {
    "type": "mxt:always_true"
  },
  "follow_action": { "type": "mxt:apply_effect", "effect": "minecraft:speed", "duration_ticks": 40 },
  "combat_action": {
    "type": "mxt:target_action",
    "action": { "type": "mxt:set_on_fire", "ticks": 40 }
  },
  "break_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200 },
  "penalty_action": { "type": "mxt:set_on_fire", "ticks": 100 }
}
```

::: info

The condition and action types above are examples; the complete list is in the [Action Types](../types/action/entity_action_types.md) and [Condition Types](../types/condition/entity_condition_types.md) references.

:::

