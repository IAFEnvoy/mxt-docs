---
title: 'MxtTriggers: Trigger Signals'
description: Register mxt:js trigger matchers, publish custom signals and subscribe scripts to them; subscriptions live in runtime memory only.
---

# `MxtTriggers`: Trigger Signals

A trigger signal is the notification a data pack ability waits for, for example when its carrier lands a hit. `MxtTriggers` publishes the same signal from a script and lets a script wait for it, both through the runtime `TriggerDispatcher`, so script subscriptions, ability triggers and data pack [trigger rules](/en/datapack/json/trigger) observe the same dispatch — a script-published signal can drive a rule, and a rule's action can publish a signal a script waits for.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `matcher(id, callback)` | Callback ID, `(signal, params, context) => boolean` | `void` | Registers a datapack trigger matcher (`mxt:js`). |
| `publish(entity, signal, values)` | `Entity`, namespaced signal ID, `object` or `null` | `boolean` | Publishes a server-authoritative signal for that entity; `false` when the entity is on the client. |
| `subscribe(entity, signal, key, callback)` | `Entity`, signal ID, a stable key, `(signal: TriggerSignal) => void` | `boolean` | Registers a runtime subscription for that entity. |
| `subscribeOnce(entity, signal, key, callback)` | Same | `boolean` | Registers a subscription that removes itself after the first matching signal. |
| `unsubscribe(entity, key)` | `Entity`, the key used at registration | `boolean` | Removes one script subscription. |
| `has(entity, key)` | `Entity`, the key used at registration | `boolean` | Whether that subscription exists right now. |
| `subscriptions(entity)` | `Entity` | `number` | How many script subscriptions the entity currently has. |

## The Data Pack Side: `mxt:js` Matchers

`matcher` is the data pack side of the same mechanism: a `mxt:js` trigger declares the signal it listens to and lets a callback decide whether it fires. It is how an ability or a breakthrough condition waits for a custom signal id, which the built-in `mxt:tick`-style matchers cannot express:

```js
MxtTriggers.matcher('example:on_pill', (signal, params, context) => {
  return context.explicit('toxicity') >= (params.minimum || 0)
})
```

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill", "params": {"minimum": 10}}]
}
```

The callback receives the `TriggerSignal` and the signal's formula context, so it reads the payload values a script published with `MxtTriggers.publish`. A matcher never matches when its callback is missing or throws.

## Subscriptions

A key identifies one subscription per entity, so give each signal its own key: subscribing the same key again replaces the previous subscription, whichever signal it watched. A key is scoped to one entity, so the same key on another entity is a different subscription; `/mxt trigger list [<entity>]` shows what a running server actually has armed.

```js
// kubejs/server_scripts/mxt_triggers.js
const KEY = 'example:toxicity_watch'

function onPillTaken(signal) {
  const toxicity = signal.context().formula().explicit('toxicity')
  if (!Number.isNaN(toxicity)) console.info(`${signal.type()} with toxicity ${toxicity}`)
}

function watch(entity) {
  // Re-registering the same key replaces the previous subscription, so this guard only keeps
  // the per-tick pass cheap.
  if (!MxtTriggers.has(entity, KEY)) {
    MxtTriggers.subscribe(entity, 'example:pill_taken', KEY, onPillTaken)
  }
}

EntityEvents.spawned(event => watch(event.entity))

// /reload re-evaluates this script, which drops its subscriptions; this re-arms the players
// who are still online. Publishing works whether or not anything is subscribed.
ServerEvents.tick(event => event.server.players.forEach(watch))

// Publish from your own logic: a command handler, a quest hook, or an item use.
function publishPillTaken(player, toxicity) {
  MxtTriggers.publish(player, 'example:pill_taken', { pill: 'example:returning_pill', toxicity })
}
```

## What the Callback Receives

The callback receives a `TriggerSignal`, whose accessors are `type()` (the signal ID), `gameTime()`, `context()` and `source()` (a nullable source ID). The context exposes `actor()`, `target()`, `level()`, `position()`, `item()`, `block()`, `damageSource()` and `formula()`, plus `get(key)` (an `Optional`) and `data()` (the raw extension map) for the published values. Treat the context as read-only: it is shared with the other subscribers of the same signal.

`values` is copied into the trigger context as extension data, and every finite numeric value is also added to the trigger's formula context. A script callback therefore reads `toxicity` above through `signal.context().formula().explicit('toxicity')`, exactly like a data pack signal that carries `damage`.

## Subscription Lifetime

Trigger subscriptions are runtime-only and are never saved. They are dropped when the entity leaves the world, and also by a server stop, a data pack reload or a server script reload — a reload replaces the callback objects a subscription refers to. Keep a stable key and re-register from a runtime hook, as the example above does. A one-shot subscription removes itself after its first matching signal, which is enough for a quest step that must not repeat.

## Related

- Data pack side: [`trigger`](/en/datapack/json/trigger) and [Trigger and Cost Types](/en/datapack/types/other/trigger-and-cost).
- The side that waits on a signal: [MxtAbilities](/en/kubejs/api/abilities) (triggers on an ability).
- [KubeJS API Reference](/en/kubejs/api-reference).
