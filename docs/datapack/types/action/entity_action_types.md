---
title: 实体行为类型
description: 模组注册的全部内置实体行为类型，以及每种类型接受的 JSON 字段。
---

# 实体行为类型

**实体行为**对单个实体执行一次操作。行为作用的实体由声明该行为的那张数据表提供，因此行为本身只描述要对它做什么。

实体行为属于 Java（内置）注册表，因此它们的 `type` id 是固定的，数据包无法新增。`type` 用于选择内置类型，其取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包永远不会在这个注册表中新增或删除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义行为类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选字段，其余列出的字段都必须存在。「字段」列列出的是直接取自该类型 Codec 的 JSON 键。

## 通用结构

一个行为是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:heal",
  "amount": 4
}
```

因为行为会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `entity_action` 这样的字段下：

```json
"entity_action": {
  "type": "mxt:apply_effect",
  "effect": "minecraft:speed",
  "duration_ticks": 200
}
```

任何需要实体行为的地方也接受行为数组。数组是 `mxt:sequence` 的简写，会按顺序执行其中的条目：

```json
"entity_action": [
  { "type": "mxt:extinguish" },
  { "type": "mxt:heal", "amount": 2 }
]
```

::: info 字段类型是共享的
许多字段接受[数值提供器](../number_provider_types.md)而不是固定数字，另有一些类型会引用模组的共享[数据类型](../shared_data_types.md)。当字段接受嵌套的行为或条件时，该值使用对应家族的 id 表。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为类型

元行为控制其他实体行为是否执行、执行频率以及执行顺序。它们就是那些把其他行为作为字段的行为。

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:no_op` | — | 什么都不做；这是可选行为字段的默认行为。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的实体行为处理器。 |
| `mxt:sequence` | `actions` | 按顺序执行一组实体行为。 |
| `mxt:chance` | `action`、`chance`、`fail_action?` | 以概率 `chance` 执行 `action`，否则执行 `fail_action`。 |
| `mxt:if_else` | `condition`、`if_action`、`else_action?` | 实体条件通过时执行 `if_action`，否则执行 `else_action`。 |
| `mxt:choice` | `actions` | 从带权重的列表中挑选一个条目执行。 |

`choice` 列表的每个条目都是对嵌套行为的一层带权重包装：

| 条目字段 | 类型 | 默认 | 说明 |
|-------------|------|---------|-------------|
| `element` | Entity action | **required** | 该条目被选中时执行的行为。 |
| `weight` | Integer | `1` | 相对权重；权重越大越容易被选中。 |

## 行为类型

| 类型 | 字段 | 说明 |
|------|--------|-------------|
| `mxt:dismount` | — | 让实体停止骑乘其载具。 |
| `mxt:extinguish` | — | 熄灭实体身上的火。 |
| `mxt:heal` | `amount` | 治疗实体。 |
| `mxt:damage` | `amount` | 对实体施加伤害。它**没有归属**，因此不结算灵根元素关系，也不记攻击者：反噬、丹药毒性和环境 tick 这类"代价"用它是对的。当它落在施法者以外的人身上时，改为把施法者记为加害者。见[伤害结算](../../damage.md)。 |
| `mxt:add_resource` | `resource`、`amount` | 给服务端持有的实体[数值](../../json/resource.md)加上一个有符号数值。 |
| `mxt:grant_ability` | `ability`、`source` | 使用显式的持久化来源标识授予一个[技能](../../json/ability.md)。 |
| `mxt:grant_spirit_root` | `spirit_root` | 授予实体一个[灵根](../../json/spirit_root.md)。 |
| `mxt:grant_physique` | `physique` | 在其持有条件、叠层与互斥检查都通过后授予一个[体质](../../json/physique.md)。 |
| `mxt:remove_ability` | `ability`、`source` | 只移除属于 `source` 的那条技能授予，保留其他来源的授予。 |
| `mxt:remove_spirit_root` | `spirit_root` | 移除一个已持有的灵根及其授予的技能。 |
| `mxt:remove_physique` | `physique` | 移除一个已持有的体质及其授予的技能和属性来源。 |
| `mxt:apply_curse` | `curse`、`stacks?`、`duration_ticks?` | 通过权威诅咒事务施加一个数据包[诅咒](../../json/curse.md)。 |
| `mxt:apply_curses` | `curses` | 通过标准事务施加若干个独立配置的诅咒。 |
| `mxt:remove_curse` | `curse` | 以 `cleansed` 原因移除一个指定诅咒，因此它的 `on_cleanse` 会执行。 |
| `mxt:remove_curses_by_tag` | `tags` | 净化模型的解除侧：移除所有带有所给 `mxt:curse` 标签中**任意一个**的已持有诅咒（写作 `"#namespace:path"`），原因同样是 `cleansed`。诅咒定义从不声明什么可以净化它。 |
| `mxt:apply_effect` | `effect`、`duration_ticks`、`amplifier?` | 对生物实体施加一个原版状态效果。 |
| `mxt:teleport` | `x`、`y`、`z` | 在实体当前所在维度内移动它。 |
| `mxt:knockback` | `x`、`y`、`z` | 添加一个有界的速度向量；碰撞与坠落处理仍由原版负责。 |
| `mxt:modify_storage` | `family`、`id`、`value` | 写入某个宿主的一种已声明存储类型：`family` 是宿主所在的数据包注册表，`id` 是宿主自身，`value` 是完整的存储对象（例如 `{"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1}`）。宿主没有声明的类型以及运行期自身的游标都会被拒绝。 |
| `mxt:spawn_entity` | `entity_type`、`x`、`y`、`z` | 在行为实体所在维度的给定绝对坐标生成一个已注册实体，朝向与之保持一致。 |
| `mxt:spawn_projectile` | `entity_type`、`velocity_x`、`velocity_y`、`velocity_z` | 创建一个弹射物实体，把行为实体指定为所有者，并给它一个由公式驱动的速度。 |
| `mxt:add_experience` | `points?`、`levels?` | 给玩家增加经验点数或等级。 |
| `mxt:add_velocity` | `x?`、`y?`、`z?`、`space?`、`set?` | 给实体增加速度；`set` 为 `true` 时改为直接设置速度。 |
| `mxt:exhaust` | `amount` | 给玩家增加消耗度。 |
| `mxt:feed` | `food`、`saturation` | 恢复饱食度与饱和度。 |
| `mxt:gain_air` | `value` | 恢复实体的氧气值。 |
| `mxt:give_item` | `stack`、`item_action?`、`preferred_slot?` | 把一个物品堆交给玩家：先对副本执行可选的物品行为，并在所请求的槽位为空时优先放入该槽位。 |
| `mxt:play_sound` | `sound`、`category?`、`volume?`、`pitch?` | 播放一个声音事件。 |
| `mxt:remove_effect` | `effect` | 移除一个状态效果。 |
| `mxt:set_fall_distance` | `distance` | 设置实体的坠落距离。 |
| `mxt:set_no_gravity` | `no_gravity?` | 设置实体是否受重力影响。 |
| `mxt:set_on_fire` | `ticks` | 让实体着火指定的 tick 数。 |
| `mxt:swing_hand` | `hand` | 让实体挥动一只手。 |
| `mxt:emit_game_event` | `event` | 在实体所在位置发出一个原版游戏事件。 |
| `mxt:passenger_action` | `action?`、`bientity_action?`、`bientity_condition?`、`recursive?` | 对匹配的直接或递归乘客执行嵌套行为。 |
| `mxt:block_action` | `action` | 在行为实体所在的方块位置执行一个[方块行为](block_action_types.md)。 |
| `mxt:self_bientity_action` | `action` | 以当前实体同时作为施动者和目标，施加一个[双实体行为](bientity_action_types.md)。 |
| `mxt:equipped_item_action` | `slot`、`action` | 对一个已装备的物品堆执行[物品行为](item_action_types.md)。 |
| `mxt:riding_action` | `action?`、`bientity_action?`、`bientity_condition?`、`recursive?` | 对匹配的载具执行嵌套行为，可选地沿整条骑乘链执行。 |
| `mxt:explode` | `power`、`interaction?`、`indestructible?`、`create_fire?` | 在实体所在位置制造一次爆炸。 |
| `mxt:spawn_particles` | `particle`、`bientity_condition?`、`count`、`speed?`、`force?`、`spread?`、`offset_x?`、`offset_y?`、`offset_z?` | 在实体周围生成粒子，可选地只对满足双实体条件的观察者显示。 |
| `mxt:spawn_effect_cloud` | `radius?`、`radius_on_use?`、`wait_time?`、`effects?` | 在行为实体所在位置创建一个原版区域效果云。 |
| `mxt:spawn_lightning` | `offset_x?`、`offset_y?`、`offset_z?`、`color?`、`alpha?`、`thickness?`、`palette?`、`damage?`、`visual_only?`、`cause?` | 在行为位置加上偏移量的位置劈下一道带颜色的闪电；这道闪电之后做什么由原版闪电自己的行为决定。 |

::: info 嵌套值
`mxt:if_else` 接受一个[实体条件](../condition/entity_condition_types.md)；`mxt:passenger_action` 与 `mxt:riding_action` 接受实体行为、[双实体行为](bientity_action_types.md)和[双实体条件](../condition/bientity_condition_types.md)；`mxt:explode` 用[方块条件](../condition/block_condition_types.md)筛选受保护的方块。
:::

::: info 条目形状与默认值
`mxt:apply_curses` 接受一组诅咒条目，这些条目自身不带 `type` 键：`curse`（必填）、`stacks?`（默认 `1`）和 `duration_ticks?`。

`mxt:spawn_lightning` 完全不需要字段；它的闪电落在行为位置加上偏移量处，偏移量默认为 `0`。`color` 接受与灵气颜色相同的 `#RRGGBB` 或整数写法，`alpha` 取 `0..1`，`damage` 默认为 `5`。`visual_only` 让这道闪电只作装饰，`cause` 把它归属给玩家，玩家随后成为它造成伤害的来源。

`palette` 用渐变**取代**单一的 `color`：它是一组 RGB 颜色，第一个位于光柱顶端，最后一个位于地面，最多 16 个条目。渲染器逐接缝为闪电着色，并在相邻条目之间插值；由于分支读取的是同一组接缝，分支在离开主干的高度上与主干颜色一致。`alpha` 仍是整道闪电共用的一个辉光值，而不是每个颜色一个。非法颜色或长度超过 16 的列表会让加载失败，而不是被静默丢弃。

`mxt:set_no_gravity` 把 `no_gravity` 默认为 `true`，因此省略该字段是从实体上移除重力，而不是恢复重力。
:::
