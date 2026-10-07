---
title: 定义货币
description: "给一件已有物品一个面值与一组单向兑换：谁认领它、一叠什么时候不算钱、兑换站拿它换什么。"
---

# 定义货币

一条货币定义是 `data/<命名空间>/mxt/currency/<路径>.json` 里的一个文件，注册表 id 是 `mxt:currency`。它给一件**已经注册的物品**一个面值：这堆东西值多少、能换成什么。它不创建物品，也不改物品——**任意已注册物品都能当货币**，原版的、别的模组的、KubeJS 注册的都一样，兑换站与结算服务读的都是这张表。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | 无 | 认领哪些物品：单个物品 id、`#物品标签`，或它们的数组。 |
| `item` | 物品 id | 无 | 只认领一件物品时的简写，等价于 `items` 里写一个物品 id。 |
| `value` | Long | **必填** | 单件面值，必须大于 `0`。 |
| `unavailable_when` | `ItemCondition` 数组 | `[]` | 条件成立时这一叠的价值读作 `0`，并显示对应原因。 |
| `exchanges` | 兑换项数组 | **必填** | 单向兑换选项，可以写成空数组。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先，同分回落到注册表顺序。 |

`items` 与 `item` 至少要写一个，`value` 必须是正数，`exchanges` 必须存在（没有兑换就写 `[]`），否则这条定义在加载期被拒绝。完整字段表见 [currency（货币）](../datapack/json/currency.md)。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | *（改一处）* 为**灵币**加一行注册。 |
| `data/example/mxt/currency/spirit_coin.json` | 本页唯一的定义：认领灵币、给它面值，并给出两条兑换。 |

灵币在示例包里还不存在，所以第 1 步先注册它。示例包已有的四件物品是 `kubejs:qi_pill`、`kubejs:root_pellet`、`kubejs:spirit_sword` 与 `kubejs:azure_manual`（见 [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md)），它们都不是钱，所以本页**认领的是新注册的 `kubejs:spirit_coin`**，不是借用其中某一件。

## 第 1 步 —— 先有那件物品

货币定义只能引用**已经注册**的物品，而物品只在启动时注册一次：

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('spirit_coin')
    .displayName('Spirit Coin')
})
```

`event.create('spirit_coin')` 产生的是 `kubejs:spirit_coin`（没有命名空间就落在 `kubejs`）。改这个文件要**重启游戏**：启动脚本在游戏注册物品之前运行，`/reload` 永远不会重跑它。

**为什么这么写就够。** 货币值不是物品的属性，而是注册表里那条定义的属性：物品只需要存在，值写在 `spirit_coin.json` 里。所以同一件 `kubejs:spirit_coin` 可以在不同包里值 1 或值 100，代码一行不改。

## 第 2 步 —— 认领物品：`item`、`items` 与平手规则

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": [
    {"cost": 10, "result": {"id": "mxt:spirit_stone"}}
  ]
}
```

先只看认领的那一行：

- `item` 是"只认领一件物品"的简写，它推出的就是 `items: ["kubejs:spirit_coin"]`。要认领一族物品就换成 `items`，写法与别的按物品认领的表相同：`["kubejs:spirit_coin", "#example:coins"]`。
- 命名空间别漏：脚本没写命名空间注册的物品在 `kubejs` 下，写成 `example:spirit_coin` 会认领不到任何东西。
- 一条定义认领的物品用的是**匹配器**，所以标签与物品混写没问题；单个未知的物品 id 会让数据包加载失败，写在数组里的未知 id 只记一行日志后丢掉那一项，文件其余部分照常加载。

**一件物品可以被多条定义命中，只有一条生效。** 先后由每条定义自己的 `priority` 决定：数值大者先；只有 `priority` 相同的两条才回落到注册表顺序（也就是按条目 id）。这与"认领它的是物品还是标签"无关，`value` 与 `exchanges` 都按赢的那条读，输的那条既不算价值、也不提供兑换。字段默认 `0`，所以想覆盖别包里已有的同物品定义，就把自己的那条写大一点；示例只有一条定义，可以不写。

## 第 3 步 —— `value`：这一件值多少

`value` 是**单件**面值，必须大于 `0`，类型是整数。上面写的 `1` 就是"一枚灵币算 1 点"。一叠的面值是单件乘以数量，溢出与"不是货币"都会让这次查询没有答案。

价值有两处被读到，都按同一份定义：

| 读者 | 读到什么 |
| --- | --- |
| 物品提示框 | 一行 `item.mxt.currency_value`，显示的是**结算后的**单件价值。 |
| 兑换站、支票台与结算服务 | 单件价值乘数量，用来算这一叠总共值多少。 |

档位会乘在面值上：品质自己的 `value_multiplier` 乘的就是这里的 `value`，所以同一件货币的高档版本按它自己的档位值更多。**`value` 不是消耗**：它与 `exchanges[].cost` 都是价格，永远不会写进 `Cost`。

`value` 只回答"值多少"，**不回答"能不能花"**——"这一叠现在不算钱"是下一个字段。

## 第 4 步 —— `unavailable_when`：这一叠什么时候不算钱

`unavailable_when` 是一个数组，每一项把**一个物品条件**与**一段原因**绑在一起。条件成立时这一叠的价值读作 `0`，并显示那段原因：

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "unavailable_when": [
    {
      "condition": {"type": "mxt:relative_durability", "comparison": "<=", "compare_to": 0},
      "reason": "tooltip.example.spirit_coin_worn"
    }
  ],
  "exchanges": []
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `condition` | 物品条件 | 成立时这一叠读作 `0`；类型见[物品条件](../datapack/types/condition/item_condition_types.md)。 |
| `reason` | 文本 | 显示给玩家的原因，翻译键或原版文本组件对象都行。 |

三条要记住的语义：

- **条件成立＝价值 0，不是"这条定义不见了"**：物品仍是货币，只是这一叠此刻不值钱。兑换站还会把它的选项一并收起来（见第 6 步）。
- **需要玩家上下文的场合拿当前玩家判条件**：提示框对着正在看它的那件、兑换站对着操作的人；**没有实体上下文的纯服务端查询不擅自猜条件结果**，它当作这一条不成立（手里没有玩家就判不了这件事）。
- **原因是一段文本，不是必填**：写了就在价值那一行下面多一条红字；不写时框架自己给一句通用的（`tooltip.mxt.currency_invalid`）。

第 3 步那句"值多少"与这里那句"算不算钱"是两件事：`value` 决定值多少，`unavailable_when` 决定这一刻算不算。例子用 `mxt:relative_durability` 表示"磨没了的灵币不收"；本体自带的灵石用的是 `mxt:spirit_storage_not_full`（没灌满的灵石不算钱），见 [currency（货币）](../datapack/json/currency.md)。

## 第 5 步 —— `exchanges`：从这件货币换出去

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": [
    {"cost": 10, "result": {"id": "mxt:spirit_stone"}},
    {"cost": 100, "result": {"id": "minecraft:gold_ingot", "count": 2, "components": {"minecraft:custom_name": "{\"text\":\"Spirit Note\"}"}}}
  ]
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cost` | Integer | **必填** | 从输入槽的货币物品里消耗几个，范围 `1..99`。 |
| `result` | `ItemStackTemplate` | **必填** | 兑换成功后产出的物品堆。 |

`result` 用物品堆模板的形状，它只有三个字段：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 物品 ID | 无 | **必填**，输出物品。 |
| `count` | Integer | `1` | 输出数量，范围 `1..99`。 |
| `components` | 对象 | 无 | 可选的原版数据组件补丁。 |

三条要记住的语义：

- **兑换是单向的。** 第一条说"10 枚灵币换 1 块灵石"，它**不**给你反向的那一条；想让灵石换回灵币，得在灵石自己的定义里写反向条目。所以"双向"永远是两条定义各写一次。
- **`cost` 是件数，不是面值。** 它不从 `value` 推：10 枚灵币换 1 块灵石、而 1 块灵石在它自己的定义里写 `10`，这两件事是各自写死的，兑换站不会替你算价差。
- **`result` 里不能写公式。** 数量是固定的 `count`，所以"按面值找零"这类效果要靠多写几条兑换，或者由兑换站之外的模块去做。一条 `exchanges` 读不出任何变量。
- **`components` 是原版数据组件补丁**，上面第二条就用它给产出改了个名字；它写的是原版组件语法，所以别在这里写模组定义。

`exchanges` 是必填字段：没有兑换的货币也要写 `"exchanges": []`。这样的货币**仍然有面值**（提示框照常显示它值多少、参与结算），只是兑换站的输入槽不收它——见下一步。

## 第 6 步 —— 在兑换站里用它

兑换站方块 `mxt:exchange_station` 是切石机式界面：一个输入槽、一列选项、一个结果槽。摆好右键打开，把货币放进输入槽。

| 你会看到 | 为什么 |
| --- | --- |
| 货币放不进输入槽 | 这个槽只收**兑换列表非空**且此刻可用的货币：`exchanges` 为空的定义不算兑换输入。 |
| 输入槽里换了另一件物品 | 选项列表跟着重算，之前选中的那条不再选中。 |
| 右侧一列选项 | 就是这条定义 `exchanges` 的条目，按数组顺序排列。 |
| 选了条目却没有输出 | 输入数量还没到那条的 `cost`。 |
| 取走结果 | 扣掉 `cost` 个输入物品，输入槽里剩下的照旧留着。 |

列表与结果都由服务端确认，客户端只是拿同步过来的注册表画同一批选项。完整行为见 [currency（货币）](../datapack/json/currency.md) 的「兑换站行为」一节。

**停用一条定义**写在文件顶层，用的是数据包的加载期条件——条件不成立时这条定义根本不进注册表，那件物品也就不是货币、不参与兑换与结算：

```json
{
  "neoforge:conditions": [
    {"type": "neoforge:never"}
  ],
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": []
}
```

## 在游戏里验证

货币是数据包注册表，在**世界加载时**读取，`/reload` 不重读；而物品在启动时注册，所以两件事各要各自的一次重启：

```text
（重启游戏）                      → kubejs:spirit_coin 这时才存在
（重新打开世界）                  → 货币定义这时才加载
/mxt registries validate          → 一次报出全部问题
/mxt registries list              → mxt:currency=1
```

1. `/give @s kubejs:spirit_coin`：提示框里多出一行金色的 `item.mxt.currency_value`，显示 `1`。
2. 把它的 `value` 改成 `100`，重开世界再看一次提示框：那一行跟着变。
3. 摆一个兑换站右键打开，把灵币放进去：右侧列出 `exchanges` 里的那一条；选中它，手里有 10 枚时结果槽才出现产出，取走之后输入槽少了 10 枚。
4. 把 `exchanges` 改成 `[]`，重开世界：这件物品**仍然有面值**，但已经放不进兑换站的输入槽。
5. 拿一叠能让 `unavailable_when` 里那个条件成立的灵币（例子的条件是 `mxt:relative_durability`，所以给它写上 `minecraft:max_damage` 与 `minecraft:damage` 两个组件即可）：提示框里价值那一行变成 `0`，下面多出一条红色的原因。
6. `/picker mxt:currency` 列出这些定义认领的物品。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界带着 Codec 错误拒绝加载 | `items` 与 `item` 都没写、`value` 不是正数、或 `exchanges` 整个漏了——三者都是加载期拒绝。 |
| 提示框里没有价值那一行 | 这条定义没认领这件物品；或者认领到了但被另一条 `priority` 更高的定义顶掉（赢的那条说了算）。 |
| 提示框里的数字与 `value` 不一样 | 上面那行显示的是**结算后**的价值：品质自己的 `value_multiplier` 会乘在面值上。 |
| 物品放不进兑换站的输入槽 | 这条定义的 `exchanges` 是空数组（空数组合法，但不算兑换输入），或者它的 `unavailable_when` 此刻成立。 |
| 选了条目却一直没有结果 | 输入槽里的数量还没到那一条的 `cost`；`cost` 数的是件数，不是面值。 |
| 反向兑换不存在 | 兑换是单向的：反向那一条必须写在**目标货币自己的** `exchanges` 里。 |
| 改了 JSON 却什么也没变 | 数据包注册表在世界加载时读，`/reload` 不重读；`items` 里写了不存在的物品 id 则会让整次加载失败。 |
| 写了 `value_multiplier` 在货币定义里没反应 | `value_multiplier` 是**品质**的字段，不是货币的字段；货币这边只有 `value`。 |

## 接下来

- [currency（货币）](../datapack/json/currency.md) —— 每个字段的完整说明、兑换站行为与停用一条定义。
- [内置物品与组件](../player-guide/items.md) —— 本体自带的四阶灵石与它们的默认货币值，以及兑换站、支票台这些方块。
- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 第 1 步那行注册写在哪个文件里，以及物品与数据包各自的生效时机。
