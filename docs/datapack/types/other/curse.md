---
title: 诅咒类型
description: 诅咒类型族 curse_type 的四种生命周期策略、字段与时长规则。
---

# 诅咒类型

## `curse_type`

诅咒定义的 `type` 选择它的生命周期策略：`type` 只决定这份定义怎么走完一生，持续多久则由诅咒定义自己的 `duration_ticks` 决定。这些类型由模组注册，数据包只能选用，不能新增。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `duration_ticks` | `NumberProvider` | `0` | 诅咒持续多久，单位 tick |

### `mxt:timed`

在配置的时长之后过期；时长必须为正。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

### `mxt:permanent`

永不过期，`duration_ticks` 不参与。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:permanent"}
```

### `mxt:triggered`

施加与移除由所属的事件桥驱动；时长非正表示不过期。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `triggers` | 数组 | `[]` | 让这条诅咒发作的信号，写法与技能触发器一致；任一匹配的信号到达时执行一次 `on_tick`，空列表在加载期被拒 |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:hurt"}]}
```

### `mxt:empty`

完全没有生命周期。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:empty"}
```

---

**时长必须为正的只有 `mxt:timed`**：常量在加载期就校验，公式在求值那一刻判定，判定不了就拒绝这次施加，而不是抛异常。`mxt:triggered` 的时长非正表示不过期，`mxt:permanent` 与 `mxt:empty` 根本不看 `duration_ticks`。
