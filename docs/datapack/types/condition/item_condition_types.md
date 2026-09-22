---
title: 物品条件类型
description: 模组注册的所有内置物品条件类型，以及每种类型接受的 JSON 字段。
---

# 物品条件类型

**物品条件**检查单个物品堆并返回 `true` 或 `false`。持有者实体与物品堆由声明该条件的数据表提供，因此条件本身只描述要检查交给它的物品堆的哪些内容。

物品条件属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义条件类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

条件是一个 JSON 对象，`type` 字段指定内置类型，其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:item_tag",
  "tag": "minecraft:swords"
}
```

由于条件在其他数据表中是作为值使用的，同一结构通常嵌套在 `item_condition` 之类的字段下：

```json
"item_condition": {
  "type": "mxt:relative_durability",
  "comparison": "<=",
  "compare_to": 0.25
}
```

任何需要物品条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"item_condition": [
  { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  { "type": "mxt:relative_durability", "comparison": ">", "compare_to": 0.5 }
]
```

::: info 物品条件的运行位置
待检验的物品堆通常由声明该条件的数据表提供，例如通过 `mxt:equipped_item` 实体条件或某个物品行为字段提供。比较运算符有 `==`、`!=`、`<`、`<=`、`>` 和 `>=`。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 条件类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always_true` | — | 始终通过。 |
| `mxt:js` | `id`, `params?` | 调用通过 KubeJS 桥接注册的物品条件处理器。 |
| `mxt:and` | `conditions` | 仅当所有嵌套物品条件都通过时通过。 |
| `mxt:or` | `conditions` | 至少有一个嵌套物品条件通过时通过。 |
| `mxt:not` | `condition` | 对嵌套物品条件取反。 |
| `mxt:chance` | `chance` | 以给定概率随机通过，概率介于 `0` 与 `1` 之间。 |
| `mxt:constant` | `value` | 始终返回给定的布尔值。 |
| `mxt:item_id` | `item` | 匹配物品堆的物品 id。 |
| `mxt:owned_by` | — | 当物品堆的法器归属（`mxt:artifact_state` 的 `owner_uuid`）就是当前持有者时通过；没有归属的物品堆不通过。 |
| `mxt:energy_range` | `aura`, `min`, `max` | 检查物品堆上**某一种灵气**的已存量是否介于 `min` 与 `max` 之间（含端点）；`aura` 是具体灵气，必填。 |
| `mxt:item_tag` | `tag` | 用原版或数据包物品标签匹配该物品堆。 |
| `mxt:item_matcher` | `items` | 用单个值中列出的任意物品 id、物品标签或带类型的匹配器条目进行匹配。 |
| `mxt:amount` | `comparison`, `compare_to` | 比较物品堆的数量。 |
| `mxt:fuel` | `comparison`, `compare_to` | 比较物品堆的熔炉燃烧时间。 |
| `mxt:is_equipable` | `slot?` | 检查物品堆是否带有可装备组件，可选只检查某个具体装备槽位。 |
| `mxt:relative_durability` | `comparison`, `compare_to` | 比较物品堆的剩余耐久除以其最大耐久。 |
| `mxt:armor_value` | `comparison`, `compare_to` | 比较物品堆在其可装备槽位中提供的护甲值。 |
| `mxt:durability` | `comparison`, `compare_to` | 比较物品堆的剩余耐久。 |
| `mxt:on_cooldown` | — | 当物品堆处于持有者的原版物品冷却中时通过。 |
| `mxt:ingredient` | `ingredient` | 用原版 ingredient 匹配该物品堆。 |
| `mxt:tool_ability` | `ability` | 检查物品堆是否能执行某项 NeoForge 物品能力。 |
| `mxt:base_enchantment` | `enchantment`, `comparison`, `compare_to` | 比较存储在物品堆上的某个附魔的等级。 |
| `mxt:has_component` | `component` | 检查物品堆是否带有给定的数据组件。 |
| `mxt:component` | `component`, `nbt` | 用部分 NBT 比较匹配某个数据组件的序列化值。 |
| `mxt:spirit_storage_not_full` | — | 匹配已存储灵力低于其容量的可充能物品。 |
| `mxt:item_element` | `elements` | 当物品携带所列元素之一时通过。读的是「物品的元素」：`weapon_binding` / `item_binding` / `artifact` 声明的 `element`（可取并集），一个都没声明时才回落到物品携带的灵气的 `aura_type`；元素与元素标签都接受，空列表在加载期被拒。见 [weapon_binding](../../json/weapon_binding.md)。 |

::: info `mxt:item_matcher`
`items` 字段接受单个值或数组，数组中可自由混合物品 id、物品标签和带类型的匹配器条目。带类型的条目有 `mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:herb_tag`（带有给定元素或材质标签的灵草）以及无字段的 `mxt:spirit_storage`，后者匹配所有能存储灵气的物品；见 [其他类型家族](/datapack/types/other/formation-and-matcher#item-matcher-entry-type)。当一组物品尚未被现有标签覆盖时，这是接受它们最紧凑的写法。
:::

::: info `mxt:durability` 与 `mxt:relative_durability` 的对比
`mxt:durability` 比较的是原始剩余耐久，因此同一个值在最大耐久不同的物品上含义不同。`mxt:relative_durability` 比较的是介于 `0` 与 `1` 之间的剩余比例，更适合写成通用规则。两者都只对可损坏物品通过。
:::
