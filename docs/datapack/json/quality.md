---
title: quality（品质）
aside: false
---

# quality（品质） {#quality}

文件位置：`data/<namespace>/mxt/quality/<path>.json`

**用途**：共享品质和品质条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<命名空间>.<路径>` | 品质名称。省略时用左列的默认键。 |
| `description` | Text Component | `quality.mxt.<命名空间>.<路径>.description` | 品质描述，画在品质名下面。省略时用左列的默认键。 |
| `color` | Color | 无 | 品质颜色，选填。写了就用它给**画品质名的地方**上色：物品提示框的物品名那一行与「品质：<名>」那一行、`/picker` 里品质分类的条目名、锻造台蓝图 tooltip 的档位表。不写则一个字都不改（**不是"默认白色"**，所以没写颜色的品质照旧显示原版稀有度色）。6 位十六进制 `"#RRGGBB"` 或整数。物品名那一行还可以由玩家自己关掉：客户端配置「提示框 → 物品名跟随品质」（默认开），其余三处不受它影响。 |
| `value_multiplier` | `Modifier` | `1` | 货币价值修正。结算时按 `modifier` 乘在该物品的货币单位面值上并四舍五入到整数，因此**看得到的就是付得出的**（Tooltip 显示的也是结算值）。`modifier` 缺失、非有限或 ≤0 时按 1 处理；乘积非有限/<1/超出 `long` 时退回声明面值，不会凭空造出一个数据包没写过的数。 |
| `forging_modifier` | `Modifier` | `1` | 锻造修正。结算时用 `有效额外步数 = 实际额外步数 ÷ modifier` 去查品质档，也就是 >1 表示同样的手法能拿到更好的档；取值来自这场会话**锁定的材料**（多种材料取其中最低的一档品质，没有品质解析结果的材料跳过），`modifier` 为 1 时行为完全不变。 |
| `alchemy_modifier` | `Modifier` | `1` | 炼丹修正。结算时用 `时长 = 声明时长 ÷ modifier` 决定开炉时长（>1 炼得更快），取值来自**开炉那一刻**丹炉里的原料栈（同样取最低品质、跳过无品质者），结果写进会话快照。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 使用该品质的条件。 |

`name` 与 `description` 都可以省略：省略就是上面那条按 id 生成的键，写了就用你给的文本（字符串当翻译键、对象当完整组件）。

`color` 的规矩与这两个文本字段不同：**写了就以它为准**（连 `name` 组件里自带的颜色也会被它盖过），**不写就一个字都不改**——它不是"默认白色"，所以没写颜色的品质照旧显示原版稀有度色。描述那一行始终是灰的，不受它影响。`Modifier` 是三个可选对象，每个对象里的 `description` 与 `modifier` 也都可以省略——`modifier` 省略等于 `1`，`description` 省略**就不画那一行**（修正照样生效），它的文案完全由数据包自己指定，没有自动生成：

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

品质的**顺序、默认档、成员资格与升级路径都由链条决定**：一张 [quality_chain](/datapack/json/quality_chain) 把若干品质按低→高排成一条链，绑定表用 `quality_chain` 引用它。物品解析出的档必须在链上，否则不能使用；没写覆盖组件时落到哪一档，也由链的 `default` 回答。

旧的原版标签口径已经退休：`group/<name>` 标签不再被读取（`ItemQualityTags.group`、`groups`、`inGroup`、`groupDefault` 一并删除）。`tooltip_order` 标签与 `ItemQualityService.ordered()` 还留在代码里，但**没有任何消费者**——界面目前没有任何按品质顺序排序的地方，所以文档不把它写成"已接入排序"。

`color` 只影响**画品质名的地方**，不参与解析：解析只回答"是哪一档"，完整顺序见[品质链条](/datapack/json/quality_chain#resolution)。

## 名称与翻译

类别就是注册表自己的 path：`example:refined` 查 `quality.mxt.example.refined`，描述再加 `.description`（**注册表命名空间仍是 `mxt`**）。在自带 `name` / `description` 的注册表里，它是唯一**已经**把 `description` 画出来的一个（品质名下面那一行）；其余那些目前只存储与读取这两个字段，还没有地方绘制它们。JSON 里没有 `translation_key` 字段；路径里的 `/` 和其它注册表一样原样保留在键中。

