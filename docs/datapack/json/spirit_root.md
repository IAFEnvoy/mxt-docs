---
title: spirit_root（灵根）
aside: false
---

# spirit_root（灵根） {#spirit_root}

文件位置：`data/<namespace>/mxt/spirit_root/<path>.json`

**用途**：与一个或多个元素绑定的灵根。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `spirit_root.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `spirit_root.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `elements` | `ElementWeight[]` | **必填且非空** | 灵根绑定的元素，**可以写多个**（真灵根 / 伪灵根 / 废灵根就是"写几个 + 写占比"）。每一项可以只写条目 id（= 占满这一条灵根），也可以写 `{"element": "…", "weight": 0.7}`。**`weight` 是占比而不是倍率**：读取时按总和归一化，所以 `[1, 1]` 与 `[0.5, 0.5]` 等价，单元素灵根写多少都一样。`weight` 默认 `1`、必须有限且为正。空数组、同一元素写两次是加载错误。 |
| `cultivation_multiplier` | `NumberProvider` | `1` | 修炼倍率。写成数字时加载期校验有限非负。 |
| `element_ability_modifier` | `NumberProvider` | `1` | 元素亲和技能倍率：施放 `element_affinity` 含这条灵根**任一**元素的技能时，它是[伤害结算](/technical/damage)第一层的因子（**一条灵根只贡献一次**，命中几个元素都算一次；多条匹配灵根按 `element_affinity_mode` 取平均或取最好），同时也能在公式里读到 `element_modifier`。写成数字时加载期校验有限非负。 |
| `rarity` | String | `common` | 稀有度标识；信息面板与 `/mxt spirit_root list` 显示原文，存在 `mxt.rarity.<rarity>` 时用它的翻译。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 授予的能力。 |
| `conflicting_elements` | `HolderOrTag<element>[]` | `[]` | 与哪些元素**不能同体共存**：再要授予一条元素被列中的灵根（或反过来）会被拒绝——**两边任一元素命中即冲突**；被 `mxt:disabled` 停用的元素不参与这条判定。 |

灵根分组、兼容与筛选使用原版标签（`data/<namespace>/tags/mxt/spirit_root/<name>.json`），不再提供重复的自定义分组字段；实体条件与战利品条件的 `spirit_root` 字段都接受条目、标签或它们的数组，所以"任意火属灵根"写一条标签即可。`conflicting_elements` 与元素关系是两件事：相克的两个元素照样可以同时持有，要不要禁止由这条字段说了算；关闭的灵根也不再参与这条判定，被停用的元素则连"算不算元素"都不成立——两侧元素只要有一侧不在场，这条规则就不成立。**它还有第二个消费者**：攻击者手里物品的元素被某条在效灵根列为相冲时，那个元素的 `conflict_multiplier` 会乘上攻击者打出的一切伤害，见 [element](./element.md) 的「与持有者灵根相冲」。

`element_ability_modifier` 与元素关系是两条独立的路：元素关系（`overcomes` / `adapted_to`）说的是"谁克谁"，双方灵根都参与；这个倍率说的是"这个身体施放它亲和的那个元素时值多少"，只由施法方与**这一次施放**决定。因此同一门火法，火灵根 1.1 与 1.3 打出的数不一样，但对手身上那半边只由对手的元素决定。

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

**灵根与体质的开关。** 每条已持有的灵根和体质都可以被单独**关闭**而不失去：关闭后它的元素、修炼倍率、授予的能力、被动属性、伤害倍率与它声明的 `conflicting_elements` 全部不生效，但它仍然"持有"（`mxt:has_spirit_root` / `mxt:has_physique` 照旧为真，也能正常移除），`spirit_identity` 附件里的 `disabled_spirit_roots` / `disabled_physiques` 就是这份状态，随存档与同步一起走。这个模块**没有玩家入口**（没有按键或界面）：操作用脚本的 `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`，或管理员命令 `/mxt spirit_root enable|disable`、`/mxt physique enable|disable`，接入方式照样留给内容方或整合包。这与数据包标签 `mxt:disabled`（整个定义被封）不同：开关只管被关的那一条，而且它仍然被持有。

