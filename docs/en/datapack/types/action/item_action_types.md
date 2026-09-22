---
title: Item Action Types
description: Every built-in item action type registered by the mod, with the JSON fields that each type accepts.
---

# Item Action Types

An **item action** operates on a single item stack. The holder entity and the stack are supplied by whatever data table declares the action, so the action itself only describes what to do with the stack it is given.

Item actions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom action types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the tables below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

An action is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:damage_item",
  "amount": 1
}
```

Because actions are used as values inside other data tables, the same structure usually appears nested under a field such as `item_action`:

```json
"item_action": {
  "type": "mxt:consume_item",
  "count": 1
}
```

Anywhere an item action is expected, an array of actions is also accepted. The array is shorthand for `mxt:sequence` and runs its entries in order:

```json
"item_action": [
  { "type": "mxt:damage_item", "amount": 1 },
  { "type": "mxt:cooldown", "ticks": 40 }
]
```

::: info Where Item Actions Run
An item action needs a stack to act on, so it is normally reached through the table that already exposes one — for example the [entity action](entity_action_types.md) `mxt:equipped_item_action`, which also supplies the equipment slot. [Item conditions](../condition/item_condition_types.md) are the matching predicate family.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the tables here.
:::

## Meta Types

Meta actions control whether, how often and in what order other item actions run. They are the actions that take other actions as fields.

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:no_op` | — | Does nothing; this is the default action for optional action fields. |
| `mxt:js` | `id`, `params?` | Calls an item action handler that was registered through the KubeJS bridge. |
| `mxt:sequence` | `actions` | Runs a list of item actions in order. |
| `mxt:chance` | `action`, `chance`, `fail_action?` | Runs `action` with probability `chance`, otherwise runs `fail_action`. |
| `mxt:if_else` | `condition`, `if_action`, `else_action?` | Runs `if_action` when the item condition passes, otherwise `else_action`. |
| `mxt:choice` | `actions` | Picks one entry from a weighted list and runs it. |

Each entry of a `choice` list is a weighted wrapper around a nested action:

| Entry Field | Type | Default | Description |
|-------------|------|---------|-------------|
| `element` | Item action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often. |

## Action Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:damage_item` | `amount` | Adds durability damage to the stack, clamped to its maximum damage. |
| `mxt:consume_item` | `count` | Shrinks the stack by the given number of items. |
| `mxt:charge_artifact` | `aura`, `amount`, `capacity?` | Adds to **one named aura's** stored amount on an artifact stack; `aura` (a concrete aura) and `amount` are both required. The ceiling is the `spirit_capacity` the stack's `artifact` declares for that aura; `capacity` (default `0`) is only the **fallback**, used when no definition claims the stack or when the definition does not declare that aura. |
| `mxt:consume_health` | `amount` | Deals one hit of vanilla **magic damage** (`damageSources().magic()`) to the holder — the "pay in blood" shape. Resistance and protection enchantments reduce it as usual, and a holder that cannot be damaged at all (creative mode) loses nothing. **It neither pre-checks nor refuses**: whether the price is affordable is up to the table that declared it (an artifact writes its claim price in `claim_action`, and this action with `amount` `4` is exactly what `claim_action` defaults to when the field is not written, so an artifact that says nothing charges four points of health to claim). |
| `mxt:cooldown` | `ticks` | Puts the stack on the holder's vanilla item cooldown for the given number of ticks. |
| `mxt:remove_enchantment` | `enchantment?`, `level?`, `reset_repair_cost?` | Removes or lowers enchantments on the stack and optionally resets its repair cost. |
| `mxt:add_enchantment` | `enchantments`, `override?` | Adds or upgrades enchantments on the stack. |
| `mxt:merge_components` | `components` | Merges a vanilla data component patch into the stack. |

::: info Nested Values
`mxt:if_else` takes an [item condition](../condition/item_condition_types.md). `mxt:add_enchantment` accepts `enchantments` as a map from an enchantment id to a level, and `override` decides whether an existing level may be replaced. `mxt:remove_enchantment` takes an enchantment or a list of them, limits the removal with `level`, and `mxt:merge_components` takes a vanilla data component patch.
:::
