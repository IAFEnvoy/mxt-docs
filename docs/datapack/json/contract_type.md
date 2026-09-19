---
title: contract_type（契约类型）
---

# contract_type（契约类型） {#contract_type}

文件位置：`data/<namespace>/mxt/contract_type/<path>.json`

**用途**：契约生命周期。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `owner_condition` | `EntityCondition` | `mxt:always_true` | 主人条件。 |
| `creature_condition` | `EntityCondition` | `mxt:always_true` | 灵宠条件。 |
| `follow_action` | `EntityAction` | `mxt:no_op` | 跟随行为。 |
| `combat_action` | `BiEntityAction` | `mxt:no_op` | 战斗行为。 |
| `break_action` | `EntityAction` | `mxt:no_op` | 解除契约行为。 |
| `penalty_action` | `EntityAction` | `mxt:no_op` | 违反契约或死亡惩罚。 |

