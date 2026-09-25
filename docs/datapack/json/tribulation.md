---
title: tribulation（天劫）
aside: false
---

# tribulation（天劫） {#tribulation}

文件位置：`data/<namespace>/mxt/tribulation/<path>.json`

**用途**：天劫：启动门槛、时间线节拍与成败行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `tribulation.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `tribulation.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 启动条件：天劫被启动时求值**一次**的附加门槛，不通过则本次不启动。它不是事件触发器——决定"要不要开一场天劫"的是引用它的地方（`realm_stage` 的 `tribulation`），这里只决定那次启动是否被接受。 |
| `timeline` | `List<TimelineEntry>` | **必填** | 天劫要消费的时间线，至少一个节拍。 |
| `difficulty_scale` | `NumberProvider` | `1` | 难度倍率，每个等待时长都乘上它。 |
| `windup` | `NumberProvider` | `0` | 启动前摇：开始消费时间线之前先空转的 tick 数，按与等待时长完全相同的规则结算，在启动那一刻定死；倒计时期间玩家会在 action bar 上看到剩余秒数，`0` 表示没有前摇。 |
| `darken_sky` | `bool` | `true` | 这场天劫进行期间是否让附近玩家的天空变暗（含渡劫者本人，最远 160 格）。纯客户端表现：客户端从同步过来的定义里读它。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 时间线走完后的成功行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 节拍无法继续时的失败行为。 |

## `TimelineEntry`

`timeline` 是**运行游标**：天劫启动时整条时间线被复制进实体的附件，之后由消费者的每 tick 调用消费**游标所在那一拍**——跑完就前进一拍。**游标是存下来的**（2026-09-25 起，此前是"消费即出队"的队列），因为 `mxt:branch` 可以把它移到任意一拍；游标走到末尾即执行 `success_action`，某一拍报 `FAILED` 即执行 `fail_action`。节拍是复制进去的，所以 `/reload` 不会改动一场已经在进行的天劫；`difficulty_scale`、成败行为仍从定义读取。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:action` | `action`（`EntityAction`，必填） | 执行一次行为，并在同一个 tick 结束。 |
| `mxt:idle` | `duration`（`NumberProvider`，必填） | 空等若干 tick，什么都不做。 |
| `mxt:wait_for` | `condition`（`EntityCondition`，必填）、`timeout`（`NumberProvider`，可选）、`on_timeout`（`fail` / `finish`，默认 `fail`） | 每 tick 求值一次，条件成立才结束；写了 `timeout` 就是**限期等待**，到点按 `on_timeout` 失败或直接过。 |
| `mxt:branch` | `condition`（`EntityCondition`，必填）、`if_true` / `if_false`（整数下标，可选） | 按条件**改游标**，并在同一个 tick 结束；不写的分支照常前进一拍。 |

`mxt:action` 是瞬间节拍：时间线上相邻的几个 `mxt:action` 会在同一个 tick 内依次执行完，写完一整个 tick 里发生的事不需要拆成多拍。等待时长按 `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` 换算，并在该节拍**开始时结算一次**、之后不再重算：随机时长只掷一次，环境灵气中途变化也不会拉长或缩短一个已经开始的等待。`mxt:wait_for` 的 `timeout` 是**例外**：它是限期而不是"这一拍的时长"，所以只按 `timeout` 结算，**不乘 `difficulty_scale`、也不看环境灵气**——难度不该决定玩家有多少时间达标。`timeout` 结算不出正数时整个启动被拒绝。

`mxt:branch` 的下标从**运行复制进来的那条时间线的第一拍**算起（`0` 起），越界的下标在**启动时**被拒绝，所以一个跳错位置的分支不会在玩家已经付掉突破代价之后才出问题；回跳也允许，做一个"血量低就回去再挨一轮"的循环没有限制（条件要靠自己收得住）。

启动前每个节拍都会被问一次"现在能不能跑"，`mxt:idle` 的时长解不出来、`mxt:wait_for` 的 `timeout` 解不出来、`mxt:branch` 的目标越界，整个启动都会被拒绝——坏定义不该在玩家已经付掉突破代价之后才出问题。`mxt:wait_for` **不写 `timeout` 时**仍然是：条件永不成立，天劫就停在这一拍（不推进、不失败），因此作者要保证条件可达。

`windup` 是**启动前摇**：天劫被接受之后先空转这么多 tick，第一拍才开始。它和等待时长走同一条换算规则（`windup × difficulty_scale × max(0, 1 + aura_tribulation_modifier)`；写 `0`、或算不出正数，就等于没有前摇），并在**启动那一刻结算一次**：之后每 tick 只减一，所以玩家看到的倒计时就是真正会走完的 tick 数，中途灵气变化不会把它拉长。前摇期间不消费节拍、不写现场，但这一场天劫已经算在进行——重复启动照样被拒绝，`status` 报的是「还在前摇，还剩 N tick」，`darken_sky` 也照常生效。剩余 tick 跟着附件一起存档、一起同步，所以存档退出再进来是接着倒计时，而不是从头开始。

天劫附件里除了这条时间线，只留**当前节拍的一份现场**：一次只有一个节拍在跑，所以不需要一张存储表，只有一个槽位。节拍要跨 tick 记住的临时数值就写在这里——`mxt:idle` 的剩余 tick 是第一个例子（开始时按上面那条式子结算一次长度，之后每 tick 自己减一，减到 1 的那一 tick 结束）。现场跟着附件一起存档、一起同步；槽位为空表示这一拍还没开始，而"这一拍开始了"也是存下来的，所以重启不会把同一拍的开始再算一次；越过这一拍时现场被丢弃、下一拍建立自己的。这些数值由运行时读写，数据包碰不到：`mxt:entry_began`（"这一拍已经开始、自己没有数值"的标记）与 `mxt:idle_countdown`（剩余 tick）都是运行时类型，`mxt:modify_storage` 会拒绝。

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

在施法者位置打下一道雷。除了颜色，它**就是原版闪电**：伤害、引燃、避雷针充能、铜氧化、雷声、天空闪光以及村民→女巫、猪→僵尸猪灵、苦力怕充能这些雷击转化全部照旧。这是一个 `EntityAction`，所以天劫时间线、成败行为、阵法逐实体行为、技能、契约、秘境——任何 `EntityAction` 槽位都能用。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `color` | 颜色 | `#737380` | 雷的 RGB 颜色，支持 `#RRGGBB` 或整数。默认值即原版那身冷白（按 8 位取整）。 |
| `alpha` | Float `0..1` | `0.3` | 雷的**亮度**。原版闪电用加法混合，顶点色的 `RGB × alpha` 就是它的发光强度，所以这个字段不是透明度：调高更刺眼，调低更幽暗。 |
| `thickness` | Float `0.1..4` | `1` | 雷柱粗细倍率。 |
| `palette` | 颜色[] | `[]` | **渐变**：从顶端到落地点的颜色序列，第一项在雷的起点（天空侧）、最后一项在落地点，最多 16 项。给出后它替换 `color` 的着色。 |
| `damage` | `NumberProvider` | `5` | 雷击伤害，默认与原版一致。 |
| `visual_only` | Boolean | `false` | 只打雷，不结算伤害、不引燃。 |
| `cause` | Boolean | `true` | 施法者是玩家时记为其引发的雷击，可触发原版 `channeled_lightning` 进度。 |
| `offset_x` / `offset_y` / `offset_z` | `NumberProvider` | `0` | 落点相对施法者的偏移。 |

`palette` 给出后**替换** `color` 的单色着色：渲染时按雷柱的九道横向接缝逐段取色，相邻两项之间线性过渡（一项 = 纯色，两项 = 两端渐变，更多项 = 多段渐变）。四个叠加层和两条分叉读同一组接缝，所以分叉在它离开主干的高度上颜色与主干一致。色值写法与 `color` 相同（`#RRGGBB` 或整数），`alpha` 仍是整道雷共用的发光强度——它不是给每个颜色各配一个透明度。超过 16 项或写成非法颜色会在**解码期**直接失败，而不是被静默丢弃：渐变里的笔误应当看得见。

```json
{
  "timeline": [
    {
      "type": "mxt:action",
      "action": {
        "type": "mxt:spawn_lightning",
        "palette": ["#7A5CFF", "#66CCFF"],
        "alpha": 0.45,
        "thickness": 1.6,
        "damage": 12
      }
    },
    { "type": "mxt:idle", "duration": 20 }
  ]
}
```

不做数据包、只想直接打一道雷时用 `/mxt lightning`（顶层别名 `/lightning`），参数与上表一一对应（渐变在命令里写作 `palette 7A5CFF,66CCFF`，不带 `#`），见[命令](/player-guide/commands)。

