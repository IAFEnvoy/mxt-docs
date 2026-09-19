---
title: weapon_binding（武器绑定）
---

# weapon_binding（武器绑定） {#weapon_binding}

文件位置：`data/<namespace>/mxt/weapon_binding/<path>.json`

**用途**：现有物品的武器属性和行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 匹配已有武器物品。 |
| `attack_damage` | `NumberProvider` | `0` | 绑定提供的攻击伤害。 |
| `attack_speed` | `NumberProvider` | `0` | 绑定提供的攻击速度。 |
| `attributes` | `List<AttributeEntry>` | `[]` | 额外原版属性修正；可选 `value` 会在每 tick 更新物品属性组件。 |
| `use_action` | `EntityAction` | `mxt:no_op` | 右键使用行为。 |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | 命中攻击行为。 |
| `tick_action` | `EntityAction` | `mxt:no_op` | 持有 tick 行为。 |
| `quality_group` | `Tag<item_quality>` | 无 | 允许的品质组。 |
| `conditions` | `EntityCondition[]` | `[]` | 使用、攻击和属性应用前的条件；支持内联条件或带描述的条件对象。 |

