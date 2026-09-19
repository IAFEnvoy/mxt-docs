---
title: MxtCosts and MxtResources
---

# `MxtCosts` and `MxtResources`

## `MxtCosts`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `check(player, definition)` | `Player`, one `Cost` JSON | `boolean` | Only checks; does not change the inventory or resources. It is read-only, so a client script may call it. |
| `consume(player, definition)` | `Player`, one `Cost` JSON | `boolean` | Checks first and then pays; when it cannot be paid nothing is changed. Server-only: on a client script it logs one warning and returns `false` without touching the player. |
| `register(id, check, consume)` | Callback ID, `(player, params, context) => boolean`, `(player, params, context) => void` | `void` | Registers a script cost. Datapack type: `mxt:js`. |

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

A script cost needs a player, because a cost that is not a `resource` cost makes the whole ability require one. `Cost` is checked with a player alone, so the `context` a cost callback receives is built from that player and carries no event payload; `context.value('level')` works, `context.value('damage')` does not.

Full cost registry dispatch is supported. The current built-in types:

```js
// Consume a resource. Typed cost form.
{ type: 'mxt:resource', resource: 'mxt:spirit_power', amount: 10 }

// Consume a resource. The id shorthand, which is also the resource-cost form MxtResources.consume takes.
{ id: 'mxt:spirit_power', amount: 10 }

// Consume items. items accepts an item ID, an item tag, or an ItemMatcher object.
{ type: 'mxt:item', items: ['minecraft:emerald', '#c:mystic_gems'], amount: 2 }
```

A single `Cost` is the safe entry point; for several resources use `MxtResources.consume` below, which has atomic transaction semantics. Do not treat several `MxtCosts.consume` calls as one atomic payment.

## `MxtResources`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `consume(entity, costs)` | `Entity`, `ResourceCost[]` | `ResourceTransactions.Result` | Pays a group of resources atomically; when any one of them is insufficient, none of the group is deducted. |

Each element of `costs` is a resource cost, whose fields are `id` and `amount`:

```js
const result = MxtResources.consume(player, [
  { id: 'mxt:spirit_power', amount: 10 },
  { id: 'mxt:fire_aura', amount: 'level + 2' }
])

if (result.committed()) {
  console.info(`Deducted: ${result.amounts()}`)
} else {
  console.warn(`Insufficient resource: ${result.failedResource()}`)
}
```

The accessors of the returned record are `committed()`, `failedResource()` and `amounts()`. On the client, with an invalid formula, or when the resources are not satisfied, `committed()` is `false`.
