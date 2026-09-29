---
title: number_provider_type（数值提供器）
description: 简写写法、结构化表达式与全部固有数值提供器的 type、字段与取值范围。
---

# number_provider_type（数值提供器）

凡是「随等级、境界或事件变」的数字都是数值提供器。它有三种输入形式：JSON 数字、表达式字符串，以及带 `type` 的对象。

求值全在服务端，客户端只拿到同步后的结果。同一个定义在不同实体身上可以有不同结果，因为变量是从求值那一刻的实体身上读的。

| 形式 | 写法 | 等价于 |
| --- | --- | --- |
| 数字 | `5` | `mxt:constant` |
| 字符串 | `"4 + level * 0.5"` | `mxt:expression` |
| 对象 | `{"type": "mxt:uniform", "min": 1, "max": 3}` | 该 `type` 自己的形状 |

对象形式里 `type` 与其它键平级，没有外层的包装。

```json
"amount": 5
```

```json
"amount": "4 + level * 0.5"
```

```json
"amount": {"type": "mxt:constant", "value": 5}
```

## 表达式字符串

字符串一律当表达式：能用运算符、括号、函数，以及上下文提供的变量名。加载期会检查表达式能不能解析、`params` 里的名字是不是合法变量名、以及 `params` 的每个键是不是真的出现在表达式里——三样有一样不合就是解码错误，整个定义加载失败，但加载器会**收集这一次加载里的全部失败条目后一并列出**，不会只报第一个。

字符串是 `mxt:expression` 的简写，不需要也不接受在字符串里写 `type`。

```json
{
  "type": "mxt:expression",
  "expression": "base_damage * multiplier",
  "params": {
    "base_damage": 8,
    "multiplier": "1 + level * 0.1"
  }
}
```

`params` 的值本身也是数值提供器，支持全部三种形式。求值时 `params` 覆盖同名变量。

变量名合不合法由加载期判定：首字符是字母或下划线，其余可以是字母、数字、下划线。`params` 里写了表达式用不到的键同样是加载错误，而不是留着不用。

变量名是否**可用**由内置变量表和当前上下文共同决定，这一层只在求值时才知道。上下文拿不出来的名字会被报告：开发环境打印完整 ERROR 日志（含异常与堆栈），生产环境每个不同消息打印一行 WARN；两种情况都继续按 `0` 求值，不中断调用方。求值结果不是有限值时同样报告后按 `0` 返回。变量清单见[常见公式变量](./formula_variables)。

## 固有数值提供器

下面每个类型一个三级标题；字段表里没写「必填」的就是可省略。

### `mxt:constant`

一个固定数值。数字简写就等价于它。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | Double | **必填** | 固定数值，必须有限 |

```json
{"type": "mxt:constant", "value": 12}
```

### `mxt:expression`

exp4j 表达式，`params` 可覆盖上下文变量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `expression` | String | **必填** | 表达式原文 |
| `params` | 变量名到数值提供器的映射 | `{}` | 覆盖同名上下文变量 |

```json
{
  "type": "mxt:expression",
  "expression": "heal + bonus",
  "params": {"bonus": "level * 0.5"}
}
```

### `mxt:context_variable`

直接读一个上下文变量，取不到时用回退值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variable` | String | **必填** | 变量名，不能是空白 |
| `fallback` | Double | `0` | 内置变量表里根本没有这个名字时返回的值，必须有限 |

`fallback` 只管「这个名字没人认识」。名字认识、但这个上下文提供不了时仍走错误报告那条路并按 `0` 返回，与表达式一致。

```json
{"type": "mxt:context_variable", "variable": "absorbed_aura", "fallback": 0}
```

### `mxt:sum`

把几项相加。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `summands` | 数值提供器数组 | **必填** | 至少一项，空数组在加载期被拒绝 |

```json
{"type": "mxt:sum", "summands": [1, "level * 0.25", {"type": "mxt:uniform", "min": 0, "max": 2}]}
```

### `mxt:uniform`

在区间内取均匀随机值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `min` | 数值提供器 | **必填** | 下界 |
| `max` | 数值提供器 | **必填** | 上界 |

两个界都先求值，随机源来自求值上下文。`min` 大于 `max`、或者两个界里有一个是 `NaN` 时，记一条警告并按 `0` 返回；两边相等直接返回那个值，不掷随机。

```json
{"type": "mxt:uniform", "min": 2, "max": "2 + level"}
```

### `mxt:binomial`

`n` 次伯努利试验，返回成功次数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `n` | 数值提供器 | **必填** | 试验次数，求值后必须是 `0..16384` 之间的整数 |
| `p` | 数值提供器 | **必填** | 单次成功概率，求值后必须在 `0..1` |

`n` 不是整数、越界，或 `p` 越界（包括求值成 `NaN`）时，记一条警告并按 `0` 返回。

```json
{"type": "mxt:binomial", "n": 5, "p": 0.35}
```

### `mxt:weighted_list`

按权重从若干项里挑一项求值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `distribution` | 条目数组 | **必填** | 至少一项，空数组在加载期被拒绝 |

每一项是加权条目，形状全模组统一为：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 数值提供器 | **必填** | 选中这一项时返回的值 |
| `weight` | Integer | `1` | 整数权重 |

权重 `≤ 0` 的条目算 `0`，永远不会被选中。整表权重全为 `0`（或权重之和溢出整数范围）时，这个提供器记一条警告并按 `0` 返回，不抽任何一项。

```json
{
  "type": "mxt:weighted_list",
  "distribution": [
    {"value": 1, "weight": 3},
    {"value": "level * 2", "weight": 1}
  ]
}
```

### `mxt:conditional`

按顺序检查分支，返回第一个满足条件的分支的值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `branches` | 分支数组 | `[]` | 按书写顺序检查 |
| `fallback` | 数字或表达式字符串 | 无 | 没有玩家可用、或所有分支都不匹配时的返回值；省略时返回 `0` |

每个分支是：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | 实体条件 | **必填** | 对玩家测试的条件 |
| `value` | 数值提供器 | **必填** | 条件成立时返回的值 |

`fallback` **只收数字和表达式字符串**，写 `{"type": "mxt:constant", "value": 1}` 这种对象是加载错误。

```json
{
  "type": "mxt:conditional",
  "branches": [
    {"condition": {"type": "mxt:sneaking"}, "value": 4},
    {"condition": {"type": "mxt:has_realm", "aura": "example:qi"}, "value": "level + 1"}
  ],
  "fallback": 1
}
```

### `mxt:js`

把这一次求值交给服务端脚本。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtValues.number(...)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

回调拿到的公式上下文与内置类型拿到的是同一个，读法见 [MxtValues](/kubejs/api/values)。`id` 没有对应回调时记一条警告并按 `0` 返回，不会让加载失败。

```json
{"type": "mxt:js", "id": "example:luck_roll", "params": {"base": 3}}
```

## 灵气浓度来源

有两个数字描述「某个位置有多少灵气」，它们不在 `mxt:number_provider_type` 里，而在资源数值来源注册表 `resource_value_provider_type` 里：

| `type` | 说明 |
| --- | --- |
| `mxt:environment_concentration` | 当前位置的环境模板浓度，只计算群系/维度/区域等环境来源，不包含区块库存和方块、阵法释放的灵气。 |
| `mxt:actual_concentration` | 当前位置最终解析浓度，包含环境、区块库存以及方块和阵法等所有已生效来源。 |

这两个要读世界状态，所以需要一个位置：没有实体可依附时解析为 `0`。完整的资源数值来源清单见[资源数值来源](/datapack/types/other/resource-value-provider)。
