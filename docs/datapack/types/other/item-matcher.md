---
title: 物品匹配器类型
description: item_matcher_entry_type 的七个条目，各自的字段与匹配规则。
---

# 物品匹配器类型

`item_matcher_entry_type` 是 [`ItemMatcher`](../shared_data_types.md#itemmatcher) 里每一项的类型族：一个 `ItemMatcher` 就是一个或多个这样的条目，每一项在 `type` 里写上下面某个 ID 来选择一种匹配方式；没有 `type` 的字符串按裸物品 ID 或 `#物品标签` 处理。

`mxt:item` 和 `mxt:tag` 是简写形式的展开，`mxt:technique` 与 `mxt:spirit_storage` 没有任何字段。数组里的条目可以是纯字符串、带 `type` 的对象，或两者混在一起。

## `item_matcher_entry_type`

| `type` | 字段 |
| --- | --- |
| `mxt:item` | `item` |
| `mxt:tag` | `tag` |
| `mxt:wildcard` | `pattern` |
| `mxt:regex` | `pattern` |
| `mxt:technique` | 无 |
| `mxt:spirit_storage` | 无 |
| `mxt:herb_tag` | `element`、`material` |

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:regex", "pattern": "othermod:(ruby|jade)_gem"}
]
```

### `mxt:item`

匹配一个确切的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `item` | Identifier | **必填** | 物品注册表 ID；简写形式是裸 ID 字符串 |

```json
{"type": "mxt:item", "item": "minecraft:apple"}
```

### `mxt:tag`

匹配物品标签中的每一个物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | 物品标签 ID | **必填** | 标签引用，这里写不带 `#` 的标签 ID；简写形式是带 `#` 前缀的字符串 |

```json
{"type": "mxt:tag", "tag": "minecraft:logs"}
```

### `mxt:wildcard`

用 `*` 和 `?` 通配符匹配物品 ID。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pattern` | String | **必填** | `*` 匹配任意长度的字符，`?` 匹配单个字符；不能为空 |

```json
{"type": "mxt:wildcard", "pattern": "mxt:*_spirit_stone"}
```

### `mxt:regex`

用正则表达式匹配物品 ID。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pattern` | String | **必填** | 对物品 ID 匹配的完整正则表达式；不能为空 |

```json
{"type": "mxt:regex", "pattern": "mxt:(medium|high)_spirit_stone"}
```

### `mxt:technique`

匹配堆上带 `mxt:technique` 组件的物品，也就是「一叠功法手册」。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段 |

```json
{"type": "mxt:technique"}
```

认的是这一堆教的哪一门功法，而不是物品 ID。它只问组件：被某条 `technique_binding` 的 `items` 认领、却不带 `mxt:technique` 组件的物品不算命中。

### `mxt:spirit_storage`

匹配每一个存储灵气的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段 |

```json
{"type": "mxt:spirit_storage"}
```

它是唯一按能力而非按 ID 匹配的条目，因此之后新增的、能存储灵气的物品无需修改声明该匹配器的文件就会被覆盖。

### `mxt:herb_tag`

匹配这样一个物品：它是一个[灵植](../../json/spirit_herb.md)，且其 `element_tags` / `material_tags` 与给定的查询相交。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `element` | 元素 id 或 `#标签` | 无 | 匹配的灵植的元素归属 |
| `material` | Identifier | 无 | 匹配的灵植必须在 `material_tags` 中列出的材料 ID；`element` 与 `material` 至少要给出一个 |

```json
{"type": "mxt:herb_tag", "element": "example:fire"}
```

```json
{"type": "mxt:herb_tag", "element": "#example:fire_like", "material": "example:herb"}
```

`mxt:herb_tag` 是读取 `mxt:spirit_herb` 数据包注册表、而不只是原版物品注册表的条目：它匹配这样一个物品——它是一条[灵植](../../json/spirit_herb.md)，即某条 `mxt:spirit_herb` 定义自己的匹配器接受该物品堆——然后再问那条定义的归属：`element` 查 `element_tags`、`material` 查 `material_tags`，两者都写就要同时满足，两个都不写会被加载期拒绝。

`element` 与 `element_tags` 两边都写元素注册表的引用（条目或 `#` 标签），并**双向**展开成元素集合再取交集——草写的是「火灵草」、问的是「#温热元素」能匹配，反过来也能，所以标签写在哪一边都不影响结果。`material` 仍是普通标识符。标签是草的属性而不是物品的属性，所以内容可以写「任意火属性灵草」而不必知道之后有哪些物品被绑到那条草上。灵植注册表只在服务器运行时存在，因此在客户端该条目直接报告不匹配。

实体条件里可以套在 `mxt:item_matcher` 中使用（它的 `items` 就是一个 `ItemMatcher`），例如用 `mxt:has_equipped_item` 判断「手上拿着火属性灵草」：

```json
{
  "type": "mxt:has_equipped_item",
  "item_condition": {
    "type": "mxt:item_matcher",
    "items": [
      {"type": "mxt:item", "item": "minecraft:blaze_powder"},
      {"type": "mxt:herb_tag", "element": "example:fire"},
      {"type": "mxt:herb_tag", "material": "example:herb"}
    ]
  }
}
```

## 简写

裸字符串和 `#标签` 字符串分别是 `mxt:item` 与 `mxt:tag` 的简写，三种写法可以混在一个数组里：

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

`mxt:item` 对应 `{"type": "mxt:item", "item": ...}`，`mxt:tag` 对应 `{"type": "mxt:tag", "tag": ...}`。数组里每一项保留为条目或标签，重复值不会自动改变语义。

## 匹配顺序

匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，按各自声明的 `priority` **从高到低**选择（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。

通配符和正则条目是针对物品 ID 匹配的，例如 `minecraft:apple`，而不是针对显示名。
