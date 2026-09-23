---
title: 搭建灵气环境
description: 逐层叠加灵气区域，用方块与物品补充灵气，用噪声和波动驱动浓度，并把结果呈现在 HUD、雾效和命令上。
---

# 搭建灵气环境

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
| `element_fit_bonus` / `element_conflict_penalty` | 调整灵根的修炼修正：当位置上存在 `aura_type` 等于该灵根元素的灵气时 `+ element_fit_bonus`，不存在时 `- element_conflict_penalty`。两者默认都是 `0`。 |
| `client_render` | 雾颜色、雾效作用的距离（`8..256`）以及它取代原版雾的强度（`0..1`）。强度还会按浓度缩放，所以稀薄的灵气看起来更淡。 |
| `client_hud` | 两条可选的状态条：`stored_aura` 读区块库存，`sensed_concentration` 读环境模板。它们绘制在同一侧资源条的上方。 |

### 规则

`rules` 对象补充环境策略：

```json
"rules": {
  "cultivate_suppress": false,
  "tribulation_modify": 0.15,
  "alchemy_env_bonus": true
}
```

`cultivate_suppress` 会中止正在进行的修炼，`tribulation_modify` 把公式变量 `aura_tribulation_modifier` 注入天劫公式。`alchemy_env_bonus` 已经接上消费者：设置它的区域自己就满足炼丹配方的 `minimum_aura` 要求，因为这个标记只是纯粹的是/否，没有任何可用于缩放灵气池的量级。另外两个字段——`spirit_plant_bonus` 和 `natural_spawn_herb`——没有消费者，因为本模组完全没有灵植种植或生长系统：生长、采集与生成按设计留给内容模组。

## 第 2 步 —— 来自方块的灵气

灵石矿脉理应比它所在的地面更有价值。

```json
// data/example/mxt/block_aura/spirit_stone_ore.json
{
  "blocks": ["mxt:spirit_stone_ore", "mxt:spirit_stone_block"],
  "aura": {
    "example:qi": {"amount": 5.0, "max": 5.0, "regen_per_tick": 0.01}
  }
}
```

- `blocks` 必填，接受方块 ID 和方块标签；区块内每个匹配的方块贡献一次。`aura` 是逐灵气的贡献量，把灵气 ID 映射到 `amount`，因此不需要额外的种类标记。
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

`item_aura` 把物品变成修炼燃料：玩家修炼时，整组物品逐 tick 被抽取，其灵气释放到当前境界的资源条里。

```json
// data/example/mxt/item_aura/spirit_stone.json
{
  "items": ["mxt:spirit_stone", "#example:spirit_fuel"],
  "type": "example:qi",
  "aura": 100,
  "consume_speed": "0.5 + caster_level * 0.05",
  "release_speed": 2,
  "exhausted_action": {"type": "mxt:no_op"}
}
```

- `items` 是常规的物品匹配器，所以一个文件就能覆盖整个燃料物品标签。它必填，`type`、`aura`、`consume_speed` 和 `release_speed` 也必填；`result_stack` 与 `exhausted_action` 可选。
- `type` 是该物品携带的**灵气**——`mxt:aura` 条目，而不是元素。释放的灵气用什么数值计量，由那条灵气自己的 `resource` 决定，它的元素则是那条灵气的 `aura_type`。
- `aura` 是每件物品的总量，处理开始时写入物品堆上服务端的 `mxt:item_aura` 组件（`remain` 字段）；整组物品在处理期间进入 `mxt:float_holding_item` 附件。对实现 `ItemAuraAccess` 的物品，它则是每件物品的充能上限。
- 每个 tick 都用当时匹配到的定义从剩余灵气里扣除 `consume_speed × 堆叠数量`，并向境界资源条充入 `release_speed × 堆叠数量`。拿得越多抽得越快，但持续的总 tick 数不变。
- 半用完的一组会优先于新的一组被继续使用，新的一组按主手、副手、物品栏顺序取用。修炼停止、玩家登出或死亡时，整组物品原样归还。
- 耗尽时移除物品，并返还配置的 `result_stack`。实现 `ItemAuraAccess` 的物品（例如灵石）行为不同：它们就地充能、就地抽取，而不是被消耗；没有携带 `mxt:spirit_storage` 组件的物品堆视为满充。

::: info

客户端不绘制燃料条，也从不自行消耗物品。

:::

## 第 4 步 —— 它在哪里显示

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
/mxt aura query              → every aura at your feet, with its element marker
/mxt aura query example:qi   → one aura
/mxt aura vein               → the size and tier of the connected spirit stone vein you stand on
/mxt aura cache clear 8      → rebuild the cached aura of nearby chunks (radius in chunks, default 3, 0..32)
```

## 第 5 步 —— 用脚本创建区域

群系和维度覆盖的是静态世界。凡是必须在运行时创建的东西——任务放置的祝福、被占领的区域、临时场域——都用 KubeJS 桥接：

```js
// kubejs/server_scripts/mxt_areas.js
const area = MxtAura.addBox(
  player.level, 'example:misty_valley',
  0, 64, 0,                  // minimum corner
  64, 128, 64,               // maximum corner
  10                         // priority
)
console.info(`Created aura area ${area}`)

// Read the resolved aura at a position, including every source.
const aura = MxtAura.get(player.level, player.blockPosition())
console.info(`Concentration: ${aura.concentration()}, maximum: ${aura.maximum()}`)

// Later, or from another script:
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

## 第 6 步 —— 验证

重新加载世界——这些是数据包注册表，`/reload` 不会读取它们——然后运行：

```text
(load the world again)
/mxt registries validate
/mxt aura query example:qi     → a forest should read higher than a plains
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

## 下一步

- [用 KubeJS 创建物品并绑定它们](./create-items-with-kubejs.md) —— 这些表所引用的灵石与丹药。
- [灵气区域](../datapack/json/aura_zone.md)、[方块灵气](../datapack/json/block_aura.md) 和 [物品灵气](../datapack/json/item_aura.md) —— 其余全部字段。
