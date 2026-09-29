---
title: MxtProgression：进度等级
description: 按所有者读写实体持有的进度等级，功法与灵宠共用同一套。
---

# `MxtProgression`：进度等级 {#mxtprogression}

灵宠的等级与功法用的是同一套账，区别只在**所有者**——所有者的 id 就是等级记录的键：功法写功法 id，灵宠写它自己那份 [生物档案](/datapack/json/creature_profile) 的 id。读方法两侧都能用，`setLevel` 是服务端操作。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `level(entity, owner)` | `Entity`、所有者 ID | `String` 或 `null` | **记录下来的**等级 ID；没晋升过时为 `null`（它可能仍站在入口等级上，那要问 `current`）。 |
| `current(entity, owner)` | `Entity`、所有者 ID | `String` 或 `null` | **生效的**等级 ID：记录，或该所有者的入口等级。实体不持有这个所有者时为 `null`。 |
| `next(entity, owner)` | `Entity`、所有者 ID | `String` 或 `null` | 当前等级的下一级；已经是最高一级、或不持有该所有者时为 `null`。 |
| `mastery(entity, owner)` | `Entity`、所有者 ID | `{have, required, resource}` 或 `null` | 离下一级还差多少：`mastery_resource` 的当前值、该级要求的数值与资源 ID。没有下一级、所有者没写 `mastery_resource`、或公式算不出来时为 `null`。 |
| `setLevel(entity, owner, level)` | `LivingEntity`、所有者 ID、等级 ID | `{changed, failure}` | 走与 `/contract level` 同一个服务：校验该级在它的链上、写记录、重建它授予的能力，并发一次 `mxt:progression_level` 信号。**不看**该级自己的 `mastery` 与 `condition`。 |

`failure` 词表：`UNKNOWN_OWNER`（这具身体不持有这个所有者，或那份定义没有链）、`FOREIGN_LEVEL`（这一级不在它的链上）、`SAME_LEVEL`（它已经在这一级了）、`UNKNOWN_LEVEL`（注册表里没有这个 id）、`SERVER_ONLY`（在客户端调用）。

```js
// kubejs/server_scripts/mxt_progression.js
// 灵宠：所有者是它自己那份档案的 id，写进去之后它当场带上这一级授予的能力。
const current = MxtProgression.current(beast, 'mxt_test:probe_beast')
const growth = MxtProgression.mastery(beast, 'mxt_test:probe_beast')   // {have, required, resource}
const advanced = MxtProgression.setLevel(beast, 'mxt_test:probe_beast', 'mxt_test:beast_3')
if (!advanced.changed) {
  console.warn(`promotion refused: ${advanced.failure}`)
}
// 功法走同一个入口，owner 换成功法 id。
const sword = MxtProgression.level(player, 'mxt_test:sword_manual')
```

## 相关

- 数据包侧：[进度链 `progression`](/datapack/json/progression)、[功法 `technique`](/datapack/json/technique)。
- 灵宠的成长：[生物档案 `creature_profile`](/datapack/json/creature_profile)。
- 管理员命令：[/contract](/player-guide/commands/contract)。
- [KubeJS API 参考](/kubejs/api-reference)。
