---
title: AlchemyWorkstation
---

# AlchemyWorkstation

**已放下的丹炉核心**（方块实体）实现的契约（`com.iafenvoy.mxt.api`）：框架从它这里读九个逻辑格、两个温度、异火槽与结构结果，再交给服务端的炼丹服务开炉、推进与结算。核心自己只持有异火、炉体单件和活动批次，**主药仓、辅药仓与产物仓的物品各自留在自己的方块实体里**，所以 `container()` 给的是一份实时逻辑视图，不是把某一份库存拷过来。

| 成员 | 说明 |
| --- | --- |
| `Container container()` | 九个逻辑格的**实时视图**（主药 0–1、辅药 2–3、药引 4、产物 5–8），不是拷下来的输入列表。 |
| `AlchemyWorkstationState state()` | 批次与两个温度的运行状态，服务端 tick 改的就是它。 |
| `BlockPos getBlockPos()` | 核心位置。 |
| `ItemStack furnaceItem()` | 炉体单件，堆大小恒为 `1`；调用方**不要改它**。 |
| `Optional<Holder<AlchemyFurnaceDefinition>> furnaceDefinition()` | 这件炉体解析出的炉型规格。 |
| `double temperature()` / `double targetTemperature()` | 当前炉温 / 设定温度。 |
| `boolean setTargetTemperature(double temperature)` | 设定温度：有限、落在 `0` 到 `maximumTemperature()` 之间才接受并返回 `true`。 |
| `void setTemperature(double temperature)` | 直接写当前炉温。 |
| `Container fireContainer()` | 异火槽，一格，堆大小上限 `1`。 |
| `boolean canPlaceFire(ItemStack stack)` | 这件物品现在能不能放进异火槽。 |
| `boolean canTakeFire()` | 现在能不能把异火取出来。 |
| `double wallTemperatureLimit()` | 22 块炉壁耐温的**最低值**；任一格缺失、区块未加载、没有材料或材料定义读不出来时给 `0`。 |
| `double fireTemperatureLimit()` | 异火的最高温度；槽空、或那个答案不是有限正数时给 `0`。 |
| `double maximumTemperature()` | `min(炉壁, 异火)`；任一侧不可用时给 `0`。 |
| `AlchemyFurnaceStructure.Status structureStatus()` | 结构检查结果：成型、完整、缺块、未加载区块、被别的炉占用。 |
| `AlchemyPhase phase()` | `IDLE` / `WARMING` / `RUNNING` / `READY`。 |
| `void setChanged()` | 状态变了之后标脏存档并同步。 |

**异火槽只有一格，堆大小被夹到 `1`**：放进去的物品必须实现 [AlchemyHeatSource](./alchemy-heat-source.md)，而 `canPlaceFire` 与 `canTakeFire` 在活动批次中都答 `false`，所以一批在跑时既换不了火也取不走火；取空那一侧同样要过 `canTakeFire`。

**可设上限是两条限制里较低的那条**：`wallTemperatureLimit()` 取 22 块炉壁耐温里最低的一块，缺一块、那块没加载、或那份炉壁材料定义读不出来就是 `0`——不能拿高耐温的壁平均掉薄弱处；`fireTemperatureLimit()` 读异火自己报的最高温度，槽空或答案非有限正数也是 `0`；`maximumTemperature()` 给 `min(炉壁, 异火)`，任一侧不可用时整炉给 `0`，此时设定温度只能停在 `0`。设定温度必须是有限数并落在 `0` 与这个上限之间，非法请求拒绝。

**推进与结算归服务端炼丹服务**：读异火的 `heatingPerTick`、把炉温推向设定值（不越过）、进出 `WARMING` / `RUNNING` / `READY`、生成待产出、判废与结算都在那里，核心不要在自述的 tick 里再推一套温度。**开炉不是核心的事**：起批、预览与终止都走 [公开 API](../../api.md) 的 `AlchemyWorkstationService`（`start` / `preview` / `abort`），它从 `container()`、`furnaceItem()`、`furnaceDefinition()`、`structureStatus()`、`getBlockPos()` 与 `state()`（忙不忙、在哪一阶段）、`targetTemperature()` / `maximumTemperature()` 取判定所需的输入，核心不自己扣料、不自己判配方。

**结构检查按框架的固定壳**：3×3×3，核心 `(1,1,0)`、主药仓在左、辅药仓在右、产物仓在空腔正上方（顶层中央）、其余 22 格是炉壁；`structureStatus()` 如实回答这一步的结果，缺块、区块未加载与被别的炉占用的格子分开报。框架据此决定是停一拍（未加载）还是按失败结算一次（缺失或冲突）。

**核心不要实现 `Container`**：原版的移除与漏斗会顺着 `Container` 吃掉各仓口的实时堆，只有 `container()` 这一份逻辑事务视图可以给出去。`furnaceItem()` 返回的是活的单件，调用方不要就地改它。

炉型规格、槽位编号与药引位置见 [alchemy_furnace](/datapack/json/alchemy_furnace)。
