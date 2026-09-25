---
title: 定义灵气与境界
description: "用 JSON 搭建核心修炼循环：一个灵气、一个元素、一条线性境界链、一个修炼行为、一个最小的灵气区域，以及如何在游戏里逐步校验。"
---

# 定义灵气与境界

本篇教程搭建 MiXianTu 能跑起来的最小修炼循环：一个由玩家填充的、被存储的 **resource**，一个把这个数字变成带境界链的灵气的 **aura** 定义，一个把灵气送进它的**修炼行为**，以及一个很小的**灵气区域**，让世界真的含有灵气。做完之后，玩家可以按下修炼按键，看着资源条涨起来，并突破到自己的第一个境界。

这里没有任何内容是绑定某个世界观的：下面的数字都是占位值，你应该把它们替换掉。

::: info 开始之前

如果还没读过，请先读[数据包开发总览](../datapack/overview.md)。它说明了文件放在哪里、定义 ID 如何工作、为什么一个缺失的 Holder 引用会让整次加载失败，以及你的修改什么时候生效。

:::

## 循环的形状

```text
aura_zone / block_aura        the world supplies aura per chunk
        ↓
cultivate_action              the player absorbs it while cultivating
        ↓
aura  example:qi              the definition that turns the stored number into an aura
        ↓
resource  example:qi          the bar fills; the overflow becomes progress
        ↓
realm_stage chain             progress + conditions + costs → next realm
```

还没有进入境界链的玩家是**凡人**。凡人状态没有自己的定义：它由 aura 定义描述，通过 `start_exp`（所需的修为，同时也是硬上限）和 `first_realm`（首次突破的目标境界）。

## 你要搭建什么

| 文件 | 注册表 | 用途 |
| --- | --- | --- |
| `element/common.json` | `element` | qi 灵气所指的元素，以及它的关系和颜色。 |
| `resource/qi.json` | `resource` | 被存储的数字、它的边界和它的 HUD 条。 |
| `aura/qi.json` | `aura` | 加在那个数值上的灵气定义：元素标记、自然恢复、境界入口。 |
| `realm_stage/qi_condensation.json` | `realm_stage` | 第一个境界，以及对第二个境界的要求。 |
| `realm_stage/foundation.json` | `realm_stage` | 第二个境界。 |
| `realm_stage/core_formation.json` | `realm_stage` | 第三个境界，链条的终点。 |
| `cultivate_action/meditation.json` | `cultivate_action` | 玩家修炼时做的事。 |
| `aura_zone/common_land.json` | `aura_zone` | 主世界里平原级别的灵气供给。 |
| `assets/example/lang/en_us.json` | — | 上面这些 ID 的名称。 |

## 第 1 步 —— 元素

定义的灵气是一个独立的 `aura` 条目，而它通过 `aura_type` 指向的正是 `element` 注册表。一个 `element` 只持有关系和一个颜色：它 `overcomes` 哪些元素、`adapted_to` 哪些元素、每条关系值多少伤害，以及用于灵气消耗文本的颜色。先从一个最小的开始。

```json
// data/example/mxt/element/common.json
{
  "color": "#66CCFF"
}
```

`overcomes` 与 `adapted_to` 是指向其他元素的可选关系。每个条目写出它指向的元素（`elements`，单个 ID、数组或 `#` 标签）以及这条关系值多少（`multiplier`，有限非负数），[伤害系统](../technical/damage.md)会分别在攻击方与受击方读取它们；在你拥有不止一个元素之前，可以先不写。完整字段表见 [element（元素）](../datapack/json/element.md)。

## 第 2 步 —— 灵气与它的数值

`resource` 只是一个带边界和资源条的存储数值；`aura` 则给这个数值以灵气身份与修炼行为，并通过 `resource` 字段一对一地指回它。先把两个文件都写出来，再看下面的表。

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "50 + realm_rank * 50 + absorbed_aura * 0.2",
  "particle_color": "#66CCFF",
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "order": 0,
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
  "regen": "0.05 + realm_rank * 0.05",
  "aura_type": "example:common",
  "first_realm": "example:qi_condensation",
  "start_exp": 100
}
```

| `resource` 字段 | 它在这里的作用 |
| --- | --- |
| `default_value` | 新玩家从空开始。必填。 |
| `max` | 资源条的上限。写成公式，因为 `max` 是在该数值的灵气上下文中求值的，那里有 `realm_rank` 和 `absorbed_aura`。必填。 |
| `particle_color` | 该数值发射的灵力射线颜色。 |
| `bars` | 左列中的一条自身 HUD 条；`renderer` 必填，且每条资源条都需要一个 `anchor`。 |

| `aura` 字段 | 它在这里的作用 |
| --- | --- |
| `resource` | 该定义描述哪个存储数值。必填，且一个数值最多只能有一个灵气定义。 |
| `regen` | 缓慢的细流，让池子在打坐之外也能回填。 |
| `aura_type` | 该灵气所指的元素；环境与灵气燃料用它做类型判定，`/mxt aura query` 会把它显示在名字旁边。 |
| `first_realm` | 首次突破的目标。没有它，凡人永远离不开凡人状态。 |
| `start_exp` | 凡人所需的修为进度，也是他们突破前无法越过的上限。 |

本篇教程其他地方用到的 aura 字段还有 `cultivation_to_resource` 与 `resource_to_cultivation`（修为与存储数值之间的换算）、`burst_amount`（一发灵力射线的数值）、`start_cultivate_conditions`（开始修炼前检查）和 `show_cultivation_info`（角色信息面板是否显示境界与修为进度）。完整列表见 [aura（灵气）](../datapack/json/aura.md)。

`min` 默认为 `0`，`use_condition` 默认为恒真，所以凡人也能看到这条资源条。如果你更想让玩家进入境界链之前隐藏这条资源条，就把它加到 aura 上：

```json
"use_condition": {"type": "mxt:has_realm", "aura": "example:qi"}
```

`use_condition` 只控制显示和玩家的主动消耗。它从不阻止修炼、吸收或突破。完整字段表见 [aura（灵气）](../datapack/json/aura.md)。

::: tip 公式

任何数值字段都接受普通数字、公式字符串或带类型的提供器对象。公式用 exp4j 求值，除上下文变量外还可以使用 `round`、`clamp`、`min`、`max`、`pi` 和 `e`。见[公式变量](../datapack/types/formula_variables.md)。

:::

## 第 3 步 —— 境界链

每个 `realm_stage` 文件是一个阶段。一个阶段只指向一个 aura，`next_realm` 只指向一个阶段，因此链条是一条直线：一个 aura 只有一条链，而且只能向前。真正被填满的是 aura 所指的那个数值。

```json
// data/example/mxt/realm_stage/qi_condensation.json
{
  "aura": "example:qi",
  "next_realm": "example:foundation",
  "breakthrough_exp": 800,
  "max_experience": 1600,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:realm/qi_condensation",
      "amount": 2,
      "operation": "add_value"
    }
  ],
  "costs": [{"id": "example:qi", "amount": 50}],
  "auto_breakthrough": false
}
```

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "next_realm": "example:core_formation",
  "breakthrough_exp": 2000,
  "max_experience": 4000,
  "breakthrough": {
    "conditions": [
      {"type": "mxt:resource_compare", "resource": "example:qi", "min": 200}
    ]
  },
  "costs": [{"id": "example:qi", "amount": 200}],
  "auto_breakthrough": false
}
```

```json
// data/example/mxt/realm_stage/core_formation.json
{
  "aura": "example:qi",
  "max_experience": 8000,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:realm/core_formation",
      "amount": 6,
      "operation": "add_value"
    }
  ]
}
```

把三个文件放在一起读：

- `breakthrough_exp` 是**离开**该阶段所需的修为，`max_experience` 是你身处其中时的修为上限。两者不能交叉：常量 `breakthrough_exp` 大于常量 `max_experience` 会在加载期被拒绝。
- 可选的 `minor_stages` 是子境界：写数组就是名字本身（字符串当翻译键、对象当完整组件），写一个整数 N 就是「这么多重」——名字按条目 id 自动生成为 `realm_stage.mxt.<命名空间>.<路径>.minor_stage.<下标>`，下标从 `0` 起。它影响三处：信息面板在境界名后写出当前这一重、公式里多一个从 `0` 起的 `minor_stage`、以及 `minor_stage_abilities` 用这个下标按层解锁能力（累计，解锁过就永久保留）。切分是把本阶段的 `breakthrough_exp` 均分，不改变阈值、消耗或任何结算。
- `costs` 在突破成功时支付；`breakthrough.conditions` 与修为一起检查。两者都属于你正要离开的那个阶段——只有最开始的一步例外，那时阈值来自 aura 的 `start_exp`，条件来自目标阶段的 `breakthrough`。
- `auto_breakthrough` 默认为 `false`：玩家到达阈值后要自己等。想让修炼模式自行尝试突破就设为 `true`。
- `passive_modifiers` 是在该阶段被持有期间授予的原版属性修正。`value` 是可选的公式，声明了它的条目每 tick 重新计算。
- 最后一个阶段只是没有 `next_realm`，链条就在这里结束。

::: warning 境界条件不是 `caster_level`

在数值、境界或突破公式里，`level`、`realm` 和 `realm_rank` 都是链内序号。在技能数值这样的**实体**公式里，`caster_level` 是原版经验等级，而根本没有境界序号。在数值与境界字段里用 `realm_rank`，让意图显而易见。

:::

## 第 4 步 —— 修炼行为

`cultivate_action` 是一个具名活动。玩家选择其中一个，它按固定间隔结算。

```json
// data/example/mxt/cultivate_action/meditation.json
{
  "default": true,
  "tick_interval": 20,
  "absorb_amount": 1.5,
  "aura_costs": [{"type": "mxt:aura", "aura": "example:qi", "amount": 1}],
  "cooldown": 100
}
```

| 字段 | 效果 |
| --- | --- |
| `default` | 玩家没有选择其他行为时使用。没有任何默认行为时，使用注册表中的第一个行为。默认 `false`。 |
| `tick_interval` | 结算间隔，单位 tick，范围 `1..72000`；`20` 表示每秒一次。默认 `20`。 |
| `absorb_amount` | 当前境界数值自然恢复的倍率；先填满资源条，溢出量成为修为。默认 `1`。 |
| `aura_costs` | 每 tick 从修炼者所在位置的**共享灵气池**扣除的灵气消耗，只写 `mxt:aura` 条目（`[{"type": "mxt:aura", "aura": "example:qi", "amount": 1}]`）。多人同区块修炼时，各人的量先按池子分配份额缩放，再由池子**全有或全无**地扣。 |
| `cooldown` | 停止后再次开始修炼前的冷却 tick。默认 `0`。 |

`start_condition` 与 `condition` 决定修炼能否开始与继续；两者默认恒为真，并且都能读取环境。没有“灵气种类”字段：只应在正确地点运行的行为会直接要求那个地点，例如用 `mxt:aura_range`（某一门灵气的浓度区间，每一项都必填 `max`）或 `mxt:dimension`。剩下的字段是 `costs`（每 tick 从修炼者身上扣的消耗，`Cost` 数组、全有或全无）、`aura_gains`（每 tick 额外增加的灵气）和 `tick_action`（每次修炼 tick 运行的实体行为）。

## 第 5 步 —— 一个最小的灵气区域

没有灵气区域，世界里就不含灵气，打坐行为也就没有东西可以吸收。

```json
// data/example/mxt/aura_zone/common_land.json
{
  "aura": {
    "example:qi": {
      "amount": 200,
      "max": {"type": "mxt:initial_multiplier", "multiplier": 2},
      "regen_per_tick": 0.05,
      "color": "#66CCFF"
    }
  },
  "distribution": "equal",
  "biomes": ["#minecraft:is_overworld"]
}
```

- `aura` 是按灵气分组的环境库存，按区块存储，由该区块里的所有人共享。它的键集合就是该区域的全部词汇：一个环境拥有且仅拥有它列出的那些灵气。它们各自属于哪个元素来自那门灵气自己的 `aura_type`，所以这里不需要额外声明什么。
- `amount` 是模板的**基础**灵气，不是 HUD 显示的数字：没有配置噪声时，初始浓度是 `max(0, amount / 10 - 5)`，因此 `200` 从大约 `15` 开始，而 `max` 从那个初始值解析——这里是 `initial_multiplier: 2`，所以该区块最多能容纳约 `30`。
- `regen_per_tick` 随时间回填区块库存。
- `distribution` 决定库存不足时多名玩家如何分配：`random`、`equal` 或 `realm_weighted`。
- `biomes` 与 `dimensions` 决定模板在哪里生效；`#minecraft:is_overworld` 覆盖主世界的全部群系。维度级绑定优先于群系级，两者都低于手动区域和阵法。
- `cultivate_condition` 是环境自己给修炼加上的条件；它默认恒为真，想让某处要求浓度就在区域里写 `mxt:aura_range`。行为自己的 `start_condition`/`condition` 是同一个判定的另一侧。

灵气环境的深度值得单独一篇页面——那就是[搭建灵气环境](./aura-environment.md)，你会在那里加入更浓的区域、方块来源、物品燃料以及客户端的雾效和 HUD。

## 第 6 步 —— 名称

显示名称默认由定义 ID 自动生成，所以你不需要把翻译键写进 JSON —— 除非你想自己写名字：`resource`、`aura`、`realm_stage`、`element`、`cultivate_action` 等 19 个注册表的定义都可以写可选的 `name` / `description`（两者都可省略，省略时按 id 生成键）。把这些键加到你自己的语言文件里：

```json
// assets/example/lang/en_us.json
{
  "resource.mxt.example.qi": "Spirit Qi",
  "aura.mxt.example.qi": "Spirit Qi",
  "realm_stage.mxt.example.qi_condensation": "Qi Condensation",
  "realm_stage.mxt.example.foundation": "Foundation Establishment",
  "realm_stage.mxt.example.core_formation": "Core Formation",
  "element.mxt.example.common": "Common Aura",
  "cultivate_action.mxt.example.meditation": "Meditation"
}
```

规则始终是 `<category>.<registry namespace>.<namespace>.<path>`，其中 category 是注册表自己的 path，而**注册表命名空间恒为 `mxt`**，所以 `resource` 里的 `example:qi` 是 `resource.mxt.example.qi`，同一个 ID 在 `aura` 里则是 `aura.mxt.example.qi`。含有 `/` 的 path 会保留斜杠：`example:realm/qi` 是 `realm_stage.mxt.example.realm/qi`。没有键的定义依然可用；游戏只会显示原始键名。

定义自带文本字段时用的是**同一个键**：`quality` 的 `name` / `description` 省略时拿到 `quality.mxt.<命名空间>.<路径>`（描述再加 `.description`，例如 `mxt_test:poor` 是 `quality.mxt.mxt_test.poor`），`realm_stage` 用整数写法声明子境界时拿到 `realm_stage.mxt.<命名空间>.<路径>.minor_stage.<下标>`。除了 `quality` 的 `description`（品质名下面那一行），这些字段目前只被存储与读取，还没有地方绘制它们。

## 第 7 步 —— 加载与校验

数据包注册表在世界加载时读取，所以只执行 `/reload` 不够：退回标题界面重新打开世界（或重启服务器），并留意日志里的 Codec 错误。无法解码的文件会让世界加载不了，所以如果世界打不开，先读日志里最后一条错误并修好那个文件。

```text
(load the world again)
/mxt registries validate          → registries loaded, no errors
/mxt registries list              → mxt:resource=1, mxt:aura=1, mxt:realm_stage=3, mxt:element=1, mxt:cultivate_action=1, mxt:aura_zone=1, … (every registry the mod registers is listed, most of them empty)
/mxt resource example:qi          → 0
/mxt aura query example:qi        → the aura inventory of your chunk
/mxt cultivate status             → the selected behaviour and the progress per aura
```

然后在游戏里：

1. 在主世界某处按下修炼按键（默认 `C`）。资源条出现在左列并开始填充。
2. 继续修炼直到条满；从那时起溢出量成为修为。`/mxt cultivate status` 与 `/mxt attachment status` 会显示当前进度。
3. 修为到 `100`——aura 的 `start_exp`——时，凡人阶段就封顶了，突破成为可能。因为 `auto_breakthrough` 是 `false`，你自己用 `/mxt breakthrough example:qi` 触发（需要 `gamemaster` 权限），或者设 `auto_breakthrough: true` 让修炼自己完成。
4. 成功后你就处于炼气期：`/mxt attachment status` 显示新境界，`50 + realm_rank * 50` 的上限变大，`+2 max health` 修正也被应用。
5. 用同样的方式爬到筑基。你需要池子里同时有 `200` 点灵气，因为那个阶段的 `breakthrough.conditions` 要求它，而 `costs` 会花掉 `200` 点灵气。

::: tip 更快地测试

`/mxt resource example:qi set 500`（同样需要 `gamemaster`）会立刻填满池子，让你不用等待就能检查消耗与条件门槛。`/realm set example:foundation`（= `/mxt realm set …`）直接把链条跳到某个阶段，在调后续阶段时很有用；`/realm chain example:foundation` 会打印这一档所在的整条链，当前那一档是绿色、它之前灰色、之后白色，写错 `next_realm` 时一眼就能看出来。

:::

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 谁都无法离开凡人 | aura 上缺少 `first_realm`，没有可以突破到的阶段。 |
| 修炼从不开始 | 行为的 `start_condition` 或 `condition` 不满足——为你想要的地点写一个 `mxt:aura_range` 或群系条件，因为没有可匹配的“灵气种类”词汇。 |
| 资源条从不增长 | 共享灵气池付不出 `aura_costs`（池子本身不够，或那份被同区块的其他修炼者分掉），或者 `use_condition` 为假。 |
| 世界拒绝加载 | 有定义解码失败：某个必填 Holder 指向不存在的 ID，或某个字段形状不对。整次加载都会失败，而不只是那个文件。 |
| `breakthrough_exp` 大于 `max_experience` | 该阶段无法离开；两者都是常量时，Codec 会在加载期拒绝。 |
| 境界条件从不通过 | `mxt:realm` 比较的是**当前**阶段；你本意是“本级或更后”时，用 `"comparison": "at_least"`。 |

## 接下来

- [搭建灵气环境](./aura-environment.md) —— 让浓度随地点、方块和时间变化，并把它放到 HUD 上。
- [resource（资源）](../datapack/json/resource.md)与 [realm_stage（境界阶段）](../datapack/json/realm_stage.md) —— 所有剩下的字段，包括资源条、换算和天劫。
