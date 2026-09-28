---
title: 实体行为类型
description: 模组注册的全部内置实体行为类型，以及每种类型接受的 JSON 字段。
---

# 实体行为类型

**实体行为**对单个实体执行一次操作。作用对象由声明这条行为的那张数据表给出，行为本身只描述要对它做什么。`type` 写在行为对象里，和它的字段平级，取值是带 `mxt` 命名空间、列在本页里的 id 之一。

实体行为是 Java（内置）注册表，`type` id 固定，数据包既加不了条目也删不掉条目。要加自定义类型只能写 Java，或者用 KubeJS 桥接，见 [KubeJS API](../../../kubejs/api-reference.md)。

```json
{
  "type": "mxt:heal",
  "amount": 4
}
```

行为是别的数据表里的值，所以通常嵌在 `entity_action` 这类字段下面：

```json
"entity_action": {
  "type": "mxt:apply_effect",
  "effect": "minecraft:speed",
  "duration_ticks": 200
}
```

凡是收实体行为的地方也收数组。数组是 `mxt:sequence` 的简写，按写的顺序挨个执行：

```json
"entity_action": [
  { "type": "mxt:extinguish" },
  { "type": "mxt:heal", "amount": 2 }
]
```

字段表里「默认」列标着 **必填** 的键必须写，其余写的是省略时的取值。可选的行为字段省略时默认是 `mxt:no_op`，所以"写了 `condition` 却漏了 `action`"这类错在加载期不报错，只是那一项什么都不做。

::: info 字段类型是共享的
许多字段收[数值提供器](../number_provider_types.md)而不是固定数字，另有一些类型引用共享的[数据类型](../shared_data_types.md)。字段收嵌套的行为或条件时，值用对应家族的 id。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能交互式地列出一个类型有哪些字段，核对字段名挺方便，不用翻本页的表。
:::

## 元行为类型

元行为不直接改实体，它们决定别的实体行为跑不跑、跑哪一个、按什么顺序跑。

### `mxt:no_op`

什么都不做，没有字段。可选行为字段的默认值就是它。

```json
{ "type": "mxt:no_op" }
```

### `mxt:js`

把这次操作交给通过 KubeJS 桥接注册的实体行为处理器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 用 `MxtActions.entity(...)` 注册回调时写的 id。 |
| `params` | JSON 对象 | `{}` | 原样传给回调的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:my_entity_action",
  "params": { "amount": 3 }
}
```

脚本侧的回调拿到实体、`params` 和本次的求值上下文。回调缺失、或抛出异常时，这条行为什么都不做并记一条日志，服务器不会崩。

### `mxt:sequence`

按顺序执行一组实体行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 实体行为数组 | **必填** | 挨个执行的行为。 |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:extinguish" },
    { "type": "mxt:heal", "amount": 2 }
  ]
}
```

前面一条跑不跑得成都不会中断后面一条，整个列表按书写顺序走完。

### `mxt:chance`

以 `chance` 的概率执行 `action`，没命中就执行 `fail_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 实体行为 | **必填** | 命中时执行的行为。 |
| `chance` | 浮点数 | **必填** | 命中概率，取值 `0`–`1`。 |
| `fail_action` | 实体行为 | `mxt:no_op` | 没命中时执行的行为。 |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:heal", "amount": 4 },
  "fail_action": { "type": "mxt:damage", "amount": 2 }
}
```

写超出 `0..1` 的概率在加载期就被拒收。判定是"随机数小于 `chance`"，所以写 `1` 必命中，写 `0` 永远不命中。抽签只抽一次，`action` 与 `fail_action` 恰好跑一个。

### `mxt:if_else`

实体条件通过就跑 `if_action`，否则跑 `else_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 实体条件 | **必填** | 拿哪条条件判定。 |
| `if_action` | 实体行为 | **必填** | 条件通过时执行的行为。 |
| `else_action` | 实体行为 | `mxt:no_op` | 条件不通过时执行的行为。 |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:always" },
  "if_action": { "type": "mxt:extinguish" }
}
```

两个分支里最多跑一个。条件拿到的是这条行为正在作用的那个实体。

### `mxt:choice`

从带权重的列表里抽一项执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 加权条目数组 | **必填** | 抽中哪条就跑哪条。 |

每个条目是：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 实体行为 | **必填** | 该条目被选中时执行的行为。 |
| `weight` | 整数 | `1` | 相对权重；越大越容易被选中。 |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "weight": 3, "value": { "type": "mxt:heal", "amount": 4 } },
    { "weight": 1, "value": { "type": "mxt:damage", "amount": 2 } }
  ]
}
```

`≤0` 的条目永远不会被选中；整表算下来是 `0` 时（例如全是 `0` 或负数）退化成等概率抽一项，所以抽不出结果不会发生。抽中的条目只跑一次，其余条目一条都不跑。

## 行为类型

### `mxt:dismount`

让实体停止骑乘其载具。

没有字段，整条就写作 `{"type": "mxt:dismount"}`。

### `mxt:extinguish`

熄灭实体身上的火。

没有字段，整条就写作 `{"type": "mxt:extinguish"}`。

### `mxt:heal`

治疗实体。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 治疗量，点数。 |

```json
{ "type": "mxt:heal", "amount": 4 }
```

非生物目标不跑。求值不是有限值、或不大于 `0` 时也不治疗。

### `mxt:damage`

对实体施加伤害。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 伤害量，点数。 |
| `damage_type` | 伤害类型 id | 无 | 构造这一击的来源。 |
| `element` | 元素 id 或 `#标签`的列表 | `[]` | 声明这一击的元素。 |

```json
{ "type": "mxt:damage", "amount": 4, "damage_type": "minecraft:magic" }
```

它**没有归属**，因此不结算灵根元素关系，也不记攻击者：反噬、丹药毒性和环境 tick 这类"代价"用它是对的。当它落在施法者以外的人身上时，改为把施法者记为加害者。

`damage_type` 构造这一击的来源，`element` 声明这一击的元素：只写元素时取它认领的第一个类型；两个都写时在**首次使用**这一击时核对元素确实认领了它，不一致各报一次日志。见[伤害系统](/technical/damage)。

只在服务端结算；求值不是有限值或不大于 `0` 时什么都不做。

### `mxt:attach_element`

给实体加上（或减去）某个元素的附着。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `element` | 元素 id | **必填** | 要加减哪个元素的附着。 |
| `amount` | 数值提供器 | **必填** | 加多少；负数表示净化。 |

```json
{ "type": "mxt:attach_element", "element": "example:fire", "amount": -5 }
```

求值不是有限值、或等于 `0` 时什么都不做。写正数会走与打击**同一条**反应管线，攒够即触发 [element_reaction](../../json/element_reaction.md)，所以"泡在岩浆里""服丹""诅咒持续喂火"都用它。

### `mxt:add_resource`

给服务端持有的实体[数值](../../json/resource.md)加上一个有符号数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | 数值 id | **必填** | 改哪一门数值。 |
| `amount` | 数值提供器 | **必填** | 加多少，可正可负。 |

```json
{ "type": "mxt:add_resource", "resource": "example:qi", "amount": 10 }
```

求值不是有限值时什么都不做。

### `mxt:grant_ability`

使用显式的持久化来源标识授予一个[技能](../../json/ability.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ability` | 技能 id | **必填** | 授予哪条技能。 |
| `source` | 标识符 | **必填** | 这次授予记在哪个来源名下。 |

```json
{
  "type": "mxt:grant_ability",
  "ability": "example:sword_focus",
  "source": "example:ritual"
}
```

### `mxt:grant_spirit_root`

授予实体一个[灵根](../../json/spirit_root.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `spirit_root` | 灵根 id | **必填** | 授予哪条灵根。 |

```json
{ "type": "mxt:grant_spirit_root", "spirit_root": "example:azure_root" }
```

非生物目标不跑。

### `mxt:grant_physique`

在其持有条件、叠层与互斥检查都通过后授予一个[体质](../../json/physique.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `physique` | 体质 id | **必填** | 授予哪条体质。 |

```json
{ "type": "mxt:grant_physique", "physique": "example:flame_body" }
```

非生物目标不跑。任何一项检查不过就不授予。

### `mxt:remove_ability`

只移除属于 `source` 的那条技能授予，保留其他来源的授予。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ability` | 技能 id | **必填** | 撤销哪条技能。 |
| `source` | 标识符 | **必填** | 撤销哪个来源名下的那份授予。 |

```json
{
  "type": "mxt:remove_ability",
  "ability": "example:sword_focus",
  "source": "example:ritual"
}
```

### `mxt:remove_spirit_root`

移除一个已持有的灵根及其授予的技能。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `spirit_root` | 灵根 id | **必填** | 移除哪条灵根。 |

```json
{ "type": "mxt:remove_spirit_root", "spirit_root": "example:azure_root" }
```

非生物目标不跑。

### `mxt:remove_physique`

移除一个已持有的体质及其授予的技能和属性来源。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `physique` | 体质 id | **必填** | 移除哪条体质。 |

```json
{ "type": "mxt:remove_physique", "physique": "example:flame_body" }
```

非生物目标不跑。

### `mxt:apply_curse`

通过权威诅咒事务施加一个数据包[诅咒](../../json/curse.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | 诅咒 id | **必填** | 施加哪条诅咒。 |
| `stacks` | 数值提供器 | `1` | 施加几层。 |
| `duration_ticks` | 数值提供器 | 无 | 持续多少 tick；不写由诅咒自己决定。 |

```json
{ "type": "mxt:apply_curse", "curse": "example:burning_meridian", "stacks": 2 }
```

`stacks` 不是有限值、小于 `1` 或大于 `256` 时整条不施加，`stacks` 按四舍五入取整。`duration_ticks` 不是有限值、为负或超过 `Long.MAX_VALUE` 时当作没写这一项。

### `mxt:apply_curses`

通过标准事务施加若干个独立配置的诅咒。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curses` | 诅咒条目数组 | **必填** | 逐条独立施加。 |

```json
{
  "type": "mxt:apply_curses",
  "curses": [
    { "curse": "example:burning_meridian", "stacks": 2 },
    { "curse": "example:weak_spirit", "duration_ticks": 600 }
  ]
}
```

::: info 条目形状与默认值
每个条目自身**不带** `type` 键：

| 条目字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | 诅咒 id | **必填** | 施加哪条诅咒。 |
| `stacks` | 数值提供器 | `1` | 施加几层。 |
| `duration_ticks` | 数值提供器 | 无 | 持续多少 tick；不写由诅咒自己决定。 |
:::

条目之间互不影响，某一条不施加不会停掉后面的条目。

### `mxt:remove_curse`

以 `cleansed` 原因移除一个指定诅咒，因此它的 `on_cleanse` 会执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | 诅咒 id | **必填** | 移除哪条诅咒。 |

```json
{ "type": "mxt:remove_curse", "curse": "example:burning_meridian" }
```

### `mxt:remove_curses_by_tag`

净化模型的解除侧：移除所有带有所给 `mxt:curse` 标签中**任意一个**的已持有诅咒，原因同样是 `cleansed`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tags` | 标签数组 | **必填** | 写成 `"#namespace:path"`。 |

```json
{ "type": "mxt:remove_curses_by_tag", "tags": ["#example:minor_curses"] }
```

诅咒定义从不声明什么可以净化它。

### `mxt:apply_effect`

对生物实体施加一个原版状态效果。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | 状态效果 id | **必填** | 施加哪个效果。 |
| `duration_ticks` | 数值提供器 | **必填** | 持续多少 tick。 |
| `amplifier` | 数值提供器 | `0` | 效果等级。 |

```json
{
  "type": "mxt:apply_effect",
  "effect": "minecraft:speed",
  "duration_ticks": 200
}
```

非生物目标不跑。时长或等级不是有限值、时长小于 `1` 或超过 `Integer.MAX_VALUE`、等级为负或大于 `255` 时什么都不做。

### `mxt:teleport`

在实体当前所在维度内移动它。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `x` | 数值提供器 | **必填** | 目标 X 坐标。 |
| `y` | 数值提供器 | **必填** | 目标 Y 坐标。 |
| `z` | 数值提供器 | **必填** | 目标 Z 坐标。 |

```json
{ "type": "mxt:teleport", "x": 0, "y": 64, "z": 0 }
```

三个坐标都必须求值为有限值，否则不传送。

### `mxt:knockback`

添加一个有界的速度向量；碰撞与坠落处理仍由原版负责。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `x` | 数值提供器 | **必填** | X 方向推力。 |
| `y` | 数值提供器 | **必填** | Y 方向推力。 |
| `z` | 数值提供器 | **必填** | Z 方向推力。 |

```json
{ "type": "mxt:knockback", "x": 0, "y": 1, "z": 0 }
```

三个分量都必须求值为有限值，否则一点推力都不加。

### `mxt:modify_storage`

写入某个宿主的一种已声明存储类型。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表 id | **必填** | 宿主所在的数据包注册表。 |
| `id` | 标识符 | **必填** | 宿主自身。 |
| `value` | 存储对象 | **必填** | 完整的存储对象。 |

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:sword_focus",
  "value": { "type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1 }
}
```

宿主没有声明的类型以及运行期自身的游标都会被拒绝。只在服务端写；`family` 不是会保存存储的宿主家族、或宿主没声明 `value` 的这个类型时，记一条警告后什么都不写。

### `mxt:spawn_entity`

在行为实体所在维度的给定绝对坐标生成一个已注册实体，朝向与之保持一致。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity_type` | 实体类型 id | **必填** | 生成什么实体。 |
| `x` | 数值提供器 | **必填** | 绝对 X 坐标。 |
| `y` | 数值提供器 | **必填** | 绝对 Y 坐标。 |
| `z` | 数值提供器 | **必填** | 绝对 Z 坐标。 |

```json
{ "type": "mxt:spawn_entity", "entity_type": "minecraft:zombie", "x": 0, "y": 64, "z": 0 }
```

只在服务端生成。三个坐标都必须求值为有限值，否则什么都不做。

### `mxt:spawn_projectile`

创建一个弹射物实体，把行为实体指定为所有者，并给它一个由公式驱动的速度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity_type` | 实体类型 id | **必填** | 生成哪个弹射物。 |
| `velocity_x` | 数值提供器 | **必填** | X 方向速度。 |
| `velocity_y` | 数值提供器 | **必填** | Y 方向速度。 |
| `velocity_z` | 数值提供器 | **必填** | Z 方向速度。 |

```json
{
  "type": "mxt:spawn_projectile",
  "entity_type": "minecraft:arrow",
  "velocity_x": 0,
  "velocity_y": 0.5,
  "velocity_z": 3
}
```

只在服务端生成。出生点是这次发动的地点，朝向复制行为实体。三个速度分量都必须求值为有限值；`entity_type` 创建出来不是弹射物时什么都不做。

### `mxt:add_experience`

给玩家增加经验点数或等级。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | 整数 | 无 | 增加的经验点数。 |
| `levels` | 整数 | 无 | 增加的经验等级。 |

```json
{ "type": "mxt:add_experience", "levels": 2 }
```

只对玩家生效。两个字段都可以不写，写哪个加哪个；两个都不写就什么都不做。

### `mxt:add_velocity`

给实体增加速度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `x` | 浮点数 | `0` | 向量 X 分量。 |
| `y` | 浮点数 | `0` | 向量 Y 分量。 |
| `z` | 浮点数 | `0` | 向量 Z 分量。 |
| `space` | 坐标空间 | `world` | 这个向量在哪个参考系里解算。 |
| `set` | 布尔 | `false` | 为 `true` 时直接设置速度，而不是叠加。 |

```json
{ "type": "mxt:add_velocity", "y": 2 }
```

`space` 取 `world`、`local`、`local_horizontal`、`local_horizontal_normalized`、`velocity`、`velocity_normalized`、`velocity_horizontal`、`velocity_horizontal_normalized` 之一。带 `local` 的用实体视线当基向量，带 `velocity` 的用当前速度当基向量；带 `horizontal` 的把基向量压到水平面，带 `normalized` 的用归一化后的基向量，不再按基向量长度缩放。`world` 就是不做这套换算，直接把三个分量当世界坐标方向用。

注意：基向量长度不超过 `0.007` 时这个向量会被清成零向量——站着不动却用 `velocity` 参考系就是这个结果。

### `mxt:exhaust`

给玩家增加消耗度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 浮点数 | **必填** | 增加的消耗度。 |

```json
{ "type": "mxt:exhaust", "amount": 0.5 }
```

只对玩家生效；`amount` 不大于 `0` 时什么都不做。

### `mxt:feed`

恢复饱食度与饱和度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `food` | 整数 | **必填** | 恢复的饱食度。 |
| `saturation` | 浮点数 | **必填** | 恢复的饱和度。 |

```json
{ "type": "mxt:feed", "food": 4, "saturation": 2.0 }
```

只对玩家生效。

### `mxt:gain_air`

恢复实体的氧气值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 整数 | **必填** | 增加的氧气值。 |

```json
{ "type": "mxt:gain_air", "value": 100 }
```

### `mxt:give_item`

把一个物品堆交给玩家：先对副本执行可选的物品行为，并在所请求的槽位为空时优先放入该槽位。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `stack` | 物品堆模板 | **必填** | 要给的物品，写 `{"id": ...}`，可带 `count` 与数据组件。 |
| `item_action` | 物品行为 | `mxt:no_op` | 对副本先跑一遍的物品行为。 |
| `preferred_slot` | 装备槽名 | 无 | 优先放进哪个槽位。 |

```json
{ "type": "mxt:give_item", "stack": { "id": "minecraft:apple", "count": 1 } }
```

只对玩家生效。物品行为跑完副本变空就不再发放。`preferred_slot` 写的槽位是空的就放进那个槽，否则放进物品栏。

### `mxt:play_sound`

播放一个声音事件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sound` | 声音事件 id | **必填** | 播放哪个声音。 |
| `category` | 声音分类 | 无 | 不写就用实体自己的音源。 |
| `volume` | 浮点数 | `1` | 音量。 |
| `pitch` | 浮点数 | `1` | 音高。 |

```json
{ "type": "mxt:play_sound", "sound": "minecraft:entity.player.levelup", "volume": 0.5 }
```

声音播在行为位置上。

### `mxt:remove_effect`

移除一个状态效果。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | 状态效果 id | **必填** | 移除哪个效果。 |

```json
{ "type": "mxt:remove_effect", "effect": "minecraft:speed" }
```

非生物目标不跑。

### `mxt:set_fall_distance`

设置实体的坠落距离。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `distance` | 浮点数 | **必填** | 要设置的坠落距离。 |

```json
{ "type": "mxt:set_fall_distance", "distance": 0 }
```

### `mxt:set_no_gravity`

设置实体是否受重力影响。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `no_gravity` | 布尔 | `true` | 为 `true` 时不受重力。 |

```json
{ "type": "mxt:set_no_gravity" }
```

注意：`no_gravity` 的默认值就是 `true`，所以省略这个字段是从实体上移除重力，不是恢复重力。要恢复重力必须显式写 `"no_gravity": false`。

### `mxt:set_on_fire`

让实体着火指定的 tick 数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ticks` | 整数 | **必填** | 着火的 tick 数。 |

```json
{ "type": "mxt:set_on_fire", "ticks": 100 }
```

### `mxt:swing_hand`

让实体挥动一只手。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hand` | 手 | **必填** | `main_hand` 或 `off_hand`。 |

```json
{ "type": "mxt:swing_hand", "hand": "main_hand" }
```

非生物目标不跑。

### `mxt:emit_game_event`

在实体所在位置发出一个原版游戏事件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `event` | 游戏事件 id | **必填** | 发出哪个事件。 |

```json
{ "type": "mxt:emit_game_event", "event": "minecraft:step" }
```

### `mxt:passenger_action`

对匹配的直接或递归乘客执行嵌套行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 实体行为 | `mxt:no_op` | 对每个匹配的乘客执行。 |
| `bientity_action` | 双实体行为 | `mxt:no_op` | 以行为实体为施动者、乘客为目标执行。 |
| `bientity_condition` | 双实体条件 | 无 | 筛乘客。 |
| `recursive` | 布尔 | `false` | 为 `true` 时含间接乘客，否则只看直接乘客。 |

```json
{
  "type": "mxt:passenger_action",
  "action": { "type": "mxt:extinguish" }
}
```

逐个乘客处理：先过 `bientity_condition`，通过才跑 `action`，再跑 `bientity_action`。

### `mxt:block_action`

在行为实体所在的方块位置执行一个[方块行为](block_action_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 方块行为 | **必填** | 在那个位置跑的行为。 |

```json
{
  "type": "mxt:block_action",
  "action": { "type": "mxt:set_block", "block": "minecraft:air" }
}
```

### `mxt:self_bientity_action`

以当前实体同时作为施动者和目标，施加一个[双实体行为](bientity_action_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 双实体行为 | **必填** | 两端都是这个实体的行为。 |

```json
{
  "type": "mxt:self_bientity_action",
  "action": { "type": "mxt:heal_target", "amount": 2 }
}
```

### `mxt:equipped_item_action`

对一个已装备的物品堆执行[物品行为](item_action_types.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `slot` | 装备槽名 | **必填** | 取哪个槽位的物品堆。 |
| `action` | 物品行为 | **必填** | 对那个物品堆执行的行为。 |

```json
{
  "type": "mxt:equipped_item_action",
  "slot": "mainhand",
  "action": { "type": "mxt:damage_item", "amount": 1 }
}
```

非生物目标不跑。槽位是空的也照跑，空物品堆怎么处理由物品行为自己决定。

### `mxt:riding_action`

对匹配的载具执行嵌套行为，可选地沿整条骑乘链执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 实体行为 | `mxt:no_op` | 对每个匹配的载具执行。 |
| `bientity_action` | 双实体行为 | `mxt:no_op` | 以行为实体为施动者、载具为目标执行。 |
| `bientity_condition` | 双实体条件 | 无 | 筛载具。 |
| `recursive` | 布尔 | `false` | 为 `true` 时沿整条骑乘链往上看，否则只看直接载具。 |

```json
{
  "type": "mxt:riding_action",
  "action": { "type": "mxt:set_on_fire", "ticks": 60 }
}
```

从直接载具开始，每上一层先过 `bientity_condition`，通过才跑 `action` 与 `bientity_action`。没有载具时什么都不做。

### `mxt:explode`

在实体所在位置制造一次爆炸。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `power` | 浮点数 | **必填** | 爆炸威力。 |
| `interaction` | 原版爆炸交互类型 | `mob` | 例如 `mob` 或 `none`。 |
| `indestructible` | 方块条件 | 无 | 匹配上的方块在爆炸里被保护。 |
| `create_fire` | 布尔 | `false` | 爆炸是否留下火。 |

```json
{ "type": "mxt:explode", "power": 3.0, "create_fire": true }
```

只在服务端爆炸。`power` 不是有限数或者是负数时什么都不发生。施法者被记为这场爆炸的起因。

### `mxt:spawn_particles`

在实体周围生成粒子，可选地只对满足双实体条件的观察者显示。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `particle` | 粒子类型 | **必填** | 生成哪种粒子。 |
| `bientity_condition` | 双实体条件 | 无 | 筛哪些观察者收得到。 |
| `count` | 整数 | **必填** | 生成多少个，不能为负。 |
| `speed` | 浮点数 | `0` | 粒子的初速度。 |
| `force` | 布尔 | `false` | 为 `true` 时不受距离限制。 |
| `spread` | 三个浮点数 | `[0.5, 0.5, 0.5]` | 三个方向的散布。 |
| `offset_x` | 浮点数 | `0` | 相对行为位置的 X 偏移。 |
| `offset_y` | 浮点数 | `0.5` | 相对行为位置的 Y 偏移。 |
| `offset_z` | 浮点数 | `0` | 相对行为位置的 Z 偏移。 |

```json
{ "type": "mxt:spawn_particles", "particle": { "type": "minecraft:flame" }, "count": 10 }
```

只在服务端发出。逐观察者按 `bientity_condition` 过滤列表。`spread` 会先按实体自身的宽、眼高、宽缩放，再当作速度散布用。

### `mxt:spawn_effect_cloud`

在行为实体所在位置创建一个原版区域效果云。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `radius` | 浮点数 | `3` | 云的半径。 |
| `radius_on_use` | 浮点数 | `-0.5` | 每次生效后半径的变化量。 |
| `wait_time` | 整数 | `10` | 生成后等多少 tick 才开始生效。 |
| `effects` | 状态效果数组 | `[]` | 云带的效果。 |

```json
{ "type": "mxt:spawn_effect_cloud", "radius": 4, "wait_time": 20 }
```

只在服务端生成。

### `mxt:spawn_lightning`

在行为位置加上偏移量的位置劈下一道带颜色的闪电；这道闪电之后做什么由原版闪电自己的行为决定。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `offset_x` | 数值提供器 | `0` | 相对行为位置的 X 偏移。 |
| `offset_y` | 数值提供器 | `0` | 相对行为位置的 Y 偏移。 |
| `offset_z` | 数值提供器 | `0` | 相对行为位置的 Z 偏移。 |
| `color` | 颜色 | `0x737380` | 闪电颜色，写 `#RRGGBB` 或整数。 |
| `alpha` | 浮点数 | `0.3` | 辉光强度，取值 `0`–`1`。 |
| `thickness` | 浮点数 | `1` | 光柱粗细，取值 `0.1`–`4`。 |
| `palette` | RGB 颜色数组 | `[]` | 渐变，最多 `16` 个条目。 |
| `damage` | 数值提供器 | `5` | 雷击伤害。 |
| `visual_only` | 布尔 | `false` | 为 `true` 时这道闪电只作装饰。 |
| `cause` | 布尔 | `true` | 把它归属给玩家。 |

```json
{ "type": "mxt:spawn_lightning", "color": "#8A2BE2", "damage": 8 }
```

完全不需要字段也能写，闪电就落在行为位置本身，偏移量默认为 `0`。

`cause` 把这道闪电归属给玩家，玩家随后成为它造成伤害的来源；`cause` 生效要求行为实体本身是玩家。

四个数值字段（三个偏移量与 `damage`）都必须求值为有限值，否则整条不劈。`damage` 求值后为负按 `0` 处理。

::: info 颜色与渐变
`color` 接受与灵气颜色相同的 `#RRGGBB` 或整数写法，`alpha` 取 `0..1`，`thickness` 取 `0.1..4`。

`palette` 用渐变**取代**单一的 `color`：它是一组 RGB 颜色，第一个位于光柱顶端，最后一个位于地面，最多 16 个条目。渲染器逐接缝为闪电着色，并在相邻条目之间插值；由于分支读取的是同一组接缝，分支在离开主干的高度上与主干颜色一致。`alpha` 仍是整道闪电共用的一个辉光值，而不是每个颜色一个。

非法颜色或长度超过 16 的列表会让加载失败，而不是被静默丢弃。
:::

### `mxt:modify_lifespan`

把自选数字写进寿元账本。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `mode` | 字符串 | `add` | `add` 或 `set`。 |
| `amount` | 数值提供器 | **必填** | 数量，单位刻。 |

```json
{ "type": "mxt:modify_lifespan", "amount": -1200 }
```

这是数据包里**唯一一处**把自选数字写进寿元账本的写入，重开账本用下面那条 `mxt:reincarnate`。

`add` 接受负数（等于扣寿元，诅咒"折寿"用它），正数同时抬高剩余与上限。`add` 的 `0` 什么都不做，也不会给从没记过账的身体开一个 `0` 的账。`set` 把两个数一起改写，所以 `set` 的写死常量必须非负，否则加载期报错。

非生物目标是静默无操作。求值不是有限值时什么都不做。

**寿元总开关关着时这条写入照样记账**，因为那个开关只管时间流流不流逝。详见[寿元](/player-guide/lifespan)。

### `mxt:modify_pill_toxicity`

改写目标身上累计的丹毒。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `mode` | 字符串 | `add` | `add` 或 `set`。 |
| `amount` | 数值提供器 | **必填** | 数量。 |

```json
{ "type": "mxt:modify_pill_toxicity", "mode": "add", "amount": -30 }
```

这是数据包里**唯一一处**把自选数字写进丹毒账的写入。负的 `add` 就是排毒，结果不会低于 `0`；`set` 的写死常量必须非负，否则加载期报错。非生物目标是静默无操作，求值不是有限值时什么都不做。

丹毒平时由 [pill_binding](../../json/pill_binding.md) 的服用规则累积；服务端配置「炼丹 → 每秒丹毒自然消退」默认 `0`，也就是不自然消退。

### `mxt:reincarnate`

让目标当场**转世**。

没有字段，整条就写作 `{"type": "mxt:reincarnate"}`。

它先跑一遍服务端配置「转世」页那份重置清单（与「耗尽后果」选 `reincarnate` 时是同一份），再把账本按服务端配置「寿元 → 凡人基础寿元」重开（那里是 `0` 就等于关闭账本，身体重新读作「未记账」）。

它和命令 `/mxt lifespan reincarnate`、KubeJS 调用走的是同一个入口，所以**寿元总开关关着也照做**——那是当场落下的裁决，不是时间流逝。非生物目标是静默无操作（同 `mxt:modify_lifespan`）。

前后会发 `LifeSpanRebirthEvent` 的 `Pre` 与 `Post`：`Pre` 可取消，取消＝整次转世不发生、身体原样不动；寿元耗尽**不发**这两个事件（那条路发 `lifespanEnd`），见 [MxtEvents](/kubejs/api/events)。"转世丹""转世天劫""洗基诅咒"这类内容要的就是它，不然数据包只能等一本寿元耗尽。

### `mxt:cultivate`

让目标**开始运功**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action?` | 法门 id | 走挑选 | 点名一条 [`cultivation`](../../json/cultivation.md)；不写就按"当下适用的里 `priority` 最大的一条"挑。 |

```json
{ "type": "mxt:cultivate" }
{ "type": "mxt:cultivate", "action": "example:azure_meditation" }
```

与玩家自己按修炼键是**同一条开始路径**：点名的那条也要过自己的 `start_condition` 与 `cultivate_condition`（"这一拍能不能拿到成果"；`tick_condition` 答的是"还继续不继续修炼"，开始前不参与挑选），一条都不适用就什么都不发生。

**没有返回值，失败一律静默**：已经在修炼、或在冷却、或条件不成立都只是"没开始"。要提示就在数据包里用 `mxt:if_else` 配 [`mxt:cultivating`](../condition/entity_condition_types.md) 自己发消息。

只在服务端生效，非生物目标是静默无操作。这是数据包与脚本把一具身体"开练"的唯一入口（另一个入口是玩家的修炼键）。

### `mxt:stop_cultivating`

让目标**停下正在运功的那一条**，并按下这条法门自己的 `cooldown` 写冷却。

没有字段，整条就写作 `{"type": "mxt:stop_cultivating"}`。

与玩家自己按修炼键停下是同一条路径（含漂浮物的归还、突破侦听的清理与移动限制的解除）。目标本来就没在修炼时静默无操作；同样只在服务端生效、只认生物。

::: info 嵌套值
`mxt:if_else` 接受一个[实体条件](../condition/entity_condition_types.md)；`mxt:passenger_action` 与 `mxt:riding_action` 接受实体行为、[双实体行为](bientity_action_types.md)和[双实体条件](../condition/bientity_condition_types.md)；`mxt:explode` 用[方块条件](../condition/block_condition_types.md)筛选受保护的方块。
:::
