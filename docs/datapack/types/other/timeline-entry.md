---
title: timeline_entry_type（天劫节拍）
description: 天劫时间线节拍 mxt:timeline_entry_type 的全部内置条目、字段、默认值与时长换算规则。
---

# timeline_entry_type（天劫节拍）

## `timeline_entry_type`

[天劫](../../json/tribulation.md) 的 `timeline` 数组存放这些条目。每一项在 `type` 里写一个节拍 ID 来选中它；数据包只能选用已有的节拍，不能新增。

`timeline` 是一根运行游标：天劫启动时整条时间线被复制进渡劫者身上，之后每 tick 消费游标所在那一拍，跑完就前进一拍。游标位置本身也存下来（`mxt:branch` 能把它移到任意一拍），`difficulty_scale` 与成败行为不跟着复制、仍从定义读取。游标走到末尾即执行 `success_action`，某一拍失败即执行 `fail_action`。节拍是复制进去的，所以 `/reload` 不会改动一场已经在进行的天劫。

每个节拍在整次运行开始前都会被问一次「现在能不能跑」。解不出时长的 `mxt:idle`、`timeout` 解不出或算不出正数的 `mxt:wait_for`、目标越界的 `mxt:branch` 都会让整次启动被直接拒绝，而不是进行到一半才失败。

```json
{
  "timeline": [
    {"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 12}},
    {"type": "mxt:idle", "duration": 40},
    {"type": "mxt:wait_for", "condition": {"type": "mxt:exposed_to_sky"}},
    {"type": "mxt:branch", "condition": {"type": "mxt:health", "comparison": "<", "compare_to": 10}, "if_true": 3}
  ]
}
```

### `mxt:action`

执行一个实体行为，并在同一 tick 结束。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | `EntityAction` | **必填** | 要执行的行为 |

```json
{"type": "mxt:action", "action": {"type": "mxt:spawn_lightning", "damage": 12}}
```

这是瞬间节拍：相邻的几个 `mxt:action` 会在同一个 tick 内依次执行完，写完一整个 tick 里发生的事不需要拆成多拍。`action` 是任何[实体行为](../action/entity_action_types.md)，所以任何行为都能成为一拍。

### `mxt:idle`

空等若干个 tick，什么都不做。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `duration` | `NumberProvider` | **必填** | 空等的 tick 数 |

```json
{"type": "mxt:idle", "duration": 40}
```

等待时长按 `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` 换算，并在这一拍**开始时结算一次**，之后不再重算：随机时长只掷一次，环境灵气中途变化也不会拉长或缩短一个已经开始的等待。

### `mxt:wait_for`

每 tick 求值一次，条件成立才结束。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **必填** | 等待成立的条件 |
| `timeout` | `NumberProvider` | 无 | 限期等待的 tick 数 |
| `on_timeout` | Enum | `fail` | 到点后怎么办：`finish` 直接过，`fail` 让整次天劫失败 |

```json
{"type": "mxt:wait_for", "condition": {"type": "mxt:exposed_to_sky"}, "timeout": 600, "on_timeout": "fail"}
```

`timeout` 是**限期**而不是这一拍的时长，所以只按 `timeout` 结算，**不乘 `difficulty_scale`、也不看环境灵气**——难度不该决定玩家有多少时间达标。不写 `timeout` 时条件永不成立，整次运行就停在这一拍（不推进、也不失败），所以条件要保证可达。

`condition` 是一个[实体条件](../condition/entity_condition_types.md)，接受列表作为隐式 AND，与其它地方的条件字段完全一样；`mxt:branch` 的 `condition` 同样是这个类型。

### `mxt:branch`

按条件把运行游标移到另一拍，并在同一 tick 结束。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **必填** | 判断往哪一支走的条件 |
| `if_true` | Integer | 无 | 条件成立时跳到的下标 |
| `if_false` | Integer | 无 | 条件不成立时跳到的下标 |

```json
{"type": "mxt:branch", "condition": {"type": "mxt:health", "comparison": "<", "compare_to": 10}, "if_true": 3}
```

`if_true` / `if_false` 是**绝对下标**，从运行复制进来的那条时间线的第一拍算起（`0` 起），可以回跳，做一个「血量低就回去再挨一轮」的循环没有限制（条件要靠自己收得住）；越界的下标在**启动时**就被拒绝，所以一个跳错位置的分支不会在玩家已经付掉突破代价之后才出问题。不写的分支照常前进一拍。

一次 tick 最多消费 1024 拍：一个把自己跳回去、又不含任何等待的循环会打一条 WARN，并把这一拍交回下一 tick，而不是卡死服务端线程。真正的循环总要在某一拍等一次（`mxt:idle` / `mxt:wait_for`），正常写法碰不到这个上限。
