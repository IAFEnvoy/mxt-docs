---
title: spirit_root（灵根）
description: 定义一条灵根：绑定的元素与占比、修炼倍率、元素亲和倍率与互斥元素。
aside: false
---

# spirit_root（灵根） {#spirit_root}

文件位置：`data/<namespace>/mxt/spirit_root/<path>.json`

一条灵根把身体与一个或多个元素绑起来。它给修炼倍率、给元素亲和倍率、给能力，也声明哪些元素不能和它同体共存。真灵根 / 伪灵根 / 废灵根这类玩法就是"写几个元素 + 写占比"。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `spirit_root.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `spirit_root.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `elements` | 元素与权重数组 | **必填且非空** | 灵根绑定的元素，可以写多个。 |
| `cultivation_multiplier` | `NumberProvider` | `1` | 修炼倍率。 |
| `element_ability_modifier` | `NumberProvider` | `1` | 元素亲和技能倍率。 |
| `quality` | 品质 id | 无 | 可选。这条灵根自己的品阶：携带这份定义的灵根石读到的就是它，信息面板与 `/mxt spirit_root list` 写在灵根名旁边的也是它。 |
| `granted_abilities` | 能力 id 或 `#标签` 的数组 | `[]` | 授予的能力。 |
| `conflicting_elements` | 元素 id 或 `#标签` 的数组 | `[]` | 与哪些元素**不能同体共存**。 |

`elements` 的每一项可以只写元素 id（= 占满这一条灵根），也可以写 `{"element": "…", "weight": 0.7}`。`weight` 是占比而不是倍率：读取时按总和归一化，所以 `[1, 1]` 与 `[0.5, 0.5]` 等价，单元素灵根写多少都一样。`weight` 默认 `1`、必须有限且为正。空数组、同一元素写两次是加载错误。

`cultivation_multiplier` 与 `element_ability_modifier` 写成数字时都在加载期校验有限非负。

`element_ability_modifier` 的量法：施放 `element_affinity` 含这条灵根**任一**元素的技能时，它是[伤害结算](/technical/damage)第一层的因子（**一条灵根只贡献一次**，命中几个元素都算一次；多条匹配灵根按 `element_affinity_mode` 取平均或取最好），同时也能在公式里读到 `element_modifier`。它与元素关系是两条独立的路：元素关系（`overcomes` / `adapted_to`）说的是"谁克谁"，双方灵根都参与；这个倍率说的是"这个身体施放它亲和的那个元素时值多少"，只由施法方与**这一次施放**决定。因此同一门火法，火灵根 1.1 与 1.3 打出的数不一样，但对手身上那半边只由对手的元素决定。

`quality` 引用 `mxt:quality` 里的一档，可以省略。信息面板里灵根那一行的 tooltip 读「定义名 · 品质名」，没有 `quality` 时这一段整个不写（不会显示 `-`）；`/mxt spirit_root list` 则在没有档位时显示 `-`。堆上写了自己的 `mxt:quality` 组件时以组件为准；这份定义没写 `quality` 时这一层不作答，继续落到数据表 [default_quality](./default_quality.md)。

灵根分组、兼容与筛选使用原版标签（`data/<namespace>/tags/mxt/spirit_root/<name>.json`）。实体条件与战利品条件的 `spirit_root` 字段都接受条目、标签或它们的数组，所以"任意火属灵根"写一条标签即可。

`conflicting_elements` 与元素关系是两件事：相克的两个元素照样可以同时持有，要不要禁止由这条字段说了算；再要授予一条元素被列中的灵根（或反过来）都会被拒绝，**两边任一元素命中即冲突**；关闭的灵根不参与这条判定。它还会在伤害结算里被读一次：攻击者主手里物品的元素被某条生效灵根列为相冲时，那个元素的 `conflict_multiplier` 会乘上攻击者打出的一切伤害——按手里的元素各算一次，多条灵根同时相冲也不会乘两次，见 [element](./element.md) 的「与持有者灵根相冲」。

**一条灵根绑多个元素时的读法**（写内容最容易在这里猜错，所以逐条写明）：①**持有哪些元素**取并集、**与权重无关**——`mxt:has_element`、战利品条件、元素关系与"这一击是什么元素"都看这一份；②**修炼亲和**按权重取**加权平均**（`1 + Σ(权重 × 该元素浓度) / Σ权重`），占比越大那门灵气越管用；③**元素冲突惩罚**同样按权重取**加权平均**再乘 `aura_zone.element_conflict_penalty`，所以主修火的双灵根在水地里比主修水的挨罚更狠、但都不如纯火灵根；④**能力加成**只算一次且**与权重无关**（见上表）；⑤**互斥**按元素集合双向判定、**与权重无关**。`aura_zone.element_fit_bonus` 只看"这里有没有我任何一门灵气"，也不看权重。

```json
{
  "elements": [
    { "element": "example:fire", "weight": 0.7 },
    { "element": "example:water", "weight": 0.3 }
  ],
  "cultivation_multiplier": 1.25
}
```

## 持有与开关 {#holding}

授予与移除都用实体行为：`mxt:grant_spirit_root`、`mxt:remove_spirit_root`（体质那一侧是 `mxt:grant_physique`、`mxt:remove_physique`）。

本体也提供一件**灵根物品** `mxt:spirit_root`：堆上的组件 `mxt:spirit_root` 写明它授予哪一条灵根，右键即授予——走的是和行为、命令同一道判定，所以"已持有"与"元素互斥"照旧被拒。授予成功时消耗 1 个，**创造模式不消耗**；被拒时物品原样留在手上并说明原因，没有组件的空物品只提示它没写明是哪一种灵根。取这件物品用 `/give @s mxt:spirit_root[mxt:spirit_root="example:fire_root"]`，或者用 `/picker mxt:spirit_root`——那里每个灵根定义给一行**已经带好组件**的它。这是物品的使用路径，与下面那个"开 / 关"是两回事。

每条已持有的灵根和体质都可以被单独**关闭**而不失去：关闭后它的元素、修炼倍率、授予的能力、被动属性、伤害倍率与它声明的 `conflicting_elements` 全部不生效，但它仍然"持有"（`mxt:has_spirit_root` / `mxt:has_physique` 照旧为真，也能正常移除），`spirit_identity` 附件里的 `disabled_spirit_roots` / `disabled_physiques` 就是这份状态，随存档与同步一起走。

这个模块**没有玩家入口**（没有按键或界面）：操作用脚本的 `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`，或管理员命令 `/mxt spirit_root enable|disable`、`/mxt physique enable|disable`，接入方式照样留给内容方或整合包。它与"从数据包里拿掉这条定义"是两件事：开关只管被关的那一条、而且它仍然被持有；拿掉定义则是这条定义整个不在了（写 `neoforge:conditions`，见[停用一条定义](../overview.md#停用一条定义)）。
