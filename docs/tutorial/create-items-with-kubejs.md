---
title: KubeJS 创建物品并绑定行为
description: "在 KubeJS 启动脚本里注册真实物品，再用四张绑定表把 MiXianTu 的规则与行为挂到它们身上。"
---

# KubeJS 创建物品并绑定行为

MiXianTu 不创建物品。它创建的是**物品的规则**，而这些规则始终指向一个真实、已注册的物品 ID，无论该物品来自原版、其它模组还是 KubeJS 脚本。

这种分工是刻意的：数据包要引用一个物品，它必须先存在，而两者注册的时机并不相同。不过它们最终会汇合到同一处——脚本注册的物品只有在重启游戏之后才对游戏可见，而绑定表在加载世界时才读取（`item_binding` / `weapon_binding` 是物品数据表，`pill_binding` / `technique_binding` 是数据包注册表）：

```text
kubejs/startup_scripts/          the item itself      (game restart)
        ↓  real item ID: kubejs:qi_pill
data/mxt/data_maps/item/         the rules            (world reload)
        ↓
actions, conditions, quality, aura, tooltips
```

::: warning

不要凭空造 `mxt:item` 或 `mxt:weapon` 文件。这两张注册表并不存在。每张绑定表匹配的都是已经注册的物品。单个未知的物品 ID 会让加载失败；写在数组里的未知 ID 则只记一行日志后被丢弃，文件其余部分照常加载——所以数组里的拼写错误会静默地丢掉那次匹配。

:::

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | 四个物品：一枚聚气丹、一枚灵根丹、一把剑和一本功法手册。 |
| `kubejs/server_scripts/mxt_recipes.js` | 它们的配方。 |
| `data/example/mxt/element/fire.json` | 灵根使用的元素。 |
| `data/example/mxt/spirit_root/fire_root.json` | 这枚丹药赋予什么。 |
| `data/example/mxt/technique/azure_breath.json` | 手册传授什么。 |
| `data/mxt/data_maps/item/item_binding.json` | 通用绑定：使用这件物品会做什么。 |
| `data/example/mxt/pill/qi_pill.json` | 丹药作用：食用行为、丹毒与过量。 |
| `data/example/mxt/pill_binding/qi_pill.json` | 这族物品是哪一份丹药，以及它的次数与冷却。 |
| `data/mxt/data_maps/item/weapon_binding.json` | 武器属性修正与战斗行为。 |
| `data/example/mxt/technique_binding/azure_manual.json` | 这门功法怎么被读，以及本体生成的载体用哪件物品。 |

品质档位不在这页：它有自己的链与升级规则，见[定义品质链](./define-a-quality-chain.md)。这页的四件物品用那篇建立的三档。

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
- 丹药**不必**写 `.food(...)`。被绑定的物品自带 `minecraft:consumable`（食物、饮料、`.food(...)` 的物品）就按那个物品自己的周期与饱食度规则吃；**没有**的话框架会在右键那一刻替这一叠补上一次食用动作、吃完收回，所以普通物品绑上丹药也能服，物品本身留不下东西。药效在**一次完整使用周期结束**那一拍执行，这一点不变——给它写 `.food(...)` 只是让这次周期来自那个物品自己。
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

## 第 2 步 —— 四张绑定表各自管什么

四张表的用途不同，字段也几乎不重叠。`item_binding` 与 `weapon_binding` 是**数据表**：文件放在 `data/mxt/data_maps/item/` 下，`values` 的键就是物品 id 或 `#物品标签`；`pill_binding` 与 `technique_binding` 仍是数据包注册表，靠 `items` 声明自己管哪些物品：

| 表 | 管什么 | 主要字段 |
| --- | --- | --- |
| `item_binding` | 通用的"用掉这件物品会怎样" | `conditions`、`actions` |
| `pill_binding` | 这族物品是哪一份丹药，以及服用次数与冷却 | `pill`、`max_uses`、`cooldown`、`priority` |
| `weapon_binding` | 当武器用时的属性与动作 | `attributes`、`use_action`、`attack_action`、`tick_action` |
| `technique_binding` | 这门功法怎么被读、载体用哪件物品 | `technique`、`carrier_item`、`learn_time`、`hold_animation`、`hold_sound` |

三条共同规则：

- 数据表的键与注册表的 `items` 都接受单个 ID 或 `#物品标签`，所以一份文件就能覆盖整个物品家族（数据表的键在加载期把标签展开）。
- 每张表都按 `priority` 决定谁生效，**同一件物品在同一张表里只有一个值会跑**（数值大者胜，同分则后处理的那个赢：同一文件按书写顺序、不同文件按数据包加载顺序），不是"全部叠加"。两份都写对了也不会都执行。
- 一个匹配不到任何物品的键，或者注册表里没写 / 写错的 `items`，都让那一份永远不生效，而且**不会报错**。

钩子的执行时机、条件的写法与顺序另有一篇：[KubeJS 绑定行为](./bind-actions.md)。

## 第 3 步 —— 通用绑定

`item_binding` 是通用的数据表：键是物品，值里列出一些行为。

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:qi_pill": {
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
  }
}
```

- `conditions` 决定能不能使用。写成裸条件的条目是静默的；写成 `{condition, description}` 的条目会在物品提示框里显示绿色的 `✔` 或红色的 `✖`，`description` 是**语言键**（上例就是 `condition.example.needs_qi_chain`）。想知道玩家为什么用不了这件物品，这是最省事的办法。
- `conditions` 只在"开始使用"这道门上查一次。**行为执行时不复查**，所以开始使用之后条件发生变化，既不会撤销这一次结算，也不会补跑。
- `actions` 是一个**数组**（这里不能写单个对象），在一次完整的使用周期结束时按顺序执行。对丹药来说就是"吃掉之后"。任何实体行为都可以放在这里。

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
  "elements": ["example:fire"],
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "quality": "example:refined"
}
```

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:root_pellet": {
      "actions": [
        {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
      ]
    }
  }
}
```

灵根才是让火元素变得有意义的东西：它改变修炼倍率，而它的 `element_ability_modifier` 会缩放 `element_affinity` 包含火的技能——伤害那一侧由[伤害管线](/technical/damage)自动乘上，技能定义里写基础数值就够了。灵根与体质的完整字段见[定义灵根与体质](./define-spirit-roots-and-physiques.md)。

## 第 4 步 —— 丹药

丹药是两张表：`pill` 写"吃下去发生什么"，`pill_binding` 写"哪些物品是它、这一族能用几次"。两张表都不与其它绑定共用字段。

```json
// data/example/mxt/pill/qi_pill.json
{
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

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "pill": "example:qi_pill",
  "max_uses": 3,
  "cooldown": 40
}
```

- `toxicity_gain` 在玩家身上累积；累计值达到 `toxicity_threshold` 时执行 `on_overdose`，并把丹毒设成 `toxicity_after_overdose` 而不是 `0`，所以反复过量会持续受到伤害。
- 默认阈值是 `Double.MAX_VALUE`，意思是"永不过量"。请有意地设置它。
- `on_consume` 在正常消耗流程结束之后执行，与 `item_binding` 的行为彼此独立：同一枚丹药同时命中两张表时两个都会跑，`item_binding` 的行为在前、`on_consume` 在后，`on_overdose` 在丹毒越线之后。
- **次数与冷却只跟绑定走。** 只写组件、或者这件物品没有被任何绑定认领时，这一口不计次数也没有冷却；绑定只有 `items` 这一条入口，所以上面那条必须点名 `kubejs:qi_pill`。

`item_binding` 与这两张表可以用在同一个物品上；它们携带不同的字段，谁也不覆盖谁。

## 第 5 步 —— 武器绑定

```json
// data/mxt/data_maps/item/weapon_binding.json
{
  "values": {
    "kubejs:spirit_sword": {
      "attributes": [
        {"attribute": "minecraft:attack_damage", "id": "example:spirit_sword/damage", "amount": 8, "operation": "add_value"},
        {"attribute": "minecraft:attack_speed", "id": "example:spirit_sword/speed", "amount": -2.4, "operation": "add_value"}
      ],
      "use_action": {"type": "mxt:no_op"},
      "attack_action": {
        "type": "mxt:target_action",
        "action": {"type": "mxt:damage", "amount": 3}
      },
      "tick_action": {"type": "mxt:no_op"}
    }
  }
}
```

- 武器自己的攻击力与攻速也写成 `attributes` 条目（`minecraft:attack_damage` / `minecraft:attack_speed`），它们是**加法叠加**在物品自身的修正之上；想改掉底材自带的数值要改物品的 `minecraft:attribute_modifiers`（组件补丁或 KJS），这一层不替换它。
- `use_action` 是右键使用时执行的实体行为；`attack_action` 是命中成功时执行的双实体行为，所以这里的 `mxt:target_action` 会对目标额外造成 3 点伤害；`tick_action` 在手持该武器时每 tick 执行，是放置维护、粒子或灵气抽取的地方。
- 三个钩子**只认主手**，而且 `use_action` 在你瞄准方块或生物时不触发（那一次右键不会走"使用物品"这条路）。想放在副手上用，只有 `attributes` 会生效。
- `attributes` 里的条目和原版属性修饰符同形；带 `value` 公式的条目每 tick 重新计算。

## 第 6 步 —— 功法与手册

功法是逻辑；`technique_binding` 描述这门功法**怎么被读**——长按时长、姿势、音效、品质链与条件，并声明本体为它生成的载体用哪件物品。它**没有任何行为钩子**，这一点和另外三张表不同。

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

**这一叠是不是手册，先看堆上的组件，然后才看这张表。** 上面的 `carrier_item` 只是让本体替这门功法生成载体（在 `/picker mxt:technique` 里；**创造模式物品栏不生成载体**），真正教功法的是堆上的 `mxt:technique` 组件，所以手册要用物品组件语法取出来：

```mcfunction
give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]
```

右键手册会尝试学习 `example:azure_breath`。所有已学会的功法会同时保持生效，而在堆上带组件时即使学习失败也会占用这次交互，所以玩家无法绕过功法自己的 `learn_condition`、互斥标签或学习事件。`items` 则是**可选的第二条路**：把它写进声明（`"items": "kubejs:azure_manual"`），那件物品**不带组件**也算这门功法的手册，而堆上的 `mxt:technique` 组件依然优先。

## 在游戏里验证

```text
（重启游戏） → 四件物品这时才存在
（重新打开世界） → 绑定表这时才加载
/mxt registries validate               → 没有 Codec 错误
/mxt registries list                   → mxt:pill=1, mxt:pill_binding=1, mxt:technique_binding=1, …
```

两半各需要各自的重启：KubeJS 在启动时注册物品，而两张物品数据表与两张绑定注册表都是 Minecraft 在加载世界时读取的。`/reload` 两者都做不到——它只刷新配方、战利品表、进度、函数和 KubeJS 服务端脚本。

`/mxt registries list` 只列注册表：`item_binding` 与 `weapon_binding` 现在是数据表，不在其中。

然后在游戏里：

1. `/give @s kubejs:qi_pill`。提示框会显示品质行，条件带描述时还会显示彩色的 `✔` 或 `✖`。`mxt:has_realm` 不满足时，这枚丹药会被拒绝使用。
2. 修炼到进入境界链，然后吃一枚丹药：灵气上升 `25`，丹药毒性上升 `10`。`/mxt attachment status` 显示累积的毒性。
3. 吃十枚，过量那一行就会执行。
4. 吃一枚 `kubejs:root_pellet`：火灵根被赋予，`/mxt attachment status` 会列出它。`+25%` 的修炼倍率从下一个修炼 tick 开始生效。
5. `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]`，然后右键它，确认功法已学会、其 `+2 最大生命值` 已出现。直接 `/give @s kubejs:azure_manual`（或从创造模式物品栏拿 `kubejs:azure_manual`）拿到的那一叠**不带组件**，右键不会有任何反应，提示框里也不会出现功法。
6. 手持 `kubejs:spirit_sword`，在它的提示框里查看攻击伤害和速度，然后攻击任意目标，观察 `attack_action` 带来的额外伤害。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界带着未知物品拒绝加载 | 某个绑定注册表的 `items` 写了一个没有注册的物品 ID：作为单个 ID 会让加载失败，写在数组里则会丢弃那条读不出来的元素并记一行日志。数据表的键匹配不到物品时，那条值只是不生效。 |
| 规则静默地从不匹配 | 在注册表的 `items` 数组里（或数据表的键上）写成了 `example:qi_pill`，而脚本产生的是 `kubejs:qi_pill`（或任何其它拼写错误），于是那一项被丢弃、文件照常加载。请使用真正注册的 ID。 |
| 同一件物品上写了两个同表定义，只有一个生效 | 每张表按 `priority` 取唯一一条，同分则后处理的那个赢。想让两条都跑就合并成一个文件，或写成一个数组。 |
| 物品完全没有行为 | 规则被放进了与该物品不匹配的绑定表，或者那一堆的品质解析不出来。 |
| 绑在普通物品上的丹药右键没反应 | 这件物品由原版自己的分支应答右键（可换装且可交换、盾牌、动能武器），或者被某条长按声明认领了——两种情况都按物品自己那条路走。换一件物品，或去掉那条声明。 |
| `conditions` 明明是假的，行为还是跑了 | 条件只在开始使用时查一次，之后不再复查。 |
| 有些钩子写了却没反应 | 钩子写在了不声明它的那张表上（例如 `item_binding` 里写 `use_action`）。未声明的键会被静默忽略。 |
| 提示框里的勾叉和预期不符 | 品质自己也能带条件，那一个 `✖` 可能来自品质而不是绑定。 |
| 新物品在 `/reload` 后不出现 | 物品注册发生在启动阶段；请重启游戏。 |
| 改过的绑定没有任何变化 | `/reload` 不会重新读取数据包注册表，也不会重读数据表；请重新加载世界。 |
| 手册没有效果也没有报错 | 先确认那一叠上有没有 `mxt:technique` 组件——没有组件的普通物品什么都不教。有组件时再看学习是否失败：`learn_condition`、是否已经学过同一门功法，或互斥冲突。 |
| 手册的 `items` 字段没起作用 | `items` 是**可选**的第二条路，而且堆上的 `mxt:technique` 组件优先。写进去的物品 id 必须与脚本注册的真实 id 一致（`kubejs:` 命名空间别漏），否则它认领不到那一堆。 |

## 接下来

- [KubeJS 绑定行为](./bind-actions.md) —— 四张表各有哪些钩子、什么时候执行、条件与顺序怎么算。
- [定义品质链](./define-a-quality-chain.md) —— 这三档是怎么写出来的，以及升级那一步的代价放在哪一档。
- [定义技能](./add-an-ability.md) —— 让这些物品有地方花掉它们储存的灵气。
- [物品绑定](../datapack/json/item_binding.md)、[丹药](../datapack/json/pill.md)、[丹药绑定](../datapack/json/pill_binding.md)、[武器绑定](../datapack/json/weapon_binding.md) 和 [功法绑定](../datapack/json/technique_binding.md) —— 完整字段列表。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 脚本对象，如果你想用脚本写规则本身。
