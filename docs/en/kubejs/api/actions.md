---
title: "MxtActions: Script Actions"
---

# `MxtActions`: Script Actions

## Registering a Script Action

| Method | Callback parameters | Purpose |
| --- | --- | --- |
| `entity(id, callback)` | `(entity: Entity, params: object, context: FormulaContext)` | Registers an entity action. |
| `biEntity(id, callback)` | `(actor: Entity, target: Entity, params: object, context: FormulaContext)` | Registers a bi-entity action. |
| `block(id, callback)` | `(level: Level, pos: BlockPos, params: object, context: FormulaContext)` | Registers a block position action. |
| `item(id, callback)` | `(holder: Entity, stack: ItemStack, params: object, context: FormulaContext)` | Registers an item action. |

All four callbacks correspond to `type: "mxt:js"` in a data pack. An exception thrown by a callback is caught and written to the error log; the current action is aborted, but the server does not crash.

The last argument is the live formula context of the dispatch, so a script reads the same event payload a data pack action could. This is how a script action sees a value such as `damage` that only the event knows about:

```js
MxtActions.entity('example:knockback_on_hit', (entity, params, context) => {
  const damage = context.explicit('damage')
  if (Number.isNaN(damage)) return
  entity.push(0, params.strength * damage, 0)
})
```

Register the callback with fewer parameters when the context is not needed — JavaScript ignores extra arguments. See [`FormulaContext`](/en/kubejs/api/values#formulacontext) for the variable methods; a script can read every built-in variable but cannot register a new one.

## Running Any Built-in Action Directly

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `executeEntity(entity, definition)` | `Entity`, entity action JSON | `void` | Decodes and runs it through `EntityAction.CODEC`. |
| `executeBiEntity(actor, target, definition)` | Two `Entity`, bi-entity action JSON | `void` | Uses `actor` as the formula context subject. |
| `executeBlock(level, pos, definition)` | `Level`, `BlockPos`, block action JSON | `void` | Uses the level as the formula context. |
| `executeItem(holder, stack, definition)` | `Entity`, `ItemStack`, item action JSON | `void` | Uses the holder as the formula context subject. |

`definition` is an action object whose format is exactly the same as a single action inside a data pack, and its `type` goes through the existing built-in registry dispatch:

```js
MxtActions.executeEntity(player, {
  type: 'mxt:heal',
  amount: 4
})
```

## Related

- The same shape on the condition side: [MxtConditions](/en/kubejs/api/conditions).
- The `context` a callback receives: [MxtValues](/en/kubejs/api/values#formulacontext).
- Data pack side: [Entity Action Types](/en/datapack/types/action/entity_action_types), [Bi-entity Action Types](/en/datapack/types/action/bientity_action_types), [Block Action Types](/en/datapack/types/action/block_action_types) and [Item Action Types](/en/datapack/types/action/item_action_types).
- [KubeJS API Reference](/en/kubejs/api-reference).
