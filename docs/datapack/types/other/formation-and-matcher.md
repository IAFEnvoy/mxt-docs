---
title: 阵法、时间线与匹配器类型
---

# 阵法、时间线与匹配器类型

## `formation_action_type`

[阵法](../../json/formation.md) 的 `actions` 数组存放这些功能模块。数据包永远不会新增模块；它在模块的 `type` 里写上某个 ID，来选择已有模块。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:none` | 无 | 没有任何模块行为。 |
| `mxt:attack` | `damage?`、`damage_type?`、`attribute_to_owner?`、`effects?` | 攻击半径内的实体。 |
| `mxt:buff` | `abilities?`、`target?`、`aura_zone?`、`max_bonus?` | 授予技能、覆盖本地灵气模板并提升灵气容量。 |
| `mxt:protection` | `block_break?`、`block_place?`、`block_interact?`、`explosions?`、`mob_griefing?`、`entity_interact?`、`attack_entity?`、`item_use?`、`spare_friends?`、`delegate_to_claims?` | 拒绝半径内列出的各类干扰。 |
| `mxt:range_display` | `particle`、`interval_periods?`、`points?`、`shape?` | 用粒子绘制半径轮廓。 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:attack` | `damage` | `NumberProvider` | `0` | 每次施加的伤害 |
| `mxt:attack` | `damage_type` | `Holder<damage_type>` | 无 | 命中使用的伤害类型 |
| `mxt:attack` | `attribute_to_owner` | Boolean | `true` | 是否把阵法主人记为攻击者 |
| `mxt:attack` | `effects` | 效果行为列表 | `[]` | 每次命中施加的状态效果 |
| `mxt:buff` | `abilities` | `Holder<ability>` 列表 | `[]` | 授予匹配实体的技能 |
| `mxt:buff` | `target` | Enum | `all` | 模块作用于哪些实体：`all`、`allies` 或 `owner` |
| `mxt:buff` | `aura_zone` | `AuraZone` | 无 | 在半径内应用的内联灵气模板 |
| `mxt:buff` | `max_bonus` | 灵气到 `NumberProvider` 的 Map | `{}` | 每种灵气的额外灵气容量 |
| `mxt:protection` | `block_break` | Boolean | `true` | 禁止破坏方块 |
| `mxt:protection` | `block_place` | Boolean | `true` | 禁止放置方块 |
| `mxt:protection` | `block_interact` | Boolean | `true` | 禁止与方块交互 |
| `mxt:protection` | `explosions` | Boolean | `true` | 禁止爆炸 |
| `mxt:protection` | `mob_griefing` | Boolean | `true` | 禁止生物破坏 |
| `mxt:protection` | `entity_interact` | Boolean | `true` | 禁止与实体交互 |
| `mxt:protection` | `attack_entity` | Boolean | `true` | 禁止攻击实体 |
| `mxt:protection` | `item_use` | Boolean | `true` | 禁止使用物品 |
| `mxt:protection` | `spare_friends` | Boolean | `true` | 豁免主人的友方 |
| `mxt:protection` | `delegate_to_claims` | Boolean | `false` | 把保护交给领地模组 |
| `mxt:range_display` | `particle` | 粒子选项 | **必填** | 沿轮廓绘制的粒子 |
| `mxt:range_display` | `interval_periods` | Integer `1..1200` | `1` | 两次重绘之间相隔的维护周期数 |
| `mxt:range_display` | `points` | Integer `1..512` | `32` | 轮廓上的点数 |
| `mxt:range_display` | `shape` | Enum | `ring` | 轮廓形状：`ring` 或 `sphere` |

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
  ]
}
```

---

## `timeline_entry_type`

[天劫](../../json/tribulation.md) 的 `timeline` 数组存放这些条目。数据包永远不会新增条目；它在条目的 `type` 里写上某个 ID，来选择已有的一种节拍。内置条目由 `MxtTimelineEntries` 注册。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:action` | `action`（**必填**） | 执行一个实体行为，并在同一 tick 结束。 |
| `mxt:idle` | `duration`（**必填**） | 空等这么多个 tick。 |
| `mxt:wait_for` | `condition`（**必填**）、`timeout?`（ticks）、`on_timeout?`（`fail` 默认 / `finish`） | 每 tick 求值一次；条件成立后结束。写了 `timeout` 就是限期等待，到点按 `on_timeout` 失败或直接过。 |
| `mxt:branch` | `condition`（**必填**）、`if_true?` / `if_false?`（下标） | 按条件把运行游标移到另一拍，并在同一 tick 结束；不写的分支照常前进一拍。 |

`action` 是一个[实体行为](../action/entity_action_types.md)，因此任何行为都可以成为一个节拍。`duration` 是一个 `NumberProvider`，按 `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` 解析。`condition` 是一个[实体条件](../condition/entity_condition_types.md)，它接受列表作为隐式 AND，与其他地方的条件字段完全一样。`if_true` / `if_false` 是**绝对下标**，从运行**复制进来的那条时间线的第一拍**算起（`0` 起），可以回跳；越界会在**启动时**被拒绝，像解不出时长的 `mxt:idle` 一样。

`mxt:wait_for` 的 `timeout` 是**限期**而不是这一拍的时长，所以只按 `timeout` 结算、**不乘 `difficulty_scale`、也不看环境灵气**；不写 `timeout` 时行为不变：条件永不成立就把整次运行停在该条目上。每个条目在运行开始前都会被问一次它究竟能不能运行，这也是时长 / `timeout` 无法解析的节拍与越界的 `mxt:branch` 会直接拒绝启动、而不是进行到一半才失败的原因。

运行游标是**存下来的**（2026-09-25 起，此前是"消费即出队"的队列），因为 `mxt:branch` 要能把它移到任意一拍。

---

## `item_matcher_entry_type`

这些条目构成一个 [ItemMatcher](../shared_data_types.md#itemmatcher)。物品 ID 和物品标签也有省略 `type` 的简写形式。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:item` | `item` | 匹配一个确切的物品 |
| `mxt:tag` | `tag` | 匹配物品标签中的每一个物品 |
| `mxt:wildcard` | `pattern` | 用 `*` 和 `?` 通配符匹配物品 ID |
| `mxt:regex` | `pattern` | 用正则表达式匹配物品 ID |
| `mxt:spirit_storage` | 无 | 匹配每一个存储灵气的物品，也就是每一个实现了 `ItemAuraAccess` 的物品 |
| `mxt:herb_tag` | `element?`、`material?` | 匹配这样一个物品：它是一个灵植，且其 `element_tags` / `material_tags` 与给定的查询相交（`element` 两边都展开成元素集合） |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:item` | `item` | Identifier | **必填** | 物品注册表 ID；简写形式是裸 ID 字符串 |
| `mxt:tag` | `tag` | 物品标签 ID | **必填** | 标签引用；简写形式是带 `#` 前缀的字符串 |
| `mxt:wildcard` | `pattern` | String | **必填** | `*` 匹配任意长度的字符，`?` 匹配单个字符；不能为空 |
| `mxt:regex` | `pattern` | String | **必填** | 对物品 ID 匹配的完整正则表达式；不能为空 |
| `mxt:spirit_storage` | — | — | — | 无字段；`{"type": "mxt:spirit_storage"}` 就是整个条目 |
| `mxt:herb_tag` | `element` | `HolderOrTag<element>` | 无 | 匹配的灵植的元素归属；两边都写元素注册表的引用（条目或 `#` 标签），并**双向**展开成元素集合再取交集，因此标签写在哪一边都不影响结果 |
| `mxt:herb_tag` | `material` | Identifier | 无 | 匹配的灵植必须在 `material_tags` 中列出的材料 ID；`element` 与 `material` 至少要给出一个 |

通配符和正则条目是针对物品 ID 匹配的，例如 `minecraft:apple`，而不是针对显示名。`mxt:spirit_storage` 是唯一按能力而非按 ID 匹配的条目，因此之后新增的、实现了 `ItemAuraAccess` 的物品无需修改声明该匹配器的文件就会被覆盖。

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:regex", "pattern": "othermod:(ruby|jade)_gem"}
]
```

`mxt:herb_tag` 是读取 `mxt:spirit_herb` 数据包注册表、而不只是原版物品注册表的条目：它匹配这样一个物品——它是一个[灵植](../../json/spirit_herb.md)，即某条 `mxt:spirit_herb` 定义自己的匹配器接受该物品堆——然后再问那条定义的归属：`element` 查 `element_tags`、`material` 查 `material_tags`，两者都写就要同时满足，两个都不写会被加载期拒绝。`element` 与 `element_tags` 两边都写元素注册表的引用（条目或 `#` 标签），并**双向**展开成元素集合再取交集——草写的是"火灵草"、问的是"#温热元素"能匹配，反过来也能，所以标签写在哪一边都不影响结果；被停用的元素不参与。`material` 仍是普通标识符。标签是草的属性而不是物品的属性，所以内容可以写"任意火属性灵草"而不必知道之后有哪些物品被绑到那条草上。灵植注册表只在服务器运行时存在，因此在客户端该条目直接报告不匹配。

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
