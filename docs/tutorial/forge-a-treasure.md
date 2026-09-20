---
title: 锻造一件法器
description: 用锻造手法、工具绑定和一张图纸搭出锻造台的一条生产线：锻打条、目标区间、收尾模式、品质阶梯与失败结算。
---

# 锻造一件法器

锻造台不合成物品，它**打**物品：你放进去一份材料，它按一张图纸给出目标，玩家用一个个"手法"把一条数值条推进区间，最后按**多打了几锤**决定品质。同一个结果可以是凡品，也可以是绝品，区别只在过程。

这套系统的数据分四处：`forging_method` 是单次锻打，`tool_binding` 决定哪把工具能打出哪些手法，`forging_blueprint` 是"要什么材料、打成什么样"，`blueprint_binding` 则把图纸挂到一件真实物品上。前三张是数据表，第四张要靠**物品组件**才生效——这是本教程与前面几篇最不一样的地方。

本篇给示例包加一条铁剑生产线：四种手法、一把铁匠锤、一张图纸物品和三个品质档。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/forging_method/light_strike.json` | 轻敲：数值 `-1`。 |
| `data/example/mxt/forging_method/heavy_strike.json` | 重锤：数值 `+2`，带消耗、条件、冷却与音效。 |
| `data/example/mxt/forging_method/quench.json` | 淬火：数值 `-1`，零消耗。 |
| `data/example/mxt/forging_method/temper.json` | 回火：数值 `+2`，零消耗。 |
| `data/example/mxt/tool_binding/smith_hammer.json` | 铁匠锤解锁哪四种手法。 |
| `data/example/mxt/forging_blueprint/spirit_sword.json` | 材料、允许手法、锻打条、收尾模式、品质阶梯、失败结算。 |
| `data/example/mxt/blueprint_binding/sword_manual.json` | 图纸物品提供哪一份蓝图。 |
| `data/example/mxt/item_quality/flawless.json` | 品质阶梯的最高一档。 |

## 第 1 步 —— 一次锻打是什么

一份手法就是"按一下会怎样"：数值往哪边走、花多少、什么时候允许、按下去响什么。

```json
// data/example/mxt/forging_method/light_strike.json
{
  "value_delta": -1,
  "icon": { "id": "minecraft:feather" }
}
```

```json
// data/example/mxt/forging_method/heavy_strike.json
{
  "value_delta": 2,
  "costs": [{ "id": "example:qi", "amount": 1 }],
  "condition": { "type": "mxt:health", "comparison": ">=", "compare_to": 10 },
  "icon": { "id": "minecraft:iron_ingot" },
  "cooldown": 10,
  "sound": "minecraft:block.anvil.land"
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value_delta` | Integer | **必填** | 锻打条的偏移，**不能为 `0`**。 |
| `costs` | `List<ResourceCost>` | `[]` | 每次锻打的消耗，从锻打者身上扣（写法见[触发器与消耗类型](../datapack/types/other/trigger-and-cost.md)）。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 允许使用该手法的条件，判定对象是**玩家**（[实体条件](../datapack/types/condition/entity_condition_types.md)）。 |
| `icon` | 图标引用 | 无 | 列表里画什么，**同时决定这个手法在列表里叫什么名字**。 |
| `cooldown` | Integer | `0` | 冷却，单位 tick，范围 `0..72000`。 |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | 锻打**真的发生**之后，在台子位置对附近所有玩家播放。 |

三件容易踩的事：

- **`icon` 不是装饰。** 手法在列表里的显示名就是它那个物品的名字；不写 `icon`（或写成贴图）时列表里显示的是注册 ID。想让人一眼看懂，就给它一个图标。
- **越界的手法会被直接拒绝。** 每次锻打前都会算一次"打完还在不在条内"，不在就拒绝——所以别指望用一记越界的重锤把数值"掰"回区间里。
- **冷却在扣费与条件判定之前就记下了。** 一次因为灵气不足或条件不满足被打回的锻打，照样占掉这段冷却。

音效按 ID 在加载期解析，名字写错会让**整条手法条目**被拒绝，而不是静默无声；要静音就写 `minecraft:intentionally_empty`。

## 第 2 步 —— 工具与图纸物品

两张绑定表都只是"某件物品 → 一组定义"的清单，清单本身不指定物品：

```json
// data/example/mxt/tool_binding/smith_hammer.json
{
  "methods": [
    "example:heavy_strike", "example:light_strike",
    "example:quench", "example:temper"
  ]
}
```

```json
// data/example/mxt/blueprint_binding/sword_manual.json
{
  "blueprints": ["example:spirit_sword"]
}
```

物品通过组件指向它们：`mxt:tool_binding` 与 `mxt:blueprint_binding`。组件里存的是 Holder，物品本身不复制定义，所以改绑定表不需要动物品。

**可用手法 = 蓝图 `allowed_methods` ∩ 所有已放置工具 `methods` 的并集。** 蓝图没声明 `allowed_methods` 时，蓝图一侧不做限制，列表就是工具的并集。

### 怎么把组件挂到物品上

这是本教程唯一需要物品侧配合的地方。两条路：

**测试用 `/give` 的组件语法**（不用写代码，改完数据表直接试）：

```text
/give @s minecraft:iron_ingot[mxt:tool_binding="example:smith_hammer"]
/give @s minecraft:paper[mxt:blueprint_binding="example:sword_manual"]
```

**正式整合包应该在注册物品时就带上它。** 模组自带的测试物品就是这么做：把绑定表的名字作为物品自己的 ID，用延迟 Holder 组件写进物品属性，于是每一个合成出来的锤子都自带这份绑定，不依赖命令或创造模式手动改组件。

::: tip 组件的值是数据表 ID，不是内联内容

`mxt:tool_binding="example:smith_hammer"` 里的 `example:smith_hammer` 是 `tool_binding` 注册表里的条目名。写一个不存在的 ID，物品会带上一个解析不出的组件——列表里什么都不会出现。

:::

## 第 3 步 —— 图纸：材料、条与目标区间

```json
// data/example/mxt/forging_blueprint/spirit_sword.json
{
  "input": [
    { "id": "minecraft:iron_ingot", "count": 2 },
    { "id": "minecraft:stick", "count": 1 }
  ],
  "allowed_methods": [
    "example:light_strike", "example:heavy_strike",
    "example:quench", "example:temper"
  ],
  "meter_min": -8,
  "meter_max": 8,
  "target_min": 2,
  "target_max": 4,
  "result": "minecraft:iron_sword"
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `input` | `List<ForgingMaterial>` | **必填** | 材料需求，每项是 `id` + `count`（`count` 范围 `1..64`，默认 `1`）。 |
| `allowed_methods` | `HolderSet<forging_method>` | 空 | 允许的手法：ID 列表、单个 `"#命名空间:标签"`，或整个省略。**省略或空列表 = 不限制**。 |
| `meter_min` / `meter_max` | Integer | **必填** | 锻打条的两端，必须**跨过 0**（一个为负、一个为正）。 |
| `target_min` / `target_max` | Integer | **必填** | 目标区间，必须落在条内。 |
| `result` | Identifier | **必填** | 成功后产出的物品。 |

`input` **顺序无关**：台子上 12 个输入格合计持有每项声明的数量即可，从哪些格子掏的不影响判定。但它是**严格**列表——空列表、超过 15 项、同一物品写两次、无法解析的物品 ID，都会让整份定义加载失败。这和后来要讲的阵法费用表正好相反，那边是容错列表。

材料按**物品**匹配（`stack.is(item)`），不看组件。所以"一摞带品质组件的灵铁锭"和普通的同名物品在判定上没有区别——想限制品质，靠的是结算时的品质读取（见第 4 步），不是 `input`。

::: warning 条与目标区间的约束是双向的

`meter_min` 必须为负、`meter_max` 必须为正，并且 `target_min`/`target_max` 要夹在两者之间。另外，**开始会话时**服务端会用广度优先搜索算一遍：以这份蓝图允许的手法，能不能在不越界的前提下走进目标区间、并满足收尾模式。算不出来，这次"使用蓝图"就会被拒绝。

:::

## 第 4 步 —— 收尾模式、额外步数与品质

把收尾模式与品质阶梯加进同一份蓝图：

```json
"finish_pattern": {
  "steps": [
    "example:light_strike", "example:heavy_strike", "example:light_strike",
    "example:heavy_strike", "example:light_strike", "example:heavy_strike"
  ],
  "required_suffix_steps": 2
},
"max_steps": 24,
"quality_by_extra_steps": [
  { "max_extra_steps": 0, "quality": "example:flawless" },
  { "max_extra_steps": 4, "quality": "example:refined" },
  { "max_extra_steps": 2147483647, "quality": "example:common" }
]
```

```json
// data/example/mxt/item_quality/flawless.json
{
  "display_name": "quality.example.flawless"
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `finish_pattern.steps` | 六个手法 | `[]` | 收尾模式。要校验时**必须正好六项**。 |
| `finish_pattern.required_suffix_steps` | Integer | `0` | 校验末尾几项，范围 `0..6`。 |
| `max_steps` | Integer | 无 | 步数上限。**省略则该蓝图永不因步数失败。** |
| `quality_by_extra_steps` | `List<QualityThreshold>` | **必填** | 额外步数到品质的升序映射，**末项必须是 `2147483647`**。 |

`required_suffix_steps` 只校验模式的**最后 N 项**：界面上"要求"那一行只有这 N 格有图标，前面几格画成屏障——它们既不显示也不判定。上面这份蓝图要求最后两锤是"轻敲 → 重锤"。

**额外步数 = 实际步数 − 最短步数。** 最短步数在会话开始时就算好了（就是第 3 步那次搜索），不是"数值超出目标多少"。上面这份蓝图的最短解是三锤（重锤 → 轻敲 → 重锤，落到 3），所以额外步数为 `0` 就是绝品。

- 品质取第一个满足 `额外步数 ≤ max_extra_steps` 的档，所以这个列表必须**升序**，并留一个 `2147483647` 兜底。
- **材料的品质会除这个额外步数。** `item_quality` 的 `forging_modifier` 大于 1 时，同样的额外步数会被算成更少，于是拿到更好的档；多种材料取其中**最低**的一档（一件成品只和它最差的材料一样好），没有品质可解析的材料被跳过；修正项缺失或不可用时按 `1` 处理。
- 这里读的是**蓝图声明的 `id` + `count`**（结算时重新构造的一份普通物品栈），而不是被拿走的那一摞。因此**只写在某一摞上的 `mxt:item_quality` 组件读不到**：要么把这种材料声明成灵植，要么在它的绑定表里给一个 `quality_group` 默认档，品质才会参与锻造结算。

::: tip 完成是自动的

每次锻打之后服务端都会检查一遍：数值落进目标区间、并且收尾模式匹配，会话**立刻结算**，成品直接出现在输出格。界面上没有"完成"按钮（协议里有一个 `FINISH` 请求，但界面不发它）。

反过来说，目标区间包含 `0` 且不要求收尾模式的蓝图，会在你按下"使用蓝图"的瞬间就完成。

:::

`max_steps` 是**唯一**的失败来源：写 24 就是"第 25 次锻打时判失败"。判定发生在这一次锻打之前——也就是说触发失败的那一次点击不会被算作锻打，只是把会话结算成失败。

## 第 5 步 —— 成功与失败的收尾

```json
"result": "minecraft:iron_sword",
"complete_action": { "type": "mxt:add_resource", "resource": "example:qi", "amount": 5 },
"fail_action": {
  "type": "mxt:apply_effect",
  "effect": "minecraft:weakness",
  "duration_ticks": 100
},
"failure_settlement": {
  "result": "minecraft:iron_nugget",
  "input_return_ratio": 0.25,
  "material_loss_ratio": 0.75
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `complete_action` | `EntityAction` | `mxt:no_op` | 成功时对**玩家**执行的行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 失败时对玩家执行的行为。 |
| `failure_settlement.result` | Identifier | 无 | 失败时可能产出的"废料"。 |
| `failure_settlement.input_return_ratio` | Double | `0` | 整份材料原样退回的概率，范围 `0..1`。 |
| `failure_settlement.material_loss_ratio` | Double | `1` | 材料损失比例；它的反面 `1 - 该值` 是产出废料的概率。 |

失败结算是**两次独立掷骰**：先按 `input_return_ratio` 决定要不要把锁定的材料放回输入格（放不下的掉给玩家），再按 `1 - material_loss_ratio` 决定要不要额外给一份废料。所以"既退回材料、又拿到废料"是会发生的。省略整个 `failure_settlement` 就是默认的 `destroy_input()`：什么都不还。

界面上那个「取消」按钮**不走**这套结算，而是走一个"取消策略"（默认把会话锁定的材料原样放回输入格），但 `fail_action` 照样执行——取消也算没打出东西。这个策略是 Java 侧的接口，数据包改不了它。

## 在游戏里验证

```text
/give @s mxt:forging_table
/give @s minecraft:iron_ingot[mxt:tool_binding="example:smith_hammer"]
/give @s minecraft:paper[mxt:blueprint_binding="example:sword_manual"]
/mxt registries validate
/mxt registries list
```

1. 放下锻造台，右键打开。界面左边三格放图纸，右边三格放工具，中间 4×3 是材料输入格，成品在右侧输出格。
2. 把两枚铁锭和一根木棍放进输入格。左列表里出现成品图标（蓝图在列表里就是用**产出物品**命名的）；悬停它，会列出材料清单，够的显示绿色 `✔` 与"已有/需要"，不够的红色 `✖`，下方还会写步数上限。
3. 选中蓝图，按「使用蓝图」。材料被拿走，会话开始：条上出现绿色目标带、灰色零线、红色当前值。
4. 在右列表选中一个手法（图标就是 `icon`，悬停显示"数值影响：+2"），按「使用方法」。当前值移动，下面的"当前"一行记录最近六锤；选中手法时条上还会出现一条黄色预测线。
5. 把当前值打进绿带，并让最后两锤是"轻敲 → 重锤"。会话会自动结算，成品落进输出格，Tooltip 里出现品质行——显示的文字就是 `flawless.json` 里 `display_name` 指向的内容（写翻译键的话，记得在自己的语言文件里给它一条译文）。
6. 再打一件，这次故意多绕几锤，比较两次的品质。想中途放弃就按「取消」，材料按取消策略退回。
7. `/mxt registries validate` 应当无错误，`/mxt registries list` 里能看到 `mxt:forging_method`、`mxt:forging_blueprint`、`mxt:tool_binding`、`mxt:blueprint_binding` 的条目数。

::: tip 自动化与拒绝原因

输入格对漏斗开放；成品只能从**下方**的漏斗抽出。会话进行中输入格与蓝图槽都被锁定，只有工具槽随时可换——所以中途加一把锤子可以立刻拓宽手法列表。

还有一个必须知道的现实：**被拒绝的请求不会弹提示**。`使用蓝图`/`使用方法` 的失败原因（材料不足、输出格被占、越界、冷却、蓝图不可达）只写进服务端日志里那行 `forging SELECT/STRIKE … outcome=`。玩家看到的症状是"按了没反应"，原因要去日志里找。

:::

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 左列表空的 | 蓝图槽里没放带 `mxt:blueprint_binding` 组件的物品。**没有"列出全注册表"的回退**：三格为空就没有蓝图。 |
| 右列表里没有你要的手法 | 交集为空：蓝图 `allowed_methods` 里没有它，或没有任何已放置的工具解锁它。 |
| 蓝图定义加载失败 | `input` 为空、超过 15 项、同一物品写两次、ID 解析不出；`meter_min`/`meter_max` 没有跨过 0；品质阶梯不是升序或末项不是 `2147483647`；`finish_pattern` 要校验却不是六项。 |
| 「使用蓝图」按钮是灰的 | 材料不足（悬停蓝图看哪一行是 `✖`）、输出格里有东西，或者会话已经在跑。 |
| 按「使用蓝图」没反应 | 服务端拒绝了。除了材料/输出格，最常见的是**目标区间不可达**：按这份蓝图允许的手法与收尾模式，搜索找不到解。 |
| 怎么打都完不成 | 收尾模式要求的手法没有对应工具解锁；或者数值一直没进区间——注意越界的那一锤会被直接拒绝。 |
| 打到步数上限还没有成品 | `max_steps` 到了仍未满足条件：**下一次**锻打把会话判失败，按 `failure_settlement` 结算。 |
| 成品品质每次都一样 | 每次都用最短解（额外步数恒为 0）；或者材料的品质读取不到——只用 `mxt:item_quality` 组件标了品质的材料不算，见第 4 步。 |
| 中途一把手法突然不可用 | 可用手法每次锻打都重算，工具槽不锁定：拿掉锤子就少一批手法。 |
| 冷却中按了没用 | `cooldown` 是按（玩家, 台子）记的，而且在条件与扣费**之前**判定，所以一次被打回的锻打也占冷却。 |
| 材料没退回手里 | 输入格满了，多出来的部分掉在脚下。 |

## 接下来

- [forging_blueprint（锻造图纸）](../datapack/json/forging_blueprint.md) —— 图纸的完整字段表与校验规则。
- [forging_method（锻造手法）](../datapack/json/forging_method.md) 与 [tool_binding（工具绑定）](../datapack/json/tool_binding.md) —— 手法与工具那一半。
- [blueprint_binding（图纸绑定）](../datapack/json/blueprint_binding.md) —— 组件与物品的关系。
- [item_quality（品质）](../datapack/json/item_quality.md) —— `forging_modifier`、品质组与品质的解析顺序。
- [MxtEvents：事件](../kubejs/api/events.md) —— 用脚本读/改锻打消耗、拦下某个阶段。
