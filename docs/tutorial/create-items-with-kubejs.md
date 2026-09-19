---
title: 用 KubeJS 创建物品
description: 在 KubeJS 启动脚本里注册真实物品，再用物品、丹药、武器和功法绑定表把 MiXianTu 的玩法挂到它们身上。
---

# 用 KubeJS 创建物品

MiXianTu 不创建物品。它创建的是**物品的规则**，而这些规则始终指向一个真实、已注册的物品 ID，无论该物品来自原版、其它模组还是 KubeJS 脚本。

这种分工是刻意的：数据包要引用一个物品，它必须先存在，而两者注册的时机并不相同。不过它们最终会汇合到同一处——脚本注册的物品只有在重启游戏之后才对游戏可见，而绑定表是数据包注册表，在加载世界时读取：

```text
kubejs/startup_scripts/          the item itself      (game restart)
        ↓  real item ID: kubejs:qi_pill
data/example/mxt/item_binding/   the rules            (world reload)
        ↓
actions, conditions, quality, aura, tooltips
```

::: warning

不要凭空造 `mxt:item`、`mxt:pill` 或 `mxt:weapon` 文件。这些注册表并不存在。每张绑定表匹配的都是已经注册的物品。单个未知的物品 ID 会让加载失败；写在数组里的未知 ID 则只记一行日志后被丢弃，文件其余部分照常加载——所以数组里的拼写错误会静默地丢掉那次匹配。

:::

## 你要搭建的东西

| 文件 | 用途 |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | 四个物品：一枚聚气丹、一枚灵根丹、一把剑和一本功法手册。 |
| `kubejs/server_scripts/mxt_recipes.js` | 它们的配方。 |
| `data/example/mxt/item_quality/common.json`、`refined.json` | 两个品质档位。 |
| `data/example/tags/mxt/item_quality/group/pill.json` | 丹药所属的品质组。 |
| `data/example/mxt/element/fire.json` | 灵根使用的元素。 |
| `data/example/mxt/spirit_root/fire_root.json` | 这枚丹药赋予什么。 |
| `data/example/mxt/technique/azure_breath.json` | 手册传授什么。 |
| `data/example/mxt/item_binding/qi_pill.json`、`root_pellet.json` | 消耗行为。 |
| `data/example/mxt/pill_binding/qi_pill.json` | 丹药毒性。 |
| `data/example/mxt/weapon_binding/spirit_sword.json` | 武器伤害、速度和战斗行为。 |
| `data/example/mxt/technique_binding/azure_manual.json` | 手册对应的功法。 |

## 第 1 步 —— 注册物品

物品只在启动时注册一次，所以这个脚本要放在 `kubejs/startup_scripts/`：

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('qi_pill')
    .displayName('Qi Gathering Pill')
    .food(food => food.hunger(2).saturation(0.2))

  event.create('root_pellet')
    .displayName('Fire Root Pellet')
    .food(food => food.hunger(1).saturation(0.1))

  event.create('spirit_sword', 'sword')
    .displayName('Spirit Sword')
    .tier('diamond')

  event.create('azure_manual')
    .displayName('Azure Breath Manual')
})
```

- 没有命名空间注册的物品位于 `kubejs`，所以 `event.create('qi_pill')` 产生 `kubejs:qi_pill`。所有绑定都必须使用这个 ID。
- 丹药必须有 `.food(...)`：`pill_binding` 只匹配可食用物品。
- 改这个文件需要**重启游戏**：启动脚本在游戏注册物品之前运行，`/reload` 永远不会重跑它们。

配方不是注册表，所以它们确实会随 `/reload` 重载——下面的脚本在服务端脚本里注册配方：

```js
// kubejs/server_scripts/mxt_recipes.js
ServerEvents.recipes(event => {
  event.shaped('kubejs:qi_pill', [' A ', 'ABA', ' A '], {
    A: 'minecraft:glowstone_dust',
    B: 'minecraft:bowl'
  })

  event.shaped('kubejs:root_pellet', [' A ', 'ABA', ' A '], {
    A: 'minecraft:blaze_powder',
    B: 'kubejs:qi_pill'
  })
})
```

## 第 2 步 —— 品质档位

`item_quality` 是物品可以携带的档位。品质的顺序与分组由原版标签决定，而不是由定义里的字段决定：

```json
// data/example/mxt/item_quality/common.json
{
  "display_name": "quality.example.common"
}
```

```json
// data/example/mxt/item_quality/refined.json
{
  "display_name": "quality.example.refined",
  "value_multiplier": {
    "description": "quality.example.refined.value",
    "modifier": 1.25
  },
  "alchemy_modifier": {
    "description": "quality.example.refined.alchemy",
    "modifier": 1.1
  }
}
```

```json
// data/example/tags/mxt/item_quality/group/pill.json
{
  "replace": false,
  "values": [
    "example:refined",
    "example:common"
  ]
}
```

- 绑定通过 `#example:group/pill` 引用这个组。`#` 是引用的一部分，缺了它的绑定会加载失败。
- `values` 的顺序就是这个组的品质顺序，其中最后一个可用成员是没有显式品质的物品的**默认值**——所以这个文件把 `refined` 写在前面、`common` 写在后面，`common` 因此成为默认值。
- `display_name` 是文本组件，所以翻译键也能用；修正项上的 `description` 会自动追加到物品 Tooltip，而 `modifier` 是运行时使用的数值：`value_multiplier` 缩放物品的货币单位价值，`forging_modifier` 用来除锻造品质读取的额外步骤数，`alchemy_modifier` 用来除酿造时长。三者都读取它所结算的那堆物品的品质——锻造和炼丹取该次会话自身材料中**最低**的品质——修正项缺失或不可用时按 `1` 处理。
- 当前品质不在自己组内的物品完全无法使用，所以请按物品种类各留一个组，而不要所有东西共用一个组。

```json
// data/example/tags/mxt/item_quality/group/weapon.json
{
  "replace": false,
  "values": [
    "example:common",
    "example:refined"
  ]
}
```

## 第 3 步 —— 通用绑定

`item_binding` 是通用的表：匹配一些物品，列出一些行为。

```json
// data/example/mxt/item_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "quality_group": "#example:group/pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
      "description": "condition.example.needs_qi_chain"
    }
  ],
  "actions": [
    {"type": "mxt:add_resource", "resource": "example:qi", "amount": 25}
  ]
}
```

- `items` 接受单个 ID、单个标签（`"#example:pills"`）或混合数组，所以一个文件就能覆盖整个物品家族。
- `conditions` 决定能不能使用。写成裸条件的条目是静默的；写成 `{condition, description}` 的条目会在 Tooltip 里显示绿色 `✓` 或红色 `✗`，这是告诉玩家某件物品为什么不能用最省事的办法。
- `actions` 在物品被消耗或绑定事件触发时按顺序执行。任何[实体行为](../datapack/types/action/entity_action_types.md)都可以放在这里。

一枚赋予灵根的丹药：

```json
// data/example/mxt/element/fire.json
{
  "color": "#FF6600"
}
```

```json
// data/example/mxt/spirit_root/fire_root.json
{
  "element": "example:fire",
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "rarity": "rare"
}
```

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": "kubejs:root_pellet",
  "quality_group": "#example:group/pill",
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ]
}
```

灵根才是让火元素变得有意义的东西：它改变修炼倍率，而它的 `element_ability_modifier` 会缩放 `element_affinity` 包含火的技能。

## 第 4 步 —— 丹药绑定

丹药绑定补充只有丹药才有的字段。它之所以是单独一张表，是因为它的字段没有一个与其它绑定共用。

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "on_consume": {"type": "mxt:no_op"},
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25,
  "on_overdose": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:poison",
    "duration_ticks": 100
  }
}
```

- `toxicity_gain` 在玩家身上累积；当它超过 `toxicity_threshold` 时执行 `on_overdose`，并把毒性重置为 `toxicity_after_overdose` 而不是 `0`，所以反复过量会持续受到伤害。
- 默认阈值是 `Double.MAX_VALUE`，意思是"永不过量"。请有意地设置它。
- `on_consume` 在正常消耗流程结束之后执行，与 `item_binding` 的行为彼此独立。

两张表可以用在同一个物品上；它们携带不同的字段，谁也不覆盖谁。

## 第 5 步 —— 武器绑定

```json
// data/example/mxt/weapon_binding/spirit_sword.json
{
  "items": "kubejs:spirit_sword",
  "attack_damage": 8,
  "attack_speed": -2.4,
  "quality_group": "#example:group/weapon",
  "use_action": {"type": "mxt:no_op"},
  "attack_action": {
    "type": "mxt:target_action",
    "action": {"type": "mxt:damage", "amount": 3}
  },
  "tick_action": {"type": "mxt:no_op"}
}
```

- `attack_damage` 和 `attack_speed` 会加到物品上，叠加在它所属档位已经给出的数值之上。
- `use_action` 是右键时执行的实体行为；`attack_action` 是命中成功时执行的双实体行为，所以这里的 `mxt:target_action` 会对目标额外造成 3 点伤害。
- `tick_action` 在手持该武器时每 tick 执行，是放置维护、粒子或灵气抽取的地方。
- `attributes` 追加更多原版属性修正；带 `value` 公式的条目每 tick 重新计算。

第 2 步里的 `#example:group/weapon` 标签定义这把武器可以携带哪些品质。

## 第 6 步 —— 功法绑定

功法是逻辑；功法绑定是传授它的那本书。

```json
// data/example/mxt/technique/azure_breath.json
{
  "grade": "earth",
  "learn_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "cultivation_modifier": 1.25,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:technique/azure_breath",
      "amount": 2,
      "operation": "add_value"
    }
  ]
}
```

```json
// data/example/mxt/technique_binding/azure_manual.json
{
  "items": "kubejs:azure_manual",
  "technique": "example:azure_breath",
  "conditions": [{"type": "mxt:has_realm", "aura": "example:qi"}]
}
```

右键手册会尝试学习 `example:azure_breath`。所有已学会的功法会同时保持生效，而匹配的绑定即使在学习失败时也会占用这次交互，所以玩家无法绕过功法自己的 `learn_condition`、互斥标签或学习事件。

## 第 7 步 —— 加载与验证

```text
(restart the game)                     → the four items now exist
(load the world again)                 → the bindings load
/mxt registries validate               → no codec errors
/mxt registries list                   → mxt:item_binding=2, mxt:pill_binding=1, mxt:weapon_binding=1, mxt:technique_binding=1, mxt:item_quality=2, …
```

两半各需要各自的重启：KubeJS 在启动时注册物品，而绑定表是 Minecraft 在加载世界时读取的数据包注册表。`/reload` 两者都做不到——它只刷新配方、战利品表、进度、函数和 KubeJS 服务端脚本。

然后在游戏里：

1. `/give @s kubejs:qi_pill`。Tooltip 会显示品质行，条件带描述时还会显示彩色的 `✓` 或 `✗`。`mxt:has_realm` 不满足时，这枚丹药会被拒绝使用。
2. 修炼到进入境界链，然后吃一枚丹药：灵气上升 `25`，丹药毒性上升 `10`。`/mxt attachment status` 显示累积的毒性。
3. 吃十枚，过量那一行就会执行。
4. 吃一枚 `kubejs:root_pellet`：火灵根被赋予，`/mxt attachment status` 会列出它。`+25%` 的修炼倍率从下一个修炼 tick 开始生效。
5. 右键 `kubejs:azure_manual`，确认功法已学会、其 `+2 最大生命值` 已出现。
6. 手持 `kubejs:spirit_sword`，在它的 Tooltip 里查看攻击伤害和速度，然后打一下什么东西，看看 `attack_action` 带来的额外伤害。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界带着未知物品拒绝加载 | 某个绑定写了一个没有注册的物品 ID。作为单个 ID 会让加载失败；写在数组里则会丢弃那条读不出来的元素并记一行日志。 |
| 规则静默地从不匹配 | 在 `items` 数组里写成了 `example:qi_pill`，而脚本产生的是 `kubejs:qi_pill`（或任何其它拼写错误），于是那个元素被丢弃、文件照常加载。请使用真正注册的 ID。 |
| 物品完全没有行为 | 规则被放进了与该物品不匹配的绑定表，或者该物品不在它声明的 `quality_group` 里。 |
| `quality_group` 被拒绝 | 它必须是带 `#` 前缀的标签引用，而且该标签必须存在。 |
| 丹药吃不了 | `pill_binding` 只匹配可食用物品，所以物品需要有 `.food(...)`。 |
| 新物品在 `/reload` 后不出现 | 物品注册发生在启动阶段；请重启游戏。 |
| 改过的绑定没有任何变化 | `/reload` 不会重新读取数据包注册表；请重新加载世界。 |
| 手册没有效果也没有报错 | 功法绑定已被占用，但学习失败——检查 `learn_condition`、是否已经学过同一门功法，或互斥冲突。 |

## 下一步

- [添加技能](./add-an-ability.md) —— 让这些物品有地方花掉它们储存的灵气。
- [物品绑定](../datapack/json/item_binding.md)、[丹药绑定](../datapack/json/pill_binding.md)、[武器绑定](../datapack/json/weapon_binding.md) 和 [功法绑定](../datapack/json/technique_binding.md) —— 完整字段列表。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 脚本对象，如果你想用脚本写规则本身。
