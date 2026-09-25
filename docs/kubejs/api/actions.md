---
title: MxtActions：脚本 Action
---

# `MxtActions`：脚本 Action

## 注册脚本 Action

| 方法 | 回调参数 | 作用 |
| --- | --- | --- |
| `entity(id, callback)` | `(entity: Entity, params: object, context: FormulaContext)` | 注册实体 Action。 |
| `biEntity(id, callback)` | `(actor: Entity, target: Entity, params: object, context: FormulaContext)` | 注册双实体 Action。 |
| `block(id, callback)` | `(level: Level, pos: BlockPos, params: object, context: FormulaContext)` | 注册方块位置 Action。 |
| `item(id, callback)` | `(holder: Entity, stack: ItemStack, params: object, context: FormulaContext)` | 注册物品 Action。 |

四种回调都对应数据包中的 `type: "mxt:js"`。回调抛出的异常会被捕获、写入错误日志，当前 Action 终止，但不会令服务器崩溃。

最后一个参数是本次派发所用的公式上下文，因此脚本能读到数据包 Action 能读到的同一份事件载荷。只有事件知道的数值（例如 `damage`）就是这样拿到的：

```js
MxtActions.entity('example:knockback_on_hit', (entity, params, context) => {
  const damage = context.explicit('damage')
  if (Number.isNaN(damage)) return
  entity.push(0, params.strength * damage, 0)
})
```

不需要上下文时少写几个参数即可，JavaScript 会忽略多余实参。可用的变量方法见 [`FormulaContext`](/kubejs/api/values#formulacontext)；内置变量都能读，但不能注册新变量。

## 直接运行任意内置 Action

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `executeEntity(entity, definition)` | `Entity`、实体 Action JSON | `void` | 通过 `EntityAction.CODEC` 解析并执行。 |
| `executeBiEntity(actor, target, definition)` | 两个 `Entity`、双实体 Action JSON | `void` | 以 `actor` 作为公式上下文主体。 |
| `executeBlock(level, pos, definition)` | `Level`、`BlockPos`、方块 Action JSON | `void` | 以世界作为公式上下文。 |
| `executeItem(holder, stack, definition)` | `Entity`、`ItemStack`、物品 Action JSON | `void` | 以持有者作为公式上下文主体。 |

`definition` 是一个 Action 对象，格式与数据包内单个 Action 完全一致，`type` 会走现有固有注册表分派：

```js
MxtActions.executeEntity(player, {
  type: 'mxt:heal',
  amount: 4
})
```

## 相关

- 条件侧的同一套写法：[MxtConditions](/kubejs/api/conditions)。
- 回调收到的 `context`：[MxtValues](/kubejs/api/values#formulacontext)。
- 数据包侧：[实体行为类型](/datapack/types/action/entity_action_types)、[双实体行为类型](/datapack/types/action/bientity_action_types)、[方块行为类型](/datapack/types/action/block_action_types)、[物品行为类型](/datapack/types/action/item_action_types)。
- [KubeJS API 参考](/kubejs/api-reference)。
