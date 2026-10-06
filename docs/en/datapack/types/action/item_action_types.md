---
title: Item Actions (item_action_type)
description: Every built-in item action type registered by the mod, with the JSON fields that each type accepts.
---

# Item Actions (item_action_type)

An **item action** operates on a single item stack. The holder entity and the stack are supplied by whatever definition declares the action, so the action itself only describes what to do with the stack it is handed.

Item actions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` is written on the action object, side by side with its fields, and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom action types — see the [KubeJS API](../../../kubejs/api-reference.md).

```json
{
  "type": "mxt:damage_item",
  "amount": 1
}
```

Actions are normally nested as a value under a field of another definition, such as `item_action`:

```json
"item_action": {
  "type": "mxt:consume_item",
  "count": 1
}
```

Anywhere an item action is expected, an array is also accepted. The array is shorthand for [`mxt:sequence`](#mxt-sequence) and runs its entries in order:

```json
"item_action": [
  { "type": "mxt:damage_item", "amount": 1 },
  { "type": "mxt:cooldown", "ticks": 40 }
]
```

Almost every action field is optional, and its default is `mxt:no_op`: a miss such as writing `condition` but forgetting `action` is not reported at load, that entry simply does nothing.

::: info Where Item Actions Run
An item action needs a stack to act on, so it is normally reached through a table that already supplies one — for example the [entity action](entity_action_types.md) `mxt:equipped_item_action`, which also supplies the equipment slot. Without a stack the action does not run. [Item conditions](../condition/item_condition_types.md) are the matching predicate family.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the tables here.
:::

## Meta Actions

Meta actions control whether other item actions run, how often, and in what order. They are the actions that take other actions as fields.

| Type | Fields | Description |
| --- | --- | --- |
| `mxt:no_op` | — | Does nothing; this is the default action for optional action fields. |
| `mxt:js` | `id`, `params?` | Calls an item action handler that was registered through the KubeJS bridge. |
| `mxt:sequence` | `actions` | Runs a list of item actions in order. |
| `mxt:chance` | `action`, `chance`, `fail_action?` | Runs `action` with probability `chance`, otherwise runs `fail_action`. |
| `mxt:if_else` | `condition`, `if_action`, `else_action?` | Runs `if_action` when the item condition passes, otherwise `else_action`. |
| `mxt:choice` | `actions` | Picks one entry from a weighted list and runs it. |

### `mxt:no_op`

Does nothing.

It has no fields; the whole thing is written as `{"type": "mxt:no_op"}`. Every optional item action field takes it as its default, and it is also what you write to explicitly switch off an action that was inherited.

```json
"claim_action": { "type": "mxt:no_op" }
```

### `mxt:js`

Calls an item action handler that was registered through the KubeJS bridge.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Handler id. |
| `params` | JSON object | `{}` | Arguments passed to the handler. |

```json
{
  "type": "mxt:js",
  "id": "example:my_item_action",
  "params": { "amount": 3 }
}
```

The callback runs on the server. When the callback is missing or throws, the action does nothing and logs one warning.

### `mxt:sequence`

Runs a list of item actions in order.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | List of item actions | **required** | Entries to run in order. |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:damage_item", "amount": 1 },
    { "type": "mxt:cooldown", "ticks": 40 }
  ]
}
```

The list runs through once in written order, and what one entry does never affects the next.

### `mxt:chance`

Runs `action` with probability `chance`, otherwise runs `fail_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Item action | **required** | Runs when the roll succeeds. |
| `chance` | Double | **required** | Probability of success, `0.0`–`1.0`; a value outside that range is refused at load. |
| `fail_action` | Item action | `mxt:no_op` | Runs when the roll fails. |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:damage_item", "amount": 1 }
}
```

The roll happens once, and exactly one of `action` and `fail_action` runs.

### `mxt:if_else`

Runs `if_action` when the item condition passes, otherwise `else_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Item condition | **required** | The test. |
| `if_action` | Item action | **required** | Runs when the condition passes. |
| `else_action` | Item action | `mxt:no_op` | Runs when the condition fails. |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  "if_action": { "type": "mxt:add_enchantment", "enchantments": { "minecraft:sharpness": 1 } }
}
```

At most one of the two branches runs. The condition sees the same stack and holder as the action itself.

### `mxt:choice`

Picks one entry from a weighted list and runs it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | List of weighted entries | **required** | The candidates; entry shape is in the table below. |

Each entry is a weighted wrapper around a nested action:

| Entry field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Item action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often. |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "weight": 3, "value": { "type": "mxt:consume_item", "count": 1 } },
    { "weight": 1, "value": { "type": "mxt:damage_item", "amount": 1 } }
  ]
}
```

An entry with a weight of `0` or less can never be picked, unless the weights in the whole table also add up to `0` (all zeroes or negatives) — then it falls back to picking uniformly, so the table always produces a result. The picked entry runs once and no other entry runs at all.

## Action Types

| Type | Fields | Description |
| --- | --- | --- |
| `mxt:damage_item` | `amount` | Adds durability damage to the stack, clamped to its maximum damage. |
| `mxt:consume_item` | `count` | Shrinks the stack by the given count. |
| `mxt:charge_artifact` | `aura`, `amount`, `capacity?` | Adds to **one named aura's** stored amount on an artifact stack; `aura` (a concrete aura) and `amount` are both required. The ceiling is the `spirit_capacity` the `artifact` the stack matches declares for that aura; `capacity` (default `0`) is only the **fallback**: use it as the ceiling when no definition claims the stack, or when the definition does not declare that aura. |
| `mxt:consume_health` | `amount` | Deals one hit of vanilla **magic damage** to the holder — the "pay in blood" shape. It neither pre-checks nor refuses; whether the price is affordable is up to the table that declared it. |
| `mxt:cooldown` | `ticks` | Puts the stack on the holder's vanilla item cooldown for the given number of ticks. |
| `mxt:remove_enchantment` | `enchantment?`, `level?`, `reset_repair_cost?` | Removes or lowers enchantments on the stack and can reset its repair cost. |
| `mxt:add_enchantment` | `enchantments`, `override?` | Adds or upgrades enchantments on the stack. |
| `mxt:merge_components` | `components` | Merges a vanilla data component patch into the stack. |
| `mxt:add_ability` | `abilities` | Merges abilities into the stack's `mxt:item_abilities` data component: an entry that is already written is not written a second time, and the entries already in the component are all kept. It is that component's **dedicated producer**. |

### `mxt:damage_item`

Adds durability damage to the stack, clamped to its maximum damage.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | Damage points to add, rounded to an integer and then at least `1`. |

```json
"item_action": { "type": "mxt:damage_item", "amount": 1 }
```

A stack that cannot be damaged (no vanilla durability) is skipped outright and takes no damage at all. A value that evaluates to something non-finite or `0` or less is skipped the same way. A fraction is rounded first and then compared against `1`, so `0.2` still costs one point.

### `mxt:consume_item`

Shrinks the stack by the given count.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | Number provider | **required** | Count to subtract, rounded to an integer and then at least `1`. |

```json
"item_action": { "type": "mxt:consume_item", "count": 1 }
```

A value that evaluates to something non-finite or `0` or less does nothing. Clamping is left to the stack itself: a shortfall can be taken down to `0`, which empties that slot.

### `mxt:charge_artifact`

Adds to one named aura's stored amount on an artifact stack.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura id | **required** | The **concrete** aura to pour into, written as an id; no `#tag` and no array. |
| `amount` | Number provider | **required** | How much to pour; a value that evaluates to something non-finite or `0` or less does nothing. |
| `capacity` | Number provider | `0` | **Fallback** ceiling, used only when no definition claims this stack, or when the definition that claims it gives no valid ceiling for this aura. |

```json
"item_action": {
  "type": "mxt:charge_artifact",
  "aura": "example:spirit_qi",
  "amount": 10
}
```

The ceiling is taken first from the `spirit_capacity` the `artifact` matching this stack declares for that aura; when the definition declares one but it evaluates to something non-finite or `0` or less, it falls back to `capacity`, and when `capacity` is equally invalid the ceiling is `0`, nothing fits and nothing happens silently. The effective ceiling is the declared ceiling times the nurture bonus `1 + 0.5 × nurture`, **rounded down** after evaluation, so filling can exceed the declared value by up to 1.5 times. The amount actually taken is the smaller of `amount` and "ceiling minus stored", the stored amount only ever grows, and any part of a single take that goes past the ceiling is discarded — it never spills into another aura.

This action needs a server and a holder, and returns immediately without a holder. For every point really taken, nurture rises by "the amount taken ÷ this time's effective ceiling", and it only ever goes up.

### `mxt:consume_health`

Deals one hit of vanilla magic damage to the holder (`damageSources().magic()`).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | Damage points. |

```json
"claim_action": { "type": "mxt:consume_health", "amount": 4 }
```

Resistance and protection enchantments reduce it as usual, and a holder that cannot be damaged at all, such as one in creative mode, loses no health. A value that evaluates to something non-finite or `0` or less does nothing. A holder that is not a living entity, or one that is not on the server, is skipped outright.

Note that it neither pre-checks nor refuses. Whether the price is affordable is up to the table that declared it, and health is taken even when there is too little. An artifact's claim price is written in `claim_action`, and when `claim_action` is not written its default is exactly this action with an `amount` of `4`, so an artifact that says nothing charges four points of health to claim.

### `mxt:cooldown`

Puts the stack on the holder's vanilla item cooldown.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ticks` | Integer | **required** | Cooldown length, in ticks. |

```json
"item_action": { "type": "mxt:cooldown", "ticks": 40 }
```

The cooldown is only applied when the holder is a player, the stack is not empty and `ticks` is greater than `0`; every other case silently does nothing.

### `mxt:remove_enchantment`

Removes or lowers enchantments on the stack and can reset its repair cost.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enchantment` | List of enchantment ids | `[]` | The enchantments to handle; a single one or a list of them both work. An empty list removes nothing. |
| `level` | Integer | none | Only handles enchantments whose current level is **exactly** this; leave it out to handle any level, which strips the enchantment entirely. |
| `reset_repair_cost` | Boolean | `false` | When `true`, sets the stack's repair cost to zero. |

```json
"item_action": {
  "type": "mxt:remove_enchantment",
  "enchantment": ["minecraft:mending"],
  "reset_repair_cost": true
}
```

Removal means writing the level as `0`, which is the same as dropping that entry. With `level` present only entries whose level matches exactly are touched, so writing `0`, or a level it does not currently have, leaves everything alone. Enchantment entries in the list that cannot be resolved are dropped with one log line, and the rest are handled as usual.

### `mxt:add_enchantment`

Adds or upgrades enchantments on the stack.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enchantments` | Map from enchantment id to level | **required** | The enchantments to add or upgrade. |
| `override` | Boolean | `false` | When `false`, a level is only replaced when the written one is higher; when `true`, it is replaced unconditionally. |

```json
"item_action": {
  "type": "mxt:add_enchantment",
  "enchantments": { "minecraft:sharpness": 5 }
}
```

With `override` `false` the current level and the new level are compared, and an equal or lower level is not written. The level written is the number written, with no extra clamping. An `enchantments` entry pointing at an enchantment that does not exist is reported at load and is not silently skipped.

### `mxt:merge_components`

Merges a vanilla data component patch into the stack.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `components` | Data component patch | **required** | The patch handed straight to the stack to merge. |

```json
"item_action": {
  "type": "mxt:merge_components",
  "components": {
    "minecraft:custom_name": "Spirit Blade"
  }
}
```

The patch merges under vanilla rules: a component that is written is overwritten or merged, and one that is not written stays as it is. This is the generic patch route; to write `mxt:item_abilities` specifically, use `mxt:add_ability`.

### `mxt:add_ability`

Merges abilities into the stack's `mxt:item_abilities` data component.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | List of ability ids | **required** | The abilities to write into the component; no `#tag`. |

```json
"claim_action": { "type": "mxt:add_ability", "abilities": ["example:sword_focus"] }
```

An entry that is already written is not written a second time, and the entries already in the component are all kept. An empty stack, or an empty `abilities` list, does nothing.

Besides the definition's own `abilities`, an item can carry abilities through the `mxt:item_abilities` data component (`{"abilities": ["example:foo"]}`): what the runtime reads is the **union of what the definition declares and what the component writes**, so two stacks claimed by one artifact definition can carry different abilities. The component stores **ability ids only** and takes no tags (tags are expanded on the definition's side, in its `abilities`), so every id written has to resolve in the ability registry, and entries that do not resolve are dropped. This action writes ids and reads the current registry, so a newly written id only takes effect at the point where the item is next read by the runtime.

::: info Nested Values
The `condition` of `mxt:if_else` takes an [item condition](../condition/item_condition_types.md). The `enchantments` of `mxt:add_enchantment` are a map from an enchantment id to a level. The `enchantment` of `mxt:remove_enchantment` takes one enchantment or a list of them, and `level` limits how far the removal goes. `mxt:merge_components` takes a vanilla data component patch.
:::
