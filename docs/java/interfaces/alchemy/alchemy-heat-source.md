---
title: AlchemyHeatSource
---

# AlchemyHeatSource

异火物品实现它来给丹炉供热（`com.iafenvoy.mxt.api`）。**实现它就是全部**——升温、保温和冷却都由服务端的炼丹服务按这两个数自己算，物品只回答"我这件火最多能烧到多少度、每刻加多少度"。

| 成员 | 说明 |
| --- | --- |
| `double maxTemperature(ItemStack stack, ServerLevel level, BlockPos pos)` | 这件火在炉子里能烧到的最高温度。 |
| `double heatingPerTick(ItemStack stack, ServerLevel level, BlockPos pos)` | 每 tick 往炉温里加多少度。 |

两个方法都**只读**，入参是核心里那一件火（堆大小恒为 `1`）、它所在的 `ServerLevel` 与核心的 `BlockPos`，所以同一件物品放进不同炉子可以给不同答案。

**返回值必须有限且大于 0**，否则丹炉把这件火当成没有：`maxTemperature` 不合法时整炉的可设上限是 `0`，`heatingPerTick` 不合法时按完全不供热处理，炉温只回落。不要每个 tick 现造一份温度曲线或分配临时对象——丹炉只读这两个数，温度怎么推进由它自己定。

**写炉温不属于实现方**：温度是丹炉核心自己的状态（`setTemperature` / `setTargetTemperature` 是 [AlchemyWorkstation](./alchemy-workstation.md) 的成员），只有服务端的炼丹服务会推进它；物品不要自己改批次，也不要自己写温度。

**本体不提供生产用的异火**：接口在 `api`，异火物品由内容包自己注册。炉型规格、可设上限与温度容差见 [alchemy_furnace](/datapack/json/alchemy_furnace)，放火与取火的条件由 [AlchemyWorkstation](./alchemy-workstation.md) 回答。
