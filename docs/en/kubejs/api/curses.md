---
title: 'MxtCurses: Curses'
description: Apply a curse with an optional duration, release one source, remove it outright, and query what an entity carries.
---

# `MxtCurses`: Curses

`MxtCurses` goes through the same `CurseService` a data pack or an item uses: conditions, stacking and the source ledger are all decided there, and a script bypasses none of it. Removal is the only way to settle a curse whose definition has been disabled or deleted.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `apply(entity, curse, stacks, source)` | `Entity`, curse ID, positive integer stack count, source ID (`namespace:path`) | `CurseService.ApplyResult` | Goes through the complete conditions and merging logic; the source joins the ledger. |
| `applyFor(entity, curse, stacks, source, durationTicks)` | As above plus a duration in ticks | `CurseService.ApplyResult` | The duration can only **tighten** the definition: a longer one is capped by the length the definition declares. |
| `remove(entity, curse)` | `Entity`, curse ID | `boolean` | Removes it with the `EXPLICIT` reason, **every source at once**; fires the removal event. This is the only way off for a disabled or deleted definition. |
| `release(entity, curse, source)` | `Entity`, curse ID, source ID | `boolean` | Drops that one source. It answers `true` only when that release is what removed the curse; `false` means the curse is still there — either another source still holds it or this source was never on the ledger, so `sources` is what to read when the two need telling apart. |
| `has(entity, curse)` | `Entity`, curse ID | `boolean` | Whether it is held; read from the attachment, so a disabled or deleted definition still answers honestly. |
| `stacks(entity, curse)` | `Entity`, curse ID | `int` | Its stack count, `0` when it is not held. |
| `remainingTicks(entity, curse)` | `Entity`, curse ID | `long` | Ticks left, `-1` when it never expires, `0` when it is not held. |
| `sources(entity, curse)` | `Entity`, curse ID | `List<String>` | Which sources are keeping that curse alive right now, sorted. |

Curses and ability grants share one source ledger: **it exists while at least one source holds it**, and the last source letting go is what removes it. `ApplyResult` exposes `applied()`, `cancelled()`, `failure()` and `instance()`; besides `CONDITION`, `CANCELLED` and `SERVER_ONLY`, `failure()` can be `DISABLED` (the definition carries `#mxt:disabled`), `UNKNOWN` (the definition is gone from the registry), `REENTRANT` (that curse is already in a transaction on the same entity, so a self-reference is refused) or `INVALID_DURATION` (the length cannot be met, so nothing was written). For `source` it is recommended to write a stable source such as `example:quest_reward`, so that data and events can be traced.

```js
// kubejs/server_scripts/mxt_curse.js
const result = MxtCurses.apply(target, 'example:fire_mark', 2, 'example:trap_trigger')
if (result.applied()) {
  console.info(`stacks now ${MxtCurses.stacks(target, 'example:fire_mark')}`)
} else {
  console.warn(`refused: ${result.failure()}`)
}
```

## Related

- Data pack side: [`curse`](/en/datapack/json/curse).
- The other user of the same source ledger: [MxtAbilities](/en/kubejs/api/abilities).
- Callbacks around applying and removing: `curseApply` and `curseRemove` in [MxtEvents](/en/kubejs/api/events).
- [KubeJS API Reference](/en/kubejs/api-reference).
