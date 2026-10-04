---
title: 定义灵气环境
description: 逐层叠加灵气区域，用方块与物品补充灵气，用噪声和波动驱动浓度，并把结果呈现在 HUD、雾效和命令上。
---

# 定义灵气环境

[定义灵气与境界](./define-aura-and-realms.md) 只给你留下一个覆盖整个主世界、灵气处处相同的区域。本页让世界真正产生差异：更稠密的区域、灵石矿脉、打坐时可以燃烧的物品，以及告诉玩家"自己站在哪"的客户端呈现。

前置教程必须先完成——这里的一切都沿用同一个 `example:qi` 数值。

## 两套数字如何配合

这里牵涉两套不同的数字，把它们搞混是意外结果最常见的来源：

| 数字 | 存在哪里 | 含义 |
| --- | --- | --- |
| 区块库存 | `mxt:aura` 区块附件 | 这个位置上实际能被消耗的量。同一区块内的所有玩家共享，由 `regen_per_tick` 回复。 |
| 环境浓度 | 由命中的区域计算得出 | 模板声称这里有多少。波动和噪声作用于它，客户端显示的也是它。 |

区块第一次加载时，每种数值都从 `max(0, (amount + noise) / 10 - 5)` 开始，其中 `noise` 是模板的柏林噪声值（噪声关闭时为 `0`）。因此裸写的 `amount` 是一个**基础值**，它比最终产生的浓度大十倍——`amount: 200` 的模板初始浓度约为 `15`。容量来自 `max`，除非你写死一个固定数值，否则它由该初始值解析得到。

修炼进度与玩家获得的灵气都会乘以所处位置的浓度倍率：有限上限用 `concentration / maximum`，`{"type": "mxt:unlimited"}` 用 `concentration / (concentration + 1)`。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/aura_zone/misty_valley.json` | 森林级别的稠密区域：浓度、噪声、波动，以及客户端看到的样子。 |
| `data/mxt/data_maps/block/block_aura.json` | 让方块给它所在的区块补容量。 |
| `data/mxt/data_maps/item/item_aura.json` | 让物品在修炼时被消耗、换成灵气。 |
| `kubejs/server_scripts/mxt_areas.js` | 运行时创建与移除人工区域，并读某一处解析后的灵气。 |

## 第 1 步 —— 更稠密的群系区域

两个重叠的模板按层级逐级解析：**群系 < 维度 < 永久人工区域 < 阵法**。后一级会完整替换前一级的灵气值、元素值、规则和显示模板。同一层级内 `priority` 最大者生效，`priority` 相同时取 ID 较小的模板，因此结果始终可复现。

这就是这里两个区域都写作群系级的原因：在森林里，森林模板只是凭优先级压过通用模板。

```json
// data/example/mxt/aura_zone/misty_valley.json
{
  "aura": {
    "example:qi": {
      "amount": 400,
      "max": {"type": "mxt:initial_multiplier", "multiplier": 1.5},
      "regen_per_tick": 0.1,
      "color": "#7FE3C4"
    }
  },
  "biomes": ["#minecraft:is_forest"],
  "priority": 10,
  "distribution": "realm_weighted",
  "cultivate_condition": {
    "type": "mxt:aura_range",
    "aura": {"example:qi": {"min": 5, "max": 100000}}
  },
  "fluctuation": {
    "enable": true,
    "cycle_type": "day",
    "amplitude": 0.3,
    "offset_tick": 0
  },
  "noise": {
    "enable": true,
    "seed": 739430,
    "scale": 640.0,
    "amplitude": 5.0
  },
  "element_fit_bonus": 0.25,
  "element_conflict_penalty": 0.2,
  "client_render": {
    "fog_color": "#7FE3C4",
    "render_distance": 64,
    "fog_strength": 0.35
  },
  "client_hud": {
    "stored_aura": {"maximum": 60.0, "bar_index": 1, "anchor": "left", "order": 4},
    "sensed_concentration": {"maximum": 60.0, "bar_index": 2, "anchor": "left", "order": 5}
  }
}
```

| 字段 | 作用 |
| --- | --- |
| `aura` | 逐灵气的库存：`amount`、`max`、`regen_per_tick` 和环境 `color`。`max` 接受数字、`mxt:fixed`、`mxt:initial_multiplier` 或 `mxt:unlimited`。键的集合就是这个区域的全部词汇：一处环境有什么灵气就是它列出的那些，而每种灵气的元素是它在 `aura` 注册表里自己的 `aura_type`。 |
| `priority` | 只用于和同层级的其它模板比较。 |
| `distribution` | `random`、`equal` 或 `realm_weighted`；当区块库存无法满足所有人时，它决定谁分到多少。`realm_weighted` 使用每个玩家境界阶段的 `aura_share_weight`。 |
| `cultivate_condition` | 环境必须满足的实体条件，满足后才允许修炼。注意 `mxt:aura_range` 要求每条灵气都写 `max`。 |
| `fluctuation` | 把浓度乘以 `1 + amplitude * sin(2π * (time + offset_tick) / cycle)`，周期为 24000 tick 的昼夜循环或 192000 tick 的月相循环。它只影响查询到的浓度，绝不改写已存的库存。 |
| `noise` | 带种子、可复现的柏林噪声偏移，让地图有渐变而不是硬边界。`scale` 建议取 `640` 至 `960` 左右；`amplitude: 5` 在 `/ 10 - 5` 变换之前给出大约 `-5..5` 的扰动。 |
| `element_fit_bonus` / `element_conflict_penalty` | 调整灵根的修炼修正：位置上存在 `aura_type` 等于该灵根元素的灵气时 `+ element_fit_bonus`；惩罚项乘在**对立浓度**上——对立浓度是这片区域里与灵根元素有 `overcomes` / `adapted_to` 关系的**其它**元素的浓度之和，所以没有对立元素（或这处环境是空的）时惩罚是 `0`。两者默认都是 `0`。 |
| `client_render` | 雾颜色、雾效作用的距离（`8..256`）以及它取代原版雾的强度（`0..1`）。强度还会按浓度缩放，所以稀薄的灵气看起来更淡。 |
| `client_hud` | 两条可选的状态条：`stored_aura` 读区块库存，`sensed_concentration` 读环境模板。它们绘制在同一侧资源条的上方。 |

### 规则

`rules` 对象补充环境策略：

```json
"rules": {
  "cultivate_suppress": false,
  "tribulation_modify": 0.15,
  "spirit_plant_bonus": 0.25,
  "alchemy_env_bonus": true
}
```

`cultivate_suppress` 会中止正在进行的修炼，`tribulation_modify` 把公式变量 `aura_tribulation_modifier` 注入天劫公式。`alchemy_env_bonus` 打开后，区域内的炼丹直接算满足配方的 `minimum_aura` 要求：它是开关、没有可缩放的量，所以只能顶替要求，不能把池子放大。`spirit_plant_bonus` 作用于种在**灵田**里的灵植：实际增长量是 `growth_rate × max(0, 1 + 这个值)`，只乘一次，所以这片区域里的药材长得更快，区域外不受影响。

## 第 2 步 —— 来自方块的灵气

灵石矿脉理应比它所在的地面更有价值。

```json
// data/mxt/data_maps/block/block_aura.json
{
  "values": {
    "mxt:spirit_stone_ore": {
      "example:qi": {"amount": 5.0, "max": 5.0, "regen_per_tick": 0.01}
    },
    "mxt:spirit_stone_block": {
      "example:qi": {"amount": 2.0, "max": 2.0, "regen_per_tick": 0.01}
    }
  }
}
```

- 数据表**以方块为键**：`values` 的键就是方块 id 或 `#方块标签`（标签在加载期展开），区块内每个匹配的方块贡献一次；值本身就是那张逐灵气的表，把灵气 ID 映射到 `amount`，因此不需要额外的种类标记——这里**没有** `blocks` 字段，键就是方块。
- 文件固定放在 `data/mxt/data_maps/block/block_aura.json`：第一段命名空间是**表自己的** `mxt`，不是内容包的命名空间——内容包要加值，是往同一个目录里再放一个文件。
- 它也是数据表合并规则里**唯一**的例外：同一个方块被多份值命中时（另一个包也写了它，或一份给标签、另一份给具体方块），两份值**相加**，**不看 `priority`**。别的数据表才是"数值大者胜、同分则后处理的那个赢"。
- 这份贡献**不占用**环境上限：它把区块的有效容量提高相同的数量。环境上限为 `30`、矿石贡献 `30` 点时，该区块的有效上限就是 `60`。
- 查询会看 7x7x7 的子区块范围：内部 3x3x3 使用方块的真实位置，外围一环用子区块中心近似，全部按 `1 / max(1, 距离平方)` 衰减。
- 缓存在区块加载、方块变化和数据表加载时重建，周期由服务端配置「灵气 → 方块灵气周期」控制（默认 `10` tick，范围 `1..1200`）。

常见做法是把自然模板做成几乎空的，让方块来提供灵气：

```json
"aura": {
  "example:qi": {"amount": 0, "max": {"type": "mxt:unlimited"}, "regen_per_tick": 0}
},
"noise": {"enable": true, "seed": 739430, "scale": 640.0, "amplitude": 5.0}
```

`amount: 0` 时，大多数区块经 `/ 10 - 5` 变换后都停在 `0`，只有真正有灵气方块的地方才会凸显出来。

## 第 3 步 —— 来自物品的灵气

`item_aura` 是一张**数据表**（Data Map），它把物品变成修炼燃料：玩家修炼时，整组物品逐 tick 被抽取，其灵气释放到当前境界的资源条里。

```json
// data/mxt/data_maps/item/item_aura.json
{
  "values": {
    "mxt:spirit_stone": {
      "type": "example:qi",
      "aura": 100,
      "consume_speed": "0.5 + caster_level * 0.05",
      "release_speed": 2,
      "exhausted_action": {"type": "mxt:no_op"}
    },
    "#example:spirit_fuel": {
      "type": "example:qi",
      "aura": 50,
      "consume_speed": "0.5",
      "release_speed": 1
    }
  }
}
```

- 数据表**以物品为键**：`values` 的键就是物品 id 或 `#物品标签`（标签在加载期展开），所以一份文件就能覆盖整个燃料物品标签；值里写这张表的字段。每个值里 `type`、`aura`、`consume_speed` 和 `release_speed` 必填，`result_stack` 与 `exhausted_action` 可选。
- 文件固定放在 `data/mxt/data_maps/item/item_aura.json`：第一段命名空间是**表自己的** `mxt`，不是内容包的命名空间——内容包要加值，是往同一个目录里再放一个文件。
- 同一件物品被多份值命中时（另一个包也写了它，或一份给标签、另一份给具体物品），值里的 `priority` 数值大者胜，**同分则后处理的那个赢**（同一文件按书写顺序、不同文件按数据包加载顺序）。
- `type` 是该物品携带的**灵气**——`mxt:aura` 条目，而不是元素。释放的灵气用什么数值计量，由那条灵气自己的 `resource` 决定，它的元素则是那条灵气的 `aura_type`。
- `aura` 是每件物品的总量，处理开始时写入物品堆上服务端的 `mxt:item_aura` 组件（`remain` 字段）；整组物品在处理期间进入 `mxt:float_holding_item` 附件。对实现 `ItemAuraAccess` 的物品，它则是每件物品的充能上限。
- 每个 tick 都用当时匹配到的定义从剩余灵气里扣除 `consume_speed × 堆叠数量`，并向境界资源条充入 `release_speed × 堆叠数量`。拿得越多抽得越快，但持续的总 tick 数不变。
- 半用完的一组会优先于新的一组被继续使用，新的一组按主手、副手、物品栏顺序取用。修炼停止、玩家登出或死亡时，整组物品原样归还。
- 耗尽时移除物品，并返还配置的 `result_stack`。实现 `ItemAuraAccess` 的物品（例如灵石）行为不同：它们就地充能、就地抽取，而不是被消耗；没有携带 `mxt:spirit_storage` 组件的物品堆视为满充。

::: info

客户端不绘制燃料条，也从不自行消耗物品。

:::

## 第 4 步 —— 显示位置

| 位置 | 显示内容 |
| --- | --- |
| `client_hud.stored_aura` | 区块库存，是一个会随修炼升降的真实数值。 |
| `client_hud.sensed_concentration` | 当前位置的环境模板，包含波动与噪声。 |
| 带 `"context": "mxt:environment_concentration"` / `"mxt:actual_concentration"` 的资源条 | 同样两个数字，但按资源命名，因此 `resource.mxt.example.qi` 会变成环境灵气浓度或实际灵气浓度。 |
| 雾效 | `client_render`，按浓度缩放。 |
| 粒子 | 模板上可选的 `particle` 对象，每 5 tick 刷新一次。 |

`actual` 包含所有来源——模板、区块库存、方块灵气和阵法——而 `environment` 只有模板。服务端按服务端配置里的「灵气 → 同步周期」的周期（默认 5 tick）同步一次位置灵气，客户端只绘制这份快照。

命令上：

```text
/mxt aura query              → 你脚下每一门灵气各自的浓度与元素标记
/mxt aura query example:qi   → 只看一门灵气
/mxt aura vein               → 你脚下那条连成一片的灵石矿脉的大小与档位
/mxt aura cache clear 8      → 重建附近区块缓存的灵气（半径按区块计，默认 3，范围 0..32）
```

## 第 5 步 —— 用脚本创建区域

群系和维度覆盖的是静态世界。凡是必须在运行时创建的东西——任务放置的祝福、被占领的区域、临时场域——都用 KubeJS 桥接：

```js
// kubejs/server_scripts/mxt_areas.js
const area = MxtAura.addBox(
  player.level, 'example:misty_valley',
  0, 64, 0,                  // 最小角
  64, 128, 64,               // 最大角
  10                         // 优先级
)
console.info(`Created aura area ${area}`)

// 读取某个位置解析后的灵气，包含所有来源。
const aura = MxtAura.get(player.level, player.blockPosition())
console.info(`Concentration: ${aura.concentration()}, maximum: ${aura.maximum()}`)

// 稍后，或在另一个脚本里：
// MxtAura.remove(player.level, area)
```

`addBox` 需要一个服务端 level 和一个已加载的 `aura_zone` ID，并返回生成的区域 ID。人工区域会保存到世界，层级高于维度绑定，它们之间按 `priority` 解析。`MxtAura.get` 是只读的，在客户端也能用，此时它返回客户端已经收到的状态。

`MxtEvents.auraZone` 会以 `enter`、`leave`、`tick` 和 `override` 触发；`override` 是阵法的交接，可以取消以拒绝它：

```js
MxtEvents.auraZone(event => {
  if (event.getKind() === 'override' && event.getConcentration() < 20) event.cancel()
})
```

阵法也可以携带自己的区域，那是解析顺序的最高层。区域和容量加成都在阵法的 `mxt:buff` 行为里：

```json
{
  "structure_template": "example:gathering_array",
  "radius": 8,
  "actions": [
    {
      "type": "mxt:buff",
      "max_bonus": {"example:qi": 50},
      "aura_zone": "example:misty_valley"
    }
  ]
}
```

活跃阵法覆盖其控制者周围的区域，因此它的 `aura_zone` 覆写所有更低层级，而 `max_bonus` 会加到它所列灵气的区块有效上限上。

## 在游戏里验证

重新加载世界——这些是数据包注册表与数据表，`/reload` 不会读取它们——然后运行：

```text
（重新打开世界）
/mxt registries validate
/mxt aura query example:qi     → 森林应当比平原高
```

1. 白天站在森林里查看 `/mxt aura query`；睡到夜晚再查一次。数值会变化最多 ±30%，这是 `fluctuation` 造成的。
2. 朝一个方向走几百格。数值会平滑漂移，这是 `noise` 造成的。
3. 站在灵石矿石上运行 `/mxt aura vein`，然后比较挖掉它前后的 `/mxt aura query`。可移除的那部分就是方块贡献。
4. 拿着灵石修炼。资源条明显比空手时涨得快，而且整组灵石会变少。
5. 如果看不到雾，记住 `fog_strength` 会乘以浓度——区域越弱，雾越淡。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 区域从未生效 | 它的 `biomes`/`dimensions` 为空，也没有任何东西引用它。空列表意味着"只能通过人工区域或阵法"。 |
| 某个特定区域被忽略 | 维度级模板会压过所有群系级模板。让特定区域和通用区域处于同一层级，并给它更高的 `priority`。 |
| 灵气比 `amount` 暗示的弱十倍 | `amount` 是基础值：噪声之前初始浓度是 `amount / 10 - 5`。 |
| 方块灵气似乎毫无作用 | 它增加的是容量，不是可见的浓度，对本来就环境上限很高的区块尤其如此。把模板的 `amount` 调低，让方块承担差额。 |
| 灵气总是回到模板值 | 波动、噪声和回复都会重新计算模板；已存的库存只会因修炼、物品燃料和回复而变化。 |

## 接下来

- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 这些表所引用的灵石与丹药。
- [灵气区域](../datapack/json/aura_zone.md)、[方块灵气](../datapack/json/block_aura.md) 和 [物品灵气](../datapack/json/item_aura.md) —— 其余全部字段。
