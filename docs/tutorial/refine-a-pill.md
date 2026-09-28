---
title: 炼制丹药
description: 手搭一座 3×3×3 丹炉，写一条按药性判定的丹方，用异火把炉温升到目标区间，并给成品接上丹药与丹毒。
---

# 炼制丹药

炼丹不是"放下一件方块就开工"。丹炉是一座**手搭的固定 3×3×3**：核心、左右两个投料仓、顶部产物仓，加 22 块炉壁。丹方也不认物品 ID 清单——玩家在核心点开炉之后，服务端才拿当时格子里的**实际药性**去判定产物。

这一页给示例包加一条最小产线：两条药性、三株药材（都绑定已有物品）、一份炉型、一种炉壁材料、一条丹方，以及一枚带丹毒的丹药。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/medicinal_property/nourish.json` | 主药药性。 |
| `data/example/mxt/medicinal_property/calm.json` | 辅药药性。 |
| `data/example/mxt/quality/common.json` | 药材与炉型用的那一档品质；示例包里已经有就沿用。 |
| `data/example/mxt/spirit_herb/herb_a.json` | 主药：每件 `nourish` 药力 3，性热。 |
| `data/example/mxt/spirit_herb/herb_c.json` | 辅药：每件 `calm` 药力 3，性寒。 |
| `data/example/mxt/spirit_herb/herb_d.json` | 药引：每件调和药力 1，性平。 |
| `data/example/mxt/alchemy_furnace/basic.json` | 炉型规格：槽位、容量与冷却。 |
| `data/example/mxt/alchemy_wall_material/basic_wall.json` | 炉壁材料的耐温。 |
| `data/example/recipe/warming.json` | 丹方：药性阈值、寒热容限、目标炉温与容差、时长与产物。 |
| `data/example/mxt/pill_binding/warming_pill.json` | 丹药绑定：药效、次数、冷却与丹毒。 |

## 第 1 步 —— 编写药性

药性就是一张只有名字的表，丹方按 ID 引用它。它**不是元素**：别复用元素、灵气或资源的 ID，也不要在本体里找"活血、聚元"这类名单。

```json
// data/example/mxt/medicinal_property/nourish.json
{
  "name": "property.example.nourish"
}
```

第二条照抄一份 `calm.json`。`name` 可以省略，省略时按条目 id 生成 `medicinal_property.mxt.example.<路径>`。

## 第 2 步 —— 将已有物品声明为药材

灵植不注册新物品，它给**已有物品**挂一份元数据：品质、药龄、寒热，以及它在三个角色里各提供多少药力。

```json
// data/example/mxt/quality/common.json
{
  "name": "quality.example.common"
}
```

```json
// data/example/mxt/spirit_herb/herb_a.json
{
  "items": ["minecraft:red_mushroom"],
  "quality": "example:common",
  "main_effects": { "example:nourish": "3 + herb_age / 50" },
  "thermal_bias": 1.0
}
```

```json
// data/example/mxt/spirit_herb/herb_c.json
{
  "items": ["minecraft:brown_mushroom"],
  "quality": "example:common",
  "auxiliary_effects": { "example:calm": 3 },
  "thermal_bias": -1.0
}
```

```json
// data/example/mxt/spirit_herb/herb_d.json
{
  "items": ["minecraft:sugar"],
  "quality": "example:common",
  "catalyst_power": "1 + herb_age / 100"
}
```

三件事要记住：

- **角色由放进哪个仓决定，不由定义决定。** 主药只看 `main_effects`，辅药只看 `auxiliary_effects`，药引只看 `catalyst_power`。把主药放进辅药仓，等于它在这一炉里没有任何药力。
- **`thermal_bias` 是寒热，不是元素。** 负为寒、正为热，取值在 `-1..1`；它和火、水元素没有关系。
- **`herb_age` 是药力公式里的局部变量。** 它读的是堆上的 `mxt:herb_age` 组件，没有组件时用这条灵植的 `default_age`。年龄抬高的是药力本身，管线不会再乘一次；一年药龄值多少完全由公式决定——这一页的公式把它折成 `3 + herb_age / 50`（药龄 100 时是 5），写成 `3 * (1 + herb_age / 100)` 时一件百年 A 才抵得上两件零龄 A。寒热加权也跟着年龄变，所以要求完全配平的丹方对药龄很敏感。

想让药材能种，就给定义加 `growth`（必填的种苗、`mature_age` / `max_age`、`growth_rate`、贴图与收获物；`condition` 与 `costs` 可选）。这一页的三株都只入药，所以省略 `growth`。

## 第 3 步 —— 炉型与炉壁材料

炉型是**规格**，不是世界里的方块：核心物品用组件挂上它，没有规格或规格不在注册表里就不能开炉。

```json
// data/example/mxt/alchemy_furnace/basic.json
{
  "quality": "example:common",
  "main_slots": 2,
  "auxiliary_slots": 2,
  "capacity": 64,
  "cooling_per_tick": 0.5
}
```

```json
// data/example/mxt/alchemy_wall_material/basic_wall.json
{
  "max_temperature": 200
}
```

- `main_slots` 取 `1..2`，`auxiliary_slots` 取 `0..2`。药引固定占辅药仓的第三格，不用声明；规格没用到的格子不能放东西。
- `capacity` 是一炉材料的件数上限，还要服从物品自己的堆叠上限。
- `cooling_per_tick` 是高于设定值、或停止供热之后每 tick 回落的量。没有异火时炉温冷却到 `0`。
- **耐温取整炉最低的那一块。** 22 块炉壁都有效时整炉耐温取它们的最低值，再和异火自己的上限取较低者；混用高耐温炉壁不能把薄弱处平均掉。设定温度必须落在 `0` 到那个上限之间。
- 品质只决定显示与使用条件，不推导槽位、容量、冷却或耐温。

## 第 4 步 —— 搭建丹炉、装入异火、投入药材

形状是固定的，数据包改不了。把核心朝北放下，其余按图摆：

```text
面向正面。左列 x=2，右列 x=0。中层 y=1，最下面一行最靠近你：

            后 z=2
左侧 x=2    壁 17 | 壁 16 | 壁 15    右侧 x=0
            主 14 | 空 13 | 辅 12
前 z=0      壁 11 | 核 10 | 壁  9
```

1. 核心放在正面中层 `(1,1,0)`，`index = x + 3 * z + 9 * y` 等于 `10`。默认朝北；站在北侧、面朝南时，左侧是本地 `x = 2`。
2. 左侧主药仓放 `(2,1,1)`（index 14），右侧辅药仓放 `(0,1,1)`（index 12），顶部产物仓放 `(1,2,1)`（index 22）。两个投料仓是不同的方块 ID，仓的角色不随旋转改变。
3. 中心 `(1,1,1)` 留空，那一格不能有方块。
4. 其余 22 格砌 `mxt:alchemy_furnace_casing`，每块带上炉壁材料。
5. 异火放进核心，主药放左侧仓，辅药与药引放右侧仓。

```mcfunction
give @s mxt:alchemy_furnace[mxt:alchemy_furnace="example:basic"]
give @s mxt:alchemy_main_input
give @s mxt:alchemy_auxiliary_input
give @s mxt:alchemy_output
give @s mxt:alchemy_furnace_casing[mxt:alchemy_wall_material="example:basic_wall"]
```

炉壁要 22 块（创造模式里直接取最省事）。壳不齐、炉壁材料无效、或格子被另一座炉占了，都不算成型，界面会用文字列出缺了什么。

::: warning 本体没有内置异火

能给核心供热的那件物品必须由模组提供，数据包造不出来。没有它，炉温升不起来，开炉会因为温度被拒——先确认你的环境里有一件可用的异火。

:::

## 第 5 步 —— 丹方

丹方是原版配方类型 `mxt:alchemy`，文件放在 `data/<命名空间>/recipe/<路径>.json` 下，**不是**数据包注册表；它按药性判定，能写的字段就是下面这些。

```json
// data/example/recipe/warming.json
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
  "minimum_aura": { "example:qi": 10 },
  "success_outputs": [
    {
      "id": "mxt:pill",
      "count": 1,
      "components": { "mxt:pill": { "binding": "example:warming_pill" } }
    }
  ],
  "failure_outputs": [{ "id": "mxt:alchemy_dregs" }]
}
```

- 阈值按角色分开，只比较**药性键与数量**。同角色里拆堆、合堆不改变结果：两件 `herb_a` 分放两个主药格，和堆在一格等价。
- 出现配方没要求的非零主药或辅药药性，这条配方不匹配，也不扣料。三株药材各自只提供一种药性就是为这个。
- `balance_tolerance: 0` 要求完全配平，判据是 `Σ(数量 × 每件药力 × 寒热) / Σ(数量 × 每件药力)` 的绝对值不超过容限。这份丹方的 `2 × herb_a + 2 × herb_c + 1 × herb_d`（零龄）正好落在 `0`。
- 同时匹配上多条丹方时，只保留**唯一支配**其余每一条的那一条：药性键集合相同、每一项都不小于对方、且至少有一项严格更大。玩家不选丹方，没有唯一结果就是配伍冲突，同样不扣料。
- `target_temperature` 与 `temperature_tolerance` 是炉温窗口。**第一次开炉时设定温度必须落在里面**，所以上面这份丹方要求你把炉温设到 `95..105`。
- `minimum_aura` 查的是**环境灵气**，不是消耗，也不是热量。键写成本位世界里确实存在的那条灵气；或者让区域用 `alchemy_env_bonus` 顶替这道门槛（那个标记只顶门槛，不供热）。
- `duration` 会被原料的炼丹修正缩短：取这批材料里最低的那一档品质的 `alchemy_modifier`，`有效时长 = max(1, round(声明时长 ÷ 修正))`，开炉时算一次就冻进这一批。
- 失败物由丹方声明，服务端不会硬塞药渣；不写 `failure_outputs` 就什么都不产出。
- `guide` 只是可选的示例元数据，丹炉不读也不显示，不想维护就省略。

放材料不会自己开炉。玩家在核心那页看当前配伍是否已匹配，再按「开炉」。

## 第 6 步 —— 丹药与丹毒

丹药绑定可以不认领物品，只靠堆上的组件：上面那条丹方的产物已经把 `mxt:pill` 的 `binding` 写在组件里了。

```json
// data/example/mxt/pill_binding/warming_pill.json
{
  "name": "pill_binding.example.warming_pill",
  "max_uses": 2,
  "cooldown": 20,
  "toxicity_gain": 25,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 20,
  "on_consume": { "type": "mxt:heal", "amount": 4 }
}
```

手边没有成丹时可以直接发一枚：

```mcfunction
give @s mxt:pill[mxt:pill={binding:"example:warming_pill"}]
```

- 服用次数按**这条绑定**计，不按物品 ID，所以换一件别的物品当载体也绕不过上限。次数与冷却记在身体上，死亡、换维度、重新登录都不清。
- 丹毒也是每个身体一份的账：`toxicity_gain` 是每次服丹加多少，累计达到 `toxicity_threshold` 才触发 `on_overdose`，`toxicity_after_overdose` 是触发之后剩下的量。阈值是"达到就触发"，不是"禁止再吃"。
- 排毒用实体行为 `mxt:modify_pill_toxicity` 的负 `add`，它不清服用次数；读丹毒用实体条件 `mxt:pill_toxicity` 或公式变量 `pill_toxicity`。
- 默认丹毒不会自己退。服务端配置「炼丹 → 每秒丹毒自然消退」设成正数后，已经有丹毒的活跃实体每累计 20 刻退一次，离线不退，也不会给没服过丹的实体建一份空账。

## 在游戏里验证

```text
(重新打开世界)
/mxt registries validate
/mxt registries list
```

1. 按图搭好之后，每一格显示的是整座鼎在该格上的几何。对不上就是壳缺块、炉壁材料无效、中心那一格没留空，或者格子被另一座炉占了。
2. 右键核心、主药仓、辅药仓、产物仓，各自打开一页：核心那页是炉温读数与「设定 / 开炉 / 终止」，另外三页是各自的格子。四个页面读的是同一座炉的状态，不是方块自己另存了一份库存。
3. 异火放进核心，主药放左侧仓，辅药与药引放右侧仓。放材料不会开炉。
4. 在核心那页把炉温设到 `100` 并提交，再按「开炉」：批次开始，状态从待机走到预热、再到炼制，炉温朝设定值靠，进度与剩余刻数跟着走。
5. 产物出来之后在产物仓里取。产物仓只能取不能投；装不下时批次停在「等待出货」，腾出格子它会自己进去，不用重炼。

::: warning 这一页不写"炼成的丹药一定正确"

开炉之后那一批的**成败判定**还没有在游戏里逐条对过，所以本页不承诺某条丹方一定炼出什么。上面第 4、5 条列的是你能亲眼看到的东西——结构成型、四页界面打开、批次开始、炉温移动、产物入仓。判定本身对照核心那一页显示的状态与失败原因。

:::

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 结构不成型 | 中心 `(1,1,1)` 没留空、壳缺块、炉壁物品没带有效的炉壁材料，或者格子被另一座炉占了。 |
| 炉温升不上去 | 核心里没有异火；或者异火、最薄的那块炉壁把上限压到了设定值以下。 |
| 第一次开炉被拒 | 设定温度必须落在丹方容差内；上限不够时温度根本设不下去。 |
| 材料像没生效 | 角色由**仓位**决定：主药只看 `main_effects`，辅药只看 `auxiliary_effects`，药引只看 `catalyst_power`。放错仓等于没放。 |
| 药力够了却报配伍冲突 | 出现了配方没要求的非零主药或辅药药性；或者同时匹配多条丹方而没有唯一支配结果；或者寒热偏差超出 `balance_tolerance`。 |
| 换成自己种的药材就失衡 | 收获的药材带着成熟时的药龄，药力与寒热加权跟着变。要么用零龄药材，要么放宽 `balance_tolerance`。 |
| 产物仓满了 | 批次停在「等待出货」，核心保留已经生成但还没入仓的产物，腾出格子即可。 |
| 活动中拆了炉壁或一座仓 | 这一批按失败结算一次，已投入的材料不返还；拆一座仓只掉这座仓自己的物品。 |
| 漏斗抽不出产物 | 产物仓只能从下侧面抽，而那一面成型后正对着中心的空气格。 |

## 接下来

- [alchemy_recipe（炼丹配方）](../datapack/json/alchemy_recipe.md) —— 丹方的完整字段，以及匹配、时长与产物的规则。
- [alchemy_furnace（炉型）](../datapack/json/alchemy_furnace.md) 与 [alchemy_wall_material（炉壁材料）](../datapack/json/alchemy_wall_material.md) —— 槽位、容量、冷却与耐温。
- [medicinal_property（药性）](../datapack/json/medicinal_property.md) 与 [spirit_herb（灵植）](../datapack/json/spirit_herb.md) —— 药性、药力、寒热、药龄与种植。
- [pill_binding（丹药绑定）](../datapack/json/pill_binding.md) —— 服用次数、冷却、丹毒与过量后的残留。
- [quality（品质）](../datapack/json/quality.md) —— `alchemy_modifier` 怎么缩短开炉时长。
- [内置物品与组件](../player-guide/items.md) —— 丹炉各部件、灵田与丹药载体在游戏里怎么用。
