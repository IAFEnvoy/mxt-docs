---
title: Realm Instance (realm_instance)
description: "Define a secret realm instance: its target dimension, duration, maximum member count and enter and exit behaviour."
---

# Realm Instance (realm_instance)

A Realm Instance defines a separate secret realm that players enter with a Realm Token: which dimension it targets, how long it lasts, how many players may be inside, and what happens when a player enters or leaves.

## File Location

Realm Instance JSON files go in `data/<namespace>/mxt/realm_instance/` within your data pack.

**Purpose**: Realm instance strategies.

The filename corresponds to its ID. For example, `data/example/mxt/realm_instance/trial_realm.json` has the ID `example:trial_realm`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dimension` | Identifier | none | The target dimension; when it is omitted the entry logic decides. |
| `duration_ticks` | Long | `0` | The instance duration; `0` means it does not expire automatically. |
| `max_members` | Integer | `1` | The maximum number of members, range `1..100000`. |
| `enter_action` | Entity Action | `mxt:no_op` | The entry behaviour. |
| `exit_action` | Entity Action | `mxt:no_op` | The exit behaviour. |

## Example

```json
{
  "dimension": "minecraft:the_end",
  "duration_ticks": 12000,
  "max_members": 4,
  "enter_action": { "type": "mxt:apply_effect", "effect": "minecraft:night_vision", "duration_ticks": 12000 },
  "exit_action": { "type": "mxt:heal", "amount": 4 }
}
```

::: warning Work in Progress

The runtime dimension loader currently provides a fallback LevelStem load/unload capability; it does not yet automatically take over the creation of every secret realm instance.

:::

