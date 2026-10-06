---
title: 'MxtQuality: Quality'
description: Read the quality a stack resolves to and the chain it belongs to, compare two tiers, or write the override component and climb a chain one tier at a time.
---

# `MxtQuality`: Quality

Quality lives on the **item stack**, so these methods all name the stack they act on; `entity` is only the starting point for registry lookups. Writes only take effect on the server, where a client call answers `null` / `false` and changes nothing (which includes `satisfies`: called from a client script it answers `false`).

Resolution has a fixed three-layer order, first hit wins: the **`mxt:quality` override component** on the stack (what `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription write; when the id written on it names no entry in the current pack, this layer answers nothing), then the `quality` **the definition the stack itself carries** declares, then the `mxt:default_quality` registry. Nine definitions answer in that second layer: `technique`, `alchemy_furnace`, `alchemy_wall_material`, `spirit_root`, `physique`, `pill`, `formation`, `secret_realm` and `contract_type` — several definitions of a type share one built-in item, so the item itself cannot say which tier applies. `artifact` and `spirit_herb` are claimed by item, and a `talisman` carrier holds a list of bills, so none of those three has a single definition on the stack to ask and their tier is written in layer 3 alone. The full rules are on [Quality](/en/datapack/json/quality).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `get(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The quality ID this stack resolves to right now; `null` when it has none. |
| `chain(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The **ladder** this stack's quality belongs to: the name of the ladder that tier sits on; `null` when it sits on none, or when the ladder's entry tier carries no name. |
| `next(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The next tier up that ladder; `null` when it is already at the top or has no ladder. |
| `set(entity, stack, quality)` | `Entity`, `ItemStack`, quality ID | `boolean` | Writes the quality **override component** onto this stack, outranking the definition it carries and the `mxt:default_quality` registry; a **malformed** ID string throws on the spot, while a well-formed ID the current pack does not provide, or a client call, answers `false`. |
| `clear(entity, stack)` | `Entity`, `ItemStack` | `boolean` | Removes the override component (what a forge settlement and an inscription write too), so the stack falls back to the tier **the definition it carries** declares and then to the `mxt:default_quality` registry; `false` when there was no override. |
| `upgrade(entity, stack)` | `LivingEntity`, `ItemStack` | `{changed, failure, from, to}` | Moves **one tier** up the ladder: the **next tier's** `upgrade_condition` first, then its `upgrade_costs` paid through the global cost transaction (atomic), so a step that cannot be paid moves nothing and writes no tier. |
| `compare(entity, left, right)` | `Entity`, quality ID, quality ID | `Integer` or `null` | How many tiers apart two qualities stand on one shared ladder: **positive when the first is higher**, `0` for the same tier, and `null` when **no single ladder holds both** (two different ladders, or a ladder that does not walk in the current pack). It reads tiers only and touches no item stack. |
| `satisfies(entity, stack, requirement)` | `Entity`, `ItemStack`, `requirement` (a JSON object) | `boolean` | Whether the stack satisfies a **complete tier requirement**: `requirement` is written in the shape `mxt:quality` uses (a `quality` list and/or `min_quality`, at least one of them), which is the same question the data pack's condition, matcher entry and custom ingredient ask. The floor is a ladder comparison, so **it answers false across ladders**; **called from a client script it answers `false`**. |
| `atLeast(entity, stack, tier)` | `Entity`, `ItemStack`, quality ID | `boolean` | Whether the stack's resolved tier stands **at or above** the given tier on one shared ladder; **false across ladders and for a tier no ladder walks** (which is not "lower"). |

`failure` on `upgrade` is one of `SERVER_ONLY`, `EMPTY` (nothing in hand), `NO_QUALITY`, `NO_CHAIN` (no ladder at all, or the declared one does not walk in the current pack), `AT_TOP`, `CONDITION_FAILED`, `INSUFFICIENT_RESOURCE` or `INSUFFICIENT_COST`. On success `from` and `to` are the quality IDs before and after the step, and both are `null` on failure.

`compare` is the only entry point for "which tier is higher" (the data pack side's `min_quality` is answered by the same implementation): **a tier only has a size relative to another tier on its own ladder**, and two ladders' positions have nothing to do with each other, so a comparison across ladders is neither a pass nor a refusal but an **unanswerable** one — `null`. A tier against itself answers `0`; but when the ladder it sits on cannot be walked in the current pack (a cycle, a fork), it cannot even be compared with **itself** (also `null`), and no `min_quality` on the data pack side will pass then. A `next` pointing at a tier the pack does not provide fails the whole data pack load instead of answering here.

`requirement` on `satisfies` is **a JSON object**, not a string: `{ "min_quality": "example:tier_3" }`, `{ "quality": ["example:common", "#example:tiers"] }`, or both fields at once (then both have to hold). **An empty object is not refused**: refusing an empty requirement is a load-time rule on the data pack side, while here `{}` asks nothing and answers yes for every stack. It answers a whole requirement whereas `atLeast` answers a single floor, and both read "across ladders" and "the ladder does not walk" as no — never as "lower".

```js
// kubejs/server_scripts/mxt_quality.js
// Push a finished piece one tier up its chain, and say why when it will not move.
const result = MxtQuality.upgrade(player, event.item)
if (result.changed) {
  player.tell(`quality raised to ${result.to}`)
} else {
  console.warn(`upgrade refused: ${result.failure}`)
}
// Override one tier directly; clear falls back to the tier the carried definition declares, then to what the mxt:default_quality registry writes.
MxtQuality.set(player, event.item, 'mxt_test:excellent')
// Comparing tiers: positive means the first is higher, 0 means the same tier, null means no single ladder holds
// both - never read that as "lower".
const step = MxtQuality.compare(player, 'mxt_test:excellent', 'mxt_test:normal')
if (step !== null && step >= 0) {
  player.tell('that tier is at least common')
}
// A whole requirement (a membership list and/or a floor) - the same question the data pack asks; false across ladders.
const fits = MxtQuality.satisfies(player, event.item, { min_quality: 'mxt_test:normal' })
// A single floor only; false across ladders and for a ladder that does not walk - never read that as "lower".
const good = MxtQuality.atLeast(player, event.item, 'mxt_test:excellent')
```

## Related

- Data pack side: both the tiers and the ladders are on [quality](/en/datapack/json/quality).
- The command spelling of the same entry point: [`/quality`](/en/player-guide/commands/quality).
- [KubeJS API Reference](/en/kubejs/api-reference).
