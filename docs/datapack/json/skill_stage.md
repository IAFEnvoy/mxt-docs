---
title: skill_stage（技能水平）
---

# skill_stage（技能水平） {#skill_stage}

文件位置：`data/<namespace>/mxt/skill_stage/<path>.json`

**用途**：技能水平链的单级定义。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `skill` | Identifier | **必填** | 该水平所属的技能链标识。同一条链的每一级都要写同一个 `skill`；不同功法可以共用一条链。 |
| `next_stage` | `Holder<skill_stage>` | 无 | 链上的下一级；最高一级省略。 |
| `mastery` | `NumberProvider` | `0` | 到达该级所需的熟练度。功法的 `mastery_resource` 达到该值、且该级的 `condition` 成立时才能晋升到这一级；写 `0` 表示这一级不要求熟练度。 |
| `damage_multiplier` | Double | `1.0` | 该水平的伤害倍率，必须为有限且非负的数值。由伤害管线的第一层消费：施法者当前所在、且该级的 `configuration` 授予这个能力的水平，其倍率会作为公式变量 `damage_multiplier` 注入这次施放，用来放大这次施放打出的伤害。 |

`mastery` 属于水平本身而不是某个功法：共用一条链的持有者面对的是同一段爬升。它可以是公式，但链上任何一处"下一级要求比上一级更低"都会被拒绝。

> `damage_multiplier` 的消费点（2026-09-20 接入）：施放能力时 `AbilityService` 把"授予该能力、且施法者当前所在的那一级"的倍率写进公式上下文（多个功法都授予同一能力时取最高的那个），`DamageCalculationService` 在攻击方结算时读取并相乘。因此它只作用于**这条链授予的能力打出的伤害**（包括该能力打在自己身上的反噬），不会给持有者的一切伤害加 buff；由诅咒、时间线、物品绑定这类非施放路径产生的伤害，上下文里没有这个值，自然也不受影响。

写法与 `realm_stage` 同形：链身份加一个单向 `next` 指针。区别在于链身份是自由 `Identifier` 而不是某个注册表条目，因此多个功法（以及将来的其它系统）可以共享同一条水平链；一条链从哪一级进入由引用它的定义决定，功法使用 `default_stage`。

`next_stage` 与 `next_realm` 一样只是 holder 引用，链的顺序在运行期由链本身推导：服务器启动或数据包重载时，`ServerCache` 把"没有任何一级指向它"的那一级当作链的第一级，沿 `next_stage` 依次编号（第一级为 `0`），于是任意两级都能比较先后。同一个 `skill` 出现多个第一级、指向的下一级属于别的 `skill`、成环、或指向不存在的条目都会让这次重建失败——与境界链一样，宁可拒绝也不留下顺序不全的缓存。重建还会拒绝 `mastery` 沿链下降的链条：晋升只会拿"下一级"做比较，所以下一级的要求不能比上一级更低。解析期只能拒绝本条目自身的问题（例如非法的 `damage_multiplier`）。

```json
// data/example/mxt/skill_stage/sword_art_1.json
{
  "skill": "example:sword_art",
  "next_stage": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```

