---
title: AlchemyHeatSource
---

# AlchemyHeatSource

方块实现它来给丹炉供热（`com.iafenvoy.mxt.api`）。**它是可选的**：丹炉读的是**底层正中央那一格**里的方块，默认只查数据表 [`mxt:heat_source`](/datapack/json/heat_source)——按方块或方块标签给 `max_temperature` 与 `heating_per_tick`；方块自己实现了这个接口时**以方块的回答为准**，忽略表里给它写的值。绝大多数方块只写那张表就够，接口是给"答案取决于方块状态或周围环境"的方块用的（点着的火、装满的火盆）。

| 成员 | 说明 |
| --- | --- |
| `double maxTemperature(BlockState state, ServerLevel level, BlockPos pos)` | 这个方块在炉子里能供到的最高温度。 |
| `double heatingPerTick(BlockState state, ServerLevel level, BlockPos pos)` | 每 tick 往炉温里加多少度。 |

两个方法都**只读**，入参是方块自己的状态、它所在的 `ServerLevel` 与**供热格自己的** `BlockPos`（不是核心），所以同一个方块可以按自己的状态或周围环境给出不同答案。

**返回值必须有限且大于 0**，否则丹炉把这一格当成没有热源：`maxTemperature` 不合法时整炉的可设上限是 `0`，`heatingPerTick` 不合法时按完全不供热处理，炉温只回落。不要每个 tick 现造一份温度曲线或分配临时对象——丹炉只读这两个数，温度怎么推进由它自己定。

**写炉温不属于实现方**：温度是丹炉核心自己的状态（`setTemperature` / `setTargetTemperature` 是 [AlchemyWorkstation](./alchemy-workstation.md) 的成员），只有服务端的炼丹服务会推进它；方块不要自己改批次，也不要自己写温度。读取只在服务端发生，也不会为了问这一句去加载区块。

**本体不提供生产用的热源方块**：接口在 `api`，方块由内容包自己注册，数值也可以只写 `mxt:heat_source`。炉型规格、可设上限与温度容差见 [alchemy_furnace](/datapack/json/alchemy_furnace)，供热格的位置与表本身见 [heat_source](/datapack/json/heat_source)。测试包里有三个只供测试的方块：`mxt_test:alchemy_test_fire`（150 / 40，靠方块标签的条目）、`mxt_test:alchemy_weak_fire`（80 / 10，靠 `priority: 5` 的条目压过标签）与 `mxt_test:alchemy_advanced_fire`（实现本接口，点着时 250 / 25、熄灭时 0），它们不是内容包要照抄的方块。
