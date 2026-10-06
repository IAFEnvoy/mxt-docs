---
title: block_aura（方块灵气）
description: 定义哪些方块向所在区块提供灵气，以及每种灵气的容量、恢复速度与颜色。
aside: false
---

# block_aura（方块灵气） {#block_aura}

`block_aura` 定义哪些方块是灵气来源：每条定义认领的每个方块都为它所在区块的灵气库存做贡献，叠在自然环境之上。灵石矿脉就是靠它把浓度堆到远高于自然值的。

## 文件位置

`block_aura` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/block_aura/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/block_aura/aura_emitters.json` 就是 `example:aura_emitters`。模组自带的条目在 `data/mxt/mxt/block_aura/`；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里再加一份贡献，多写一条定义就行，命中同一个方块的定义**都生效**，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:block_aura` 列出这些定义认领的方块。

**用途**：方块提供的灵气。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blocks` | 方块条目 | **必填、不能为空** | 这条定义认领哪些方块：单个方块 id、`#方块标签`，或它们的数组。 |
| `aura` | 灵气 id 到数值的映射 | `{}` | 这条定义让每个被认领的方块提供哪些灵气、各多少。 |

`aura` 的键是 `mxt:aura` 注册表条目，不是 `mxt:resource`：数值本身只记一个数，灵气才说明这个数算在哪门灵气上。映射里每一项的字段与 [aura_zone](./aura_zone.md) 的 `aura` 条目相同：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | Double | `0` | 每个匹配方块贡献多少。 |
| `max` | 上限 | `initial_multiplier=1` | 上限，写法见[环境上限类型](/datapack/types/other/aura-maximum)。 |
| `regen_per_tick` | Double | `0` | 每 tick 恢复多少。 |
| `color` | `RGBColor` | `#FFFFFF` | 颜色，只用于环境渲染。 |

`amount` 必须有限且非负，`regen_per_tick` 必须有限，否则这条定义在加载期被拒绝。`aura` 省略或写成空表时这条定义不贡献任何灵气，只是认领了几个方块。

没有「灵气类型」这类字段：一条定义让方块放出哪些灵气就是这个映射的键集，方块没法认领一门它其实不提供的灵气。

**多条定义命中同一个方块时都生效、相加**（方块灵气本身就是累加量）：这张注册表**没有 `priority` 字段**，不挑一条赢，也没有谁盖过谁。

## 示例

`data/example/mxt/block_aura/aura_emitters.json`：

```json
{
  "blocks": ["mxt:spirit_stone_ore", "#example:aura_emitters"],
  "aura": {
    "example:spirit_power": {"amount": 5.0, "max": 5.0, "regen_per_tick": 0.01}
  }
}
```

## 运行时行为

- 区块加载、方块变化或注册表加载后重建缓存。
- 灵石矿脉可以用多条 `block_aura` 定义和方块标签叠起来，提供高于自然环境的灵气。
- 运行时按 7×7×7 子区块范围查询：当前子区块周围 3×3×3 范围使用匹配方块的**真实位置**，外围使用子区块中心近似，统一按 `1 / max(1, 距离平方)` 衰减。
- 每个来源子区块的贡献会根据当前访问玩家数粗略平分，库存仍是区块范围共享的。
- 方块灵气不占用环境基础上限：它同时为当前区块增加等量可储存灵气容量。环境上限为 100、方块总贡献为 30 时，该区块有效上限为 130。
- 方块灵气缓存与区块库存的更新周期由**服务端配置「灵气 → 方块灵气周期」**控制，默认每 10 tick 一次，允许范围 1 至 1200 tick。
- 推荐的自然灵气模板把环境 `amount` 写得很低并启用正负噪声；经 `/ 10 - 5` 处理后大面积区域没有自然灵气，方块贡献就在这个基础上按区块内方块数量累加，所以灵石矿脉可以配得远高于自然值。

## 命令

服务端可用 `/mxt aura query` 查询脚下的最终环境；站在灵石矿石上时，可用 `/mxt aura vein` 查询相连矿脉的数量与等级。
