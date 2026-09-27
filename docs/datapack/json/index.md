---
title: 动态注册表
---

# 动态注册表

下表列出本模组的 35 个数据包注册表。字段表里的「默认」是省略该字段时用的值，「必填」表示缺失时加载失败。表格末尾的 `alchemy_recipe` 与 `spirit_crafting` 不是数据包注册表，而是使用原版配方系统的配方类型，一并列在此处便于查阅。文件位置与「按类别把 JSON 分进子文件夹」的写法见[数据包开发总览](../overview.md)。

| 注册表 | 文件目录 | 用途 |
| --- | --- | --- |
| `resource` | `mxt/resource` | 修为、灵力、体力等实体资源及内联资源条。 |
| `artifact` | `mxt/artifact` | 法器：认领哪些现有物品、每种灵气存多少、提供哪些能力。 |
| `aura` | `mxt/aura` | 单个数值的灵气定义：元素标记、境界链入口、恢复与换算。 |
| `realm_stage` | `mxt/realm_stage` | 线性境界链和突破。 |
| `element` | `mxt/element` | 元素关系与克制倍率：`overcomes`、`adapted_to`、认领的伤害类型与显示色。 |
| `element_reaction` | `mxt/element_reaction` | 元素附着达到要求时触发的反应。 |
| `spirit_root` | `mxt/spirit_root` | 与一个或多个元素绑定的灵根：修炼倍率、亲和倍率、授予能力与互斥。 |
| `physique` | `mxt/physique` | 独立于元素的体质加成：原版属性、授予能力与伤害倍率。 |
| `ability` | `mxt/ability` | 主动、被动和触发技能。 |
| `curse` | `mxt/curse` | 可被多个模块引用的诅咒定义与持续类型。 |
| `forging_method` | `mxt/forging_method` | 单次锻打方式。 |
| `forging_blueprint` | `mxt/forging_blueprint` | 锻造目标和品质结算。 |
| `tool_binding` | `mxt/tool_binding` | 认领工具物品，并给出它们解锁的锻打方式。 |
| `blueprint_binding` | `mxt/blueprint_binding` | 认领图纸物品，并给出它们提供的锻造蓝图。 |
| `technique` | `mxt/technique` | 功法定义：可学习、按水平授予能力与修炼修正。 |
| `skill_stage` | `mxt/skill_stage` | 技能水平链的单级定义。 |
| `cultivate_action` | `mxt/cultivate_action` | 一次运功法门：吸收哪些环境灵气、每刻做什么、代价与收获。 |
| `spirit_herb` | `mxt/spirit_herb` | 已有物品的灵植元数据。 |
| `alchemy_recipe` | `recipe`（配方类型 `mxt:alchemy`） | 炼丹配方。 |
| `spirit_crafting` | `recipe`（配方类型 `mxt:spirit_shaped` / `mxt:spirit_shapeless`） | 灵气合成配方，只在灵气工作台（`mxt:spirit_crafting_table`）里跑。 |
| `formation` | `mxt/formation` | 阵法生命周期和灵气覆写。 |
| `tribulation` | `mxt/tribulation` | 天劫：启动门槛、时间线节拍与成败行为。 |
| `creature_profile` | `mxt/creature_profile` | 生物属性档案：匹配、门槛、内丹与写入时的一条行为。 |
| `contract_type` | `mxt/contract_type` | 契约生命周期：双方条件、四个时刻的行为、签订代价与两个上限。 |
| `secret_realm` | `mxt/secret_realm` | 秘境模板：按需为每次进入开出实例维度。 |
| `currency` | `mxt/currency` | 物品货币面值和兑换。 |
| `item_binding` | `mxt/item_binding` | 现有物品到行为数组的绑定。 |
| `weapon_binding` | `mxt/weapon_binding` | 现有物品的武器属性和行为。 |
| `pill_binding` | `mxt/pill_binding` | 现有物品的丹药和丹毒规则。 |
| `technique_binding` | `mxt/technique_binding` | 现有物品到功法学习的绑定。 |
| `aura_zone` | `mxt/aura_zone` | 环境灵气模板。 |
| `block_aura` | `mxt/block_aura` | 方块提供的灵气。 |
| `item_aura` | `mxt/item_aura` | 手持物品提供的修炼燃料。 |
| `quality` | `mxt/quality` | 共享品质：名字、颜色、三个修正、使用条件，以及它在品质链上的位置与升级代价。 |
| `trigger` | `mxt/trigger` | 事件规则：信号、条件与行为。 |
| `talisman` | `mxt/talisman` | 符箓定义：一张符箓铭刻的能力。 |

## 固有类型分派

下列字段的类型由固有注册表按 `type` 分派，表里的「写在哪」一列就是数据包里出现这些 `type` 的位置。数据包只能传入 `type` 和该类型的参数，不能添加新的 `type`：

| 写在哪 | 分派字段 | 作用 |
| --- | --- | --- |
| `mxt:ability` 的顶层 | `type`（顶层字段） | 顶层 `type` 选择技能的生命周期与触发方式，共十四种（`empty`、`active`、`triggered`、`modifier`、`aura`、`interval`、`channelled`、`targeted`、`composite`、`word`、`mount`、`flight_control`、`storage`、`upkeep`）；法器 `abilities` 里的条目写注册表技能 id 或 `#技能标签`，见[技能](./ability.md#ability-types)。 |
| `mxt:curse` 的 `type` | `type` | 诅咒的持续和过期方式。 |
| `entity_action` 字段的每一项 | `type` | 实体行为。 |
| `bi_entity_action` 字段的每一项 | `type` | 双实体行为。 |
| `block_action` 字段的每一项 | `type` | 方块行为。 |
| `item_action` 字段的每一项 | `type` | 物品行为。 |
| `condition` 字段的每一项 | `type` | 实体条件。 |
| `bi_entity_condition` 字段的每一项 | `type` | 双实体条件。 |
| `block_condition` 字段的每一项 | `type` | 方块条件。 |
| `item_condition` 字段的每一项 | `type` | 物品条件。 |
| `damage_condition` 字段的每一项 | `type` | 伤害条件。 |
| 资源条字段的数值来源 | `type` | 资源条和扩展读取的资源数值来源，包括环境与实际灵气浓度。 |
| 资源条绘制器 | `type` | 资源条绘制器。 |
| 资源条显示条件 | `type` | 资源条显示条件。 |
| 天劫时间线的一项 | `type` | 天劫时间线的一个节拍：执行行为、空等一段时长，或等一个条件成立。 |
| 技能状态 | `type` | 技能能存下来的状态种类：冷却、充能、切换、持续等。技能的 `type` 决定自己需要哪几种。 |

行为和条件数组是简写，表示按顺序全跑一遍：

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

每个类型的具体字段以它自己的条目为准，见[行为与条件的类型页](/datapack/types/index)。这些内置类型由本模组注册，数据包不会向它们添加条目。

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
