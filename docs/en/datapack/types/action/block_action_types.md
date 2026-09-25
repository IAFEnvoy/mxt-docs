---
title: Block Action Types
description: Every built-in block action type registered by the mod, with the JSON fields that each type accepts.
---

# Block Action Types

A **block action** operates on a single block position in a level. The level and position are supplied by whatever data table declares the action, and some callers also supply a facing direction, so the action itself only describes what to do at that position.

Block actions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom action types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the tables below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

An action is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:set_block",
  "block": "minecraft:stone"
}
```

Because actions are used as values inside other data tables, the same structure usually appears nested under a field such as `block_action`:

```json
"block_action": {
  "type": "mxt:break_block",
  "drop": false
}
```

Anywhere a block action is expected, an array of actions is also accepted. The array is shorthand for `mxt:sequence` and runs its entries in order:

```json
"block_action": [
  { "type": "mxt:break_block" },
  { "type": "mxt:set_block", "block": "minecraft:air" }
]
```

::: info Mixing With Other Families
Several table types declare both block fields and other behaviour fields, and an [entity action](entity_action_types.md) can wrap a block action with `mxt:block_action`. Block conditions live in their own family on the [block condition types](../condition/block_condition_types.md) page.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the tables here.
:::

## Meta Types

Meta actions control whether, how often, in what order and at which position other block actions run. They are the actions that take other actions as fields.

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:no_op` | — | Does nothing; this is the default action for optional action fields. |
| `mxt:js` | `id`, `params?` | Calls a block action handler that was registered through the KubeJS bridge. |
| `mxt:sequence` | `actions` | Runs a list of block actions in order. |
| `mxt:chance` | `action`, `chance`, `fail_action?` | Runs `action` with probability `chance`, otherwise runs `fail_action`. |
| `mxt:if_else` | `condition`, `if_action`, `else_action?` | Runs `if_action` when the block condition passes, otherwise `else_action`. |
| `mxt:choice` | `actions` | Picks one entry from a weighted list and runs it. |
| `mxt:offset` | `action`, `x?`, `y?`, `z?` | Applies a nested action at a relative block offset. |

Each entry of a `choice` list is a weighted wrapper around a nested action:

| Entry Field | Type | Default | Description |
|-------------|------|---------|-------------|
| `value` | Block action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often, a weight of `0` or less is never picked, and an all-zero table picks uniformly. |

## Action Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:set_block` | `block` | Sets the block at the acted position to the block's default state. |
| `mxt:break_block` | `drop?` | Breaks the block at the acted position, optionally dropping its loot. |
| `mxt:change_aura` | `aura` | Changes the authoritative chunk aura attachment at the acted position; nothing is changed on the client. |
| `mxt:schedule_tick` | `delay` | Schedules a tick for the current block after the given delay. |
| `mxt:bonemeal` | `effect?` | Applies bone meal to the block, optionally showing the vanilla growth particles and sound. |
| `mxt:light_up` | — | Sets the block's vanilla `lit` property to `true` when the block has that property. |
| `mxt:explode` | `power`, `interaction?`, `indestructible?`, `create_fire?` | Creates an explosion at the acted position. |
| `mxt:spawn_entity` | `entity_type`, `tag?`, `entity_action?` | Spawns an entity at the acted block position and applies an optional entity action to it. |

::: info `mxt:change_aura`
`aura` is a map from a [resource](../../json/resource.md) to a [number provider](../number_provider_types.md), so one action can change several resource pools at once. The change is applied only on the server side.
:::

::: info Nested Values
`mxt:if_else` takes a [block condition](../condition/block_condition_types.md). `mxt:explode` uses `indestructible` to protect matching blocks and accepts `interaction` to choose the vanilla explosion interaction, for example `mob` or `none`. `mxt:spawn_entity` accepts `tag` as NBT written into the entity and an [entity action](entity_action_types.md) that runs on the spawned entity.
:::
