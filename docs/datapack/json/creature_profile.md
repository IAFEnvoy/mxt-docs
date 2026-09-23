---
title: creature_profile（生物档案）
aside: false
---

# creature_profile（生物档案） {#creature_profile}

文件位置：`data/<namespace>/mxt/creature_profile/<path>.json`

**用途**：生物档案和实体绑定条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `realm_stages` | `Holder<realm_stage>[]` | `[]` | 生物境界档案，可填写多个境界。 |
| `intelligence` | `NumberProvider` | `0` | 智力值。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 实体档案应用条件；可写单个条件或条件数组，不替代原版刷怪规则。 |
| `inner_core` | Identifier | 无 | 内丹物品 ID。 |
| `loot_table` | Identifier | 无 | 生物掉落表 ID。 |
| `contract_tags` | Identifier[] | `[]` | 让这份档案自己为契约资格背书：每个条目按 `mxt:contract_type` 注册表解释，既可以直接写契约类型 id，也可以写该注册表下的标签 id（`data/<ns>/tags/mxt/contract_type/...`）。判定与契约类型自身的 `creature_condition` **取并集**——两者任一成立即可契约，因此只会放宽、不会收窄；空列表或不写该字段时行为与从前完全一致。 |
| `entity_type_tags` | `HolderOrTag<EntityType>[]` | `[]` | 应用到的生物类型或标签。 |
| `preferred_aura_elements` | `HolderOrTag<element>[]` | `[]` | 偏好的灵气元素。 |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | 生成或强化所需的各灵气最低值。 |

