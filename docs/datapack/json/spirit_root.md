---
title: spirit_root（灵根）
---

# spirit_root（灵根） {#spirit_root}

文件位置：`data/<namespace>/mxt/spirit_root/<path>.json`

**用途**：与单一元素绑定的灵根。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `element` | `Holder<element>` | **必填** | 灵根所属元素。 |
| `cultivation_multiplier` | `NumberProvider` | `1` | 修炼倍率。写成数字时加载期校验有限非负。 |
| `element_ability_modifier` | `NumberProvider` | `1` | 元素亲和技能倍率：施放 `element_affinity` 含这条灵根元素的技能时，它是[伤害结算](/technical/damage)第一层的因子（多条匹配灵根按 `element_affinity_mode` 取平均或取最好），同时也能在公式里读到 `element_modifier`。写成数字时加载期校验有限非负。 |
| `rarity` | String | `common` | 稀有度标识；信息面板与 `/mxt identity root list` 显示原文，存在 `mxt.rarity.<rarity>` 时用它的翻译。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 授予的能力。 |
| `conflicting_elements` | `HolderOrTag<element>[]` | `[]` | 与哪些元素**不能同体共存**：再要授予一条元素被列中的灵根（或反过来）会被拒绝；被 `mxt:disabled` 停用的元素不参与这条判定。 |

灵根分组、兼容与筛选使用原版标签（`data/<namespace>/tags/mxt/spirit_root/<name>.json`），不再提供重复的自定义分组字段；实体条件与战利品条件的 `spirit_root` 字段都接受条目、标签或它们的数组，所以"任意火属灵根"写一条标签即可。`conflicting_elements` 与元素关系是两件事：相克的两个元素照样可以同时持有，要不要禁止由这条字段说了算；关闭的灵根也不再参与这条判定，被停用的元素则连"算不算元素"都不成立——两侧元素只要有一侧不在场，这条规则就不成立。

`element_ability_modifier` 与元素关系是两条独立的路：元素关系（`overcomes` / `adapted_to`）说的是"谁克谁"，双方灵根都参与；这个倍率说的是"这个身体施放它亲和的那个元素时值多少"，只由施法方与**这一次施放**决定。因此同一门火法，火灵根 1.1 与 1.3 打出的数不一样，但对手身上那半边只由对手的元素决定。

**灵根与体质的开关。** 每条已持有的灵根和体质都可以被单独**关闭**而不失去：关闭后它的元素、修炼倍率、授予的能力、被动属性、伤害倍率与它声明的 `conflicting_elements` 全部不生效，但它仍然"持有"（`mxt:has_spirit_root` / `mxt:has_physique` 照旧为真，也能正常移除），`spirit_identity` 附件里的 `disabled_spirit_roots` / `disabled_physiques` 就是这份状态，随存档与同步一起走。这个模块**没有玩家入口**（没有按键或界面）：操作用脚本的 `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`，或管理员命令 `/mxt identity root|physique enable|disable`，接入方式照样留给内容方或整合包。这与数据包标签 `mxt:disabled`（整个定义被封）不同：开关只管被关的那一条，而且它仍然被持有。

