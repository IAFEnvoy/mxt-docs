---
title: MxtPhysiques：体质
description: 查询、授予、移除与开关体质；体质是修炼身份中与元素无关的那一半。
---

# `MxtPhysiques`：体质

体质是同一身份的**元素无关那一半**：它授予原版属性与能力、缩放持有者打出与受到的伤害，并通过互斥标签排除其他体质。与元素绑定的那一半是 [MxtSpiritRoots](/kubejs/api/spirit_roots)。授予时 `holder_condition` 与 `exclusive_tags` 按**当前**实体判定。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**持有**的体质 ID，按 ID 排序（`allow_stacking` 时同一个 ID 可能出现多次）。 |
| `active(entity)` | `Entity` | `List<String>` | 现在**生效**的体质。 |
| `has(entity, physique)` | `Entity`、体质 ID | `boolean` | 是否持有。 |
| `enabled(entity, physique)` | `Entity`、体质 ID | `boolean` | 该体质是否处于开启状态；不持有则为 `false`。 |
| `grant(entity, physique)` | `LivingEntity`、体质 ID | `{changed, failure}` | 走权威服务授予，[`holder_condition`](/datapack/json/physique) 与 `exclusive_tags` 按**当前**实体判定。 |
| `remove(entity, physique)` | `LivingEntity`、体质 ID | `boolean` | 移除该体质及其属性、能力与伤害倍率；本来没持有则为 `false`。 |
| `setEnabled(entity, physique, enabled)` | `LivingEntity`、体质 ID、`boolean` | `{changed, failure}` | 与灵根同义的开关。 |

灵根与体质共用同一套 `failure` 词表：`DISABLED`（定义不存在或被 `mxt:disabled` 停用）、`ALREADY_HELD`、`CONDITIONS`（体质 `holder_condition` 不满足）、`EXCLUSIVE_CONFLICT`、`ELEMENT_CONFLICT`（灵根 `conflicting_elements`）、`NOT_HELD`、`SERVER_ONLY`（在客户端调用）。四个读方法两侧都能用，改变状态的方法是服务端操作。

```js
// kubejs/server_scripts/mxt_physique.js
const result = MxtPhysiques.grant(player, 'mxt_test:blazing_body')
if (!result.changed) console.warn(`refused: ${result.failure}`)

// 关闭不等于失去：body 还拿着它，只是什么都不生效。
MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', false)
```

## 相关

- 数据包侧：[体质 `physique`](/datapack/json/physique)。
- 另一半身份：[MxtSpiritRoots](/kubejs/api/spirit_roots)（两者配合的洗练示例在那里）。
- 管理员命令：[/physique](/player-guide/commands/physique)。
- [KubeJS API 参考](/kubejs/api-reference)。
