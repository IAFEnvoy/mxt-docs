---
title: Bring Down a Tribulation
description: Write a tribulation that a breakthrough starts — the gate, the wind-up countdown, the three kinds of beat, a coloured lightning bolt, and what success and failure each do.
---

# Bring Down a Tribulation

A tribulation is the price of a breakthrough: a trial consumed beat by beat, where surviving it means the next realm and failing it is settled by whatever you wrote. It is built from two halves — **the definition of a tribulation** and **a breakthrough that references it**. Nothing starts a tribulation on its own.

This tutorial hangs a lightning tribulation on the example pack's foundation stage.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/tribulation/heavenly_gate.json` | The tribulation: wind-up, timeline, success and failure. |
| `data/example/mxt/realm_stage/foundation.json` | *(edit)* Reference the tribulation from that breakthrough. |

## Step 1 — A Minimal Timeline

```json
// data/example/mxt/tribulation/heavenly_gate.json
{
  "windup": 60,
  "timeline": [
    {"type": "mxt:idle", "duration": 20},
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 6}},
    {"type": "mxt:idle", "duration": 40},
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 10}}
  ],
  "success_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 50},
  "fail_action": {"type": "mxt:damage", "amount": 20}
}
```

| Field | Effect |
| --- | --- |
| `timeline` | **Required**, the beats to consume, at least one. |
| `windup` | Ticks to idle through before the first beat starts. |
| `success_action` | Runs once the timeline runs out; default `mxt:no_op`. |
| `fail_action` | Runs when a beat cannot continue; default `mxt:no_op`. |

There are only three kinds of beat:

| `type` | Field | Behaviour |
| --- | --- | --- |
| `mxt:action` | `action` (`EntityAction`, **required**) | Runs once and finishes **in the same tick**. Several adjacent `mxt:action` beats all run inside one tick, so "a sequence of things that happen at once" does not need splitting up. |
| `mxt:idle` | `duration` (`NumberProvider`, **required**) | Waits that many ticks. |
| `mxt:wait_for` | `condition` (`EntityCondition`, **required**) | Checked once per tick; finishes when it passes. |

The timeline is a **consumer queue**: it is copied into the entity's attachment when the run starts, and one beat is consumed per tick until the queue is empty. A `/reload` therefore **cannot** change a run already in progress — but `difficulty_scale` and the two outcome actions are still read from the definition live.

::: warning `mxt:wait_for` has no timeout
If the condition never passes, the tribulation waits on that beat forever: it neither advances nor fails. Keep conditions reachable (something like `mxt:exposed_to_sky` rather than a combination that may never be true).
:::

## Step 2 — Making It Wait

Both `mxt:idle` and `windup` are converted with the same rule:

```text
duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)
```

- `difficulty_scale` defaults to `1` and scales the whole tribulation.
- `aura_tribulation_modifier` comes from the environment (it is the `tribulation_modify` of the aura zone rules): the thicker the aura, the harder the trial. It is the one formula variable this system adds, and the multiplier is floored at 0 so a wait can never become negative.
- **The conversion happens once, when the beat starts**: a random duration is rolled a single time, and a change in ambient aura mid-wait neither stretches nor shortens it. The countdown the player sees is therefore the number of ticks that will really pass.

**Every beat is asked "can you run now?" before the run starts**, and an `mxt:idle` whose duration cannot be resolved rejects the whole start — a broken definition must not surface after the player has already paid for the breakthrough.

The wind-up differs from a wait only in that it consumes no beats and writes no per-beat state, but the run **already counts as in progress**: starting another one is still refused, `/mxt tribulation status` reports "still winding up, N ticks left", and `darken_sky` already applies. The remaining ticks are saved and synced with the attachment, so logging out and back in continues the countdown rather than restarting it.

## Step 3 — Striking With Lightning

`mxt:spawn_lightning` is an ordinary `EntityAction`: apart from its colour and thickness it **is** a vanilla bolt — damage, fire, lightning rods, copper, thunder, the sky flash, and villager→witch, pig→zombified piglin and charged creeper conversions all behave as usual. It therefore works in any `EntityAction` slot, not just a tribulation.

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `5` | Bolt damage, the vanilla number by default. |
| `color` | colour | `#737380` | RGB, `#RRGGBB` or an integer — vanilla's cold white by default. |
| `palette` | colour[] | `[]` | A **gradient** from the sky end to the impact point, at most 16 entries; it **replaces** `color`. |
| `alpha` | float `0..1` | `0.3` | The bolt's **brightness**, not transparency: vanilla draws it additively, so `RGB × alpha` is how hard it glows. |
| `thickness` | float `0.1..4` | `1` | Bolt thickness multiplier. |
| `visual_only` | boolean | `false` | Strike without damage or fire — atmosphere only. |
| `cause` | boolean | `true` | Credit a player caster with the strike (which can fire vanilla's `channeled_lightning` advancement). |
| `offset_x` / `offset_y` / `offset_z` | `NumberProvider` | `0` | Impact offset from the caster. |

A gradient with a bad colour or more than 16 entries **fails at decode time** rather than being dropped silently; entries blend linearly, and the four layers plus the two forks read the same seams, so a fork matches the trunk at the height it leaves it.

Swapping the second bolt for a gradient makes "this one hurts more" visible at a glance:

```json
{"type": "mxt:action", "action": {
  "type": "mxt:spawn_lightning",
  "palette": ["#7A5CFF", "#66CCFF"],
  "alpha": 0.45,
  "thickness": 1.6,
  "damage": 10
}}
```

## Step 4 — Success and Failure

- **Success**: once the timeline runs out, `success_action` runs. The example hands back 50 aura — surviving the trial leaves the pool fuller than before.
- **Failure**: when a beat decides it cannot continue, `fail_action` runs. There is **no built-in punishment at all** — no realm loss, no experience taken — everything is what you write in `fail_action`.
- **Dying is not failing**: the attachment is `copyOnDeath()`, so **death does not clear a tribulation**; it carries on with the respawned entity ("the tribulation is still striking after I died" is expected). If it should end with death, arrange that separately, or write the punishment as "dying wastes the attempt".
- **`/mxt tribulation stop` does not settle either**: it only clears the run, so neither `success_action` nor `fail_action` runs. Worth knowing while testing, so a stopped run is not mistaken for a successful one.
- Both may be left as `mxt:no_op`, in which case the tribulation is pure theatre and the punishment lives elsewhere.

To make failure hurt, compose existing actions — here damage first, then take experience:

```json
"fail_action": {
  "type": "mxt:sequence",
  "actions": [
    {"type": "mxt:damage", "amount": 20},
    {"type": "mxt:add_resource", "resource": "example:qi", "amount": -500}
  ]
}
```

## Step 5 — Hooking It to a Breakthrough

A tribulation never starts itself; the thing that references it decides. Most often that is a realm stage:

```json
// data/example/mxt/realm_stage/foundation.json
"tribulation": "example:heavenly_gate"
```

Then add a gate — `condition` is evaluated **once**, when the run is started, and a failure means this particular run does not happen:

```json
// data/example/mxt/tribulation/heavenly_gate.json
"condition": {"type": "mxt:aura_range", "min": 30, "max": 1000}
```

"Thin aura cannot host a tribulation" is thereby a datapack rule rather than a special case in code. When the gate refuses, **the breakthrough still happens** — there is simply no tribulation; requiring one is the job of `realm_stage`'s `breakthrough.conditions`.

## Step 6 — Verify

Reopen the world first (datapack registries are read while the **world loads**, so `/reload` is not enough), then:

```text
/mxt registries validate
/mxt tribulation start example:heavenly_gate
/mxt tribulation status
/mxt tribulation stop
```

1. `validate` should report no codec errors.
2. `start` enters the 60 tick wind-up immediately: the action bar shows "天劫将至：3.0 秒" counting down and the sky starts to darken (about a 1 second fade).
3. Once the wind-up ends, the first beat (`mxt:idle 20`) starts; `status` then reports "beat 1" and prints that beat's state, for example `{"remaining":12,"type":"mxt:idle_countdown"}`. This is the most direct window onto the timing while tuning it.
4. Two bolts land, `success_action` pays 50 aura, and the sky fades back.
5. You can also try it without logging in, on any live entity nearby (a tribulation hangs off a **living** entity and is advanced by its tick):

   ```text
   /execute positioned 0 100 0 run mxt tribulation start example:heavenly_gate @e[tag=probe,limit=1]
   /execute positioned 0 100 0 run mxt tribulation status @e[tag=probe,limit=1]
   ```

6. Finally run the real path: `/mxt resource example:qi set 500` to fill the pool, then `/mxt breakthrough example:qi` — the same wind-up should appear.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Nothing happens on a breakthrough | No `tribulation` on the realm stage, or the tribulation's `condition` does not pass. |
| `start` says a tribulation is already running | This entity already carries one — including a run still **in its wind-up**; `stop` to clear it. |
| `start` says a beat cannot run now | The pre-start validation failed, most often an `mxt:idle` whose `duration` cannot be resolved (a formula using a variable the empty context does not provide). |
| The tribulation is stuck on one beat | `mxt:wait_for` with an unreachable condition; it has no timeout and never fails. |
| It stopped advancing on its own | Advancement is driven by the entity's tick, so it **pauses in unloaded chunks** (the attachment is saved) and resumes where it left off. |
| `difficulty_scale` of `0` or a negative number | Not a load error, but waits resolve to `-1`: with any `mxt:idle` present the start is refused (`invalid_entry`); a timeline of only `mxt:action` beats instead "succeeds" instantly. |
| A formula using bare `level` gives `0` | Tribulation formulas run in an entity context, where `level` / `realm_rank` (which need a resource context) are unavailable. Use `caster_level` for the caster's vanilla experience level. |

## Next

- [tribulation](../datapack/json/tribulation.md) — the full field list and timeline details.
- [realm_stage](../datapack/json/realm_stage.md) — `tribulation` and breakthrough conditions.
- [Entity Actions](../datapack/types/action/entity_action_types.md) — everything the outcome actions can do, `mxt:spawn_lightning` included.
- [Commands](../player-guide/commands.md) — the rest of `/mxt tribulation` and `/mxt lightning`.
