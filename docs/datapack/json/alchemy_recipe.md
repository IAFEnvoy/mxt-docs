---
title: alchemy_recipe（炼丹配方）
description: 丹方按药性匹配：它声明主药、辅药与药引各要多少药力，目标炉温、时长与环境灵气门槛，以及成功和失败各产出什么。
aside: false
---

# alchemy_recipe（炼丹配方）

丹方是原版配方类型 **`mxt:alchemy`**，不是数据包注册表。它按**药性**判定，而不是按固定物品清单：一炉材料按主药、辅药、药引三个角色把药力合计成药性数值，配方声明它要多少，谁满足谁匹配。

## 文件位置

丹方放在数据包内的 `data/<namespace>/recipe/` 目录，和合成配方、熔炼配方同一棵树。文件名对应它的 ID：`data/example/recipe/warming_pill.json` 的 ID 是 `example:warming_pill`。

每个文件都要声明 `"type": "mxt:alchemy"`。放进 `mxt/alchemy_recipe/` 的文件不会被读取，也不是丹方。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 固定 `mxt:alchemy`。 |
| `name` | 文本组件 | 空 | 可选元数据。丹炉不显示丹方名，也没有查看器。省略时的键是 `recipe.mxt.<命名空间>.<路径>`，路径里的 `/` 改成 `.`。 |
| `description` | 文本组件 | 空 | 可选元数据，丹炉不展示。省略时在名字键后加 `.description`。 |
| `main_requirements` | 药性 id 到 [`NumberProvider`](../types/number_provider_types) 的映射 | **必填**，非空 | 主药药性到正药力阈值。常量必须为正。 |
| `auxiliary_requirements` | 同上 | `{}` | 辅药阈值。可以留空。 |
| `catalyst_requirement` | `NumberProvider` | **必填** | 药引的调和药力阈值。常量必须为正。 |
| `balance_tolerance` | `NumberProvider` | `0` | 寒热容限，常量必须在 `[0,1]`。 |
| `target_temperature` | `NumberProvider` | **必填** | 目标炉温，有限且非负，单位与炉温一致。 |
| `temperature_tolerance` | `NumberProvider` | `0` | 炉温容差，有限且非负。 |
| `duration` | `NumberProvider` | **必填** | 炼制时长，有限正数，单位 tick。开炉时再除以原料炼丹修正，最少 `1` tick，然后冻结。 |
| `max_bad_ticks` | Integer | `0` | 炼制阶段累计容忍的越界 tick，超过才判废。回温不清零。 |
| `minimum_aura` | 灵气 id 到数值提供器的映射 | `{}` | 环境门槛，不是消耗，也不是热量。 |
| `success_outputs` | `ItemStackTemplate[]` | **必填** | 成功产物，`1`–`4` 项。每项必须放得进一个输出格，可带数量和组件。 |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | 失败产物，`0`–`4` 项。失败物由配方声明，本体不硬塞药渣。 |
| `success_action` / `failure_action` | `EntityAction` | `mxt:no_op` | 原操作者在线时执行一次。离线不补发，也不转给后来开界面的人。 |
| `success_block_action` / `failure_block_action` | `BlockAction` | `mxt:no_op` | 与玩家动作同一次完成迁移里执行，各一次。 |
| `guide` | 对象 | 无 | 可选示例元数据，不参与匹配。丹炉不读取、不展示，也没有查看器。`main` 最多 `2`、`auxiliary` 最多 `2`、`catalyst` 最多 `1`，值是物品堆模板。 |

## 药性怎么凑成一炉

角色由仓位决定，不由配方分配：两个主药仓格、两个辅药仓格，药引固定在辅药仓的第三格。每件材料的药力来自它匹配到的[灵植](./spirit_herb.md)：主药读 `main_effects`，辅药读 `auxiliary_effects`，药引读 `catalyst_power`。药性数值按**数量 × 每件药力**累加。

- 同角色里拆堆、合堆不改变结果；换角色就按那个角色重算。
- 配方没要求的非零主药或辅药药性会让这条配方**不匹配**，不是忽略。
- 过量的已要求药性允许存在，材料仍全部消耗，不增产、不升品、不返还。
- 零药力材料不能放进那个角色。
- 没有隐含成功率或熟练度。

寒热偏差是 `Σ(数量 × 该角色每件药力 × 寒热) / Σ(数量 × 该角色每件药力)`。主药和辅药的每件药力是对应药性数值之和，药引是 `catalyst_power`；分母必须大于 `0`。`abs(偏差) <= balance_tolerance` 才算配平。

## 哪一条配方算数

完全匹配的候选里，只保留唯一一条需求向量，它必须**严格支配**其余每一条：药性键集合相同，每一项（药引需求也算在内）都大于或等于对方，并且至少有一项严格更大。不比较品质名、品质链序号、药力总和、温度、时长、配方 ID 或加载顺序。

没有唯一支配结果时是配伍冲突，不扣料，也不要求玩家选择丹方。零匹配仍给出不足、冲突或失衡。这次判定在品质、规格、环境、温度和输出容量检查之前；温度够不到或产物仓满不会改选另一条。每次点击只判定一次，并冻进批次。

## 环境门槛与开炉时长

`minimum_aura` 查的是丹炉所在位置的**环境灵气**，逐项与区域实际灵气池比较，既不消耗灵气也不供热。落在把 `rules.alchemy_env_bonus` 打开的[灵气区域](./aura_zone.md)里时，这一整道门槛**直接算满足**：它是开关、没有可缩放的量，所以只能顶替要求，而不是把池子放大。

`duration` 在开炉时求值一次，再除以原料的炼丹修正 `alchemy_modifier`（取那一刻炉内原料栈里最低的那一档，跳过没有品质的材料），四舍五入后最少 `1` tick，结果写进冻结的批次。炉型规格不参与时长：只有原料这一侧算数，丹炉核心自己的品质只用来过开炉那道闸门。

可设炉温上限与配方要求的温区没有交集时拒绝开炉，不扣料、也不取走异火。开炉还会过一遍**丹炉自己那件核心物品**的品质解析与品质条件——原料只按最低那一档参与时长修正，它的品质条件从不单独判定；除此之外只看槽位与容量，不比较丹品或炉阶。耐温不从炉型字段读，它取 `22` 块炉壁的最低耐温与异火最高温度的较低值，见[炉型规格](./alchemy_furnace.md)与[炉壁材料](./alchemy_wall_material.md)。

## 示例

```json
{
  "type": "mxt:alchemy",
  "main_requirements": { "example:nourish": 6 },
  "auxiliary_requirements": { "example:calm": 6 },
  "catalyst_requirement": 1,
  "balance_tolerance": 0,
  "target_temperature": 100,
  "temperature_tolerance": 5,
  "duration": 200,
  "max_bad_ticks": 2,
  "minimum_aura": { "example:fire_qi": 10 },
  "success_outputs": [
    {
      "id": "mxt:pill",
      "count": 1,
      "components": { "mxt:pill": { "pill": "example:warming_pill" } }
    }
  ],
  "failure_outputs": [{ "id": "mxt:alchemy_dregs" }],
  "guide": {
    "main": [{ "id": "example:herb_a", "count": 2 }],
    "auxiliary": [{ "id": "example:herb_c", "count": 2 }],
    "catalyst": [{ "id": "example:herb_d" }]
  }
}
```

`guide` 只是示例，不参与判定：药性规则本身才是丹方。放入材料不会自行开炉，玩家在核心点击开炉后，才按当时格子里的实际药性判定产物。

## 与其他系统的关系

丹方是后端药性规则，不是固定物品 ID 清单。药性由[药性](./medicinal_property.md)定义，材料要能被认成[灵植](./spirit_herb.md)才有药力，产出的丹药作用是[丹药](./pill.md)，而它绑到哪些物品、能服用几次由[丹药绑定](./pill_binding.md)给。

炼丹与[灵气合成](./spirit_crafting.md)是两条互不相通的路：`mxt:alchemy` 只有丹炉会读，`mxt:spirit_shaped` / `mxt:spirit_shapeless` 只有灵气工作台会读。
