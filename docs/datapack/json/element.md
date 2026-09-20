---
title: element（元素）
---

# element（元素） {#element}

文件位置：`data/<namespace>/mxt/element/<path>.json`

**用途**：元素关系（`overcomes`/`adapted_to`，每条关系自带伤害倍率）、它认领的伤害类型（`damage_types`）、附着与衰减参数与显示色；灵气用自身的 `aura_type` 指向一个元素，统一伤害管线按双方灵根的元素关系结算克制与适应，元素附着由 `element_reaction` 结算。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `overcomes` | `ElementRelation[]` | `[]` | 当前元素克制哪些元素，以及每条克制值多少伤害。 |
| `adapted_to` | `ElementRelation[]` | `[]` | 当前元素适应（抵御）哪些元素，以及每条适应把受到的伤害乘多少。 |
| `damage_types` | `HolderOrTag<damage_type>[]` | `[]` | 这个元素认领哪些伤害类型：被认领的伤害类型**就是**这个元素。 |
| `attachment_decay` | Double | `0` | 这个元素在实体身上每 tick 自然衰减多少（`0` = 不衰减）。 |
| `damage_attachment` | Double | `0` | 一次由这个元素构成的攻击会在目标身上留下多少附着（`0` = 不留）。 |
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

### 元素由伤害类型认出：`damage_types`

一次攻击**是什么元素**，由它的伤害类型反查得到，而不是由攻击者灵根推出来。元素通过 `damage_types` 认领伤害类型（条目或 `#` 标签都行），认出后的优先级固定为：

| 情况 | 这一击的元素 |
| --- | --- |
| `damage_type` 被一个或多个元素认领 | 全部认领者（与灵根一致：多条成立时**相乘**） |
| 没有被任何元素认领、有攻击者 | 攻击者灵根的启用元素（= 没有 `damage_types` 时的老行为） |
| 没有被任何元素认领、也没有攻击者 | 空 = 无关系 |

这条通道是第二层减免的**唯一**依据：受击方那一层只拿得到一个 `DamageSource`，所以元素必须能从伤害类型读回来。好处是**不碰原版代码就能让环境伤害有属性**——把 `minecraft:lava`、`minecraft:in_fire`、`minecraft:lightning_bolt` 认领给某个元素，泡岩浆、被雷劈、被爆炸波及都会照那个元素结算；`mxt:explode` 用的是 `minecraft:explosion`，认领它就能让爆炸带属性。多个元素认领同一个伤害类型是合法的（相乘），但会在第一次真的用上时打一条提示。

伤害类型是元素的一份声明，所以**声明的元素与伤害类型必须一致**：在 `mxt:damage` / `mxt:damage_target` 上写 `element` 可以省掉 `damage_type`（管线会取该元素认领的第一个类型）；两个都写时，第一次真的用这一击时核对元素是否认领了它，不一致会**各报一次**日志（不是加载失败——跨注册表的值在加载期未必已经绑定，同一个包会随并行加载顺序时对时错，所以这条检查推迟到首次使用）。这样"火灵根的人放水术法"写得出来，而第二层仍然读得回同一份答案。

```json
// data/example/mxt/element/fire.json
{
  "overcomes": [{ "elements": ["example:water"], "multiplier": 1.5 }],
  "adapted_to": [{ "elements": ["example:fire"], "multiplier": 0.5 }],
  "damage_types": ["minecraft:in_fire", "minecraft:on_fire", "minecraft:lava", "#example:fire_like"],
  "color": "#ff5522"
}
```

伤害条件 `mxt:element` 读的是**同一份**解析（类型目录见[伤害条件](/datapack/types/condition/damage_condition_types)页），所以条件说的元素与管线实际乘的元素永远一致。

### 元素在身上的积累：`attachment_decay` / `damage_attachment` 与 `element_reaction`

两个数字描述"元素怎么攒在身上"：`damage_attachment` 是一次由该元素构成的攻击在目标身上留下的量（默认 `0`，即默认不积累），`attachment_decay` 是每 tick 自然掉多少（默认 `0`，即默认不掉）。攒够之后发生什么由 [element_reaction](/datapack/json/element_reaction) 定义，所以"元素是关系"与"元素会累积"是两件可以分别开启的事。用实体行为 `mxt:attach_element` 可以直接加/减一个元素的附着，实体条件 `mxt:element_attachment` 可以读当前量。

