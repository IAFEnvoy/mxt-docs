---
title: MxtConditions：脚本 Condition
---

# `MxtConditions`：脚本 Condition

## 注册脚本 Condition

| 方法 | 回调参数 | 返回值 |
| --- | --- | --- |
| `entity(id, callback)` | `(entity, params, context)` | `boolean` |
| `biEntity(id, callback)` | `(actor, target, params, context)` | `boolean` |
| `block(id, callback)` | `(level, pos, params, context)` | `boolean` |
| `item(id, callback)` | `(holder, stack, params, context)` | `boolean` |
| `damage(id, callback)` | `(source: DamageSource, amount: number, params, context)` | `boolean` |

它们分别对应 Entity、BiEntity、Block、Item、Damage Condition 的 `mxt:js` 固有类型。返回 `true` 表示满足；未注册或回调异常均视为 `false`。末尾的 `context` 是本次判定的公式上下文，与脚本 Action 完全一致。

## 直接测试任意内置 Condition

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `testEntity(entity, definition)` | `Entity`、实体 Condition JSON | `boolean` | 解析 `EntityCondition.CODEC`。 |
| `testBiEntity(actor, target, definition)` | 两个 `Entity`、双实体 Condition JSON | `boolean` | 公式上下文来自 `actor`。 |
| `testBlock(level, pos, definition)` | `Level`、`BlockPos`、方块 Condition JSON | `boolean` | 公式上下文来自世界。 |
| `testItem(holder, stack, definition)` | `Entity`、`ItemStack`、物品 Condition JSON | `boolean` | 公式上下文来自持有者。 |
| `testDamage(level, source, amount, definition)` | `Level`、`DamageSource`、伤害值、Damage Condition JSON | `boolean` | 有直接来源实体时使用其公式上下文，否则使用空上下文。 |

```js
const enoughQi = MxtConditions.testEntity(player, {
  type: 'mxt:resource_compare',
  resource: 'mxt:spirit_power',
  min: 10
})
```

## 相关

- 行为侧的同一套写法：[MxtActions](/kubejs/api/actions)。
- 回调收到的 `context`：[MxtValues](/kubejs/api/values#formulacontext)。
- 数据包侧：[实体条件类型](/datapack/types/condition/entity_condition_types)、[双实体条件类型](/datapack/types/condition/bientity_condition_types)、[方块条件类型](/datapack/types/condition/block_condition_types)、[物品条件类型](/datapack/types/condition/item_condition_types)、[伤害条件类型](/datapack/types/condition/damage_condition_types)。
- [KubeJS API 参考](/kubejs/api-reference)。
