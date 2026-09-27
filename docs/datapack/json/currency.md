---
title: currency（货币）
description: 给已注册物品一个面值和一组单向兑换，由 mxt:currency 注册表定义。
aside: false
---

# currency（货币） {#currency}

一条货币定义给一件**已有物品**一个面值和一组单向兑换：它值多少、能换成什么。任意已注册物品都可以当货币，支票台、兑换站与结算服务读的是同一份 `mxt:currency` 注册表。

## 文件位置

货币文件放在数据包的 `data/<namespace>/mxt/currency/`。

**用途**：物品货币面值和兑换。

文件名对应它的 ID。例如：

```text
data/example/mxt/currency/iron_coin.json
```

它的定义 ID 是 `example:iron_coin`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | 与 `item` 二选一 | 可作为该货币的物品集合：单个物品 ID、物品标签或混合数组。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先（见 [匹配器](/datapack/types/shared_data_types#itemmatcher)）；相同则按注册表顺序。 |
| `item` | 物品 ID | 无 | 单物品简写，等同于只写这一项的 `items`。 |
| `value` | Long | **必填** | 单件面值，必须大于 `0`。 |
| `unavailable_when` | `ItemCondition` 数组 | `[]` | 每条把一件物品条件和一个原因绑在一起；条件成立时这一栈的货币价值读作 `0`，并显示对应原因。 |
| `exchanges` | 兑换项数组 | **必填** | 单向兑换选项，可以写成空数组。 |

`items` 与 `item` 至少提供一个。同一件物品被两条货币定义同时认领时只有 `priority` 最大的那条生效（见 [匹配器](/datapack/types/shared_data_types#itemmatcher)）：`value` 与 `exchanges` 都按它读，输的那条既不算价值，也不提供兑换。推荐用 `items`，它能同时支持物品与标签并支持通配符、正则这类匹配条目。

### `unavailable_when`

每项由一个已有的物品条件和一段原因文本组成。`reason` 可以写翻译键字符串，也可以写原版文本组件对象。需要玩家上下文的场景（支票台、兑换站与提示框）拿当前操作玩家来判条件；没有实体上下文的纯服务端查询不会擅自猜条件结果。

```json
{
  "items": "mxt:spirit_stone",
  "value": 10,
  "unavailable_when": [
    {
      "condition": { "type": "mxt:spirit_storage_not_full" },
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

铜币提供单向兑换：

```json
{
  "items": ["mxt:copper_coin", "#example:copper_coins"],
  "value": 1,
  "exchanges": [
    {
      "cost": 10,
      "result": {
        "id": "mxt:iron_coin"
      }
    }
  ]
}
```

只匹配一件物品时可以写 `item` 简写：

```json
{
  "item": "mxt:iron_coin",
  "value": 10,
  "exchanges": [
    {
      "cost": 1,
      "result": {
        "id": "mxt:copper_coin",
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

物品标签加带组件输出：

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
  "items": "minecraft:emerald",
  "value": 100,
  "exchanges": []
}
```

## 兑换站行为

兑换站是切石机式界面：输入槽只收带有非空 `exchanges` 的货币物品；右侧列出该货币的全部兑换条目；选中条目后，输入数量达到 `cost` 时结果槽才显示输出。取走结果会扣掉 `cost` 个输入物品。

列表和结果都由服务端菜单确认，客户端只用同步过来的注册表画同一批选项。

## 停用一条定义

把 NeoForge 的资源条件写进货币定义自己的文件，条件不成立的条目不会进注册表：

```json
{
  "neoforge:conditions": [
    { "type": "neoforge:never" }
  ],
  "value": 1
}
```

条件不成立时这条货币等同不存在：不参与兑换、支票与结算，指向它的引用也会跟着解码失败。可用条件见[数据包开发总览](../overview.md#停用一条定义)。

## 校验与加载

- `items` 与 `item` 至少提供一个，两者合并之后不能为空。
- `value` 必须是正整数（`> 0`）。
- `unavailable_when` 中任一条件成立时，这一栈不参与货币结算，价值读作 `0`。
- `exchanges` 必须存在；没有兑换时写 `[]`。
- 同一件物品被多条定义同时认领时只有 `priority` 最大的那条生效：`value` 与 `exchanges` 都按它读。
- 每条 `cost` 必须落在 `1..99`。
- `result` 必须是有效的物品堆模板。
- 定义在世界加载时校验，并在客户端加入时同步；改完要重新加载世界或重启服务器，`/reload` 不适用于数据包注册表。
