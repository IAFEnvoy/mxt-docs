---
title: MxtAura：世界灵气
description: 查询某个位置解析后的世界灵气，并添加或移除服务端的持久化灵气区域。
---

# `MxtAura`：世界灵气

`MxtAura` 是脚本读世界灵气的入口，也是唯一能从脚本**写**世界灵气的入口：它给服务端添加持久化的长方体区域，用来表达"这片地方从现在起有这种灵气"。区域本身由数据包里的 [`aura_zone`](/datapack/json/aura_zone) 定义，脚本只是摆位置。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `get(level, pos)` | `Level`、`BlockPos` | `AuraResult` | 读取该位置最终解析后的多资源灵气。只读，客户端可查询其本地可用状态。 |
| `addBox(level, zone, minX, minY, minZ, maxX, maxY, maxZ, priority)` | 服务端 `Level`、已加载 aura zone ID、两个方块坐标、整数优先级 | `string` | 添加持久化长方体区域，返回生成的区域 ID。 |
| `remove(level, area)` | 服务端 `Level`、`addBox` 返回的区域 ID | `boolean` | 删除对应持久化区域。 |

`addBox` 仅接受 `ServerLevel`，且 `zone` 必须是已加载的 `aura_zone` 数据包 ID；否则抛出异常。`AuraResult` 常用只读方法：`aura()`、`concentration()`、`maximum()`、`regenPerTick()`、`cultivationSpeed()`、`source()`、`sourceKind()`、`suppressCultivate()`。

```js
// kubejs/server_scripts/mxt_aura.js
const aura = MxtAura.get(player.level(), player.blockPosition())
if (aura.suppressCultivate()) {
  console.info('cultivation is suppressed here')
}

const area = MxtAura.addBox(player.level(), 'example:fire_vein',
  -8, 60, -8, 8, 72, 8, 10)
// 之后可以随时收回：
MxtAura.remove(player.level(), area)
```

## 相关

- 数据包侧：[灵气区域 `aura_zone`](/datapack/json/aura_zone)、[灵气身份 `aura`](/datapack/json/aura)、[方块灵气 `block_aura`](/datapack/json/block_aura)、[物品灵气 `item_aura`](/datapack/json/item_aura)。
- 灵气与元素的关系：[MxtElements](/kubejs/api/elements)；灵气池的分配与算法：[灵气](/technical/aura)。
- [KubeJS API 参考](/kubejs/api-reference)。
