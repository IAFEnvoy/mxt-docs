---
title: tribulation（天劫）
aside: false
---

# tribulation（天劫） {#tribulation}

文件位置：`data/<namespace>/mxt/tribulation/<path>.json`

**用途**：天劫：启动门槛、时间线节拍与成败行为。

一场天劫：启动门槛、时间线的节拍、每个等待的难度倍率，以及两个结局。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `tribulation.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `tribulation.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `condition` | `EntityCondition` | `mxt:always` | 启动条件，在天劫被启动时求值**一次**，不通过则本次不启动。 |
| `timeline` | 数组 | **必填** | 天劫要消费的时间线，至少一个节拍。 |
| `difficulty_scale` | `NumberProvider` | `1` | 难度倍率，每个等待时长都乘上它。 |
| `windup` | `NumberProvider` | `0` | 启动前摇：开始消费时间线之前先空转的 tick 数，按与等待时长完全相同的规则结算，在启动那一刻定死。倒计时期间玩家会在 action bar 上看到剩余秒数；`0` 表示没有前摇。 |
| `darken_sky` | `bool` | `true` | 这场天劫进行期间是否让附近玩家的天空变暗（含渡劫者本人，最远 160 格）。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 时间线走完后的成功行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 节拍无法继续时的失败行为。 |

`condition` 是**附加门槛**，不是事件触发器：决定要不要开一场天劫的是引用它的地方（`realm_stage` 的 `tribulation`），这里只决定那次启动是否被接受。

`timeline` 的每一项是一个节拍。运行游标怎么走、每个节拍读哪些字段、等待时长怎么换算、启动前会预检什么，见[天劫节拍类型](/datapack/types/other/timeline-entry)。

`windup` 是**启动前摇**：天劫被接受之后先空转这么多 tick，第一拍才开始。它和等待时长走同一条换算规则（`windup × difficulty_scale × max(0, 1 + aura_tribulation_modifier)`；写 `0`、或算不出正数，就等于没有前摇），并在**启动那一刻结算一次**：之后每 tick 只减一，所以玩家看到的倒计时就是真正会走完的 tick 数，中途灵气变化不会把它拉长。前摇期间不消费节拍、不写现场，但这一场天劫已经算在进行——重复启动照样被拒绝，`status` 报的是「还在前摇，还剩 N tick」，`darken_sky` 也照常生效。剩余 tick 跟着附件一起存档、一起同步，所以存档退出再进来是接着倒计时，而不是从头开始。

天劫附件里除了这条时间线，只留**当前节拍的一份现场**：一次只有一个节拍在跑，所以不需要一张存储表，只有一个槽位。节拍要跨 tick 记住的临时数值就写在这里——`mxt:idle` 的剩余 tick 是第一个例子（开始时按上面那条式子结算一次长度，之后每 tick 自己减一，减到 1 的那一 tick 结束）。现场跟着附件一起存档、一起同步；槽位为空表示这一拍还没开始，而「这一拍开始了」也是存下来的，所以重启不会把同一拍的开始再算一次；越过这一拍时现场被丢弃、下一拍建立自己的。这些数值由运行时读写，数据包碰不到：`mxt:entry_began`（「这一拍已经开始、自己没有数值」的标记）、`mxt:idle_countdown`（空闲节拍的剩余 tick）与 `mxt:wait_countdown`（限期等待的剩余 tick）都是内部状态种类，`mxt:modify_storage` 对它们一律拒绝。

不想在游戏里等突破、要直接把这场天劫跑一遍时，用 `/mxt tribulation start <id>`（可以指定目标实体）；`status` 会把当前节拍的现场按存档写法打出来，例如 `{"remaining":37,"type":"mxt:idle_countdown"}`，调时序的时候这是最直接的观测口。见[命令](/player-guide/commands)。

天劫进行期间，附近玩家的天会自动变暗——正在渡劫的那个玩家自己也在内，力度和原版凋零一致（雾色与光照一起压暗，约 1 秒淡入、约 4 秒淡出），最远 160 格；`darken_sky` 写 `false` 就整场不变暗。前摇期间，同一个范围内的玩家还会在 action bar 上看到倒计时（`天劫将至：2.4 秒`，按秒显示一位小数）。这两件事都是客户端自己做的：客户端读的是已经同步过来的天劫附件、以及附件引用的那份定义，服务端不参与、也不需要血条，所以作者只要写这两个字段，客户端自然跟着走。

```json
{
  "timeline": [
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 12 } },
    { "type": "mxt:idle", "duration": 40 },
    { "type": "mxt:wait_for", "condition": { "type": "mxt:exposed_to_sky" } },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "palette": ["#7A5CFF", "#66CCFF"], "alpha": 0.45, "thickness": 1.6 } }
  ],
  "success_action": { "type": "mxt:add_resource", "resource": "example:true_essence", "amount": 10 }
}
```

分段式天劫：限期等到玩家暴露在天空下，然后按血量分两条支线，`mxt:branch` 的 `if_true: 3` 直接跳到第 4 拍（`0` 起）、把第 3 拍让过去。

```json
{
  "timeline": [
    { "type": "mxt:wait_for", "condition": { "type": "mxt:exposed_to_sky" }, "timeout": 600, "on_timeout": "fail" },
    { "type": "mxt:branch", "condition": { "type": "mxt:health", "comparison": "<", "compare_to": 10 }, "if_true": 3 },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 4 } },
    { "type": "mxt:action", "action": { "type": "mxt:spawn_lightning", "damage": 12 } }
  ]
}
```

## `mxt:spawn_lightning`

这道雷是一个实体行为；字段、默认值、颜色与渐变的写法，以及 `/mxt lightning` 的参数，见[实体行为类型](/datapack/types/action/entity_action_types)。
