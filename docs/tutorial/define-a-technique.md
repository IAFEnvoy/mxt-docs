---
title: 定义功法与晋级
description: "把进度链、熟练度数值与功法定义拼成一条会自己往上爬的线：等级文件怎么写、门槛写在哪、熟练度从哪来、什么时候晋升。"
---

# 定义功法与晋级

一门会升级的功法是三张表拼起来的：**进度链**（`mxt/progression/` 里一级一个文件）、**衡量熟练度的数值**（`resource`），以及**功法定义**（`technique`），它把前两者接到自己身上。等级不是第四张表——它就是进度链上的一级，链由 `next_level` 串出来。

本篇接着[定义技能](./add-an-ability.md)，给示例包里那门 `example:azure_breath` 补上这条线：它已经能被学会、能授予技能，现在让它学会之后还会往上爬。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/resource/azure_mastery.json` | 衡量这门功法熟练度的数值。 |
| `data/example/mxt/progression/azure_breath_1.json` | 链的入口级。 |
| `data/example/mxt/progression/azure_breath_2.json` | 第二级：门槛、倍率，以及它给的能力。 |
| `data/example/mxt/progression/azure_breath_3.json` | 最高级，不写 `next_level`。 |
| `data/example/mxt/technique/azure_breath.json` | *（编辑）* 接上链、点名熟练度数值、给每一级配条件与能力。 |
| `data/example/mxt/cultivation/meditation.json` | *（编辑）* 打坐结算那一拍也涨一点熟练度。 |
| `data/example/mxt/trigger/azure_mastery_from_kill.json` | 击杀也涨一点熟练度。 |

## 第 1 步 —— 熟练度就是一个数值

功法身上没有"熟练度"这个计数器：`mastery_resource` 指的是 `resource` 表里的一个数，链上每一级的 `mastery` 指的是这个数要达到多少。所以先给它一个数。

```json
// data/example/mxt/resource/azure_mastery.json
{
  "default_value": 0,
  "max": 1000,
  "particle_color": "#66CCFF"
}
```

`default_value` 与 `max` 必填，`min` 默认 `0`。**`max` 不能低于你打算写的最高门槛**：越界的变更被钳到边界、而不是被拒绝，所以门槛高于 `max` 时那条链永远爬不到顶，而且一声不响。

这个数值没有灵气定义指向它，所以它没有灵气身份：不进灵气轮盘（那张表按灵气列），也不参与灵气存储那套接口，就是一个普通的数。要在 HUD 上看到它，就在 `bars` 里写一条；功法面板上那根熟练度进度条用它的 `particle_color` 上色。

## 第 2 步 —— 一级一个文件，用 `next_level` 串起来

```json
// data/example/mxt/progression/azure_breath_1.json
{
  "next_level": "example:azure_breath_2"
}
```

```json
// data/example/mxt/progression/azure_breath_2.json
{
  "next_level": "example:azure_breath_3",
  "mastery": 100,
  "damage_multiplier": 1.25
}
```

```json
// data/example/mxt/progression/azure_breath_3.json
{
  "mastery": 400,
  "damage_multiplier": 1.5
}
```

- 链**没有身份字段**：它就是 `next_level` 串出来的这条直线，**没有任何一级把它写成 `next_level` 的那一级就是入口**。这里 `azure_breath_1` 没人指向，所以链是 1 → 2 → 3，链内序号依次是 `0`、`1`、`2`。最高一级不写 `next_level`。
- `mastery` 是**到达这一级**需要的量，入口级那一份永远不会被读——`azure_breath_1` 不必写它。
- 链在 `progression` 表里，`default_level` 由每门功法自己点，所以同一条链可以被多门功法共用：它们面对的是同一段爬升。
- `damage_multiplier` 只在**这条链授予的能力施放**这条路上生效：持有者当前在哪一级，就用那一级的倍率（同一个能力被多处授予时取最高的那个）。它进的是伤害公式的 `damage_multiplier` 变量。

链上的问题全部在世界加载时一次报出（`/mxt registries validate`）：`next_level` 指向不存在的条目（`next_level <id> is not a progression`）、一级被两处写成后继（`follows both <A> and <B>`）、成环（`chain is cyclic, or joins another chain, at level <id>`）、以及**后一级要求的熟练度比前一级低**（`lowers its mastery requirement at level <id>`）。有一条坏链接，整条链就不被索引：宁可没有顺序，也不留下半条链。

## 第 3 步 —— 功法把这条链接到自己身上

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
  ],
  "granted_abilities": ["example:qi_bolt"],
  "default_level": "example:azure_breath_1",
  "mastery_resource": "example:azure_mastery",
  "configuration": {
    "example:azure_breath_2": {
      "condition": {"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"},
      "ability": "example:qi_recovery"
    },
    "example:azure_breath_3": {
      "condition": {"type": "mxt:realm", "realm": "example:core_formation", "comparison": "at_least"}
    }
  }
}
```

三个新字段各答一件事：

| 字段 | 答什么 |
| --- | --- |
| `default_level` | 这门功法从链上哪一级进入。 |
| `mastery_resource` | 用哪个数值衡量熟练度；不写就永不晋升。 |
| `configuration` | 入口之后每一级的 `condition`（到达这一级还要什么）与 `ability`（这一级给什么能力）。 |

- `configuration` 的键就是链上那一级的 id。**入口之后的每一级必须配置**：链条不能经过一个没有任何描述的台阶，漏一级会报 `does not configure the progression level <id>`；配了从入口走不到的等级会报 `configures progression level <id>, which it can never reach from <entry>`。
- 入口级本身不用写条目。写了的话它的 `ability` 照常在那一级生效，而 `condition` 不会成为任何门槛——不存在"晋升进入口级"这件事。
- `ability` 是**最低要求**：能力是累积的，爬到第三级时第二级给的能力仍然在。上面把 `example:qi_recovery` 从 `granted_abilities` 挪进了第二级，于是"学会就有恢复"变成"爬到第二级才有恢复"；第一级仍然是学会就给的 `example:qi_bolt`。
- 熟练度与 `condition` 是**两道独立的门**，晋升时都要过：数值够、条件也成立才走这一步。只想要数值，条件写 `mxt:always`。
- `mastery_resource` 与 `configuration` **都要求 `default_level`**：写了数值却没有入口，加载期直接按 `mastery_resource needs default_level to name the progression chain it measures` 报错；反过来，只写了 `configuration`、没写 `mastery_resource` 的功法照常授予能力，只是不会自己晋升。

## 第 4 步 —— 熟练度从哪来

本体不规定这件事：它只认那个数值。数值怎么涨完全由内容包写，四条路都是现成的。

**打坐也算一份。** 结算成功那一拍跑一次 `cultivate_action`：

```json
// data/example/mxt/cultivation/meditation.json
"cultivate_action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
```

**战斗也算一份。** 触发规则是"某个信号 → 条件成立就跑一个行为"：

```json
// data/example/mxt/trigger/azure_mastery_from_kill.json
{
  "trigger": {"type": "mxt:kill"},
  "action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
}
```

能挂的信号是**技能触发器那一套**加上移植过来的原版触发器：`mxt:kill`、`mxt:hurt`、`mxt:attack`、`mxt:block_break`、`mxt:slept_in_bed`、`mxt:changed_dimension`、`mxt:player_killed_entity` 等等。规则自己的 `chance` 与 `cooldown` 用来限频。

**用这门功法自己的技能。** 会跑动作的技能类型，直接把同一个行为写进 `entity_action`：

```json
// data/example/mxt/ability/qi_bolt.json
"entity_action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": 1}
```

这条路的坑在于**技能不知道"我来自哪门功法"**：`example:qi_bolt` 同样被境界与丹药授予，所以那两条来源也会往同一个数值里加。数值是全局的，不是每门功法一份——想只让学会这门功法的人涨，就把行为写在只有它才给的那条技能上，或者用一个只有这条路会碰的数值。

**让修炼把它当饭吃。** 熟练度数值如果正好是某条灵气（`aura`）引用的那一个，修炼结算会顺着那条链把它填起来（`regen × absorb_amount × 亲和 × 灵气速度`，先填满、溢出才算修为），`aura_gains` 也会加到它上面。这是最省写法的一条：把 `mastery_resource` 指成你打坐用的那个数值，修炼本身就在涨熟练度。

`mxt:add_resource` 的 `amount` 可以写公式。数值同样会被各种东西**扣掉**：任何消耗（`Cost`）、实体之间的转移、灵力容器都能把它拿走，所以"花熟练度换东西"是允许的，代价是下一次晋升被推迟——已经拿到的等级不会掉。

## 第 5 步 —— 学会之后它会自己爬

手册那一侧不用改：`example:azure_breath` 在 [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) 里已经有了自己的 `technique_binding`。

```mcfunction
give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]
```

服务端**每秒**检查一次身上每一门已学功法：熟练度达到下一级的 `mastery`，下一级的 `condition` 也成立，就升上去。一次检查会顺着链连着往上走，直到某一步不满足为止，但**不会跳级**。晋升之后立刻按新等级重算能力（`granted_abilities` 加上已经到达过的每一级的 `ability`），并发布一次 `mxt:progression_level` 信号：公式变量 `level` 是刚到达的链内序号，扩展值 `owner` 是这门功法的 id。

**等级只升不降。** 包改过某门功法的 `default_level` 之后，身体里那条再也走不到的记录会被清掉（实体加入世界时、玩家登录时，以及数据包重载时——重载那一次扫过全部已加载实体），这门功法退回它自己的入口级；清一条会在服务端日志里留一条带功法 id 与等级 id 的 `WARN`。

## 在游戏里验证

```text
（重新打开世界）
/mxt registries validate                      → 没有 Codec 错误
/mxt registries list                          → mxt:progression=3
/mxt ability list                             → 已授予的能力与各自的来源
/mxt trigger rules mxt:kill                   → 列出击杀那条规则
/mxt resource example:azure_mastery           → 当前熟练度
/mxt trigger publish mxt:kill                 → 手动发一次击杀信号（需要 gamemaster）
```

1. `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]`，右键学会。这时只有 `example:qi_bolt`——恢复技能要到第二级。功法面板（默认没绑按键，从人物信息面板 `Z` 里的按钮进）上能看到这门功法、它的等级与熟练度条。
2. 打坐一分钟：`cultivate_action` 每秒给 `1`，`/mxt resource example:azure_mastery` 跟着涨；打一只怪，或者 `/mxt trigger publish mxt:kill` 手动发一次信号，再涨 `1`。
3. 数值到 `100` 之后的一两秒内晋升到第二级：`example:qi_recovery` 出现在轮盘配置界面右边的技能池里（`/mxt ability list` 会把它连同来源一起列出来），这条链授予的技能打出的伤害从 `1.0` 倍变成 `1.25` 倍。
4. 想直接看晋升就别等：`/mxt resource example:azure_mastery set 100`（需要 gamemaster）。这个写法直接改写数值，不经过边界钳制。
5. 再把数值推到 `400`：晋升第三级，倍率变成 `1.5` 倍。
6. 把 `azure_breath_3.json` 的 `mastery` 改成 `50`（比第二级的 `100` 低），重开世界：`/mxt registries validate` 报 `lowers its mastery requirement at level example:azure_breath_3`。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 读了半天不晋升 | 没写 `mastery_resource`（永不晋升），或者数值没涨到下一级的 `mastery`，或者下一级的 `condition` 没成立——两个门槛都要过。 |
| 数值涨到某个数就停住 | 那个数就是它的 `max`，越界的变更被钳到边界。门槛高于 `max` 时这条链爬不到顶，**不报错**。 |
| 所有人的这门功法一起涨 | 熟练度是**全局数值**，不是每门功法一份：任何来源往这个数里加，所有指它的功法都受益。要分开就得用不同的数值。 |
| 打坐涨了熟练度，涨的却是别的功法 | 同上：数值是共用的。把熟练度指成某条灵气的 `resource` 时，那条灵气的一切来源都会喂它。 |
| 报 `mastery_resource needs default_level to name the progression chain it measures` | 写了衡量熟练度的数值，却没写入口等级。 |
| 报 `configuration needs default_level to name the progression chain it belongs to` | 写了逐级配置，却没写入口等级。 |
| 报 `enters the unknown progression level <id>` | `default_level` 指向一个不存在的等级。 |
| 报 `does not configure the progression level <id>` | 从这门功法的入口出发会经过 `<id>`，但 `configuration` 里没有它。 |
| 报 `configures progression level <id>, which it can never reach from <entry>` | `configuration` 里配了一个从入口走不到的等级。 |
| 报 `lowers its mastery requirement at level <id>` | 后一级的 `mastery` 比前一级低，整条链被丢掉、不索引。 |
| 报 `follows both <A> and <B>` / `chain is cyclic, or joins another chain, at level <id>` | 一级被两处写成后继（分叉），或者成环。 |
| 报 `next_level <id> is not a progression` | `next_level` 指向不存在的条目，整条链被丢掉。 |
| 等级记录莫名退回了入口级 | 包改过这门功法的 `default_level`：跑去不到的记录会在实体加入世界、登录与数据包重载时被清掉，日志里有对应的 `WARN`。 |
| 改了文件却什么也没变 | 数据包注册表在世界加载时读，`/reload` 不重读。 |

## 接下来

- [progression（进度链）](../datapack/json/progression.md) —— 每一级的完整字段，以及链在运行期怎么编号。
- [technique（功法）](../datapack/json/technique.md) —— 功法定义的完整字段与逐级配置的规则。
- [定义技能](./add-an-ability.md) —— 这条链授予的那些能力本身怎么写。
- [trigger（触发器）](../datapack/json/trigger.md) —— 触发规则的完整字段：信号、条件、概率与冷却。
