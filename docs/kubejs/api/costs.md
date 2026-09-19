---
title: MxtCosts 与 MxtResources
---

# `MxtCosts` 与 `MxtResources`

## `MxtCosts`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `check(player, definition)` | `Player`、一个 `Cost` JSON | `boolean` | 只检查，不改变背包或资源。它是只读的，客户端脚本也可以调用。 |
| `consume(player, definition)` | `Player`、一个 `Cost` JSON | `boolean` | 先检查再支付；无法支付时不做改动。仅服务端：在客户端脚本中调用只记录一次警告并返回 `false`，不会改动玩家。 |
| `register(id, check, consume)` | 回调 ID、`(player, params, context) => boolean`、`(player, params, context) => void` | `void` | 注册脚本 Cost。数据包类型：`mxt:js`。 |

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

脚本 Cost 需要玩家：只要 `costs` 里存在非 `resource` 费用，整个技能就要求付款者是玩家。`Cost` 只用玩家做检查，因此回调拿到的 `context` 由该玩家构建，不含事件载荷——`context.value('level')` 可用，`context.value('damage')` 不可用。

支持完整 Cost 注册表分派。当前内置类型：

```js
// 消耗资源。完整写法
{ type: 'mxt:resource', resource: 'mxt:spirit_power', amount: 10 }

// 消耗资源。兼容简写（`Cost` 的简写与 `MxtResources.consume` 都用 `id` 字段）。
{ id: 'mxt:spirit_power', amount: 10 }

// 消耗物品。items 接受物品 ID、物品 tag，或 ItemMatcher 对象。
{ type: 'mxt:item', items: ['minecraft:emerald', '#c:mystic_gems'], amount: 2 }
```

单个 `Cost` 是安全入口；多项资源请使用下方的 `MxtResources.consume`，它具有原子事务语义。不要把多个 `MxtCosts.consume` 当成一个原子支付。

## `MxtResources`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `consume(entity, costs)` | `Entity`、`ResourceCost[]` | `ResourceTransactions.Result` | 原子支付一组资源；任一项不足时整组不扣除。 |

`costs` 的每个元素遵循 `ResourceCost` 格式，字段名是 `id`（`ResourceCost.CODEC` 的 `fieldOf("id")`），与 `Cost` 的简写一致；这里**不是**带 `type` 的 Cost 数组，所以没有 `resource` 字段。写错的元素**不会报错**：列表 Codec（`AutoIgnoreListCodec`）解码失败时只打一条 WARN 并**丢掉那一项**，于是这一项等于没写、整笔仍然提交成功。字段名请照着下面的例子抄。

```js
const result = MxtResources.consume(player, [
  { id: 'mxt:spirit_power', amount: 10 },
  { id: 'mxt:fire_aura', amount: 'level + 2' }
])

if (result.committed()) {
  console.info(`已扣除: ${result.amounts()}`)
} else {
  console.warn(`资源不足: ${result.failedResource()}`)
}
```

返回 record 的访问器为 `committed()`、`failedResource()`、`amounts()`。在客户端、非法公式或未满足资源时 `committed()` 均为 `false`。
