---
title: creature_profile（生物档案）
aside: false
---

# creature_profile（生物档案） {#creature_profile}

文件位置：`data/<namespace>/mxt/creature_profile/<path>.json`

**用途**：生物属性档案（匹配、门槛、内丹与写入时执行的一条行为）。它**不决定谁能被契约**：资格只看目标实体有没有实现 `Contractable`，见 [`contract_type`](contract_type)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entities` | `HolderOrTag<EntityType>[]` | `[]` | 应用到的生物类型或标签；写单个、写标签或写混合数组都行。 |
| `spawn_action` | `EntityAction` | `mxt:no_op` | 档案写进这只生物时**执行一次**的行为（生物第一次进入世界；档案已经在身上的不再执行）。**只写一个行为**，写成数组会在加载时被拒——要连着做几件事请用 `mxt:sequence`。条件或灵气门槛不过时档案不写入，这一条也不跑。 |
| `intelligence` | `NumberProvider` | `0` | 智力值。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 实体档案应用条件；可写单个条件或条件数组，不替代原版刷怪规则。 |
| `inner_core` | `ItemStackTemplate` | 无 | 内丹物品堆模板，写 `{"id": "..."}`（可带 `count`（`1..99`）与 `components`），也可以只写物品 ID；生物死亡时按这一堆掉落。原生数据包注册表早于物品组件绑定解析，所以这里收的是**模板**而不是 `ItemStack`。 |
| `preferred_aura_elements` | `HolderOrTag<element>[]` | `[]` | 偏好的灵气元素。 |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | 生成或强化所需的各灵气最低值。 |

档案在生物进入世界时套一次，写进去的是属性加**一条** `spawn_action`：匹配、灵气门槛、智力、内丹，以及档案写入那一刻跑一次的那个行为——它也是这份档案里唯一会动世界的字段。契约资格曾经是它的一个字段，改成代码事实之后就没有了，见 [`contract_type`](contract_type)。

**额外掉落不由档案管**：内丹以外的东西请写原版战利品表（实体战利品表本身，或挂在它上面的战利品修饰器）。要按修士状态分池，就用本体注册的战利品条件 `mxt:realm`、`mxt:has_ability`、`mxt:has_curse`、`mxt:has_spirit_root`、`mxt:has_element`、`mxt:has_physique`、`mxt:js`，见[战利品与进度条件](/datapack/loot-and-criteria)。

```json
{
  "entities": ["minecraft:wolf", "#example:spirit_wolves"],
  "spawn_action": { "type": "mxt:set_no_gravity" },
  "intelligence": 12,
  "condition": { "type": "mxt:always_true" },
  "inner_core": { "id": "minecraft:amethyst_shard" },
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 }
}
```
