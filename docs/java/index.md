---
title: Java 模组开发
---

# Java 模组开发

Java 扩展应优先复用现有数据定义、Action、Condition、Cost 和运行时服务。新增玩法时先确定服务端结算入口，再添加客户端显示和网络 payload。

- [公开 API](/java/api)
- [接口](/java/interfaces/)（多数在 `com.iafenvoy.mxt.api`；一页一个接口：灵气存取、生物契约、轮盘与按键、定义与消耗、炼丹）
- [注册表与 Codec](/java/registries)
- [网络协议与服务端权威](/java/network)
- [客户端轮盘](/java/wheel)
- [客户端界面](/java/screens)
- [信息面板](/java/information-panel)

## 扩展面

| 面 | 附属模组能做什么 |
| --- | --- |
| **数据包注册表** | 在 `data/<命名空间>/mxt/` 下加或覆盖条目；见 [JSON 数据格式](/datapack/json/index)。 |
| **附件** | 用 NeoForge 附件类型存每实体、每维度、每区块的状态；本模组自己的附件登记在 `MxtAttachments`，例如 `CULTIVATION`、`SPIRIT_IDENTITY` 与 `RESOURCE_HOLDER`，读法是 `entity.getData(...)`。 |
| **行为与条件** | 复用内置的实体、双实体、方块、物品与伤害行为/条件类型，或注册新的固有类型；见[类型参考](/datapack/types/index)。 |
| **数值提供器** | 任何数值字段都可以来自常量、表达式或已注册的提供器类型；见[数值提供器](/datapack/types/number_provider_types)。 |
| **阵法功能** | 写一个 `FormationActionType` 记录并注册它，就多一个阵法功能；见[公开 API](/java/api)。 |
| **信息面板** | 用 `InformationManager` 往人物信息面板加自己的行；见[信息面板](/java/information-panel)。 |
| **轮盘条目** | 实现 `WheelMenuEntry` 就多一个客户端轮盘条目；见[客户端轮盘](/java/wheel)。 |

## 接下来

- [公开 API](/java/api) —— 附属模组会调用的运行时服务，从 `AuraService` 到 `DefinitionText`。
- [接口](/java/interfaces/) —— 一页一个接口：灵气存取、生物契约、轮盘与按键、定义与消耗、炼丹。
- [注册表与 Codec](/java/registries) —— 固有类型注册表、数据包注册表清单与 codec 命名约定。
- [网络协议与服务端权威](/java/network) —— 每个 C2S / S2C payload，以及唯一承载物品内容的那个通道。
- [信息面板](/java/information-panel) —— 在人物信息面板里注册自己的行。
- [客户端轮盘](/java/wheel) —— 怎么往客户端轮盘加一个条目。
- [客户端界面](/java/screens) —— 界面在哪，以及物品选择器怎么克隆原版创造模式搜索页。
- [类型参考](/datapack/types/index) —— 每个内置行为与条件类型。
- [JSON 数据格式](/datapack/json/index) —— 每条定义的每个字段。
- [数据包开发总览](/datapack/overview) —— 数据包目录结构与改动何时生效。
- [KubeJS API](/kubejs/index) —— 不需要 Java 的内容的脚本替代方案。
