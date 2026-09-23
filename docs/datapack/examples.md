---
title: 数据包示例
---

# 数据包示例

## 目录

```text
data/example/mxt/resource/spirit_power.json
data/example/mxt/element/common.json
data/example/mxt/realm_stage/qi_condensation.json
data/example/tags/mxt/resource/disabled.json
```

## 禁用一条定义

```json
{
  "replace": false,
  "values": ["example:old_resource"]
}
```

不要使用自定义 `tags` 键代替原版标签；标签文件位于 `data/<namespace>/tags/...`。

## 灵气、元素与通用绑定示例

以下示例把常见系统串成一个最小闭环：资源、境界、灵气环境、修炼行为和物品燃料均来自数据包，物理物品仍由 KubeJS 或其他模组注册。

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

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": 0,
  "first_realm": "example:foundation"
}
```

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

```json
// data/example/mxt/cultivate_action/meditation.json
{
  "absorb_amount": "1 + level * 0.1",
  "aura_costs": [{"type": "mxt:aura", "aura": "example:spirit_power", "amount": 1}],
  "tick_interval": 20,
  "tick_action": {"type": "mxt:no_op"}
}
```

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": ["kubejs:root_pellet", "#example:root_pellets"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "quality_group": "#example:quality/root_pellet"
}
```

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

```json
// data/example/mxt/item_binding/body_pill.json
{
  "items": "kubejs:body_pill",
  "actions": [
    {"type": "mxt:grant_physique", "physique": "example:innate_sword_bone"}
  ]
}
```
