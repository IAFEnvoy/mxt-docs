---
title: alchemy_recipe（炼丹配方）
description: 炼丹配方把材料、灵气、温度和丹炉等级组合成丹药，成功与失败的结果都由配方决定。
aside: false
---

# alchemy_recipe（炼丹配方）

炼丹配方是本模组注册的一个**原版配方类型**。它声明炼丹台收哪些材料、要什么温度和丹炉等级、一批炼多久，以及成功或失败各产出什么。

::: warning 炼丹台还没有

这一页写的是**配方格式**与炼丹台要遵守的规则。配方文件会照常加载、也会通过校验，但**炼丹台本身还没有**：没有方块会去匹配并开始一炉。所以现在写好的配方不会在游戏里跑起来，`minimum_furnace_tier` 与 `target_temperature` 也还没有来源可以满足。

:::

## 文件位置

炼丹配方放在数据包内的 `data/<namespace>/recipe/` 目录，和合成配方、熔炼配方同一棵树。文件名对应它的 ID：`data/example/recipe/toxicity_pill.json` 的 ID 是 `example:toxicity_pill`。

每个文件都要声明 `"type": "mxt:alchemy"`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 必须是 `mxt:alchemy`。 |
| `inputs` | 物品 ID 列表 | **必填** | 炼丹台必须持有的物品，至少一项。 |
| `target_temperature` | `NumberProvider` | **必填** | 这批丹药应当在什么温度下炼制。 |
| `temperature_tolerance` | `NumberProvider` | `0` | 炼丹台温度允许偏离 `target_temperature` 的范围。 |
| `minimum_furnace_tier` | Integer | `0` | 炼丹台的最低丹炉等级；等级更低时拒绝开始。 |
| `duration` | `NumberProvider` | **必填** | 这一批炼制的 tick 数。 |
| `minimum_aura` | 灵气 id 到[数值提供器](../types/number_provider_types)的映射 | `{}` | 炼丹台所在位置每种灵气的最低量。 |
| `success_outputs` | 物品 ID 列表 | **必填** | 未炼制失败时产出的物品，至少一项；每个 ID 产出一个物品。 |
| `failure_outputs` | 物品 ID 列表 | `[]` | 炼制失败时产出的物品；每个 ID 产出一个物品。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 未失败时对炼丹台主人执行的行为。 |
| `failure_action` | `EntityAction` | `mxt:no_op` | 炼制失败时对炼丹台主人执行的行为。 |
| `success_block_action` | `BlockAction` | `mxt:no_op` | 未失败时在炼丹台位置执行的方块行为。 |
| `failure_block_action` | `BlockAction` | `mxt:no_op` | 炼制失败时在炼丹台位置执行的方块行为。 |

`inputs` **顺序无关**：这一列会和炼丹台持有的输入按多重集比较，所以同一种物品用两次就要写两次。

`temperature_tolerance` 默认 `0`，意思是温度必须**恰好**等于 `target_temperature`：偏离一点就是这个容差之外。

`minimum_aura` 里列出的每一项都必须满足，一项不满足就不开始。

`duration` 只在开始时求值一次。求值结果不是有限数、小于等于 `0`，或者超出能表示的 tick 范围，这一批就拒绝开始。

## 行为

当炼丹台恰好持有声明的 `inputs`、丹炉等级不低于 `minimum_furnace_tier`，且所在位置的灵气满足 `minimum_aura` 时，这一批就可以开始。随后它会炼制 `duration` tick，期间把炼丹台温度与 `target_temperature` 按 `temperature_tolerance` 比较：**只要有 1 tick 超差，这一批的剩余部分就废了。** 最后一个 tick 走完时，配方按是否失败产出 `success_outputs` 或 `failure_outputs`，然后对主人执行对应的实体行为、在炼丹台执行对应的方块行为。

炼丹台的环境由[灵气区域](./aura_zone.md)描述：配方要求的灵气从所在位置读取，而 `rules` 里把 `alchemy_env_bonus` 打开的灵气区域**本身就满足** `minimum_aura`。这个开关是纯粹的是/否，没有可用于缩放灵气池的量纲，所以它顶替的是整条要求，而不是把池子放大。没有这个开关时，配方自己的最低值会照旧与区域的实际灵气池逐项比较。

::: warning 解析不出的灵气键会被丢弃

`minimum_aura` 的键不是可解析的 `aura` ID 时，该条目只会被丢弃并记一条警告，加载照常通过。所以写错名字读起来像"这项灵气不需要"，而不是报错。

:::

## 示例

```json
{
  "type": "mxt:alchemy",
  "inputs": ["minecraft:red_mushroom", "minecraft:honey_bottle"],
  "target_temperature": 600,
  "temperature_tolerance": 50,
  "minimum_furnace_tier": 1,
  "duration": 200,
  "minimum_aura": { "mxt:common": 200 },
  "success_outputs": ["minecraft:honey_bottle"],
  "failure_outputs": ["minecraft:glass_bottle"],
  "success_action": { "type": "mxt:add_resource", "resource": "mxt:common", "amount": 5 },
  "success_block_action": { "type": "mxt:change_aura", "aura": { "mxt:common": 20 } }
}
```

炼丹与[灵气合成](./spirit_crafting.md)是两条互不相通的路：`mxt:alchemy` 只有炼丹台会读，`mxt:spirit_shaped` / `mxt:spirit_shapeless` 只有灵气工作台会读。

它产出的物品由[丹药绑定](./pill_binding.md)赋予丹药与丹毒规则，它的材料可以用[灵植](./spirit_herb.md)声明为灵植。
