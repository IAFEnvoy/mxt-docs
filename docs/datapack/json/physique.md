---
title: physique（体质）
---

# physique（体质） {#physique}

文件位置：`data/<namespace>/mxt/physique/<path>.json`

**用途**：独立于元素的体质加成。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attribute_modifiers` | `List<AttributeEntry>` | `[]` | 独立于灵根的原版属性加成；填写 `value` 后每 tick 按实体上下文重新计算。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 授予的能力。 |
| `holder_condition` | `EntityCondition` | `mxt:always_true` | 授予前的持有条件；可组合 `mxt:has_spirit_root`、`mxt:has_physique` 等条件表达先决体质或灵根。 |
| `exclusive_tags` | `Identifier[]` | `[]` | 互斥标签。 |
| `rarity` | String | `common` | 内容方使用的稀有度标识。 |
| `allow_stacking` | Boolean | `false` | 是否允许同一体质叠加。 |

体质不绑定元素；元素相关逻辑应写在灵根或环境配置中。

`spirit_root` 与 `physique` 的授予和移除均可用实体行为完成：`mxt:grant_spirit_root`、`mxt:remove_spirit_root`、`mxt:grant_physique`、`mxt:remove_physique`。持有状态可用实体条件 `mxt:has_spirit_root`、`mxt:has_physique` 判定。

