---
title: spirit_root（灵根）
---

# spirit_root（灵根） {#spirit_root}

文件位置：`data/<namespace>/mxt/spirit_root/<path>.json`

**用途**：与单一元素绑定的灵根。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `element` | `Holder<element>` | **必填** | 灵根所属元素。 |
| `cultivation_multiplier` | `NumberProvider` | `1` | 修炼倍率。 |
| `element_ability_modifier` | `NumberProvider` | `1` | 元素亲和技能倍率。 |
| `rarity` | String | `common` | 内容方使用的稀有度标识。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 授予的能力。 |

灵根分组、兼容与筛选使用原版标签（`data/<namespace>/tags/mxt/spirit_root/<name>.json`），不再提供重复的自定义分组字段。

