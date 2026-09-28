---
title: progression（进度链）
description: 定义进度链上的一级：到达这一级所需的熟练度与它授予的伤害倍率。
aside: false
---

# progression（进度链） {#progression}

文件位置：`data/<namespace>/mxt/progression/<path>.json`

一个 `progression` 是某条进度链上的一级。链**没有身份字段**：链就是 `next_level` 串出来的这条直线，没有任何一级指向它的那一级是入口。一条链可以被多个所有者共用，所有者在自己的定义里用 `default_level` 指明从哪一级进入；到达这一级所需的熟练度与这一级授予的伤害倍率都写在等级自己身上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `progression.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `progression.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `next_level` | 下一级 id | 无 | 链上的下一级，最高一级省略。 |
| `mastery` | `NumberProvider` | `0` | 到达该级所需的熟练度。 |
| `damage_multiplier` | Double | `1.0` | 该等级的伤害倍率。 |

`mastery` 属于等级本身而不是某个所有者：共用一条链的持有者面对的是同一段爬升。它可以是公式，但链上任何一处"下一级要求比上一级更低"都会被拒绝。晋升到这一级要同时满足两件事：所有者定义里的 `mastery_resource` 达到该值，以及所有者为这一级配的 `condition` 成立；写 `0` 表示这一级不要求熟练度。

`damage_multiplier` 必须为有限且非负的数值。施放能力时会取"授予该能力、且施法者当前所在的那一级"的倍率写进公式上下文，以公式变量 `damage_multiplier` 注入这次施放（多个所有者都授予同一能力时取最高的那个）；伤害管线的第一层在攻击方结算时读取并相乘。因此它只作用于**这条链授予的能力打出的伤害**（包括该能力打在自己身上的反噬），不会给持有者的一切伤害加 buff；由诅咒、时间线、物品绑定这类非施放路径产生的伤害，上下文里没有这个值，自然也不受影响。

写法与 `realm_stage` 同形：一个单向 `next` 指针串成一条链。区别在于链由链接本身推出来、不需要额外的链身份字段，因此多个所有者可以共享同一条链。

`next_level` 与 `next_realm` 一样只是条目引用，链的顺序在运行期由链本身推导：服务器启动或数据包重载时，把"没有任何一级指向它"的那一级当作链的第一级，沿 `next_level` 依次编号（第一级为 `0`），于是任意两级都能比较先后。成环、被两处写成后继（分叉）、或指向不存在的条目都会让这条链的重建失败——与境界链一样，重建失败时宁可拒绝，也不留下顺序不全的链。重建还会拒绝 `mastery` 沿链下降的链条：晋升只会拿"下一级"做比较，所以下一级的要求不能比上一级更低。解析期只能拒绝本条目自身的问题（例如非法的 `damage_multiplier`）。

包改了某个所有者的入口等级之后，身体里那条再也走不到的记录会在玩家登录与数据包重载时被清掉，该所有者退回它自己的入口等级；这道检查不在每次读取时跑，每清一条会在日志里打一条 `WARN`（带所有者与等级 id）。

**读当前等级**用实体条件 `mxt:progression`（见 [实体条件类型](../types/condition/entity_condition_types.md)）：`level` 点名一级，`comparison` 取 `exact`（默认）、`at_least` 或 `at_most`（与 `mxt:realm` 同一套取值，比较的是链内序号），可选的 `owner` 把问题限定到某些所有者——它写所有者定义的 id，可以写一个或一串，省略就问这个身体持有的每一种进度，任一命中即成立。它读的是持有者**到达过的那一级**（没有晋升过就是所有者的 `default_level`），所以 `at_least` 一旦成立就不会因为之后的变化变回假；没有 `default_level`、或链顺序没能重建出来的所有者永远答否。

```json
// data/example/mxt/progression/sword_art_1.json
{
  "next_level": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```
