---
title: quality（品质）
description: 定义一档品质的名字、颜色，以及它的价值、锻造与炼丹修正。
aside: false
---

# quality（品质） {#quality}

文件位置：`data/<namespace>/mxt/quality/<path>.json`

一个 `quality` 是一档品质。它叫什么是给界面看的，`value_multiplier` / `forging_modifier` / `alchemy_modifier` 是给经济、锻造与炼丹结算用的。品质的**顺序、默认档、成员资格与升级路径不在这个文件里**，全部由 [quality_chain](./quality_chain.md) 决定，所以单独一条 `quality` 只描述这一档叫什么、值多少。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<命名空间>.<路径>` | 品质名称。 |
| `description` | Text Component | `quality.mxt.<命名空间>.<路径>.description` | 品质描述，画在品质名下面。 |
| `color` | Color | 无 | 品质颜色，6 位十六进制 `"#RRGGBB"` 或整数。 |
| `value_multiplier` | `Modifier` | `1` | 货币价值修正。 |
| `forging_modifier` | `Modifier` | `1` | 锻造修正。 |
| `alchemy_modifier` | `Modifier` | `1` | 炼丹修正。 |
| `condition` | `EntityCondition` | `mxt:always` | 使用该品质的条件。 |

`name` 与 `description` 都可以省略：省略就是表格里那个按条目 id 生成的键，写了就用你给的文本（字符串当翻译键、对象当完整组件）。

`condition` 不满足时，解析到这一档的物品用不了：使用、攻击、主手武器的周期行为，以及它给的原版属性修正都会停下。

`color` 的规矩与这两个文本字段不同：**写了就以它为准**（连 `name` 组件里自带的颜色也会被它盖过），**不写就一个字都不改**。它不是「默认白色」，没写颜色的品质照旧显示原版稀有度色。上色的地方只有四处：物品提示框的物品名那一行、提示框里「品质：<名>」那一行、`/picker` 里品质分类的条目名、锻造台蓝图 tooltip 的档位表。物品名那一行还能由玩家自己关掉：客户端配置「提示框 → 物品名跟随品质」（默认开），其余三处不受它影响。品质描述那一行始终是灰的。

`Modifier` 是三个可选对象，每个对象里的 `description` 与 `modifier` 也都可以省略：`modifier` 省略等于 `1`，`description` 省略**就不画那一行**（修正照样生效）。它的文案完全由数据包自己指定，没有自动生成：

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

`value_multiplier` 结算时按 `modifier` 乘在该物品的货币单位面值上并四舍五入到整数，因此**看得到的就是付得出的**（Tooltip 显示的也是结算值）。`modifier` 缺失、非有限或 ≤0 时按 1 处理；乘积非有限、小于 1、超出 `long` 时退回声明面值，不会凭空造出一个数据包没写过的数。

`forging_modifier` 结算时用 `有效额外步数 = 实际额外步数 ÷ modifier` 去查品质档，也就是 >1 表示同样的手法能拿到更好的档。取值来自这场会话**锁定的材料**：多种材料取其中最低的一档品质，没有品质解析结果的材料跳过。`modifier` 为 1 时行为完全不变。

`alchemy_modifier` 结算时用 `时长 = 声明时长 ÷ modifier` 决定开炉时长（>1 炼得更快），取值来自**开炉那一刻**丹炉里的原料栈，同样取最低品质、跳过无品质者，结果写进会话快照。

品质的**顺序、默认档、成员资格与升级路径都由链条决定**：一张 [quality_chain](./quality_chain.md) 把若干品质按低→高排成一条链，绑定表用 `quality_chain` 引用它。物品解析出的档必须在链上，否则不能使用；没写覆盖组件时落到哪一档，也由链的 `default` 回答。解析只回答是哪一档，完整顺序见[品质是怎么解析出来的](./quality_chain.md#resolution)。

原版标签不参与品质解析：`group/<name>` 标签不读，`tooltip_order` 标签也没人读，界面没有任何按品质顺序排序的地方，所以它不是一条排序输入。`color` 只影响画品质名的地方，不参与解析。

## 名称与翻译 {#translation}

类别就是注册表自己的 path：`example:refined` 查 `quality.mxt.example.refined`，描述再加 `.description`（**注册表命名空间仍是 `mxt`**）。自带 `name` / `description` 的注册表里，品质是唯一会把 `description` 画出来的一张（画在品质名下面）；其余那些的 `description` 只被存储与读取，没有界面画它。JSON 里没有 `translation_key` 字段；路径里的 `/` 和其它注册表一样原样保留在键中。
