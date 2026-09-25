---
title: 动态注册表
---

# 动态注册表

下表列出 `MxtDatapackRegistries` 注册的 35 个数据包注册表。字段表中的“默认”是 Codec 默认值；“必填”表示缺失时加载失败。表格末尾的 `alchemy_recipe` 与 `spirit_crafting` 不是数据包注册表，而是使用原版配方系统的配方类型，一并列在此处便于查阅。文件位置与「按类别把 JSON 分进子文件夹」的写法见[数据包开发总览](../overview.md)。

| 注册表 | 文件目录 | 用途 |
| --- | --- | --- |
| `resource` | `mxt/resource` | 修为、灵力、体力等实体资源及内联资源条。 |
| `artifact` | `mxt/artifact` | 法器：认领哪些现有物品、每种灵气存多少、提供哪些能力（被动／主动／储物，以及载具数据这种"不按键"的条目）。 |
| `aura` | `mxt/aura` | 单个数值的灵气定义：它是什么（元素标记、灵力射线量）、境界链入口、恢复、换算与可用性。 |
| `realm_stage` | `mxt/realm_stage` | 线性境界链和突破。 |
| `element` | `mxt/element` | 元素关系（`overcomes`/`adapted_to`，每条关系自带伤害倍率）、它认领的伤害类型（`damage_types`）、附着与衰减参数与显示色；灵气用自身的 `aura_type` 指向一个元素，统一伤害管线按双方灵根的元素关系结算克制与适应，元素附着由 `element_reaction` 结算。 |
| `element_reaction` | `mxt/element_reaction` | 元素附着达到要求时触发的反应。 |
| `spirit_root` | `mxt/spirit_root` | 与一个或多个元素绑定的灵根：修炼倍率、元素亲和技能倍率（伤害管线第一层的因子）、授予能力、稀有度与同体互斥。 |
| `physique` | `mxt/physique` | 独立于元素的体质加成：原版属性、授予能力、互斥标签、稀有度，以及打出/受到伤害的两个倍率。 |
| `ability` | `mxt/ability` | 主动、被动和触发技能。 |
| `curse` | `mxt/curse` | 可引用的诅咒定义。 |
| `forging_method` | `mxt/forging_method` | 单次锻打方式。 |
| `forging_blueprint` | `mxt/forging_blueprint` | 锻造目标和品质结算。 |
| `tool_binding` | `mxt/tool_binding` | 工具物品提供的锻打方式。 |
| `blueprint_binding` | `mxt/blueprint_binding` | 蓝图物品提供的锻造蓝图。 |
| `technique` | `mxt/technique` | 功法定义（可学习、按水平授予能力与修炼修正）。 |
| `skill_stage` | `mxt/skill_stage` | 技能水平链的单级定义。 |
| `cultivate_action` | `mxt/cultivate_action` | 一次"运功"法门：吸收哪些环境灵气、每刻做什么、收费与收获、冷却。**已标记为将来可能移除。** |
| `spirit_herb` | `mxt/spirit_herb` | 已有物品的灵植元数据。 |
| `alchemy_recipe` | `recipe`（配方类型 `mxt:alchemy`） | 炼丹配方。 |
| `spirit_crafting` | `recipe`（配方类型 `mxt:spirit_shaped` / `mxt:spirit_shapeless`） | 灵气合成配方，只在灵气工作台（`mxt:spirit_crafting_table`）里跑。 |
| `formation` | `mxt/formation` | 阵法生命周期和灵气覆写。 |
| `tribulation` | `mxt/tribulation` | 天劫：启动门槛、时间线节拍与成败行为。 |
| `creature_profile` | `mxt/creature_profile` | 生物属性档案：匹配、门槛、内丹与写入时的一条行为。 |
| `contract_type` | `mxt/contract_type` | 契约生命周期。**已标记为将来可能移除。** |
| `secret_realm` | `mxt/secret_realm` | 秘境模板：实例维度生成、边界、结构、落点、认领与进出规则。 |
| `currency` | `mxt/currency` | 物品货币面值和兑换。 |
| `item_binding` | `mxt/item_binding` | 现有物品到行为数组的绑定。 |
| `weapon_binding` | `mxt/weapon_binding` | 现有物品的武器属性和行为。 |
| `pill_binding` | `mxt/pill_binding` | 现有物品的丹药和丹毒规则。 |
| `technique_binding` | `mxt/technique_binding` | 现有物品到功法学习的绑定。 |
| `aura_zone` | `mxt/aura_zone` | 环境灵气模板。 |
| `block_aura` | `mxt/block_aura` | 方块提供的灵气。 |
| `item_aura` | `mxt/item_aura` | 手持物品提供的修炼燃料。 |
| `quality` | `mxt/quality` | 共享品质：名字、颜色、三个修正与使用条件。顺序、默认档与升级路径由 `quality_chain` 给。 |
| `quality_chain` | `mxt/quality_chain` | 品质链条：由低到高的档位列表、默认档，以及每一步升级的代价与条件。**已标记为将来可能移除。** |
| `trigger` | `mxt/trigger` | 事件规则：信号、条件与行为。 |
| `talisman` | `mxt/talisman` | 符箓定义：一张符箓铭刻的能力。 |

`title`（称号）与 `badge`（徽章）曾经作为预留注册表存在，现已**彻底移除**：两者都只有数据结构，没有任何玩法消费者，也不在后续规划内。目录里残留的 `mxt/title`、`mxt/badge` 文件不会再被读取，也不会产生报错——它们只是普通文件。若需要同类展示内容，请等对应的玩法模块真正落地时再引入注册表。

## 固有类型分派

下列字段使用 Java 固有注册表的 `MapCodec`。数据包只能传入 `type` 和该类型的参数，不能添加新的 `type`：

| 数据类型 | 分派字段 | 作用 |
| --- | --- | --- |
| `Ability` | `type`（顶层字段） | 顶层 `type` 选择技能的生命周期与触发方式，共十一种（`empty`、`active`、`triggered`、`modifier`、`aura`、`channelled`、`composite`、`word`、`flight`、`storage`、`upkeep`）；法器 `abilities` 里的条目写注册表技能 id 或 `#技能标签`，见[技能](./ability.md#ability-types)。 |
| `CurseType` | `type` | 诅咒的持续和过期方式。 |
| `EntityAction` | `type` | 实体行为。 |
| `BiEntityAction` | `type` | 双实体行为。 |
| `BlockAction` | `type` | 方块行为。 |
| `ItemAction` | `type` | 物品行为。 |
| `EntityCondition` | `type` | 实体条件。 |
| `BiEntityCondition` | `type` | 双实体条件。 |
| `BlockCondition` | `type` | 方块条件。 |
| `ItemCondition` | `type` | 物品条件。 |
| `DamageCondition` | `type` | 伤害条件。 |
| `ResourceValueProvider` | `type` | 资源条和扩展读取的资源数值来源，包括环境与实际灵气浓度。 |
| `ResourceBarRenderer` | `type` | 资源条绘制器。 |
| `ResourceBarVisibility` | `type` | 资源条显示条件。 |
| `TimelineEntry` | `type` | 天劫时间线的一个节拍：执行行为、空等一段时长，或等一个条件成立。 |
| `DataStorage` | `type` | 内容声明的状态类型：冷却、充能、切换、持续等。存什么由类型自己决定，类型的类就是槽。 |

行为和条件数组是简写：

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

所有行为的具体字段以固有类型 Codec 为准。内置类型由 `MxtEntityActions`、`MxtBiEntityActions`、`MxtBlockActions`、`MxtItemActions`、`MxtEntityConditions`、`MxtTimelineEntries` 等类分组注册；数据包不会向这些固有注册表添加条目。

### KubeJS 扩展类型 `mxt:js`

下列分派都预注册了一个 `mxt:js` 类型：脚本在 `kubejs/server_scripts/` 里注册回调后，数据包即可按 `id` 引用它。回调缺失或抛异常时，各自退化为安全默认值并记录一条警告，不会使加载失败。

| 分派 | `mxt:js` 字段 | 注册方法 |
| --- | --- | --- |
| `EntityAction` / `BiEntityAction` / `BlockAction` / `ItemAction` | `id`、`params` | `MxtActions.entity` / `biEntity` / `block` / `item` |
| `EntityCondition` / `BiEntityCondition` / `BlockCondition` / `ItemCondition` / `DamageCondition` | `id`、`params` | `MxtConditions.entity` / `biEntity` / `block` / `item` / `damage` |
| `NumberProvider` | `id`、`params` | `MxtValues.number` |
| `ResourceValueProvider` | `id`、`params` | `MxtValues.resourceValue` |
| `Cost` | `id`、`params` | `MxtCosts.register` |
| `Trigger` | `signal`、`id`、`params` | `MxtTriggers.matcher` |
| `TargetSelector` | `id`、`params` | `MxtAbilities.selector` |
| 原版战利品条件 / 战利品函数 | `id`、`params` | `MxtLoot.condition` / `MxtLoot.function` |

`Trigger` 的 `mxt:js` 必须额外声明 `signal`，因为运行时按「信号 → 所有者 → 订阅」分层索引派发。所有 `mxt:js` 回调都在服务端执行；除 `Cost` 之外，回调都能拿到本次派发的公式上下文——`Cost` 只用玩家求值，因此它的上下文仅由该玩家构建，不含事件载荷。战利品条件与函数写在原版战利品表里（`condition` / `function` 分派键），同样只在服务端生成战利品时执行。

数据包无法向固有注册表**新增 `type`**，只能选择已注册的类型；`mxt:js` 是其中唯一能把行为交给脚本的类型。

- `curse`：可被多个模块引用的诅咒定义与持续类型；到期与被解毒各有一个行为，而「谁能解我」不由诅咒决定——解毒剂用 `mxt:remove_curses_by_tag` 声明它能解的 `mxt:curse` 标签，标签文件列出诅咒。物品可以携带诅咒（`mxt:curse_container`，装上即施加、脱下即移除），`display_condition` 决定它在人物信息面板里露不露面。详见[数据包格式](/datapack/json/curse)。
- `creature_profile` / `contract_type`：生物档案和契约规则，框架不提供具体生物数值。**能不能被契约是代码事实**（目标生物要实现 `Contractable`），数据包只能用契约类型自己的实体类型标签与 `*_condition` 收窄名单，另可用 `costs` / `max_owned` / `recall_cooldown` 规定代价与限制，见 [contract_type](/datapack/json/contract_type)。
- `secret_realm`：秘境模板，按需为每次进入开出实例维度。
- `spirit_herb`：绑定现有物品的灵植数据。
- `artifact`：把现有物品认领为法器，并按 `abilities` 声明被动／主动技能、飞行与自带储物。
- `talisman`：符箓定义，目前只声明铭刻后授予的 `ability`；“已经铭刻了哪些符箓”由物品 `mxt:talisman` 的组件保存，见[数据包格式](/datapack/json/talisman)。

> 称号（`title`）、徽章（`badge`）与宗门（`sect`）曾是预留注册表，现已彻底移除，详见[数据包格式](/datapack/json/index#动态注册表)。
