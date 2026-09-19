---
title: 双实体行为类型
description: 模组注册的全部内置双实体行为类型，以及每种类型接受的 JSON 字段。
---

# 双实体行为类型

**双实体行为**作用于一对实体：一个**施动者**（actor）与一个**目标**（target）。这一对实体由声明该行为的那张数据表提供，因此行为本身只描述要对交给它的这两个实体做什么。

双实体行为属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义行为类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

一个行为是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:damage_target",
  "amount": 4
}
```

因为行为会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `bientity_action` 这样的字段下：

```json
"bientity_action": {
  "type": "mxt:actor_action",
  "action": {
    "type": "mxt:heal",
    "amount": 2
  }
}
```

`mxt:actor_action` 里嵌套的 `action` 是一个[实体行为](entity_action_types.md)，因此它接受实体行为 id；把 `mxt:heal_target` 这样的双实体行为 id 写在这个位置上是不对的。

任何需要双实体行为的地方也接受行为数组。数组是 `mxt:sequence` 的简写，会按顺序执行其中的条目：

```json
"bientity_action": [
  { "type": "mxt:mount" },
  { "type": "mxt:heal_target", "amount": 1 }
]
```

::: info 字段类型是共享的
接受数值的字段一般都能用[数值提供器](../number_provider_types.md)代替固定数字，因此凡是普通数字能用的地方，公式和随机值都能用。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为类型

元行为控制其他双实体行为是否执行、执行频率以及执行顺序。它们就是那些把其他行为作为字段的行为。

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:no_op` | — | 什么都不做；这是可选行为字段的默认行为。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的双实体行为处理器。 |
| `mxt:sequence` | `actions` | 按顺序执行一组双实体行为。 |
| `mxt:chance` | `action`、`chance`、`fail_action?` | 以概率 `chance` 执行 `action`，否则执行 `fail_action`。 |
| `mxt:if_else` | `condition`、`if_action`、`else_action?` | 双实体条件通过时执行 `if_action`，否则执行 `else_action`。 |
| `mxt:choice` | `actions` | 从带权重的列表中挑选一个条目执行。 |

`choice` 列表的每个条目都是对嵌套行为的一层带权重包装：

| 条目字段 | 类型 | 默认 | 说明 |
|-------------|------|---------|-------------|
| `element` | Bi-entity action | **required** | 该条目被选中时执行的行为。 |
| `weight` | Integer | `1` | 相对权重；权重越大越容易被选中。 |

## 行为类型

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:mount` | — | 让施动者开始骑乘目标。 |
| `mxt:damage_target` | `amount` | 对目标造成伤害，并把施动者记为攻击者，因此击杀归属与仇恨都会跟着它；[伤害结算](../../damage.md)的两层都会生效。 |
| `mxt:heal_target` | `amount` | 治疗目标。 |
| `mxt:transfer_resource` | `resource`、`amount` | 把一定量的[数值](../../json/resource.md)从施动者转移给目标，并做夹取，使数值不会变成负数，也不会超过目标的上限。 |
| `mxt:add_velocity` | `x?`、`y?`、`z?`、`reference?`、`client?`、`server?`、`set?` | 给目标增加速度；`set` 为 `true` 时改为直接设置速度；`reference` 选择该向量所用的参考系。 |
| `mxt:teleport` | `teleport_actor?`、`teleport_target?`、`rotate?` | 把两端中的一端移动到另一端的位置：默认把目标移动到施动者处，`teleport_actor` 为 `true` 时把施动者移动到目标处。 |
| `mxt:actor_action` | `action` | 对施动者施加一个[实体行为](entity_action_types.md)。 |
| `mxt:target_action` | `action` | 对目标施加一个[实体行为](entity_action_types.md)。 |

::: info 嵌套值
`mxt:if_else` 接受一个[双实体条件](../condition/bientity_condition_types.md)，`mxt:actor_action` / `mxt:target_action` 接受[实体行为](entity_action_types.md)。
:::

`reference` 字段是该行为专有的，接受 `position`（默认，按从施动者到目标的方向解算该向量）或 `rotation`（按施动者的视线方向解算）。
