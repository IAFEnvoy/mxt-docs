---
title: MxtResources：整份消耗
description: 把一整份 Cost 数组当作一笔原子事务支付：任一项付不出，什么都不扣。
---

# `MxtResources`：整份消耗

`MxtResources` 只有一个方法，但它管的是**多项目一起付**这件事：整份 `Cost` 数组是一笔事务，任一项付不出就全都不扣，因此不会出现"扣了灵气却没扣物品"的中间状态。单个 `Cost` 用 [MxtCosts](/kubejs/api/costs)。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `consume(entity, costs)` | 活着的实体、`Cost[]` | `ResourceTransactions.Result` | 原子支付整份数组，**全有或全无**；任一项付不出时什么都不扣。 |

`costs` 就是统一的 `Cost` 数组：五种写法都能直接写，旧的 `{"id": ..., "amount": ...}` 简写仍然有效（读作 `mxt:resource`）。付款者必须是**活着的实体**（不需要是玩家，但需要玩家背包的 `mxt:item` 与需要玩家的 `mxt:js` 对非玩家付款者就是付不出）。无法解码的条目**不再被静默丢掉**，而是让这次调用直接失败——从前那种「打一条 WARN、丢掉那一项、整笔照常提交」的行为已经没有了。

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

## 相关

- 单个 `Cost` 与它的五种写法：[MxtCosts](/kubejs/api/costs)、[共享数据类型](/datapack/types/shared_data_types#cost)。
- 扣在哪个通道上（付款者、脚下灵气池、方块库存）：[共享数据类型](/datapack/types/shared_data_types#cost)。
- 数值本身：[MxtValues](/kubejs/api/values)、[数值 `resource`](/datapack/json/resource)。
- [KubeJS API 参考](/kubejs/api-reference)。
