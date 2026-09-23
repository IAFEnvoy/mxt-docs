---
title: 类型参考
description: MiXianTu 内置类型分派的工作方式，以及每一类类型的文档位置。
---

# 类型参考

本节记录 MiXianTu JSON 可以通过 `type` 字段选择的内置类型，以及这些类型所消费的共享数据类型。

## 类型分派的工作方式

行为、条件、数值提供器和若干更小的类型族都是**由 Java 持有的 Codec 注册表**。模组把每个条目注册在诸如 `mxt:heal` 或 `mxt:uniform` 的 ID 下，数据包则通过写一个 `type` 字段来选择其中之一：

```json
{
  "type": "mxt:heal",
  "amount": 2
}
```

`type` 键**内联**在携带该类型参数的那个 JSON 对象里。既没有包装对象，也没有单独的参数区块：判别符与它所选择的字段并排存在。

::: info 数据包不能新增类型
数据包只能提供 `type` 和某个已有类型的参数。数据包永远不会向这些内置注册表添加条目，未知的 `type` ID 会导致加载失败。新类型必须从 Java 或脚本中注册。
:::

若干类型族为其最常见的情形接受纯 JSON 的**简写**，它与写出带默认字段的类型完全等价。例如 JSON 数字就是 `mxt:constant`，JSON 字符串就是 `mxt:expression`，而像 `"minecraft:apple"` 这样的物品 ID 就是物品匹配器条目 `mxt:item`。存在简写的地方，显式写出类型对象依然有效。

## 参与分派的字段

下列字段使用 Java 内置注册表的 `MapCodec`。数据包可以传入 `type` 和该类型的参数，但不能引入新的 `type`：

| 数据类型 | 分派字段 | 作用 |
| --- | --- | --- |
| `Ability` | `ability.type` | 顶层字段名为 `ability`；嵌套对象中的 `type` 选择技能生命周期和触发方式 |
| `CurseType` | `type` | 诅咒的持续和过期方式 |
| `EntityAction` | `type` | 实体行为 |
| `BiEntityAction` | `type` | 双实体行为 |
| `BlockAction` | `type` | 方块行为 |
| `ItemAction` | `type` | 物品行为 |
| `EntityCondition` | `type` | 实体条件 |
| `BiEntityCondition` | `type` | 双实体条件 |
| `BlockCondition` | `type` | 方块条件 |
| `ItemCondition` | `type` | 物品条件 |
| `DamageCondition` | `type` | 伤害条件 |
| `ResourceValueProvider` | `type` | 资源条和扩展读取的资源数值来源，包括环境与实际灵气浓度 |
| `ResourceBarRenderer` | `type` | 资源条绘制器 |
| `ResourceBarVisibility` | `type` | 资源条显示条件 |

行为和条件**数组是简写**，表示“全部按该顺序执行”：

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

每个行为与条件的具体字段由它自己的内置 Codec 定义。内置类型由 `MxtEntityActions`、`MxtBiEntityActions`、`MxtBlockActions`、`MxtItemActions`、`MxtEntityConditions` 及其同级类分组注册；数据包不会向其中任何注册表添加条目。

::: info
MiXianTu 的数值提供器注册表是它自己的，键为 `mxt:number_provider_type`，其 ID 全部带 `mxt` 命名空间，例如 `mxt:constant` 和 `mxt:uniform`。
:::

## 行为类型

| 行为分类 | 参考 |
| --- | --- |
| 实体行为 | [实体行为类型](./action/entity_action_types.md) |
| 双实体行为 | [双实体行为类型](./action/bientity_action_types.md) |
| 方块行为 | [方块行为类型](./action/block_action_types.md) |
| 物品行为 | [物品行为类型](./action/item_action_types.md) |

## 条件类型

| 条件分类 | 参考 |
| --- | --- |
| 实体条件 | [实体条件类型](./condition/entity_condition_types.md) |
| 双实体条件 | [双实体条件类型](./condition/bientity_condition_types.md) |
| 方块条件 | [方块条件类型](./condition/block_condition_types.md) |
| 物品条件 | [物品条件类型](./condition/item_condition_types.md) |
| 伤害条件 | [伤害条件类型](./condition/damage_condition_types.md) |

## 数值提供器类型

任何必须随等级、境界或事件上下文变化的数值都是 `NumberProvider`。简写形式、固有数值提供器和公式函数见[数值提供器类型](./number_provider_types.md)；公式可以读取的每一个变量、它在何处可用以及未知名字如何报告，见[公式变量](./formula_variables.md)。

## 其他类型族

其余内置类型族遵循相同的分派规则，但规模较小，适合合并记录。每一族注册的 ID 和 JSON 字段见[其他类型族](./other_types.md)：

- `trigger_type`
- `cost_type`
- `ability_type`
- `data_storage_type`
- `ability_target_selector_type`
- `curse_type`
- `formation_action_type`
- `timeline_entry_type`
- `resource_bar_context`
- `resource_bar_render_data_type`
- `resource_bar_visibility_type`
- `resource_value_provider_type`
- `aura_maximum_type`
- `item_matcher_entry_type`

## 共享数据类型

在许多定义中都会出现的复杂值统一记录在[共享数据类型](./shared_data_types.md)中：`Cost`、`ResourceGain`、`AttributeEntry`、通用的 holder/tag/matcher 语法以及 `ItemMatcher` 条目。

## 注册自定义类型

自定义类型在代码中注册，永远不在 JSON 中注册：

| 扩展途径 | 参考 |
| --- | --- |
| 向内置注册表进行 Java 注册 | [注册表与 Codec](../../java/registries.md) |
| 通过预注册的 `mxt:js` 类型使用脚本回调 | [KubeJS API 参考](../../kubejs/api-reference.md) |

`mxt:js` 条目适用于实体、双实体、方块和物品行为，适用于实体、双实体、方块、物品和伤害条件，适用于数值提供器、资源数值提供器、触发器匹配器、Cost、技能目标选择器，以及 MiXianTu 为原版战利品表添加的战利品条件和战利品函数。回调在 `kubejs/server_scripts/` 中注册；回调缺失时，行为不做任何事、条件返回 `false`、数值解析为 `0`、Cost 变成无法支付、触发器永不匹配、目标选择器选不出任何实体、战利品函数保留原物品堆，并在日志中记录一条警告。行为与条件的回调还会收到本次分派的公式上下文，因此脚本读到的事件载荷与内置类型读到的是同一份。
