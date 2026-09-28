---
title: 公式变量
description: 公式能读到的每一个名字、由谁提供，以及写错名字时会发生什么。
---

# 公式变量

公式变量是一个**内置名字**，作用是从求值上下文携带的对象里拆出一个数字。`mxt:formula_variable` 和条件、行为、数值提供器一样是代码里的注册表：数据包既不能加条目也不能配置，背后也没有 JSON 文件。

变量**按需读取**。建上下文的时候什么都不算，所以一条表达式只为它真正提到的名字付出代价。不是某个对象的属性、而是事件本身带的值——一击的 `damage`、被破坏方块的坐标、`breakthrough` 这种标志——不是变量，是调用方写进上下文的显式值。

## 取值顺序

读一个名字时按这个顺序找：

1. **上下文的显式值**，有就用。事件载荷、模组为某一次求值加的值，以及表达式自己的 `params` 都算这一类。
2. **变量注册表**，从上下文的对象里解析。
3. **都没有**，这属于写错了，按下面那张表报出来。

`params` 优先级最高，而且只影响声明它的那一条表达式。写法见[表达式字符串](./number_provider_types#表达式字符串)。

## 未知名字与失败

名字拼错、上下文提供不了、或者变量自己读失败，都只能在运行期发现：

| 情况 | 开发环境 | 生产环境 |
| --- | --- | --- |
| 名字不认识，或上下文提供不了（例如没有施法者的上下文里读 `caster_health`） | 完整 `ERROR` 日志，带上那个名字 | 每个不同的消息一行 WARN，表达式按 `0` 继续 |
| 变量算出 `NaN` 或无穷 | 完整 `ERROR` 日志 | 一行 WARN，按 `0` 继续 |
| 变量读对象时抛异常 | 完整 `ERROR` 日志，含异常与堆栈 | 一行 WARN，按 `0` 继续 |

三种都不会中断求值：表达式继续跑，只把这一项当 `0`，所以一个写错的名字不会让整条技能或那一 tick 崩掉。

反过来说，codec 在解析期就能看出来的错是另一种：表达式为空、写坏了、`params` 不合法，或者加权列表没有条目、上下文变量名字为空——这些是解码失败，加载器会把同一轮里所有失败的条目收集起来一起报，然后整包加载失败。

::: warning 未知名字不会静默
没有变量提供的名字不会悄悄变成 `0`。开发环境在第一次求值时打全量错误，生产环境每个不同的消息留一行 WARN，所以打错的名字在服务器日志里找得到。
:::

只有**一部分上下文**提供的名字不算错。`realm_rank` 在数值公式里完全合法，在技能公式里就提供不了；把它写进技能公式才是要被报出来的那件事。

## 所有上下文都可用的名字

| 变量 | 说明 |
| --- | --- |
| `zero` | 恒为 `0`，用来关掉一项而不动表达式 |
| `random` | 从上下文的权威随机源取的 `0` 到 `1` |

`random` 的权威性来自上下文携带的那个实体或关卡的随机源。不要在客户端重新掷一次来决定游戏结果。

## 实体变量

从实体建的上下文提供两族名字：施动者一族用 `caster_` 前缀，双实体公式里第二个实体用 `target_` 前缀。

| 变量 | 说明 |
| --- | --- |
| `caster_health` / `target_health` | 当前血量，只有生物才有 |
| `caster_max_health` / `target_max_health` | 最大血量，只有生物才有 |
| `caster_level` / `target_level` | 玩家是原版经验等级，其他实体是 `0` |
| `caster_<数值>` / `target_<数值>` | 该数值当前的数量，实体没有这个数值时是 `0` |
| `caster_<属性>` / `target_<属性>` | 该属性当前的值 |
| `caster_element_<元素>` / `target_element_<元素>` | 实体的灵根命名了这个元素时是 `1`，否则 `0` |
| `caster_element_count` / `target_element_count` | 实体的灵根一共命名了几个元素 |

`<数值>` 与 `<属性>` 是注册表 ID 把命名空间与路径用 `_` 接起来，路径里的 `/`、`.`、`-` 也换成 `_`：

| 注册表 ID | 变量 |
| --- | --- |
| `mxt:common` | `caster_mxt_common` |
| `example:fire/qi` | `caster_example_fire_qi` |
| `minecraft:max_health` | `caster_minecraft_max_health` |
| `minecraft:attack_damage` | `caster_minecraft_attack_damage` |
| `example:fire`（一个元素） | `caster_element_example_fire` |

已加载注册表里的每个数值与属性都能这么点名，实体当前用不用它都无所谓。两个不同的 ID 可能压平成同一个名字（`example:fire_qi` 与 `example_fire:qi` 都会变成 `example_fire_qi`），这种情况会报出来，不会静默取其中一个。

客户端只认识自己收到的属性，没同步过来的属性读作 `0`，所以客户端的预览不会编出一个服务端没给过的数。

::: warning `caster_level` 不是境界
`caster_level` 是原版经验等级。境界序号是下面资源族的 `level` / `realm_rank`，只在数值上下文里存在。
:::

## 资源变量

为某一个值求值的公式——`resource.max`、`resource.bars`，以及它那条[灵气定义](../json/aura.md)里的 `regen`、双向换算、`start_exp`，还有数值消耗、境界阶段与突破阈值——同时带上这个值的修炼状态：

| 变量 | 说明 |
| --- | --- |
| `realm` | 当前境界在这条数值链上的序号；链对不上时是 `0` |
| `realm_rank` | 与 `realm` 同一个数 |
| `level` | 与 `realm` 同一个数，给境界公式留的简写 |
| `absorbed_aura` | 这个数值累积的修为进度；链对不上时是 `0` |
| `cultivation_progress` | 与 `absorbed_aura` 同一个数 |
| `minor_stage` | 进度落在当前境界第几个子境界，从 `0` 起，按 `breakthrough_exp` 均分；这个境界没配子境界、或者还没有境界时是 `NaN` |

所以一个数值的 `max`、以及它那条灵气定义的 `regen` 可以这么写：

```json
// data/example/mxt/resource/qi.json
{
  "max": "100 + realm_rank * 50 + absorbed_aura * 0.5"
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": "0.25 + realm_rank * 0.1"
}
```

## 由系统写进上下文的值

下面这些名字是启动求值的那个系统写进上下文的显式值，所以只在那个系统跑的地方读得到。

### 技能

| 变量 | 什么时候有 | 说明 |
| --- | --- | --- |
| `element_modifier` | 技能声明了非空的 `element_affinity` | 为施法者算出的元素亲和倍率。[伤害系统](../../technical/damage.md)第一层会把它乘进这次施放打出的伤害，所以伤害公式里**不要**手写 `* element_modifier`——那是同一个数的第二次相乘。它仍然可以在不是伤害的地方读，例如消耗与时长 |
| `damage_multiplier` | 这次施放落在一条授予该技能的技能水平链上 | 施法者当前所在那一级的 `damage_multiplier`，伤害系统也拿它乘这次施放的伤害。体质自己的 `damage_dealt_multiplier` / `damage_taken_multiplier` **不进公式上下文**，只有管线读它们 |
| `aura_radius` | `mxt:aura` 求值它的目标行为 | 这一轮脉冲解析出的半径 |
| `distance` | `mxt:aura` 求值它的目标行为 | 施法者与当前目标之间的格数 |

### 触发器

`mxt:triggered` 的技能在触发器命中时求值，触发器会加这些名字：

| 触发器 | 加的变量 | 说明 |
| --- | --- | --- |
| `tick` | —— | 只有实体上下文 |
| `attack` | `target_is_living`、`target_health` | 被打的实体是生物时 `target_is_living` 为 `1` |
| `hurt` | `damage` | 施法者实际吃到的那次伤害 |
| `kill` | `target_health` | 被杀实体死亡那一刻的血量 |
| `death` | `victim_health` | 死亡实体的血量，最低 `0` |
| `block_break`、`block_use` | `block_x`、`block_y`、`block_z` | 相关方块的坐标 |
| `item_use` | `use_duration` | 这次使用物品跑了多少 tick |
| `equip` | `equipment_slot` | 变化的装备槽序号 |
| `breakthrough` | `breakthrough` | 恒为 `1`，所以能当标志用 |
| `technique_stage` | `stage` | 刚到达的那一级的序号，从 `0` 起；这个信号还会把 `technique` 的 ID 作为扩展值带给脚本匹配器 |

### 其他系统

| 变量 | 谁提供 | 说明 |
| --- | --- | --- |
| `damage` | 契约的战斗行为 | 契约灵宠刚打出的伤害 |
| `formation_radius` | 阵法的 `entity_tick_action` | 生效中阵法的半径 |
| `distance` | 阵法的 `entity_tick_action` | 阵法中心与实体之间的格数 |
| `aura_tribulation_modifier` | 天劫时间线 | 本地灵气影响，取自灵气区域的 `tribulation_modify` 规则，每个时间线节拍开始时采样一次 |

### 秘境

为某个[秘境](../json/secret_realm.md)实例的成员求值的任何公式都能读这个实例，最有用的是定义自己的 `enter_condition`、`exit_condition`、`enter_action` 与 `exit_action`：

| 变量 | 说明 |
| --- | --- |
| `secret_realm_members` | 实例里现在有几个人 |
| `secret_realm_limit` | 实例的人数上限，取自 `max_members`；不限时是 `-1` |
| `secret_realm_elapsed` | 这一趟进来之后过了多少 tick |
| `secret_realm_duration` | 配置的 `duration_ticks` |
| `secret_realm_index` | 这个实例的序号，从 `0` 起 |
| `secret_realm_is_owner` | 读的那个实体是这个实例的主人时是 `1`，否则 `0` |

名字带 `secret_realm_` 前缀是因为 `realm`、`realm_rank` 与 `level` 已经被境界占用了。不在任何秘境实例里时这些名字完全提供不了，所以按错误报出来，不会静默读成 `0`。

### 寿元

从实体建的上下文能用两个名字读那个实体的寿元账本，单位都是 tick：

| 变量 | 说明 |
| --- | --- |
| `lifespan_remaining` | 这一世还剩多少 tick |
| `lifespan_total` | 这一世被给到的上限 |

它们读的是公式的求值对象（上下文里的施法者，没有施法者时读玩家）。身体**没有账本**时两者都读 `NaN`，所以条件能区分「从没记过账」与「记过账、已经耗尽」——后者读 `0`。账本怎么来的见[寿元](/player-guide/lifespan)。

### 丹毒与药龄

| 变量 | 什么时候有 | 说明 |
| --- | --- | --- |
| `pill_toxicity` | 上下文里有实体 | 求值对象身上累计的丹毒。从未服过丹药的实体读 `0`，也不会因此多出一份空记录；只拿 Level 求值、或空上下文里这个名字完全提供不了。 |
| `herb_age` | 只在该灵植自己的药力公式里 | 这一堆药材的药龄，非负整数。它是**局部**值：只注入 `main_effects`、`auxiliary_effects` 与 `catalyst_power`，别处读不到，管线也不会再把年龄乘一次。 |

药力公式要用药龄增益就自己写进表达式，例如 `"3 + herb_age / 50"`。药龄读的是堆上的 `mxt:herb_age` 组件，没有组件时用那条灵植的 `default_age`。

## 每个地方能用哪些变量

一条公式能读什么，取决于调用方往上下文里放了哪些对象。下表列主要求值点。

| 公式 | 上下文对象 | 能读的变量 |
| --- | --- | --- |
| 技能的施法时间、冷却、充能、引导间隔、条件、目标选择 | 施法者 | 实体族；技能声明了 `element_affinity` 时有 `element_modifier`（伤害系统会自己拿它乘这次施放的伤害，所以这里只用来算不是伤害的数）；有授予该技能的技能水平链时有 `damage_multiplier`；启动这条技能的那个触发器带的载荷 |
| 技能的 `target_condition` 与 `bi_entity_action` | 施法者 + 目标 | 实体族与目标族；同一份事件载荷 |
| `mxt:aura` 的间隔与半径 | 施法者 | 实体族 |
| 技能 `costs` 里的 `mxt:resource` 条目 | 施法者 + 被扣的那个数值 | 实体族 + 那个数值的资源族 |
| 技能的 `mxt:item` 消耗 | 施法者 | 实体族 |
| 数值的 `default_value`、`min`、`max`、`regen`、可用性条件、灵力射线 | 施法者，按值求值时再加那个数值 | 实体族；绑定了数值时有资源族 |
| 数值的双向换算、境界阶段阈值、突破阈值 | 施法者 + 那个数值 | 实体族 + 资源族 |
| 修炼行为的条件与数量 | 施法者，按值的那几个字段再加数值上下文 | 实体族；绑定了数值时有资源族 |
| 境界阶段与功法的被动属性修正 | 施法者 | 实体族 |
| 诅咒的时长、间隔、条件、行为 | 施法者（或施加这条诅咒的那次施放的上下文） | 实体族，外加施加它那条技能的载荷 |
| 物品、武器、丹药、功法绑定，物品品质，丹毒 | 使用的或持有的那个实体 | 实体族（含 `pill_toxicity`）；武器攻击时还有 `target_health` / `target_is_living` |
| 灵植的药力（`main_effects`、`auxiliary_effects`、`catalyst_power`） | 这一堆药材，外加调用方给的上下文 | 局部值 `herb_age`；上下文里有实体时还有实体族 |
| 锻造、阵法、契约、生物档案、秘境、法器 | 玩家、阵主或生物 | 实体族（`entity_tick_action` 另有 `formation_radius` / `distance`；秘境实例里另有秘境族） |
| 天劫时间线的节拍时长与条件 | 施法者 | 实体族 + `aura_tribulation_modifier` |
| 只拿 Level 求值的公式：阵法的 `tick_action` / `deactivate_action`、阵法灵气加成、灵气工作台的花费、KubeJS 的方块行为与条件 | 无 | 只有 `zero` 与 `random` |
| 客户端预览那种空上下文：物品与武器提示框、物品灵气容量、货币价值判定 | 无 | 只有 `zero` 与 `random` |

::: info 空上下文很常见
好几条显示路径拿空上下文求值，所以一条读了 `caster_mxt_common` 的定义在游戏里显示真实的数、在提示框里显示 `0`。只给显示用的公式别读实体变量，否则接受它没法在客户端预览。
:::

## 覆盖一个名字

`mxt:expression` 接受 `params`，它的值也是 `NumberProvider`，只在那一条表达式里替换掉同名的变量：

```json
{
  "type": "mxt:expression",
  "expression": "realm_rank * scale + bonus",
  "params": {
    "scale": 1.5,
    "bonus": "caster_minecraft_attack_damage * 0.5"
  }
}
```

当一条公式要用的值上下文没有给，或者同一条表达式要在几张表里配不同的常数复用时，用 `params`。
