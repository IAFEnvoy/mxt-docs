---
title: item_action_type（物品行为）
description: 模组注册的全部内置物品行为类型，以及每种类型接受的 JSON 字段。
---

# item_action_type（物品行为）

**物品行为**作用于单个物品堆。持有者实体与物品堆由声明该行为的那张数据表提供，行为本身只描述要对交给它的物品堆做什么。

物品行为属于 Java（内置）注册表，`type` id 固定，数据包无法新增。`type` 写在行为对象里，与它的字段平级，取值是带 `mxt` 命名空间、列在本页表中的 id 之一。数据包不会在这个注册表中新增或删除条目，只有 Java 代码或 KubeJS 桥接能引入自定义行为类型——见 [KubeJS API](../../../kubejs/api-reference.md)。

```json
{
  "type": "mxt:damage_item",
  "amount": 1
}
```

行为通常作为值嵌在其他数据表的字段下，例如 `item_action`：

```json
"item_action": {
  "type": "mxt:consume_item",
  "count": 1
}
```

任何需要物品行为的地方也接受数组。数组是 [`mxt:sequence`](#mxt-sequence) 的简写，按顺序执行其中的条目：

```json
"item_action": [
  { "type": "mxt:damage_item", "amount": 1 },
  { "type": "mxt:cooldown", "ticks": 40 }
]
```

行为字段几乎都是可选的，默认值就是 `mxt:no_op`：写了 `condition` 却忘了 `action` 这类漏写在加载期不报错，只是那一项什么都不做。

::: info 物品行为的运行位置
物品行为需要一个物品堆作为作用对象，因此通常经由已经提供物品堆的那张表到达——例如[实体行为](entity_action_types.md) `mxt:equipped_item_action`，它同时提供装备槽位。没有物品堆时行为不跑。[物品条件](../condition/item_condition_types.md)是与之配对的条件家族。
:::

::: tip 数据包可视化编辑器
[数据包可视化编辑器](https://datapack.mcdev.tech/) 能够交互式地展示每种类型的字段列表，便于在不查阅本页表格的情况下确认字段名。
:::

## 元行为

元行为控制其他物品行为是否执行、执行频率以及执行顺序。它们就是那些把其他行为作为字段的行为。

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:no_op` | — | 什么都不做；这是可选行为字段的默认行为。 |
| `mxt:js` | `id`、`params?` | 调用通过 KubeJS 桥接注册的物品行为处理器。 |
| `mxt:sequence` | `actions` | 按顺序执行一组物品行为。 |
| `mxt:chance` | `action`、`chance`、`fail_action?` | 以概率 `chance` 执行 `action`，否则执行 `fail_action`。 |
| `mxt:if_else` | `condition`、`if_action`、`else_action?` | 物品条件通过时执行 `if_action`，否则执行 `else_action`。 |
| `mxt:choice` | `actions` | 从带权重的列表中挑选一个条目执行。 |

### `mxt:no_op`

什么都不做。

没有字段，整条就写作 `{"type": "mxt:no_op"}`。所有可选的物品行为字段都拿它当默认值，想显式关掉已继承来的行为时也写它。

```json
"claim_action": { "type": "mxt:no_op" }
```

### `mxt:js`

调用通过 KubeJS 桥接注册的物品行为处理器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 字符串 | **必填** | 处理器 id。 |
| `params` | JSON 对象 | `{}` | 传给处理器的参数。 |

```json
{
  "type": "mxt:js",
  "id": "example:my_item_action",
  "params": { "amount": 3 }
}
```

回调在服务端跑。回调缺失或抛异常时，这条行为什么都不做并记一条警告。

### `mxt:sequence`

按顺序执行一组物品行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 物品行为列表 | **必填** | 依次执行的条目。 |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:damage_item", "amount": 1 },
    { "type": "mxt:cooldown", "ticks": 40 }
  ]
}
```

列表按书写顺序全跑一遍，前一条做什么都不影响后一条。

### `mxt:chance`

以概率 `chance` 执行 `action`，否则执行 `fail_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `action` | 物品行为 | **必填** | 抽中时执行。 |
| `chance` | 浮点数 | **必填** | 抽中的概率，取值 `0.0`–`1.0`；超出范围在加载期被拒。 |
| `fail_action` | 物品行为 | `mxt:no_op` | 没抽中时执行。 |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:damage_item", "amount": 1 }
}
```

抽签只抽一次，`action` 与 `fail_action` 恰好跑一个。

### `mxt:if_else`

物品条件通过时执行 `if_action`，否则执行 `else_action`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 物品条件 | **必填** | 判据。 |
| `if_action` | 物品行为 | **必填** | 条件通过时执行。 |
| `else_action` | 物品行为 | `mxt:no_op` | 条件不通过时执行。 |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  "if_action": { "type": "mxt:add_enchantment", "enchantments": { "minecraft:sharpness": 1 } }
}
```

两个分支里最多跑一个。条件拿到的是与这条行为相同的那个物品堆与持有者。

### `mxt:choice`

从带权重的列表中挑选一个条目执行。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actions` | 带权重条目的列表 | **必填** | 候选条目，格式见下表。 |

每个条目是嵌套行为外的一层带权重包装：

| 条目字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 物品行为 | **必填** | 该条目被选中时执行的行为。 |
| `weight` | 整数 | `1` | 相对权重；越大越容易被选中。 |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "weight": 3, "value": { "type": "mxt:consume_item", "count": 1 } },
    { "weight": 1, "value": { "type": "mxt:damage_item", "amount": 1 } }
  ]
}
```

权重小于等于 `0` 的条目抽不到，除非整表权重合计也是 `0`（例如全是 `0` 或负数）——那时退化成等概率抽一项，所以这张表永远抽得出结果。抽中的条目只跑一次，其余条目一条都不跑。

## 行为类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:damage_item` | `amount` | 给该物品堆增加耐久损伤，并夹取到其最大损伤值。 |
| `mxt:consume_item` | `count` | 按给定数量缩减该物品堆。 |
| `mxt:charge_artifact` | `aura`、`amount`、`capacity?` | 给一件法器物品堆的**某一种灵气**增加存量；`aura`（具体灵气）与 `amount` 都必填。上限取该物品堆匹配到的 `artifact` 为这种灵气声明的 `spirit_capacity`；`capacity`（默认 `0`）只是**回退**：物品堆没有任何定义认领、或定义没有声明这种灵气时，用它当上限。 |
| `mxt:consume_health` | `amount` | 对持有者造成一次原版**秘法伤害**——「以血为代价」的写法。它不预检也不拒绝，付不付得起由声明它的那张表决定。 |
| `mxt:cooldown` | `ticks` | 让该物品堆在持有者身上进入原版物品冷却，持续给定的 tick 数。 |
| `mxt:remove_enchantment` | `enchantment?`、`level?`、`reset_repair_cost?` | 移除或降低该物品堆上的附魔，并可选择重置其修复成本。 |
| `mxt:add_enchantment` | `enchantments`、`override?` | 给该物品堆添加或升级附魔。 |
| `mxt:merge_components` | `components` | 把一份原版数据组件补丁合并进该物品堆。 |
| `mxt:add_ability` | `abilities` | 把技能并进该物品堆的 `mxt:item_abilities` 数据组件：已经写过的一条不会写第二遍，组件里原有的条目一律保留。它是这个组件的**专用生产者**。 |

### `mxt:damage_item`

给该物品堆增加耐久损伤，并夹取到其最大损伤值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 要增加的损伤点数，按四舍五入取整后至少 `1`。 |

```json
"item_action": { "type": "mxt:damage_item", "amount": 1 }
```

不可损坏的物品堆（没有原版耐久）直接跳过，一点损伤都不加。求值不是有限值或小于等于 `0` 时同样跳过。写小数会先四舍五入，再与 `1` 取大，所以 `0.2` 仍然扣 `1` 点。

### `mxt:consume_item`

按给定数量缩减该物品堆。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | 数值提供器 | **必填** | 要扣掉的数量，按四舍五入取整后至少 `1`。 |

```json
"item_action": { "type": "mxt:consume_item", "count": 1 }
```

求值不是有限值或小于等于 `0` 时什么都不做。夹取交给物品堆自己：数量不够时能被扣到 `0`，也就是那一格变空。

### `mxt:charge_artifact`

给一件法器物品堆的某一种灵气增加存量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id | **必填** | 要灌的**具体**灵气，写 id；不接受 `#标签`，也不接受数组。 |
| `amount` | 数值提供器 | **必填** | 要灌的量；求值不是有限值或小于等于 `0` 时什么都不做。 |
| `capacity` | 数值提供器 | `0` | 上限的**回退值**，只在这件物品堆没有定义认领、或认领它的定义没给出这种灵气的有效上限时生效。 |

```json
"item_action": {
  "type": "mxt:charge_artifact",
  "aura": "example:spirit_qi",
  "amount": 10
}
```

上限优先取这件物品堆匹配到的 `artifact` 为这种灵气声明的 `spirit_capacity`；定义声明了但求值结果不是有限值或小于等于 `0` 时落回 `capacity`，`capacity` 也一样无效时上限按 `0`，灌不进去且静默无事发生。有效上限是声明上限乘以温养加成 `1 + 0.5 × 温养度`，求值后**向下取整**，所以灌满允许超过声明值、最多到 1.5 倍。实收量是 `amount` 与「上限减存量」里的较小值，存量只增不减；一次收下的量里超出上限的部分直接丢弃，不会溢出到别的灵气。

这条行为需要服务端与一个持有者，没有持有者时直接返回。每真的收下一点，温养度按「收下的量 ÷ 本次有效上限」上涨，只升不降。

### `mxt:consume_health`

对持有者造成一次原版秘法伤害（`damageSources().magic()`）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | 数值提供器 | **必填** | 伤害点数。 |

```json
"claim_action": { "type": "mxt:consume_health", "amount": 4 }
```

抗性提升与保护附魔照常减免，创造模式这类打不掉的持有者一点血都不掉。求值不是有限值或小于等于 `0` 时什么都不做。持有者不是生物、或不在服务端时直接跳过。

注意：它不预检也不拒绝。付不付得起由声明它的那张表决定，生命不够也照扣。法器的认主代价就写在 `claim_action` 里，`claim_action` 不写时的默认值正是这条行为、`amount` 为 `4`，所以省略字段的法器认主会默认扣 4 点血。

### `mxt:cooldown`

让该物品堆在持有者身上进入原版物品冷却。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ticks` | 整数 | **必填** | 冷却长度，tick。 |

```json
"item_action": { "type": "mxt:cooldown", "ticks": 40 }
```

只有持有者是玩家、物品堆非空、`ticks` 大于 `0` 时才真的进冷却，其余情况静默什么也不做。

### `mxt:remove_enchantment`

移除或降低该物品堆上的附魔，并可选择重置其修复成本。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enchantment` | 附魔 id 的列表 | `[]` | 要处理的附魔；写一个还是写一组都行。空列表什么也不移除。 |
| `level` | 整数 | 无 | 只处理当前等级**正好等于**它的附魔；不写就按任意等级处理，也就是把该附魔整个去掉。 |
| `reset_repair_cost` | 布尔 | `false` | 为 `true` 时把物品堆的修复成本归零。 |

```json
"item_action": {
  "type": "mxt:remove_enchantment",
  "enchantment": ["minecraft:mending"],
  "reset_repair_cost": true
}
```

移除就是把等级写成 `0`，相当于去掉这一条。带上 `level` 时只匹配等级正好相等的那些，写明 `0` 或者写一个它当前没有的等级就一条都不动。列表里解不出来的附魔条目会被丢掉并记一条日志，其余条目照常处理。

### `mxt:add_enchantment`

给该物品堆添加或升级附魔。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enchantments` | 附魔 id 到等级的映射 | **必填** | 要添加或升级的附魔。 |
| `override` | 布尔 | `false` | 为 `false` 时只在写的等级更高时才替换，为 `true` 时无条件替换。 |

```json
"item_action": {
  "type": "mxt:add_enchantment",
  "enchantments": { "minecraft:sharpness": 5 }
}
```

`override` 为 `false` 时比较的是当前等级与新等级，相等不写、更低不写。写入的等级就是写的数字，不额外夹取。`enchantments` 里指向不存在的附魔会在加载期报错，不会静默跳过。

### `mxt:merge_components`

把一份原版数据组件补丁合并进该物品堆。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `components` | 数据组件补丁 | **必填** | 直接交给物品堆合并的补丁。 |

```json
"item_action": {
  "type": "mxt:merge_components",
  "components": {
    "minecraft:custom_name": "灵刃"
  }
}
```

补丁按原版规则合入：写了的组件被覆盖或合并，没写的组件保持原样。这是通用补丁那条路，专门写 `mxt:item_abilities` 请用 `mxt:add_ability`。

### `mxt:add_ability`

把技能并进该物品堆的 `mxt:item_abilities` 数据组件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abilities` | 技能 id 的列表 | **必填** | 要写进组件的技能；不接受 `#标签`。 |

```json
"claim_action": { "type": "mxt:add_ability", "abilities": ["example:sword_focus"] }
```

已经写过的一条不会写第二遍，组件里原有的条目一律保留。物品堆为空、或 `abilities` 为空列表时什么都不做。

除了定义里的 `abilities`，一件物品还能靠数据组件 `mxt:item_abilities`（`{"abilities": ["example:foo"]}`）自带技能：运行时读的是**定义声明的与组件写的并集**，所以同一件法器定义认领的两堆物品可以带不一样的技能。组件里只存**技能 id**，不收标签（标签在定义那一侧的 `abilities` 里展开），所以写下的每个 id 都要能在技能注册表里解析出来，解析不出来的条目会被丢掉。这条行为写入的是 id，读的是当前注册表，因此新写下的 id 要在物品重新被运行时读到那一步才生效。

::: info 嵌套值
`mxt:if_else` 的 `condition` 接受一个[物品条件](../condition/item_condition_types.md)。`mxt:add_enchantment` 的 `enchantments` 是从附魔 id 到等级的映射。`mxt:remove_enchantment` 的 `enchantment` 接受一个附魔或一组附魔，用 `level` 限制移除的程度。`mxt:merge_components` 接受一份原版数据组件补丁。
:::
