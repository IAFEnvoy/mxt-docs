---
title: MxtTechniques：功法
description: 查询、学习与遗忘功法；功法是修习的整体单位，带着自己的进度等级。
---

# `MxtTechniques`：功法

一门功法（`technique`）是修习的**整体单位**：学会它同时授予它的属性与技能，它的**进度等级**（`progression`）单独记在身体上。学习与遗忘都走权威服务，因此学习条件、互斥标签冲突与两个学习事件照常处理。

遗忘只删这门功法**以及它自己的进度等级记录**（重新学会从入口等级开始），并重建它授予的属性与技能；境界、修为、资源与正在跑的法术都不受影响。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**学过**的功法 ID，按 ID 排序。定义已不在当前包里的功法仍会列出——它确实还学过。 |
| `has(entity, technique)` | `Entity`、功法 ID | `boolean` | 是否学过（与实体条件 `mxt:technique` 同义）。 |
| `level(entity, technique)` | `Entity`、功法 ID | `String` 或 `null` | 这门功法当前的进度等级 ID；没学过、或还没写下等级记录时为 `null`。 |
| `learn(entity, technique)` | `LivingEntity`、功法 ID | `{changed, failure}` | 走权威服务学习：`learn_condition`、`exclusive_tags` 与两个学习事件都照常处理。 |
| `forget(entity, technique)` | `LivingEntity`、功法 ID | `{changed, failure}` | 遗忘这门功法**并删掉它自己的等级记录**，再重建它带来的属性与技能；没学过则为 `ABSENT`。 |

`failure` 词表：`DISABLED`（注册表里没有这个 id，含被 `neoforge:conditions` 挡掉的定义）、`ALREADY_LEARNED`、`CONFLICT`（`exclusive_tags` 与已修习的功法相撞）、`CONDITIONS`（`learn_condition` 不满足）、`CANCELLED`（监听方取消了本次学习）、`ABSENT`（遗忘一门没学过的功法）、`SERVER_ONLY`（在客户端调用）。三个读方法两侧都能用（`spirit_identity` 附件是同步的），两个改变状态的方法是服务端操作。

```js
// kubejs/server_scripts/mxt_techniques.js
// 学会一门功法；失败时把原因写进日志。
const learned = MxtTechniques.learn(player, 'mxt_test:azure_water_manual')
if (!learned.changed) {
  console.warn(`learning refused: ${learned.failure}`)
}
// 洗掉重来：功法和它自己的等级记录一起消失，境界与修为照旧。
MxtTechniques.forget(player, 'mxt_test:qingxiao_breathing_manual')
// 现在这门功法练到哪一档？（没学过或还没记录时为 null）
const level = MxtTechniques.level(player, 'mxt_test:azure_water_manual')
```

## 相关

- 数据包侧：[功法 `technique`](/datapack/json/technique)。
- 修为与突破：[MxtCultivation](/kubejs/api/cultivation)。
- 管理员命令：[/technique](/player-guide/commands/technique)。
- [KubeJS API 参考](/kubejs/api-reference)。
