---
title: item_quality（品质）
---

# item_quality（品质） {#item_quality}

文件位置：`data/<namespace>/mxt/item_quality/<path>.json`

**用途**：共享品质和品质条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `display_name` | Text Component | **必填** | 品质名称或翻译键。 |
| `value_multiplier` | `Modifier` | 无 | 货币价值修正；对象包含 `description` 和 `modifier`。配置后自动加入物品品质简介。结算时按 `modifier` 乘在该物品的货币单位面值上并四舍五入到整数，因此**看得到的就是付得出的**（Tooltip 显示的也是结算值）。`modifier` 缺失、非有限或 ≤0 时按 1 处理；乘积非有限/<1/超出 `long` 时退回声明面值，不会凭空造出一个数据包没写过的数。 |
| `forging_modifier` | `Modifier` | 无 | 锻造修正；对象包含 `description` 和 `modifier`。配置后自动加入物品品质简介。结算时用 `有效额外步数 = 实际额外步数 ÷ modifier` 去查品质档，也就是 >1 表示同样的手法能拿到更好的档；取值来自这场会话**锁定的材料**（多种材料取其中最低的一档品质，没有品质解析结果的材料跳过），`modifier` 为 1 时行为完全不变。 |
| `alchemy_modifier` | `Modifier` | 无 | 炼丹修正；对象包含 `description` 和 `modifier`。配置后自动加入物品品质简介。结算时用 `时长 = 声明时长 ÷ modifier` 决定开炉时长（>1 炼得更快），取值来自**开炉那一刻**丹炉里的原料栈（同样取最低品质、跳过无品质者），结果写进会话快照。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 使用该品质的条件。 |

三个修正字段均为可选对象；对象的 `description` 会自动追加到物品品质 Tooltip，`modifier` 是实际运行时使用的数值提供器：

```json
{
  "display_name": "quality.example.refined",
  "value_multiplier": {
    "description": "quality.example.refined.value",
    "modifier": 1.25
  },
  "forging_modifier": {
    "description": "quality.example.refined.forging",
    "modifier": "1 + level * 0.01"
  }
}
```

品质顺序和分组由原版标签决定：

```text
data/mxt/tags/mxt/item_quality/tooltip_order.json
data/<namespace>/tags/mxt/item_quality/group/<name>.json
```

`tooltip_order` 的 `values` 顺序由 `ItemQualityService.ordered` 保留；分组标签可重叠。绑定表中的 `quality_group` 必须是 `#` 标签，显式品质组件或锻造品质必须属于该组。

