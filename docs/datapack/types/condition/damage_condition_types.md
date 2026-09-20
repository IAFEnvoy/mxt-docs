---
title: 伤害条件类型
description: 模组注册的所有内置伤害条件类型，以及每种类型接受的 JSON 字段。
---

# 伤害条件类型

**伤害条件**检查一个即将到来的伤害来源及其伤害数值，并返回 `true` 或 `false`。来源与数值由声明该条件的数据表提供，因此条件本身只描述要检查交给它的伤害的哪些内容。

伤害条件属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义条件类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

条件是一个 JSON 对象，`type` 字段指定内置类型，其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:damage_type_tag",
  "tag": "minecraft:is_fire"
}
```

由于条件在其他数据表中是作为值使用的，同一结构通常嵌套在 `damage_condition` 之类的字段下：

```json
"damage_condition": {
  "type": "mxt:amount_range",
  "min": 4,
  "max": 20
}
```

任何需要伤害条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"damage_condition": [
  { "type": "mxt:projectile" },
  { "type": "mxt:amount_range", "min": 2, "max": 10 }
]
```

::: info 伤害注册表
`damage_type` 接受已注册伤害类型的 id，例如 `minecraft:fall`；`damage_type_tag` 接受伤害类型标签，例如 `minecraft:is_fire`。两者都遵循标准的原版伤害类型注册表，因此新增伤害类型或标签的数据包在这里是可见的。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 条件类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always_true` | — | 始终通过。 |
| `mxt:js` | `id`, `params?` | 调用通过 KubeJS 桥接注册的伤害条件处理器。 |
| `mxt:and` | `conditions` | 要求所有嵌套伤害条件都通过。 |
| `mxt:or` | `conditions` | 至少有一个嵌套伤害条件通过时通过。 |
| `mxt:not` | `condition` | 对嵌套伤害条件取反。 |
| `mxt:chance` | `chance` | 以给定概率随机通过，概率介于 `0` 与 `1` 之间。 |
| `mxt:constant` | `value` | 始终返回给定的布尔值。 |
| `mxt:amount_range` | `min`, `max` | 检查伤害数值是否介于 `min` 与 `max` 之间。 |
| `mxt:directness` | `direct?` | 检查伤害来源是否拥有独立于其归属者的直接实体；`direct` 默认为 `true`，写 `false` 则要求相反的情况。 |
| `mxt:damage_type` | `damage_type` | 匹配一个具体的已注册伤害类型。 |
| `mxt:damage_type_tag` | `tag` | 用伤害类型标签匹配该伤害来源。 |
| `mxt:fire` | — | 匹配属于原版火焰伤害标签的伤害。 |
| `mxt:magic` | — | 匹配被归类为魔法的原版伤害来源。 |
| `mxt:projectile` | `projectile?`, `projectile_condition?` | 匹配弹射物伤害，可选限定某一种弹射物实体类型，并用作用于该弹射物的 [实体条件](entity_condition_types.md) 进行过滤。 |
| `mxt:element` | `elements` | 按这一击的**元素**匹配：`elements` 是 `HolderOrTag<element>[]`，当这一击的元素中有列出的一个时通过。这一击的元素就是伤害管线读的那一份——伤害类型的认领者，没人认领时才回落到攻击者灵根——所以条件说的元素与目标实际吃到的倍率永远一致；元素一旦认领 `minecraft:lava`，岩浆伤害也会命中这条条件。`elements` 至少写一项：写空数组会在加载期被拒绝，而不是变成一条恒不成立的条件。 |

::: info `mxt:fire` 与伤害标签的区别
`mxt:fire` 不接收任何字段，等价于使用原版火焰伤害标签的 `mxt:damage_type_tag`。当你想要指向另一个标签而不想新写一个类型时，请使用标签形式。
:::

::: info 概率与随机性
当伤害来源带有实体时，`mxt:chance` 从该实体自身的随机流中取值，因此这次判定跟随该实体，而不是使用新的生成器。当来源完全没有实体时，它会回退到一个新的未设种子的随机源，因此该情形在两侧之间不可复现。
:::
