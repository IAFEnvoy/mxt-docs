---
title: cultivate_action（修炼行为）
aside: false
---

# cultivate_action（修炼行为） {#cultivate_action}

::: warning 已标记为将来可能移除

`CultivateAction` 上是 `//TODO::May be removed`。它是"运功/打坐"这件事的一个数据包化写法；若将来把"当前怎么修炼"整个收回状态附件（进度、境界、燃料都在那儿），这个注册表会连同 `CultivationModeService`、`CultivationActionService`、`AuraDistributionService`、`mxt:cultivation` 附件里的四个 `cultivate_*` 字段、开关包 `/mxt cultivate` 一起消失。**现在声明它是完全受支持的**，只是不要把它当成不会变的地基。

:::

文件位置：`data/<namespace>/mxt/cultivate_action/<path>.json`

**用途**：一次"运功"法门：吸收哪些环境灵气、每刻做什么、收费与收获、冷却。**已标记为将来可能移除。**

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `default` | Boolean | `false` | 没有已选修炼行为时是否作为默认行为；未标记时使用注册表中的第一个行为。 |
| `start_condition` | `EntityCondition` | `mxt:always_true` | 开始修炼条件。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 继续修炼条件；仅当条件为真时才会继续。 |
| `tick_interval` | Integer | `20` | 吸收结算间隔，范围 `1..72000`。 |
| `costs` | `List<Cost>` | `[]` | 每次修炼消耗，从修炼的实体身上扣，整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |
| `absorb_amount` | `NumberProvider` | `1` | 修炼时当前境界资源自然回复的倍率；先填满资源条，溢出量进入修为。 |
| `aura_costs` | 只含 `mxt:aura` 条目的 `List<Cost>` | `[]` | 每次修炼从修炼者所在位置的**共享灵气池**扣除的消耗；多人同区块修炼时，金额先按池子分配份额缩放，再由池子**全有或全无**地扣。只接受 `mxt:aura` 条目（写其它类型是加载错误）；旧的 `{"<灵气 id>": NumberProvider}` 映射写法仍可读（兼容），但一律写成数组。`amount` 为 `0` 不再被忽略：与其它消耗一样必须求值为有限正数，否则这一项付不出。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |
| `aura_gains` | `List<AuraGain>` | `[]` | 额外增加的灵气；每项是 `{id, amount}`，`id` 是 `Holder<aura>`。 |

没有单独的"环境类型"字段：能在哪里修炼完全由 `start_condition`（开始时检查一次）与 `condition`（每次结算前检查）表达，两者都能读环境——`mxt:aura_range` 要求某门灵气的浓度区间，`mxt:dimension` 要求维度，方块/群系类条件要求脚下的地方。`condition` 不成立会**中止**本次运功（actionbar 报「修炼条件未满足」），`start_condition` 不成立则从一开始就起不来。注意这与 `aura_zone.cultivate_condition` 是两侧：那个由环境自己声明"我这里允不允许修炼"，这两个由法门声明"我需要什么"。
| `cooldown` | Integer | `0` | 停止后冷却 tick。 |
| `tick_action` | `EntityAction` | `mxt:no_op` | 每次修炼 tick 行为。 |

`element` 定义独立灵气类型及颜色；灵气存量与要求这类字段（环境、方块、物品存量等）仍使用按灵气分组的 Map，而消耗字段是 `Cost` 数组。每个数的灵气身份与修炼行为由 `aura` 定义描述（一对一引用一个 `resource`）：境界入口 `first_realm`、凡人阈值 `start_exp`、开始修炼条件 `start_cultivate_conditions`、自然恢复 `regen`、灵气标记 `aura_type`、灵力射线 `burst_amount`、修为双向换算、`use_condition` 与 `show_cultivation_info` 都在这里；`resource` 本身只负责存储数值与资源条。境界链属于 `aura` 定义：每个 `realm_stage` 通过 `aura` 字段指向定义，定义再指向数值，`next_realm` 把阶段连成一条只能前进的线性链；每个定义一条链，玩家可以同时持有多条链。境界阶段的 `breakthrough_exp`、`max_experience` 与 `breakthrough` 定义从当前阶段前往下一阶段的限制，`auto_breakthrough` 可选控制修炼时是否自动尝试突破（默认关闭）。凡人使用定义的 `start_exp` 作为首次突破阈值和上限，`first_realm` 只确定首次突破目标；首次突破使用目标首境界的 `breakthrough` 条件，`start_cultivate_conditions` 只用于开始修炼。`use_condition` 只控制资源条与主动消耗，不会阻止修炼、环境吸收或突破。已学习的功法全部同时生效。

`spirit_root` 和 `physique` 是附件中的可叠加来源，授予方式由 action 决定；本框架不规定具体灵根名称和数值。灵根和体质的持有状态是数据包原语：条件侧提供 `mxt:has_spirit_root`、`mxt:has_physique`，行为侧提供 `mxt:grant_spirit_root`、`mxt:remove_spirit_root`、`mxt:grant_physique`、`mxt:remove_physique`。体质可用 `holder_condition` 要求持有指定灵根或另一体质：

```json
{
  "attribute_modifiers": [{"attribute": "minecraft:max_health", "id": "example:physique/blazing_body", "amount": 2, "operation": "add_value"}],
  "granted_abilities": [],
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "start_exp": 100,
  "start_cultivate_conditions": { "conditions": [] },
  "use_condition": {
    "type": "mxt:has_realm",
    "aura": "example:qi"
  }
}
```

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "cultivate_condition": {"type": "mxt:always_true"},
  "aura_share_weight": 1.0,
  "breakthrough_exp": 100,
  "max_experience": 250,
  "auto_breakthrough": false,
  "breakthrough": { "conditions": [] }
}
```

