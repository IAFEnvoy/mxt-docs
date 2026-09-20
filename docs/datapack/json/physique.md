---
title: physique（体质）
---

# physique（体质） {#physique}

文件位置：`data/<namespace>/mxt/physique/<path>.json`

**用途**：独立于元素的体质加成。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attribute_modifiers` | `List<AttributeEntry>` | `[]` | 独立于灵根的原版属性加成；填写 `value` 后每 tick 按实体上下文重新计算。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 授予的能力。 |
| `holder_condition` | `EntityCondition` | `mxt:always_true` | 授予前的持有条件；可组合 `mxt:has_spirit_root`、`mxt:has_physique` 等条件表达先决体质或灵根。 |
| `exclusive_tags` | `Identifier[]` | `[]` | 互斥标签。 |
| `rarity` | String | `common` | 稀有度标识；信息面板与 `/mxt identity physique list` 显示原文，存在 `mxt.rarity.<rarity>` 时用它的翻译。 |
| `allow_stacking` | Boolean | `false` | 是否允许同一体质叠加。 |
| `damage_dealt_multiplier` | `NumberProvider` | `1` | 持有者**打出**的伤害在管线第一层乘上它。多条生效体质相乘。 |
| `damage_taken_multiplier` | `NumberProvider` | `1` | 持有者**受到**的伤害在管线第二层乘上它。多条生效体质相乘。 |

体质不绑定元素；元素相关逻辑应写在灵根或环境配置中。

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

## 元素字段会被拒绝 {#element-fields}

"体质不含元素"是**执行**的规则而不是约定。下面这些键一旦出现在体质定义里，**整份包在加载期就会被拒绝，并且报错会指名那个字段**：

`element`、`elements`、`element_affinity`、`element_tags`、`element_ability_modifier`、`conflicting_elements`、`relations`、`overcomes`、`adapted_to`、`damage_types`、`attachment_decay`、`damage_attachment`、`aura_type`、`cultivation_multiplier`。

原因很实际：`RecordCodecBuilder` 默认会把不认识的键**悄悄丢掉**，于是一份"看着有元素、实际上什么都没有"的体质会一路跑下去，作者只看得到数值不对、看不到哪一行错了。写错注册表（想写 `spirit_root` 或 `element`）在加载期报错，是唯一能让人立刻发现的时机。

## 两个伤害倍率 {#damage-multipliers}

它们是"体质能谈战斗却不谈元素"的那条缝：数字本身与元素无关，由[伤害结算](/technical/damage)的两层分别读取——第一层读加害者的 `damage_dealt_multiplier`，第二层读受击者的 `damage_taken_multiplier`。

- 倍率在**持有者自己的**公式上下文里求值，"这个身体挨多少"不能取决于谁在问；`value` 公式里能读 `caster_*` 那套变量。
- `0` 是合法值（免疫、或打不动），写成数字时加载期校验有限非负；公式算出的负数或非有限值按"不贡献"处理（与被动属性同一类公式同一条规则）。
- 多条生效体质**相乘**，因为每一条都是一个独立来源。
- 它们**不进公式上下文**：只有管线读，所以不存在"数据包再乘一次"的机会（这一点与 `element_modifier` 不同，后者的历史用法是手写进公式，所以文档专门提醒不要重复乘）。

## 持有与开关 {#holding}

`spirit_root` 与 `physique` 的授予和移除均可用实体行为完成：`mxt:grant_spirit_root`、`mxt:remove_spirit_root`、`mxt:grant_physique`、`mxt:remove_physique`。持有状态可用实体条件 `mxt:has_spirit_root`、`mxt:has_physique` 判定，脚本侧是 `MxtSpiritRoots` 与 `MxtPhysiques`，管理员侧是 `/mxt identity`。

已持有的体质可以被**关闭**而不失去：关闭后它的属性修正、授予能力与两个伤害倍率全部不生效，但它仍然"持有"（`mxt:has_physique` 照旧为真，也能正常移除）。
