---
title: tribulation (Tribulation)
aside: false
---

# tribulation (Tribulation)

File location: `data/<namespace>/mxt/tribulation/<path>.json`

**Purpose**: A tribulation: its start gate, the beats of its timeline, and its two endings.

A tribulation is: the gate that starts it, the beats of its timeline, the difficulty multiplier for every wait, and the two endings.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `tribulation.mxt.<namespace>.<path>` | Optional display name. When omitted, the default key in the left column is used. |
| `description` | Text Component | `tribulation.mxt.<namespace>.<path>.description` | Optional description. When omitted, the default key in the left column is used; it is stored and read, but nothing draws it yet. |
| `condition` | `EntityCondition` | `mxt:always` | Start condition, evaluated **once** when the tribulation is started; failing it means this attempt does not start. |
| `timeline` | array | **required** | The timeline the tribulation consumes, at least one beat. |
| `difficulty_scale` | `NumberProvider` | `1` | Difficulty multiplier, applied to every wait length. |
| `windup` | `NumberProvider` | `0` | Wind-up before the start: ticks spent idling before the timeline starts being consumed, resolved by exactly the same rule as a wait length and settled the moment the run starts. Players see the seconds left on the action bar while it counts down; `0` means no wind-up. |
| `darken_sky` | `bool` | `true` | Whether the sky darkens for nearby players while this tribulation runs (the player undergoing it included, out to 160 blocks). |
| `success_action` | `EntityAction` | `mxt:no_op` | Success behaviour once the timeline has been walked to the end. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Failure behaviour when a beat cannot continue. |

`condition` is an **extra gate**, not an event trigger: what decides whether a tribulation opens at all is the place that references it (the `tribulation` of a `realm_stage`), and this field only decides whether that start is accepted.

Each entry of `timeline` is a beat. How the running cursor moves, which fields each beat reads, how a wait length is converted and what is checked before the start are on [Tribulation Beat Types](/en/datapack/types/other/timeline-entry).

`windup` is the **wind-up before the start**: after the tribulation is accepted it idles for that many ticks before the first beat begins. It goes through the same resolution rule as a wait length (`windup × difficulty_scale × max(0, 1 + aura_tribulation_modifier)`; writing `0`, or resolving to a non-positive number, means no wind-up) and is settled **once, the moment the run starts**: from then on it only counts down one per tick, so the countdown a player sees is the number of ticks that will really pass, and an aura change in the middle cannot stretch it. No beat is consumed and no state is written during the wind-up, but the tribulation already counts as running — a second start is still refused, `status` reports "still winding up, N ticks left", and `darken_sky` already applies. The ticks left are saved and synced with the attachment, so leaving the world and coming back resumes the countdown instead of starting it over.

Besides that timeline, the tribulation attachment keeps only **one state slot for the current beat**: only one beat runs at a time, so there is no storage table, just one slot. Temporary numbers a beat has to remember across ticks go here — the ticks left of an `mxt:idle` are the first example (its length is settled once when the beat begins by the rule above, and from then on it decrements one per tick, ending on the tick it reaches 1). The slot is saved and synced with the attachment; an empty slot means this beat has not begun, and "this beat has begun" is also saved, so a restart does not count the same beat's start twice; moving past a beat discards the slot and the next beat builds its own. These numbers are read and written by the runtime and are out of reach of a data pack: `mxt:entry_began` (the marker for "this beat has begun and carries no numbers of its own"), `mxt:idle_countdown` (ticks left of an idle beat) and `mxt:wait_countdown` (ticks left of a deadline wait) are internal state kinds, and `mxt:modify_storage` refuses them all.

When you do not want to wait out a breakthrough in game and just want to run the tribulation, use `/mxt tribulation start <id>` (a target entity may be named); `status` prints the current beat's state in its saved spelling, for example `{"remaining":37,"type":"mxt:idle_countdown"}`, which is the most direct window on timing while you tune it. See [Commands](/en/player-guide/commands).

While a tribulation runs, the sky darkens for nearby players automatically — the player undergoing it included, at the same strength as a vanilla wither (fog colour and lighting dimmed together, fading in over about 1 second and out over about 4), out to 160 blocks; writing `false` on `darken_sky` turns the sky off for the whole run. During the wind-up, players in that same range also see a countdown on the action bar (`Tribulation in 2.4 s`, one decimal place). Both of these are done by the client itself: the client reads the tribulation attachment that has already been synced, plus the definition that attachment points at, so the server takes no part and no boss bar is needed — writing these two fields is all an author has to do, and the client follows on its own.

```json
{
  "timeline": [
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 12 } },
    { "type": "mxt:idle", "duration": 40 },
    { "type": "mxt:wait_for", "condition": { "type": "mxt:exposed_to_sky" } },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "palette": ["#7A5CFF", "#66CCFF"], "alpha": 0.45, "thickness": 1.6 } }
  ],
  "success_action": { "type": "mxt:add_resource", "resource": "example:true_essence", "amount": 10 }
}
```

A staged tribulation: wait with a deadline for the player to be exposed to the sky, then split into two branches by health, where `if_true: 3` on the `mxt:branch` jumps straight to the 4th beat (`0`-based) and skips the 3rd.

```json
{
  "timeline": [
    { "type": "mxt:wait_for", "condition": { "type": "mxt:exposed_to_sky" }, "timeout": 600, "on_timeout": "fail" },
    { "type": "mxt:branch", "condition": { "type": "mxt:health", "comparison": "<", "compare_to": 10 }, "if_true": 3 },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 4 } },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 12 } }
  ]
}
```

## `mxt:spawn_lightning`

The bolt is an entity action; its fields, defaults, colour and gradient syntax, and the arguments of `/mxt lightning`, are on [Entity Action Types](/en/datapack/types/action/entity_action_types).
