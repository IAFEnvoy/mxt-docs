---
title: element（元素）
---

# element（元素） {#element}

文件位置：`data/<namespace>/mxt/element/<path>.json`

**用途**：元素关系（`overcomes`/`adapted_to`，每条关系自带伤害倍率）与显示色；灵气用自身的 `aura_type` 指向一个元素，统一伤害管线按双方灵根的元素关系结算克制与适应。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `overcomes` | `ElementRelation[]` | `[]` | 当前元素克制哪些元素，以及每条克制值多少伤害。 |
| `adapted_to` | `ElementRelation[]` | `[]` | 当前元素适应（抵御）哪些元素，以及每条适应把受到的伤害乘多少。 |
| `color` | **颜色** | `#ffffff` | 显示色，用于灵气消耗等文本。 |

`ElementRelation` 就是"关系 + 这条关系值多少"：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | `HolderOrTag<element>` 或其数组 | **必填** | 这条关系指向的元素；和别处一样，单个 id 与数组、条目与 `#` 标签都接受。 |
| `multiplier` | Double | **必填** | 这条关系的伤害倍率，必须为有限且非负的数值；不满足会被加载期拒绝（整份表加载失败、服务器不启动，而不是运行期夹取）。 |

两条关系由**统一伤害管线**（`DamageCalculationService`）读取，方向不同：

- **第一层（出力）在攻击方结算。** 攻击者灵根的元素若在它的 `overcomes` 里列到了目标灵根的元素，这次伤害就乘以那条 `multiplier`——"我克它，我打得更疼"。
- **第二层（减免）在受击方结算。** 受击者灵根的元素若在它的 `adapted_to` 里列到了攻击元素，受到的伤害就乘以那条 `multiplier`。写 `< 1` 是减免，写 `> 1` 是更脆，写 `1.0` 表示"关系成立但不改数值"（`mxt:element_overcomes` 条件只问关系成不成立，正好用得上这种写法）。

一个实体有多条灵根时，所有成立的关系**相乘**：两条灵根都克制目标就吃两次加成，`multiplier` 写多少就是多少。元素关系允许循环（金克木、木克土……甚至互克）；不要依赖标签值顺序。灵根通过 `element` 字段强绑定一个元素。

```json
// data/example/mxt/element/fire.json
{
  "overcomes": [
    { "elements": ["example:metal"], "multiplier": 1.25 },
    { "elements": ["#example:wood_like"], "multiplier": 1.1 }
  ],
  "adapted_to": [
    { "elements": ["example:fire"], "multiplier": 0.5 }
  ],
  "color": "#ff5522"
}
```

> 两边只要有任意一方没有灵根，关系就都读作"没有关系"，伤害原样落地；普通怪物和还没觉醒的玩家都属于这种情形，管线不会因此报错或改数。

