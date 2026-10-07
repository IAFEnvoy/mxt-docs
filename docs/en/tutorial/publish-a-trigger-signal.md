---
title: Publish a Trigger Signal
description: "Publish a custom trigger signal from a server script, then let a data pack rule and a script subscription each consume it: payload, formula values, the subscription key and its lifetime."
---

# Publish a Trigger Signal

A trigger signal is a notification the mod itself is waiting for: an entity took a hit, killed something, reached a new progression level. The built-in signals are published by the mod, and **a content pack can publish its own** — a server script calls `MxtTriggers.publish` once, and one of two consumers picks it up: a data pack [trigger rule](../datapack/json/trigger.md), or a subscription of the script's own.

Both sides go through **one dispatch**, so a signal a script published can drive a data pack rule, and a rule's behaviour can publish a signal a script is waiting for. This is the only way a data pack can react to a **custom** signal id: every built-in matcher (`mxt:tick`, `mxt:kill` and the rest) hard-codes one signal id and cannot express a name of your own, which leaves the `mxt:js` matcher plus a script callback.

**Prerequisite:** [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) is done. This page creates no definitions at all: the `example:qi`, `example:azure_mastery` and `example:azure_breath` it uses are all already in the example pack.

## What You Are Building

| File | Job |
| --- | --- |
| `kubejs/server_scripts/mxt_signals.js` | Publishes `example:azure_mastery_signal` and subscribes to it by key, to prove the dispatch arrives. |
| `data/example/mxt/trigger/azure_mastery_signal.json` | *(new)* Adds mastery to the signal's subject; shaped like the existing `azure_mastery_from_kill.json`. |

A signal has no file, no registry and no id to register: it is a namespaced string, and it exists as soon as the publisher and the consumer spell it the same way.

## Step 1 — The Script Goes on the Server

Publishing and subscribing are both server-side, so the script must live under `kubejs/server_scripts/` (this page uses `mxt_signals.js`). Putting it in `startup_scripts/` does nothing: startup scripts run once before the game registers items, where there is no server and no entity to publish for.

A server script is re-evaluated by `/reload`, and subscriptions are **runtime only** and never saved — `/reload` drops them. The subscription below is therefore rebuilt from `EntityEvents.spawned` and `ServerEvents.tick` rather than written once.

## Step 2 — Publishing a Signal

```js
// kubejs/server_scripts/mxt_signals.js
const SIGNAL = 'example:azure_mastery_signal'
const WATCH_KEY = 'example:azure_mastery_watch'

// Publish: one server-authoritative signal for this entity; every finite number in the payload also enters the formula context.
function publishMasteryGain(entity, amount) {
  return MxtTriggers.publish(entity, SIGNAL, { source: 'example:ritual', amount })
}
```

`publish(entity, signal, values)` takes three arguments:

| Argument | Meaning |
| --- | --- |
| `entity` | The signal's **subject**, and what it acts on. A rule's `condition` and `action` are both evaluated against this entity. |
| `signal` | A namespaced signal id. It does not have to be in the built-in signals list — the name on this page is one we made up. |
| `values` | An `object` or `null`: the signal's payload. Every **finite number** also goes into the trigger formula context; anything else (the string `source` here) stays in the extension data and is read with `signal.context().get('source')`. |

The return value is a boolean: it is `false` for a client-side entity, and nothing is published. A signal is published even with no subscriber (rules still run), so a **publisher never has to check whether anyone is listening**.

## Step 3 — Catching It with a Data Pack Rule

A trigger rule hangs on no ability at all: when a signal arrives, the rules matching it evaluate `condition` once against the **signal's subject**, and a passing rule runs its `action`.

```json
// data/example/mxt/trigger/azure_mastery_signal.json
{
  "trigger": {
    "type": "mxt:js",
    "signal": "example:azure_mastery_signal",
    "id": "example:azure_mastery_watch"
  },
  "condition": {"type": "mxt:resource_compare", "resource": "example:azure_mastery", "min": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": "amount"},
  "cooldown": 20
}
```

- The signal id a script publishes has no entry in the built-in signals table, so `trigger` can only be `mxt:js`: its `signal` declares which signal id is being listened for, and `id` names the callback registered by `MxtTriggers.matcher(id, callback)`. **With no callback the trigger never matches** — write the rule and forget the callback and it quietly does nothing.
- The parent context of `condition` and `action` is the event context, so the **numbers** the publisher put into `values` are readable here: `action`'s `"amount"` is exactly the number handed to `publish`. Writing `"amount * 2"` makes it "the publisher sets the base, the rule sets the multiplier".
- `cooldown` is remembered **per rule id, on the subject** (saved, not cleared by death) rather than being a global rate limit; two entities holding the same rule roll and cool down separately.
- A rule needs a subject: a signal with no subject reaches subscriptions only.

If you register the rule alone, the `mxt:js` callback still has to exist (even if it just returns `true`), because it is what answers "does this count as a match":

```js
// kubejs/server_scripts/mxt_signals.js
MxtTriggers.matcher('example:azure_mastery_watch', (signal, params, context) => true)
```

## Step 4 — Catching It with a Script Subscription

A subscription is the script's own side: `subscribe(entity, signal, key, callback)` hangs a callback on **one entity** and returns a boolean. The key is the subscription's identity and is **unique per entity** — registering the same key again replaces the old subscription whatever signal it was listening to, while the same key on different entities does not interfere. Give every signal its own key.

```js
// kubejs/server_scripts/mxt_signals.js
function onMasterySignal(signal) {
  const amount = signal.context().formula().explicit('amount')
  console.info(`[example] ${signal.type()} -> +${amount}`)
}

function watch(entity) {
  // Re-registering the same key replaces the old subscription, so calling this repeatedly is safe.
  if (!MxtTriggers.has(entity, WATCH_KEY)) {
    MxtTriggers.subscribe(entity, SIGNAL, WATCH_KEY, onMasterySignal)
  }
}

// Attach for new entities; /reload drops subscriptions, so online players are re-armed on tick.
EntityEvents.spawned(event => watch(event.entity))
ServerEvents.tick(event => event.server.players.forEach(watch))
```

- **Entity scope** is the whole shape: a signal is delivered only to the subscriptions of the entity named at publish time. Publish the same signal for another player and your callback does not fire.
- The callback receives a `TriggerSignal` whose accessors are `type()` (the signal id), `gameTime()`, `context()` and `source()` (a nullable origin id). The context offers `actor()`, `target()`, `level()`, `position()`, `item()`, `block()`, `damageSource()`, `formula()`, plus `get(key)` and `data()` for the published values. **Treat the context as read-only**: several subscribers of one signal share it.
- The runtime owns the lifetime: `has(entity, key)` asks whether it is there, `unsubscribe(entity, key)` takes it off, and `subscriptions(entity)` counts them. On a running server, `/mxt trigger list` shows what is armed — for yourself in game, or for whoever you name as its entity argument.
- `subscribeOnce(entity, signal, key, callback)` registers a one-shot: **it removes itself after the first match**, which suits a quest step that may only complete once. It lives in the same table under the same key space as `subscribe`, so `has` / `unsubscribe` treat it the same way.
- Removal is immediate: a signal published later in the same tick no longer reaches a callback you just unsubscribed.

## Step 5 — Lifetime and Limits

| Boundary | What happens |
| --- | --- |
| Entity leaves the world, server stops, data pack reloads, server scripts reload | Every subscription is dropped and **never saved**; a reload also replaces the callback objects the subscriptions referenced, so rebuild them from a runtime hook. |
| `publish` on a client-side entity | Returns `false` and publishes nothing. Both ends exist on the server only. |
| The subject is a fake player | The whole signal is dropped: automation and command plumbing drive fake players that have no session to act with, so not even a subscription is dispatched (the **return value is still `true`**, so the publisher cannot tell). |
| A rule's behaviour publishes the signal that rule answers | It is skipped for the duration of its own execution, so it cannot recurse forever. |
| A rule throws | It logs and leaves the other rules and the subscriptions of the same signal alone. |
| A subscription callback throws | It logs and leaves the entity's other subscriptions alone. |
| The signal has no subject | It reaches subscriptions only; a rule's `condition` / `action` both need an entity. |
| Custom versus built-in signals | Both sides see one dispatch: subscribing to the built-in `mxt:kill` and subscribing to a name of your own travel the same road, and publishing under a built-in id is picked up by the rules waiting for it. Only the spelling differs — a built-in id has a matcher that hard-codes it, a custom one takes `mxt:js` plus a callback. |

A server script reload also replaces the callbacks `MxtTriggers.matcher` registered, so keep the `mxt:js` callback in the same script and let it re-register with the reload.

## Verify

```text
(reopen the world) → registries are read then
/mxt registries validate                        → no codec errors
/mxt trigger rules example:azure_mastery_signal → lists the rule (1)
/mxt resource example:azure_mastery             → current mastery
/mxt trigger publish example:azure_mastery_signal   → publishes once by hand (needs gamemaster)
/mxt trigger list                               → the subscriptions currently armed
```

1. After reopening the world, `/mxt trigger rules example:azure_mastery_signal` reports one rule. The signals offered there are the ones some rule answers or some subscription listens for, so a rule has to load before its signal shows up.
2. `/mxt trigger publish example:azure_mastery_signal` carries only `actor` and `level` — there is **no** `amount` payload, so the rule's `action` evaluates `"amount"` to 0 and adds nothing, and the `cooldown` formula reads 0 too, so that cooldown does not apply either. The subject also needs at least `1` mastery to begin with, or `condition` refuses that publish outright.
3. Call `publishMasteryGain(player, 5)` once in game (from an item use or a command handler, say): mastery gains 5 and the rule starts its 20-tick cooldown, so a second publish inside those 20 ticks adds nothing. Change `action` to `"amount * 2"`, publish again, and it adds 10.
4. For the subscription side, `/mxt trigger list` should show an entry with module `kubejs`, identity `example:azure_mastery_watch` and signal `example:azure_mastery_signal`. Unsubscribe it and that entry disappears at once.
5. Comment out the `MxtTriggers.matcher('example:azure_mastery_watch', ...)` line, `/reload`, then publish again: the rule no longer fires (no callback means no match) while the subscription still receives it — the two are independent roads.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The signal is published but the rule never reacts | The `mxt:js` `id` has no matching `MxtTriggers.matcher` callback; with the callback missing or throwing, that trigger never matches. **Nothing is reported.** |
| The signal is published but the subscription never fires | The entity named at publish time is not the entity the subscription is on. Subscriptions are stored per entity, so publishing for somebody else never reaches yours. |
| Every subscription is gone after a script reload | Subscriptions are runtime only and never saved, and a reload replaces the callback objects; rebuild them from a runtime hook. |
| A new subscription on the same entity displaced the old one | A key is unique per entity. Registering the same key again replaces the old subscription even when it listened to a different signal. |
| The callback cannot read `source` | Only **finite numbers** enter the formula context; read a string or any other non-number payload with `signal.context().get('source')`. |
| `/mxt trigger publish` says nobody is listening | At that moment the signal has neither a rule answering it nor a subscription armed. Once the rule loads or the subscription is attached, that goes away. |
| The resource the rule adds went up twice | A rule and a subscription both hang on the same signal and both change the same value. They are independent roads and both run. |
| Publishing returns `false` on a client | Publishing and subscribing are server-side; a client-side entity does nothing. |
| The signal fired but the wrong entity was affected | A rule's `condition` and `action` are evaluated against the **signal's subject** — the first argument of `publish`. |
| The JSON edit changed nothing | Rules are a data pack registry, read while the world loads; `/reload` does not re-read them. |

## Next

- [MxtTriggers: Trigger Signals](../kubejs/api/triggers.md) — every method, the payload, and the full subscription lifetime.
- [MxtEvents: Events](../kubejs/api/events.md) — the other script entry point that pairs with signals: an event is a cancellable call, a signal is a notification after the fact.
- [trigger (Event Rules)](../datapack/json/trigger.md) — the rule's fields and what `chance` and `cooldown` mean.
- [Define a Technique and Its Levels](./define-a-technique.md) — the chain the value this page's rule writes belongs to.
- [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) — the page this one assumes is done.
