---
title: 动态注册表
---

# 动态注册表

下表列出本模组的 31 个数据包注册表。字段表里的「默认」是省略该字段时用的值，「必填」表示缺失时加载失败。另有 **9 张数据表**（NeoForge Registry Data Map，不是注册表），列在表后。

**配方不在表里。** 走原版 `RecipeManager` 的配方页收在下面的「合成表」分组里：炼丹配方（`mxt:alchemy`）、灵气合成（`mxt:spirit_shaped` / `mxt:spirit_shapeless`）与画符配方（`mxt:talisman_drawing`）。它们的 JSON 放在 `data/<namespace>/recipe/`，**不要**放进 `mxt/<配方名>/`；它们也不是注册表，所以 `/reload` 会重新读取它们。文件位置与「按类别把 JSON 分进子文件夹」的写法见[数据包开发总览](../overview.md)。

**给符笔加颜料不是配方。** 它是原版储物袋那套点击：光标提着符笔对着颜料物品点一下就蘸，见 [`mxt:talisman_drawing`](./talisman_drawing.md#材料与颜料)。

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
| `technique` | `mxt/technique` | 功法定义：可学习、按进度等级授予能力与修炼修正。 |
| `progression` | `mxt/progression` | 进度链的单级定义。 |
| `cultivation` | `mxt/cultivation` | 一次运功法门：吸收哪些环境灵气、每 tick 做什么、结算成功那一拍做什么、代价与收获。 |
| `spirit_herb` | `mxt/spirit_herb` | 已有物品的灵植元数据。 |
| `medicinal_property` | `mxt/medicinal_property` | 药性身份：一种药用效果的名字与描述。 |
| `alchemy_furnace` | `mxt/alchemy_furnace` | 炉型规格：槽位、一炉容量与炉温回落速度。 |
| `alchemy_wall_material` | `mxt/alchemy_wall_material` | 炉壁材料：一块炉壁的耐温上限。 |
| `formation` | `mxt/formation` | 阵法生命周期和灵气覆写。 |
| `tribulation` | `mxt/tribulation` | 天劫：启动门槛、时间线节拍与成败行为。 |
| `creature_profile` | `mxt/creature_profile` | 生物属性档案：匹配、门槛、内丹与写入时的一条行为。 |
| `contract_type` | `mxt/contract_type` | 契约生命周期：双方条件、灵宠侧四个时刻的行为、主人侧三个时刻的行为与存续期授予、签订代价与两个上限。 |
| `secret_realm` | `mxt/secret_realm` | 秘境模板：按需为每次进入开出实例维度。 |
| `pill` | `mxt/pill` | 一份丹药的作用：食用行为、丹毒增量、过量阈值与过量后的残留。 |
| `pill_binding` | `mxt/pill_binding` | 认领一族已有物品当同一份丹药，并给出服用次数与冷却。 |
| `technique_binding` | `mxt/technique_binding` | 现有物品到功法学习的绑定。 |
| `aura_zone` | `mxt/aura_zone` | 环境灵气模板。 |
| `quality` | `mxt/quality` | 共享品质：名字、颜色、三个修正、使用条件，以及它在品质链上的位置与升级代价。 |
| `trigger` | `mxt/trigger` | 事件规则：信号、条件与行为。 |
| `talisman` | `mxt/talisman` | 符箓定义：一张符箓铭刻的能力。 |

## 数据表

这 9 张表是 NeoForge 的 **Registry Data Map**，**不是注册表**：键就是条目 id 或 `#标签`，值是内联数据，没有 id、没有名字，也不能被别的定义引用。文件固定放在 `data/mxt/data_maps/<注册表路径>/<表路径>.json`（物品键在 `item/`、方块键在 `block/`），写法见[数据表](../overview.md#数据表data-map)。侧边栏里它们另成「数据表」分组（同上面的「合成表」），所以上面那张注册表清单里没有它们。

| 数据表 | 文件 | 值 |
| --- | --- | --- |
| `item_aura` | `data/mxt/data_maps/item/item_aura.json` | 手持物品提供的修炼燃料。 |
| `currency` | `data/mxt/data_maps/item/currency.json` | 物品货币面值和兑换。 |
| `default_quality` | `data/mxt/data_maps/item/default_quality.json` | 物品的默认品质，品质解析的第三层、也是最后一层。 |
| `item_binding` | `data/mxt/data_maps/item/item_binding.json` | 现有物品的行为、条件与元素。 |
| `weapon_binding` | `data/mxt/data_maps/item/weapon_binding.json` | 现有物品的武器属性和动作。 |
| `tool_binding` | `data/mxt/data_maps/item/tool_binding.json` | 工具物品解锁的锻打方式。 |
| `blueprint_binding` | `data/mxt/data_maps/item/blueprint_binding.json` | 图纸物品提供的锻造蓝图。 |
| `block_aura` | `data/mxt/data_maps/block/block_aura.json` | 方块提供的灵气。 |
| `heat_source` | `data/mxt/data_maps/block/heat_source.json` | 供热方块的温度与升温速度。 |

## 固有类型分派

不少字段按 `type` 从固有注册表里选一项：技能顶层、诅咒的持续方式、四类行为、五类条件、资源条的数值来源与绘制器、天劫节拍、技能状态，等等。**完整清单、每一族的入口页与它自己的默认项见[类型参考总览](/datapack/types/index)**——类型表只留在那些页上。

行为和条件数组是简写，表示按顺序全跑一遍：

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

数据包不能向固有注册表**新增 `type`**，只能选已注册的；`mxt:js` 是其中唯一能把行为交给脚本的类型，它的 `mxt:js` 字段与注册方法见[类型参考总览](/datapack/types/index)。
