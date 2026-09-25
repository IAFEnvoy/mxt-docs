---
title: 'MxtLoot: Loot Conditions and Functions'
description: Register script conditions and functions for vanilla loot tables, so an ordinary loot table can call into a server script.
---

# `MxtLoot`: Loot Conditions and Functions

MiXianTu adds a few types to the vanilla loot tables; `MxtLoot` lets a script provide two of them, so an ordinary loot table can call into a server script without an item or a block being involved.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `condition(id, callback)` | Callback ID, `(lootContext, params) => boolean` | `void` | Registers the vanilla loot condition type `mxt:js`. |
| `function(id, callback)` | Callback ID, `(stack, lootContext, params) => ItemStack` | `void` | Registers the vanilla loot function type `mxt:js`. |

```js
// KubeJS does not bind the vanilla loot parameter keys as a global, so load the class once.
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')

MxtLoot.condition('example:first_clear', (loot, params) => {
  const player = loot.getParam(LootParams.THIS_ENTITY)
  return player != null && player.tags.contains(`cleared_${params.dungeon}`)
})

MxtLoot.function('example:bless', (stack, loot, params) => {
  stack.grow((params.multiplier || 1) - 1)
  return stack
})
```

```json
{
  "conditions": [{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}],
  "functions": [{"function": "mxt:js", "id": "example:bless", "params": {"multiplier": 3}}]
}
```

Both callbacks run on the server while loot is generated, and neither receives a `FormulaContext`: read the vanilla `LootContext` instead, for example with `loot.getParam(LootParams.THIS_ENTITY)`. A loot function returns the stack to keep — return its argument unchanged to leave the drop alone, return a new stack to replace it, or return `null` to keep the original. A missing callback makes a condition false and leaves a function's stack untouched, with a warning in the log.

## Related

- The loot table itself is vanilla format; only these two types are claimed by `mxt:js`. Registering an `id` is described in the `mxt:js` section of the [API Reference](/en/kubejs/api-reference).
- [MxtTriggers](/en/kubejs/api/triggers) — the other object where a script provides a data pack type.
- [KubeJS API Reference](/en/kubejs/api-reference).
