---
title: Tribulation (tribulation)
description: Define a tribulation that is gated by a condition, consumes a timeline of entries and runs success or failure behaviour.
---

# Tribulation (tribulation)

A Tribulation defines a heavenly trial: the gate that has to pass for it to start, the timeline it consumes, the difficulty multiplier, and the behaviour that runs on success or on failure.

## File Location

Tribulation JSON files go in `data/<namespace>/mxt/tribulation/` within your data pack.

**Purpose**: A tribulation: its start gate, the timeline it consumes, and its two endings.

The filename corresponds to its ID. For example, `data/example/mxt/tribulation/three_thunders.json` has the ID `example:three_thunders`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `condition` | Entity Condition | `mxt:always_true` | Evaluated once when the tribulation is started; the attempt is rejected when it fails. It is not an event trigger — what decides whether a tribulation is started at all is the `tribulation` field of a realm stage. |
| `timeline` | `List<Timeline Entry>` | **required** | The entries the run consumes, in order; at least one. |
| `difficulty_scale` | `NumberProvider` | `1` | The difficulty multiplier, applied to every wait. |
| `windup` | `NumberProvider` | `0` | The anticipation before the timeline starts: how many ticks the run counts itself in first, resolved through the same rule as every wait and settled when the run starts. `0` means no wind-up. |
| `darken_sky` | `bool` | `true` | Whether the sky darkens for nearby players while this tribulation lasts, the player undergoing it included. Purely a client-side reading of the synced definition. |
| `success_action` | Entity Action | `mxt:no_op` | Runs once the timeline is exhausted. |
| `fail_action` | Entity Action | `mxt:no_op` | Runs when an entry cannot continue. |

## `Timeline Entry`

The timeline is a **consumer queue**: starting a tribulation copies the whole list into the entity's attachment as a queue, and the consumer then works on the entry at its head, popping it once it is done — so what is stored is exactly the part of the run that is left, and there is no index to keep in step with a list. The run ends with `success_action` when the queue is empty, or with `fail_action` when an entry reports that it cannot continue. Because the entries are copies, `/reload` cannot change a run that is already under way; `difficulty_scale` and the two endings are still read from the definition.

| `type` | Field | Description |
|--------|-------|-------------|
| `mxt:action` | `action` (Entity Action, required) | Runs one behaviour and finishes on the same tick. |
| `mxt:idle` | `duration` (`NumberProvider`, required) | Waits that many ticks doing nothing. |
| `mxt:wait_for` | `condition` (Entity Condition, required) | Evaluated every tick; finishes once it holds. |

`mxt:action` is an instant entry: neighbouring `mxt:action` entries are consumed on the same tick, so everything that happens in one tick does not have to be split across entries. Every wait is resolved as `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` and settled **once, when its entry begins**: a random duration is drawn once, and an aura change cannot stretch a wait that is already running.

Each entry is asked once, before the run starts, whether it can run at all; an `mxt:idle` whose duration cannot be resolved makes the whole start fail, so a broken definition does not surface only after the player has paid for the breakthrough. `mxt:wait_for` has no timeout: a condition that never holds parks the run on that entry, so make sure it is reachable.

`windup` is the run counting itself in: the first beat begins only after that many ticks have passed. It is resolved through the same rule as every wait (`windup × difficulty_scale × max(0, 1 + aura_tribulation_modifier)`; `0`, or anything that does not resolve to a positive number, means no wind-up) and settled **once, when the run starts**, then only counted down — so the countdown a player watches is the number of ticks that will really pass. Nothing is consumed and no state is written during it, but the tribulation is already under way: a second start is still refused, `status` reports the ticks of wind-up that are left, and `darken_sky` already applies. What is left is saved and synced with the attachment, so leaving the world and coming back resumes the countdown instead of restarting it.

A run carries a **single state slot** next to the timeline: only one entry runs at a time, so there is one value rather than a store, and it is where an entry keeps the numbers it has to remember across ticks. `mxt:idle` is the first user — it settles its length when the beat begins and then counts the remaining ticks down in that slot. The slot is saved and synced with the attachment, and an empty slot means the current entry has not begun, which is why an entry's start is consumed exactly once. Content cannot read or write it: `mxt:entry_began` and `mxt:idle_countdown` are runtime kinds, and `mxt:modify_storage` refuses them.

To run one without waiting for a breakthrough, use `/mxt tribulation start <id>` (a target may be named), and `status` prints the current beat's state in its saved spelling, for example `{"remaining":37,"type":"mxt:idle_countdown"}` — the most direct way to watch a timeline while tuning it. See [Commands](../../player-guide/commands.md).

While a run is under way the sky darkens for everyone nearby, the player undergoing the tribulation included: the same full-screen dimming a wither causes, fading in over about a second and out over about four, reaching 160 blocks. `darken_sky: false` turns that off for the whole run. During the wind-up those same players also get the countdown on the action bar (`Tribulation in 2.4 s`, one decimal). Both are read on the client from the synced attachment and the definition it points at, so they need no boss bar and nothing from the server; the two fields above are the whole configuration.

## Example

```json
{
  "timeline": [
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 12 } },
    { "type": "mxt:idle", "duration": 40 },
    { "type": "mxt:wait_for", "condition": { "type": "mxt:exposed_to_sky" } },
    {
      "type": "mxt:action",
      "action": { "type": "mxt:spawn_lightning", "palette": ["#7A5CFF", "#66CCFF"], "alpha": 0.45, "thickness": 1.6 }
    }
  ],
  "success_action": { "type": "mxt:add_resource", "resource": "example:true_essence", "amount": 10 },
  "fail_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200 }
}
```

