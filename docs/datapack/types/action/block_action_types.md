---
title: block_action_type（方块行为）
description: 模组注册的全部内置方块行为类型，以及每种类型接受的 JSON 字段。
---

# block_action_type（方块行为）

**方块行为**作用于世界里的一个方块位置。世界与坐标由写这个行为的那张数据表给出，有的调用方还会给出朝向，行为本身只描述在这个位置上做什么。

方块行为是 Java（内置）注册表，`type` id 固定，数据包既加不了条目也删不掉条目。`type` 就写在行为对象里，和参数平级，只能从本页列出的、带 `mxt` 命名空间的 id 里挑。要加自定义类型只能写 Java，或者用 KubeJS 桥接，见 [KubeJS API](../../../kubejs/api-reference.md)。

## 通用结构

一个行为就是一个 JSON 对象，`type` 指明内置类型，剩下的键全是这个类型自己的字段。

```json
{
  "type": "mxt:set_block",
  "block": "minecraft:stone"
}
```

行为是别的数据表里的值，所以通常嵌在 `block_action` 这类字段下面：

```json
"block_action": {
  "type": "mxt:break_block",
  "drop": false
}
```

凡是收方块行为的地方也收数组。数组是 `mxt:sequence` 的简写，按写的顺序挨个执行：

```json
"block_action": [
  { "type": "mxt:break_block" },
  { "type": "mxt:set_block", "block": "minecraft:air" }
]
```

::: info 与其他家族混用
有若干表类型同时声明方块字段和其他行为字段；[实体行为](entity_action_types.md)可以用 `mxt:block_action` 包一个方块行为。方块条件属于另一个家族，见[方块条件类型](../condition/block_condition_types.md)。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能交互式地列出一个类型有哪些字段，核对字段名挺方便，不用翻本页的表。
:::

## 元行为类型

元行为不直接改方块，它们决定别的方块行为跑不跑、跑哪一个、在哪个位置上跑。

### mxt:no_op

什么都不做，没有字段。可选行为字段的默认值就是它。

```json
{ "type": "mxt:no_op" }
```

### mxt:js

调用通过 KubeJS 桥接注册的方块行为处理器。脚本侧的回调拿到 `Level`、`BlockPos`、`params` 和求值上下文。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 用 `MxtActions.block(...)` 注册回调时写的 id。 |
| `params` | JSON 对象 | 空对象 | 原样传给回调的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:my_block_action",
  "params": { "radius": 3 }
}
```

### mxt:sequence

按顺序执行一组方块行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 方块行为数组 | **必填** | 挨个执行的行为。 |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:light_up" },
    { "type": "mxt:schedule_tick", "delay": 10 }
  ]
}
```

### mxt:chance

以 `chance` 的概率执行 `action`，没命中就执行 `fail_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 方块行为 | **必填** | 命中时执行的行为。 |
| `chance` | 数字 | **必填** | 命中概率，取值 `0` 到 `1`。 |
| `fail_action` | 方块行为 | `mxt:no_op` | 没命中时执行的行为。 |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:bonemeal" },
  "fail_action": { "type": "mxt:break_block" }
}
```

写超出 `0..1` 的概率在加载期就被拒收。判定是"随机数小于 `chance`"，所以写 `1` 必命中，写 `0` 永远不命中。

### mxt:if_else

方块条件成立就跑 `if_action`，否则跑 `else_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 方块条件 | **必填** | 用来判定的方块条件。 |
| `if_action` | 方块行为 | **必填** | 条件成立时执行的行为。 |
| `else_action` | 方块行为 | `mxt:no_op` | 条件不成立时执行的行为。 |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "if_action": { "type": "mxt:break_block" },
  "else_action": { "type": "mxt:light_up" }
}
```

### mxt:choice

从带权重的列表里抽一项执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 加权条目数组 | **必填** | 抽中哪条就跑哪条。 |

每个条目是：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 方块行为 | **必填** | 该条目被选中时执行的行为。 |
| `weight` | 整数 | `1` | 相对权重；越大越容易被选中，`≤0` 的条目永远不会被选中（整表全为 `0` 时等概率抽一项）。 |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "value": { "type": "mxt:light_up" }, "weight": 3 },
    { "value": { "type": "mxt:break_block" }, "weight": 1 }
  ]
}
```

### mxt:offset

在相对的方块偏移处跑一个嵌套行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 方块行为 | **必填** | 挪到偏移位置上跑的行为。 |
| `x` | 整数 | `0` | X 方向偏移。 |
| `y` | 整数 | `0` | Y 方向偏移。 |
| `z` | 整数 | `0` | Z 方向偏移。 |

```json
{
  "type": "mxt:offset",
  "y": -1,
  "action": { "type": "mxt:break_block" }
}
```

## 行为类型

### mxt:set_block

把该位置上的方块设成该方块的默认状态。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `block` | 方块 id | **必填** | 要放下去的方块，用它的默认状态。 |

```json
{ "type": "mxt:set_block", "block": "minecraft:oak_log" }
```

只在服务端、且该位置已加载时生效。

### mxt:break_block

破坏该位置上的方块。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `drop` | 布尔 | `true` | 是否掉落它的战利品。 |

```json
{ "type": "mxt:break_block", "drop": false }
```

### mxt:change_aura

改变该位置所属区块的灵气存量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id 到数值提供器的映射 | **必填** | 键是 [aura](../../json/aura.md) 的 id，值是[数值提供器](../number_provider_types.md)：这次要给这门灵气加多少。 |

```json
{
  "type": "mxt:change_aura",
  "aura": {
    "example:azure_aura": -20,
    "example:crimson_aura": "5 + level"
  }
}
```

::: info `mxt:change_aura`
键只认具体灵气 id，写 `#标签` 不行。一次能同时改若干条灵气池；只在服务端施加，客户端上什么都不会改变。任意一项求值不是有限数时，这次改变整个不施加。
:::

### mxt:schedule_tick

为当前方块安排在给定延迟之后的一次 tick。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `delay` | 整数 | **必填** | 延迟多少个 tick。 |

```json
{ "type": "mxt:schedule_tick", "delay": 20 }
```

只在服务端、且该位置已加载时安排。

### mxt:bonemeal

对该方块施加骨粉。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | 布尔 | `true` | 是否显示原版生长粒子与音效。 |

```json
{ "type": "mxt:bonemeal", "effect": false }
```

### mxt:light_up

没有字段。方块拥有原版 `lit` 属性时把它设为 `true`；没有这个属性就什么都不做。

```json
{ "type": "mxt:light_up" }
```

### mxt:explode

在该位置制造一次爆炸。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `power` | 数字 | **必填** | 爆炸威力。 |
| `interaction` | 原版爆炸交互类型 | `mob` | 例如 `mob` 或 `none`。 |
| `indestructible` | 方块条件 | 无 | 匹配上的方块在爆炸里被保护。 |
| `create_fire` | 布尔 | `false` | 爆炸是否留下火。 |

```json
{
  "type": "mxt:explode",
  "power": 3.0,
  "interaction": "none",
  "indestructible": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "create_fire": false
}
```

`power` 不是有限数或者是负数时，什么都不发生。

### mxt:spawn_entity

在该方块位置生成一个实体，并对它跑一个可选的实体行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity_type` | 实体类型 id | **必填** | 生成什么实体。 |
| `tag` | NBT 复合标签 | 无 | 写进新实体的 NBT。 |
| `entity_action` | 实体行为 | `mxt:no_op` | 在生成出来的实体上运行。 |

```json
{
  "type": "mxt:spawn_entity",
  "entity_type": "minecraft:zombie",
  "entity_action": { "type": "mxt:set_on_fire", "ticks": 100 }
}
```

只在服务端、且该位置已加载时生成。生成点在方块中心，不是方块角。

::: info 嵌套值
收别的家族的只有三处：`mxt:if_else` 的 `condition` 和 `mxt:explode` 的 `indestructible` 收[方块条件](../condition/block_condition_types.md)，`mxt:spawn_entity` 的 `entity_action` 收[实体行为](entity_action_types.md)。
:::
