---
title: item_archetype（法器原型）
---

# item_archetype（法器原型） {#item_archetype}

文件位置：`data/<namespace>/mxt/item_archetype/<path>.json`

**用途**：法器原型和能力。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `item_type` | String | **必填** | 法器分类标识。目前只是元数据：仓库里唯一的"分类"判断是 Curios 腰带槽是否接收（它问的是"是不是法器"），没有任何按该字符串分流的行为。 |
| `spirit_capacity` | `NumberProvider` | `0` | 灵力容量，**就是**法器实际用到的上限（由 `mxt:charge_artifact` 灌能时读取）。栈上没有 archetype、archetype 已被删掉、或声明值不是正有限数时，退回该动作自己的 `capacity` 字段；两者都不可用时按 0，也就是灌不进去。 |
| `storage_slots` | `NumberProvider` | `0` | 储物槽位。 |
| `flight_speed` | `NumberProvider` | `0` | 飞行速度；`0` 表示不提供飞行。 |
| `flight_costs` | `List<ResourceCost>` | `[]` | 飞行消耗。 |
| `granted_abilities` | `Holder<ability>[]` | `[]` | 法器授予能力。 |
| `refine_action` | ItemAction | 无操作 | 法器精炼时对持有者和物品执行的行为。 |

`refine_action` 使用现有 `ItemAction` 分派，可直接内联单个行为或行为数组。

法器身上那份状态（`mxt:artifact_state` 组件）另有两件事值得记：`spirit_energy` 的上限就是 archetype 的 `spirit_capacity`（见上），而 `nourishment`（温养度，`0..1`）现在有了生命周期——每次给法器灌能，按**真正收下的量 ÷ 本次有效容量**往上加并夹在 `0..1`，只升不降；反过来它又是容量的加成，`有效容量 = 声明容量 × (1 + 0.5 × nourishment)`，也就是养满的法器能装到 1.5 倍。两端都做夹取，所以手改组件写再大的 nourish 也只能顶到 1.5 倍。数据包想读它，用通用的 `mxt:component` 条件读 `mxt:artifact_state` 的 `nourishment` 即可。

