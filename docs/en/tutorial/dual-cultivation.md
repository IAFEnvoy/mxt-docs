---
title: Write a Dual Cultivation Method
description: "A cultivation method that only yields while somebody is beside you: how the test is assembled, how both bodies get in, what happens when one walks away, and how to check it in game."
---

# Write a Dual Cultivation Method

This page follows [Define Aura and Realms](./define-aura-and-realms.md): that one built the single-body cultivation loop, this one adds a method to the same pack that **only yields results while somebody is nearby**. The framework grants dual cultivation no bonus of its own — it is just a test, and how much faster, how much it costs and what it gives are yours to write.

## What You Are Building

- One `cultivation` whose "does this tick yield anything" asks "is there a friend beside me holding a technique manual".
- That test, assembled from three pieces that already exist: `mxt:partner` (scans the bodies around), `mxt:target_condition` (asks the question about the other body), `mxt:main_hand_item` (asks what that body holds in its main hand).
- Two choices: when the partner walks away, does the body keep sitting with no results, or stop as well.
- A way for both bodies to get hold of the manual.

## Step 1 — The Method

```json
// data/example/mxt/cultivation/dual_meditation.json
{
  "priority": 10,
  "tick_interval": 20,
  "absorb_amount": "3 + realm_rank * 0.15",
  "aura_costs": [{ "type": "mxt:aura", "aura": "example:qi", "amount": 1 }],
  "cultivate_condition": {
    "type": "mxt:partner",
    "range": 5.0,
    "count": { "min": 1, "max": 1 },
    "bientity_condition": {
      "type": "and",
      "conditions": [
        { "type": "friend" },
        { "type": "target_condition",
          "condition": { "type": "mxt:main_hand_item",
            "item_condition": { "type": "mxt:has_component", "component": "mxt:technique" } } }
      ]
    }
  }
}
```

| Field | What it does here |
| --- | --- |
| `priority` | Higher than the solo method, so this one wins while both could run. |
| `cultivate_condition` | Whether this tick yields anything. While it fails nothing is paid and nothing is gained, and the body keeps sitting. |
| `absorb_amount` | The reward for pairing up — write it higher than the solo method. |
| `tick_interval` / `aura_costs` | Settlement interval and cost, per settlement like any other method. |

`mxt:partner` scans living entities within `range` blocks of the asking body, never counting itself, and hands each candidate to `bientity_condition` — inside there the actor is the asking body and the target is the candidate. `count` is a window on the number of hits, so `{ "min": 1, "max": 1 }` means "exactly one"; leaving `max` out means "at least one".

The inner `mxt:target_condition` applies an **entity condition** to the candidate, so the `mxt:main_hand_item` inside it asks about the **other** body's main hand, not your own. `mxt:has_component` with `component: "mxt:technique"` only asks whether that stack is a technique manual and does not care which technique — two bodies holding manuals for different techniques still match. To pin it to one technique, see step 4.

`mxt:friend` narrows the test to friends. For a sect-internal practice use `mxt:same_team` instead, and drop the whole entry when no relationship is wanted.

Note that `mxt:main_hand_item` only reads the **main hand**: a manual in the off hand does not count, and an empty hand is false.

## Step 2 — Keeping "My Partner Is Cultivating" Out of the Test

This is the one thing that is easy to get wrong on this method. `start_condition` and `cultivate_condition` are asked **while the method is being picked** (can a body sit down, and would sitting down yield anything), while "my partner is cultivating too" is necessarily false before anybody has sat down:

- Written into `start_condition` or `cultivate_condition`, neither body's method applies before either has sat down, so **neither can get in**.
- Written into `tick_condition`, it is only asked once a session is running, so the first body does sit down; what it means is "when my partner stands up, I stop too".

So "can we share in the results right now" has to ask **what the other body holds** (which already holds before sitting down), and "is the other body cultivating" belongs in `tick_condition` alone:

```json
"tick_condition": {
  "type": "mxt:partner",
  "range": 5.0,
  "bientity_condition": {
    "type": "and",
    "conditions": [
      { "type": "target_condition", "condition": { "type": "mxt:cultivating" } },
      { "type": "friend" }
    ]
  }
}
```

Without this part, dual cultivation is "each cultivates alone, only somebody has to be around"; with it, it is "two bodies settle in together, and one leaving ends the other".

## Step 3 — Using start_condition When You Need a Place

A requirement like "you have to be sitting on a cushion" goes in `start_condition`, which decides only whether a body can sit down and is not asked again afterwards:

```json
"start_condition": {
  "type": "mxt:on_block",
  "condition": { "type": "mxt:block_tag", "tag": "example:meditation_seats" }
}
```

The tag file goes at `data/example/tags/block/meditation_seats.json` and lists the blocks you allow. For "riding something" instead, use `mxt:riding` around a bi-entity condition shaped exactly like the inner part of `mxt:partner`.

## Step 4 — Where Both Manuals Come From

The test asks whether the stack in hand is a technique manual, so both bodies need one in the main hand. A manual's identity is the `mxt:technique` component on the stack, no dedicated item required — the technique the pack already has is enough:

```mcfunction
give @p mxt:cultivation_jade_slip[mxt:technique="example:azure_breath"]
```

To pin it to "the manual of that one technique", give the technique a [technique binding](../datapack/json/technique_binding.md), put a dedicated carrier into its `items` (or `carrier_item`), and swap the inner item condition for one that names the item:

```json
{ "type": "mxt:item_id", "item": "example:dual_manual" }
```

## Step 5 — Raising the Yield

Two ready-made outlets, both in the same definition:

- **Rate**: write `absorb_amount` higher (the one above is `3 + realm_rank * 0.15` against the solo method's `1.5`).
- **Extra gains**: add mastery or a resource in `cultivate_action`. It runs **only on a settlement that actually happened** — that is, on the ticks where `cultivate_condition` held — so it needs no condition of its own (use `tick_action` for something that should happen on every tick):

```json
"cultivate_action": { "type": "mxt:add_resource", "resource": "example:qi_mastery", "amount": "2" }
```

## Verify

1. Two players within 5 blocks of each other, friends, each with a manual in the main hand, each pressing the cultivation key. Both get in, and `/mxt cultivate status` names this method.
2. The resource bar and cultivation progress start moving, faster than the solo method.
3. One of them walks more than 5 blocks away, or moves the manual to the off hand, or puts it away: **both keep cultivating**, but from the next tick on there are no results — the bar stops and `aura_costs` is no longer paid.
4. With the `tick_condition` from step 2, the settlement after that walk-away stops both, and the actionbar reports "Cultivation cannot continue: Cultivation conditions are not met".
5. Pressing the cultivation key alone reports "no method can be practised right now". A method whose `cultivate_condition` fails is never picked, so a body is never seated only to be stopped again.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Neither body can get in, and the actionbar says no method is available | "My partner is cultivating" was written into `start_condition` or `cultivate_condition`. It can only live in `tick_condition`. |
| A manual is held but the test still fails | `mxt:main_hand_item` only reads the main hand; also, a manual's identity is the `mxt:technique` component on the stack, and a jade slip without it is just a jade slip. |
| Results keep coming after walking away | The test was written into `tick_condition` only, which decides whether to stop rather than whether to yield; or `range` is far too large. |
| The other body is not cultivating, yet the pair still matches | The test asks what the other body holds, not whether it is cultivating. Add `mxt:cultivating` to `tick_condition` to require both to be seated. |
| Standing together but the method is never picked | `range` is a sphere around the asking body and is capped at `32`; and with `count`'s `max` at `1`, one extra body beside you already fails it. |
| The server slows down as players gather | This test scans nearby entities on every settlement and every pick. Do not put it on most methods. |

## Next

- [cultivation](../datapack/json/cultivation.md) — how the three conditions divide the work, and every field.
- [Entity Condition Types](../datapack/types/condition/entity_condition_types.md) — the field tables for `mxt:partner`, `mxt:main_hand_item` and `mxt:cultivating`.
- [Technique Binding](../datapack/json/technique_binding.md) — how a manual is read and where a dedicated carrier item comes from.
