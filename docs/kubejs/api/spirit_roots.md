---
title: MxtSpiritRoots：灵根
description: 查询、授予、移除与开关灵根；灵根是修炼身份中与元素绑定的那一半。
---

# `MxtSpiritRoots`：灵根

灵根是身体修炼身份的**元素那一半**：持有它就绑定了**一个或多个**元素（`elements` 是列表）、改变这些元素灵气的修炼速度，并缩放亲和其中任一元素的技能。元素无关的那一半是 [MxtPhysiques](/kubejs/api/physiques)。授予与移除都走权威服务，因此 `conflicting_elements` 冲突判定与"授予了哪些技能"照常处理。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**持有**的灵根 ID，按 ID 排序。关闭的灵根、定义已被停用或删除的灵根仍会列出——它确实还持有。 |
| `active(entity)` | `Entity` | `List<String>` | 现在**生效**的灵根：关掉的、以及绑定元素被停用的都不算。 |
| `has(entity, root)` | `Entity`、灵根 ID | `boolean` | 是否持有（与 `mxt:has_spirit_root` 同义：关闭也算持有）。 |
| `enabled(entity, root)` | `Entity`、灵根 ID | `boolean` | 该灵根是否处于开启状态；不持有则为 `false`。 |
| `grant(entity, root)` | `LivingEntity`、灵根 ID | `{changed, failure}` | 走权威服务授予，[`conflicting_elements`](/datapack/json/spirit_root) 与授予的能力都照常处理。 |
| `remove(entity, root)` | `LivingEntity`、灵根 ID | `boolean` | 放弃该灵根及其元素与一切授予；本来没持有则为 `false`。 |
| `setEnabled(entity, root, enabled)` | `LivingEntity`、灵根 ID、`boolean` | `{changed, failure}` | 「关闭但不失去」：状态真的变了并重算了授予才返回 `changed: true`，没持有则 `failure: "NOT_HELD"`。 |

灵根与体质共用同一套 `failure` 词表：`DISABLED`（定义不存在或被 `mxt:disabled` 停用）、`ALREADY_HELD`、`CONDITIONS`（体质 `holder_condition` 不满足）、`EXCLUSIVE_CONFLICT`、`ELEMENT_CONFLICT`（灵根 `conflicting_elements`）、`NOT_HELD`、`SERVER_ONLY`（在客户端调用）。四个读方法两侧都能用（`spirit_identity` 附件是同步的，物品悬浮提示问"你是不是火灵根"正是这个用途），四个改变状态的方法是服务端操作。

```js
// kubejs/server_scripts/mxt_identity.js
// 洗练：把一条灵根换成另一条，并顺手把新体质打开。
const result = MxtSpiritRoots.grant(player, 'mxt_test:qingxiao_fire_root')
if (result.changed) {
  MxtSpiritRoots.remove(player, 'mxt_test:water_root')
  MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', true)
} else {
  console.warn(`grant refused: ${result.failure}`)
}
// "他是不是正在火灵根上" —— 关闭的灵根仍然持有，所以要问 active 而不是 has。
const active = MxtSpiritRoots.active(player)
```

## 相关

- 数据包侧：[灵根 `spirit_root`](/datapack/json/spirit_root)。
- 另一半身份：[MxtPhysiques](/kubejs/api/physiques)；它绑定的元素：[MxtElements](/kubejs/api/elements)。
- 管理员命令：[/spirit_root](/player-guide/commands/spirit_root)。
- [KubeJS API 参考](/kubejs/api-reference)。
