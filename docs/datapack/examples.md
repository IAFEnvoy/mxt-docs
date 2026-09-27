---
title: 数据包示例
description: 可以整段照抄的数据包文件：停用定义、资源与灵气、修炼行为、物品绑定、体质。
---

# 数据包示例

下面每个代码块上方都写了它自己的完整路径，照抄时连目录一起抄。

## 目录

```text
data/example/mxt/resource/spirit_power.json
data/example/mxt/element/common.json
data/example/mxt/realm_stage/qi_condensation.json
data/example/mxt/aura/qi.json
```

`resource/spirit_power.json` 就是下面 `item_aura` 示例里 `type` 指向的那个数值定义。元素定义与境界阶段（`element/common.json`、`realm_stage/qi_condensation.json`）属于另外两页的内容，写法与下面这些同源。

## 停用一条定义

写在**这条定义自己的文件**里：`neoforge:conditions` 不成立时，条目根本不进注册表。

```json
// data/example/mxt/resource/old_resource.json
{
  "neoforge:conditions": [
    { "type": "neoforge:mod_loaded", "modid": "example_addon" }
  ],
  "default_value": 0.0
}
```

条件成立时 `neoforge:conditions` 会在交给定义解码之前被剥掉，其余字段照常读。可用条件与「没有中间状态」的代价见[数据包开发总览](./overview.md#停用一条定义)。

不要自定义 `tags` 键来代替原版标签；标签文件位于 `data/<namespace>/tags/...`，而**标签不能用来停用条目**（注册表解码时标签还没绑定）。

## 灵气、元素与通用绑定示例

这些示例把常见系统串成一个最小闭环：资源、境界、灵气环境、修炼行为和物品燃料都来自数据包；能拿在手里的物品仍然由 KubeJS 或其他模组注册，数据包只负责认领它们。

资源定义。`max` 是表达式，`bars` 里的一条给这个资源加了界面上的条；`renderer` 用 `mxt:boss_bar` 的图集，`bar_index` 选图集里的第几格。

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "bars": [
    {
      "anchor": "left",
      "order": 10,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1},
      "value_display": "current_and_maximum"
    }
  ]
}
```

灵气定义。`resource` 指向这门灵气记在哪个数值上，`first_realm` 是它这条修炼链的入口境界。

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": 0,
  "first_realm": "example:foundation"
}
```

物品灵气。`items` 认领物品，`type` 指向一个数值定义，`consume_speed` 与 `release_speed` 决定按住右键时灵气进出得多快；`exhausted_action` 在存量见底时执行。

```json
// data/example/mxt/item_aura/spirit_stone.json
{
  "items": "mxt:spirit_stone",
  "type": "example:spirit_power",
  "aura": 100,
  "consume_speed": "0.5 + level * 0.05",
  "release_speed": 2,
  "exhausted_action": {"type": "mxt:no_op"}
}
```

修炼行为。`aura_costs` 只收 `mxt:aura` 条目，从修炼者脚下的共享灵气池支付；`tick_interval` 是每多少刻跑一次 `tick_action`。

```json
// data/example/mxt/cultivate_action/meditation.json
{
  "absorb_amount": "1 + level * 0.1",
  "aura_costs": [{"type": "mxt:aura", "aura": "example:spirit_power", "amount": 1}],
  "tick_interval": 20,
  "tick_action": {"type": "mxt:no_op"}
}
```

物品绑定。`items` 同时点名一个物品和一个标签；`actions` 在物品被使用时执行，这条给的是灵根。

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": ["kubejs:root_pellet", "#example:root_pellets"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "quality_chain": "example:root_pellet"
}
```

体质。`holder_condition` 决定什么样的人持有它，`attribute_modifiers` 用原版属性，`granted_abilities` 引用技能 id。

```json
// data/example/mxt/physique/innate_sword_bone.json
{
  "holder_condition": {
    "type": "mxt:has_spirit_root",
    "spirit_root": "example:fire_root"
  },
  "attribute_modifiers": [
    {"attribute": "minecraft:attack_damage", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value"}
  ],
  "granted_abilities": ["example:sword_focus"]
}
```

再给同一种丹药做一条绑定，这次授予上面那条体质。同一件物品只能命中一条绑定，冲突时按 `priority` 从高到低选。

```json
// data/example/mxt/item_binding/body_pill.json
{
  "items": "kubejs:body_pill",
  "actions": [
    {"type": "mxt:grant_physique", "physique": "example:innate_sword_bone"}
  ]
}
```
