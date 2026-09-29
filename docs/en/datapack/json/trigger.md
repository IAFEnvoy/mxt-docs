---
title: Trigger Rule (trigger)
description: "Datapack event rules: a published signal, a condition on its actor, and an action."
aside: false
---

# Trigger Rule (trigger) {#trigger}

File location: `data/<namespace>/mxt/trigger/<path>.json`

A standalone event reaction rule: when a signal is published, every rule whose trigger matches it evaluates its condition against the signal's actor and, if the condition holds, runs its action. It is not attached to any ability, so a content pack can turn any published signal into an effect — for example "add `1` to a resource when a block is broken".

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `Trigger` | **required** | The signal this rule answers, written like an ability trigger: a built-in signal is `{"type": "mxt:block_break"}`, and the scripted matcher (`mxt:js`) can inspect the whole signal. |
| `condition` | `EntityCondition` | `mxt:always` | Evaluated against the signal's actor with the formula context the event provides; an array means all of them have to hold. |
| `action` | `EntityAction` | `mxt:no_op` | Run on that actor once the condition holds; an array runs in order. |
| `chance` | `NumberProvider` | `1` | The probability rolled once each time the signal matches: `≤0` never runs, `≥1` always runs, and anything in between is rolled with the entity's random. |
| `cooldown` | `NumberProvider` | `0` | How many ticks to wait after running before this rule may run again, **recorded on the actor per rule id** (it is saved, and dying does not clear it). `0` means no throttling. |

A rule needs an actor. A signal published without one only reaches subscriptions and never triggers a rule, because the condition and the action both belong to one entity. `chance` and `cooldown` are per actor as well: **when two entities hold the same rule, each rolls its own chance and keeps its own cooldown**. A `chance` that does not resolve to a number (a non-finite value) counts as `1`.

The parent context the condition and the action receive is the event context, so the formula values the publisher wrote into it are readable: a rule answering `mxt:hurt` can size its numbers with `damage`, and a custom signal a script publishes with `MxtTriggers.publish` works the same way.

```json
// data/example/mxt/trigger/qi_from_mining.json
{
  "trigger": {"type": "mxt:block_break"},
  "condition": {"type": "mxt:health", "comparison": ">=", "compare_to": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 1}
}
```

```json
// data/example/mxt/trigger/qi_from_damage.json
{
  "trigger": {"type": "mxt:hurt"},
  "condition": {"type": "mxt:resource_compare", "resource": "example:qi", "min": 10},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": "damage / 2"}
}
```

Rules are indexed by the signal their trigger names while the server cache is built, so publishing a signal costs one lookup. A rule whose action publishes a signal the rule itself answers is skipped while it is running, which keeps it from recursing; a rule that throws is only logged and does not affect the other rules or the subscriptions of that signal.

Subscriptions are indexed in layers — signal → owner → module:identifier: an identifier is unique only inside the entity that holds it, so two entities holding the same definition never displace each other. Publishing first tests the owner for emptiness, then takes that owner's snapshot of subscriptions — a one-shot subscription removes itself while running, which is what the snapshot is for. When the publishing actor is a fake player the whole signal is ignored.

Validation happens while the cache is built and **collects every** problem instead of stopping at the first one: `/mxt registries validate` lists them all at once (each with its `data/<namespace>/mxt/<registry>/<path>` path), and `/mxt trigger rules <signal>` tells you whether a signal has any rule answering it. A rule that declares a `condition` but leaves out `action` counts as a problem too — the default action is a no-op, so such a rule never does anything.

Three things share the word *trigger* and have to be told apart: **a rule** (this page, the datapack registry `mxt/trigger`), **a trigger matcher** (the built-in registry `mxt:trigger_type`, which decides how a signal is matched; the built-ins match by signal type, and `mxt:js` is the other one), and **a signal** (the runtime notification itself, published by the mod for each kind of event and publishable from a script).

The ported vanilla triggers are `mxt:trigger_type` entries as well; their fields, the signals they offer and their timing are on [Triggers (trigger_type)](/en/datapack/types/other/trigger-type).
