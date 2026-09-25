---
title: Tribulation (tribulation)
description: Define a tribulation that is gated by a condition, consumes a timeline of entries and runs success or failure behaviour.
aside: false
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
| `name` | Text Component | `tribulation.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `tribulation.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `condition` | Entity Condition | `mxt:always_true` | Evaluated once when the tribulation is started; the attempt is rejected when it fails. It is not an event trigger — what decides whether a tribulation is started at all is the `tribulation` field of a realm stage. |
| `timeline` | `List<Timeline Entry>` | **required** | The timeline the run copies and then walks with a cursor; at least one entry. |
| `difficulty_scale` | `NumberProvider` | `1` | The difficulty multiplier, applied to every wait. |
| `windup` | `NumberProvider` | `0` | The anticipation before the timeline starts: how many ticks the run counts itself in first, resolved through the same rule as every wait and settled when the run starts. `0` means no wind-up. |
| `darken_sky` | `bool` | `true` | Whether the sky darkens for nearby players while this tribulation lasts, the player undergoing it included. Purely a client-side reading of the synced definition. |
| `success_action` | Entity Action | `mxt:no_op` | Runs once the cursor walks off the end of the timeline. |
| `fail_action` | Entity Action | `mxt:no_op` | Runs when an entry cannot continue. |

## `Timeline Entry`

The timeline is a **stored cursor**: starting a tribulation copies the whole list into the entity's attachment, and the consumer then works on the entry the cursor points at, advancing one entry each time it finishes. **The cursor is saved** (since 2026-09-25; before that the run consumed a queue), because `mxt:branch` can move it to any entry. The run ends with `success_action` once the cursor walks off the end, or with `fail_action` when an entry reports `FAILED`. Because the entries are copies, `/reload` cannot change a run that is already under way; `difficulty_scale` and the two endings are still read from the definition.

| `type` | Field | Description |
|--------|-------|-------------|
| `mxt:action` | `action` (Entity Action, required) | Runs one behaviour and finishes on the same tick. |
| `mxt:idle` | `duration` (`NumberProvider`, required) | Waits that many ticks doing nothing. |
| `mxt:wait_for` | `condition` (Entity Condition, required), `timeout` (`NumberProvider`, optional), `on_timeout` (`fail` / `finish`, default `fail`) | Evaluated every tick; finishes once it holds. With a `timeout` it is a **deadline**, and when it runs out the run fails or moves on according to `on_timeout`. |
| `mxt:branch` | `condition` (Entity Condition, required), `if_true` / `if_false` (integer indices, optional) | **Moves the cursor** according to the condition and finishes on the same tick; a branch that is not written simply advances one entry. |

`mxt:action` is an instant entry: neighbouring `mxt:action` entries are consumed on the same tick, so everything that happens in one tick does not have to be split across entries. Every wait is resolved as `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` and settled **once, when its entry begins**: a random duration is drawn once, and an aura change cannot stretch a wait that is already running. A `mxt:wait_for` `timeout` is the **exception**: it is a deadline rather than the length of a beat, so it is resolved from `timeout` alone, **without `difficulty_scale` and without the aura modifier** — difficulty should not decide how long a player has to meet a condition. A `timeout` that does not resolve to a positive number makes the whole start fail.

`mxt:branch`'s indices count from the **first entry of the timeline the run copied** (`0`-based), and an index out of range is refused **at start**, so a branch pointing at the wrong entry cannot surface after the player has already paid for the breakthrough. Backward jumps are allowed too: nothing stops a "go back and take another round while the health is low" loop, so the condition has to be able to settle on its own.

Each entry is asked once, before the run starts, whether it can run at all; an `mxt:idle` whose duration cannot be resolved, a `mxt:wait_for` whose `timeout` cannot be resolved, and a `mxt:branch` aimed out of range all make the whole start fail, so a broken definition does not surface only after the player has paid for the breakthrough. A `mxt:wait_for` **without a `timeout`** still behaves as before: a condition that never holds parks the run on that entry (it neither advances nor fails), so make sure it is reachable.

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

A staged tribulation: wait with a deadline for the player to be exposed to the sky, then split into two branches by health, where the `if_true: 3` of the `mxt:branch` jumps straight to the 4th entry (`0`-based) and skips the 3rd.

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

