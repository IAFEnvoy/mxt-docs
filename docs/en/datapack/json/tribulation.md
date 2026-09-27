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
| `timeline` | array, beats below | **required** | The timeline the tribulation consumes, at least one beat. |
| `difficulty_scale` | `NumberProvider` | `1` | Difficulty multiplier, applied to every wait length. |
| `windup` | `NumberProvider` | `0` | Wind-up before the start: ticks spent idling before the timeline starts being consumed, resolved by exactly the same rule as a wait length and settled the moment the run starts. Players see the seconds left on the action bar while it counts down; `0` means no wind-up. |
| `darken_sky` | `bool` | `true` | Whether the sky darkens for nearby players while this tribulation runs (the player undergoing it included, out to 160 blocks). |
| `success_action` | `EntityAction` | `mxt:no_op` | Success behaviour once the timeline has been walked to the end. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Failure behaviour when a beat cannot continue. |

`condition` is an **extra gate**, not an event trigger: what decides whether a tribulation opens at all is the place that references it (the `tribulation` of a `realm_stage`), and this field only decides whether that start is accepted.

## `TimelineEntry`

`timeline` is a **runtime cursor**: on start the whole timeline is copied into the entity's attachment, and from then on each tick consumes **the beat the cursor sits on**, advancing one beat when it finishes. **The cursor is saved**, because `mxt:branch` can move it to any beat. The cursor walking off the end runs `success_action`, and a beat reporting `FAILED` runs `fail_action`. The beats are copies, so `/reload` cannot change a tribulation that is already running; `difficulty_scale` and the two ending behaviours are still read from the definition.

| `type` | Field | Description |
| --- | --- | --- |
| `mxt:action` | `action` (`EntityAction`, **required**) | Runs one behaviour and finishes on the same tick. |
| `mxt:idle` | `duration` (`NumberProvider`, **required**) | Idles that many ticks doing nothing. |
| `mxt:wait_for` | `condition` (`EntityCondition`, **required**), `timeout` (`NumberProvider`, optional), `on_timeout` (`fail` / `finish`, default `fail`) | Evaluated once per tick, finishing only once the condition holds; with a `timeout` it is a **deadline**, and when it runs out the run fails or moves straight on according to `on_timeout`. |
| `mxt:branch` | `condition` (`EntityCondition`, **required**), `if_true` / `if_false` (integer indices, optional) | **Moves the cursor** according to the condition and finishes on the same tick; a branch that is not written advances one beat as usual. |

`mxt:action` is an instant beat: neighbouring `mxt:action` beats on a timeline are all consumed within one tick, so everything happening in a single tick does not have to be split across beats.

A wait length is resolved as `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)`, and settled **once when that beat begins**, never recomputed afterwards: a random length is rolled once, and an aura change mid-wait does not stretch or shorten a wait that has already started.

`mxt:wait_for`'s `timeout` is the **exception**: it is a deadline rather than "the length of this beat", resolved from `timeout` alone, **without `difficulty_scale` and without looking at the ambient aura** — difficulty should not decide how long a player has to meet the condition. A `timeout` that does not resolve to a positive number makes the whole start fail.

`mxt:branch`'s indices count from **the first beat of the timeline the run copied** (`0`-based), and an out-of-range index is rejected **at start**, so a branch pointing at the wrong beat cannot surface only after the player has already paid for the breakthrough; backward jumps are allowed too, and nothing stops a "go back and take another round while the health is low" loop (the condition has to be able to settle on its own). **At most 1024 beats are consumed per tick**: a definition that jumps back on itself and contains no wait logs a WARN and hands that beat back to the next tick instead of wedging the server thread — a real loop always waits at some beat (`mxt:idle` / `mxt:wait_for`), so a normal definition never reaches this limit.

Before the start, every beat is asked once whether it can run now: an `mxt:idle` whose duration does not resolve, a `mxt:wait_for` whose `timeout` does not resolve, and a `mxt:branch` whose target is out of range all make the whole start fail — a broken definition should not surface only after the player has already paid for the breakthrough. With **no `timeout` written** on a `mxt:wait_for`: if the condition never holds, the tribulation parks on that beat (it neither advances nor fails), so the author has to make sure the condition is reachable.

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

Strikes a bolt at the actor's position. Colour aside, it **is the vanilla lightning bolt**: damage, ignition, lightning-rod charging, copper oxidation, thunder, the sky flash, and the villager-to-witch, pig-to-zombified-piglin and charging-creeper conversions all work as usual. It is an `EntityAction`, so a tribulation timeline, the success/failure behaviours, per-entity formation behaviours, abilities, contracts and secret realms — any `EntityAction` slot — can use it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | color | `#737380` | RGB colour of the bolt, written as `#RRGGBB` or an integer. The default is the vanilla cold white (rounded to 8 bits per channel). |
| `alpha` | Float `0..1` | `0.3` | **Brightness** of the bolt. Vanilla lightning uses additive blending, and the vertex colour's `RGB × alpha` is its glow strength, so this field is not opacity: turn it up for a harsher bolt, down for a dimmer one. |
| `thickness` | Float `0.1..4` | `1` | Thickness multiplier of the bolt column. |
| `palette` | color[] | `[]` | **Gradient**: a colour sequence from the top to the impact point, the first entry at the bolt's origin (sky side) and the last at the impact point, at most 16 entries. Once given it replaces the colouring from `color`. |
| `damage` | `NumberProvider` | `5` | Lightning damage, matching vanilla by default. |
| `visual_only` | Boolean | `false` | Strike only: no damage settled, no ignition. |
| `cause` | Boolean | `true` | When the actor is a player, the strike counts as caused by them, which can trigger the vanilla `channeled_lightning` advancement. |
| `offset_x` / `offset_y` / `offset_z` | `NumberProvider` | `0` | Offset of the impact point relative to the actor. |

A `palette` **replaces** the single colour from `color`: rendering takes a colour per segment from the bolt column's nine horizontal seams, interpolating linearly between adjacent entries (one entry = flat colour, two = a gradient between the ends, more = several gradient segments). The four overlay layers and the two forks read the same set of seams, so a fork matches the trunk at the height where it leaves. Colours are written the same way as `color` (`#RRGGBB` or an integer); `alpha` is still the glow strength shared by the whole bolt, not a per-colour opacity. More than 16 entries or an illegal colour fails outright at **decode time** rather than being silently dropped: a typo in a gradient should be visible.

```json
{
  "timeline": [
    {
      "type": "mxt:action",
      "action": {
        "type": "mxt:spawn_lightning",
        "palette": ["#7A5CFF", "#66CCFF"],
        "alpha": 0.45,
        "thickness": 1.6,
        "damage": 12
      }
    },
    { "type": "mxt:idle", "duration": 20 }
  ]
}
```

To strike a bolt directly without touching a data pack, use `/mxt lightning` (top-level alias `/lightning`); its arguments match the table above one to one (a gradient is written `palette 7A5CFF,66CCFF` in the command, without `#`). See [Commands](/en/player-guide/commands).
