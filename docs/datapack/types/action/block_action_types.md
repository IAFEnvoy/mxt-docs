---
title: 方块行为类型
description: 模组注册的全部内置方块行为类型，以及每种类型接受的 JSON 字段。
---

# 方块行为类型

**方块行为**作用于世界中的单个方块位置。世界与位置由声明该行为的那张数据表提供，有些调用方还会提供朝向，因此行为本身只描述要在该位置上做什么。

方块行为属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义行为类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

一个行为是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:set_block",
  "block": "minecraft:stone"
}
```

因为行为会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `block_action` 这样的字段下：

```json
"block_action": {
  "type": "mxt:break_block",
  "drop": false
}
```

任何需要方块行为的地方也接受行为数组。数组是 `mxt:sequence` 的简写，会按顺序执行其中的条目：

```json
"block_action": [
  { "type": "mxt:break_block" },
  { "type": "mxt:set_block", "block": "minecraft:air" }
]
```

::: info 与其他家族混用
有若干表类型同时声明方块字段和其他行为字段，而[实体行为](entity_action_types.md)可以用 `mxt:block_action` 包裹一个方块行为。方块条件则属于自己的家族，见[方块条件类型](../condition/block_condition_types.md)页。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为类型

元行为控制其他方块行为是否执行、执行频率、执行顺序以及在哪个位置执行。它们就是那些把其他行为作为字段的行为。

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:no_op` | — | 什么都不做；这是可选行为字段的默认行为。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的方块行为处理器。 |
| `mxt:sequence` | `actions` | 按顺序执行一组方块行为。 |
| `mxt:chance` | `action`、`chance`、`fail_action?` | 以概率 `chance` 执行 `action`，否则执行 `fail_action`。 |
| `mxt:if_else` | `condition`、`if_action`、`else_action?` | 方块条件通过时执行 `if_action`，否则执行 `else_action`。 |
| `mxt:choice` | `actions` | 从带权重的列表中挑选一个条目执行。 |
| `mxt:offset` | `action`、`x?`、`y?`、`z?` | 在相对的方块偏移处施加一个嵌套行为。 |

`choice` 列表的每个条目都是对嵌套行为的一层带权重包装：

| 条目字段 | 类型 | 默认 | 说明 |
|-------------|------|---------|-------------|
| `value` | Block action | **required** | 该条目被选中时执行的行为。 |
| `weight` | Integer | `1` | 相对权重；越大越容易被选中，`≤0` 的条目永远不会被选中（整表全为 `0` 时等概率抽一项）。 |

## 行为类型

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:set_block` | `block` | 把该位置上的方块设为该方块的默认状态。 |
| `mxt:break_block` | `drop?` | 破坏该位置上的方块，可选地掉落其战利品。 |
| `mxt:change_aura` | `aura` | 改变该位置上的权威区块灵气附件；客户端上不会发生任何改变。 |
| `mxt:schedule_tick` | `delay` | 为当前方块安排在给定延迟之后的一次 tick。 |
| `mxt:bonemeal` | `effect?` | 对该方块施加骨粉，可选地显示原版生长粒子与音效。 |
| `mxt:light_up` | — | 当方块拥有原版 `lit` 属性时，把该属性设为 `true`。 |
| `mxt:explode` | `power`、`interaction?`、`indestructible?`、`create_fire?` | 在该位置制造一次爆炸。 |
| `mxt:spawn_entity` | `entity_type`、`tag?`、`entity_action?` | 在该方块位置生成一个实体，并对它施加一个可选的实体行为。 |

::: info `mxt:change_aura`
`aura` 是一个映射，键为[数值](../../json/resource.md)，值为[数值提供器](../number_provider_types.md)，因此一次行为可以同时改变若干条资源池。该改变只在服务端施加。
:::

::: info 嵌套值
`mxt:if_else` 接受一个[方块条件](../condition/block_condition_types.md)。`mxt:explode` 用 `indestructible` 保护匹配的方块，并接受 `interaction` 来选择原版爆炸交互类型，例如 `mob` 或 `none`。`mxt:spawn_entity` 接受 `tag` 作为写入实体的 NBT，以及一个在生成出来的实体上运行的[实体行为](entity_action_types.md)。
:::
