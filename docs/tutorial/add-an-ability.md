---
title: 添加技能
description: 定义一个主动技能与一个触发技能，为它们设置消耗、条件与目标，从境界或物品授予它们，并从技能快捷栏施放。
---

# 添加技能

`ability` 是玩家消耗灵气的玩法单位。它自带消耗、冷却、条件、目标选择与行为，也就是说一个 JSON 文件就能描述一发灵力弹、一个增益、一条被动加成，或一次受击反应。

本篇教程给示例包加上两个技能：一个从快捷栏施放的主动灵力弹，以及一个对伤害做出反应的触发恢复。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/qi_bolt.json` | 一个带消耗、冷却与范围目标的主动技能。 |
| `data/example/mxt/ability/qi_recovery.json` | 一个对受伤做出反应的触发技能。 |
| `data/example/mxt/realm_stage/foundation.json` | *（编辑）* 突破时授予这发灵力弹。 |
| `data/example/mxt/item_binding/root_pellet.json` | *（编辑）* 同时授予恢复技能。 |
| `data/example/mxt/technique/azure_breath.json` | *（编辑）* 学会后同时授予两者。 |

## 第 1 步 —— 一个主动技能

```json
// data/example/mxt/ability/qi_bolt.json
{
  "ability": {"type": "mxt:active", "slot": "primary"},
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

| 字段 | 作用 |
| --- | --- |
| `ability.type` | 从内置的 `ability_type` 注册表中选择生命周期：`empty`、`active`、`triggered`、`modifier`、`aura`、`channelled`、`composite`、`word`。`mxt:active` 是出现在技能快捷栏上的类型。 |
| `ability.slot` | 快捷栏槽位分组，默认为 `primary`，且不能为空。 |
| `icon` | 可选。裸字符串是 16x16 的 GUI 贴图；对象是物品堆模板（`{"id": ...}`，可带 `count` 与 `components`）。不写时该条目用名字绘制。 |
| `costs` | `Cost` 对象列表，在行为执行前支付。`mxt:resource` 消耗资源，`mxt:item` 消耗物品，而 `{"id": ..., "amount": ...}` 简写等价于 `mxt:resource`。 |
| `cast_time` | 施法时长，单位 tick；施法期间快捷栏会绘制一条施法进度条。 |
| `cooldown` | 冷却时间，单位 tick，会回报给客户端，让快捷栏把该槽置灰。 |
| `condition` | 技能可用前必须满足的实体条件。它在这里的唯一职责是不让凡人丢出灵力弹。对 `mxt:modifier` 或 `mxt:aura` 这类被动技能，同一字段在施放之后仍然生效：每 tick 重算一次，不满足时被动效果被撤下。 |
| `target_selector` | 双实体行为作用于哪些实体。`mxt:self`（默认）只选施法者；`mxt:area` 选中 `radius` 范围内的一切（上限 128），`include_actor` 决定施法者是否在该集合内。 |
| `bi_entity_action` | 对每个选中的目标执行，某一个失败不会阻止其余目标。`mxt:target_action` 把一个实体行为转交给目标——这里是 6 点伤害加上施法者经验等级的一半。 |
| `entity_action` | 对施法者执行。默认为 `mxt:no_op`；用于自我增益、粒子爆发或灵气变化。 |

还有两个字段值得了解：

- `components` 添加的是状态而不是一个普通数字：`mxt:charges`、`mxt:cooldown`、`mxt:toggle`、`mxt:timer`、`mxt:resource` 与 `mxt:target_lock`。它们各自声明一个存储槽，值住在拥有该授予的那份技能附件里，按技能 ID 寻址；至于目前是否真的有人读取它们，见[数据存储类型](/datapack/types/other/ability-and-curse#data-storage-type)。
- `element_affinity` 列出该技能所属的元素（或元素标签）。它非空时，公式变量 `element_modifier` 就可用，可以按施法者灵根的匹配程度缩放伤害或消耗。

::: warning 境界序号从哪来

技能公式运行在**实体**上下文中。它提供 `caster_health`、`caster_max_health`、`caster_level`（原版经验等级）、`caster_<resource>` 和 `caster_<attribute>`——但没有 `realm_rank`，后者只存在于按某个数值求值的公式里。技能要随施法者灵气缩放时，用 `caster_example_qi`。

:::

## 第 2 步 —— 一个触发技能

触发技能在世界对它的持有者做了某件事时发动。触发器还会注入几个描述刚发生了什么事的变量。

```json
// data/example/mxt/ability/qi_recovery.json
{
  "ability": {
    "type": "mxt:triggered",
    "triggers": [{"type": "mxt:hurt"}],
    "chance": 1
  },
  "cooldown": 100,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "costs": [
    {"type": "mxt:resource", "resource": "example:qi", "amount": 5}
  ],
  "entity_action": {"type": "mxt:heal", "amount": "2 + damage * 0.5"}
}
```

- `triggers` 是内置匹配器的列表：`tick`、`attack`、`hurt`、`kill`、`block_break`、`block_use`、`item_use`、`equip`、`death`、`breakthrough` 和 `technique_stage`。它们都不带自己的字段。
- `chance` 是数值提供器，默认 `1`，每命中一次触发器掷一次。
- `hurt` 触发器注入 `damage`——实际造成的伤害——所以治疗量可以随这一击缩放。其他触发器注入各自的名字：`attack` 注入 `target_health` 与 `target_is_living`，方块事件注入 `block_x/y/z`，`item_use` 注入 `use_duration`，等等。

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

## 第 4 步 —— 使用技能快捷栏

主动技能出现在共用的客户端 Hotbar 上：

1. `/mxt ability` 打开技能条目的**配置快捷栏**界面。你刻意留空的槽位会保持为空，而保存的条目如果对应技能已不存在，会从当前运行时列表重新填充。
2. 按住技能按键（默认 `LAlt`，“显示技能快捷栏”）再按数字键 `1`～`9` 施放该槽位的条目。可以同时按住多个数字键；客户端设置“打开方式”可在“按住显示”与“按下切换”之间切换。
3. 一切都是服务端权威：客户端只发送使用或取消请求，消耗、冷却、时长与效果都由服务端决定。取消引导技能走的也是同一条路。

## 第 5 步 —— 校验

技能是数据包注册表，所以要重新加载世界，而不是执行 `/reload`：

```text
(load the world again)
/mxt registries validate              → no codec errors
/mxt attachment status                → lists the abilities the entity holds
/mxt ability cast example:qi_bolt     → forces the cast (gamemaster permission)
```

1. 在进入境界链之前，`/mxt ability cast example:qi_bolt` 会失败：`condition` 拒绝了它。
2. 突破到筑基并查看 `/mxt attachment status`。现在灵力弹已被持有，`source` 显示它来自境界。
3. 用 `LAlt` 打开快捷栏并施放它。会扣除 `10` 点灵气，冷却开始，附近的实体会受到伤害。对比施放前后 `/mxt resource example:qi` 显示的值。
4. 用 `/mxt resource example:qi set 5` 把池子调得过低再施放：因为付不起消耗，施放被拒绝，且不会扣除任何东西。
5. 在持有 `qi_recovery` 时挨一次打：治疗量随受到的伤害缩放，消耗 `5` 点灵气，100 tick 的冷却让它不会立刻再次发动。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 技能从不显示在快捷栏上 | 只有 `mxt:active` 技能会被列出；触发、被动或引导类技能没有自己的快捷栏条目。 |
| 引导技能无法从快捷栏释放 | `mxt:active` 与 `mxt:channelled` 是互斥的类型。把这个引导技能包成某个 `mxt:composite` 技能的子技能，并让该复合技能成为顶层定义。 |
| 消耗从未被扣除 | `ResourceCost` 用的是 `resource`，而技能的 `costs` 是 `Cost` 的列表。写 `{"type": "mxt:resource", "resource": ..., "amount": ...}` 或 `{"id": ..., "amount": ...}` 简写——不要写成没有 `type` 的 `{"resource": ...}`。 |
| 技能公式永远是 `0` | 它用了自己的上下文不提供的变量，例如在实体公式里用 `realm_rank`。求值时会报出这个名字：开发环境记录完整错误，生产环境对每条不同消息记一行警告，两者都按 `0` 继续。 |
| `mxt:word` 什么都不做 | 它是终端效果、由代码白名单限定（`self_heal`、`purge_self_curses`），并且默认需要管理员权限。它不是执行命令的手段。 |
| 所有人一开始就有这个技能 | 它是被某个灵根、体质或功法上的 `granted_abilities` 列表授予的，而所有人都满足那个定义——这些列表在定义被持有期间生效。 |

## 接下来

- [ability（技能）](../datapack/json/ability.md) —— 完整字段表，包括 `components` 与引导技能的维持消耗。
- [行为类型](../datapack/types/action/entity_action_types.md)与[条件类型](../datapack/types/condition/entity_condition_types.md) —— 技能能做和能检查的一切。
- [战利品与进度条件](../datapack/loot-and-criteria.md) —— 对突破与技能使用做出反应的奖励和进度。
