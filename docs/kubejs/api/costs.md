---
title: MxtCosts：单个消耗
description: 预检或支付一个 Cost；多个条目请用 MxtResources 的原子支付。
---

# `MxtCosts`：单个消耗

`MxtCosts` 收的是**一个** `Cost`：只回答"这里付得出吗"，或者一次性把它付掉。多个条目请用 [MxtResources](/kubejs/api/resources)，它把整份数组当成一笔原子事务；**不要把多次 `MxtCosts.consume` 当成一次原子支付**。

## 方法

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

## 相关

- 多条目一次付清：[MxtResources](/kubejs/api/resources)。
- `Cost` 的形状与它扣在哪条通道上：[共享数据类型](/datapack/types/shared_data_types#cost)。
- [KubeJS API 参考](/kubejs/api-reference)。
