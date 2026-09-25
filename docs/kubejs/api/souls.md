---
title: MxtSouls：魂魄
description: 走权威流程回收实体可转移的魂魄。
---

# `MxtSouls`：魂魄

`MxtSouls` 是脚本侧的魂魄入口：它走权威的回收流程，只对**可转移魂魄**有效，并触发 `soul` 的回收 pre/post 事件（脚本可以在 `Pre` 拦下）。魂魄的**转移**没有脚本入口：它由物品与内容自己触发，脚本只能通过事件围观或取消。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `reclaim(entity)` | `Entity` | `boolean` | 使用权威魂魄回收流程。仅适用于可转移魂魄；会触发 `soul` 的回收 pre/post 事件。 |

```js
// kubejs/server_scripts/mxt_soul.js
if (!MxtSouls.reclaim(player)) {
  console.info('nothing reclaimable here')
}
```

## 相关

- 回收与转移时的回调：[MxtEvents](/kubejs/api/events) 的 `soul`。
- [KubeJS API 参考](/kubejs/api-reference)。
