---
title: block_aura（方块灵气）
description: 定义哪些方块向所在区块提供灵气，以及每种灵气的容量、恢复速度与颜色。
aside: false
---

# block_aura（方块灵气） {#block_aura}

`block_aura` 定义哪些方块是灵气来源：每个匹配到的方块都为它所在区块的灵气库存做贡献，叠在自然环境之上。灵石矿脉就是靠它把浓度堆到远高于自然值的。

## 文件位置

`block_aura` 是一张**方块数据表**（NeoForge Registry Data Map），不是注册表，文件固定放在 `data/mxt/data_maps/block/block_aura.json`。**第一段命名空间必须是表自己的 `mxt`，不是内容包自己的**：内容包要加值，是往 `data/mxt/data_maps/block/` 里再放一个文件。`values` 的键就是**方块 id 或 `#方块标签`**（标签在加载期展开成它当时的每个方块）——这张表**没有 `blocks` 字段**。写法详见[数据表](../overview.md#数据表data-map)。

**用途**：方块提供的灵气。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| （键） | 方块 ID 或 `#方块标签` | — | **这就是「哪个方块」**，没有别的字段写它。 |
| （值） | 灵气 id 到数值的映射 | `{}` | 该方块提供的灵气表。**没有外层字段名**，值就是这张表本身。 |

`aura` 的键是 `mxt:aura` 注册表条目，不是 `mxt:resource`：数值本身只记一个数，灵气才说明这个数算在哪门灵气上。映射里每一项的字段与 [aura_zone](./aura_zone.md) 的 `aura` 条目相同：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | Double | `0` | 每个匹配方块贡献多少。 |
| `max` | 上限 | `initial_multiplier=1` | 上限，写法见[环境上限类型](/datapack/types/other/aura-maximum)。 |
| `regen_per_tick` | Double | `0` | 每 tick 恢复多少。 |
| `color` | `RGBColor` | `#FFFFFF` | 颜色，只用于环境渲染。 |

`amount` 必须有限且非负，`regen_per_tick` 必须有限，否则这份值在加载期被拒绝。

没有「灵气类型」这类字段：一个方块放出哪些灵气就是这个映射的键集，方块没法认领一门它其实不提供的灵气。

**多个值命中同一个方块时是相加的**（方块灵气本身就是累加量），**不看 `priority`**——数据表里只有它和 `default_quality`（那张表没有 `priority` 字段）两张不按 `priority` 仲裁，理由见[数据表](../overview.md#数据表data-map)的合并一节。

## 示例

```json
// data/mxt/data_maps/block/block_aura.json
{
  "values": {
    "#example:aura_emitters": {
      "mxt:common": { "amount": 5.0, "regen_per_tick": 0.01 }
    },
    "mxt:spirit_stone_ore": {
      "mxt:common": { "amount": 20.0, "max": 40.0, "regen_per_tick": 0.05 }
    }
  }
}
```

## 运行时行为

- 区块加载、方块变化或数据表加载后重建缓存。
- 灵石矿脉可以用多个 `block_aura` 值和方块标签叠起来，提供高于自然环境的灵气。
- 运行时按 7×7×7 子区块范围查询：当前子区块周围 3×3×3 范围使用匹配方块的**真实位置**，外围使用子区块中心近似，统一按 `1 / max(1, 距离平方)` 衰减。
- 每个来源子区块的贡献会根据当前访问玩家数粗略平分，库存仍是区块范围共享的。
- 方块灵气不占用环境基础上限：它同时为当前区块增加等量可储存灵气容量。环境上限为 100、方块总贡献为 30 时，该区块有效上限为 130。
- 方块灵气缓存与区块库存的更新周期由**服务端配置「灵气 → 方块灵气周期」**控制，默认每 10 tick 一次，允许范围 1 至 1200 tick。
- 推荐的自然灵气模板把环境 `amount` 写得很低并启用正负噪声；经 `/ 10 - 5` 处理后大面积区域没有自然灵气，方块贡献就在这个基础上按区块内方块数量累加，所以灵石矿脉可以配得远高于自然值。

## 命令

服务端可用 `/mxt aura query` 查询脚下的最终环境；站在灵石矿石上时，可用 `/mxt aura vein` 查询相连矿脉的数量与等级。
