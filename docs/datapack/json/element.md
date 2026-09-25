---
title: element（元素）
aside: false
---

# element（元素） {#element}

文件位置：`data/<namespace>/mxt/element/<path>.json`

**用途**：元素关系（`overcomes`/`adapted_to`，每条关系自带伤害倍率）、它认领的伤害类型（`damage_types`）、附着与衰减参数与显示色；灵气用自身的 `aura_type` 指向一个元素，统一伤害管线按双方灵根的元素关系结算克制与适应，元素附着由 `element_reaction` 结算。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `element.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `element.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `overcomes` | `ElementRelation[]` | `[]` | 当前元素克制哪些元素，以及每条克制值多少伤害。 |
| `adapted_to` | `ElementRelation[]` | `[]` | 当前元素适应（抵御）哪些元素，以及每条适应把受到的伤害乘多少。 |
| `damage_types` | `HolderOrTag<damage_type>[]`，条目也可以是对象 | `[]` | 这个元素认领哪些伤害类型：被认领的伤害类型**就是**这个元素。两种写法等价——裸字符串（或 `#标签`）用元素自己的 `damage_attachment`，`{"damage_type": "minecraft:lava", "damage_attachment": 2.0}` 给这一类打击**自己的附着量**。见下方「认领的类型就是分组」。 |
| `attachment_decay` | Double | `0` | 这个元素在实体身上每 tick 自然衰减多少（`0` = 不衰减）。 |
| `damage_attachment` | Double | `0` | 一次由这个元素构成的攻击会在目标身上留下多少附着（`0` = 不留）。**只有伤害类型被认领的攻击才留**，回落到攻击者灵根的那些只参与关系、不留附着。 |
| `color` | **颜色** | `#ffffff` | 显示色，用于灵气消耗等文本。 |
| `conflict_multiplier` | Double | `1.0` | 持有者**灵根与它相冲**时，这个元素在手里值多少：攻击者在效灵根的 `conflicting_elements` 列出了它时，攻击者打出的伤害乘上这个数。同一个元素无论几条灵根与它相冲都只乘一次。 |

`ElementRelation` 就是"关系 + 这条关系值多少"：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elements` | `HolderOrTag<element>` 或其数组 | **必填** | 这条关系指向的元素；和别处一样，单个 id 与数组、条目与 `#` 标签都接受。 |
| `multiplier` | Double | **必填** | 这条关系的伤害倍率，必须为有限且非负的数值；不满足会被加载期拒绝（整份表加载失败、服务器不启动，而不是运行期夹取）。 |

两条关系由**统一伤害管线**（`DamageCalculationService`）读取，方向不同：

- **第一层（出力）在攻击方结算。** 攻击者灵根的元素若在它的 `overcomes` 里列到了目标灵根的元素，这次伤害就乘以那条 `multiplier`——"我克它，我打得更疼"。
- **第二层（减免）在受击方结算。** 受击者灵根的元素若在它的 `adapted_to` 里列到了攻击元素，受到的伤害就乘以那条 `multiplier`。写 `< 1` 是减免，写 `> 1` 是更脆，写 `1.0` 表示"关系成立但不改数值"（`mxt:element_overcomes` 条件只问关系成不成立，正好用得上这种写法）。

一个实体有多条灵根时，所有成立的关系**相乘**：两条灵根都克制目标就吃两次加成，`multiplier` 写多少就是多少。元素关系允许循环（金克木、木克土……甚至互克）；不要依赖标签值顺序。灵根通过 `elements` 字段绑定一个或多个元素：关系按**元素**逐条成立——双灵根的身体，两个元素各自与目标结算（因此一条持有火与水的灵根，两个方向的关系都会参与）。

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

一次攻击**是什么元素**，由它的伤害类型反查得到，而不是由攻击者灵根推出来。元素通过 `damage_types` 认领伤害类型（裸条目、`#` 标签，或带自己附着量的对象都行），认出后的优先级固定为：

| 情况 | 这一击的元素 |
| --- | --- |
| `damage_type` 被一个或多个元素认领 | 全部认领者（与灵根一致：多条成立时**相乘**） |
| 没有被任何元素认领、有攻击者 | 攻击者灵根的启用元素（= 没有 `damage_types` 时的老行为） |
| 没有被任何元素认领、也没有攻击者 | 空 = 无关系 |

这条通道是第二层减免的**唯一**依据：受击方那一层只拿得到一个 `DamageSource`，所以元素必须能从伤害类型读回来。好处是**不碰原版代码就能让环境伤害有属性**——把 `minecraft:lava`、`minecraft:in_fire`、`minecraft:lightning_bolt` 认领给某个元素，泡岩浆、被雷劈、被爆炸波及都会照那个元素结算；`mxt:explode` 用的是 `minecraft:explosion`，认领它就能让爆炸带属性。多个元素认领同一个伤害类型是合法的（相乘），但会在第一次真的用上时打一条提示。

被列进 `mxt:no_bonus` 标签的伤害类型是例外：那一击不读元素，认领它也不会生效（默认只收虚空伤害 `minecraft:out_of_world`，见[伤害系统](/technical/damage)）。

上面说的是**一次攻击**是什么元素。**物品**是什么元素是另一条口径：`weapon_binding` / `item_binding` / `artifact` 的 `element` 字段（可取并集），一个都没声明时才回落到物品携带的灵气的 `aura_type`；物品条件 `mxt:item_element` 读的就是它，完整说明见 [weapon_binding](./weapon_binding.md)。

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

### 认领的类型就是分组：给每个类型自己的附着量

`damage_types` 的每个条目还可以写成对象，给这一类打击单独的 `damage_attachment`——同一个元素下想让"泡岩浆比挨火球攒得慢"，**不必把元素拆成两个**：

```json
// data/example/mxt/element/fire.json
{
  "damage_types": [
    "minecraft:in_fire",
    "minecraft:on_fire",
    "#example:fire_like",
    { "damage_type": "minecraft:lava", "damage_attachment": 2.0 },
    { "damage_type": "minecraft:campfire", "damage_attachment": 0 }
  ],
  "damage_attachment": 4.0
}
```

- 裸字符串与 `#标签` 是"用元素自己的数"：上面 `in_fire` / `on_fire` / 标签展开出的类型都留 `4.0`。
- 对象里的 `damage_attachment` 可以省略（等于元素默认值），写 `0` 是"**这一组一点也不留**"的正经答案——那个类型永远不会靠攻击攒起来。
- 类型与标签在两种写法里都接受；同一个元素对同一个类型写两条时**第一条生效**。
- 附着量在**这一击被分类的那一次读取里**就和元素一起算好（管线内部的 `DamageElements.Strike` 同时带元素、来源与附着量），所以它和"这一击是什么元素"不可能对不上。

### 元素在身上的积累：`attachment_decay` / `damage_attachment` 与 `element_reaction`

两个数字描述"元素怎么攒在身上"：`damage_attachment` 是一次由该元素构成的攻击在目标身上留下的量（默认 `0`，即默认不积累），`attachment_decay` 是每 tick 自然掉多少（默认 `0`，即默认不掉）。攒够之后发生什么由 [element_reaction](/datapack/json/element_reaction) 定义，所以"元素是关系"与"元素会累积"是两件可以分别开启的事。用实体行为 `mxt:attach_element` 可以直接加/减一个元素的附着，实体条件 `mxt:element_attachment` 可以读当前量。**`damage_attachment` 是默认值**：某个类型想留别的量，就把它写成对象并给自己的数（见上一节「认领的类型就是分组」）。

**只有声明过的元素会累积。** 一次攻击的元素有两个来源：它的伤害类型被某个元素**认领**（写 `element` / `damage_type` 的攻击、岩浆、爆炸、别的模组的火球都算），或者没人认领时**回落到攻击者的灵根**。两者都参与克制与适应，但**只有前者会留下 `damage_attachment`**——身体里的火只决定这一击打多疼，不会点燃别人。想让一次攻击能点燃、能触发反应，就让它声明自己的元素。（这让"灵根属性"与"武器属性"分得开：灵根管伤害，武器管附着。）

**留多少还看受击方带了什么。** 附着量随后乘上受击者**携带**物品（双手与 Curios 槽）声明的 `attachment_multiplier`（相乘）：`0.5` 只留一半、`0` 一点也不留，就是「法宝抵消部分元素反应」的做法——压的是攒的速度，反应来得更晚或不发生；反应自身的效果不归它管。见 [artifact](./artifact.md) / [weapon_binding](./weapon_binding.md)。

### 与持有者灵根相冲：`conflict_multiplier`

`conflict_multiplier`（默认 `1.0`）是"**我被人硬用**时值多少"：拿着这件元素的持有者，如果在效灵根的 `conflicting_elements` 里列出了它，那么他打出的伤害会乘上这个数。数字住在这个**被握着的元素**上而不是灵根上，同一个元素无论几条灵根与它相冲都只乘一次，而且**不要求这一击用的就是那个元素**——跟自己的武器较劲，打什么属性都弱。物品那一侧的元素按 [weapon_binding](./weapon_binding.md) 的「物品的元素」读取（主手物品）。

