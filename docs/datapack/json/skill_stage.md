---
title: skill_stage（技能水平）
description: 定义技能水平链上的一级：熟练度要求与这一级的伤害倍率。
aside: false
---

# skill_stage（技能水平） {#skill_stage}

文件位置：`data/<namespace>/mxt/skill_stage/<path>.json`

一个 `skill_stage` 是某条技能水平链上的一级。链身份是一个自由标识（`skill` 字段），不是某个注册表条目，所以多个功法可以共用同一条水平链；链从哪一级进入由引用它的定义决定，功法用 `default_stage`。同一级的熟练度要求与伤害倍率都写在这一级上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `skill_stage.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `skill_stage.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `skill` | Identifier | **必填** | 该水平所属的技能链标识。 |
| `next_stage` | 下一级 id | 无 | 链上的下一级，最高一级省略。 |
| `mastery` | `NumberProvider` | `0` | 到达该级所需的熟练度。 |
| `damage_multiplier` | Double | `1.0` | 该水平的伤害倍率。 |

同一条链的每一级都要写同一个 `skill`。

`mastery` 属于水平本身而不是某个功法：共用一条链的持有者面对的是同一段爬升。它可以是公式，但链上任何一处"下一级要求比上一级更低"都会被拒绝。晋升到这一级要同时满足两件事：功法的 `mastery_resource` 达到该值，以及功法为这一级配的 `condition` 成立；写 `0` 表示这一级不要求熟练度。

`damage_multiplier` 必须为有限且非负的数值。施放能力时会取"授予该能力、且施法者当前所在的那一级"的倍率写进公式上下文，以公式变量 `damage_multiplier` 注入这次施放（多个功法都授予同一能力时取最高的那个）；伤害管线的第一层在攻击方结算时读取并相乘。因此它只作用于**这条链授予的能力打出的伤害**（包括该能力打在自己身上的反噬），不会给持有者的一切伤害加 buff；由诅咒、时间线、物品绑定这类非施放路径产生的伤害，上下文里没有这个值，自然也不受影响。

写法与 `realm_stage` 同形：链身份加一个单向 `next` 指针。区别在于链身份是自由标识而不是某个注册表条目，因此多个功法可以共享同一条水平链。

`next_stage` 与 `next_realm` 一样只是条目引用，链的顺序在运行期由链本身推导：服务器启动或数据包重载时，把"没有任何一级指向它"的那一级当作链的第一级，沿 `next_stage` 依次编号（第一级为 `0`），于是任意两级都能比较先后。同一个 `skill` 出现多个第一级、指向的下一级属于别的 `skill`、成环、或指向不存在的条目都会让这次重建失败——与境界链一样，重建失败时宁可拒绝，也不留下顺序不全的链。重建还会拒绝 `mastery` 沿链下降的链条：晋升只会拿"下一级"做比较，所以下一级的要求不能比上一级更低。解析期只能拒绝本条目自身的问题（例如非法的 `damage_multiplier`）。

**读当前水平**用实体条件 `mxt:skill_stage`（见 [实体条件类型](../types/condition/entity_condition_types.md)）：`stage` 点名一级，`comparison` 取 `exact`（默认）、`at_least` 或 `at_most`（与 `mxt:realm` 同一套取值，比较的是链内序号），可选的 `technique` 把问题限定到某一门功法，不写就问每一门已学功法，任一命中即成立。它读的是持有者**到达过的那一级**（没有晋升过就是功法的 `default_stage`），所以 `at_least` 一旦成立就不会因为之后的变化变回假；没有 `default_stage`、或链顺序没能重建出来的功法永远答否。

```json
// data/example/mxt/skill_stage/sword_art_1.json
{
  "skill": "example:sword_art",
  "next_stage": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```
