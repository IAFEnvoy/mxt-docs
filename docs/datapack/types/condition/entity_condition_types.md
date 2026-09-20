---
title: 实体条件类型
description: 模组注册的全部内置实体条件类型，以及每种类型接受的 JSON 字段。
---

# 实体条件类型

**实体条件**检查单个实体的状态并返回 `true` 或 `false`。被检查的实体由声明该条件的那张数据表提供，因此条件本身只描述要检查什么。

实体条件是 Java（内置）注册表，所以它们的 `type` id 是固定的，数据包无法新增。`type` 选择内置类型，其取值是本页列出的 id 之一，用 `mxt` 命名空间书写。数据包既不会向该注册表添加条目，也不会移除条目。只有 Java 代码或 KubeJS 桥接可以引入自定义条件类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

下表中，字段名后带 `?` 的为可选项；其余列出的字段都必须填写。「字段」列列出的是直接取自该类型 codec 的 JSON 键。

## 通用结构

条件是一个 JSON 对象，其 `type` 字段指明内置类型。其余所有键都是该类型声明的字段。

```json
{
  "type": "mxt:health",
  "comparison": "<",
  "compare_to": 10
}
```

因为条件会作为值用在其他数据表内部，所以同样的结构通常嵌套在 `condition` 这样的字段下：

```json
"condition": {
  "type": "mxt:has_spirit_root",
  "spirit_root": "example:azure_root"
}
```

任何需要实体条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"condition": [
  { "type": "mxt:sneaking" },
  { "type": "mxt:on_block", "condition": {"type": "mxt:block_tag", "tag": "minecraft:logs"} }
]
```

::: info 比较字段
有若干类型会把一个数值与某个数字相比较。当类型把 `comparison` 与 `compare_to` 列为两个独立键时，它们直接写在条件对象上，如上面的示例。少数类型只写一个 `comparison` 键，其值是一个嵌套的比较对象，内部含有 `comparison` 与 `compare_to`；这些类型会在自己的说明里注明。比较运算符为 `==`、`!=`、`<`、`<=`、`>` 和 `>=`，而 `compare_to` 本身始终是普通数字。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 以交互方式展示每种类型的字段列表，用来核对字段名很方便，不必翻这里的表。
:::

## 条件类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always_true` | — | 始终通过。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的实体条件处理器。 |
| `mxt:never` | — | 始终失败。 |
| `mxt:and` | `conditions` | 只有当所有嵌套实体条件都通过时才通过。 |
| `mxt:not` | `condition` | 对嵌套实体条件取反。 |
| `mxt:or` | `conditions` | 只要有一个嵌套实体条件通过就通过。 |
| `mxt:chance` | `chance` | 按给定概率随机通过，概率取值在 `0` 与 `1` 之间。 |
| `mxt:constant` | `value` | 始终返回给定的布尔值。 |
| `mxt:sneaking` | — | 检查实体是否正在潜行。 |
| `mxt:has_ability` | `ability` | 检查实体当前是否持有给定的 [技能](../../json/ability.md)。 |
| `mxt:has_curse` | `curse?`、`tags?`、`stacks?`、`remaining_ticks?` | 检查实体是否持有一条满足**全部**给定筛选条件的 [诅咒](../../json/curse.md)：某个定义、列出的全部标签、层数范围与剩余 tick 范围。范围是 `{min?, max?}` 窗口；永不过期的诅咒按无限计，因此它能回答 `min`，却永远不会满足 `max`。完全不写筛选条件时，问的是是否持有任意诅咒。 |
| `mxt:has_spirit_root` | `spirit_root` | 检查实体当前是否持有给定的 [灵根](../../json/spirit_root.md)；`spirit_root` 接受条目、`#` 标签或它们的数组，所以"任意火属灵根"写一条标签即可。被停用的灵根不算持有。 |
| `mxt:has_physique` | `physique` | 检查实体当前是否持有给定的 [体质](../../json/physique.md)。 |
| `mxt:realm` | `realm`、`comparison?` | 把实体的 [境界阶段](../../json/realm_stage.md) 与 `realm` 比较，`comparison` 可用 `exact`（默认）、`at_least` 或 `at_most`。 |
| `mxt:has_realm` | `aura` | 对已针对给定 [灵气](../../json/aura.md) 进入境界链的实体通过。 |
| `mxt:aura_range` | `aura` | 把服务端解析出的实体所在位置的灵气浓度与逐灵气的需求相比较。`aura` 把灵气 ID 映射到一个对象，其中有必填的 `max` 与可选的 `min`（默认 `0`）；两者都接受 [数值提供器](../number_provider_types.md)。 |
| `mxt:has_element` | `elements` | 当实体的**启用**灵根所命名的元素中有一个出现在 `elements` 里时通过。`elements` 是 `HolderOrTag<element>[]`，因此"任意火属灵根"写一条 `#` 标签即可，之后新加的同类灵根无需改动这里；被停用的元素不算。元素类条件的 `elements` 都至少写一项：写空表/空数组会在加载期被拒绝，而不是变成一条"恒真"或"恒假"的条件。 |
| `mxt:aura_element` | `elements` | 按**元素**而不是按具名灵气测试实体所在位置的灵气。`elements` 把元素映射到一个对象，其中有必填的 `max` 与可选的 `min`（默认 `0`），两者都接受 [数值提供器](../number_provider_types.md)；该位置上所有携带这个元素的**存活**灵气会先求和再比较（被停用的元素不参与），每一项都要通过。给区域再加另一种同元素灵气即可满足要求，不必改动查询。 |
| `mxt:element_attachment` | `elements` | 读取元素在实体身上的积累量（`mxt:element_attachment` 附件，见 [element_reaction](../../json/element_reaction.md)）。`elements` 把元素映射到同样的 `{min?, max}` 窗口，每一项都要通过。这是积累系统的只读一侧：可以让效果取决于身上攒了多少火，而不需要任何反应触发。被 `mxt:disabled` 停用的元素无论身上还剩多少都答 `false`（那个量已经不再是这个元素的事），写空表会在加载期被拒绝而不是当成"恒真"。 |
| `mxt:in_realm_instance` | `definition?`、`role?` | 判定实体是否在某份[秘境实例](../../json/realm_instance.md)里。`definition` 接受一条 `mxt:realm_instance` 定义或 `#标签`，省略时不限定是哪一份定义；`role` 取 `any`（默认，在里面即可）、`owner`（自己是主人）或 `guest`（在里面但不是主人）。不在任何实例里时恒为 `false`，因此 `owner` 与 `guest` 都隐含"在里面"。 |
| `mxt:resource_compare` | `resource`、`min` | 检查实体某个数值的取值至少为 `min`。 |
| `mxt:entity_tag` | `tag` | 把实体与实体类型标签匹配。 |
| `mxt:formation_member` | — | 当实体在当前维度拥有任意已注册的 [阵法](../../json/formation.md) 时通过。 |
| `mxt:formation_owner` | — | 当实体是当前正在求值的阵法的阵主时通过；在阵法上下文之外恒为 `false`。 |
| `mxt:formation_ally` | — | 当当前正在求值的阵法阵主把该实体视为友军时通过。 |
| `mxt:air` | `comparison`、`compare_to` | 比较实体剩余的氧气值。 |
| `mxt:dimension` | `dimension`、`inverted?` | 检查实体所在维度；`inverted` 为 `true` 时取相反结果。 |
| `mxt:entity_type` | `entity_type` | 检查实体的类型。 |
| `mxt:fall_distance` | `comparison`、`compare_to` | 比较实体的下落距离。 |
| `mxt:glowing` | — | 检查实体是否发光。 |
| `mxt:health` | `comparison`、`compare_to` | 比较实体当前的生命值。 |
| `mxt:exposed_to_sky` | — | 检查实体所在位置能否看到天空。 |
| `mxt:food_level` | `comparison`、`compare_to` | 比较玩家的饥饿值。 |
| `mxt:mob_effect` | `effect` | 检查实体是否带有给定的状态效果。 |
| `mxt:on_block` | `condition` | 对实体所站的方块测试一条 [方块条件](block_condition_types.md)。 |
| `mxt:time_of_day` | `comparison`、`compare_to` | 比较主世界时钟时间，取值是 24000 tick 一天内的 tick 数。 |
| `mxt:using_item` | — | 检查实体当前是否正在使用物品。 |
| `mxt:brightness` | `comparison`、`compare_to` | 比较实体眼睛处的亮度，取值在 `0` 与 `1` 之间。 |
| `mxt:exposed_to_sun` | — | 检查实体是否暴露在阳光下。 |
| `mxt:experience_level` | `comparison`、`compare_to` | 比较玩家的经验等级。 |
| `mxt:experience_points` | `comparison`、`compare_to` | 比较玩家的经验总点数。 |
| `mxt:relative_health` | `comparison`、`compare_to` | 比较实体的生命值除以其最大生命值。 |
| `mxt:saturation_level` | `comparison`、`compare_to` | 比较玩家的饱和度。 |
| `mxt:team` | `team?` | 检查实体是否在某个计分板队伍中；写了 `team` 时检查是否在指定队伍中。 |
| `mxt:attribute` | `attribute`、`comparison`、`compare_to` | 比较实体的某一条属性值。 |
| `mxt:block_collision` | `offset_x?`、`offset_y?`、`offset_z?` | 检查实体在偏移位置上是否有方块碰撞。 |
| `mxt:can_have_effect` | `effect` | 检查实体能否受到给定状态效果的影响。 |
| `mxt:gamemode` | `gamemode` | 检查玩家的游戏模式。 |
| `mxt:passenger` | `bientity_condition?`、`comparison`、`compare_to` | 比较实体的直接乘客中满足某条 [双实体条件](bientity_condition_types.md) 的数量。 |
| `mxt:attack_cooldown` | `comparison`、`compare_to` | 比较玩家当前攻击冷却的进度。 |
| `mxt:equipped_item` | `equipment_slot`、`item_condition?` | 把某个装备槽里的物品与一条 [物品条件](item_condition_types.md) 对照检查。 |
| `mxt:in_block` | `block_condition` | 对实体所在方块位置的那一个方块测试一条 [方块条件](block_condition_types.md)。 |
| `mxt:in_block_anywhere` | `block_condition`、`comparison` | 比较实体碰撞箱内匹配的方块数量，`comparison` 是一个嵌套的比较对象。 |
| `mxt:scoreboard` | `name?`、`objective`、`comparison`、`compare_to` | 比较计分板分数，分数持有者默认取实体的计分板名称。 |
| `mxt:riding` | `bientity_condition?` | 把实体的载具与一条 [双实体条件](bientity_condition_types.md) 对照检查。 |
| `mxt:riding_recursive` | `bientity_condition?`、`comparison`、`compare_to` | 比较整条骑乘链上满足某条双实体条件的载具数量。 |
| `mxt:passenger_recursive` | `bientity_condition?`、`comparison`、`compare_to` | 比较满足某条双实体条件的嵌套乘客数量。 |
| `mxt:riding_root` | `bientity_condition?` | 对实体骑乘链根部的载具测试一条双实体条件。 |
| `mxt:storage_toggle` | `family`、`id`、`expected?` | 读取一个 [`mxt:toggle`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`family` 指出宿主所在的数据包注册表，`id` 是宿主；宿主必须声明过该类型，否则判断为 `false`。当存储的 `state` 等于 `expected`（默认 `true`）时为真；从未写入过时回退到声明里的 `default`。 |
| `mxt:storage_timer` | `family`、`id`、`remaining?`、`ended?` | 读取一个 [`mxt:timer`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`remaining` 是剩余 tick 数上的 `{min?, max?}` 窗口（不会为负），`ended` 问 `ends_at` 是否已过。没有 `ends_at` 的计时没有在运行，因此没有剩余，算作已结束。 |
| `mxt:storage_resource` | `family`、`id`、`amount?` | 读取一个 [`mxt:resource`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`amount` 是 `{min?, max?}` 窗口；存下来的记录没有 `amount` 时按 `0` 计，而省略 `amount` 只问是否存有该类值。 |
| `mxt:storage_target` | `family`、`id`、`locked?`、`max_distance?` | 读取一个 [`mxt:target_lock`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`locked`（默认 `true`）问是否存有目标 UUID；`max_distance` 额外要求该 UUID 能解析出来，并且能在施动者所在维度中按该距离找到对应实体。UUID 格式错误、实体不存在或距离为负数都算 `false`。 |
| `mxt:storage_charges` | `family`、`id`、`remaining?` | 读取一个 [`mxt:charges`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`remaining` 是剩余可用次数上的 `{min?, max?}` 窗口；从未消耗过的次数池不会记下计数，读作声明里的 `maximum`。省略 `remaining` 只问宿主是否声明过充能池。 |
| `mxt:storage_cooldown` | `family`、`id`、`remaining?`、`ready?` | 读取一个 [`mxt:cooldown`](/datapack/types/other/ability-and-curse#data-storage-type) 值。`remaining` 是剩余 tick 数上的 `{min?, max?}` 窗口，`ready` 问冷却是否已完成。长度取上次使用时实际得到的那个值；内容自行写入而没带 `duration` 的值则取声明里的 `ticks`。倒计时从值被写入的那一 tick 开始，与运行时读取的锚点相同。从未写入过值的宿主完全不在冷却中，因此 `remaining` 回答 `0`、`ready` 回答 `true`。 |
| `mxt:has_equipped_item` | `item_condition?`、`slots?` | 当实体穿戴或手持的物品堆满足一条 [物品条件](item_condition_types.md) 时通过——这是把被动 `mxt:modifier` 绑定在装备上的自然做法，例如 `{"type": "mxt:item_tag", "tag": "#example:swords"}`。`slots` 可以写原版装备槽名（`mainhand`、`offhand`、`head`、`chest`、`legs`、`feet`、`body`），也可以写带 `curios:` 前缀的 Curios 槽位（`curios:back_weapon`）；不写则询问全部原版槽位与全部 Curios 槽位。匹配不到任何东西的名字只是永远不通过。 |

::: info 类型引用
`ability`、`curse`、`spirit_root`、`physique`、`realm`、`aura`、`element` 和 `resource` 接受对应数据包注册表的 ID，因此它们可以指向任意数据包添加的内容，而不只是模组自带的条目。
:::
