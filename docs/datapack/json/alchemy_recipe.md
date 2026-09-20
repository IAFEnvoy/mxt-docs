---
title: alchemy_recipe（炼丹配方）
description: 炼丹配方把材料、灵气、温度和丹炉等级组合成丹药，成功与失败的结果都由配方决定。
---

# alchemy_recipe（炼丹配方）

炼丹配方是本模组注册的一种原版配方类型。它告诉炼丹台接受哪些材料、需要什么温度和丹炉等级、一批要炼制多久，以及成功或失败时产出什么。

::: warning 炼丹台还没开始做

这一页描述的是**配方格式**与炼丹台将来要遵守的规则。配方类型与结算状态机（`AlchemySession` / `AlchemyWorkstationService`）都已经就绪，配方文件也会照常加载，但**炼丹台本身还没有**：`AlchemyWorkstation` 只是一个接口，仓库里没有任何类实现它，也没有任何东西会去匹配并开始一炉。所以现在写好的配方不会在游戏里跑起来，`minimum_furnace_tier` 与 `target_temperature` 也还没有来源可以满足——今天能走到哪一步，见[炼制一枚丹药](../../tutorial/refine-a-pill.md)。

:::

## 文件位置

炼丹配方就是普通的配方文件，因此放在数据包内的 `data/<namespace>/recipe/` 目录，和合成配方、熔炼配方完全一样。

**用途**：原版配方类型（`mxt:alchemy`），不是数据包注册表。

文件名对应它的 ID。例如 `data/example/recipe/toxicity_pill.json` 的 ID 是 `example:toxicity_pill`。

每个文件都要声明本模组的配方类型：

```json
{
  "type": "mxt:alchemy"
}
```

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 必须是 `mxt:alchemy`。 |
| `inputs` | `Identifier[]` | **必填** | 炼丹台必须持有的物品 ID，至少一项。顺序无关：这一列会和输入物品按多重集比较，因此同一种物品用两次就要写两次。 |
| `target_temperature` | `NumberProvider` | **必填** | 这批丹药应当在什么温度下炼制。 |
| `temperature_tolerance` | `NumberProvider` | `0` | 炼丹台温度允许偏离 `target_temperature` 的范围。只要有 1 tick 超出容差，这一批就废了。 |
| `minimum_furnace_tier` | Integer | `0` | 炼丹台的最低丹炉等级；等级更低时拒绝开始。 |
| `duration` | `NumberProvider` | **必填** | 这一批炼制的 tick 数，必须是有限且大于 `0` 的数值。 |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | 炼丹台所在位置每种灵气的最低量。列出的每一项都必须满足；把 `alchemy_env_bonus` 打开的灵气区域本身就满足整条要求。 |
| `success_outputs` | `Identifier[]` | **必填** | 未炼制失败时产出的物品 ID，至少一项；每个 ID 产出一个物品。 |
| `failure_outputs` | `Identifier[]` | `[]` | 炼制失败时产出的物品 ID；每个 ID 产出一个物品。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 未失败时对炼丹台主人执行的行为。 |
| `failure_action` | `EntityAction` | `mxt:no_op` | 炼制失败时对炼丹台主人执行的行为。 |
| `success_block_action` | `BlockAction` | `mxt:no_op` | 未失败时在炼丹台位置执行的方块行为。 |
| `failure_block_action` | `BlockAction` | `mxt:no_op` | 炼制失败时在炼丹台位置执行的方块行为。 |

## 行为

当炼丹台恰好持有声明的 `inputs`、丹炉等级不低于 `minimum_furnace_tier`，且所在位置的灵气满足 `minimum_aura` 时，这一批就可以开始。随后它会炼制 `duration` tick，期间把炼丹台温度与 `target_temperature` 按 `temperature_tolerance` 比较：只要有 1 tick 超差，这一批的剩余部分就废了。最后一个 tick 走完时，配方按是否失败产出 `success_outputs` 或 `failure_outputs`，然后对主人执行对应的实体行为、在炼丹台执行对应的方块行为。

炼丹台的环境由[灵气区域](/datapack/json/aura_zone)描述：配方要求的灵气从所在位置读取，而 `rules` 里把 `alchemy_env_bonus` 打开的灵气区域本身就满足 `minimum_aura`——因为这个开关是纯粹的是/否，没有可用于缩放灵气池的量纲。没有这个开关时，配方自己的最低值会照旧与区域的实际灵气池逐项比较。

::: warning 解析不出的灵气键会被丢弃
`minimum_aura` 按 Map 解码，键不是可解析的 `aura` ID 时，该条目会在日志里记一条警告后被丢弃，而不是让加载失败。因此写错名字读起来像"这项灵气不需要"，而不是报错。
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

它产出的物品由[丹药绑定](/datapack/json/pill_binding)赋予丹药与丹毒规则，它的材料可以用[灵植](/datapack/json/spirit_herb)声明为灵植。
