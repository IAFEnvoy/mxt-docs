---
title: pill（丹药）
aside: false
---

# pill（丹药） {#pill}

文件位置：`data/<namespace>/mxt/pill/<path>.json`

**用途**：一份丹药**是什么作用**——吃下去跑什么行为、加多少丹毒、越过阈值之后又怎么办。这张表不认领物品、不管次数也不管冷却：**哪些物品是这份丹药、能服用几次、两次之间等多久**写在那一族物品的 [pill_binding](./pill_binding.md) 上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `pill.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的键。 |
| `description` | 文本组件 | 同上加 `.description` | 描述。 |
| `quality` | 品质 id | 无 | 可选。这一份丹药的一剂起始的档位。 |
| `color` | 颜色 | `#FFFFFF` | **内置载体** `mxt:pill` 的图标颜色，写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受，一律按不透明处理）；白色就是不染色。只染本体这一件物品——被绑定认领的物品照旧用它们自己的贴图。 |
| `on_consume` | `EntityAction` | `mxt:no_op` | 食用完成后运行的行为。 |
| `toxicity_gain` | `NumberProvider` | `0` | 这一口增加的丹毒。 |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | 过量阈值。累计值达到它才算过量；它只是触发线，不禁止继续吃。 |
| `on_overdose` | `EntityAction` | `mxt:no_op` | 越过阈值时运行的行为。 |
| `toxicity_after_overdose` | `NumberProvider` | `0` | 过量之后丹毒被**设成**的值，不是清零。 |
| `conditions` | `EntityCondition[]` | `[]` | 食用前检查；支持内联条件或带描述的条件对象。 |

`quality` 是可选的：所有丹药共用本体这一件载体物品 `mxt:pill`，物品本身说不清是哪一档，只有堆上携带的这份定义报得出——一剂这份丹药起始就在这一档。堆上写了自己的 `mxt:quality` 组件时以组件为准；这份定义没写 `quality` 时这一层不作答，继续落到注册表 [default_quality](./default_quality.md)。堆上的 `mxt:pill` 组件只覆盖效果那几个字段（`on_consume`、`toxicity_gain` 之类），**改不动档位**：档读的始终是定义自己写的那一份 `quality`。

一份定义只写"吃下去发生什么"，`data/example/mxt/pill/warming_pill.json`：

```json
{
  "color": "#FF9955",
  "toxicity_gain": 25,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 20,
  "on_consume": {"type": "mxt:heal", "amount": 4}
}
```

再写一条 [pill_binding](./pill_binding.md)，把这族物品指到它身上：

```json
// data/example/mxt/pill_binding/warming_pill.json
{
  "items": ["example:qi_pill"],
  "pill": "example:warming_pill",
  "max_uses": 2,
  "cooldown": 20
}
```

## 丹药与绑定各写一半

**丹药回答"吃下去发生什么"，绑定回答"哪些物品是它、这一族能用几次"。** 分开是为了让同一份作用挂到几族物品上：各族丹药物品各写一条绑定，`pill` 都指向同一个 id，而它们的次数与冷却各记各的。

绑定只有 `items` 这一条入口，所以空表等于那条定义不起作用；一件物品也只有被某条绑定的 `items` 认领，才算那份丹药——堆上的组件能指名作用，但不会创造这个身份，见下。

## 组件怎么压过绑定

一堆丹药可以自己带 `mxt:pill` 组件，逐个字段覆盖这份定义。解析顺序只有一条：

1. **组件里的 `pill` 优先**：它指名了一份定义就用它；没写 `pill` 时用匹配到的那条绑定指名的。
2. **五个效果键按字段盖上去**：`on_consume`、`toxicity_gain`、`toxicity_threshold`、`on_overdose`、`toxicity_after_overdose`；没写的键仍取定义的值。
3. **组件指名的那份引用失效**（键还在、注册表里已经没有值）就拒绝这一口，不回退去匹配别的定义，也不退回默认值。注意**写定义**时指名一份当前包里没有的 `pill` 不是这种拒绝，而是整个数据包加载失败（见[数据包开发总览](../overview.md#停用一条定义)）。

```mcfunction
give @s mxt:pill[mxt:pill={pill:"example:warming_pill",toxicity_gain:2}]
```

组件上没有 `max_uses`、`cooldown`、`conditions`、`priority`，所以它**改不了次数上限、冷却与食用门槛**。

## 次数与冷却跟着绑定走

**一件物品之所以有服用身份，是它被某条 `pill_binding` 的 `items` 认领**；组件不创造身份。所以只写效果键、或者组件指名了定义而这件物品没有被任何绑定认领时，这一口**不计次数、也没有冷却**。有绑定时身份就是那条绑定，组件改不了它。逐字段的含义、计次口径与冷却到期规则见 [pill_binding](./pill_binding.md)。

## 丹毒与过量

通过闸门之后先跑 `on_consume`，再把 `toxicity_gain` 加进这个实体的丹毒并记下新值。`toxicity_threshold` 求值结果有限、且新值**达到**它时算过量：跑 `on_overdose`，然后把丹毒**设成** `toxicity_after_overdose`（不是清零），所以照旧接着吃会继续过量。阈值求值结果不是有限数时，这一份丹药永远不会过量，往上叠多少都不触发。过量那一次本体自己会给服丹者一行 actionbar 提示；`on_overdose` 里仍可再写自己的动作。**`mxt:modify_pill_toxicity` 加丹毒不判阈值**，过量只发生在服丹这一条路上。

丹毒用实体条件 `mxt:pill_toxicity`（`comparison` 与 `compare_to`）和公式变量 `pill_toxicity` 读；从未服丹的实体读 `0`，也不会因此建附件。改丹毒用行为 `mxt:modify_pill_toxicity`：`mode` 为 `add` 或 `set`，默认 `add`，`amount` 必填；`set` 且常量小于 `0` 会加载失败，负的 `add` 用于排毒，结果不低于 `0`。这份账本怎么保存、怎么同步、会不会自己消退，见 [pill_binding](./pill_binding.md)。

## 条件与 Tooltip

`conditions` 是**食用前**的检查：有一条不成立就拒绝这一口，物品、容器剩余物、药效和次数都不变。每项都可以写成 `{condition, description}`：带描述的条件会在 Tooltip 里用绿色 `✓` 或红色 `✗` 标出结果，`description` 是语言键而不是自由文本。已经吃下去的一口，不会再被吃完后变化的饱食或生命条件否掉。

## 载体与显示

本体物品 `mxt:pill` 只提供原版食用、名字和 Tooltip，药效仍**只走一次**。载体的标题取这一堆解析出的那份丹药的 `name`：组件指名了就用组件那一份；**没有组件时**（药效由绑定指名）标题仍是本体物品自己的键 `item.mxt.pill`，那份丹药的名字显示在 Tooltip 第一行。组件本身不参与品质与元素的合并，见[物品绑定](./item_binding.md)。

**吃不吃得上由被绑的物品自己答**：原版开始一次食用只看栈上的 `minecraft:consumable`。被绑定物品自带它就按那个物品自己的时长与姿势吃（食物在饱食度满时原版照样吃不下，这时会给一句提示）；没有它就由框架在右键那一刻补上、动作结束时收回——所以绑到不自带用途的物品上也能吃，物品本身留不下任何东西。自带用途的物品（可换装、盾牌、动能武器）与同时被长按声明认领的物品各走自己那条路，丹药不抢它们的右键。见 [pill_binding](./pill_binding.md)。

**图标颜色同样只染本体这一件物品**：它按这一堆解析出的那份丹药的 `color` 上色，指名的那份不在注册表里（这一口会被拒绝）就不上色。颜色写在定义上、组件没有这个键，所以同一份丹药的每一堆颜色都一样；被绑定认领的物品和任何别的物品，贴图一个字都不动。
