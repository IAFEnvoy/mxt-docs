---
title: item_condition_type（物品条件）
description: 模组注册的所有内置物品条件类型，以及每种类型接受的 JSON 字段。
---

# item_condition_type（物品条件）

**物品条件**检查单个物品堆，返回 `true` 或 `false`。持有者实体与物品堆由声明该条件的那张数据表提供，所以条件只描述"交给它的这堆东西"要满足什么。

物品条件是内置类型，`type` id 固定，数据包不能新增或删除条目。这一页列的就是全部取值，都带 `mxt` 命名空间。要加自定义类型只能写 Java 或走 KubeJS 桥接，见 [KubeJS API](../../../kubejs/api-reference.md)。

条件是一个 JSON 对象，`type` 选择类型，其余键都是该类型自己的字段：

```json
{
  "type": "mxt:item_tag",
  "tag": "minecraft:swords"
}
```

条件在别处是作为值用的，所以通常嵌在 `item_condition` 这类字段下：

```json
"item_condition": {
  "type": "mxt:relative_durability",
  "comparison": "<=",
  "compare_to": 0.25
}
```

凡是要物品条件的地方也收条件数组。数组等于 `mxt:and` 的简写，每一项都通过才通过：

```json
"item_condition": [
  { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  { "type": "mxt:relative_durability", "comparison": ">", "compare_to": 0.5 }
]
```

::: info 在哪里被检查
物品堆一般由声明该条件的那张表提供，例如实体条件 `mxt:equipped_item` 或某个物品行为字段。需要比较数值的类型都用同一组运算符：`==`、`!=`、`<`、`<=`、`>`、`>=`。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能交互式列出每种类型的字段，懒得翻表时可以用它确认字段名。
:::

## 元条件

元条件不检查物品堆本身，它们决定别的条件怎么算。字段就一个 `conditions` 数组或一个 `condition`。

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always` | — | 始终通过。 |
| `mxt:never` | — | 始终失败。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的物品条件处理器。 |
| `mxt:and` | `conditions` | 所有嵌套物品条件都通过时通过。 |
| `mxt:or` | `conditions` | 至少有一个嵌套物品条件通过时通过。 |
| `mxt:not` | `condition` | 对嵌套物品条件取反。 |
| `mxt:chance` | `chance` | 以给定概率随机通过。 |

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | `mxt:js` 的处理器 id，写给 `MxtConditions.item(id, callback)` 的那个 id。 |
| `params` | JSON 对象 | `{}` | 透传给处理器的参数，处理器原样收到。 |
| `conditions` | 物品条件数组 | **必填** | `mxt:and` / `mxt:or` 的嵌套条件。 |
| `condition` | 物品条件 | **必填** | `mxt:not` 的嵌套条件。 |
| `chance` | Double | **必填** | 通过的概率，取值 `0` 到 `1`；超出范围在加载期报错。 |

`mxt:js` 的处理器未注册、或回调抛异常，都算不通过。`mxt:chance` 取 `0` 永远不通过、取 `1` 永远通过。数组简写和 `mxt:and` 是同一件事，嵌套几层都行。

`mxt:always` 与 `mxt:never` 没有字段，`{"type": "mxt:always"}` 就是整个条件。可选条件字段不写时等于 `mxt:always`。

## 条件类型

### `mxt:item_id`

匹配物品堆的物品 id。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `item` | 物品 id | **必填** | 物品注册表 id。 |

```json
{ "type": "mxt:item_id", "item": "minecraft:diamond_sword" }
```

### `mxt:owned_by`

当物品堆的法器归属（`mxt:artifact_state` 的 `owner_uuid`）就是当前持有者时通过。没有归属的物品堆不通过。

没有字段。

```json
{ "type": "mxt:owned_by" }
```

### `mxt:energy_range`

检查物品堆上**某一种灵气**的已存量是否落在 `min` 与 `max` 之间，含两端。一件法器可以存好几种灵气，所以这里点名问哪一种。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id 或 `#标签` | **必填** | 要问的那一种灵气。 |
| `min` | 数值或公式 | **必填** | 下界，含端点。 |
| `max` | 数值或公式 | **必填** | 上界，含端点。 |

```json
{ "type": "mxt:energy_range", "aura": "example:fire_qi", "min": 10, "max": 100 }
```

`min` 与 `max` 在当前的公式上下文里求值。任一边求不出有限数、或 `min > max`，条件都不通过。

### `mxt:item_tag`

用原版或数据包物品标签匹配该物品堆。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | 物品标签 | **必填** | 物品标签引用。 |

```json
{ "type": "mxt:item_tag", "tag": "minecraft:swords" }
```

### `mxt:item_matcher`

用 `items` 里列出的任意一条匹配器条目匹配该物品堆。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 条目或条目数组 | **必填** | 物品 id、物品标签或带类型的匹配器条目，可以混着写。 |

```json
{
  "type": "mxt:item_matcher",
  "items": ["minecraft:apple", "#minecraft:swords", { "type": "mxt:wildcard", "pattern": "*_gem" }]
}
```

`items` 接受单个值或数组，数组中可自由混合物品 id、物品标签和带类型的匹配器条目。带类型的条目有 `mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`（带该组件的功法手册）、无字段的 `mxt:spirit_storage`（匹配所有能存储灵气的物品）以及 `mxt:herb_tag`（带有给定元素或材质标签的灵草）；见 [物品匹配器](/datapack/types/other/item-matcher#item-matcher-entry-type)。一组物品还没有现成标签覆盖时，这是收下它们最紧凑的写法。空列表在加载期被拒。

### `mxt:amount`

比较物品堆的数量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的数量。 |

```json
{ "type": "mxt:amount", "comparison": ">=", "compare_to": 16 }
```

### `mxt:fuel`

比较物品堆的熔炉燃烧时间。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的燃烧时间，单位 tick。 |

```json
{ "type": "mxt:fuel", "comparison": ">=", "compare_to": 200 }
```

不是燃料的物品燃烧时间为 `0`，所以照常答得出 `== 0`。

### `mxt:is_equipable`

检查物品堆是否带有可装备组件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `slot` | 装备槽名 | 不写 | 只检查物品堆的装备槽是否就是这个槽位。 |

```json
{ "type": "mxt:is_equipable", "slot": "head" }
```

不写 `slot` 时只问「能不能装备」；写了就要求装备槽正好等于它，物品堆没有可装备组件时一律不通过。

### `mxt:relative_durability`

比较物品堆的剩余耐久除以其最大耐久。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的比例。 |

```json
{ "type": "mxt:relative_durability", "comparison": "<=", "compare_to": 0.25 }
```

比值介于 `0` 与 `1` 之间。只对可损坏物品通过。

### `mxt:armor_value`

比较物品堆在其可装备槽位中提供的护甲值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的护甲值。 |

```json
{ "type": "mxt:armor_value", "comparison": ">", "compare_to": 3 }
```

护甲值按物品堆自己的属性修饰符在该装备槽上算出来。没有可装备组件的物品堆不通过。

### `mxt:durability`

比较物品堆的剩余耐久。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的剩余耐久。 |

```json
{ "type": "mxt:durability", "comparison": "<=", "compare_to": 100 }
```

只对可损坏物品通过。

与 `mxt:relative_durability` 的分工：这一条比的是原始剩余耐久，同一个值在最大耐久不同的物品上含义不同；那一条比的是 `0` 到 `1` 之间的比例，更适合写成通用规则。

### `mxt:on_cooldown`

当物品堆处于持有者的原版物品冷却中时通过。持有者不是玩家时不通过。

没有字段。

```json
{ "type": "mxt:on_cooldown" }
```

### `mxt:ingredient`

用原版 ingredient 匹配该物品堆。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ingredient` | 原版 Ingredient | **必填** | 物品、标签或它们的列表。 |

```json
{ "type": "mxt:ingredient", "ingredient": { "tag": "minecraft:wool" } }
```

### `mxt:tool_ability`

检查物品堆是否能执行某项 NeoForge 物品能力。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ability` | 物品能力 id | **必填** | 要检查的 NeoForge 物品能力。 |

```json
{ "type": "mxt:tool_ability", "ability": "minecraft:axe_strip" }
```

### `mxt:base_enchantment`

比较存储在物品堆上的某个附魔的等级。读的是物品堆自己带的等级，不受附魔等级相关的技能影响。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enchantment` | 附魔 id | **必填** | 要查的附魔。 |
| `comparison` | String | **必填** | 比较运算符。 |
| `compare_to` | Double | **必填** | 用来比较的等级。 |

```json
{ "type": "mxt:base_enchantment", "enchantment": "minecraft:sharpness", "comparison": ">=", "compare_to": 3 }
```

物品堆没有这个附魔时等级按 `0` 算，所以 `!= 0` 和"有这个附魔"是一回事。

### `mxt:has_component`

检查物品堆是否带有给定的数据组件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `component` | 数据组件 id | **必填** | 要查的组件。 |

```json
{ "type": "mxt:has_component", "component": "minecraft:damage" }
```

### `mxt:component`

用部分 NBT 比较匹配某个数据组件的序列化值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `component` | 数据组件 id | **必填** | 要比较的组件。 |
| `nbt` | NBT 复合标签 | **必填** | 期望值，按部分匹配比较。 |

```json
{ "type": "mxt:component", "component": "minecraft:custom_name", "nbt": { "text": "剑" } }
```

物品堆没有这个组件时不通过。比较是部分的：`nbt` 里写到的键必须对上，没写到的键不管。

### `mxt:spirit_storage_not_full`

匹配可充能物品中已存灵力低于其容量的那些。

没有字段。

```json
{ "type": "mxt:spirit_storage_not_full" }
```

容量按这件物品堆当前解析出的那份定义算。解析不出储灵能力的物品堆不通过。

### `mxt:item_element`

当物品携带所列元素之一时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | 元素 id、`#标签` 或它们的数组 | **必填** | 至少一项。 |

```json
{ "type": "mxt:item_element", "elements": ["example:fire", "#example:hot"] }
```

读的是"物品的元素"：堆上的 `mxt:element` 组件，加上 `weapon_binding` / `item_binding` / `artifact` 声明的 `element`（全部取并集），一个都没声明时才回落到物品携带的灵气的 `aura_type`。元素与元素标签都接受，空列表在加载期被拒。见 [weapon_binding](../../json/weapon_binding.md)。

### `mxt:curse_container`

检查物品堆的 `mxt:curse_container` 组件里封着哪些[诅咒](../../json/curse.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | 诅咒 id、`#标签` 或它们的数组 | 不写就是任意诅咒 | 要问的诅咒条目。 |
| `stacks` | `{min?, max?}` | 不写就是任意层数 | 该条目将会施加的层数的窗口，含两端。 |

```json
{ "type": "mxt:curse_container", "curse": "#example:curses", "stacks": { "min": 2 } }
```

`stacks` 比较的是该条目**将会施加**的层数，它的公式用当前上下文求值；非有限的边界让这一项不通过。物品堆没有这个组件时不通过。

它问的是**物品封着什么**，与实体条件 `mxt:has_curse`（问持有者身上已有）是两件事，所以未装备的护甲照样答得出。

### `mxt:item_quality`

检查物品堆解析出来的[品质](../../json/quality.md)档位。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `quality` | 品质 id、`#标签` 或它们的数组 | **必填** | 至少一项。 |

```json
{ "type": "mxt:item_quality", "quality": ["example:fine", "#example:high_tier"] }
```

走的是与品质闸门、tooltip 相同的解析顺序（组件 → 锻造结果 → 定义默认档 → 灵植声明），因此定义默认档也算数。**这是条件，不是组件**：组件叫 `mxt:quality`（写整份品质对象），两者名字不同。空表在加载期被拒，解析不出任何一档的物品答否，而不是回落到最低档。

### `mxt:item_abilities`

检查物品堆授予的 mxt [技能](../../json/ability.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abilities` | 技能 id、`#标签` 或它们的数组 | **必填** | 至少一项。 |

```json
{ "type": "mxt:item_abilities", "abilities": ["example:sword_focus"] }
```

读的是运行时用的那份并集：定义声明的 `abilities` 加上 `mxt:item_abilities` 组件写下的 id。空表在加载期被拒。
