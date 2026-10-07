---
title: 定义元素反应
description: "让第二种元素认领伤害类型，并写一条附着攒够时触发的反应：攒多少、扣多少、什么条件下发生、跑什么行为，以及怎么在游戏里看见它。"
---

# 定义元素反应

元素有两个可以分别开启的本事。第一个是**认领伤害类型**：一次攻击「是什么元素」不看攻击者的灵根，而是拿这一击的伤害类型反查——某个元素的 `damage_types` 里列出了它，这一击就是那个元素。第二个是**附着**：被认领的打击在目标身上留下一点这个元素，攒够之后由一条 `element_reaction` 答话。

这篇教程把这两半接起来：加第二种元素、让它认领几种伤害类型，再写一条攒够就触发的反应。**元素之间的克制关系（`overcomes` / `adapted_to`）怎么改伤害属于伤害系统**，本篇只在让这份元素定义完整、可加载的地方提一句，不展开。

## 你要搭建什么

| 文件 | 注册表 | 用途 |
| --- | --- | --- |
| `data/example/mxt/element/water.json` | `element` | 第二种元素：认领两种伤害类型，并声明每次认领的打击留下多少附着、每 tick 自然掉多少。 |
| `data/example/mxt/element_reaction/steam_burst.json` | `element_reaction` | 攒够水之后触发的那一下：要求多少、扣掉多少、什么条件下才发生、跑什么行为。 |

前提是[定义灵气与境界](./define-aura-and-realms.md)已经做完：它建了 `example:qi` 这门灵气、灵气所指的那个元素（`example:common`）与那个数值。**元素反应不需要灵气**——它只认元素与附着——但示例包里是那篇先把元素建起来的。

## 第 1 步 —— 第二种元素与它认领的伤害类型

```json
// data/example/mxt/element/water.json
{
  "damage_types": ["minecraft:drown", "minecraft:freeze"],
  "attachment_decay": 0.5,
  "damage_attachment": 4.0,
  "color": "#3388ff"
}
```

| 字段 | 默认 | 它在这里的作用 |
| --- | --- | --- |
| `damage_types` | `[]` | 这个元素认领哪些伤害类型。条目可以写伤害类型 id、`#标签`，或给这一类打击单独附着量的对象。 |
| `damage_attachment` | `0` | **一次由这个元素构成的攻击在目标身上留下多少附着。** |
| `attachment_decay` | `0` | 这个元素在实体身上每 tick 自然衰减多少。 |
| `color` | `#ffffff` | 显示色，用在灵气消耗一类的文本上。 |

认出后的优先级是固定的：伤害类型被一个或多个元素认领时，这一击就是**全部认领者**（多个成立时相乘）；没有人认领、但有攻击者时，回落到攻击者灵根的启用元素；既没人认领也没有攻击者时是空，也就是没有关系。**这条通道是受击方那一层减免的唯一依据**——受击方只看得到这一击的伤害来源，所以元素必须能从伤害类型读回来。好处是**不碰原版代码就能让环境伤害有属性**：把 `minecraft:lava`、`minecraft:lightning_bolt` 认领给某个元素，泡岩浆、被雷劈就都照那个元素结算。

把 `damage_types` 的一个条目写成对象，就能给这一类打击单独的附着量：

```json
{
  "damage_types": [
    "minecraft:drown",
    {"damage_type": "minecraft:freeze", "damage_attachment": 1.0}
  ],
  "damage_attachment": 4.0
}
```

裸字符串与 `#标签` 用的是元素自己的数；对象里的 `damage_attachment` 可以省略（等于元素默认值），写 `0` 是「这一组一点也不留」的正经答案。这样「泡在冰水里攒得比溺水慢」不必把元素拆成两个。

**只有被认领的那条路会留下附着。** 一次攻击的元素有两个来源：伤害类型被某个元素认领，或者没人认领时回落到攻击者的灵根。两者都参与克制与适应，但**只有前者会留下 `damage_attachment`**——身体里的水只决定这一击打多疼，不会把别人泡湿。想让一次攻击能攒附着、能触发反应，就让它声明自己的元素。

留多少还看受击方带了什么：附着量随后乘上受击者**携带的法器**声明的 `attachment_multiplier`（`0.5` 只留一半、`0` 一点也不留）。

被列进 `mxt:no_bonus` 标签的伤害类型是例外：那一击不读元素，认领它也不会生效。

要让这份定义看起来完整，可以再加一条关系，但**那属于伤害系统**：

```json
"overcomes": [{"elements": ["example:common"], "multiplier": 1.5}]
```

`overcomes` 在攻击方结算、`adapted_to` 在受击方结算，每条关系自带倍率；同一份元素里把同一个目标写进两条关系是合法的（每条命中的关系都乘一次），但加载时会为此打一条警告。完整说明在 [element（元素）](../datapack/json/element.md)。

## 第 2 步 —— 附着是什么、存在哪

**附着量本身住在实体附件 `mxt:element_attachment` 里**：按元素分键、随存档与同步一起走、归零即删键。所以「攒了多少」与「攒够之后做什么」是分开的两件事——这条 `element_reaction` 定义只管后者。

| 方向 | 走哪条路 |
| --- | --- |
| 攒 | `element.damage_attachment`（被打，也就是上面那份定义），以及实体行为 `mxt:attach_element`（其它来源，比如泡在岩浆里、服丹、诅咒）。 |
| 清 | 同样用 `mxt:attach_element` 写负数，或让元素自己的 `attachment_decay` 每 tick 扣。 |

实体条件 `mxt:element_attachment` 可以只读当前量（`{min?, max}` 窗口，每一项都要通过，空表在加载期被拒绝）：

```json
{"type": "mxt:element_attachment", "elements": {"example:water": {"min": 4, "max": 100}}}
```

写空表会被拒，而不是当成恒真。这是积累系统的只读一侧：可以让效果取决于身上攒了多少水，而不需要任何反应成立。

反应**没有自己的事件回调**，玩家侧也没有任何入口——附着与反应完全由内容驱动（伤害类型认领与行为），本模组不提供命令、按键或界面去加附着或手动触发。自然衰减**不会**触发反应：衰减只会让总量变少，够不着的仍然够不着。

## 第 3 步 —— 反应条目

```json
// data/example/mxt/element_reaction/steam_burst.json
{
  "amounts": {"example:water": 8},
  "consume": {"example:water": 4},
  "condition": {"type": "mxt:exposed_to_sky"},
  "action": {
    "type": "mxt:sequence",
    "actions": [
      {"type": "mxt:damage", "amount": 4},
      {"type": "mxt:attach_element", "element": "example:common", "amount": 2}
    ]
  },
  "priority": 10
}
```

| 字段 | 默认 | 它做的事 |
| --- | --- | --- |
| `amounts` | **必填** | 每个列出的元素要攒到多少才成立。写几项就要**同时**满足几项，空表在加载期被拒绝。 |
| `consume` | 同 `amounts` | 触发时扣掉多少。省略就是扣掉与需求相同的量；写空对象 `{}` 则一点不扣。 |
| `condition` | `mxt:always` | 附加条件，用来做「下雨时才炸」「站在水里才反应」这类情境限制。 |
| `action` | 无 | 触发时对**持有者自己**执行的行为。 |
| `priority` | `0` | 越高越先尝试；同高按注册表 id 排序。 |

`amounts` 是**要求**，不是数量：一次反应就是「攒够了就答话」——元素攒够后管线按优先级找**第一条**要求与条件都成立的，执行它的 `action` 并扣掉 `consume`，然后**继续找**。所以一条反应可以引出另一条。

`consume` 有三种写法，各自的语义不一样：

| 写法 | 结果 |
| --- | --- |
| 省略 | 扣掉与 `amounts` 相同的量。 |
| `{}` | **一点不扣**：「答话但不清账」，同一个附着量可以反复触发。 |
| 只写其中几个键 | 只有写出来的这几种元素会被扣掉，其余元素的附着原样留着。 |

写的键必须出现在 `amounts` 里——写了个没要求过的元素是加载错误。上面那份写的是 `{"example:water": 4}`，于是触发一次掉 4 点，攒到 12 点时会连触发两次，第三次要重新从 0 攒到 8。

`condition` 收的是实体条件，所以「泡在岩浆里」「下雨时才炸」都写得出来。这里用的是没有字段的 `mxt:exposed_to_sky`：只有头顶能看见天空时才反应。**这一条不是装饰**——溺水攒附着时人一定在水下，浮上来才看得见天空，它把「攒够了」和「已经上岸了」两个时刻分开。

`action` 里跑的是普通实体行为，`mxt:attach_element` 可以让它去喂另一个元素——反应因此能串成链。链条有上限（一次应用最多 `8` 条），因为「消耗自己又重新施加自己」是合法写法：这个上限是**整条链**的上限而不是每层一份，反应里再次施加元素时只把量加上去、由正在跑的那条链在下一轮读到。**自然衰减不会触发反应**，所以不用担心它自己把自己喂起来。

## 第 4 步 —— 在游戏里看见它

数据包注册表在**世界加载时**读取，`/reload` 不会重新读取：改完文件要退回标题界面重新打开世界，或者重启服务器。无法解码的文件会让世界加载不了，所以世界打不开时先读日志里最后一条 Codec 错误。

```text
（重新打开世界）
/mxt registries validate          → 没有错误
/mxt registries list              → mxt:element=2, mxt:element_reaction=1
```

反应的每一步都能单独看：

1. **看附着怎么攒。** 进水里让自己溺水，或被冻伤。想立刻看到，就用 KubeJS 服务端脚本调 `MxtElements.amount(entity, 'example:water')`，或用 `MxtElements.attach(entity, 'example:water', 4)` 直接加——它走的是与打击**同一条**管线，攒够时反应照常触发。
2. **看反应触发。** 在水下攒到 8 点以上再浮出水面：`condition` 成立的那一刻被打一下（`amount` 4），同时身上多出 2 点 `example:common`。想让自己淹不死，先备好水肺或干脆用创造模式，省得分不清哪一下是反应打的。
3. **看扣了多少。** 攒到 12 点再触发：一次掉 4 点，于是连着触发两次——把 `consume` 换成 `{}` 重开世界，同一个附着量会一直答话。
4. **看优先级。** 再加一条要求相同元素、`priority` 更低的反应（比如 `priority` 写 `0`），它不会先跑：管线找的是优先级最高的那条。同高时按注册表 id 排序。
5. **看认领。** 把 `damage_types` 里的 `minecraft:drown` 删掉，重开世界再溺水：附着一点也不涨——没人认领这一击，也就没有人给这个元素记账。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 反应从不触发 | 那些伤害类型没有元素认领，附着就一直是 0：认领是记附着的前提，回落到灵根的打击不留下附着。 |
| 反应只在某一处触发 | `condition` 不成立。`mxt:always` 之外的条件都要在这一刻真的为真。 |
| 报 `Element reaction needs at least one element to be about` | `amounts` 是空表。空表在加载期被拒绝，而不是当成恒不成立。 |
| 报 `Element reaction consumes an element it never asked for` | `consume` 里写了一个没出现在 `amounts` 里的元素。 |
| 报 `Element attachment numbers must be finite and non-negative` | 元素的 `attachment_decay` 或 `damage_attachment` 不是有限非负数。 |
| 附着涨得比预期慢 | 受击方携带的法器把它乘小了（`attachment_multiplier`），或者 `damage_types` 的对象条目给了这一类打击一个更小的数。 |
| 认领了却一点也不涨 | 那个伤害类型在 `mxt:no_bonus` 里：它不参与加成结算，也不留附着。 |
| 反应连续触发到停不下来 | `consume` 写成了 `{}`，或者 `action` 又把同一个元素加了回去。后者是合法写法，整条链由 `8` 条的上限兜住。 |
| 出现 `Ignoring invalid list element` | 某个容错列表里的条目坏了被丢掉。`amounts` / `consume` 这类映射不是容错列表，坏条目会直接让定义加载失败。 |
| 改了文件却什么也没变 | 数据包注册表在世界加载时读，`/reload` 不重读。 |

## 接下来

- [element_reaction（元素反应）](../datapack/json/element_reaction.md) —— `amounts` / `consume` / `condition` / `action` / `priority` 的完整字段表，以及附着存在哪。
- [element（元素）](../datapack/json/element.md) —— 认领的伤害类型、每种打击自己的附着量、附着与衰减，以及 `overcomes` / `adapted_to` 怎么参与伤害。
- [定义灵根与体质](./define-spirit-roots-and-physiques.md) —— 让身体本身持有元素，以及持有与生效的区别。
- [伤害系统](../technical/damage.md) —— 一次攻击从发出到目标掉血的完整路径，以及元素关系在哪一层参与。
