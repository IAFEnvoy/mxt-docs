---
title: spirit_herb（灵植）
---

# spirit_herb（灵植） {#spirit_herb}

文件位置：`data/<namespace>/mxt/spirit_herb/<path>.json`

**用途**：已有物品的灵植元数据。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 绑定现有物品，不创建新的灵植物品。 |
| `quality` | `Holder<item_quality>` | **必填** | 该物品的默认品质。 |
| `age` | `NumberProvider` | `0` | 年龄元数据。 |
| `element_tags` | Identifier[] | `[]` | 元素分类标签，可被 `mxt:herb_tag`（`element`）匹配，因此能写进任何接受 `ItemMatcher` 的地方（物品条件、绑定、`mxt:item_matcher`…）。 |
| `material_tags` | Identifier[] | `[]` | 材料分类标签，同上由 `mxt:herb_tag` 的 `material` 匹配。 |
| `growth_rate` | `NumberProvider` | `0` | 生长速率元数据。 |
| `drop_chance` | `NumberProvider` | `1` | 掉落概率元数据。 |

绑定、品质查询、Tooltip 与两个分类标签的匹配都已接入（`mxt:herb_tag`）；**年龄、生长与掉落的生命周期仍处于制作中**，因为本模组按设计不提供种植/生长系统（`SpiritHerbService` 的说明就是"生长、采集与生成留给内容模组"），`age`/`growth_rate`/`drop_chance` 目前是给内容模组读取的元数据，`mxt:aura_zone` 的 `spirit_plant_bonus`/`natural_spawn_herb` 也因此在等同一套系统。

