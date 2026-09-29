---
title: 接口
---

# 接口

这些接口是框架与你的内容之间的接缝：Java 附属**实现**它们（生物、物品、方块实体、轮盘条目），或者**调用**它们（读状态、驱动一次动作）。数据包能表达的东西用不上它们。

按用途分成六组，一页一个接口：

| 分组 | 接口 | 在哪 |
| --- | --- | --- |
| 灵气存取 | [AuraAccess](./aura/aura-access.md)、[ItemAuraAccess](./aura/item-aura-access.md)、[UseItemAuraAccess](./aura/use-item-aura-access.md) | `com.iafenvoy.mxt.api` |
| 生物契约 | [Contractable](./creature/contractable.md)、[ContractOperations](./creature/contract-operations.md)、[CaptureListener](./creature/capture-listener.md)、[Perchable](./creature/perchable.md) | `com.iafenvoy.mxt.api` |
| 轮盘与按键 | [WheelMenuEntry](./wheel/wheel-menu-entry.md)、[WheelSource](./wheel/wheel-source.md)、[WheelEntryKind](./wheel/wheel-entry-kind.md)、[Togglable](./wheel/togglable.md) | 前三个在 `api`，`Togglable` 在 `data/ability` |
| 定义与消耗 | [NamedDefinition](./definition/named-definition.md)、[Cost](./definition/cost.md)、[TooltipAppender](./definition/tooltip-appender.md) | `api`、`data/cost`、NeoForge |
| 炼丹 | [AlchemyHeatSource](./alchemy/alchemy-heat-source.md)、[AlchemyWorkstation](./alchemy/alchemy-workstation.md) | `com.iafenvoy.mxt.api` |
| 载具 | [MountVehicle](./mount/vehicle.md)、[MountRenderer](./mount/renderer.md) | `com.iafenvoy.mxt.api`，`MountRenderer` 在客户端 |

`com.iafenvoy.mxt.api` **只有接口与包注释**：实现留在各自的模块包里，把契约收进这一个包是为了让"依赖框架的扩展点"不等于"依赖框架的内部"。包的位置不代表能不能用：`Cost` 在 `data/cost`、`Togglable` 在 `data/ability`，两个都是内容模组要实现的形状。

三条通用约定：

- **服务端权威**：写状态、收付款、结算都在服务端；只有轮盘条目（`WheelMenuEntry`）是纯客户端的。
- **失败用一个值说回来**：`Result(changed, failure)`、`Togglable.Result` 这类返回值带一个 `Failure` 枚举，正常拒绝不抛异常；客户端调用一律得到"什么都没发生"。
- **一侧回答，别在别处再算一遍**：这些接口都是"实体 / 物品自己回答"的形状，框架侧的查找点各只有一个（`Contracts`、`PerchService`、能力管线）。

运行期的服务（`AuraService`、`AbilityService`、`DamageCalculationService` …）不在这里，看[公开 API](../api.md)。
