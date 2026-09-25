---
title: 'MxtQuality: Quality'
description: Read the quality a stack resolves to and the chain it belongs to, or write the override component and climb a chain one tier at a time.
---

# `MxtQuality`: Quality

Quality lives on the **item stack**, so these methods all name the stack they act on; `entity` is only the starting point for registry lookups. Writes only take effect on the server, where a client call answers `null` / `false` and changes nothing.

Resolution is a fixed five-step order: the **override component** on the stack, then a forge result, then a **definition default** (`quality` on an artifact or a technique), then the **chain's `default`**, then the `quality` a matching **spirit herb** declares. The full rules are on [Quality Chain](/en/datapack/json/quality_chain).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `get(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The quality ID this stack resolves to right now; `null` when it has none. |
| `chain(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The **chain** this stack's quality belongs to: what a binding table declares wins, otherwise the single chain holding that tier; `null` when several chains hold it (it does not guess). |
| `next(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The next tier up that chain; `null` when it is already at the top or has no chain. |
| `set(entity, stack, quality)` | `Entity`, `ItemStack`, quality ID | `boolean` | Writes the quality **override component** onto this stack, outranking the definition default; an unresolvable ID or a client call answers `false`. |
| `clear(entity, stack)` | `Entity`, `ItemStack` | `boolean` | Removes the override component so the stack falls back to its definition default; `false` when there was no override. |
| `upgrade(entity, stack)` | `LivingEntity`, `ItemStack` | `{changed, failure, from, to}` | Moves **one tier** up the chain: the step's `condition` first, then its `costs` paid through the global cost transaction (atomic), so a step that cannot be paid moves nothing and writes no tier. |

`failure` on `upgrade` is one of `SERVER_ONLY`, `EMPTY` (nothing in hand), `NO_QUALITY`, `NO_CHAIN` (no chain at all), `AMBIGUOUS_CHAIN` (several chains hold that tier, so there is no single way up), `NOT_MEMBER` (the tier is not on the chain it belongs to), `AT_TOP`, `NO_STEP` (that step declares no cost, so it cannot be taken), `DISABLED` (the next tier is disabled by `mxt:disabled`), `CONDITION_FAILED`, `INSUFFICIENT_RESOURCE` or `INSUFFICIENT_COST`. On success `from` and `to` are the quality IDs before and after the step, and both are `null` on failure.

```js
// kubejs/server_scripts/mxt_quality.js
// Push a finished piece one tier up its chain, and say why when it will not move.
const result = MxtQuality.upgrade(player, event.item)
if (result.changed) {
  player.tell(`quality raised to ${result.to}`)
} else {
  console.warn(`upgrade refused: ${result.failure}`)
}
// Override one tier directly (ignoring the chain default); clear returns it to the definition default.
MxtQuality.set(player, event.item, 'mxt_test:excellent')
```

## Related

- Data pack side: the tier entries [quality](/en/datapack/json/quality) and the chains [quality_chain](/en/datapack/json/quality_chain).
- The command spelling of the same entry point: [`/quality`](/en/player-guide/commands/quality).
- [KubeJS API Reference](/en/kubejs/api-reference).
