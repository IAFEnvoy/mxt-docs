---
title: 类型参考
description: MiXianTu 内置类型分派的工作方式，以及每一族类型的文档位置。
---

# 类型参考

行为、条件、数值提供器这些东西都是**由代码持有的类型表**：模组把每个条目注册在一个 ID 下，数据包写 `type` 来选其中一个。

```json
{
  "type": "mxt:heal",
  "amount": 2
}
```

`type` 就写在带参数的那个对象里，和它的参数平级，没有外面再包一层。

数据包**只能选已有类型**，不能新增：未知的 `type` 会在加载期报错。新类型只能在代码或脚本里注册。

`type` 一律写完整 ID：内置类型都在 `mxt:` 命名空间下，写成 `"and"` 会被当作 `minecraft:and`，加载期以「找不到这个 `type`」报错。

几个类型族接受**简写**：JSON 数字就是 `mxt:constant`，字符串就是 `mxt:expression`，`"minecraft:apple"` 这样的物品 ID 就是匹配器条目 `mxt:item`。能简写的地方，写全类型对象也一样有效。

## 参与分派的字段

| 字段 | 一族类型 | 见 |
| --- | --- | --- |
| `type`（技能顶层） | 技能类型 `mxt:ability_type` | [技能类型](./other/ability) |
| `type` | 目标选择器 `mxt:ability_target_selector_type` | [技能目标选择器](./other/ability-selector) |
| `type` | 状态种类 `mxt:data_storage_type` | [数据存储](./other/data-storage) |
| `type` | 诅咒类型 `mxt:curse_type` | [诅咒类型](./other/curse) |
| `type` | 触发器 `mxt:trigger_type`、消耗 `mxt:cost_type` | [触发器与消耗](./other/trigger-and-cost) |
| `type` | 阵法功能模块 `mxt:formation_action_type` | [阵法功能](./other/formation-action) |
| `type` | 天劫节拍 `mxt:timeline_entry_type` | [天劫节拍](./other/timeline-entry) |
| `type` | 资源数值来源 `mxt:resource_value_provider_type` | [资源条与灵气](./other/resource-bar) |
| `type` | 环境上限 `mxt:aura_maximum_type` | [环境上限](./other/aura-maximum) |
| `context`（ID 字符串） | 资源条上下文 `mxt:resource_bar_context` | [资源条与灵气](./other/resource-bar) |
| `renderer.type` | 资源条绘制器 `mxt:resource_bar_render_data_type` | [资源条与灵气](./other/resource-bar) |
| `visible_when.type` | 资源条显示条件 `mxt:resource_bar_visibility_type` | [资源条与灵气](./other/resource-bar) |
| `type` | 物品匹配器条目 `mxt:item_matcher_entry_type` | [物品匹配器](./other/item-matcher) |
| `type` | 实体行为 | [实体行为](./action/entity_action_types) |
| `type` | 双实体行为 | [双实体行为](./action/bientity_action_types) |
| `type` | 方块行为 | [方块行为](./action/block_action_types) |
| `type` | 物品行为 | [物品行为](./action/item_action_types) |
| `type` | 实体条件 | [实体条件](./condition/entity_condition_types) |
| `type` | 双实体条件 | [双实体条件](./condition/bientity_condition_types) |
| `type` | 方块条件 | [方块条件](./condition/block_condition_types) |
| `type` | 物品条件 | [物品条件](./condition/item_condition_types) |
| `type` | 伤害条件 | [伤害条件](./condition/damage_condition_types) |
| `type` | 数值提供器 `mxt:number_provider_type` | [数值提供器](./number_provider_types) |
| 名字（不是字段） | 公式变量 `mxt:formula_variable` | [公式变量](./formula_variables) |

行为和条件的**数组是简写**，表示按顺序全跑一遍：

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

## 共享数据类型

许多字段共用同一批复杂值，单独记在[共享数据类型](./shared_data_types)里：`Cost`、`AuraGain`、`AttributeEntry`、图标引用、Holder 与标签的写法、`ItemMatcher`，以及公式的写法。

## 交给脚本的类型

除个别例外，每一族都预注册了一个 `mxt:js` 类型。脚本在 `kubejs/server_scripts/` 里注册回调用它，数据包按 `id` 引用：

| 分派 | `mxt:js` 的字段 | 注册方法 |
| --- | --- | --- |
| 实体 / 双实体 / 方块 / 物品行为 | `id`、`params` | `MxtActions.entity` / `biEntity` / `block` / `item` |
| 实体 / 双实体 / 方块 / 物品 / 伤害条件 | `id`、`params` | `MxtConditions.entity` / `biEntity` / `block` / `item` / `damage` |
| 数值提供器 | `id`、`params` | `MxtValues.number` |
| 资源数值来源 | `id`、`params` | `MxtValues.resourceValue` |
| 消耗 | `id`、`params` | `MxtCosts.register` |
| 触发器 | `signal`、`id`、`params` | `MxtTriggers.matcher` |
| 技能目标选择器 | `id`、`params` | `MxtAbilities.selector` |
| 原版战利品条件 / 函数 | `id`、`params` | `MxtLoot.condition` / `MxtLoot.function` |

`mxt:js` 的触发器要多写一个 `signal`：运行时要按信号分层派发。回调都在服务端跑。回调缺失或抛异常时各自退化成安全值（行为什么也不做、条件为假、数值为 `0`、消耗付不出、触发器不匹配、选择器选不出实体），并记一条警告。

## 相关

- [技能定义](../json/ability) —— 技能类型写在哪、通用字段有哪些
- [数组与简写](../overview) —— 行为、条件数组怎么合并
