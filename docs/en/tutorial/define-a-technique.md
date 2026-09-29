---
title: Define a Technique and Its Levels
description: "Three tables that make a technique climb on its own: how a level file is written, where the requirement goes, where mastery comes from, and when a promotion happens."
---

# Define a Technique and Its Levels

A technique that levels up is three tables put together: a **progression chain** (one file per level under `mxt/progression/`), a **stored value that measures mastery** (`resource`), and the **technique definition** (`technique`) that ties the two to itself. A level is not a fourth table — it is one level of the chain, and the chain is nothing but `next_level` links.

This page follows [Define an Ability](./add-an-ability.md) and adds that line to the example pack's `example:azure_breath`: the technique can already be learned and already grants abilities, and now it also climbs after you learn it.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/resource/azure_mastery.json` | The value that measures this technique's mastery. |
| `data/example/mxt/progression/azure_breath_1.json` | The entry level of the chain. |
| `data/example/mxt/progression/azure_breath_2.json` | The second level: its requirement, its multiplier and the ability it grants. |
| `data/example/mxt/progression/azure_breath_3.json` | The top level, with no `next_level`. |
| `data/example/mxt/technique/azure_breath.json` | *(edited)* point it at the chain, name the mastery value, describe each level. |
| `data/example/mxt/cultivation/meditation.json` | *(edited)* a yielding meditation tick also adds a little mastery. |
| `data/example/mxt/trigger/azure_mastery_from_kill.json` | A kill adds a little mastery too. |

## Step 1 — Mastery Is Just a Value

A technique holds no mastery counter of its own: `mastery_resource` names one `resource` entry, and each level's `mastery` says how much of it is needed. So start with the value.

```json
// data/example/mxt/resource/azure_mastery.json
{
  "default_value": 0,
  "max": 1000,
  "particle_color": "#66CCFF"
}
```

`default_value` and `max` are required, `min` defaults to `0`. **`max` must not be lower than the highest requirement you plan to write**: a change past the bounds is clamped rather than refused, so a requirement above `max` makes the top of the chain unreachable, silently.

Nothing points an aura at this value, so it has no aura identity: it never shows up on the aura wheel (that list is organised by aura) and it is not part of the aura-storage interface. It is a plain number. Write a `bars` entry to see it on the HUD; the mastery bar on the technique panel is tinted with its `particle_color`.

## Step 2 — One File per Level, Chained by `next_level`

```json
// data/example/mxt/progression/azure_breath_1.json
{
  "next_level": "example:azure_breath_2"
}
```

```json
// data/example/mxt/progression/azure_breath_2.json
{
  "next_level": "example:azure_breath_3",
  "mastery": 100,
  "damage_multiplier": 1.25
}
```

```json
// data/example/mxt/progression/azure_breath_3.json
{
  "mastery": 400,
  "damage_multiplier": 1.5
}
```

- The chain **has no identity field**: it is the straight line `next_level` draws, and **the level nobody writes as a `next_level` is the entry**. Here nothing points at `azure_breath_1`, so the chain is 1 → 2 → 3 with in-chain ranks `0`, `1`, `2`. The top level writes no `next_level`.
- `mastery` is what it takes to **reach** that level, so the entry level's own value is never read — `azure_breath_1` does not need it.
- The chain lives in `progression`, and each technique names its entry with `default_level`, so several techniques can share one chain: they climb the same ladder.
- `damage_multiplier` only applies on the path where **an ability granted by this chain is cast**: whatever level the holder currently stands on supplies the multiplier (the highest one when several sources grant the same ability). It lands in the `damage_multiplier` formula variable.

Every chain problem is reported at world load (`/mxt registries validate`): a `next_level` pointing at nothing (`next_level <id> is not a progression`), one level written as the successor by two others (`follows both <A> and <B>`), a loop (`chain is cyclic, or joins another chain, at level <id>`), and a level whose mastery requirement is **lower** than the one before it (`lowers its mastery requirement at level <id>`). One broken link and the whole chain is left unindexed: better no order than half a chain.

## Step 3 — Point the Technique at the Chain

```json
// data/example/mxt/technique/azure_breath.json
{
  "quality": "example:refined",
  "learn_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "cultivation_modifier": 1.25,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:technique/azure_breath",
      "amount": 2,
      "operation": "add_value"
    }
  ],
  "granted_abilities": ["example:qi_bolt"],
  "default_level": "example:azure_breath_1",
  "mastery_resource": "example:azure_mastery",
  "configuration": {
    "example:azure_breath_2": {
      "condition": {"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"},
      "ability": "example:qi_recovery"
    },
    "example:azure_breath_3": {
      "condition": {"type": "mxt:realm", "realm": "example:core_formation", "comparison": "at_least"}
    }
  }
}
```

The three new fields each answer one question:

| Field | What it answers |
| --- | --- |
| `default_level` | Which level of the chain this technique enters at. |
| `mastery_resource` | Which value measures mastery; without it the technique never advances. |
| `configuration` | For every level after the entry: its `condition` (what else reaching it takes) and its `ability` (what it grants). |

- The keys of `configuration` are the ids of the levels themselves. **Every level after the entry must be described**: the chain cannot pass through a step nobody wrote, so a missing one reports `does not configure the progression level <id>`, and a level that can never be reached from the entry reports `configures progression level <id>, which it can never reach from <entry>`.
- The entry level needs no entry of its own. Write one anyway and its `ability` still applies at that level, while its `condition` becomes no gate at all — there is no such thing as promoting *into* the entry level.
- `ability` is a **minimum**: grants accumulate, so what the second level gave still applies on the third. Above, `example:qi_recovery` moved out of `granted_abilities` and into the second level, turning "recovery comes with learning it" into "recovery comes at level two"; the entry still gives `example:qi_bolt` the moment the technique is learned.
- Mastery and `condition` are **two independent gates** and both must hold: enough of the value, and the condition satisfied. Write `mxt:always` if the value alone should decide.
- Both `mastery_resource` and `configuration` **require `default_level`**: naming a value with no entry fails at load time with `mastery_resource needs default_level to name the progression chain it measures`, while a technique with `configuration` and no `mastery_resource` grants its abilities as usual and simply never advances on its own.

## Step 4 — Where Mastery Comes From

The mod does not decide this. It only reads the value. How that value grows is entirely the content pack's business, and there are four ready-made routes.

**Meditation counts.** The action of a yielding tick runs once per settle:

```json
// data/example/mxt/cultivation/meditation.json
"cultivate_action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
```

**Combat counts.** A trigger rule is "a signal, then run an action while a condition holds":

```json
// data/example/mxt/trigger/azure_mastery_from_kill.json
{
  "trigger": {"type": "mxt:kill"},
  "action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
}
```

The signals you can hang a rule on are **the ability triggers plus the ported vanilla triggers**: `mxt:kill`, `mxt:hurt`, `mxt:attack`, `mxt:block_break`, `mxt:slept_in_bed`, `mxt:changed_dimension`, `mxt:player_killed_entity` and the rest. The rule's own `chance` and `cooldown` throttle it.

**Use the technique's own ability.** An ability type that runs actions can carry the same action in `entity_action`:

```json
// data/example/mxt/ability/qi_bolt.json
"entity_action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
```

The catch is that **an ability does not know which technique it came from**: `example:qi_bolt` is also granted by the realm and by the pill, so those two sources feed the very same value. The value is global, not one per technique — to let only students of this technique gain, put the action on an ability only this technique grants, or use a value nothing else touches.

**Let cultivation feed it directly.** If the mastery value happens to be the one a given `aura` references, cultivation settles straight into it (`regen × absorb_amount × affinity × aura speed`, filling the value first and only then turning the overflow into cultivation progress), and `aura_gains` adds to it as well. This is the cheapest route of all: point `mastery_resource` at the value you meditate on and cultivating *is* gaining mastery.

The `mxt:add_resource` action's `amount` may be a formula. The value can also be **taken away** — any cost (`Cost`), an entity-to-entity transfer, a spirit vessel — so spending mastery is allowed; it only postpones the next promotion, and a level already reached is never lost.

## Step 5 — Learn It, Then Watch It Climb

The manual side needs no change: `example:azure_breath` already has its own `technique_binding` from [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md).

```mcfunction
give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]
```

Every second the server checks each learned technique: once the value reaches the next level's `mastery` and that level's `condition` holds, the holder advances. One check walks the chain upwards until a step fails, but **it never skips a level**. A promotion immediately rebuilds the granted abilities (`granted_abilities` plus the `ability` of every level reached), and publishes one `mxt:progression_level` signal: the formula variable `level` carries the rank just reached and the extension value `owner` carries the technique's id.

**Levels only go up.** After a pack changes a technique's `default_level`, a record its holder can no longer reach is cleared when a body joins the world, on player login and on datapack reload (the reload pass walks every loaded entity), dropping that technique back to its own entry level; every cleared record leaves a `WARN` in the server log naming the technique and the level.

## Verify

```text
(reopen the world)
/mxt registries validate                      → no codec errors
/mxt registries list                          → mxt:progression=3
/mxt ability list                             → the abilities held, and where each came from
/mxt trigger rules mxt:kill                   → lists the kill rule
/mxt resource example:azure_mastery           → the current mastery
/mxt trigger publish mxt:kill                 → publish one kill signal by hand (gamemaster)
```

1. `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]` and right-click it. Only `example:qi_bolt` is there — the recovery ability waits for level two. The technique panel (unbound by default; reach it from the button in the information panel, `Z`) shows the technique, its level and its mastery bar.
2. Meditate for a minute: `cultivate_action` adds `1` per second, and `/mxt resource example:azure_mastery` follows. Kill something, or run `/mxt trigger publish mxt:kill`, for one more point.
3. Within a second or two of the value reaching `100` the holder promotes to level two: `example:qi_recovery` appears in the skill pool on the right of the wheel configuration screen (`/mxt ability list` lists it together with its source), and damage from abilities granted by the chain changes from `1.0` to `1.25` times.
4. To see a promotion without waiting, run `/mxt resource example:azure_mastery set 100` (gamemaster). That form rewrites the value outright and does not go through the bounds check.
5. Push the value to `400`: the third level promotes and the multiplier becomes `1.5`.
6. Change `azure_breath_3.json`'s `mastery` to `50` (below the `100` of level two) and reopen the world: `/mxt registries validate` reports `lowers its mastery requirement at level example:azure_breath_3`.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| It never promotes | No `mastery_resource` (so it never advances), or the value has not reached the next level's `mastery`, or that level's `condition` fails — both gates have to pass. |
| The value stops at some number | That number is its `max` and changes past the bounds are clamped. A requirement above `max` makes the top of the chain unreachable, **without any error**. |
| Everyone gains mastery for this technique | Mastery is a **global value**, not one per technique: whatever adds to it feeds every technique pointing at it. Use separate values to keep them apart. |
| Meditation raises mastery for a different technique | Same reason: the value is shared. Point mastery at an aura's `resource` and every source of that aura feeds it. |
| `mastery_resource needs default_level to name the progression chain it measures` | A mastery value was named but no entry level was. |
| `configuration needs default_level to name the progression chain it belongs to` | Per-level configuration was written but no entry level was. |
| `enters the unknown progression level <id>` | `default_level` points at a level that does not exist. |
| `does not configure the progression level <id>` | The walk from this technique's entry passes through `<id>` and `configuration` does not describe it. |
| `configures progression level <id>, which it can never reach from <entry>` | `configuration` describes a level the entry cannot reach. |
| `lowers its mastery requirement at level <id>` | A later level asks for less mastery than an earlier one; the whole chain is dropped and left unindexed. |
| `follows both <A> and <B>` / `chain is cyclic, or joins another chain, at level <id>` | One level is written as the successor by two others (a fork), or the chain loops. |
| `next_level <id> is not a progression` | `next_level` points at nothing; the whole chain is dropped. |
| A level record fell back to the entry for no reason | The pack changed this technique's `default_level`: a record that can no longer be reached is cleared when a body joins the world, on login and on datapack reload, and the log has the matching `WARN`. |
| Files changed but nothing happened | Datapack registries are read when the world loads; `/reload` does not reread them. |

## Next

- [progression](../datapack/json/progression.md) — every field of a level, and how chains are numbered at runtime.
- [technique](../datapack/json/technique.md) — the full technique definition and the rules for describing each level.
- [Define an Ability](./add-an-ability.md) — how the abilities this chain grants are written.
- [trigger](../datapack/json/trigger.md) — every field of a trigger rule: signal, condition, chance and cooldown.
