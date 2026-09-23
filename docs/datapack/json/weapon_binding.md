---
title: weapon_binding（武器绑定）
aside: false
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
| `element` | `HolderOrTag<element>[]` | `[]` | 这把武器**是什么元素**：条目是一个元素、`#` 标签是一组元素。这是「物品的元素」的第一顺位来源，详见下方。 |
| `attachment_multiplier` | Double | `1.0` | 这把武器**作为护身物**值多少：携带（双手与 Curios 槽）期间，打在携带者身上的打击留下的元素附着乘上它——`0.5` 只留一半、`0` 一点也不留。多件携带物**相乘**，不写就没有影响。见[伤害系统](/technical/damage)的附着一步。 |

**物品的元素**只有一条读取口径，按顺序问两件事：先看**定义声明**——`weapon_binding`、[item_binding](./item_binding.md) 或 [artifact](./artifact.md) 里哪个认领了这堆物品、它写没写 `element`（三个注册表的结果取并集，标签会展开成元素集合，被 `mxt:disabled` 停用的元素不算）；一个都没声明时，才看**物品携带的灵气**——`mxt:spirit_storage` 里那唯一一种灵气，或（存量为空、或存了多种时）它的 `mxt:item_aura` 定义声明的灵气，取该灵气的 `aura_type`。条件 `mxt:item_element` 读的就是这条口径。

