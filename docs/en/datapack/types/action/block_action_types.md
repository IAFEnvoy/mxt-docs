---
title: Block Actions (block_action_type)
description: Every built-in block action type registered by the mod, and the JSON fields each type accepts.
---

# Block Actions (block_action_type)

A **block action** operates on one block position in the world. The level and the position are supplied by whatever definition declares the action, and some callers also supply a facing direction; the action itself only describes what to do at that position.

Block actions are a Java (built-in) registry: `type` ids are fixed, and a data pack can neither add entries to it nor remove them. `type` is written on the action object, side by side with its fields, and its value is one of the ids listed on this page, written with the `mxt` namespace. Adding a custom type means writing Java, or going through the KubeJS bridge — see the [KubeJS API](../../../kubejs/api-reference.md).

## Common Structure

An action is a JSON object: `type` names the built-in type and every remaining key is a field of that type.

```json
{
  "type": "mxt:set_block",
  "block": "minecraft:stone"
}
```

Actions are values inside other definitions, so they usually appear nested under a field such as `block_action`:

```json
"block_action": {
  "type": "mxt:break_block",
  "drop": false
}
```

Anywhere a block action is accepted, an array is accepted too. The array is shorthand for `mxt:sequence` and runs its entries in the order they are written:

```json
"block_action": [
  { "type": "mxt:break_block" },
  { "type": "mxt:set_block", "block": "minecraft:air" }
]
```

::: info Mixing With Other Families
Several table types declare block fields and other action fields at the same time; an [entity action](entity_action_types.md) can wrap a block action with `mxt:block_action`. Block conditions are a separate family — see [block condition types](../condition/block_condition_types.md).
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists a type's fields interactively, which is handy for checking field names without scrolling through the tables on this page.
:::

## Meta Types

Meta actions do not touch a block themselves. They decide whether another block action runs, which one runs, and at which position it runs.

### mxt:no_op

Does nothing and takes no fields. It is the default value of every optional action field.

```json
{ "type": "mxt:no_op" }
```

### mxt:js

Calls a block action handler that was registered through the KubeJS bridge. The script-side callback receives the `Level`, the `BlockPos`, `params` and the evaluation context.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The id written when the callback was registered with `MxtActions.block(...)`. |
| `params` | JSON object | Empty object | Passed to the callback as-is. |

```json
{
  "type": "mxt:js",
  "id": "example:my_block_action",
  "params": { "radius": 3 }
}
```

### mxt:sequence

Runs a group of block actions in order.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Block action array | **required** | The actions to run one after another. |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:light_up" },
    { "type": "mxt:schedule_tick", "delay": 10 }
  ]
}
```

### mxt:chance

Runs `action` with probability `chance`, otherwise runs `fail_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Block action | **required** | Runs when the roll succeeds. |
| `chance` | Number | **required** | Probability of success, from `0` to `1`. |
| `fail_action` | Block action | `mxt:no_op` | Runs when the roll fails. |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:bonemeal" },
  "fail_action": { "type": "mxt:break_block" }
}
```

A probability outside `0..1` is refused at load. The test is "a random number is less than `chance`", so `1` always succeeds and `0` never does.

### mxt:if_else

Runs `if_action` when the block condition passes, otherwise `else_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Block condition | **required** | The test. |
| `if_action` | Block action | **required** | Runs when the condition passes. |
| `else_action` | Block action | `mxt:no_op` | Runs when the condition fails. |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "if_action": { "type": "mxt:break_block" },
  "else_action": { "type": "mxt:light_up" }
}
```

### mxt:choice

Picks one entry from a weighted list and runs it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Array of weighted entries | **required** | Whichever entry is picked is the one that runs. |

Each entry has this shape:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Block action | **required** | The action that runs when the entry is picked. |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often, an entry with `≤0` is never picked, and a table where every entry is `0` picks one uniformly. |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "value": { "type": "mxt:light_up" }, "weight": 3 },
    { "value": { "type": "mxt:break_block" }, "weight": 1 }
  ]
}
```

### mxt:offset

Runs a nested action at a relative block offset.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Block action | **required** | The action to run at the offset position. |
| `x` | Integer | `0` | Offset along X. |
| `y` | Integer | `0` | Offset along Y. |
| `z` | Integer | `0` | Offset along Z. |

```json
{
  "type": "mxt:offset",
  "y": -1,
  "action": { "type": "mxt:break_block" }
}
```

## Action Types

### mxt:set_block

Sets the block at the acted position to that block's default state.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block` | Block ID | **required** | The block to place, in its default state. |

```json
{ "type": "mxt:set_block", "block": "minecraft:oak_log" }
```

Only takes effect on the server, and only when that position is loaded.

### mxt:break_block

Breaks the block at the acted position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `drop` | Boolean | `true` | Whether it drops its loot. |

```json
{ "type": "mxt:break_block", "drop": false }
```

### mxt:change_aura

Changes the aura stored in the chunk that contains the acted position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Map of aura id to number provider | **required** | Keys are [aura](../../json/aura.md) ids and values are [number providers](../number_provider_types.md): how much of that aura to add this time. |

```json
{
  "type": "mxt:change_aura",
  "aura": {
    "example:azure_aura": -20,
    "example:crimson_aura": "5 + level"
  }
}
```

::: info `mxt:change_aura`
Keys must be concrete aura ids; a `#tag` will not work. One action can change several aura pools at once. It is applied only on the server, and nothing changes on the client. If any value evaluates to a non-finite number, the whole change is dropped.
:::

### mxt:schedule_tick

Schedules one tick for the current block after the given delay.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `delay` | Integer | **required** | How many ticks to delay. |

```json
{ "type": "mxt:schedule_tick", "delay": 20 }
```

Only scheduled on the server, and only when that position is loaded.

### mxt:bonemeal

Applies bone meal to the block.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | Boolean | `true` | Whether to show the vanilla growth particles and sound. |

```json
{ "type": "mxt:bonemeal", "effect": false }
```

### mxt:light_up

Takes no fields. When the block has the vanilla `lit` property, it is set to `true`; a block without that property does nothing.

```json
{ "type": "mxt:light_up" }
```

### mxt:explode

Creates an explosion at the acted position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `power` | Number | **required** | Explosion power. |
| `interaction` | Vanilla explosion interaction type | `mob` | For example `mob` or `none`. |
| `indestructible` | Block condition | none | Matching blocks are protected from the explosion. |
| `create_fire` | Boolean | `false` | Whether the explosion leaves fire behind. |

```json
{
  "type": "mxt:explode",
  "power": 3.0,
  "interaction": "none",
  "indestructible": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "create_fire": false
}
```

When `power` is not finite, or is negative, nothing happens.

### mxt:spawn_entity

Spawns an entity at the acted block position and runs an optional entity action on it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity_type` | Entity type ID | **required** | Which entity to spawn. |
| `tag` | NBT compound tag | none | NBT written into the new entity. |
| `entity_action` | Entity action | `mxt:no_op` | Runs on the spawned entity. |

```json
{
  "type": "mxt:spawn_entity",
  "entity_type": "minecraft:zombie",
  "entity_action": { "type": "mxt:set_on_fire", "ticks": 100 }
}
```

Only spawned on the server, and only when that position is loaded. The spawn point is the centre of the block, not a corner.

::: info Nested Values
Only three fields take a value from another family: `condition` on `mxt:if_else` and `indestructible` on `mxt:explode` take a [block condition](../condition/block_condition_types.md), and `entity_action` on `mxt:spawn_entity` takes an [entity action](entity_action_types.md).
:::
