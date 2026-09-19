---
title: "MxtConditions: Script Conditions"
---

# `MxtConditions`: Script Conditions

## Registering a Script Condition

| Method | Callback parameters | Return value |
| --- | --- | --- |
| `entity(id, callback)` | `(entity, params, context)` | `boolean` |
| `biEntity(id, callback)` | `(actor, target, params, context)` | `boolean` |
| `block(id, callback)` | `(level, pos, params, context)` | `boolean` |
| `item(id, callback)` | `(holder, stack, params, context)` | `boolean` |
| `damage(id, callback)` | `(source: DamageSource, amount: number, params, context)` | `boolean` |

They correspond to the `mxt:js` built-in types of the Entity, BiEntity, Block, Item and Damage conditions respectively. Returning `true` means the condition is met; an unregistered condition and a callback that throws are both treated as `false`. The trailing `context` argument is the formula context of the test, exactly as for script actions.

## Testing Any Built-in Condition Directly

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `testEntity(entity, definition)` | `Entity`, entity condition JSON | `boolean` | Decodes `EntityCondition.CODEC`. |
| `testBiEntity(actor, target, definition)` | Two `Entity`, bi-entity condition JSON | `boolean` | The formula context comes from `actor`. |
| `testBlock(level, pos, definition)` | `Level`, `BlockPos`, block condition JSON | `boolean` | The formula context comes from the level. |
| `testItem(holder, stack, definition)` | `Entity`, `ItemStack`, item condition JSON | `boolean` | The formula context comes from the holder. |
| `testDamage(level, source, amount, definition)` | `Level`, `DamageSource`, damage amount, damage condition JSON | `boolean` | Uses the formula context of the direct source entity when there is one, otherwise an empty context. |

```js
const enoughQi = MxtConditions.testEntity(player, {
  type: 'mxt:resource_compare',
  resource: 'mxt:spirit_power',
  min: 10
})
```
