---
title: 定义技能
description: 定义一个主动技能与一个触发技能，为它们设置消耗、条件与目标，从境界或物品授予它们，再把它们放上轮盘。
---

# 定义技能

`ability` 是玩家消耗灵气的玩法单位。它自带消耗、冷却与条件，也自带**动作字段**（`entity_action` / `target_selector` / `target_condition` / `bi_entity_action`），也就是说"什么时候放"与"放出去做什么"写在**同一条技能**里。照着这个形状，一条 JSON 就能描述一发灵力弹、一个增益、一条被动加成，或一次受击反应。

本篇教程给示例包加上两条技能：一个放上轮盘施放的主动灵力弹，以及一个对伤害做出反应的触发恢复。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/qi_bolt.json` | 主动灵力弹：带消耗、冷却与条件，按下时跑自己的四个动作字段。 |
| `data/example/mxt/ability/qi_recovery.json` | 触发恢复：对受伤做出反应，命中时跑自己的动作字段。 |
| `data/example/mxt/realm_stage/foundation.json` | *（编辑）* 突破时授予这发灵力弹。 |
| `data/example/mxt/item_binding/root_pellet.json` | *（编辑）* 同时授予恢复技能。 |
| `data/example/mxt/technique/azure_breath.json` | *（编辑）* 学会后同时授予两者。 |

## 第 1 步 —— 一个主动技能

```json
// data/example/mxt/ability/qi_bolt.json
{
  "type": "mxt:active",
  "icon": "example:textures/gui/ability/qi_bolt.png",
  "costs": [
    {"type": "mxt:resource", "resource": "example:qi", "amount": 10}
  ],
  "cast_time": 10,
  "cooldown": 40,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "target_selector": {"type": "mxt:area", "radius": 6, "include_actor": false},
  "bi_entity_action": {
    "type": "mxt:target_action",
    "action": {"type": "mxt:damage", "amount": "6 + caster_level * 0.5"}
  }
}
```

这条技能读到的字段（`cooldown` 与下面那四个动作字段**都不是通用字段**——前者只有会付款的类型读，后者只有会跑动作的类型才声明）：

| 字段 | 作用 |
| --- | --- |
| `type` | 从内置的 `ability_type` 注册表中选择生命周期，**直接写在顶层**（不是嵌套的 `ability` 对象）：`empty`、`active`、`triggered`、`modifier`、`aura`、`interval`、`channelled`、`targeted`、`composite`、`word`、`mount`、`flight_control`、`storage`、`upkeep`。`mxt:active` 是能放进轮盘的类型；`mxt:targeted` 同样需要按键，但它是"挑一批目标、在它们身上各跑一次另一条技能"，见[定向施放](../datapack/json/ability.md#targeted)。 |
| `icon` | 可选。裸字符串是 16x16 的 GUI 贴图；对象是物品堆模板（`{"id": ...}`，可带 `count` 与 `components`）。不写时该条目用名字绘制。 |
| `costs` | `Cost` 对象列表，在行为执行前支付，整份数组**全有或全无**。`mxt:resource` 消耗数值，`mxt:aura` 按灵气身份扣该灵气所度量的数值，`mxt:item` 消耗物品，`mxt:js` 交给脚本（最后运行），而 `{"id": ..., "amount": ...}` 简写等价于 `mxt:resource`。 |
| `cast_time` | 施法时长，单位 tick。 |
| `cooldown` | 冷却时间，单位 tick，会回报给客户端，让轮盘把那一扇画暗并在中间写「冷却中 4.3s」（剩余秒数，永远一位小数）。 |
| `condition` | 技能可用前必须满足的实体条件。它在这里的唯一职责是不让凡人丢出灵力弹。对 `mxt:modifier` 或 `mxt:aura` 这类被动技能，同一字段在施放之后仍然生效：每 tick 重算一次，不满足时被动效果被撤下。 |

`mxt:active` 自己还会声明这四个动作字段——**它们不是技能的通用字段**，只有会跑动作的类型才声明它们：

| 字段 | 作用 |
| --- | --- |
| `target_selector` | 双实体行为作用于哪些实体。`mxt:self`（默认）只选施法者；`mxt:area` 选中 `radius` 范围内的一切（**方盒**不是球，上限 128），`include_actor` 决定施法者是否在该集合内；也可以换成 `mxt:ray`（沿视线的圆柱）或 `mxt:cone`（沿视线的圆锥，`angle` 是半角），三者都能用 `limit` 与 `order` 只取最近 / 最远 / 随机的几个。 |
| `bi_entity_action` | 对每个选中的目标执行，某一个失败不会阻止其余目标。`mxt:target_action` 把一个实体行为转交给目标——这里是 6 点伤害加上施法者经验等级的一半。 |
| `entity_action` | 对施法者执行。默认为 `mxt:no_op`；用于自我增益、粒子爆发或灵气变化。 |
| `target_condition` | 每个目标都要过的双实体条件，默认为 `mxt:always`。 |

四个动作字段的执行顺序永远是：`entity_action`（先跑）→ `target_selector` 取目标 → 每个目标过 `target_condition` → 通过才跑 `bi_entity_action`。完整的按类型时机表见 [ability（技能）· 四个动作字段](../datapack/json/ability.md#action-fields-by-type)。

还有几个字段值得了解：

- `charges` 是唯一留在定义上的状态参数：写 `{"maximum": ..., "recharge_ticks": ...}`（两个都必填）就让这条技能**按次数花**——每次付款扣一次，扣到 0 就拒付（失败原因 `NO_CHARGES`），剩下的次数是状态而不是声明。**只有走施放管线的付款扣它**；走共用闸门的按键（`mxt:flight_control` / `mxt:storage`）不扣充能。能存哪些状态种类由 `type` 在代码里声明，**不用也不该再写 `components`**（写了与未知键一样被静默忽略）；六种状态与读取它们的条件见[技能施放](/technical/ability)。
- `element_affinity` 列出该技能所属的元素（或元素标签）。它非空时，公式变量 `element_modifier` 就可用；**伤害**这一侧不用你操心——[伤害管线](/technical/damage)第一层会自己乘上它，所以写伤害数字时不要再手写 `* element_modifier`（那是同一个数的第二次相乘）。要拿它缩放**消耗、时长**之类不是伤害的东西，才需要显式读这个变量。
- `hidden` 只在**法器的提示框**里被跳过，照常生效、照常授予；它**不参与轮盘那道筛选**（轮盘池筛的是按键型），所以写了它一条按键技能照样占轮盘。

::: warning 境界序号从哪来

技能公式运行在**实体**上下文中。它提供 `caster_health`、`caster_max_health`、`caster_level`（原版经验等级）、`caster_<resource>` 和 `caster_<attribute>`——但没有 `realm_rank`，后者只存在于按某个数值求值的公式里。技能要随施法者灵气缩放时，用 `caster_example_qi`。

:::

## 第 2 步 —— 一个触发技能

触发技能在世界对它的持有者做了某件事时发动。触发器还会注入几个描述刚发生了什么事的变量。它自己那部分是"什么信号、多大概率"，跑什么就写在自己的动作字段上：

```json
// data/example/mxt/ability/qi_recovery.json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:hurt"}],
  "chance": 1,
  "cooldown": 100,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "costs": [
    {"type": "mxt:resource", "resource": "example:qi", "amount": 5}
  ],
  "entity_action": {"type": "mxt:heal", "amount": "2 + damage * 0.5"}
}
```

- `triggers` 是内置匹配器的列表：`tick`、`attack`、`hurt`、`kill`、`block_break`、`block_use`、`item_use`、`equip`、`death`、`breakthrough` 和 `technique_stage`。它们都不带自己的字段。
- `chance` 是数值提供器，默认 `1`，每命中一次触发器掷一次：公式抛异常或算不出有限值时这一次**不放行**，`≤0` 不放行，`≥1` 必放行，中间值按实体随机数掷。**别与 `mxt/trigger` 规则表里同名的 `chance` 混起来**——那边算不出数按 `1` 处理。
- `hurt` 触发器注入 `damage`——实际造成的伤害——所以治疗量可以随这一击缩放；触发器注入的变量同样能被这条技能自己的动作字段读到。其他触发器注入各自的名字：`attack` 注入 `target_health` 与 `target_is_living`，方块事件注入 `block_x/y/z`，`item_use` 注入 `use_duration`，等等。

完整的变量表见[公式变量](../datapack/types/formula_variables.md)。

## 第 3 步 —— 授予技能

定义技能本身不起任何作用：得有实体持有它。`mxt:grant_ability` 实体行为负责这件事，它的 `source` 字段记录是谁授予的。

**从境界授予。** 编辑玩家到达的那个境界：

```json
// data/example/mxt/realm_stage/foundation.json
"success_action": {
  "type": "mxt:grant_ability",
  "ability": "example:qi_bolt",
  "source": "example:foundation"
}
```

`success_action` 在玩家刚进入的那个阶段上运行，所以到达筑基就会教会这发灵力弹。阶段上的 `ability_requirements` 是它的镜像：列出突破前必须已经持有的技能。

**从物品授予。** 把行为加到任意绑定表里：

```json
// data/example/mxt/item_binding/root_pellet.json
"actions": [
  {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"},
  {"type": "mxt:grant_ability", "ability": "example:qi_recovery", "source": "example:root_pellet"}
]
```

**从灵根、体质或功法授予。** 那些定义有一个 `granted_abilities` 列表，在它们被持有期间生效：

```json
// data/example/mxt/technique/azure_breath.json
"granted_abilities": ["example:qi_bolt", "example:qi_recovery"]
```

::: tip 来源标识

让 `source` 保持稳定且有意义——用授予该技能的定义 ID 就是好选择。来自不同来源的技能分开记账，来源也是之后撤销时能被追溯的依据，因此两件物品可以授予同一个技能，而不会有一件悄悄把另一件的那份撤掉。

:::

## 第 4 步 —— 将技能放入轮盘并使用

主动技能可以放进 12 扇轮盘（技能与灵气共用的那个，主盘 + 随装备出现的从盘）：

1. 聊天栏打 `/wheel`（客户端命令，等同于按键「打开轮盘配置」，默认未绑定）打开**轮盘配置界面**：左边 6 列是能发射的灵气，右边 6 列是学到的技能与 Curios 槽位上法器声明的技能（只由主手 / 副手物品声明的技能不在这里，它们只在随装备出现的从盘上），下面一排 12 格就是**主盘**的 12 格（`1` 在正上方，顺时针）。左键点右边池子里的灵力弹选中它，再点某一格放进去；`Esc` 保存并关闭。你刻意留空的格子会保持为空；已保存但定义已不存在的格子会显示红色 `?`，**不会被别的条目顶替**。
2. 按住「轮盘选择」（默认 `R`）让指针指向那一格——指针决定**选中**哪一格，而选中永远不会空着：轮盘打开时就已经选中**第一个有内容的格子**（金框一开始就画在那里），指针停在空格子上不会改变已有选择。松开 `R` 只关掉轮盘，不会施放。按「轮盘使用」（默认 `V`）才施放，而且轮盘不关，可以接着换一格再按；轮盘关着时按 `V` 会施放**你上次选的那个编号此刻代表的那一格**（页没了就落到最后一个有东西的格子，编号本身不改），鼠标左键等同于 `V`。屏幕左侧那块「轮盘格」是**四列、行数随页数往下长**的整张轮盘一览，其中金色边框那一格就是"现在按 `V` 会放什么"。
3. 一切都是服务端权威：客户端只发送"用了哪一类的哪个 id"，授予、条件、消耗、冷却、时长与效果都由服务端决定。

## 在游戏里验证

技能是数据包注册表，所以要重新加载世界，而不是执行 `/reload`：

```text
（重新打开世界）
/mxt registries validate              → 没有 Codec 错误
/mxt attachment status                → 列出这个实体持有的技能
/mxt ability cast example:qi_bolt     → 强制施放一次（需要 gamemaster 权限）
```

1. 在进入境界链之前，`/mxt ability cast example:qi_bolt` 会失败：`condition` 拒绝了它。
2. 突破到筑基并查看 `/mxt attachment status`。现在灵力弹已被持有，`source` 显示它来自境界。
3. 用轮盘施放它（按住 `R`，指针指向放它的那一扇，再按 `V`）。会扣除 `10` 点灵气，冷却开始，附近的实体会受到伤害。对比施放前后 `/mxt resource example:qi` 显示的值。
4. 用 `/mxt resource example:qi set 5` 把池子调得过低再施放：因为付不起消耗，施放被拒绝，且不会扣除任何东西。
5. 在持有 `qi_recovery` 时挨一次打：治疗量随受到的伤害缩放，消耗 `5` 点灵气，100 tick 的冷却让它不会立刻再次发动。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 技能从不显示在轮盘的可选池里 | 池子里列的是**需要按键的技能**；触发、被动类技能没有自己的轮盘条目。 |
| 引导技能无法从轮盘释放 | `mxt:active` 与 `mxt:channelled` 是互斥的类型。把这个引导技能包成某个 `mxt:composite` 技能的子技能，并让该复合技能成为顶层定义。 |
| 消耗从未被扣除 | 一项消耗要么写带 `type` 的完整形状（例如 `{"type": "mxt:resource", "resource": ..., "amount": ...}`），要么写 `{"id": ..., "amount": ...}` 简写；不要写成没有 `type` 的 `{"resource": ...}`。 |
| 技能公式永远是 `0` | 它用了自己的上下文不提供的变量，例如在实体公式里用 `realm_rank`。求值时会报出这个名字：开发环境记录完整错误，生产环境对每条不同消息记一行警告，两者都按 `0` 继续。 |
| `mxt:word` 什么都不做 | 它是终端效果、由代码白名单限定（`self_heal`、`purge_self_curses`），并且默认需要管理员权限。它不是执行命令的手段。 |
| 所有人一开始就有这个技能 | 它是被某个灵根、体质或功法上的 `granted_abilities` 列表授予的，而所有人都满足那个定义——这些列表在定义被持有期间生效。 |
| 动作完全没有发生，也不报错 | `entity_action`（或 `target_selector` / `target_condition` / `bi_entity_action`）被写在了一个**不跑动作的类型**上（`mxt:modifier` / `mxt:mount` / `mxt:flight_control` / `mxt:storage` / `mxt:upkeep` / `mxt:empty` / `mxt:composite` / `mxt:word`）。这四个字段由**会跑动作的五个类型**（`mxt:active` / `mxt:triggered` / `mxt:channelled` / `mxt:aura` / `mxt:interval`）各自声明，写在别的类型上是没人读的键（不报错也不生效）——把这条技能换成会跑动作的类型，或把这些键搬到真正要跑它们的那条技能上。 |
| 写了 `"effect": "..."` 但什么也没发生 | 技能引用的 `effect` 字段**没人读**：把四个动作字段直接写在发动型自己身上，不要写 `effect` 一行；`mxt:word` 的 `effect` 是另一回事（它自己的效果枚举），不受影响。 |
| 定向技能按下去只报「没有符合条件的目标」 | `mxt:targeted` 的 `target_selector` 一个实体都没圈到，或者圈到的都被载荷技能的 `target_condition` 挡掉了：检查选择器的距离（`mxt:area` 的 `radius`、`mxt:ray` / `mxt:cone` 的 `length`）。这种落空**在付款之前**判，所以不花钱；点名的技能不能作用在目标身上时报的是另一条原因「指定的技能不能作用在目标身上」。 |

## 接下来

- [ability（技能）](../datapack/json/ability.md) —— 完整字段表，包括 `charges` 与引导技能的维持消耗。
- [行为类型](../datapack/types/action/entity_action_types.md)与[条件类型](../datapack/types/condition/entity_condition_types.md) —— 技能能做和能检查的一切。
- [战利品与进度条件](../datapack/loot-and-criteria.md) —— 对突破与技能使用做出反应的奖励和进度。
