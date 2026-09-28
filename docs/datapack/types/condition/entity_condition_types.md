---
title: 实体条件类型
description: 模组注册的全部内置实体条件类型，以及每种类型接受的 JSON 字段。
---

# 实体条件类型

**实体条件**检查单个实体的状态并返回 `true` 或 `false`。被检查的实体由声明该条件的那张数据表提供，条件本身只描述要检查什么。

实体条件是 Java（内置）注册表，`type` id 固定，数据包不能新增条目、也不能移除条目。只有 Java 代码或 KubeJS 桥接能引入自定义条件类型，见 [KubeJS API](../../../kubejs/api-reference.md)。

`type` 选择一个内置类型，取值是本页列出的 id 之一，用 `mxt` 命名空间书写。字段名后带 `?` 的可选，其余列出的字段都必须填写；「字段」列列出的是直接取自该类型 codec 的 JSON 键。

## 元条件

`type` 与其余所有键都写在同一层：

```json
{
  "type": "mxt:health",
  "comparison": "<",
  "compare_to": 10
}
```

条件会作为值嵌在别的数据表里，通常就落在 `condition` 这样的字段下：

```json
"condition": {
  "type": "mxt:has_spirit_root",
  "spirit_root": "example:azure_root"
}
```

任何要实体条件的地方也接受条件数组。数组是 `mxt:and` 的简写，只有每一项都通过时才通过：

```json
"condition": [
  { "type": "mxt:sneaking" },
  { "type": "mxt:on_block", "condition": {"type": "mxt:block_tag", "tag": "minecraft:logs"} }
]
```

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always` | — | 始终通过。 |
| `mxt:never` | — | 始终失败。 |
| `mxt:and` | `conditions` | 只有当所有嵌套实体条件都通过时才通过。 |
| `mxt:or` | `conditions` | 只要有一个嵌套实体条件通过就通过。 |
| `mxt:not` | `condition` | 对嵌套实体条件取反。 |
| `mxt:chance` | `chance` | 按给定概率随机通过，概率取值在 `0` 与 `1` 之间。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的实体条件处理器。 |

`mxt:js` 的 `id` 是 `MxtConditions.entity(...)` 注册的回调；回调缺失时判定为 `false`。

::: info 比较字段
有若干类型把一个数值与某个数字相比较。类型把 `comparison` 与 `compare_to` 列为两个独立键时，它们直接写在条件对象上，如上面的示例。少数类型只写一个 `comparison` 键，其值是一个嵌套的比较对象，内部含有 `comparison` 与 `compare_to`；这些类型会在自己的说明里注明。比较运算符为 `==`、`!=`、`<`、`<=`、`>` 和 `>=`，而 `compare_to` 本身始终是普通数字。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 以交互方式展示每种类型的字段列表，用来核对字段名很方便，不必翻这里的表。
:::

## 状态、身份与修炼

### `mxt:sneaking`

检查实体是否正在潜行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:has_ability`

检查实体当前是否持有给定的 [技能](../../json/ability.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ability` | 技能 id | **必填** | 要查的技能。 |

### `mxt:has_curse`

检查实体是否持有一条满足**全部**给定筛选条件的 [诅咒](../../json/curse.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse?` | 诅咒 id 或 `#标签` | 不限 | 必须是这一条定义。 |
| `tags?` | `#标签` 或数组 | 不限 | 这一条实例必须同时带有列出的全部标签。 |
| `stacks?` | `{min?, max?}` | 不限 | 层数范围。 |
| `remaining_ticks?` | `{min?, max?}` | 不限 | 剩余 tick 范围。 |

```json
{"type": "mxt:has_curse", "stacks": {"min": 2}, "remaining_ticks": {"min": 1}}
```

`stacks` 与 `remaining_ticks` 都是 `{min?, max?}` 窗口，闭区间。永不过期的诅咒按无限计，因此它能回答 `min`，却永远不会满足 `max`。完全不写筛选条件时，问的是是否持有任意诅咒。

### `mxt:has_spirit_root`

检查实体当前是否持有给定的 [灵根](../../json/spirit_root.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `spirit_root` | 条目、`#标签` 或数组 | **必填** | 要查的灵根。 |

```json
{"type": "mxt:has_spirit_root", "spirit_root": "#example:fire_roots"}
```

`spirit_root` 接受条目、`#` 标签或它们的数组，所以"任意火属灵根"写一条标签即可。读的是身体持有的那份账本，"现在生效"与否见[灵根与体质的开关](../../json/spirit_root.md)。

### `mxt:has_physique`

检查实体当前是否持有给定的 [体质](../../json/physique.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `physique` | 体质 id | **必填** | 要查的体质。 |

### `mxt:realm`

把实体的[境界阶段](../../json/realm_stage.md)与 `realm` 比较。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `realm` | 境界阶段 | **必填** | 比较的基准境界。 |
| `comparison?` | `exact` / `at_least` / `at_most` | `exact` | 怎么比。 |
| `min_minor_stage?` | Integer | 不限 | 要求在该境界上达到过的最高层数不小于它，`0` 起。 |

```json
{"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"}
```

`min_minor_stage` 与公式变量 `minor_stage` 是同一套编号。它读的是**只增不减的层数记录**，所以"炼气期层数达到过 500"这类门槛在突破离开之后仍然成立；想表达"此刻就在这一层的窗口里"就配 `comparison: "exact"`。

### `mxt:has_realm`

对已针对给定[灵气](../../json/aura.md)进入境界链的实体通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id | **必填** | 要查的境界链所属灵气。 |

### `mxt:technique`

检查实体**学过**哪些[功法](../../json/technique.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `techniques?` | 条目、`#标签` 或数组 | 空表 | 要查的功法。 |
| `match?` | `any` / `all` | `any` | `any` 命中其一即可，`all` 写下的每一项都要满足。 |

```json
{"type": "mxt:technique", "techniques": ["example:azure_sword"], "match": "all"}
```

空表就是"学过任意一门"。空表配 `all` 会在加载期被拒绝，免得静默变成恒真。读的是"学过"而不是"正在生效"，功法没有启用开关（灵根与体质才有）；要表达"没有功法"就写 `mxt:not` 套一条。

### `mxt:cultivating`

检查实体**是不是正在运功**，也可以要求它正好在跑某一条[法门](../../json/cultivate_action.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action?` | 法门 id | 不限定 | 点名一条 `cultivate_action`，只有正在跑它的实体才通过。 |

```json
{"type": "mxt:cultivating"}
{"type": "mxt:cultivating", "action": "example:azure_meditation"}
```

运功状态在**开始运功的那一刻**就已经写好，所以同一趟运功里这个答案恒定，不是"结算过才为真"。它天然是给"还继续不继续修炼"（`tick_condition`）用的——**开始之前它必然为假**，所以别拿它去筛"此刻能不能修"；要判"同伴此刻能不能一起拿成果"，用 `mxt:partner` 问对方**手上拿着什么**。

### `mxt:partner`

检查**附近有没有符合条件的同伴**：以自己为球心 `range` 格内的存活生物，自己不算，每个候选再过一个双实体条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `range?` | 小数，`0.5..32` | `5.0` | 球形半径，单位格。 |
| `count?` | `{min?, max?}` | `{"min": 1}` | 命中数量的闭区间；不写 `max` 就是"至少 `min` 个"。 |
| `bientity_condition?` | 双实体条件 | 无条件 | **actor 是自己、target 是候选**。 |

```json
{"type": "mxt:partner", "range": 5.0, "count": {"min": 1, "max": 1},
 "bientity_condition": {"type": "and", "conditions": [
   {"type": "friend"},
   {"type": "target_condition", "condition": {
     "type": "mxt:main_hand_item",
     "item_condition": {"type": "mxt:has_component", "component": "mxt:technique"}}}
 ]}}
```

字段与 `mxt:riding` 同形，所以 `mxt:friend`、`mxt:distance`、`mxt:relation`、`mxt:same_team` 这一批双实体条件直接可用；要问候选**自己**的状态（手上拿着什么、身上什么状态）就套一层 `mxt:target_condition`。上面的写法就是双修的判据："5 格内有一个拿着功法手册的好友"——它在**双方都还没坐下时就能成立**，所以两人谁先按下修炼键都能进得去（要限定成"同一本"，把内层换成点名那件载体的物品条件即可）。它只回答"身边有没有这样的人"，不建立任何持久关系。

每拍会被问一次，半径上限与"每个候选一次双实体条件"都是为了把这次扫描关住：建议只写在真的需要它的那条法门里。

### `mxt:skill_stage`

检查已学功法爬到了哪一级。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `stage` | 技能水平 | **必填** | 点名一级。 |
| `comparison?` | `exact` / `at_least` / `at_most` | `exact` | 怎么比，比较走缓存索引出来的链内序号。 |
| `technique?` | 功法条目、`#标签` 或数组 | 每一门已学功法 | 把问题限定到某些功法。 |

```json
{"type": "mxt:skill_stage", "stage": "example:stage_three", "comparison": "at_least", "technique": "example:azure_sword"}
```

不写 `technique` 就问每一门已学功法，任一命中即成立。读的是**身体到达过的那一级**，没有晋升过就是功法的 `default_stage`；没有 `default_stage`、或缓存没能索引出这条链的功法永远答否。

### `mxt:has_element`

当实体的**启用**灵根所命名的元素中有一个出现在 `elements` 里时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | 元素条目、`#标签` 或数组 | **必填** | 要查的元素。 |

```json
{"type": "mxt:has_element", "elements": "#example:fire"}
```

"任意火属灵根"写一条 `#` 标签即可，之后新加的同类灵根无需改动这里。元素类条件的 `elements` 都至少写一项：写空表/空数组会在加载期被拒绝，而不是变成一条"恒真"或"恒假"的条件。

### `mxt:in_secret_realm`

判定实体是否在某份[秘境实例](../../json/secret_realm.md)里。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `definition?` | 一条 `mxt:secret_realm` 定义或 `#标签` | 不限定 | 限定是哪一份定义。 |
| `role?` | `any` / `owner` / `guest` | `any` | 在里面算什么身份。 |

`any` 表示在里面即可，`owner` 表示自己是主人，`guest` 表示在里面但不是主人。不在任何实例里时恒为 `false`，因此 `owner` 与 `guest` 都隐含"在里面"。

### `mxt:resource_compare`

检查实体某个数值的取值至少为 `min`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | 数值 id | **必填** | 要查的数值。 |
| `min` | [数值提供器](../number_provider_types.md) | **必填** | 门槛。 |

### `mxt:element_attachment`

读取元素在实体身上的积累量（`mxt:element_attachment` 附件，见 [element_reaction](../../json/element_reaction.md)）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | 元素 id 到窗口的映射 | **必填** | 每一项都是一段元素 id 到 `max`／`min` 的窗口，每一项都要通过。 |
| `elements.<id>.max` | Double | **必填** | 该元素积累量的上限。 |
| `elements.<id>.min` | Double | 不限 | 该元素积累量的下限。 |

```json
{"type": "mxt:element_attachment", "elements": {"#example:fire": {"min": 20, "max": 100}}}
```

写空表会在加载期被拒绝而不是当成"恒真"。这是积累系统的只读一侧：可以让效果取决于身上攒了多少火，而不需要任何反应触发。

## 环境与位置

### `mxt:aura_range`

把服务端解析出的实体所在位置的灵气浓度与逐灵气的需求相比较。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id 到要求的映射 | **必填** | 每一项都是一段灵气 id 到 `max`／`min` 的要求。 |
| `aura.<id>.max` | [数值提供器](../number_provider_types.md) | **必填** | 该灵气浓度的上限。 |
| `aura.<id>.min` | [数值提供器](../number_provider_types.md) | `0` | 该灵气浓度的下限。 |

```json
{"type": "mxt:aura_range", "aura": {"example:fire_qi": {"min": 10, "max": 100}}}
```

逐灵气比较实体所在位置的浓度，写下的每一种都要满足。

### `mxt:aura_element`

按**元素**而不是按具名灵气测试实体所在位置的灵气。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | 元素 id 到要求的映射 | **必填** | 每一项都是一段元素 id 到 `max`／`min` 的要求，每一项都要通过。 |
| `elements.<id>.max` | [数值提供器](../number_provider_types.md) | **必填** | 该元素浓度的上限。 |
| `elements.<id>.min` | [数值提供器](../number_provider_types.md) | `0` | 该元素浓度的下限。 |

该位置上所有携带这个元素的**存活**灵气会先求和再比较，每一项都要通过。给区域再加另一种同元素灵气即可满足要求，不必改动查询。

### `mxt:dimension`

检查实体所在维度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dimension` | 维度 id | **必填** | 要查的维度。 |
| `inverted?` | Boolean | `false` | `true` 时取相反结果。 |

### `mxt:exposed_to_sky`

检查实体所在位置能否看到天空。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:exposed_to_sun`

检查实体是否暴露在阳光下。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:brightness`

比较实体眼睛处的亮度，取值在 `0` 与 `1` 之间。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:time_of_day`

比较主世界时钟时间，取值是 24000 tick 一天内的 tick 数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:on_block`

对实体所站的方块测试一条[方块条件](block_condition_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | [方块条件](block_condition_types.md) | **必填** | 要对脚下那块方块测的条件。 |

### `mxt:in_block`

对实体所在方块位置的那一个方块测试一条[方块条件](block_condition_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `block_condition` | [方块条件](block_condition_types.md) | **必填** | 要测的条件。 |

### `mxt:in_block_anywhere`

比较实体碰撞箱内匹配的方块数量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `block_condition` | [方块条件](block_condition_types.md) | **必填** | 要匹配的条件。 |
| `comparison` | 嵌套比较对象 | **必填** | 内部含有 `comparison` 与 `compare_to`。 |

### `mxt:block_collision`

检查实体在偏移位置上是否有方块碰撞。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `offset_x?` | Double | `0` | 偏移量。 |
| `offset_y?` | Double | `0` | 偏移量。 |
| `offset_z?` | Double | `0` | 偏移量。 |

### `mxt:formation_member`

当实体在当前维度拥有任意已注册的[阵法](../../json/formation.md)时通过（**归属名单**上有它就算）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:formation_owner`

当实体是当前正在求值的阵法的阵主**之一**时通过（归属是一组 UUID，名单上任何一位都算）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

在阵法上下文之外恒为 `false`。

### `mxt:formation_ally`

当当前正在求值的阵法的**某一位**阵主把该实体视为友军时通过（任一位认得它就算）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:entity_tag`

把实体与实体类型标签匹配。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | `#标签` | **必填** | 实体类型标签。 |

### `mxt:entity_type`

检查实体的类型。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity_type` | 实体类型 id | **必填** | 要查的类型。 |

## 生命、状态与数值

### `mxt:air`

比较实体剩余的氧气值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:health`

比较实体当前的生命值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:relative_health`

比较实体的生命值除以其最大生命值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:pill_toxicity`

比较实体身上累计的丹毒。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

```json
{"type": "mxt:pill_toxicity", "comparison": ">=", "compare_to": 100}
```

形状与 `mxt:health` 相同。从未服过丹药的实体读 `0`，也不会因此多出一份空记录。丹毒怎么涨、阈值在哪、过量后剩多少写在 [pill_binding](../../json/pill_binding.md)；要直接改写这个数用 `mxt:modify_pill_toxicity`。

### `mxt:fall_distance`

比较实体的下落距离。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:glowing`

检查实体是否发光。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:mob_effect`

检查实体是否带有给定的状态效果。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | 状态效果 id | **必填** | 要查的效果。 |

### `mxt:can_have_effect`

检查实体能否受到给定状态效果的影响。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | 状态效果 id | **必填** | 要查的效果。 |

### `mxt:attribute`

比较实体的某一条属性值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attribute` | 属性 id | **必填** | 要查的属性。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:using_item`

检查实体当前是否正在使用物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

### `mxt:equipped_item`

把某个装备槽里的物品与一条[物品条件](item_condition_types.md)对照检查。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `equipment_slot` | 原版装备槽名 | **必填** | 要查的槽位。 |
| `item_condition?` | [物品条件](item_condition_types.md) | 无条件 | 对那一堆物品测的条件。 |

### `mxt:has_equipped_item`

当实体穿戴或手持的物品堆满足一条[物品条件](item_condition_types.md)时通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `item_condition?` | [物品条件](item_condition_types.md) | 无条件 | 对每一堆物品测的条件。 |
| `slots?` | 槽位名或数组 | 全部原版槽位与全部 Curios 槽位 | 限定要检查的槽位。 |

```json
{"type": "mxt:has_equipped_item", "item_condition": {"type": "mxt:item_tag", "tag": "#example:swords"}}
```

这是把被动 `mxt:modifier` 绑定在装备上的自然做法。`slots` 可以写原版装备槽名（`mainhand`、`offhand`、`head`、`chest`、`legs`、`feet`、`body`），也可以写带 `curios:` 前缀的 Curios 槽位（`curios:back_weapon`）；不写则询问全部原版槽位与全部 Curios 槽位。匹配不到任何东西的名字只是永远不通过。

### `mxt:main_hand_item`

只看**主手**那一堆物品的一条[物品条件](item_condition_types.md)；主手空着时不通过。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `item_condition?` | [物品条件](item_condition_types.md) | 无条件 | 对主手那一堆物品测的条件。 |

```json
{"type": "mxt:main_hand_item", "item_condition": {"type": "mxt:item_quality", "quality": ["example:fine"]}}
```

比 `mxt:equipped_item` 少写一个 `equipment_slot`（那个要写 `"mainhand"` 才是同一件事），也不像 `mxt:has_equipped_item` 会把 Curios 槽位一起问一遍。

## 玩家与计分板

### `mxt:food_level`

比较玩家的饥饿值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:saturation_level`

比较玩家的饱和度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:experience_level`

比较玩家的经验等级。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:experience_points`

比较玩家的经验总点数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:gamemode`

检查玩家的游戏模式。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gamemode` | 游戏模式名 | **必填** | 要查的游戏模式。 |

### `mxt:attack_cooldown`

比较玩家当前攻击冷却的进度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:team`

检查实体是否在某个计分板队伍中；写了 `team` 时检查是否在指定队伍中。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `team?` | 队伍名 | 任意队伍 | 指定队伍。 |

### `mxt:scoreboard`

比较计分板分数，分数持有者默认取实体的计分板名称。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name?` | 分数持有者名 | 实体的计分板名称 | 换一个分数持有者。 |
| `objective` | 计分项名 | **必填** | 要读的计分项。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

## 骑乘与乘客

### `mxt:passenger`

比较实体的直接乘客中满足某条[双实体条件](bientity_condition_types.md)的数量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bientity_condition?` | [双实体条件](bientity_condition_types.md) | 无条件 | 对每一位乘客测的条件。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:passenger_recursive`

比较满足某条双实体条件的嵌套乘客数量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bientity_condition?` | [双实体条件](bientity_condition_types.md) | 无条件 | 对每一位乘客测的条件。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:riding`

把实体的载具与一条[双实体条件](bientity_condition_types.md)对照检查。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bientity_condition?` | [双实体条件](bientity_condition_types.md) | 无条件 | 对载具测的条件。 |

### `mxt:riding_recursive`

比较整条骑乘链上满足某条双实体条件的载具数量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bientity_condition?` | [双实体条件](bientity_condition_types.md) | 无条件 | 对每一位载具测的条件。 |
| `comparison` | 比较运算符 | **必填** | `==`、`!=`、`<`、`<=`、`>` 或 `>=`。 |
| `compare_to` | Double | **必填** | 比较的数值。 |

### `mxt:riding_root`

对实体骑乘链根部的载具测试一条双实体条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bientity_condition?` | [双实体条件](bientity_condition_types.md) | 无条件 | 对根部载具测的条件。 |

## 存储

六个 `mxt:storage_*` 条件读的是宿主声明的状态值，地址都是 `family` + `id`。`family` 指出宿主所在的数据包注册表，`id` 是宿主；除 `mxt:storage_cooldown` 之外都要求宿主**声明过**那种种类，没声明就判断为 `false`。种类可存什么见[技能施放](/technical/ability)。

### `mxt:storage_toggle`

读取一个 [`mxt:toggle`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `expected?` | Boolean | `true` | 期望的开关状态。 |

当存储的 `state` 等于 `expected` 时为真；从未写入过时读作该种类的 `default`（缺省 `false`）。

### `mxt:storage_timer`

读取一个 [`mxt:timer`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `remaining?` | `{min?, max?}` | 无 | 剩余 tick 数窗口，不会为负。 |
| `ended?` | Boolean | 无 | 问 `ends_at` 是否已过。 |

没有 `ends_at` 的计时没有在运行，因此没有剩余，算作已结束。

### `mxt:storage_resource`

读取一个 [`mxt:resource`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `amount?` | `{min?, max?}` | 无 | 数量窗口。 |

存下来的记录没有 `amount` 时按 `0` 计，而省略 `amount` 只问是否存有该类值。

### `mxt:storage_target`

读取一个 [`mxt:target_lock`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `locked?` | Boolean | `true` | 问是否存有目标 UUID。 |
| `max_distance?` | Double | 无 | 额外要求的最大距离。 |

`max_distance` 额外要求该 UUID 能解析出来，并且能在施动者所在维度中按该距离找到对应实体。UUID 格式错误、实体不存在或距离为负数都算 `false`。

### `mxt:storage_charges`

读取一个 [`mxt:charges`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `remaining?` | `{min?, max?}` | 无 | 剩余可用次数窗口。 |

从未消耗过的次数池不会记下计数，读作声明里的 `maximum`。

### `mxt:storage_cooldown`

读取一个 [`mxt:cooldown`](/technical/ability) 值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表名 | **必填** | 宿主所在的数据包注册表。 |
| `id` | 宿主 id | **必填** | 宿主。 |
| `remaining?` | `{min?, max?}` | 无 | 剩余 tick 数窗口。 |
| `ready?` | Boolean | 无 | 问冷却是否已完成。 |

长度读 `duration`、倒计时起点读 `started_at`（**时刻由这个种类自己带**）；内容自行写入而没带 `duration` 的值则按 `0` 计（等于没在冷却）。从未写入过值的宿主完全不在冷却中，因此 `remaining` 回答 `0`、`ready` 回答 `true`。**这一个不要求宿主声明 `mxt:cooldown`**：每次付款都会写这个值，所以凡是走付款闸门的技能都能被它读出来。

::: info 类型引用
`ability`、`curse`、`spirit_root`、`physique`、`realm`、`aura`、`element` 和 `resource` 接受对应数据包注册表的 ID，因此它们可以指向任意数据包添加的内容，而不只是模组自带的条目。
:::
