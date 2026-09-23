---
title: item_quality（品质）
aside: false
---

# item_quality（品质） {#item_quality}

文件位置：`data/<namespace>/mxt/item_quality/<path>.json`

**用途**：共享品质和品质条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<命名空间>.<路径>` | 品质名称。省略时用左列的默认键。 |
| `description` | Text Component | `quality.mxt.<命名空间>.<路径>.description` | 品质描述，画在品质名下面。省略时用左列的默认键。 |
| `value_multiplier` | `Modifier` | `1` | 货币价值修正。结算时按 `modifier` 乘在该物品的货币单位面值上并四舍五入到整数，因此**看得到的就是付得出的**（Tooltip 显示的也是结算值）。`modifier` 缺失、非有限或 ≤0 时按 1 处理；乘积非有限/<1/超出 `long` 时退回声明面值，不会凭空造出一个数据包没写过的数。 |
| `forging_modifier` | `Modifier` | `1` | 锻造修正。结算时用 `有效额外步数 = 实际额外步数 ÷ modifier` 去查品质档，也就是 >1 表示同样的手法能拿到更好的档；取值来自这场会话**锁定的材料**（多种材料取其中最低的一档品质，没有品质解析结果的材料跳过），`modifier` 为 1 时行为完全不变。 |
| `alchemy_modifier` | `Modifier` | `1` | 炼丹修正。结算时用 `时长 = 声明时长 ÷ modifier` 决定开炉时长（>1 炼得更快），取值来自**开炉那一刻**丹炉里的原料栈（同样取最低品质、跳过无品质者），结果写进会话快照。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 使用该品质的条件。 |

`name` 与 `description` 都可以省略：省略就是上面那条按 id 生成的键，写了就用你给的文本（字符串当翻译键、对象当完整组件）。`Modifier` 是三个可选对象，每个对象里的 `description` 与 `modifier` 也都可以省略——`modifier` 省略等于 `1`，`description` 省略**就不画那一行**（修正照样生效），它的文案完全由数据包自己指定，没有自动生成：

```json
{
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value_multiplier",
    "modifier": 1.25
  },
  "forging_modifier": {
    "modifier": "1 + level * 0.01"
  }
}
```

上面这份省略了 `name`、`description` 与 `forging_modifier.description`。

品质顺序和分组由原版标签决定：

```text
data/mxt/tags/mxt/item_quality/tooltip_order.json
data/<namespace>/tags/mxt/item_quality/group/<name>.json
```

`tooltip_order` 的 `values` 顺序由 `ItemQualityService.ordered` 保留；分组标签可重叠。绑定表中的 `quality_group` 必须是 `#` 标签，显式品质组件或锻造品质必须属于该组。

## 名称与翻译

`item_quality` 是唯一不按注册表自己的 path 取类别的注册表：类别是 `quality`，**注册表命名空间仍是 `mxt`**，所以 `example:refined` 查 `quality.mxt.example.refined`，描述再加 `.description`。同类中它也是唯一**已经**把 `description` 画出来的注册表（品质名下面那一行）；其余自带 `name` / `description` 的注册表目前只存储与读取这两个字段，还没有地方绘制它们。JSON 里没有 `translation_key` 字段；路径里的 `/` 和其它注册表一样原样保留在键中。

