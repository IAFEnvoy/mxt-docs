---
title: 'MxtResources: Whole Cost Arrays'
description: 'Pay a whole Cost array as one atomic transaction: when any entry cannot be paid, nothing is deducted.'
---

# `MxtResources`: Whole Cost Arrays

`MxtResources` has a single method, but it is the one that pays **several entries together**: the whole `Cost` array is one transaction, so an entry that cannot be paid stops the entire payment and no half-charged state is left behind. For a single `Cost`, use [MxtCosts](/en/kubejs/api/costs).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `consume(entity, costs)` | a living entity, `Cost[]` | `ResourceTransactions.Result` | Pays the whole array atomically, **all or nothing**; when any one entry cannot be paid, nothing is deducted. |

`costs` is the **unified `Cost` array**: all five shapes can be written directly, and the older `{"id": ..., "amount": ...}` shorthand still works (it is read as `mxt:resource`). The payer has to be a **living entity** — it does not have to be a player, but `mxt:item` (which needs a player's inventory) and `mxt:js` (which needs a player) are simply unpayable for a non-player payer. An entry that cannot be decoded **is no longer dropped silently**: it fails the call, and the old behaviour of logging a WARN, discarding that entry while the rest still committed, is gone.

```js
const result = MxtResources.consume(player, [
  { id: 'mxt:spirit_power', amount: 10 },
  { type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 'level + 2' }
])

if (result.committed()) {
  console.info(`Deducted: ${result.amounts()}`)
} else {
  console.warn(`Could not pay: ${result.failedResource()}`)
}
```

The accessors of the returned record are `committed()`, `failedResource()` and `amounts()`. On the client, with an invalid formula, or when any entry cannot be paid, `committed()` is `false`.

## Related

- A single `Cost` and its five shapes: [MxtCosts](/en/kubejs/api/costs) and [Shared Data Types](/en/datapack/types/shared_data_types#cost).
- Which channel a cost is charged to (the payer, the aura pool underfoot, a block's own stock): [Shared Data Types](/en/datapack/types/shared_data_types#cost).
- The values behind it: [MxtValues](/en/kubejs/api/values) and [`resource`](/en/datapack/json/resource).
- [KubeJS API Reference](/en/kubejs/api-reference).
