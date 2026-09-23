---
title: item_binding（物品绑定）
aside: false
---

# item_binding（物品绑定） {#item_binding}

文件位置：`data/<namespace>/mxt/item_binding/<path>.json`

**用途**：现有物品到行为数组的绑定。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 物品 ID、标签或混合数组。 |
| `actions` | `List<EntityAction>` | `[]` | 食用完成或绑定事件执行的行为数组。 |
| `quality_group` | `Tag<item_quality>` | 无 | 物品允许使用的品质组。 |
| `conditions` | `EntityCondition[]` | `[]` | 绑定使用条件；每项可以是内联条件，或带翻译键 `description` 的 `{condition, description}` 对象。带描述的条件会在 Tooltip 中以绿色 `✓` 或红色 `✗` 标记结果。 |
| `element` | `HolderOrTag<element>[]` | `[]` | 这件物品**是什么元素**：条目是一个元素、`#` 标签是一组元素。这是「物品的元素」的第一顺位来源——定义声明优先，一个都没声明时才回落到物品携带的灵气的 `aura_type`；完整口径见 [weapon_binding](./weapon_binding.md)。 |
| `attachment_multiplier` | Double | `1.0` | 这件物品**作为护身物**值多少：携带（双手与 Curios 槽）期间，打在携带者身上的打击留下的元素附着乘上它——`0.5` 只留一半、`0` 一点也不留。多件携带物**相乘**，不写就没有影响。 |

绑定表只匹配现有物品，不负责创建物品；**功法手册不在其列**——它是物品堆上的 `mxt:technique` 组件，见 [`technique_binding`](./technique_binding.md)。`weapon_binding`、`pill_binding` 的字段与它互不混用；武器拥有伤害、攻击速度、属性和攻击/使用/Tick 行为。

```json
{
  "items": ["minecraft:iron_sword", "#minecraft:swords"],
  "actions": [{"type": "mxt:grant_spirit_root", "spirit_root": "mxt:fire_root"}],
  "conditions": [
    {"type": "mxt:always_true"},
    {
      "condition": {"type": "mxt:realm", "realm": "example:foundation"},
      "description": "condition.example.foundation_required"
    }
  ]
}
```

绑定表的 `conditions` 中可以直接填写 `EntityCondition`，也可以填写带翻译键 `description` 的对象。所有条件都必须满足；带描述的条件会在物品 Tooltip 中显示绿色 `✓` 或红色 `✗`，描述文字保持普通样式。

灵根和体质的持有判定与增删都是数据包原语：`mxt:has_spirit_root` / `mxt:has_physique` 用于条件，`mxt:grant_spirit_root` / `mxt:remove_spirit_root` / `mxt:grant_physique` / `mxt:remove_physique` 用于行为。例如体质丹只对已有火灵根的玩家生效，并把先决灵根换成水灵根：

```json
{
  "items": "kubejs:root_switching_pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_spirit_root", "spirit_root": "mxt:fire_root"},
      "description": "condition.example.requires_fire_root"
    }
  ],
  "actions": [
    {"type": "mxt:remove_spirit_root", "spirit_root": "mxt:fire_root"},
    {"type": "mxt:grant_spirit_root", "spirit_root": "mxt:water_root"}
  ]
}
```

`item_quality` 定义品质内容，品质组使用原版标签组织顺序，物品通过 `quality_group` 引用品质序列。`currency` 为物品定义货币价值，`unavailable_when` 是包含 `condition` 和 `reason` 的 ItemCondition 数组。

