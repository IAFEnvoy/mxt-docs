---
title: 让突破引来天劫
description: 写一场由突破启动的天劫：启动闸门、前摇与倒计时、三种节拍、带颜色的雷击，以及成功与失败各自做什么。
---

# 让突破引来天劫

天劫是突破的代价：一场按时间线消费的考验，扛过去就是下一个境界，扛不过去由你自己写的失败行为收场。它由两部分拼成——**一场天劫的定义**，以及**某次突破引用它**。触发它的从来不是天劫自己。

本篇给示例包的筑基阶段挂上一场「雷劫」。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/tribulation/heavenly_gate.json` | 这场天劫：前摇、时间线、成功与失败。 |
| `data/example/mxt/realm_stage/foundation.json` | *（编辑）* 把这场天劫挂到这条突破上。 |

## 第 1 步 —— 一条最小的时间线

```json
// data/example/mxt/tribulation/heavenly_gate.json
{
  "windup": 60,
  "timeline": [
    {"type": "mxt:idle", "duration": 20},
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 6}},
    {"type": "mxt:idle", "duration": 40},
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 10}}
  ],
  "success_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 50},
  "fail_action": {"type": "mxt:damage", "amount": 20}
}
```

| 字段 | 作用 |
| --- | --- |
| `timeline` | **必填**，天劫要消费的节拍列表，至少一拍。 |
| `windup` | 启动前摇：开始消费第一拍之前先空转的 tick 数。 |
| `success_action` | 时间线走空之后执行，默认 `mxt:no_op`。 |
| `fail_action` | 某一拍报错、天劫无法继续时执行，默认 `mxt:no_op`。 |

节拍只有三种，写一场天劫就是把它们排成一队：

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:action` | `action`（`EntityAction`，必填） | 执行一次行为，并在**同一个 tick 内结束**。相邻的几个 `mxt:action` 会挤在同一 tick 里依次跑完，所以「一 tick 里发生的一串事」不需要拆成多拍。 |
| `mxt:idle` | `duration`（`NumberProvider`，必填） | 空等若干 tick。 |
| `mxt:wait_for` | `condition`（`EntityCondition`，必填） | 每 tick 求值一次，条件成立才结束这一拍。 |

时间线是一份**消费者队列**：启动时整条被复制进实体的附件，之后每 tick 消费队首那一拍，跑完就出队。因此 `/reload` 改动定义**不会**影响一场已经在进行的天劫——队列已经拷走了；而难度倍率与成败行为仍然从定义实时读取。

::: warning `mxt:wait_for` 没有超时
条件永不成立，天劫就永远停在这一拍：不推进，也不失败。作者要保证条件可达（例如用 `mxt:exposed_to_sky` 这种迟早会真的条件，而不是某个可能一直为假的组合）。
:::

## 第 2 步 —— 让它等一等

`mxt:idle` 与 `windup` 都按同一条式子换算：

```text
时长 × difficulty_scale × max(0, 1 + aura_tribulation_modifier)
```

- `difficulty_scale` 默认 `1`，是整场天劫的总倍率。
- `aura_tribulation_modifier` 是环境给的：灵气越浓，劫数越难熬。它是公式变量，写不出值时按 `0` 计（即乘数下限为 `max(0, …)`，不会变成负时长）。
- **换算只在节拍开始时做一次**：随机时长只掷一次，环境灵气中途变化也不会把一个已经开始的等待拉长或缩短。玩家看到的倒计时因此是真正会走完的 tick 数。

**启动前每一拍都会被问一次「现在能不能跑」**，`mxt:idle` 的时长解不出来时整场启动直接被拒——坏定义不该在玩家已经付掉突破代价之后才出问题。

前摇与等待的差别只在于前摇不消费节拍、不写现场，但这场天劫**已经算在进行**：重复启动照样被拒，`/mxt tribulation status` 报「还在前摇，还剩 N tick」，`darken_sky` 也照常生效。剩余 tick 跟着附件一起存档、一起同步，所以退出重进是接着倒计时。

## 第 3 步 —— 打雷

`mxt:spawn_lightning` 是一个普通 `EntityAction`：除了颜色和粗细，它**就是原版闪电**——伤害、引燃、避雷针充能、铜氧化、雷声与天空闪光，以及村民→女巫、猪→僵尸猪灵、苦力怕充能这些转化全部照旧。所以它能用在任何 `EntityAction` 槽位里，不只是天劫。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `5` | 雷击伤害，默认与原版一致。 |
| `color` | 颜色 | `#737380` | 雷的 RGB 颜色，`#RRGGBB` 或整数。默认即原版那身冷白。 |
| `palette` | 颜色[] | `[]` | **渐变**：从天空侧到落地点，最多 16 项；给了它就**替换** `color`。 |
| `alpha` | Float `0..1` | `0.3` | 雷的**亮度**，不是透明度：原版闪电用加法混合，`RGB × alpha` 就是发光强度，调高更刺眼。 |
| `thickness` | Float `0.1..4` | `1` | 雷柱粗细倍率。 |
| `visual_only` | Boolean | `false` | 只打雷，不结算伤害、不引燃——做氛围用。 |
| `cause` | Boolean | `true` | 施法者是玩家时记为其引发的雷击（可触发原版 `channeled_lightning` 进度）。 |
| `offset_x` / `offset_y` / `offset_z` | `NumberProvider` | `0` | 落点相对施法者的偏移。 |

渐变色写错或超过 16 项会在**解码期**直接失败，而不是被静默丢弃；`palette` 的每一项之间线性过渡，四个叠加层与两条分叉读同一组接缝，所以分叉在离开主干的高度上颜色与主干一致。

把第二道雷换成渐变，就能一眼看出「这一击比上一击重」：

```json
{"type": "mxt:action", "action": {
  "type": "mxt:spawn_lightning",
  "palette": ["#7A5CFF", "#66CCFF"],
  "alpha": 0.45,
  "thickness": 1.6,
  "damage": 10
}}
```

## 第 4 步 —— 结算成功与失败

- **成功**：时间线走空即执行 `success_action`。上面写的是补 50 点灵气——扛过雷劫，池子反而更满。
- **失败**：某一拍判定无法继续（`mxt:idle` 的现场丢了、节拍自己返回失败）时执行 `fail_action`。劫数**没有任何内置惩罚**——不掉境界、不扣修为，全部由你写在 `fail_action` 里。
- **死亡不是失败**：天劫附件是 `copyOnDeath()` 的，所以**死亡不会清掉天劫**，重生之后接着跑（观感上就是"死后天劫还在打"）。想让它随死亡结束，就在 `fail_action` 之外另想办法，或者干脆把惩罚写成"死了就白渡"。
- **`/mxt tribulation stop` 也不结算**：它只清场，`success_action` 与 `fail_action` 都不跑——调试时清楚这一点就不会以为"停掉也算成功"。
- 两者都可以什么都不写（`mxt:no_op`）——那时天劫只是一段演出，惩罚留给别的系统。

想把惩罚做成「渡不过就掉境界」，用现成的行为组合即可，例如 `fail_action` 里先 `mxt:damage` 再 `mxt:add_resource` 扣修为：

```json
"fail_action": {
  "type": "mxt:sequence",
  "actions": [
    {"type": "mxt:damage", "amount": 20},
    {"type": "mxt:add_resource", "resource": "example:qi", "amount": -500}
  ]
}
```

## 第 5 步 —— 挂到突破上

天劫不会自己开始。决定「要不要开一场天劫」的是引用它的地方，最常见的就是境界阶段：

```json
// data/example/mxt/realm_stage/foundation.json
"tribulation": "example:heavenly_gate"
```

再补一道启动闸门——`condition` 在天劫被启动的那一刻求值**一次**，不通过则本次不启动：

```json
// data/example/mxt/tribulation/heavenly_gate.json
"condition": {"type": "mxt:aura_range", "min": 30, "max": 1000}
```

于是「灵气太薄的地方渡不了劫」这句话就成了数据包的一条规则，而不是代码里的特例。闸门不成立时突破**照常发生**，只是没有天劫——想让「必须有劫」也由 `realm_stage` 的 `breakthrough.conditions` 去要求。

## 在游戏里验证

先退回标题界面重开世界（数据包注册表在**世界加载时**读取，`/reload` 不会重读），然后：

```text
/mxt registries validate
/mxt tribulation start example:heavenly_gate
/mxt tribulation status
/mxt tribulation stop
```

1. `validate` 应报告没有 Codec 错误。
2. `start` 会立刻进入 60 tick 前摇：action bar 上出现「天劫将至：3.0 秒」逐秒递减，天空同时开始变暗（约 1 秒淡入）。
3. 前摇一过，第一拍 `mxt:idle 20` 开始；`status` 这时报「第 1 拍」并打出这一拍的现场，例如 `{"remaining":12,"type":"mxt:idle_countdown"}`。调时序时这是最直接的观测口。
4. 两道雷落下，`success_action` 给你 50 点灵气，天空慢慢转亮。
5. 想不想登录也能试，就对手边的一只实体下手（天劫挂在**活体**实体上、由它的 tick 推进）：

   ```text
   /execute positioned 0 100 0 run mxt tribulation start example:heavenly_gate @e[tag=probe,limit=1]
   /execute positioned 0 100 0 run mxt tribulation status @e[tag=probe,limit=1]
   ```

6. 最后走一次真实流程：`/mxt resource example:qi set 500` 把池子填够，`/mxt breakthrough example:qi` 触发突破——应该看到和前摇完全一样的过程。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 突破时什么都不发生 | `realm_stage` 上没有写 `tribulation`，或者天劫的 `condition` 不成立。 |
| `start` 报「已有天劫在进行」 | 这个实体身上已经挂着一场，包括还**在前摇**的那场；`stop` 清掉再来。 |
| `start` 报「某个节拍现在跑不了」 | 启动前的逐拍校验失败，最常见的是 `mxt:idle` 的 `duration` 解不出来（公式用了空上下文里没有的变量）。 |
| 天劫永远停在某一拍 | `mxt:wait_for` 的条件不可达；它没有超时，也不会判失败。 |
| 天劫忽然不动了 | 推进靠实体 tick，所以它在**未加载的区块**里会暂停（附件已存档），区块重新加载后从中断处继续。 |
| `difficulty_scale` 写了 `0` 或负数 | 加载期**不报错**，但等待时长会算出 `-1`：时间线里只要有 `mxt:idle`，启动就会被拒（`invalid_entry`）；只有 `mxt:action` 的时间线则会"看起来成功"地瞬间跑完。 |
| 公式里写裸 `level` 得到 `0` | 天劫公式跑在实体上下文里，`level`/`realm_rank` 这类需要资源上下文的变量在这里读不到。要用施法者的原版经验等级就写 `caster_level`。 |
| 时间线改了但进行中的天劫没变 | 时间线在启动时就复制进了附件，`/reload` 只影响下一场。 |
| `mxt:modify_storage` 报错 | `mxt:entry_began` 与 `mxt:idle_countdown` 是运行时类型，数据包不能写。 |
| 天空不变暗 | `darken_sky` 写了 `false`，或者附近没有玩家（表现是客户端自己做的，最远 160 格）。 |

## 接下来

- [tribulation（天劫）](../datapack/json/tribulation.md) —— 完整字段表与时间线细节。
- [realm_stage（境界阶段）](../datapack/json/realm_stage.md) —— `tribulation` 与突破条件。
- [实体行为](../datapack/types/action/entity_action_types.md) —— 成败行为能用的全部动作，包括 `mxt:spawn_lightning`。
- [命令](../player-guide/commands.md) —— `/mxt tribulation` 与 `/mxt lightning` 的其余参数。
