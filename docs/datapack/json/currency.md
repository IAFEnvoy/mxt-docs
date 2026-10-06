---
title: currency（货币）
description: 给已注册物品一个面值和一组单向兑换，由 mxt:currency 注册表定义。
aside: false
---

# currency（货币） {#currency}

一条货币定义给一件**已有物品**一个面值和一组单向兑换：它值多少、能换成什么。任意已注册物品都可以当货币，支票台、兑换站与结算服务读的是同一张 `mxt:currency` 注册表。

## 文件位置

`currency` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/currency/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/currency/copper_coin.json` 就是 `example:copper_coin`。模组自带的条目在 `data/mxt/mxt/currency/`；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:currency` 列出这些定义认领的物品。

**用途**：物品货币面值和兑换。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | 无 | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `item` | 物品 id | 无 | 只认领一件物品时的简写，等价于 `items` 里写一个物品 id。 |
| `value` | Long | **必填** | 单件面值，必须大于 `0`。 |
| `unavailable_when` | `ItemCondition` 数组 | `[]` | 每条把一件物品条件和一个原因绑在一起；条件成立时这一栈的货币价值读作 `0`，并显示对应原因。 |
| `exchanges` | 兑换项数组 | **必填** | 单向兑换选项，可以写成空数组。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

`items` 与 `item` 至少要写一个：两个都没写、或者 `value` 不是正数，这条定义在加载期被拒绝。

同一件物品被多条定义命中时只有 `priority` 最大的那条生效，字段默认 `0`；只有 `priority` 相同的两条才回落到注册表顺序：`value` 与 `exchanges` 都按它读，输的那条既不算价值，也不提供兑换。**这与 `items` 里写的是物品还是标签无关**。

### `unavailable_when`

每项由一个已有的物品条件和一段原因文本组成。`reason` 可以写翻译键字符串，也可以写原版文本组件对象。需要玩家上下文的场景（支票台、兑换站与提示框）拿当前操作玩家来判条件；没有实体上下文的纯服务端查询不会擅自猜条件结果。

`data/example/mxt/currency/spirit_stone.json`：

```json
{
  "item": "mxt:spirit_stone",
  "value": 10,
  "unavailable_when": [
    {
      "condition": {"type": "mxt:spirit_storage_not_full"},
      "reason": "tooltip.mxt.currency_spirit_not_full"
    }
  ],
  "exchanges": []
}
```

## 兑换条目

`exchanges` 的条目按数组顺序显示在兑换站的切石机式选项列表里。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cost` | Integer | **必填** | 从输入槽的货币物品里消耗几个，范围 `1..99`。 |
| `result` | `ItemStackTemplate` | **必填** | 兑换成功后产出的物品堆。 |

`result` 用物品堆模板的形状：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | 物品 ID | 无 | **必填**，输出物品。 |
| `count` | Integer | `1` | 输出数量，范围 `1..99`。 |
| `components` | 对象 | 无 | 可选的原版数据组件补丁。 |

::: warning 兑换是单向的

一条 `exchanges` 只描述「从这件货币换出去」。要允许反向兑换，必须在目标货币自己的 `exchanges` 里显式写反向条目。

:::

## 示例

`data/example/mxt/currency/copper_coin.json`，一次认领一批物品：

```json
{
  "items": ["minecraft:iron_nugget", "#example:nuggets"],
  "value": 1,
  "exchanges": []
}
```

`data/example/mxt/currency/iron_coin.json`，用 `item` 简写并给出两条兑换：

```json
{
  "item": "example:iron_coin",
  "value": 10,
  "exchanges": [
    {
      "cost": 1,
      "result": {
        "id": "example:copper_coin",
        "count": 10
      }
    },
    {
      "cost": 10,
      "result": {
        "id": "mxt:gold_coin"
      }
    }
  ]
}
```

标签加带组件输出：

```json
{
  "items": "#minecraft:emeralds",
  "value": 100,
  "exchanges": [
    {
      "cost": 4,
      "result": {
        "id": "minecraft:diamond",
        "components": {
          "minecraft:custom_name": "{\"text\":\"兑换凭证\"}"
        }
      }
    }
  ]
}
```

没有兑换选项的货币仍要写空数组，`exchanges` 是必填字段：

```json
{
  "item": "minecraft:emerald",
  "value": 100,
  "exchanges": []
}
```

## 兑换站行为

兑换站是切石机式界面：输入槽只收带有非空 `exchanges` 的货币物品；右侧列出该货币的全部兑换条目；选中条目后，输入数量达到 `cost` 时结果槽才显示输出。取走结果会扣掉 `cost` 个输入物品。

列表和结果都由服务端菜单确认，客户端只用同步过来的注册表画同一批选项。

## 停用一条定义

条件写在**文件顶层**（一份文件就是一条定义）。条件不成立时这条定义根本不进注册表：

```json
{
  "neoforge:conditions": [
    {"type": "neoforge:never"}
  ],
  "item": "example:legacy_coin",
  "value": 1,
  "exchanges": []
}
```

条件不成立的那条定义等同于不存在：那件物品不是货币，不参与兑换、支票与结算。可用条件见[数据包开发总览](../overview.md#停用一条定义)。

## 校验与加载

- `items` 里只能写已经注册的物品 id 与 `#物品标签`；带 `type` 的匹配器条目按 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) 的形状写。
- `items` 与 `item` 至少要写一个，`value` 必须大于 `0`，否则这条定义加载失败。
- `unavailable_when` 中任一条件成立时，这一栈不参与货币结算，价值读作 `0`。
- `exchanges` 必须存在；没有兑换时写 `[]`。
- 同一件物品被多条定义命中时只有 `priority` 最大的那条生效，同分回落到注册表顺序：`value` 与 `exchanges` 都按它读。
- 每条 `cost` 必须落在 `1..99`。
- `result` 必须是有效的物品堆模板。
- 数据包注册表在世界加载时读取，并随包同步给客户端；改完要重新加载世界或重启服务器，`/reload` 不适用于它。
