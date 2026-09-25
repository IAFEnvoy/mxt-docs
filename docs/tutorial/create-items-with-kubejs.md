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
| `data/example/mxt/quality/common.json`、`refined.json` | 两个品质档位。 |
| `data/example/mxt/quality_chain/pill.json` | 丹药的品质阶梯：由低到高的档位、默认档与每一步的升级代价。 |
| `data/example/mxt/element/fire.json` | 灵根使用的元素。 |
| `data/example/mxt/spirit_root/fire_root.json` | 这枚丹药赋予什么。 |
| `data/example/mxt/technique/azure_breath.json` | 手册传授什么。 |
| `data/example/mxt/item_binding/qi_pill.json`、`root_pellet.json` | 消耗行为。 |
| `data/example/mxt/pill_binding/qi_pill.json` | 丹药毒性。 |
| `data/example/mxt/weapon_binding/spirit_sword.json` | 武器伤害、速度和战斗行为。 |
| `data/example/mxt/technique_binding/azure_manual.json` | 这门功法怎么被读，以及本体生成的载体用哪件物品。 |

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

`quality` 是物品可以携带的档位。品质的**顺序、默认档、成员资格与升级路径都由一条链条决定**，定义里没有排序字段：

```json
// data/example/mxt/quality/common.json
{
  "name": "quality.mxt.example.common"
}
```

```json
// data/example/mxt/quality/refined.json
{
  "name": "quality.mxt.example.refined",
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value",
    "modifier": 1.25
  },
  "alchemy_modifier": {
    "description": "quality.mxt.example.refined.alchemy",
    "modifier": 1.1
  }
}
```

```json
// data/example/mxt/quality_chain/pill.json
{
  "tiers": ["example:common", "example:refined"],
  "default": "example:common",
  "upgrades": [
    { "costs": [{ "id": "example:qi", "amount": 20 }] }
  ]
}
```

- 绑定通过 `quality_chain: "example:pill"` 引用这条链——写的是**链的 id**，不再是带 `#` 的标签。
- `tiers` 的数组顺序就是链条顺序（**低 → 高**）；没有覆盖组件、也没有锻造结果时，物品落到 `default` 那一档（省略 `default` 就是最低一档）。
- `upgrades[i]` 描述 `tiers[i] → tiers[i+1]` 这一步要付什么、要满足什么条件：这里从 `common` 升到 `refined` 要花 20 点 `example:qi`，走全局消耗事务，**整组原子**——付不出就一点不动，也不会写档。没声明的步不能升，**不会**当成免费。
- `name` 与 `description` 都可以省略：省略时按条目 id 自动生成 `quality_chain.mxt.<命名空间>.<路径>`（描述再加 `.description`）。`quality` 上的 `name` / `description` 同理；修正项上的 `description` 只有写了才会出现在物品 Tooltip 里（省略就不画那一行），而 `modifier` 是运行时使用的数值：`value_multiplier` 缩放物品的货币单位价值，`forging_modifier` 用来除锻造品质读取的额外步骤数，`alchemy_modifier` 用来除酿造时长。三者都读取它所结算的那堆物品的品质——锻造和炼丹取该次会话自身材料中**最低**的品质——修正项缺失或不可用时按 `1` 处理。
- 当前品质不在自己链上的物品完全无法使用，所以请按物品种类各留一条链，而不要所有东西共用一条。
- 只想用链来排序与定默认档、不开升级，就一个 `upgrades` 都不写：

```json
// data/example/mxt/quality_chain/weapon.json
{
  "tiers": ["example:common", "example:refined"],
  "default": "example:refined"
}
```

## 第 3 步 —— 通用绑定

`item_binding` 是通用的表：匹配一些物品，列出一些行为。

```json
// data/example/mxt/item_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "quality_chain": "example:pill",
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
  "quality_chain": "example:pill",
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ]
}
```

灵根才是让火元素变得有意义的东西：它改变修炼倍率，而它的 `element_ability_modifier` 会缩放 `element_affinity` 包含火的技能——伤害那一侧由[伤害管线](/technical/damage)自动乘上，技能定义里写基础数值就够了。

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
  "quality_chain": "example:weapon",
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

第 2 步里的 `example:weapon` 链定义这把武器可以携带哪些品质，以及没写覆盖组件时的默认档。

## 第 6 步 —— 功法与手册

功法是逻辑；`technique_binding` 描述这门功法**怎么被读**——长按时长、姿势、音效、品质链与条件，并顺便声明本体为它生成的载体用哪件物品。

```json
// data/example/mxt/technique/azure_breath.json
{
  "quality": "example:refined",
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
  "technique": "example:azure_breath",
  "carrier_item": "kubejs:azure_manual",
  "conditions": [{"type": "mxt:has_realm", "aura": "example:qi"}]
}
```

**这一叠是不是手册，看的是堆上的组件，不是这张表。** 上面的 `carrier_item` 只是让本体替这门功法生成载体（创造模式物品栏与 `/picker mxt:technique` 各一份），真正教功法的是堆上的 `mxt:technique` 组件，所以手册要用物品组件语法取出来：

```mcfunction
give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]
```

右键手册会尝试学习 `example:azure_breath`。所有已学会的功法会同时保持生效，而在堆上带组件时即使学习失败也会占用这次交互，所以玩家无法绕过功法自己的 `learn_condition`、互斥标签或学习事件。旧版本用 `items` 字段把物品绑到功法上，这个字段已经不存在了——写在新文件里会被静默忽略、加载不报错，那条规则只是不再生效。

## 第 7 步 —— 加载与验证

```text
(restart the game)                     → the four items now exist
(load the world again)                 → the bindings load
/mxt registries validate               → no codec errors
/mxt registries list                   → mxt:item_binding=2, mxt:pill_binding=1, mxt:weapon_binding=1, mxt:technique_binding=1, mxt:quality=2, …
```

两半各需要各自的重启：KubeJS 在启动时注册物品，而绑定表是 Minecraft 在加载世界时读取的数据包注册表。`/reload` 两者都做不到——它只刷新配方、战利品表、进度、函数和 KubeJS 服务端脚本。

然后在游戏里：

1. `/give @s kubejs:qi_pill`。Tooltip 会显示品质行，条件带描述时还会显示彩色的 `✓` 或 `✗`。`mxt:has_realm` 不满足时，这枚丹药会被拒绝使用。
2. 修炼到进入境界链，然后吃一枚丹药：灵气上升 `25`，丹药毒性上升 `10`。`/mxt attachment status` 显示累积的毒性。
3. 吃十枚，过量那一行就会执行。
4. 吃一枚 `kubejs:root_pellet`：火灵根被赋予，`/mxt attachment status` 会列出它。`+25%` 的修炼倍率从下一个修炼 tick 开始生效。
5. `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]`，然后右键它，确认功法已学会、其 `+2 最大生命值` 已出现。直接 `/give @s kubejs:azure_manual`（或从创造模式物品栏拿 `kubejs:azure_manual`）拿到的那一叠**不带组件**，右键不会有任何反应，Tooltip 里也不会出现功法。
6. 手持 `kubejs:spirit_sword`，在它的 Tooltip 里查看攻击伤害和速度，然后打一下什么东西，看看 `attack_action` 带来的额外伤害。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界带着未知物品拒绝加载 | 某个绑定写了一个没有注册的物品 ID。作为单个 ID 会让加载失败；写在数组里则会丢弃那条读不出来的元素并记一行日志。 |
| 规则静默地从不匹配 | 在 `items` 数组里写成了 `example:qi_pill`，而脚本产生的是 `kubejs:qi_pill`（或任何其它拼写错误），于是那个元素被丢弃、文件照常加载。请使用真正注册的 ID。 |
| 物品完全没有行为 | 规则被放进了与该物品不匹配的绑定表，或者该物品的品质不在它声明的 `quality_chain` 上。 |
| `quality_chain` 被拒绝 | 它必须指向一条存在的 `quality_chain`，而且链的 `tiers` / `default` / `upgrades` 要通过加载期校验。 |
| 丹药吃不了 | `pill_binding` 只匹配可食用物品，所以物品需要有 `.food(...)`。 |
| 新物品在 `/reload` 后不出现 | 物品注册发生在启动阶段；请重启游戏。 |
| 改过的绑定没有任何变化 | `/reload` 不会重新读取数据包注册表；请重新加载世界。 |
| 手册没有效果也没有报错 | 先确认那一叠上有没有 `mxt:technique` 组件——没有组件的普通物品什么都不教。有组件时再看学习是否失败：`learn_condition`、是否已经学过同一门功法，或互斥冲突。 |
| 手册的 `items` 字段没起作用 | `technique_binding` 已经没有 `items` 字段了，写了会被**静默忽略**（加载不报错）。改用 `carrier_item` 加堆上的 `mxt:technique` 组件。 |

## 下一步

- [添加技能](./add-an-ability.md) —— 让这些物品有地方花掉它们储存的灵气。
- [物品绑定](../datapack/json/item_binding.md)、[丹药绑定](../datapack/json/pill_binding.md)、[武器绑定](../datapack/json/weapon_binding.md) 和 [功法绑定](../datapack/json/technique_binding.md) —— 完整字段列表。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 脚本对象，如果你想用脚本写规则本身。
