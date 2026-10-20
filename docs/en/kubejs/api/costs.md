---
title: 'MxtCosts: A Single Cost'
description: Check or pay one Cost; for several entries use the two-pass ordered MxtResources payment.
---

# `MxtCosts`: A Single Cost

`MxtCosts` takes **one** `Cost`: it either answers "could this be paid here" or pays it in one go. For several entries use [MxtResources](/en/kubejs/api/resources), which simulates the whole array before ordered deductions. Separate `MxtCosts.consume` calls check independently and do not share a preflight pass.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `check(player, definition)` | `Player`, any of the five `Cost` shapes | `boolean` | Only answers "could this be paid here": it is read-only and changes no inventory, value or aura, so a client script may call it. |
| `consume(player, definition)` | `Player`, any of the five `Cost` shapes | `boolean` | A simulation refusal returns `false` without deduction. Once simulation passes, a real failure or runtime exception only logs WARN and still returns `true`, without rollback. Server-only: on a client script it logs one warning and returns `false` without touching the player. |
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

A script cost needs a player and keeps its position in the cost array. Check must be read-only; consume failures are not refunded and do not cancel later fees or business effects. A `Cost` is checked with the payer alone, so the `context` a cost callback receives is built from that payer and carries no event payload; `context.value('level')` works, `context.value('damage')` does not.

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

## Related

- Several entries paid in one go: [MxtResources](/en/kubejs/api/resources).
- The `Cost` shapes and which channel each is charged to: [Shared Data Types](/en/datapack/types/shared_data_types#cost).
- [KubeJS API Reference](/en/kubejs/api-reference).
