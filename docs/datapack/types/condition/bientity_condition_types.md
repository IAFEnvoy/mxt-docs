---
title: 双实体条件类型
description: 模组注册的全部内置双实体条件类型，以及每种类型接受的 JSON 字段。
---

# 双实体条件类型

**双实体条件**检查两个实体——一个**施动者**（actor）与一个**目标**（target）——之间的关系或比较。这一对实体由声明该条件的那张数据表提供，因此条件本身只描述要检查这两个实体的什么。

双实体条件是 Java（内置）注册表，所以它们的 `type` id 是固定的，数据包无法新增。`type` 选择内置类型，其取值是本页列出的 id 之一，用 `mxt` 命名空间书写。数据包既不会向该注册表添加条目，也不会移除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义条件类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选项；其余列出的字段都必须填写。「字段」列列出的是直接取自该类型 codec 的 JSON 键。

## 通用结构

条件是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:distance",
  "maximum": 8
}
```

因为条件会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `bientity_condition` 这样的字段下：

```json
"bientity_condition": {
  "type": "mxt:actor_condition",
  "condition": {
    "type": "mxt:entity_type",
    "entity_type": "minecraft:player"
  }
}
```

任何需要双实体条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"bientity_condition": [
  { "type": "mxt:can_see" },
  { "type": "mxt:distance", "maximum": 16 }
]
```

::: info 有向与无向用法
大多数双实体条件会区分施动者与目标，因此交换这两个实体会改变结果。`mxt:undirected` 会把嵌套条件按两个方向各跑一次，而 `mxt:both` / `mxt:either` 则是刻意把同一条实体条件应用到两端。嵌套的实体检查使用 [实体条件类型](entity_condition_types.md) 家族。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 以交互方式展示每种类型的字段列表，用来核对字段名很方便，不必翻这里的表。
:::

## 条件类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always_true` | — | 始终通过。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的双实体条件处理器。 |
| `mxt:and` | `conditions` | 只有当所有嵌套双实体条件都通过时才通过。 |
| `mxt:or` | `conditions` | 只要有一个嵌套双实体条件通过就通过。 |
| `mxt:not` | `condition` | 对嵌套双实体条件取反。 |
| `mxt:chance` | `chance` | 按给定概率随机通过，概率取值在 `0` 与 `1` 之间。 |
| `mxt:constant` | `value` | 始终返回给定的布尔值。 |
| `mxt:distance` | `maximum` | 检查施动者与目标之间的距离至多为 `maximum`。 |
| `mxt:team` | `same_team?` | 比较施动者与目标的结盟关系；`same_team` 默认为 `true` 时要求结盟，为 `false` 时要求相反。 |
| `mxt:relation` | `allied?` | 比较施动者与目标的盟友关系；`allied` 默认为 `true` 时要求是盟友，为 `false` 时要求不是盟友。 |
| `mxt:friend` | — | 当施动者把目标当自己人时通过。 |
| `mxt:element_overcomes` | — | 当施动者的灵根元素中至少有一个克制目标灵根的某个元素时通过。它只问这条关系是否存在，不问它值多少——这条克制关系的倍率属于 [伤害结算](../../damage.md)，因此只需要这层配对关系的内容写 `1.0`。 |
| `mxt:can_see` | `shape_type?`、`fluid_handling?` | 检查目标是否在施动者所在维度中 128 格以内，并且两个实体眼睛位置之间的连线没有被方块遮挡。 |
| `mxt:actor_condition` | `condition` | 对施动者测试一条 [实体条件](entity_condition_types.md)。 |
| `mxt:target_condition` | `condition` | 对目标测试一条 [实体条件](entity_condition_types.md)。 |
| `mxt:both` | `condition` | 当该实体条件对施动者**和**目标都通过时通过。 |
| `mxt:either` | `condition` | 当该实体条件对施动者**或**目标通过时通过。 |
| `mxt:riding_recursive` | — | 当目标出现在施动者骑乘链的任意位置，而不只是作为直接载具时通过。 |
| `mxt:same_team` | — | 当施动者在某个计分板队伍中且与目标结盟时通过。 |
| `mxt:relative_rotation` | `axis?`、`actor_rotation?`、`target_rotation?`、`comparison`、`compare_to` | 比较施动者与目标的旋转向量。 |
| `mxt:undirected` | `condition` | 当嵌套双实体条件在任一方向上通过时通过。 |

::: info `mxt:can_see` 取值
`shape_type` 使用原版的视线遮挡形状，默认 `visual`，因此玻璃之类的透明方块不会挡住检查。`fluid_handling` 默认 `none`；其余原版流体模式为 `source_only`、`any` 和 `water`。`mxt:relative_rotation` 用 `axis` 限定坐标轴，它是一个由 `x`、`y` 和 `z` 组成的数组，默认三者全选；并用 `actor_rotation`（默认 `head`）与 `target_rotation`（默认 `body`）决定两端各贡献哪个旋转。
:::

::: info 相似类型
`mxt:team`、`mxt:same_team` 和 `mxt:relation` 回答的几乎是同一个问题，只是规则略有差别：`mxt:same_team` 还要求施动者确实在某个队伍中，而 `mxt:team` 与 `mxt:relation` 只比较结盟结果，并且可以通过各自的字段取反。
:::
