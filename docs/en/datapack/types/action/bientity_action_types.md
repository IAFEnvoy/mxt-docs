---
title: Bi-entity Actions (bientity_action_type)
description: Every built-in bi-entity action type registered by the mod, and the JSON fields each type accepts.
---

# Bi-entity Actions (bientity_action_type)

A bi-entity action works on a pair of entities: an **actor** and a **target**. That pair comes from whichever definition declares the action; the action itself only describes what to do with the two entities it is handed, and never picks them.

`type` is written inside the action object, and its value is one of the ids listed below. These ids are registered by the mod and a data pack cannot add or remove them; custom types can only be introduced through KubeJS, see the [KubeJS API](../../../kubejs/api-reference.md). Apart from `type`, every other key is decided by the type.

## Common Structure

An action is a JSON object, `type` names the type, and every other key is a field of that type:

```json
{
  "type": "mxt:damage_target",
  "amount": 4
}
```

Actions are usually nested in a field of another definition, for example `bientity_action`:

```json
"bientity_action": {
  "type": "mxt:actor_action",
  "action": {
    "type": "mxt:heal",
    "amount": 2
  }
}
```

The `action` nested in `mxt:actor_action` is an [entity action](entity_action_types.md), so it takes entity action ids; a bi-entity action id such as `mxt:heal_target` in that position is wrong.

Anywhere a bi-entity action is expected, an array is accepted too. An array is shorthand for `mxt:sequence` and runs its entries in order:

```json
"bientity_action": [
  { "type": "mxt:mount" },
  { "type": "mxt:heal_target", "amount": 1 }
]
```

An optional action field that is left out is `mxt:no_op`. Loading does not complain about it - that entry simply does nothing.

::: info Field Types Are Shared
Fields that take a number generally accept a [number provider](../number_provider_types.md) instead of a fixed number, so formulas and random values work anywhere a plain number does.
:::

::: info Nested Values
`mxt:if_else` takes a [bi-entity condition](../condition/bientity_condition_types.md); `mxt:actor_action` and `mxt:target_action` take [entity actions](entity_action_types.md).
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for confirming a field name without consulting the tables on this page.
:::

## Meta Action Types

Meta actions control whether other bi-entity actions run, how often, and in what order. They are the types that take other actions as fields.

### mxt:no_op

Does nothing.

No fields.

```json
{ "type": "mxt:no_op" }
```

### mxt:js

Hands the action to a handler registered through KubeJS.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The name the handler was registered under. |
| `params` | JSON object | `{}` | Parameters passed to the handler as they are. |

```json
{
  "type": "mxt:js",
  "id": "example:push_away",
  "params": { "strength": 1.5 }
}
```

A handler is registered with `MxtActions.biEntity(id, callback)`, and the callback receives the actor, the target, `params` and this dispatch's formula context. An `id` with no matching callback logs one warning and then does nothing; a callback that throws is likewise only logged, and the rest of the sequence is not interrupted.

### mxt:sequence

Runs a group of bi-entity actions in order.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Bi-entity action array | **required** | The actions, run in order. |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:mount" },
    { "type": "mxt:heal_target", "amount": 1 }
  ]
}
```

### mxt:chance

Runs `action` with probability `chance`, otherwise runs `fail_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Bi-entity action | **required** | The action run when the roll succeeds. |
| `chance` | Float | **required** | The probability, `0`..`1`. |
| `fail_action` | Bi-entity action | `mxt:no_op` | The action run when the roll fails. |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:damage_target", "amount": 4 },
  "fail_action": { "type": "mxt:heal_target", "amount": 1 }
}
```

A `chance` outside `0`..`1` is refused at load. `0` means `action` never runs, `1` means it always does.

### mxt:if_else

Runs `if_action` when the bi-entity condition passes, otherwise runs `else_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Bi-entity condition | **required** | The condition to test. |
| `if_action` | Bi-entity action | **required** | The action run when the condition passes. |
| `else_action` | Bi-entity action | `mxt:no_op` | The action run when the condition fails. |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:can_see" },
  "if_action": { "type": "mxt:damage_target", "amount": 8 }
}
```

### mxt:choice

Picks one entry from a weighted list and runs it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Entry array | **required** | The candidate entries. |

Every entry is a weighted wrapper around a nested action:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Bi-entity action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight. |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "value": { "type": "mxt:heal_target", "amount": 2 }, "weight": 3 },
    { "value": { "type": "mxt:damage_target", "amount": 2 }, "weight": 1 }
  ]
}
```

A larger weight is picked more often. An entry whose `weight` is `0` or less is never picked, and a negative weight counts as `0`; when the whole table adds up to `0`, one entry is drawn uniformly instead. A bad weight does not silence the whole table.

## Action Types

### mxt:mount

Makes the actor start riding the target.

No fields.

```json
{ "type": "mxt:mount" }
```

### mxt:damage_target

Damages the target and records the actor as the attacker, so kill credit and aggro follow them; both layers of the [damage system](/en/technical/damage) apply.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | The damage amount. |
| `damage_type` | Damage type id | not declared | The source type this hit is built with. |
| `element` | Element id, or a list of `#element tag` entries | `[]` | The element this hit is declared as. |

```json
{
  "type": "mxt:damage_target",
  "amount": "8 + level",
  "damage_type": "minecraft:magic"
}
```

Settled on the server only. A non-finite `amount`, or one of `0` or less, means the hit does not happen at all.

With only `element` written, the first damage type that element claims is taken as `damage_type`; a `#element tag` gives nothing to infer a type from, so `damage_type` must be written yourself. With both written, the **first use** of this strike checks that the element really claims that type - a mismatch logs one line for each side - and the hit is still dealt as the declared `damage_type`.

### mxt:heal_target

Heals the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | The healing amount. |

```json
{ "type": "mxt:heal_target", "amount": 2 }
```

Does nothing when the target is not a living entity, or when `amount` is not finite or is `0` or less.

### mxt:transfer_resource

Moves an amount of a [resource](../../json/resource.md) from the actor to the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | Resource id | **required** | The resource to move. |
| `amount` | Number provider | **required** | How much to request. |

```json
{ "type": "mxt:transfer_resource", "resource": "example:qi", "amount": 10 }
```

Does nothing when `amount` is not finite or is `0` or less. The amount actually moved is the smallest of three: what the actor currently holds, `amount`, and the target's maximum minus the target's current value. A result of `0` or less means the whole thing does not happen, and the actor is not charged at all. The same is true when the target has no definition for that resource, or that definition yields no maximum.

### mxt:add_velocity

Adds velocity to the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | Float | `0` | The vector's X component. |
| `y` | Float | `0` | The vector's Y component. |
| `z` | Float | `0` | The vector's Z component. |
| `reference` | `position` / `rotation` | `position` | The frame of reference the vector is expressed in. |
| `client` | Boolean | `true` | Whether the client runs it. |
| `server` | Boolean | `true` | Whether the server runs it. |
| `set` | Boolean | `false` | Sets the velocity outright instead of adding to it. |

```json
{ "type": "mxt:add_velocity", "y": 1.2, "reference": "rotation" }
```

With `reference` on `position` (the default) the vector is resolved along the direction from the actor to the target; on `rotation` it is resolved along the actor's view direction. Writing `false` for both `client` and `server` does nothing. After it runs, the target is marked as having a changed velocity and the client updates with it.

### mxt:teleport

Moves one end of the pair to the other end's position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `teleport_actor` | Boolean | `false` | Moves the actor to the target. |
| `teleport_target` | Boolean | `true` | Moves the target to the actor. |
| `rotate` | Boolean | `false` | Copies the facing over as well. |

```json
{ "type": "mxt:teleport", "teleport_target": true, "rotate": true }
```

Writing `true` for both swaps the two positions; writing `false` for both does nothing. It runs on the server only. The actor's side uses **the activation's own place**, which for a talisman or a display stand is where the talisman or the stand is. With `rotate` on `true`, the entity that was moved takes the other one's facing.

### mxt:actor_action

Applies an [entity action](entity_action_types.md) to the actor.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Entity action | **required** | The action run on the actor. |

```json
{ "type": "mxt:actor_action", "action": { "type": "mxt:heal", "amount": 2 } }
```

Note that `action` takes an entity action, not a bi-entity action.

### mxt:target_action

Applies an [entity action](entity_action_types.md) to the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Entity action | **required** | The action run on the target. |
| `use_target_position` | Boolean | `false` | Makes position-placing actions land at the target's own position. |

```json
{
  "type": "mxt:target_action",
  "action": { "type": "mxt:spawn_lightning" },
  "use_target_position": true
}
```

An entity action nested in `mxt:actor_action` or `mxt:target_action` uses **the activation's own place** by default: an action that places something lands where the activation happened, which for a talisman or a display stand is the talisman or the stand (`mxt:spawn_lightning`, `mxt:explode`, `mxt:spawn_particles`, `mxt:spawn_effect_cloud`, `mxt:play_sound` and `mxt:block_action` all work this way). So "drop one bolt on each selected target" needs `"use_target_position": true`, or every bolt lands at the actor's or the talisman's feet. Actions that read the entity are unaffected by the same value.
