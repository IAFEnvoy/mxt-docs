---
title: bientity_condition_type（双实体条件）
description: 模组注册的全部内置双实体条件类型，以及每种类型接受的 JSON 字段。
---

# bientity_condition_type（双实体条件）

**双实体条件**检查两个实体之间的关系：一个**施动者**（actor）、一个**目标**（target）。这一对实体由写条件的那个字段提供，条件自己不能挑实体，只描述要检查这两个实体的什么。多数类型区分两端，交换施动者与目标会改变结果。

双实体条件是 Java（内置）注册表，`type` id 固定，数据包不能新增条目、也不能移除条目。`type` 选择一个内置类型，取值是本页列出的 id 之一，用 `mxt` 命名空间书写。只有 Java 代码或 KubeJS 桥接能引入自定义条件类型，见 [KubeJS API](../../../kubejs/api-reference.md)。字段名后带 `?` 的可以省略，其余字段必须写。

## 通用结构

`type` 与其余所有键都写在同一层：

```json
{
  "type": "mxt:distance",
  "maximum": 8
}
```

条件会作为值嵌在别的定义里，通常就落在 `bientity_condition` 这样的字段下：

```json
"bientity_condition": {
  "type": "mxt:actor_condition",
  "condition": {
    "type": "mxt:entity_type",
    "entity_type": "minecraft:player"
  }
}
```

任何要双实体条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"bientity_condition": [
  { "type": "mxt:can_see" },
  { "type": "mxt:distance", "maximum": 16 }
]
```

数组简写只在条件本身的位置生效：`mxt:and` 与 `mxt:or` 的 `conditions` 里每一项仍要写一个条件对象，不能再套数组。

`mxt:always`、`mxt:never`、`mxt:js`、`mxt:and`、`mxt:or`、`mxt:not`、`mxt:chance` 这七个不检查实体本身，只回答恒真、恒假、调用脚本或组合别的条件；其余类型都要看传进来的施动者与目标。

::: info 有向与无向用法
大多数双实体条件会区分施动者与目标，交换这两个实体会改变结果。`mxt:undirected` 会把嵌套条件按两个方向各跑一次、任一方向成立就算通过，`mxt:mutual` 是它的对偶——两个方向**都**成立才通过（"两人互相为友"就写它），而 `mxt:both` / `mxt:either` 是刻意把同一条实体条件应用到两端。嵌套的实体检查用[实体条件类型](entity_condition_types.md)。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 以交互方式展示每种类型的字段列表，用来核对字段名很方便，不必翻这里的表。
:::

## 条件类型

### `mxt:always`

始终通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:always"}
```

### `mxt:never`

始终失败。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:never"}
```

### `mxt:js`

调用通过 KubeJS 桥接注册的双实体条件处理器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | `MxtConditions.biEntity(...)` 注册的回调 id。 |
| `params?` | 对象 | `{}` | 原样交给回调的参数。 |

```json
{"type": "mxt:js", "id": "my_check", "params": {"radius": 4}}
```

`id` 没有注册、或回调抛异常时判定为 `false`。

### `mxt:and`

只有当所有嵌套条件都通过时才通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | [双实体条件](bientity_condition_types.md)数组 | **必填** | 每一项都要通过。 |

```json
{"type": "mxt:and", "conditions": [{"type": "mxt:can_see"}, {"type": "mxt:friend"}]}
```

### `mxt:or`

只要有一个嵌套条件通过就通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | [双实体条件](bientity_condition_types.md)数组 | **必填** | 任一项通过即可。 |

```json
{"type": "mxt:or", "conditions": [{"type": "mxt:same_team"}, {"type": "mxt:friend"}]}
```

### `mxt:not`

对嵌套条件取反。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [双实体条件](bientity_condition_types.md) | **必填** | 要取反的条件。 |

```json
{"type": "mxt:not", "condition": {"type": "mxt:friend"}}
```

### `mxt:chance`

按给定概率随机通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `chance` | Double | **必填** | 通过概率，取值在 `0` 与 `1` 之间。 |

```json
{"type": "mxt:chance", "chance": 0.25}
```

`chance` 超出 `0` 到 `1` 会在加载期被拒绝。

### `mxt:distance`

检查施动者与目标之间的距离至多为 `maximum`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `maximum` | [数值提供器](../number_provider_types.md) | **必填** | 距离上限。 |

```json
{"type": "mxt:distance", "maximum": 8}
```

比的是两个实体中心之间的直线距离。`maximum` 求值出非有限数或负数时条件不通过。

### `mxt:team`

比较施动者与目标的结盟关系。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `same_team?` | Boolean | `true` | `true` 要求结盟，`false` 要求相反。 |

```json
{"type": "mxt:team", "same_team": false}
```

不要求施动者自己在某个队伍里。

### `mxt:relation`

比较施动者与目标的盟友关系。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `allied?` | Boolean | `true` | `true` 要求是盟友，`false` 要求不是。 |

```json
{"type": "mxt:relation", "allied": false}
```

### `mxt:friend`

当施动者把目标当自己人时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:friend"}
```

### `mxt:element_overcomes`

当施动者的灵根元素中至少有一个克制目标灵根的某个元素时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:element_overcomes"}
```

它只问这条克制关系是否存在，不问它值多少——这条克制关系的倍率属于[伤害系统](/technical/damage)，因此只需要这层配对关系的内容写 `1.0`。

### `mxt:element_adapted_to`

当施动者适应（`adapted_to`）目标携带的某个元素时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:element_adapted_to"}
```

它是 `mxt:element_overcomes` 的防御镜像，回答的是"我抗不抗你"；同样只问关系是否存在，倍率仍属于[伤害系统](/technical/damage)。

### `mxt:can_see`

检查目标是否在施动者所在维度中 128 格以内，并且两个实体眼睛位置之间的连线没有被方块遮挡。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `shape_type?` | 原版遮挡形状 | `visual` | 用哪种形状判断方块是否挡视线。 |
| `fluid_handling?` | 原版流体模式 | `none` | 用哪种模式判断流体是否挡视线。 |

```json
{"type": "mxt:can_see"}
```

两个实体不在同一维度时不通过；距离超过 128 格时不做射线检测，直接不通过。

::: info `mxt:can_see` 取值
`shape_type` 使用原版的视线遮挡形状，默认 `visual`，因此玻璃之类的透明方块不会挡住检查。`fluid_handling` 默认 `none`；其余原版流体模式为 `source_only`、`any` 和 `water`。
:::

### `mxt:actor_condition`

对施动者测试一条[实体条件](entity_condition_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [实体条件](entity_condition_types.md) | **必填** | 对施动者测的条件。 |

```json
{"type": "mxt:actor_condition", "condition": {"type": "mxt:entity_type", "entity_type": "minecraft:player"}}
```

### `mxt:target_condition`

对目标测试一条[实体条件](entity_condition_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [实体条件](entity_condition_types.md) | **必填** | 对目标测的条件。 |

```json
{"type": "mxt:target_condition", "condition": {"type": "mxt:sneaking"}}
```

### `mxt:both`

当该[实体条件](entity_condition_types.md)对施动者**和**目标都通过时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [实体条件](entity_condition_types.md) | **必填** | 两端都要满足的条件。 |

```json
{"type": "mxt:both", "condition": {"type": "mxt:entity_type", "entity_type": "minecraft:player"}}
```

### `mxt:either`

当该[实体条件](entity_condition_types.md)对施动者**或**目标通过时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [实体条件](entity_condition_types.md) | **必填** | 任一端满足即可的条件。 |

```json
{"type": "mxt:either", "condition": {"type": "mxt:glowing"}}
```

### `mxt:riding_recursive`

当目标出现在施动者骑乘链的任意位置时通过，直接载具也算。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:riding_recursive"}
```

### `mxt:same_team`

当施动者在某个计分板队伍中且与目标结盟时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:same_team"}
```

::: info 相似类型
`mxt:team`、`mxt:same_team` 和 `mxt:relation` 回答的几乎是同一个问题，只是规则略有差别：`mxt:same_team` 还要求施动者确实在某个队伍中，而 `mxt:team` 与 `mxt:relation` 只比较结盟结果，并且可以通过各自的字段取反。
:::

### `mxt:relative_rotation`

比较施动者与目标的旋转向量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `axis?` | `x` / `y` / `z` 的数组 | 三者全选 | 参与比较的坐标轴。 |
| `actor_rotation?` | `head` / `body` | `head` | 施动者贡献哪个旋转。 |
| `target_rotation?` | `head` / `body` | `body` | 目标贡献哪个旋转。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 夹角余弦的基准值。 |

```json
{"type": "mxt:relative_rotation", "actor_rotation": "head", "target_rotation": "body", "comparison": ">=", "compare_to": -0.8}
```

`axis` 里没选的轴在比较前归零。`head` 取视线方向，`body` 取身体朝向，非活体没有身体朝向时按视线方向算。比较的是两个方向向量的点积除以长度乘积，也就是夹角余弦，上面的例子问的是两个实体是否基本面对面。任一端向量为零时不通过。

### `mxt:undirected`

当嵌套双实体条件在任一方向上通过时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [双实体条件](bientity_condition_types.md) | **必填** | 两个方向各测一遍的条件。 |

```json
{"type": "mxt:undirected", "condition": {"type": "mxt:can_see"}}
```

### `mxt:mutual`

当嵌套双实体条件在**两个方向上都**通过时通过。`mxt:undirected` 的对偶：那个是"任一方向"，这个是"两个方向"。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [双实体条件](bientity_condition_types.md) | **必填** | 两个方向都要成立的条件。 |

```json
{"type": "mxt:mutual", "condition": {"type": "mxt:friend"}}
```

上面的例子问的是"两个人**互相**把对方当好友"：`mxt:friend` 是有向的（问的是施动者自己的好友表），只写 `{"type": "mxt:friend"}` 是"施动者把目标当好友"，两个方向都写才是互相。

