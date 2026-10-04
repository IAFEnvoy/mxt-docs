---
title: 'MxtQuality: Quality'
description: Read the quality a stack resolves to and the chain it belongs to, or write the override component and climb a chain one tier at a time.
---

# `MxtQuality`: Quality

Quality lives on the **item stack**, so these methods all name the stack they act on; `entity` is only the starting point for registry lookups. Writes only take effect on the server, where a client call answers `null` / `false` and changes nothing.

Resolution has a fixed three-layer order, first hit wins: the **`mxt:quality` override component** on the stack (what `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription write; when the id written on it names no entry in the current pack, this layer answers nothing), then the `quality` **the definition the stack itself carries** declares, then the `default_quality` data map. Nine definitions answer in that second layer: `technique`, `alchemy_furnace`, `alchemy_wall_material`, `spirit_root`, `physique`, `pill`, `formation`, `secret_realm` and `contract_type` — several definitions of a type share one built-in item, so the item itself cannot say which tier applies. `artifact` and `spirit_herb` are claimed by item, and a `talisman` carrier holds a list of bills, so none of those three has a single definition on the stack to ask and their tier is written in layer 3 alone. The full rules are on [Quality](/en/datapack/json/quality).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `get(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The quality ID this stack resolves to right now; `null` when it has none. |
| `chain(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The **ladder** this stack's quality belongs to: the name of the ladder that tier sits on; `null` when it sits on none, or when the ladder's entry tier carries no name. |
| `next(entity, stack)` | `Entity`, `ItemStack` | `String` or `null` | The next tier up that ladder; `null` when it is already at the top or has no ladder. |
| `set(entity, stack, quality)` | `Entity`, `ItemStack`, quality ID | `boolean` | Writes the quality **override component** onto this stack, outranking the definition it carries and the data map; a **malformed** ID string throws on the spot, while a well-formed ID the current pack does not provide, or a client call, answers `false`. |
| `clear(entity, stack)` | `Entity`, `ItemStack` | `boolean` | Removes the override component (what a forge settlement and an inscription write too), so the stack falls back to the tier **the definition it carries** declares and then to the data map; `false` when there was no override. |
| `upgrade(entity, stack)` | `LivingEntity`, `ItemStack` | `{changed, failure, from, to}` | Moves **one tier** up the ladder: the **next tier's** `upgrade_condition` first, then its `upgrade_costs` paid through the global cost transaction (atomic), so a step that cannot be paid moves nothing and writes no tier. |

`failure` on `upgrade` is one of `SERVER_ONLY`, `EMPTY` (nothing in hand), `NO_QUALITY`, `NO_CHAIN` (no ladder at all, or the declared one does not walk in the current pack), `AT_TOP`, `CONDITION_FAILED`, `INSUFFICIENT_RESOURCE` or `INSUFFICIENT_COST`. On success `from` and `to` are the quality IDs before and after the step, and both are `null` on failure.

```js
// kubejs/server_scripts/mxt_quality.js
// Push a finished piece one tier up its chain, and say why when it will not move.
const result = MxtQuality.upgrade(player, event.item)
if (result.changed) {
  player.tell(`quality raised to ${result.to}`)
} else {
  console.warn(`upgrade refused: ${result.failure}`)
}
// Override one tier directly; clear falls back to the tier the carried definition declares, then to what the data map writes.
MxtQuality.set(player, event.item, 'mxt_test:excellent')
```

## Related

- Data pack side: both the tiers and the ladders are on [quality](/en/datapack/json/quality).
- The command spelling of the same entry point: [`/quality`](/en/player-guide/commands/quality).
- [KubeJS API Reference](/en/kubejs/api-reference).
