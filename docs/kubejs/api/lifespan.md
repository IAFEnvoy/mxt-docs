---
title: MxtLifespan：寿元
description: 读写实体的寿元账本（剩余刻数、上限、改写与增减），并能让它当场转世。
---

# `MxtLifespan`：寿元

`MxtLifespan` 是脚本侧的寿元账本入口：账本记在每个身体上，是两个数——还剩多少刻与这一世被给到的上限。**数据包、命令与脚本写入账本时一律照记**，寿元总开关只管时间流不流逝，所以脚本的写入同样不受它影响。玩法、配置与命令见[寿元](/player-guide/lifespan)。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `remaining(entity)` | `Entity` | `long` | 还剩多少刻；实体**没有账本**时返回 `-1`。只读，不会为它建出一本账。 |
| `total(entity)` | `Entity` | `long` | 这一世被给到的上限刻数；没有账本时返回 `-1`。 |
| `set(entity, ticks)` | `LivingEntity`、`long` | `Result` | 把两个数一起改写成 `ticks`。`ticks` 为负会被拒绝，失败枚举为 `invalid_value`。 |
| `add(entity, ticks)` | `LivingEntity`、`long` | `Result` | 增减寿元：正数同时抬高剩余与上限；**负数只扣剩余、不动上限**（扣到 `0` 为止）。 |
| `reincarnate(entity)` | `LivingEntity` | `Result` | 让实体当场**转世**：跑一遍服务端配置「转世」页那份重置清单，再把账本按服务端配置「寿元 → 凡人基础寿元」重开（那里是 `0` 就等于关闭账本，身体重新读作「未记账」）。**不**发 `lifespanEnd` 事件（那个事件只属于寿元耗尽），改发 `lifespanRebirth` 的 `Pre` / `Post`，所以监听者可以取消它；寿元总开关关着也照做；目标若是玩家，本人会在聊天栏收到一句通知。`failure` 是 `server_only`（客户端）或 `cancelled`（被监听者取消），**永远不会有** `invalid_value`；成功后账本就是新一世起步的那本。 |

`set`、`add` 与 `reincarnate` 返回的都是同一种 `Result` record，用 Java accessor 读：`changed()` 表示确实生效了，`failure()` 是失败枚举（成功时为 `null`）。`set` / `add` 的取值是 `server_only` / `invalid_value`；`reincarnate` 是 `server_only`（客户端）或 `cancelled`（被监听者取消），**不会**出现 `invalid_value`。客户端脚本读到的 `remaining` / `total` 永远是 `-1`，三个写方法也都不会在客户端落笔（`reincarnate` 在客户端同样返回一个 `failure` 为 `SERVER_ONLY` 的 `Result`，什么都不改）。转世之后，`remaining(entity)` / `total(entity)` 读到的就是新一世起步的那本账。

```js
// kubejs/server_scripts/mxt_lifespan.js
// 续一百年（24000 刻 = 一游戏日）。
const result = MxtLifespan.add(player, 100 * 24000)
if (!result.changed()) {
  console.warn(`lifespan not written: ${result.failure()}`)
}
```

## 相关

- 寿元的玩法、服务端配置与命令：[寿元](/player-guide/lifespan)。
- 寿元耗尽时的回调：[MxtEvents](/kubejs/api/events) 的 `lifespanEnd`；显式转世（本方法、命令或数据包行为 `mxt:reincarnate`）的回调是那里的 `lifespanRebirth`。
- [KubeJS API 参考](/kubejs/api-reference)。
