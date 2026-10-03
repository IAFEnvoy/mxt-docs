---
title: physique（体质）
description: 定义一份独立于元素的体质：原版属性、授予的能力与两个伤害倍率。
aside: false
---

# physique（体质） {#physique}

文件位置：`data/<namespace>/mxt/physique/<path>.json`

一条体质给的是独立于元素的加成：原版属性、能力、两个伤害倍率。它给谁、什么时候给由 `holder_condition` 决定，所以"先有火灵根才有的火系体质"这类先决关系写在这里。体质和元素是两条不相交的路，元素那半边归[灵根](./spirit_root.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `physique.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键，写了就用写的文本。 |
| `description` | Text Component | `physique.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `attribute_modifiers` | 属性修正条目数组 | `[]` | 独立于灵根的原版属性加成。 |
| `granted_abilities` | 能力 id 或 `#标签` 的数组 | `[]` | 授予的能力。 |
| `holder_condition` | `EntityCondition` | `mxt:always` | 授予前的持有条件。 |
| `exclusive_tags` | Identifier 数组 | `[]` | 互斥标签。 |
| `rarity` | String | `common` | 稀有度标识。 |
| `allow_stacking` | Boolean | `false` | 是否允许同一体质叠加。 |
| `damage_dealt_multiplier` | `NumberProvider` | `1` | 持有者**打出**的伤害在[伤害结算](/technical/damage)第一层乘上它。 |
| `damage_taken_multiplier` | `NumberProvider` | `1` | 持有者**受到**的伤害在管线第二层乘上它。 |

`attribute_modifiers` 的条目写 `attribute`、原版 modifier 的 `id/amount/operation`；条目里填了 `value` 时，改由公式每 tick 按实体上下文重新算。

`holder_condition` 可以组合 `mxt:has_spirit_root`、`mxt:has_physique` 表达先决灵根或先决体质。

`rarity` 由信息面板与 `/mxt physique list` 显示原文，存在 `mxt.rarity.<rarity>` 时用它的翻译。

```json
// data/example/mxt/physique/innate_sword_bone.json
{
  "attribute_modifiers": [
    { "attribute": "minecraft:attack_damage", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value" }
  ],
  "granted_abilities": ["example:sword_intent"],
  "exclusive_tags": ["example:physique/skeletal"],
  "rarity": "epic",
  "damage_dealt_multiplier": "1 + 0.05 * realm_rank",
  "damage_taken_multiplier": 0.9
}
```

## 元素字段会被忽略 {#element-fields}

"体质不含元素"这条边界由上面的**字段表**划出，不是由加载期检查划出。体质只读表里列出的那些键，下面这些写进体质定义**既不报错也不生效**：

`element`、`elements`、`element_affinity`、`element_tags`、`element_ability_modifier`、`conflicting_elements`、`relations`、`overcomes`、`adapted_to`、`damage_types`、`attachment_decay`、`damage_attachment`、`aura_type`、`cultivation_multiplier`。

原因很实际：定义解码只读它被告知的键，其余一律忽略。所以一份"看着有元素、实际什么都没有"的体质会安静地跑下去：**字段名要对着上面那张表核对**，别指望加载期替你发现。写错注册表（把体质写进 `mxt/spirit_root/`，或反过来）同样不报错。

## 两个伤害倍率 {#damage-multipliers}

它们是"体质能谈战斗却不谈元素"的那条缝：数字本身与元素无关，由伤害结算的两层分别读取——第一层读加害者的 `damage_dealt_multiplier`，第二层读受击者的 `damage_taken_multiplier`。

- 倍率在**持有者自己的**公式上下文里求值，"这个身体挨多少"不取决于谁在问；`value` 公式里能读 `caster_*` 那套变量。
- `0` 是合法值（免疫、或打不动）。写成数字时加载期校验有限非负；公式算出的负数或非有限值不贡献。
- 多条生效体质**相乘**，因为每一条都是一个独立来源。
- 它们**不进公式上下文**：只有管线读，所以不存在"数据包再乘一次"的机会。这一点与 `element_modifier` 不同，后者能被手写进公式，所以那边专门提醒别重复乘。

## 持有与开关 {#holding}

授予与移除都用实体行为：`mxt:grant_physique`、`mxt:remove_physique`（灵根那一侧是 `mxt:grant_spirit_root`、`mxt:remove_spirit_root`）。持有状态用实体条件 `mxt:has_physique` 判定（灵根是 `mxt:has_spirit_root`），脚本侧是 `MxtPhysiques`（灵根是 `MxtSpiritRoots`），管理员侧是 `/mxt physique`（灵根是 `/mxt spirit_root`）。

本体也提供一件**体质物品** `mxt:physique`：堆上的组件 `mxt:physique` 写明它授予哪一项体质，右键即授予——走的是和行为、命令同一道判定，所以"已持有"（只在 `allow_stacking` 为假时）、`holder_condition` 不满足与互斥标签冲突照旧被拒，属性、能力与两个伤害倍率当场重算。授予成功时消耗 1 个，**创造模式不消耗**；被拒时物品原样留在手上并说明原因，没有组件的空物品只提示它没写明是哪一种体质。取这件物品用 `/give @s mxt:physique[mxt:physique="example:sword_bone"]`，或者用 `/picker mxt:physique`——那里每个体质定义给一行**已经带好组件**的它。这是物品的使用路径，与下面那个"开 / 关"是两回事。

已持有的体质可以被**关闭**而不失去：关闭后它的属性修正、授予能力与两个伤害倍率全部不生效，但它仍然"持有"（`mxt:has_physique` 照旧为真，也能正常移除）。这份状态存在 `spirit_identity` 附件里，随存档与同步一起走。

**开 / 关**这一半**没有玩家入口**（没有按键或界面）：操作用脚本的 `MxtPhysiques.setEnabled`，或管理员命令 `/mxt physique enable|disable`。它与"从数据包里拿掉这条定义"是两件事：开关只管被关的那一条、而且它仍然被持有；拿掉定义则是这条定义整个不在了（写 `neoforge:conditions`，见[停用一条定义](../overview.md#停用一条定义)）。
