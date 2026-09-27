---
title: 方块条件类型
description: 模组注册的所有内置方块条件类型，以及每种类型接受的 JSON 字段。
---

# 方块条件类型

**方块条件**检查世界里的一个方块位置，返回 `true` 或 `false`。要检查哪一级、哪个位置，由声明这条条件的数据表决定，所以条件本身只管写"这个位置上的方块要满足什么"。

它是 Java（内置）注册表，`type` 只能从下面列出的 id 里挑，写的时候带 `mxt` 命名空间。数据包不会往这张表里加条目，也删不掉条目。想加自定义类型只能写 Java，或者用 KubeJS 桥接，见 [KubeJS API](../../../kubejs/api-reference.md)。

## 通用结构

一条条件就是一个 JSON 对象，`type` 指明内置类型，剩下的键全是这个类型自己的字段。

```json
{
  "type": "mxt:block_tag",
  "tag": "minecraft:logs"
}
```

条件通常作为值嵌在其他数据表里，比如嵌在 `block_condition` 这样的字段下：

```json
"block_condition": {
  "type": "mxt:hardness",
  "comparison": ">=",
  "compare_to": 3.0
}
```

凡是收方块条件的地方也收数组。数组是 `mxt:and` 的简写，每一项都通过才通过：

```json
"block_condition": [
  { "type": "mxt:movement_blocking" },
  { "type": "mxt:height", "comparison": "<", "compare_to": 64 }
]
```

数组里解不出来的那一项会被丢掉，只在日志里留一条 `Ignoring invalid list element`，其余项照常求值。空数组同样合法，`mxt:and` 配空数组恒为 `true`。

::: info 比较字段
有一批类型拿一个数值和某个数比。`comparison`（运算符）和 `compare_to`（被比的数）始终是两个独立的键，直接写在条件对象上，跟上面的例子一样。运算符只有 `==`、`!=`、`<`、`<=`、`>`、`>=`，`compare_to` 始终是普通数字。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能交互式地列出一个类型有哪些字段，核对字段名挺方便，不用翻本页的表。
:::

## 元条件

这一组不检查方块，只负责拼装别的方块条件，或者直接给出一个常量结果。

### mxt:always

恒为 `true`，不需要任何字段。

```json
{ "type": "mxt:always" }
```

### mxt:never

恒为 `false`，不需要任何字段。

```json
{ "type": "mxt:never" }
```

### mxt:js

把判定交给通过 KubeJS 桥接注册的方块条件处理器。脚本侧注册时拿到 `Level`、`BlockPos`、`params` 和求值上下文。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 注册处理器时用的 id。 |
| `params` | JSON 对象 | 空对象 | 原样传给处理器的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:my_check",
  "params": { "limit": 3 }
}
```

### mxt:and

嵌套条件全部通过才通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | 方块条件数组 | **必填** | 要逐个检查的嵌套条件。 |

```json
{
  "type": "mxt:and",
  "conditions": [
    { "type": "mxt:block_tag", "tag": "minecraft:logs" },
    { "type": "mxt:height", "comparison": ">", "compare_to": 60 }
  ]
}
```

### mxt:or

嵌套条件里有一个通过就通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `conditions` | 方块条件数组 | **必填** | 要逐个检查的嵌套条件。 |

```json
{
  "type": "mxt:or",
  "conditions": [
    { "type": "mxt:block_id", "block": "minecraft:water" },
    { "type": "mxt:block_id", "block": "minecraft:lava" }
  ]
}
```

空数组恒为 `false`。

### mxt:not

把嵌套条件的结果取反。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 方块条件 | **必填** | 被取反的嵌套条件。 |

```json
{
  "type": "mxt:not",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" }
}
```

### mxt:chance

按概率随机通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `chance` | 数字 | **必填** | 通过的概率，取值 `0` 到 `1`。 |

```json
{ "type": "mxt:chance", "chance": 0.25 }
```

写超出 `0..1` 的值会在加载期被拒收。判定是"随机数小于 `chance`"，所以写 `1` 也不是必过，写 `0` 才是必不过。

## 方块条件

这一组真正去看那个位置上的方块或环境。

### mxt:block_id

匹配该位置上的方块。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `block` | 方块 id | **必填** | 要比对的方块。 |

```json
{ "type": "mxt:block_id", "block": "minecraft:stone" }
```

这里只认一个具体方块 id，写 `#` 标签不会生效，要按标签匹配用 `mxt:block_tag`。

### mxt:block_tag

用方块标签匹配该位置的方块。原版标签和数据包加的标签都能用。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | 方块标签 | **必填** | 要比对的标签 id。 |

```json
{ "type": "mxt:block_tag", "tag": "minecraft:logs" }
```

### mxt:biome_tag

用群系标签匹配该位置所在的群系。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | 群系标签 | **必填** | 要比对的标签 id。 |

```json
{ "type": "mxt:biome_tag", "tag": "minecraft:is_forest" }
```

### mxt:aura_range

用每种灵气各自的要求检验该位置的灵气浓度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id 到要求对象的映射 | **必填** | 键是 [aura](../../json/aura.md) 的 id，值是 `{ "min"?, "max" }`。 |

```json
{
  "type": "mxt:aura_range",
  "aura": {
    "example:azure_aura": { "min": 20, "max": 200 }
  }
}
```

要求对象里 `max` 必填、`min` 可选（默认 `0`），两者都接受 [数值提供器](../number_provider_types.md)。列出的每一种灵气浓度都落在自己的区间内，条件才通过。浓度由服务端在求值位置解析。

映射里写不出键或值的条目会被丢掉并记一条日志，不是报错。

### mxt:offset

在相对偏移处检验一条嵌套条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 方块条件 | **必填** | 在偏移位置上检验的条件。 |
| `x` | 整数 | `0` | X 方向偏移。 |
| `y` | 整数 | `0` | Y 方向偏移。 |
| `z` | 整数 | `0` | Z 方向偏移。 |

```json
{
  "type": "mxt:offset",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "y": -1
}
```

### mxt:hardness

比较该方块的硬度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的硬度。 |

```json
{ "type": "mxt:hardness", "comparison": ">=", "compare_to": 3.0 }
```

### mxt:height

比较该位置的 Y 坐标。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的 Y 坐标。 |

```json
{ "type": "mxt:height", "comparison": "<", "compare_to": 64 }
```

### mxt:light_level

比较该位置的光照等级。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `light_type` | 字符串 | 无 | 只比某一层光照时写原版光照层名，例如 `block` 或 `sky`。 |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的光照等级。 |

```json
{ "type": "mxt:light_level", "light_type": "block", "comparison": "<=", "compare_to": 7 }
```

不写 `light_type` 时比的是该位置的最大原始亮度。写了一个不认识的光照层名会在加载期被拒收。

### mxt:slipperiness

比较该方块的滑度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的滑度。 |

```json
{ "type": "mxt:slipperiness", "comparison": ">", "compare_to": 0.6 }
```

### mxt:blast_resistance

比较该方块的爆炸抗性。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的爆炸抗性。 |

```json
{ "type": "mxt:blast_resistance", "comparison": ">=", "compare_to": 10.0 }
```

读的是方块的基础抗性值，不带任何爆炸上下文。

### mxt:movement_blocking

当该方块阻挡运动、并且碰撞形状非空时通过。不接受任何字段。

```json
{ "type": "mxt:movement_blocking" }
```

两个条件同时成立才算：光是"有碰撞形状"不够，蜘蛛网和竹苗都有碰撞形状却不会挡住运动。

### mxt:adjacent

统计符合嵌套条件的相邻方块数量，再和这个数量比。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `adjacent_condition` | 方块条件 | **必填** | 用来筛相邻方块的嵌套条件。 |
| `comparison` | 运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | 数字 | **必填** | 被比较的相邻方块数量。 |

```json
{
  "type": "mxt:adjacent",
  "adjacent_condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "comparison": ">=",
  "compare_to": 3
}
```

六个方向各算一次，命中一个加一，所以数量最大是 `6`。只有已加载区块里的位置才参与统计，没加载的那一侧不计入，也不会因此报错。
