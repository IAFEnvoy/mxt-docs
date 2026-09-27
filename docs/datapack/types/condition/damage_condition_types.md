---
title: 伤害条件类型
description: 模组注册的所有内置伤害条件类型，以及每种类型接受的 JSON 字段。
---

# 伤害条件类型

**伤害条件**检查一次即将到来的伤害：它的来源，以及它的数值，返回 `true` 或 `false`。来源与数值由声明这条条件的数据表提供，所以条件本身只描述要检查这两样里的什么。

它是 Java（内置）注册表，`type` 只能从下面列出的 id 里挑，写的时候带 `mxt` 命名空间。数据包不会往这张表里加条目，也删不掉条目。想加自定义类型只能写 Java，或者用 KubeJS 桥接，见 [KubeJS API](../../../kubejs/api-reference.md)。

## 通用结构

一条条件就是一个 JSON 对象，`type` 指明内置类型，剩下的键全是这个类型自己的字段：

```json
{
  "type": "mxt:damage_type_tag",
  "tag": "minecraft:is_fire"
}
```

条件通常作为值嵌在其他数据表里，比如嵌在 `damage_condition` 这样的字段下：

```json
"damage_condition": {
  "type": "mxt:amount_range",
  "min": 4,
  "max": 20
}
```

凡是收伤害条件的地方也收数组。数组是 `mxt:and` 的简写，每一项都通过才通过：

```json
"damage_condition": [
  { "type": "mxt:projectile" },
  { "type": "mxt:amount_range", "min": 2, "max": 10 }
]
```

::: info 伤害注册表
`damage_type` 接受已注册伤害类型的 id，例如 `minecraft:fall`；`damage_type_tag` 接受伤害类型标签，例如 `minecraft:is_fire`。两者都读原版的伤害类型注册表，所以数据包新增的伤害类型与标签在这里是可见的。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能交互式地列出一个类型有哪些字段，核对字段名挺方便，不用翻本页的表。
:::

## 元条件

这一组不检查伤害本身，只负责拼装别的伤害条件，或者直接给出一个常量结果。

### `mxt:always`

恒为 `true`，不需要任何字段。

```json
{ "type": "mxt:always" }
```

### `mxt:never`

恒为 `false`，不需要任何字段。

```json
{ "type": "mxt:never" }
```

### `mxt:js`

把判定交给通过 KubeJS 桥接注册的伤害条件处理器。脚本侧回调拿到伤害来源、伤害值、`params` 与求值上下文。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 写给 `MxtConditions.damage(id, callback)` 的那个 id。 |
| `params` | JSON 对象 | `{}` | 原样传给处理器的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:on_fire_hit",
  "params": { "threshold": 4 }
}
```

### `mxt:and`

嵌套条件全部通过才通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | 伤害条件数组 | **必填** | 要逐个检查的嵌套条件。 |

```json
{
  "type": "mxt:and",
  "conditions": [
    { "type": "mxt:fire" },
    { "type": "mxt:amount_range", "min": 1, "max": 100 }
  ]
}
```

### `mxt:or`

嵌套条件里有一个通过就通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | 伤害条件数组 | **必填** | 要逐个检查的嵌套条件。 |

```json
{
  "type": "mxt:or",
  "conditions": [
    { "type": "mxt:fire" },
    { "type": "mxt:magic" }
  ]
}
```

### `mxt:not`

把嵌套条件的结果取反。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 伤害条件 | **必填** | 要被取反的那一条。 |

```json
{
  "type": "mxt:not",
  "condition": { "type": "mxt:projectile" }
}
```

### `mxt:chance`

以给定概率随机通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `chance` | Double | **必填** | 通过概率，取值 `0` 到 `1`，越界在加载期被拒绝。 |

```json
{ "type": "mxt:chance", "chance": 0.25 }
```

伤害来源带有实体时，`mxt:chance` 从这个实体自己的随机流里取值，所以这次判定跟着它走，不会另开一个生成器。来源完全没有实体时，它回退到一个新的、没设种子的随机源，这种情形在客户端与服务端之间不可复现。

## 条件类型

### `mxt:amount_range`

检查伤害数值是否落在 `min` 与 `max` 之间。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `min` | `NumberProvider` | **必填** | 区间下界。 |
| `max` | `NumberProvider` | **必填** | 区间上界。 |

```json
{ "type": "mxt:amount_range", "min": 4, "max": 20 }
```

### `mxt:directness`

检查伤害来源有没有独立于其归属者的直接实体。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `direct` | Boolean | `true` | `true` 要求有直接实体，写 `false` 则要求相反的情况。 |

```json
{ "type": "mxt:directness", "direct": false }
```

### `mxt:damage_type`

匹配一个具体的已注册伤害类型。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `damage_type` | 伤害类型 id | **必填** | 要匹配的那一个伤害类型。 |

```json
{ "type": "mxt:damage_type", "damage_type": "minecraft:fall" }
```

### `mxt:damage_type_tag`

用伤害类型标签匹配该伤害来源。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | 伤害类型标签 | **必填** | 要匹配的标签，不写 `#`。 |

```json
{ "type": "mxt:damage_type_tag", "tag": "minecraft:is_fire" }
```

### `mxt:fire`

匹配属于原版火焰伤害标签的伤害，不需要任何字段。

```json
{ "type": "mxt:fire" }
```

它等价于使用原版火焰伤害标签的 `mxt:damage_type_tag`。要指向另一个标签而不想新写一个类型，就用标签形式。

### `mxt:magic`

匹配被归类为魔法的原版伤害来源，不需要任何字段。

```json
{ "type": "mxt:magic" }
```

### `mxt:projectile`

匹配弹射物伤害，可选地只认某一种弹射物实体类型，并用实体条件过滤那个弹射物。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `projectile` | 实体类型 id | 不限定 | 只匹配这一种弹射物。 |
| `projectile_condition` | 实体条件 | `mxt:always` | 用[实体条件](entity_condition_types.md)过滤造成伤害的那个弹射物。 |

```json
{
  "type": "mxt:projectile",
  "projectile": "minecraft:arrow",
  "projectile_condition": { "type": "mxt:glowing" }
}
```

### `mxt:element`

按这一击的**元素**匹配。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | 元素 id、`#标签` 或它们的数组 | **必填** | 这一击的元素里出现列出的一个就通过；至少写一项。 |

```json
{ "type": "mxt:element", "elements": ["#example:fire", "example:metal"] }
```

这一击的元素就是伤害管线读的那一份：伤害类型的认领者，没人认领时才回落到攻击者灵根。所以条件说的元素与目标实际吃到的倍率永远一致，元素一旦认领 `minecraft:lava`，岩浆伤害也会命中这条条件。`elements` 至少写一项：写空数组会在加载期被拒绝，不会变成一条恒不成立的条件。
