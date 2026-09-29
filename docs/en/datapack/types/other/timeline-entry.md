---
title: Timeline Entries (timeline_entry_type)
description: Every built-in entry, field, default and wait length conversion rule of the mxt:timeline_entry_type tribulation beats.
---

# Timeline Entries (timeline_entry_type)

## `timeline_entry_type`

The `timeline` array of a [tribulation](../../json/tribulation.md) holds these entries. Each one writes a beat id in its `type` to select it; a data pack can only pick an existing beat and cannot add new ones.

`timeline` is a running cursor: when a tribulation starts the whole timeline is copied onto the entity undergoing it, and from then on each tick consumes the beat the cursor sits on, advancing one beat once it finishes. The cursor position is saved as well (`mxt:branch` can move it to any beat), while `difficulty_scale` and the two ending behaviours are not copied and are still read from the definition. The cursor walking off the end runs `success_action`, and a beat that fails runs `fail_action`. The beats are copies, so `/reload` cannot change a tribulation that is already running.

Every beat is asked once whether it can run now, before the whole run starts. An `mxt:idle` whose duration does not resolve, an `mxt:wait_for` whose `timeout` does not resolve or does not come out positive, and a `mxt:branch` whose target is out of range all get the whole start rejected outright, rather than failing halfway through.

```json
{
  "timeline": [
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 12}},
    {"type": "mxt:idle", "duration": 40},
    {"type": "mxt:wait_for", "condition": {"type": "mxt:exposed_to_sky"}},
    {"type": "mxt:branch", "condition": {"type": "mxt:health", "comparison": "<", "compare_to": 10}, "if_true": 3}
  ]
}
```

### `mxt:action`

Runs one entity action and finishes on the same tick.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | `EntityAction` | **required** | The action to run. |

```json
{"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 12}}
```

This is an instant beat: several neighbouring `mxt:action` beats all run in order within the same tick, so everything that happens in one tick does not have to be split across beats. `action` is any [entity action](../action/entity_action_types.md), so any action can be a beat.

### `mxt:idle`

Idles a number of ticks doing nothing.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `NumberProvider` | **required** | The number of ticks to idle. |

```json
{"type": "mxt:idle", "duration": 40}
```

The wait length is converted as `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` and settled **once when this beat begins**, never recomputed afterwards: a random duration is rolled once, and the ambient aura changing mid-wait cannot stretch or shorten a wait that has already started.

### `mxt:wait_for`

Evaluated once per tick, finishing only once the condition holds.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **required** | The condition being waited for. |
| `timeout` | `NumberProvider` | none | The number of ticks of a deadline wait. |
| `on_timeout` | Enum | `fail` | What happens when it runs out: `finish` moves straight on, `fail` fails the whole tribulation. |

```json
{"type": "mxt:wait_for", "condition": {"type": "mxt:exposed_to_sky"}, "timeout": 600, "on_timeout": "fail"}
```

`timeout` is a **deadline** rather than the length of this beat, so it is settled from `timeout` alone, **without `difficulty_scale` and without looking at the ambient aura** — difficulty should not decide how long a player has to meet the condition. With no `timeout` written, a condition that never holds parks the whole run on this beat (it neither advances nor fails), so the condition has to be reachable.

`condition` is an [entity condition](../condition/entity_condition_types.md) and accepts a list as an implicit AND, exactly like condition fields elsewhere; `mxt:branch`'s `condition` is the same type.

### `mxt:branch`

Moves the running cursor to another beat according to a condition, and finishes on the same tick.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **required** | The condition deciding which branch to take. |
| `if_true` | Integer | none | The index to jump to when the condition holds. |
| `if_false` | Integer | none | The index to jump to when the condition does not hold. |

```json
{"type": "mxt:branch", "condition": {"type": "mxt:health", "comparison": "<", "compare_to": 10}, "if_true": 3}
```

`if_true` / `if_false` are **absolute indices**, counted from the first beat of the timeline the run copied (`0`-based); jumping backwards is allowed, and nothing stops a "go back and take another round while the health is low" loop (the condition has to settle on its own). An out-of-range index is rejected **at start**, so a branch pointing at the wrong beat cannot surface only after the player has already paid the price of the breakthrough. A branch that is not written advances one beat as usual.

At most 1024 beats are consumed per tick: a loop that jumps back on itself and contains no wait logs a WARN and hands that beat back to the next tick instead of wedging the server thread. A real loop always waits at some beat (`mxt:idle` / `mxt:wait_for`), so a normal definition never reaches this limit.
