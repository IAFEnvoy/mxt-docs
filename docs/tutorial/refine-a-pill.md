---
title: 炼制一枚丹药
description: 炼丹的教程还没写：这一页先说清这套系统现在有哪些部件、哪些已经能跑、哪些还没接线，以及要写出教程前必须先有什么。
---

# 炼制一枚丹药

::: warning 这一页是占位页

炼丹的**数据格式**已经定下来了，但**工作台还没有接线**：`mxt:alchemy` 配方今天没有任何方块会去读它。所以这里先不写"一步步搭建"，只把现有的部件、已经能用的部分和缺掉的入口列清楚——免得你照着字段表搭了半天，进游戏才发现没地方开炉。

:::

## 现在有什么

| 部件 | 位置 | 状态 |
| --- | --- | --- |
| 炼丹配方 | `data/<命名空间>/recipe/<路径>.json`，`"type": "mxt:alchemy"` | 格式已定稿，字段见 [alchemy_recipe](../datapack/json/alchemy_recipe.md)。 |
| 会话与结算 | `runtime/alchemy` 下的 `AlchemySession`、`AlchemyWorkstationState`、`AlchemyWorkstationService` | 逻辑完整：锁材料、按 tick 推进、到点产出成功或失败产物、执行实体行为与方块行为。 |
| 工作台接口 | `AlchemyWorkstation` | **只是一个接口**：仓库里没有任何类实现它，也没有任何地方调用 `startAlchemy` / `tickAlchemy`。温度与丹炉等级都由实现方给出。 |
| 灵气工作台 | 方块 `mxt:spirit_crafting_table` | 只跑[灵气合成](../datapack/json/spirit_crafting.md)（`mxt:spirit_shaped` / `mxt:spirit_shapeless`），**与炼丹之间没有任何代码路径**。 |
| 丹药与丹毒 | [pill_binding](../datapack/json/pill_binding.md) | 完整可用：产出的物品一匹配上就有丹毒收益、阈值与过量行为。 |
| 灵植 | [spirit_herb](../datapack/json/spirit_herb.md) | 完整可用：给**已有物品**挂元数据（品质、生长、掉落），它本身不注册物品。 |
| 品质的炼丹修正 | [item_quality](../datapack/json/item_quality.md) 的 `alchemy_modifier` | 完整可用：只改炼制时长，取这一批材料里**最低**的一档。 |

## 今天能做什么、不能做什么

**能做的**是数据侧的一切：配方、丹药绑定、灵植、品质修正都能写完，并用 `/mxt registries validate` 确认解码无误。

**做不到**的是在游戏里炼一炉。没有开炉入口——没有方块、没有方块实体、没有界面、没有命令——配方本身会照常注册（它就是一种普通配方），但没有任何东西会去匹配并开始它，`minimum_furnace_tier` 与 `target_temperature` 也就没有任何来源可以满足。

::: tip 想现在就把炼丹推起来

需要的是一个实现了 `AlchemyWorkstation` 的方块实体：一块能装输入、每个 tick 调一次 `tickAlchemy`、并给出 `furnaceTier()` 与 `temperature()` 的方块。这三件事都在模组侧的 Java 里，数据包做不到。

:::

## 已经知道的几个坑

写配方之前值得先记住这三条（都来自现有的解码与运行时）：

- **温度容忍度不能为负。** 它默认为 `0`，负值能通过解码，但运行时会被直接判为废丹。
- **`minimum_aura` 里的键解不出来会被静默丢弃**，只留一条日志——写错灵气名字读起来像"这项不需要"。
- **产出物品 ID 写错不会在加载期报错**，而是在那一炉结束、真正要发东西的时候整批作废。灵植与丹药绑定的 `items` 列表同样是容错的：坏条目丢一行日志就消失。

## 已有的参考页

- [alchemy_recipe（炼丹配方）](../datapack/json/alchemy_recipe.md) —— 材料、温度与容差、丹炉等级、时长、灵气最低量、成败产物与四个行为字段。
- [pill_binding（丹药绑定）](../datapack/json/pill_binding.md) —— 丹毒收益、阈值、过量后的残留与过量行为。
- [spirit_herb（灵植）](../datapack/json/spirit_herb.md) —— 灵植元数据、品质与灵植标签匹配器。
- [item_quality（品质）](../datapack/json/item_quality.md) —— `alchemy_modifier` 与品质的解析顺序。

## 教程发布时会讲什么

等工作台可用，这一页会换成一篇与[锻造](./forge-a-treasure.md)同构的教程：写一份配方、让材料按多重集匹配、把温度稳在容差内、接上灵气最低量、用品质修正缩短时长、再把丹毒规则挂到产物上，最后在游戏里验证一炉的成功与失败两条路径。

## 接下来

- [锻造一件法器](./forge-a-treasure.md) —— 同样是"工位 + 配方 + 品质"的写法，而这一套今天是能跑通的。
- [灵气合成](../datapack/json/spirit_crafting.md) —— 目前唯一接好线的灵气工作台配方族。
