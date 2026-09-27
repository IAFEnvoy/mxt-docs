---
title: item_binding（物品绑定）
aside: false
---

# item_binding（物品绑定） {#item_binding}

## 文件位置

`data/<namespace>/mxt/item_binding/<path>.json`

**用途**：现有物品到行为数组的绑定。这张表不创建物品，只认领物品。

文件名就是 id：`data/example/mxt/item_binding/root_pellet.json` 的 id 是 `example:root_pellet`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或混合数组 | **必填** | 这份定义认领哪些物品，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。 |
| `priority` | Int | `0` | 多条定义匹配同一件物品时数值大者先；相同则按注册表顺序。 |
| `actions` | `EntityAction[]` | `[]` | 物品使用周期走完时按顺序执行的行为。 |
| `conditions` | `EntityCondition[]` | `[]` | 使用门槛；每一项都必须满足。 |
| `element` | 元素 id、`#标签` 或混合数组 | `[]` | 这件物品**是什么元素**，读取口径见下方。 |

## 用法

**绑定表只匹配已经注册的物品，不负责创建物品。** 功法手册不由这张表承接：那一叠算不算手册看堆上的 `mxt:technique` 组件，或者看 [technique_binding](./technique_binding.md) 那条可选的 `items`。`weapon_binding` 与 `pill_binding` 的字段和它互不混用。武器的属性、攻击 / 使用 / tick 行为写在 `weapon_binding` 里。

::: warning
`actions` **不绑右键**。它只在物品的**使用周期走完**那一拍执行，也就是吃完一份食物那种时刻。一件右键不会举起来使用的物品永远走不到这里，行为一个也不跑。
:::

`items` 是共用匹配器：写物品 id、`#标签` 或混合数组都行，只写一个条目也可以，不必包成数组。数组里每一项还能写成带 `type` 的匹配条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage` 与 `mxt:herb_tag`）。匹配器只引用已经注册的物品。

**加载期的两种结局不一样。** 数组是容错列表：解不开的条目丢它自己，日志里留一条 `Ignoring invalid list element`，同一数组里其余条目照常生效——物品 id 打错只会让那一条不命中。**只写一个条目时不走这条路**，那个条目解不开会让整份定义加载失败。空数组能通过加载，只是这份定义谁都匹配不上。

`priority` 是唯一的“谁赢”规则。多份定义同时匹配一件物品时，按各自声明的 `priority` **从高到低**选一条，字段默认 `0`；只有数值相同的两条才回落到注册表顺序，所以“谁赢”由数据包自己写死、与文件名无关。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。接受这个字段的共十张表：`artifact`、`item` / `weapon` / `pill` / `tool` / `blueprint` / `technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。详见 [`ItemMatcher`](/datapack/types/shared_data_types#itemmatcher)。

**逐件附加看组件，其余只由定义给。** 这张表认领的物品自己可以带两个组件：`mxt:quality`（单值，**整份品质对象**：组件写在那一堆上就以它为准，档位与这一档所属的链一起换）与 `mxt:element`（列表，与定义声明的 `element` **取并集**）。`actions` 与 `conditions` **没有组件**，只由定义给。逐件想改就为那一堆写一条定义、用 `items` 点名，或者在物品注册时用 KubeJS / 原版组件处理。

```json
{
  "items": ["minecraft:iron_sword", "#minecraft:swords"],
  "actions": [{"type": "mxt:grant_spirit_root", "spirit_root": "mxt:fire_root"}],
  "conditions": [
    {"type": "mxt:always"},
    {
      "condition": {"type": "mxt:realm", "realm": "example:foundation"},
      "description": "condition.example.foundation_required"
    }
  ]
}
```

`conditions` 里可以直接填写条件，也可以填写带翻译键 `description` 的 `{condition, description}` 对象。所有条件都必须满足；带描述的条件会在物品 Tooltip 中以绿色 `✓` 或红色 `✗` 标出结果，描述文字保持普通样式。这一层是**使用门槛**：不满足时这堆物品用不了（右键、右键方块、攻击与使用周期都会被拦下，动作栏给出原因）；`actions` 在真正执行前还会再问一次，所以中途变得不满足时行为不跑。

`actions` 里如果有 `mxt:grant_spirit_root`，这堆物品的 Tooltip 会多出一行，写明它授予哪条灵根；高级提示还会给出那条灵根的条目 id。

灵根和体质的持有判定与增删都是数据包原语：`mxt:has_spirit_root` / `mxt:has_physique` 用于条件，`mxt:grant_spirit_root` / `mxt:remove_spirit_root` / `mxt:grant_physique` / `mxt:remove_physique` 用于行为。下面这条定义只对已有火灵根的玩家生效，并把火灵根换成水灵根：

```json
{
  "items": "kubejs:root_switching_pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_spirit_root", "spirit_root": "mxt:fire_root"},
      "description": "condition.example.requires_fire_root"
    }
  ],
  "actions": [
    {"type": "mxt:remove_spirit_root", "spirit_root": "mxt:fire_root"},
    {"type": "mxt:grant_spirit_root", "spirit_root": "mxt:water_root"}
  ]
}
```

这族物品**读哪条链完全由它解析出的那一档决定**（链名写在 `quality` 自己身上，见 [quality](./quality)），绑定表不声明链。想让某一堆换档又换链，就在那一堆上写 `mxt:quality="<品质 id>"`。

**物品的元素**只有一条读取口径，按顺序问两件事：

1. **声明**：堆上的 `mxt:element` 组件，加上 `weapon_binding`、这张表与 [artifact](./artifact.md) 里哪个认领了这堆物品、它写没写 `element`。每个注册表各取 `priority` 最大的那条匹配定义，全部结果**取并集**；每条声明都经元素注册表展开，所以 `#标签` 代表标签下的每个元素。
2. **物品携带的灵气**：一个都没声明时才走这条——`mxt:spirit_storage` 里那**唯一**一种灵气，或者（存量为空、或存了多种时）它的 `mxt:item_aura` 定义声明的灵气，取该灵气的 `aura_type`。法器的 `spirit_capacity` **不算**：那说的是“能装什么”，不是“是什么”。

完整口径见 [weapon_binding](./weapon_binding.md)。物品条件 `mxt:item_element` 读的就是这条口径。
