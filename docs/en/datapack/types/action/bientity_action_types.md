---
title: Bi-entity Action Types
description: Every built-in bi-entity action type registered by the mod, with the JSON fields that each type accepts.
---

# Bi-entity Action Types

A **bi-entity action** operates on a pair of entities: an **actor** and a **target**. The pair is supplied by whatever data table declares the action, so the action itself only describes what to do with the two entities it is given.

Bi-entity actions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom action types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the tables below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

An action is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:damage_target",
  "amount": 4
}
```

Because actions are used as values inside other data tables, the same structure usually appears nested under a field such as `bientity_action`:

```json
"bientity_action": {
  "type": "mxt:actor_action",
  "action": {
    "type": "mxt:heal",
    "amount": 2
  }
}
```

The nested `action` of `mxt:actor_action` is an [entity action](entity_action_types.md), so it takes entity action ids; a bi-entity action id such as `mxt:heal_target` would be wrong in that position.

Anywhere a bi-entity action is expected, an array of actions is also accepted. The array is shorthand for `mxt:sequence` and runs its entries in order:

```json
"bientity_action": [
  { "type": "mxt:mount" },
  { "type": "mxt:heal_target", "amount": 1 }
]
```

::: info Field Types Are Shared
Fields that take a numeric value generally accept a [number provider](../number_provider_types.md) instead of a fixed number, so formulas and random values work everywhere a plain number does.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the tables here.
:::

## Meta Types

Meta actions control whether, how often and in what order other bi-entity actions run. They are the actions that take other actions as fields.

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:no_op` | — | Does nothing; this is the default action for optional action fields. |
| `mxt:js` | `id`, `params?` | Calls a bi-entity action handler that was registered through the KubeJS bridge. |
| `mxt:sequence` | `actions` | Runs a list of bi-entity actions in order. |
| `mxt:chance` | `action`, `chance`, `fail_action?` | Runs `action` with probability `chance`, otherwise runs `fail_action`. |
| `mxt:if_else` | `condition`, `if_action`, `else_action?` | Runs `if_action` when the bi-entity condition passes, otherwise `else_action`. |
| `mxt:choice` | `actions` | Picks one entry from a weighted list and runs it. |

Each entry of a `choice` list is a weighted wrapper around a nested action:

| Entry Field | Type | Default | Description |
|-------------|------|---------|-------------|
| `element` | Bi-entity action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often. |

## Action Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:mount` | — | Makes the actor start riding the target. |
| `mxt:damage_target` | `amount`, `damage_type?`, `element?` | Damages the target, crediting the actor as the attacker so kill credit and aggro follow them; both layers of the [damage system](../../../technical/damage.md) apply. The optional `damage_type` builds the source of this hit, and the optional `element` declares what the hit is (writing only `element` takes the first type that element claims; writing both checks on **first use** of the strike that the element really claims that type, logging one line per distinct mismatch). |
| `mxt:heal_target` | `amount` | Heals the target. |
| `mxt:transfer_resource` | `resource`, `amount` | Moves a [resource](../../json/resource.md) amount from the actor to the target, clamped so values never become negative or exceed the target's maximum. |
| `mxt:add_velocity` | `x?`, `y?`, `z?`, `reference?`, `client?`, `server?`, `set?` | Adds velocity to the target, or sets it when `set` is `true`; `reference` chooses the frame the vector is expressed in. |
| `mxt:teleport` | `teleport_actor?`, `teleport_target?`, `rotate?` | Moves either endpoint to the other endpoint's position: the target is moved to the actor by default, and the actor is moved to the target when `teleport_actor` is `true`. |
| `mxt:actor_action` | `action` | Applies an [entity action](entity_action_types.md) to the actor. |
| `mxt:target_action` | `action` | Applies an [entity action](entity_action_types.md) to the target. |

::: info Nested Values
`mxt:if_else` takes a [bi-entity condition](../condition/bientity_condition_types.md), and `mxt:actor_action` / `mxt:target_action` take [entity actions](entity_action_types.md).
:::

The `reference` field is specific to this action and accepts `position` (the default, resolving the vector in the direction from the actor to the target) or `rotation` (resolving it from the actor's view direction).
