---
title: heat_source（供热方块）
description: 供热方块的温度与升温速度定义：底层正中央那一格放什么，以及整炉炉温上限怎么算。
aside: false
---

# heat_source（供热方块） {#heat_source}

一份 `heat_source` 给一类方块定下两个数：它能让丹炉烧到多热（`max_temperature`）和每 tick 升多少度（`heating_per_tick`）。温度怎么推进、什么时候回落由服务端决定，定义只回答这两个数。

## 文件位置

供热方块文件放在数据包的 `data/<namespace>/mxt/heat_source/`。

**用途**：一类方块的供热数值。

文件名对应它的 ID。例如 `data/example/mxt/heat_source/magma.json` 的 ID 是 `example:magma`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blocks` | 方块 id、`#标签` 或混合数组 | **必填** | 匹配哪些方块，不能为空。 |
| `max_temperature` | Double | **必填** | 这个方块能给炉子的最高温度，有限且大于 `0`。 |
| `heating_per_tick` | Double | **必填** | 每一 tick 的升温量，有限且大于 `0`。 |
| `priority` | Integer | `0` | 多条定义匹配同一个方块时的优先级，高的赢；同分按注册表顺序取先出现的。 |

```json
{
  "blocks": ["minecraft:magma_block"],
  "max_temperature": 200,
  "heating_per_tick": 4
}
```

```json
{
  "blocks": ["#minecraft:campfires"],
  "max_temperature": 150,
  "heating_per_tick": 2,
  "priority": 5
}
```

同一个方块被几条定义同时匹配时只取一条：先比 `priority`，高的赢；`priority` 相同时取注册表顺序里先出现的那一条，不把几个数值相加。

## 供热格在哪

供热格是丹炉**底层正中央那一格**（本地 index 4，也就是上层炉体中心的正下方）。那一格在结构里**不被校验、也不被认领**：底层只有四个角算结构，那一格放什么、放不放、区块加没加载都不影响成型。

只有那一格里的方块能供上热，读的就是这张表：放的东西不在表里、或者那一格空着，炉子就没有热源，可设的炉温上限是 `0`，开炉会以温度不足被拒，也不扣料。

供热方块不消耗。拆核心不会掉它——它是世界里独立的一格，留在原地。活动批次里把它挖掉或换成别的方块，这一批不会中止，只是停止升温、按炉型的 `cooling_per_tick` 回落。

## 炉温上限

整炉实际可设的炉温上限是 `min(18 块炉壁的最低耐温, 供热方块的 max_temperature)`。18 块炉壁的耐温见[炉壁材料](./alchemy_wall_material.md)，设定温度与回落速度见[炉型规格](./alchemy_furnace.md)。

## 方块自己回答

方块可以实现 `com.iafenvoy.mxt.api.AlchemyHeatSource`，自己回答这两个数（点着时和熄灭时给不一样的值，或者看周围有什么）。实现了接口的方块**以自己的回答为准**，忽略这张表给它写的条目——接口是这张表之上的更高级控制，不是必须的，绝大多数方块只写这张表就够。接口的返回值必须有限且大于 0，否则炉子把那一格当成没有热源。

**本体不提供热源方块**，也不内置岩浆、火这类数值：给多少由数据包或内容包自己定。测试包里的三个方块只供测试，不是内容包要注册的东西。
