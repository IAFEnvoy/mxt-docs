---
title: pill_binding（丹药绑定）
---

# pill_binding（丹药绑定） {#pill_binding}

文件位置：`data/<namespace>/mxt/pill_binding/<path>.json`

**用途**：现有物品的丹药和丹毒规则。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 匹配已有可食用物品。 |
| `on_consume` | `EntityAction` | `mxt:no_op` | 食用完成后行为。 |
| `toxicity_gain` | `NumberProvider` | `0` | 增加丹毒。 |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | 过量阈值。 |
| `on_overdose` | `EntityAction` | `mxt:no_op` | 超过阈值行为。 |
| `toxicity_after_overdose` | `NumberProvider` | `0` | 过量后丹毒值。 |
| `quality_group` | `Tag<item_quality>` | 无 | 允许的品质组。 |
| `conditions` | `EntityCondition[]` | `[]` | 食用前检查；支持内联条件或带描述的条件对象。 |

