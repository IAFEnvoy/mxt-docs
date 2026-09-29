---
title: creature_profile（生物档案）
description: 定义挂在生物类型上的档案：属性、灵气门槛、内丹、写入时执行一次的行为与它自己的成长链。
aside: false
---

# creature_profile（生物档案） {#creature_profile}

文件位置：`data/<namespace>/mxt/creature_profile/<path>.json`

一份生物档案挂在生物类型上，在生物进入世界时套一次：它决定这只生物的属性、灵气门槛、内丹，以及在写入那一刻执行的一个行为。它**不决定谁能被契约**——契约资格是目标生物自己的代码事实，见 [contract_type](./contract_type.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entities` | 生物类型 id 或 `#标签` 的数组 | `[]` | 应用到的生物类型或标签。 |
| `spawn_action` | `EntityAction` | `mxt:no_op` | 档案写进这只生物时**执行一次**的行为。 |
| `intelligence` | `NumberProvider` | `0` | 智力值。 |
| `condition` | `EntityCondition` | `mxt:always` | 实体档案应用条件。 |
| `inner_core` | 物品堆模板 | 无 | 内丹物品堆模板，生物死亡时按这一堆掉落。 |
| `preferred_aura_elements` | 元素 id 或 `#标签` 的数组 | `[]` | 偏好的灵气元素。 |
| `minimum_aura` | 灵气 id 到数值的映射 | `{}` | 生成或强化所需的各灵气最低值。 |
| `default_level` | 进度等级 id | 无 | 这条链的入口等级。写了它这只生物才有进度，不写就没有进度。 |
| `mastery_resource` | 数值 id | 无 | 用哪个数值衡量熟练度。写了它就必须写 `default_level`，否则加载期拒绝。 |
| `configuration` | 进度等级 id 到条目对象的映射 | `{}` | 每一级给它什么：到达条件（`condition`）、累计授予的能力（`ability`）与进入时跑一次的动作（`action`），条目字段见 [technique](./technique.md) 里的同名表。写了就必须有 `default_level`。 |

`entities` 写单个、写标签或写混合数组都行。

`condition` 可写单个条件或条件数组。它管的是这份档案应不应用，不替代原版刷怪规则。

`inner_core` 写 `{"id": "..."}`（可带 `count`（`1..99`）与 `components`），也可以只写物品 ID。它收的是**模板**而不是已经绑定好的物品堆：数据包注册表早于物品组件绑定解析。

档案只写一次，所以 `spawn_action` 也只跑一次：生物第一次进入服务端世界时随档案一起执行，档案已经在身上的不再执行。它**只收一个行为**，写成数组会在加载时被拒，要连着做几件事请用 `mxt:sequence`。条件或灵气门槛不过时档案不写入，这一条因此也不跑。它是这份档案里唯一会动世界的字段。

**灵宠成长就是这份档案声明的一条等级链**（见 [progression](./progression.md)）。写了 `default_level`，这只生物就成为这条链的所有者——所有者 id 就是这份档案自己的 id；它落在哪一级记在生物身上，不在档案里。要「只有灵宠能长」，就把等级那一级的 `condition` 写成实体条件 [`mxt:contract`](../types/condition/entity_condition_types.md)。

入口等级自己的 `configuration` 就是"与生俱来"：等级授予是累计的，站着的等级及其以下每一级都算，所以生来就会什么写进入口等级、晋升才学会什么写在下一级。档案因此没有 `granted_abilities` 这类字段，也没有 `passive_modifiers`——要属性就用入口等级的 `mxt:modifier` 能力。`configuration` 的每个条目与 [technique](./technique.md) 的 `configuration` 同形：`condition` 是到达该级要满足的条件，`ability` 是该级授予的能力（也可以写 `#标签` 或数组）。

**熟练度由数据包或脚本自己涨**：本体只提供 `mastery_resource` 这个比较口径，涨它的办法都是现成的——`mxt:add_resource` 动作、灵气的 `regen`、KubeJS；本体不替内容决定成长曲线。

**契约结束会清掉这条链的记录**（主动解除与灵宠死亡两条路都算）：记录没了它退回入口等级，由等级授予的能力同时被撤销。契约还在时等级跟着生物走，收进灵兽袋再放出来还在；`/contract info` 读得出它现在在哪一级。

**额外掉落不由档案管**：内丹以外的东西请写原版战利品表（实体战利品表本身，或挂在它上面的战利品修饰器）。要按修士状态分池，就用本体注册的战利品条件 `mxt:realm`、`mxt:has_ability`、`mxt:has_curse`、`mxt:has_spirit_root`、`mxt:has_element`、`mxt:has_physique`、`mxt:technique`、`mxt:js`，见[战利品与进度条件](../loot-and-criteria.md)。

```json
// data/example/mxt/creature_profile/spirit_wolf.json
{
  "entities": ["minecraft:wolf", "#example:spirit_wolves"],
  "spawn_action": { "type": "mxt:set_no_gravity" },
  "intelligence": 12,
  "condition": { "type": "mxt:always" },
  "inner_core": { "id": "minecraft:amethyst_shard" },
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 },
  "default_level": "example:wolf_1",
  "mastery_resource": "example:beast_mastery",
  "configuration": {
    "example:wolf_1": {
      "condition": { "type": "mxt:always" },
      "ability": "example:wolf_bite"
    },
    "example:wolf_2": {
      "condition": { "type": "mxt:contract" },
      "action": { "type": "mxt:heal", "amount": 4 }
    }
  }
}
```
