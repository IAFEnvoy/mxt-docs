---
title: /tribulation
---

# `/tribulation`

| 命令 | 作用 |
| --- | --- |
| `/mxt tribulation start <id> [<target>]`（= `/tribulation start …`） | 手动开始一场天劫（需要 gamemaster 权限），不必等突破；不填 `target` 时挂在自己身上。配套的 `status` 报告跑到第几拍与当前节拍的现场，`stop` 清除。 |

## `/mxt tribulation`

手动跑一场天劫。它走的就是突破触发时的**同一条路径**——启动闸门、启动前的逐拍校验、之后每 tick 消费一拍全部照旧，被替换的只有"要不要开始"这一个决定。因此它既是触发器，也是观测器。

```
/mxt tribulation start mxt_test:probe_timeline
/mxt tribulation start mxt_test:probe_timeline @e[type=minecraft:armor_stand,limit=1]
/mxt tribulation status
/mxt tribulation stop
```

| 子命令 | 说明 |
| --- | --- |
| `start <id> [<target>]` | 开始一场天劫。`id` 是 `data/<命名空间>/mxt/tribulation/<path>.json`，Tab 补全列出当前注册表里的全部。被拒绝时会说明原因：已有天劫在进行、时间线为空、启动闸门不成立、某个节拍现在跑不了、被事件取消。 |
| `status [<target>]` | 报告正在跑的天劫、第几拍（`第 2 拍，还剩 5 拍`）以及**当前节拍的现场**。现场按存档里的写法打印，例如 `{"remaining":37,"type":"mxt:idle_countdown"}` 表示这一拍还剩 37 tick；`尚未开始（空）` 表示这一拍刚轮到、entry 还没写现场。定义里写了启动前摇（`windup`）时，前摇期间报的是`还在前摇，还剩 %s tick`——那时时间线还没开始消费，报"第几拍"会撒谎。 |
| `stop [<target>]` | 清除当前天劫，留下的状态与跑完一场之后完全一致。 |

目标必须是**活体实体**：天劫挂在实体附件上、由实体的 tick 推进。所以测试时可以直接对一只召唤物下手，不必登录玩家——`execute positioned` 给选择器一个位置、`limit=1` 保证单选即可，例如

```
/execute positioned 0 100 0 run mxt tribulation start mxt_test:probe_timeline @e[tag=probe,limit=1]
/execute positioned 0 100 0 run mxt tribulation status @e[tag=probe,limit=1]
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `id` | 必填 | 天劫定义 ID。 |
| `target` | 命令执行者 | 天劫挂在哪一个活体实体上。 |
