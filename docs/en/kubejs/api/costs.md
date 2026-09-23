---
title: MxtCosts and MxtResources
---

# `MxtCosts` and `MxtResources`

## `MxtCosts`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `check(player, definition)` | `Player`, any of the five `Cost` shapes | `boolean` | Only answers "could this be paid here": it is read-only and changes no inventory, value or aura, so a client script may call it. |
| `consume(player, definition)` | `Player`, any of the five `Cost` shapes | `boolean` | Checks first and then pays, **all or nothing**; when it cannot be paid nothing is changed. Server-only: on a client script it logs one warning and returns `false` without touching the player. |
| `register(id, check, consume)` | Callback ID, `(player, params, context) => boolean`, `(player, params, context) => void` | `void` | Registers a script cost. Datapack type: `mxt:js`. |

`check` and `consume` take the **same `Cost` shape** (the five forms are on [Shared Data Types](/en/datapack/types/shared_data_types#cost)) and go through the same transaction: `check` is the read-only pre-flight and `consume` pays in one go.

```js
MxtCosts.register('example:quest_token',
  (player, params, context) => {
    const needed = params.count || 1
    return player.persistentData.getInt('tokens') >= needed
  },
  (player, params, context) => {
    const needed = params.count || 1
    player.persistentData.putInt('tokens', player.persistentData.getInt('tokens') - needed)
  }
)
```

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

A script cost needs a player and runs **last**, after every other channel (value, aura, item) has been paid; it is not staged, so the callback has to be idempotent about it. A `Cost` is checked with the payer alone, so the `context` a cost callback receives is built from that payer and carries no event payload; `context.value('level')` works, `context.value('damage')` does not.

Full cost registry dispatch is supported. The current built-in types:

```js
// Spend a value. Typed cost form.
{ type: 'mxt:resource', resource: 'mxt:spirit_power', amount: 10 }

// Spend a value. The id shorthand, accepted by MxtCosts and by MxtResources.consume.
{ id: 'mxt:spirit_power', amount: 10 }

// Spend an aura. It charges the value that aura is measured in.
{ type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 2 }

// Spend items. items accepts an item ID, an item tag, or an ItemMatcher object.
{ type: 'mxt:item', items: ['minecraft:emerald', '#c:mystic_gems'], amount: 2 }

// Delegate to a script. id is the callback registered with MxtCosts.register.
{ type: 'mxt:js', id: 'example:quest_token', params: { count: 3 } }
```

A single `Cost` is the safe entry point; for several entries use `MxtResources.consume` below, which treats the whole array as one atomic transaction. Do not treat several `MxtCosts.consume` calls as one atomic payment.

## `MxtResources`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `consume(entity, costs)` | a living entity, `Cost[]` | `ResourceTransactions.Result` | Pays the whole array atomically, **all or nothing**; when any one entry cannot be paid, nothing is deducted. |

`costs` is the **unified `Cost` array** described above: all five shapes can be written directly, and the older `{"id": ..., "amount": ...}` shorthand still works (it is read as `mxt:resource`). The payer has to be a **living entity** — it does not have to be a player, but `mxt:item` (which needs a player's inventory) and `mxt:js` (which needs a player) are simply unpayable for a non-player payer. An entry that cannot be decoded **is no longer dropped silently**: it fails the call, and the old behaviour of logging a WARN, discarding that entry while the rest still committed, is gone.

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
