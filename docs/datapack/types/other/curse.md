---
title: curse_type（诅咒类型）
description: 诅咒类型族 curse_type 的四种生命周期策略、字段与时长规则。
---

# curse_type（诅咒类型）

## `curse_type`

[诅咒定义](../../json/curse.md)顶层的 `type` 从这一族里选一个 ID：`type` 只决定这份定义怎么走完一生，持续多久由定义自己的 `duration_ticks` 决定。四种类型由模组注册，数据包只能选用，不能新增。

定义在世界加载时解码一次：`type` 与它自己的字段（`mxt:triggered` 的 `triggers`）都在那时读出来，常量时长也在加载期校验。公式时长要等实际施加时才求值，所以那种写法只会在那一次施加时被拒。

`duration_ticks` 与 `tick_interval` 是诅咒定义自己的字段，写在[诅咒定义](../../json/curse.md)那一页；下面只讲各类型怎么读它们。

| `type` | 到期 | 周期行为 |
| --- | --- | --- |
| `mxt:timed` | `duration_ticks` 之后 | 按 `tick_interval` 驱动 |
| `mxt:permanent` | 永不到期，`duration_ticks` 不参与 | 按 `tick_interval` 驱动 |
| `mxt:triggered` | 写了正的 `duration_ticks` 就按时到期，非正或不写就永不到期 | 由 `triggers` 的信号驱动，`tick_interval` 不参与 |
| `mxt:empty` | 永不到期，`duration_ticks` 不参与 | 不跑任何行为 |

### `mxt:timed`

在 `duration_ticks` 之后到期。**这是唯一要求时长必须为正的类型**：非正数的常量时长在加载期就被拒，公式在求值那一刻判定，判定不了就拒绝这次施加，而不是抛异常。周期行为按 `tick_interval` 驱动。它没有自己的字段。

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

### `mxt:permanent`

永不到期，`duration_ticks` 不参与。周期行为按 `tick_interval` 驱动。它没有自己的字段。

```json
{"type": "mxt:permanent"}
```

### `mxt:triggered`

写了正的 `duration_ticks` 就按时到期，非正或不写就永不到期。周期行为不由 `tick_interval` 驱动，而由**信号**驱动：`triggers` 里任一 `Trigger` 匹配到的信号到达时，对持有者执行一次 `on_tick`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `triggers` | 数组 | `[]` | 让这条诅咒发作的信号；写法与技能触发器一致 |

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:hurt"}],
  "on_tick": {"type": "mxt:damage", "amount": 1}
}
```

这就是"每次受击发作一次"。加载期会拒绝 `triggers` 为空的 `mxt:triggered`。

### `mxt:empty`

永不到期，`duration_ticks` 不参与，也**不产生任何行为**：`on_apply` / `on_tick` / `on_expire` / `on_cleanse` 一律不执行。它只作为占位或标记存在。它没有自己的字段。

```json
{"type": "mxt:empty"}
```
