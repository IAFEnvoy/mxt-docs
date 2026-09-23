---
title: MxtCosts 与 MxtResources
---

# `MxtCosts` 与 `MxtResources`

## `MxtCosts`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `check(player, definition)` | `Player`、任一种 `Cost` 写法 | `boolean` | 只回答「这里付得出吗」：只读，不改变背包、数值或灵气，客户端脚本也可以调用。 |
| `consume(player, definition)` | `Player`、任一种 `Cost` 写法 | `boolean` | 先检查再支付，整份消耗**全有或全无**；无法支付时不做任何改动。仅服务端：在客户端脚本中调用只记录一次警告并返回 `false`，不会改动玩家。 |
| `register(id, check, consume)` | 回调 ID、`(player, params, context) => boolean`、`(player, params, context) => void` | `void` | 注册脚本 Cost。数据包类型：`mxt:js`。 |

`check` 与 `consume` 收的是**同一个 `Cost` 形状**（五种写法见[共享数据类型](/datapack/types/shared_data_types#cost)），走同一笔事务：`check` 是只读的预检，`consume` 一次性支付。

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

脚本 Cost 需要玩家，并且在其它通道（数值、灵气、物品）全部付完之后**最后**运行；它不做暂存，所以回调必须自己保持幂等。`Cost` 只用付款者做检查，因此回调拿到的 `context` 由该付款者构建，不含事件载荷——`context.value('level')` 可用，`context.value('damage')` 不可用。

支持完整 Cost 注册表分派。当前内置类型：

```js
// 消耗数值。完整写法
{ type: 'mxt:resource', resource: 'mxt:spirit_power', amount: 10 }

// 消耗数值。兼容简写（`MxtCosts` 与 `MxtResources.consume` 都接受）。
{ id: 'mxt:spirit_power', amount: 10 }

// 消耗灵气。付款者支付时扣该灵气度量的数值。
{ type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 2 }

// 消耗物品。items 接受物品 ID、物品 tag，或 ItemMatcher 对象。
{ type: 'mxt:item', items: ['minecraft:emerald', '#c:mystic_gems'], amount: 2 }

// 交给脚本。id 是 MxtCosts.register 注册的回调。
{ type: 'mxt:js', id: 'example:quest_token', params: { count: 3 } }
```

单个 `Cost` 是安全入口；多项消耗请使用下方的 `MxtResources.consume`，它把整份数组当成一笔原子事务。不要把多个 `MxtCosts.consume` 当成一次原子支付。

## `MxtResources`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `consume(entity, costs)` | 活着的实体、`Cost[]` | `ResourceTransactions.Result` | 原子支付整份数组，**全有或全无**；任一项付不出时什么都不扣。 |

`costs` 就是上面那套**统一的 `Cost` 数组**：五种写法都能直接写，旧的 `{"id": ..., "amount": ...}` 简写仍然有效（读作 `mxt:resource`）。付款者必须是**活着的实体**（不需要是玩家，但需要玩家背包的 `mxt:item` 与需要玩家的 `mxt:js` 对非玩家付款者就是付不出）。无法解码的条目**不再被静默丢掉**，而是让这次调用直接失败——从前那种「打一条 WARN、丢掉那一项、整笔照常提交」的行为已经没有了。

```js
const result = MxtResources.consume(player, [
  { id: 'mxt:spirit_power', amount: 10 },
  { type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 'level + 2' }
])

if (result.committed()) {
  console.info(`已扣除: ${result.amounts()}`)
} else {
  console.warn(`付不出: ${result.failedResource()}`)
}
```

返回 record 的访问器为 `committed()`、`failedResource()`、`amounts()`。在客户端、非法公式或任一项付不出时 `committed()` 均为 `false`。
