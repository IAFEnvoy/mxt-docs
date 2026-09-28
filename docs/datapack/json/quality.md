---
title: quality（品质）
description: 定义一档品质的名字、颜色与三个修正，以及它在品质链上的下一档与升级代价。
aside: false
---

# quality（品质） {#quality}

文件位置：`data/<namespace>/mxt/quality/<path>.json`

一个 `quality` 是一档品质。它叫什么是给界面看的，`value_multiplier` / `forging_modifier` / `alchemy_modifier` 是给经济、锻造与炼丹结算用的。它同时是品质链的一个环节：`next` 指向它上面那一档，`quality` 给这条链起个名。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<命名空间>.<路径>` | 品质名称。 |
| `description` | Text Component | `quality.mxt.<命名空间>.<路径>.description` | 品质描述，画在品质名下面。 |
| `color` | Color | 无 | 品质颜色，6 位十六进制 `"#RRGGBB"` 或整数。 |
| `value_multiplier` | `Modifier` | `1` | 货币价值修正。 |
| `forging_modifier` | `Modifier` | `1` | 锻造修正。 |
| `alchemy_modifier` | `Modifier` | `1` | 炼丹修正。 |
| `condition` | `EntityCondition` | `mxt:always` | 使用该品质的条件。 |
| `next` | `quality` id | 无 | 链上的下一档，最高一档省略。 |
| `upgrade_costs` | `Cost` 数组 | `[]` | 顺着 `next` 往上升一档要付的代价，与技能消耗走同一套事务：`plan` → `commit` **整组原子**，付不出就一步都不动、也不写档。 |
| `upgrade_condition` | `EntityCondition` | `mxt:always` | 这一步能不能走，在扣费之前判。 |
| `quality` | Identifier | 无 | 这条链的名字。**一条链只写一次就够**：写在哪一档上，它和它下面的每一档都属于这条链。 |

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

## 品质链 {#ladder}

品质的高低不写在别处：每一档用 `next` 指向上一档，顺序、入口与链身份由运行时沿这些指针走一遍得出。链的名字只需要在**一档**上写一次：

```json
// data/example/mxt/quality/common.json
{
  "next": "example:refined",
  "upgrade_costs": [{ "id": "example:qi", "amount": 20 }]
}

// data/example/mxt/quality/refined.json
{
  "quality": "example:pill",
  "next": "example:flawless",
  "upgrade_costs": [{ "id": "example:qi", "amount": 60 }]
}

// data/example/mxt/quality/flawless.json
{}
```

- 这三档属于同一条链 `example:pill`：`refined` 写了链名，`common` 与 `flawless` 会跟着它。想给链换名字就改那一处。
- **入口档自动是「没有任何一档指向它」的那一档**（这里就是 `common`），它同时就是这条链的默认档。链条不需要写 `default`，最低一档也就不需要写 `next`。
- **想把某一档当成顶端，就不写 `next`。** 写了 `next` 却没写 `upgrade_costs` 时那一步仍然存在，代价是空数组。
- **一条链是一条直线。** 一档只写一个 `next`，所以每档最多一个「下一档」；**两档把同一个 `next` 写成自己**（分叉）会被报出来，点名那一档跟着哪两档——分叉之后「这一档下面是谁」本来就没有唯一答案，所以它归先走到的那条线。上一档与下一档都是从走出来的顺序里查表，两个方向对称。
- **一条链上一个名字。** 一档同时收到两个不同的链名（它自己写一个、上方的档又写了另一个）会被报出来；成环、指向不存在的条目、或整条链接不到入口同样会报出来（`/reload` 会重跑一遍）。
- **不属于任何链的档也能用**：孤零零一档既没有 `next` 也没有 `quality` 时它自成一体，能显示、能被 `mxt:quality` 组件与三个修正读到，只是没有顺序、不能升级。

::: tip 两个同名的东西
`quality` 是**这一档上的字段**（这条链的名字，一个字符串），`mxt:quality` 是**物品上的组件**（装整份品质对象）。绑定表的 `quality_chain` 写的也是这个字符串。
:::

## 品质是哪一档 {#resolution}

一条物品堆的品质按固定顺序取**第一个能拿到的**：

1. 堆上的 `mxt:quality` **组件**（整份品质对象）——[`/quality set`](/player-guide/commands/quality) 与 [MxtQuality](/kubejs/api/quality) 写的就是它，`upgrade` 成功后也写它；
2. 堆上的锻造结果 `mxt:forging_result` 记着的那一档；
3. **定义默认档**：法器 [artifact](./artifact.md) 的 `quality`、功法 [technique](./technique.md) 的 `quality`，以及炉型 [alchemy_furnace](./alchemy_furnace.md) 的 `quality`；
4. 这一栈所读链条的**入口档**；
5. 匹配到的灵植 [spirit_herb](./spirit_herb.md) 声明的 `quality`。

第 4 格问的是「这一栈的档位坐在哪条链上」，而链只写在档位自己身上：定义给的默认档属于哪条链，物品就落到那条链的入口档；那一档不在任何链上时这一格没有答案。没有绑定表需要声明链，也没有第二处可以声明它。

想按档位放行用物品条件 `mxt:item_quality`（**这是条件，组件叫 `mxt:quality`**）：`quality` 接受条目、`#标签` 或数组（至少一项，空表在加载期被拒），读的就是上面这五格解析出来的结果；解析不出任何一档的物品答否，而不是回落到最低档。

原版标签不参与品质解析：`group/<name>` 标签不读，`tooltip_order` 标签也没人读，界面没有任何按品质顺序排序的地方，所以它不是一条排序输入。`color` 只影响画品质名的地方，不参与解析。

## 名称与翻译 {#translation}

类别就是注册表自己的 path：`example:refined` 查 `quality.mxt.example.refined`，描述再加 `.description`（**注册表命名空间仍是 `mxt`**）。自带 `name` / `description` 的注册表里，品质是唯一会把 `description` 画出来的一张（画在品质名下面）；其余那些的 `description` 只被存储与读取，没有界面画它。JSON 里没有 `translation_key` 字段；路径里的 `/` 和其它注册表一样原样保留在键中。
