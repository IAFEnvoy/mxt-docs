---
title: "MxtEvents: Events"
---

# `MxtEvents`: Events

All events are registered in the server event group. Subscribe like this:

```js
MxtEvents.abilityUse(event => {
  if (event.isPre() && event.getAbility() === 'example:forbidden') {
    event.cancel()
  }
})
```

`event.cancel()` stops the current KubeJS listener chain immediately. It only cancels the MiXianTu transaction when the underlying event is a cancellable NeoForge event; calling it in a non-cancellable phase only stops the script listeners and does not undo game behaviour that has already happened.

## Dedicated Event Wrappers

| Event | Phases | Available methods | What can be changed |
| --- | --- | --- | --- |
| `abilityUse` | `Pre`, `Post` | `getEntity()`, `getAbility()`, `isPre()`, `getPaidCosts()` | `Pre` can be cancelled. `getPaidCosts()` returns an empty map in `Pre`. |
| `curseApply` | `Pre`, `Post` | `getCurse()`, `isPre()`, `getStacks()`, `setStacks(n)`, `getSource()`, `setSource(text)` | Only `Pre` can cancel and modify the stack count/source; the stack count must be greater than 0. Calling a setter on `Post` throws an exception. |
| `resourceConsume` | `Pre`, `Post` | `isPre()`, `getAmounts()`, `setAmount(resource, amount)` | Only `Pre` can cancel and modify a single resource amount; the amount must be finite and greater than 0. |
| `auraZone` | `enter`, `leave`, `tick`, `override` | `getKind()`, `getSource()`, `getConcentration()`, `isCultivationSuppressed()`, `getOverrideZone()` | Only `override` can be cancelled. `getOverrideZone()` returns an empty string when it is not an override. |
| `friendRelation` | none (a judgement event) | `getJudgeId()`, `getJudge()`, `hasJudge()`, `getCandidate()`, `getResult()`, `isAnswered()`, `setFriend(friend)`, `abstain()` | A script answers for itself: `setFriend(true/false)` gives a verdict, and `abstain()` hands the question back to the player's friend list. `getResult()` returns `"true"`, `"false"` or `"default"`. The judge is given as a **UUID** (`getJudgeId()` is always present), while `getJudge()` returns `null` when that player is offline, so test it with `hasJudge()` first. It is **not cancellable** and should not return a boolean — a verdict is only written through the setters. When no script listens, the event is not dispatched at all. |

The keys of a resource map are already converted to string IDs. For example:

```js
MxtEvents.resourceConsume(event => {
  if (!event.isPre()) return
  const amounts = event.getAmounts()
  if (amounts['mxt:spirit_power'] > 0) {
    event.setAmount('mxt:spirit_power', 5)
  }
})
```

`friendRelation` is a **judgement**: a script changes no game state, it only answers a question, so it has no phase and no cancellation.

```js
MxtEvents.friendRelation(event => {
  // Only this player counts as a friend; otherwise do nothing and hand the question back
  // to the player's own friend list. To use the judge entity, check hasJudge() first:
  // that player may be offline.
  if (event.getCandidate().getName().getString() === 'Alice') {
    event.setFriend(true)
  }
})
```

Abstaining, or calling `abstain()`, means "go by the list" and is **not** a denial. Every event is dispatched on the server.

## Generic Lifecycle Events

The remaining events use the generic wrapper, with these methods:

| Method | Return value / effect |
| --- | --- |
| `getType()` | The KubeJS event name, for example `cultivationBreak`. |
| `getPhase()` | The actual Java phase class name, for example `Pre`, `StrikePre`, `StartPost`. |
| `isCancellable()` | Whether the current phase can be cancelled. |
| `getEvent()` | The native MiXianTu event instance, whose Java accessors are listed in the table below. |
| `cancel()` | The standard KubeJS cancel method; it only cancels the underlying transaction when `isCancellable()` is `true`. |

In the table below, `native` stands for `const native = event.getEvent()`. Return values such as Identifier, Holder and Attachment are Java objects; use `String(value)` when you need a text ID.

| KubeJS event | Phase class names | Main `native` accessors / semantics |
| --- | --- | --- |
| `abilityTriggered` | `Pre`, `Post` | `getEntity()`, `getAbility()`, `signalType()`, `context()`; `Pre` can cancel the triggered ability. The native event's `ability()` returns `Holder<Ability>`; use `HolderHelper.id(...)` or the KubeJS wrapper's `getAbility()` when you need the ID. |
| `curseRemove` | `Pre`, `Post` | `curse()` (`Holder<Curse>`), `state()`, `reason()`, `gameTime()`, `holder()`; `Pre` can cancel the removal. reason is `EXPLICIT`, `EXPIRED`, `CLEANSED` or `REPLACED`, which are the only four values that have an emitter (a `replace` overwriting an old instance reports the `Post` as `REPLACED`, and that one cannot be cancelled). |
| `cultivationBreak` | `Pre`, `Post` | `target()` (`Holder<RealmStage>`), `threshold()`, `context()`, `spirit()`, `resources()`; `Pre` additionally has `originalCosts()`, `costs()` and `setCost(resource, amount)` and can cancel; `Post` has `paidCosts()`. |
| `techniqueLearn` | `Pre`, `Post` | `technique()` (`Holder<Technique>`), `spirit()`; `Pre` can cancel. |
| `alchemyCraft` | `Pre`, `Post` | `recipe()` (`RecipeHolder<AlchemyRecipe>`); `Pre.inputs()` is the list of input IDs and can cancel; `Post.spoiled()` and `Post.outputs()` are the result state. |
| `artifactRefine` | `Pre`, `Post` | `stack()`, `owner()`; `Pre` can cancel. |
| `forging` | `Start`, `Started`, `StrikePre`, `StrikePost`, `CompletePre`, `CompletePost`, `Cancel` | Every phase can read `player()` (`ServerPlayer`) and `pos()` (`BlockPos`, the position of the table). Per phase: `Start.blueprint()`; `Started/StrikePost/Cancel.session()`; `StrikePre.method()` (`Holder<ForgingMethod>`), `resources()`, `context()`, `costs()`, `setCosts(costs)`; `CompletePre.blueprint()`, `session()`; `CompletePost.blueprint()`, `session()`, `result()`. `Start`, `StrikePre`, `CompletePre` and `Cancel` can be cancelled. |
| `formation` | `Activate`, `Deactivate`, `Tick`, `TickEffects`, `UpkeepFailed` | `level()`, `controller()`, `instance()` (the formation ID comes from `instance().formation()`); `Activate`, `TickEffects` and `UpkeepFailed` can be cancelled, while `Deactivate` and `Tick` cannot. `Tick` observes a period whose upkeep has already been charged, `TickEffects` suppresses that period's effects without a refund, and cancelling `UpkeepFailed` lets the formation survive a period it could not pay for. |
| `lifespanEnd` | `Pre`, `Post` | `entity()`, `spirit()`; `Pre` can cancel the end, and after cancelling the lifespan is set to unlimited. |
| `realmInstance` | `Create`, `Destroy`, `EnterPre`, `EnterPost`, `Exit` | `definition()` (`Holder<RealmInstance>`), `dimension()` (`ResourceKey<Level>`, the instance dimension key), `index()` (which instance, counted from 0), `owner()` (`Optional<UUID>`), `server()`; the member events also have `member()` (`UUID`). Only `EnterPre` can be cancelled. `Create` is posted once a fresh instance dimension exists and before the first member lands; `Destroy` is posted when an instance ends — whether its terrain is deleted or (for a claimed realm) merely unloaded. |
| `soul` | `TransferPre`, `TransferPost`, `ReclaimPre`, `ReclaimPost` | `entity()`, `soul()`; every `*Pre` can be cancelled. |
| `spiritContract` | `Pre`, `Post` | `contract()`, `contractType()`, `requester()`, `action()`; `contractType()` is an `Optional<Holder<ContractType>>`, `action()` is `BIND`, `BREAK`, `RECALL` or `RELEASE`; `Pre` can be cancelled. |
| `tribulation` | `StartPre`, `StartPost`, `EntryPre`, `EntryPost`, `Complete` | `tribulation()` (`Holder<Tribulation>`), `data()`; the two entry events also expose `index()` (which beat it is, counted from 0) and `entry()`. `data()` is the attachment itself: `peek()`/`remaining()` read the beat at the head and how many are left, `state()` reads what that beat has kept, and `windup()` reads the ticks of start-up wind-up that are left (`0` once the timeline is running, or when the run has none). `StartPre` can be cancelled (refusing the attempt) and `EntryPre` can be cancelled (skipping that entry). |

## Two Extra Conventions for `forging`

**The session is read-only.** `session()` returns a `ForgingSessionView`, which can read `value()`, `steps()`, `optimalSteps()`, `history()` (an immutable list) and `canComplete()`, but **cannot** modify the session — the native `ForgingSession` is a mutable object and is no longer handed to listeners, so a call such as `event.getEvent().session().strike(...)` does not exist. The table itself is not handed to listeners either, only its position `pos()`; to read a slot, use `player.level().getBlockEntity(pos)`.

**A listener must not throw, and a throw does not break the operation.** The four decision events (`Start`, `StrikePre`, `CompletePre`, `Cancel`) are dispatched in the middle of the transaction, so when a listener throws, the server turns it into a rejection on the spot: the log records `LISTENER_ERROR` (distinct from `CANCELLED` when a script calls `cancel()` deliberately), the operation does not happen, materials are not consumed, and the session stays as it was. The three notification events (`Started`, `StrikePost`, `CompletePost`) are dispatched after the operation has already taken effect, so a throw is only logged and ignored.

For example, adjusting the breakthrough cost:

```js
MxtEvents.cultivationBreak(event => {
  if (event.getPhase() !== 'Pre') return
  const native = event.getEvent()
  native.setCost('mxt:spirit_power', 20)
})
```
