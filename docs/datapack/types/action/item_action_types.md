---
title: 物品行为类型
description: 模组注册的全部内置物品行为类型，以及每种类型接受的 JSON 字段。
---

# 物品行为类型

**物品行为**作用于单个物品堆。持有者实体与物品堆由声明该行为的那张数据表提供，因此行为本身只描述要对交给它的物品堆做什么。

物品行为属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义行为类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

一个行为是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:damage_item",
  "amount": 1
}
```

因为行为会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `item_action` 这样的字段下：

```json
"item_action": {
  "type": "mxt:consume_item",
  "count": 1
}
```

任何需要物品行为的地方也接受行为数组。数组是 `mxt:sequence` 的简写，会按顺序执行其中的条目：

```json
"item_action": [
  { "type": "mxt:damage_item", "amount": 1 },
  { "type": "mxt:cooldown", "ticks": 40 }
]
```

::: info 物品行为的运行位置
物品行为需要一个物品堆作为作用对象，因此通常经由已经提供物品堆的那张表到达——例如[实体行为](entity_action_types.md) `mxt:equipped_item_action`，它同时提供装备槽位。[物品条件](../condition/item_condition_types.md)是与之配对的条件家族。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为类型

元行为控制其他物品行为是否执行、执行频率以及执行顺序。它们就是那些把其他行为作为字段的行为。

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:no_op` | — | 什么都不做；这是可选行为字段的默认行为。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的物品行为处理器。 |
| `mxt:sequence` | `actions` | 按顺序执行一组物品行为。 |
| `mxt:chance` | `action`、`chance`、`fail_action?` | 以概率 `chance` 执行 `action`，否则执行 `fail_action`。 |
| `mxt:if_else` | `condition`、`if_action`、`else_action?` | 物品条件通过时执行 `if_action`，否则执行 `else_action`。 |
| `mxt:choice` | `actions` | 从带权重的列表中挑选一个条目执行。 |

`choice` 列表的每个条目都是对嵌套行为的一层带权重包装：

| 条目字段 | 类型 | 默认 | 说明 |
|-------------|------|---------|-------------|
| `value` | Item action | **required** | 该条目被选中时执行的行为。 |
| `weight` | Integer | `1` | 相对权重；越大越容易被选中，`≤0` 的条目永远不会被选中（整表全为 `0` 时等概率抽一项）。 |

## 行为类型

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:damage_item` | `amount` | 给该物品堆增加耐久损伤，并夹取到其最大损伤值。 |
| `mxt:consume_item` | `count` | 按给定数量缩减该物品堆。 |
| `mxt:charge_artifact` | `aura`、`amount`、`capacity?` | 给一件法器物品堆的**某一种灵气**增加存量；`aura`（具体灵气）与 `amount` 都必填。上限取该物品堆匹配到的 `artifact` 为这种灵气声明的 `spirit_capacity`；`capacity`（默认 `0`）只是**回退**：物品堆没有任何定义认领、或定义没有声明这种灵气时，用它当上限。 |
| `mxt:consume_health` | `amount` | 对持有者造成一次原版**秘法伤害**（`damageSources().magic()`）——「以血为代价」的写法。抗性提升与保护附魔照常减免，创造模式这类打不掉的持有者一点血都不掉。**它不预检也不拒绝**：付不付得起由声明它的那张表决定（法器的认主代价就写在 `claim_action` 里，而 `claim_action` **不写时的默认值**正是这条行为、`amount` 为 `4`，所以省略字段的法器认主会默认扣 4 点血）。 |
| `mxt:cooldown` | `ticks` | 让该物品堆在持有者身上进入原版物品冷却，持续给定的 tick 数。 |
| `mxt:remove_enchantment` | `enchantment?`、`level?`、`reset_repair_cost?` | 移除或降低该物品堆上的附魔，并可选择重置其修复成本。 |
| `mxt:add_enchantment` | `enchantments`、`override?` | 给该物品堆添加或升级附魔。 |
| `mxt:merge_components` | `components` | 把一份原版数据组件补丁合并进该物品堆。 |
| `mxt:add_ability` | `abilities` | 把技能并进该物品堆的 `mxt:item_abilities` 数据组件：**已经写过的一条不会写第二遍**，组件里原有的条目一律保留。它是这个组件的**专用生产者**（`mxt:merge_components` 仍然是通用补丁那条路），与别的物品行为一样作用于"这次动作拿到的那件物品堆"（认主、注灵、右键、法器生成……都行）。 |

::: info 嵌套值
`mxt:if_else` 接受一个[物品条件](../condition/item_condition_types.md)。`mxt:add_enchantment` 的 `enchantments` 接受一个从附魔 id 到等级的映射，`override` 决定是否可以替换已有的等级。`mxt:remove_enchantment` 接受一个附魔或一组附魔，用 `level` 限制移除的程度，`mxt:merge_components` 接受一份原版数据组件补丁。
:::

## 给一堆物品单独挂技能

除了定义里的 `abilities`，一件物品还能靠数据组件 `mxt:item_abilities`（`{"abilities": ["example:foo"]}`）自带技能：运行时读的是**定义声明的与组件写的并集**，所以同一件法器定义认领的两堆物品可以带不一样的技能。组件里只存**技能 id**，不收标签（标签在定义那一侧的 `abilities` 里展开）。写它现在有专用行为：

```json
"claim_action": { "type": "mxt:add_ability", "abilities": ["example:sword_focus"] }
```

`abilities`（**必填**，技能 id 的列表）逐条并进组件；已经写过的一条不会写第二遍，原有条目一律保留。以前只有通用补丁 `mxt:merge_components` 一条路，现在多了一条专用生产者。
