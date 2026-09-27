---
title: 双实体行为类型
description: 模组注册的全部内置双实体行为类型，以及每种类型接受的 JSON 字段。
---

# 双实体行为类型

双实体行为作用于一对实体：施动者（actor）与目标（target）。这一对由声明该行为的那张数据表提供，行为本身只描述要对交给它的这两个实体做什么，不负责挑人。

`type` 写在行为对象里，取值是下面列出的 id 之一。这些 id 由模组固定注册，数据包不能新增或删除；自定义类型只能通过 KubeJS 引入，见 [KubeJS API](../../../kubejs/api-reference.md)。除了 `type`，其余键全部由该类型决定。

## 通用结构

一个行为是一个 JSON 对象，`type` 指明类型，其余键都是该类型的字段：

```json
{
  "type": "mxt:damage_target",
  "amount": 4
}
```

行为通常嵌在其他数据表的字段里，例如 `bientity_action`：

```json
"bientity_action": {
  "type": "mxt:actor_action",
  "action": {
    "type": "mxt:heal",
    "amount": 2
  }
}
```

`mxt:actor_action` 里嵌套的 `action` 是一个[实体行为](entity_action_types.md)，所以它收实体行为 id；把 `mxt:heal_target` 这样的双实体行为 id 写在这个位置上是不对的。

任何需要双实体行为的地方也收数组。数组是 `mxt:sequence` 的简写，按顺序执行其中的条目：

```json
"bientity_action": [
  { "type": "mxt:mount" },
  { "type": "mxt:heal_target", "amount": 1 }
]
```

可选的行为字段漏写时就是 `mxt:no_op`。加载期不会为此报错，只是那一项什么都不做。

::: info 字段类型是共享的
接受数值的字段一般都能用[数值提供器](../number_provider_types.md)代替固定数字，因此凡是普通数字能用的地方，公式和随机值都能用。
:::

::: info 嵌套值
`mxt:if_else` 收一个[双实体条件](../condition/bientity_condition_types.md)；`mxt:actor_action` 与 `mxt:target_action` 收[实体行为](entity_action_types.md)。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为类型

元行为控制其他双实体行为是否执行、执行频率以及执行顺序。它们就是那些把其他行为当字段的类型。

### mxt:no_op

什么都不做。

没有字段。

```json
{ "type": "mxt:no_op" }
```

### mxt:js

把行为交给 KubeJS 注册的处理器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 注册处理器时用的名字。 |
| `params` | JSON 对象 | `{}` | 原样交给处理器的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:push_away",
  "params": { "strength": 1.5 }
}
```

处理器用 `MxtActions.biEntity(id, callback)` 注册，回调收到施动者、目标、`params` 和本次的公式上下文。这个 `id` 找不到对应回调时记一条警告，然后什么也不做；回调抛异常同样只记日志，这一串行为不会被打断。

### mxt:sequence

按顺序执行一组双实体行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 双实体行为数组 | **必填** | 依次执行的行为。 |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:mount" },
    { "type": "mxt:heal_target", "amount": 1 }
  ]
}
```

### mxt:chance

以 `chance` 的概率执行 `action`，否则执行 `fail_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 双实体行为 | **必填** | 抽中时执行的行为。 |
| `chance` | 浮点数 | **必填** | 执行概率，`0`..`1`。 |
| `fail_action` | 双实体行为 | `mxt:no_op` | 没抽中时执行的行为。 |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:damage_target", "amount": 4 },
  "fail_action": { "type": "mxt:heal_target", "amount": 1 }
}
```

`chance` 超出 `0`..`1` 在加载期报错。写 `0` 时 `action` 永不执行，写 `1` 时一定执行。

### mxt:if_else

双实体条件通过时执行 `if_action`，否则执行 `else_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 双实体条件 | **必填** | 判断用的条件。 |
| `if_action` | 双实体行为 | **必填** | 条件通过时执行的行为。 |
| `else_action` | 双实体行为 | `mxt:no_op` | 条件不通过时执行的行为。 |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:can_see" },
  "if_action": { "type": "mxt:damage_target", "amount": 8 }
}
```

### mxt:choice

从带权重的列表里挑一个条目执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 条目数组 | **必填** | 候选条目。 |

每个条目是对嵌套行为的一层带权重包装：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 双实体行为 | **必填** | 该条目被选中时执行的行为。 |
| `weight` | 整数 | `1` | 相对权重。 |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "value": { "type": "mxt:heal_target", "amount": 2 }, "weight": 3 },
    { "value": { "type": "mxt:damage_target", "amount": 2 }, "weight": 1 }
  ]
}
```

权重越大越容易被选中。`weight` 小于等于 `0` 的条目永远不会被选中，负数按 `0` 算；整表的权重加起来也是 `0` 时改为等概率抽一项。权重写错不会让整表哑掉。

## 行为类型

### mxt:mount

让施动者开始骑乘目标。

没有字段。

```json
{ "type": "mxt:mount" }
```

### mxt:damage_target

对目标造成伤害，并把施动者记为攻击者，因此击杀归属与仇恨都会跟着它；[伤害系统](/technical/damage)的两层都会生效。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 伤害量。 |
| `damage_type` | 伤害类型 id | 不声明 | 构造这一击的来源类型。 |
| `element` | 元素 id 或 `#元素标签` 的列表 | `[]` | 声明这一击的元素。 |

```json
{
  "type": "mxt:damage_target",
  "amount": "8 + level",
  "damage_type": "minecraft:magic"
}
```

只在服务端结算。`amount` 不是有限数或小于等于 `0` 时这一击不发生。

`element` 只写元素时，取它认领的第一个伤害类型当作 `damage_type`；写成 `#元素标签` 时推不出类型，必须自己写 `damage_type`。两个都写时在**首次使用**这一击时核对元素确实认领了它，不一致各报一次日志，这一击仍按声明的 `damage_type` 打。

### mxt:heal_target

治疗目标。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 治疗量。 |

```json
{ "type": "mxt:heal_target", "amount": 2 }
```

目标不是生物、`amount` 不是有限数或小于等于 `0` 时什么都不做。

### mxt:transfer_resource

把一定量的[数值](../../json/resource.md)从施动者转移给目标。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | 数值 id | **必填** | 要转移的数值。 |
| `amount` | 数值提供器 | **必填** | 请求转移的量。 |

```json
{ "type": "mxt:transfer_resource", "resource": "example:qi", "amount": 10 }
```

`amount` 不是有限数或小于等于 `0` 时什么都不做。实际转移量取三者中最小的那个：施动者当前持有量、`amount`、目标上限减去目标当前值。结果小于等于 `0` 时整件事不发生，施动者一点也不会被扣。目标没有这个数值的定义、或定义给不出上限时，同样什么都不做。

### mxt:add_velocity

给目标增加速度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `x` | 浮点数 | `0` | 向量 X 分量。 |
| `y` | 浮点数 | `0` | 向量 Y 分量。 |
| `z` | 浮点数 | `0` | 向量 Z 分量。 |
| `reference` | `position` / `rotation` | `position` | 该向量所用的参考系。 |
| `client` | 布尔 | `true` | 客户端是否执行。 |
| `server` | 布尔 | `true` | 服务端是否执行。 |
| `set` | 布尔 | `false` | 直接设置速度，而不是叠加。 |

```json
{ "type": "mxt:add_velocity", "y": 1.2, "reference": "rotation" }
```

`reference` 取 `position`（默认）时按从施动者到目标的方向解算该向量，取 `rotation` 时按施动者的视线方向解算。`client` 与 `server` 都写 `false` 时什么也不做。执行后目标会被标记为速度已变，客户端跟着更新。

### mxt:teleport

把两端中的一端移动到另一端的位置。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `teleport_actor` | 布尔 | `false` | 把施动者移动到目标处。 |
| `teleport_target` | 布尔 | `true` | 把目标移动到施动者处。 |
| `rotate` | 布尔 | `false` | 连朝向一起复制过去。 |

```json
{ "type": "mxt:teleport", "teleport_target": true, "rotate": true }
```

两个都写 `true` 就是互换位置；两个都写 `false` 时什么都不做。只在服务端执行。施动者那一侧的位置是**这次发动的地点**，从符箓 / 展示架发动时就是符箓 / 架子那里。`rotate` 为 `true` 时，被移动的一方拿到另一方的朝向。

### mxt:actor_action

对施动者施加一个[实体行为](entity_action_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 实体行为 | **必填** | 对施动者执行的行为。 |

```json
{ "type": "mxt:actor_action", "action": { "type": "mxt:heal", "amount": 2 } }
```

注意：`action` 收实体行为，不是双实体行为。

### mxt:target_action

对目标施加一个[实体行为](entity_action_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 实体行为 | **必填** | 对目标执行的行为。 |
| `use_target_position` | 布尔 | `false` | 让按位置落点的行为落在目标自己的位置。 |

```json
{
  "type": "mxt:target_action",
  "action": { "type": "mxt:spawn_lightning" },
  "use_target_position": true
}
```

`mxt:actor_action` 与 `mxt:target_action` 里嵌套的实体行为默认沿用**这次发动的地点**：按位置落点的行为会落在发动处，从符箓 / 展示架发动时就是符箓 / 架子那里（`mxt:spawn_lightning`、`mxt:explode`、`mxt:spawn_particles`、`mxt:spawn_effect_cloud`、`mxt:play_sound`、`mxt:block_action` 都是这样）。所以"对每个选中的目标各落一道雷"必须写 `"use_target_position": true`，否则每一道雷都会落在施动者 / 符箓脚下。读实体的行为在同一个值下不受影响。
