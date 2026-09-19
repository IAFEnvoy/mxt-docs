---
title: 方块条件类型
description: 模组注册的所有内置方块条件类型，以及每种类型接受的 JSON 字段。
---

# 方块条件类型

**方块条件**检查世界中的单个方块位置并返回 `true` 或 `false`。世界与位置由声明该条件的数据表提供，因此条件本身只描述要检查该位置方块的哪些内容。

方块条件属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义条件类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

条件是一个 JSON 对象，`type` 字段指定内置类型，其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:block_tag",
  "tag": "minecraft:logs"
}
```

由于条件在其他数据表中是作为值使用的，同一结构通常嵌套在 `block_condition` 之类的字段下：

```json
"block_condition": {
  "type": "mxt:hardness",
  "comparison": ">=",
  "compare_to": 3.0
}
```

任何需要方块条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"block_condition": [
  { "type": "mxt:movement_blocking" },
  { "type": "mxt:height", "comparison": "<", "compare_to": 64 }
]
```

::: info 比较字段
有若干类型会把某个值与一个数字比较。比较运算符 `comparison` 和被比较的数字 `compare_to` 始终作为两个独立键直接写在条件对象上，如上例所示。比较运算符有 `==`、`!=`、`<`、`<=`、`>` 和 `>=`，`compare_to` 始终是普通数字。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 条件类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always_true` | — | 始终通过。 |
| `mxt:js` | `id`, `params?` | 调用通过 KubeJS 桥接注册的方块条件处理器。 |
| `mxt:and` | `conditions` | 仅当所有嵌套方块条件都通过时通过。 |
| `mxt:or` | `conditions` | 至少有一个嵌套方块条件通过时通过。 |
| `mxt:not` | `condition` | 对嵌套方块条件取反。 |
| `mxt:chance` | `chance` | 以给定概率随机通过，概率介于 `0` 与 `1` 之间。 |
| `mxt:constant` | `value` | 始终返回给定的布尔值。 |
| `mxt:block_id` | `block` | 匹配该位置上的方块。 |
| `mxt:aura_range` | `aura` | 用每种灵气各自的要求检验该位置的灵气浓度。`aura` 把灵气 ID 映射到一个对象，其中 `max` 必填、`min` 可选。 |
| `mxt:block_tag` | `tag` | 用原版或数据包方块标签匹配该方块。 |
| `mxt:biome_tag` | `tag` | 用数据包群系标签匹配该位置所在的群系。 |
| `mxt:hardness` | `comparison`, `compare_to` | 比较该方块的硬度。 |
| `mxt:height` | `comparison`, `compare_to` | 比较该位置的 Y 坐标。 |
| `mxt:light_level` | `light_type?`, `comparison`, `compare_to` | 比较该位置的光照等级，可选只比较某一光照层。 |
| `mxt:slipperiness` | `comparison`, `compare_to` | 比较该方块的滑度。 |
| `mxt:blast_resistance` | `comparison`, `compare_to` | 比较该方块的爆炸抗性。 |
| `mxt:movement_blocking` | — | 当该方块阻挡运动且碰撞形状非空时通过。 |
| `mxt:adjacent` | `adjacent_condition`, `comparison`, `compare_to` | 比较符合嵌套方块条件的相邻方块数量。 |
| `mxt:offset` | `condition`, `x?`, `y?`, `z?` | 在该位置的相对偏移处检验一个嵌套方块条件。 |

::: info `mxt:aura_range`
`aura` 是一个映射，键为 [aura](../../json/aura.md)，值为要求对象：`min` 可选（默认 `0`），`max` 必填，两者都接受 [数值提供器](../number_provider_types.md)。当列出的每种灵气浓度都落在自己的区间内时，条件通过。
:::

::: info `mxt:light_level` 与 `mxt:adjacent`
`light_type` 接受原版光照层名称，例如 `block` 或 `sky`；省略时使用当前位置的最大原始亮度。`mxt:adjacent` 统计与该位置接触的方块，且只考虑已加载区块中的位置。
:::
