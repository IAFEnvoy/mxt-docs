---
title: Contract Type (contract_type)
description: Define the owner and creature conditions, price, follow and combat behaviour, and the separate release and death behaviour of a contract between a player and a spirit beast.
aside: false
---

# Contract Type (contract_type)

A Contract Type defines the rules of a contract between a player and a creature: who may be an owner, which creatures may be contracted, how the spirit beast follows and fights, what signing costs, and what happens when the contract is released or the creature dies.

::: warning Marked for possible removal

`ContractType` carries a `//TODO::May be removed`. Eligibility is a code fact (the creature implements `Contractable`) and the owner is answered by the creature itself (vanilla `OwnableEntity`), so this registry only holds the two conditions, the action of each moment, the signing price and the two caps; if the creature ever declares all of that itself, the type field of `ContractAttachment`, the bind and release paths of `ContractService` and the `/contract` command would go with it. **Declaring one is fully supported today** — just do not treat it as a foundation that cannot move.

:::

## File Location

Contract Type JSON files go in `data/<namespace>/mxt/contract_type/` within your data pack.

**Purpose**: Contract lifecycle. **Marked as possibly removable.**

The filename corresponds to its ID. For example, `data/example/mxt/contract_type/master_servant.json` has the ID `example:master_servant`.

## Fields

**Who may sign is a code fact**: the target creature must implement `com.iafenvoy.mxt.api.Contractable` (see [Special Public Interfaces](../../java/interfaces)), and no data pack can grant an entity that eligibility. It is also a vanilla `OwnableEntity`, so **the creature answers who owns it** (the framework stores no owner). What a data pack can do is narrow the list with an **entity type tag** named after the contract type itself - `#<namespace>:contract/<path>`, stored at `data/<namespace>/tags/entity_type/contract/<path>.json`. A tag that is absent, or written empty, places no restriction.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `contract_type.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `contract_type.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `owner_condition` | Entity Condition | `mxt:always_true` | The owner condition. |
| `creature_condition` | Entity Condition | `mxt:always_true` | The spirit beast condition, checked after the eligibility interface. |
| `follow_action` | Entity Action | `mxt:no_op` | Run every tick **while the order in force is "follow"**; only for a creature that implements `ContractOperations` (see [Special Public Interfaces](/en/java/interfaces)). |
| `combat_action` | BiEntity Action | `mxt:no_op` | Run after damage this spirit beast dealt is resolved. |
| `release_action` | Entity Action | `mxt:no_op` | Run when the contract is **released** (by its owner) while the creature lives. |
| `death_action` | Entity Action | `mxt:no_op` | Run when the **creature dies** and the contract ends with it. A release and a death are two fields, never one. |
| `costs` | `Cost[]` | `[]` | The signing price, paid by the **owner**; it is charged after every condition and the `Pre` event, so a refusal never costs anything. |
| `max_owned` | int | `0` | How many contracts of this type one owner may hold at once; `0` means no limit. |
| `recall_cooldown` | int | `0` | The recall cooldown in ticks; `0` means no limit. It gates the "recall" order given from the bell's wheel or from the command. |

**Orders are not a data pack field here**: the orders an owner can give (follow / wander / stay / recall) are answered by **the creature's own code**, and a content mod may add one of its own. The order in force lives on the beast's contract record, and an old save or an id that no longer resolves reads as follow. See the [command](/en/player-guide/commands/contract) and [Special Public Interfaces](/en/java/interfaces).

`owner_condition` is checked against the player and `creature_condition` against the creature that is being contracted. `combat_action` is a BiEntity Action, so it receives both the actor and the target entity; the other lifecycle fields are ordinary Entity Actions. Reasons for a refusal (a failed condition, an unpayable price, a cooldown that has not elapsed) all read from one table of translation keys, `contract.mxt.failure.<lowercase enum name>`, shared by the scroll, the bell, the bag and the command.

## Example

```json
{
  "follow_action": { "type": "mxt:apply_effect", "effect": "minecraft:speed", "duration_ticks": 40 },
  "combat_action": {
    "type": "mxt:target_action",
    "action": { "type": "mxt:set_on_fire", "ticks": 40 }
  },
  "release_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200 },
  "death_action": { "type": "mxt:set_on_fire", "ticks": 100 },
  "costs": [{ "id": "example:qi", "amount": 5 }],
  "recall_cooldown": 100
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
  "release_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200 },
  "death_action": { "type": "mxt:set_on_fire", "ticks": 100 }
}
```

::: info

The condition and action types above are examples; the complete list is in the [Action Types](../types/action/entity_action_types.md) and [Condition Types](../types/condition/entity_condition_types.md) references.

:::

