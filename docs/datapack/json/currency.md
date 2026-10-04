---
title: currency（货币）
description: 给已注册物品一个面值和一组单向兑换，由 mxt:currency 数据表定义。
aside: false
---

# currency（货币） {#currency}

一条货币定义给一件**已有物品**一个面值和一组单向兑换：它值多少、能换成什么。任意已注册物品都可以当货币，支票台、兑换站与结算服务读的是同一张 `mxt:currency` 数据表。

## 文件位置

`currency` 是一张**物品数据表**（NeoForge Registry Data Map），不是注册表，文件固定放在：

```text
data/mxt/data_maps/item/currency.json
```

**第一段命名空间必须是表自己的 `mxt`，不是内容包自己的**：内容包要加值，是往 `data/mxt/data_maps/item/` 里再放一个文件。放错命名空间只会在日志里留一条 `Found data map file for non-existent data map type`。

`values` 的键就是**物品 id 或 `#物品标签`**（标签在加载期展开成它当时的每个物品），值是下面字段表描述的那个对象——这张表**没有 `items` 字段**，旧的单物品简写 `item` 也一并取消。文件级的 `replace` / `remove`，以及值级的 `{"value": …, "replace": true}` 与**值级** `neoforge:conditions`，见[数据表](../overview.md#数据表data-map)。

**用途**：物品货币面值和兑换。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `priority` | Int | `0` | 同一件物品被多份值命中时的先后：数值大者先；**同分后处理者赢**（同一文件里按书写顺序，不同文件按数据包加载顺序）。 |
| `value` | Long | **必填** | 单件面值，必须大于 `0`。 |
| `unavailable_when` | `ItemCondition` 数组 | `[]` | 每条把一件物品条件和一个原因绑在一起；条件成立时这一栈的货币价值读作 `0`，并显示对应原因。 |
| `exchanges` | 兑换项数组 | **必填** | 单向兑换选项，可以写成空数组。 |

同一件物品被两份值同时命中时只有 `priority` 最大的那份生效（**同分取后处理的那份**）：`value` 与 `exchanges` 都按它读，输的那份既不算价值，也不提供兑换。

### `unavailable_when`

每项由一个已有的物品条件和一段原因文本组成。`reason` 可以写翻译键字符串，也可以写原版文本组件对象。需要玩家上下文的场景（支票台、兑换站与提示框）拿当前操作玩家来判条件；没有实体上下文的纯服务端查询不会擅自猜条件结果。

```json
{
  "values": {
    "mxt:spirit_stone": {
      "value": 10,
      "unavailable_when": [
        {
          "condition": { "type": "mxt:spirit_storage_not_full" },
          "reason": "tooltip.mxt.currency_spirit_not_full"
        }
      ],
      "exchanges": []
    }
  }
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
  "values": {
    "#example:copper_coins": {
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
  }
}
```

铁币用物品 id 直接作键：

```json
{
  "values": {
    "mxt:iron_coin": {
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
  }
}
```

物品标签加带组件输出：

```json
{
  "values": {
    "#minecraft:emeralds": {
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
  }
}
```

没有兑换选项的货币仍要写空数组，`exchanges` 是必填字段：

```json
{
  "values": {
    "minecraft:emerald": {
      "value": 100,
      "exchanges": []
    }
  }
}
```

## 兑换站行为

兑换站是切石机式界面：输入槽只收带有非空 `exchanges` 的货币物品；右侧列出该货币的全部兑换条目；选中条目后，输入数量达到 `cost` 时结果槽才显示输出。取走结果会扣掉 `cost` 个输入物品。

列表和结果都由服务端菜单确认，客户端只用同步过来的数据表画同一批选项。

## 停用一条值

条件**只能写在某一个值里**（下面这个示例就是值级写法）；写在文件顶层会被静默忽略，值照常加上：

```json
{
  "values": {
    "example:legacy_coin": {
      "neoforge:conditions": [
        { "type": "neoforge:never" }
      ],
      "value": 1,
      "exchanges": []
    }
  }
}
```

条件不成立的那个值等同于没写：那件物品不是货币，不参与兑换、支票与结算。可用条件见[数据包开发总览](../overview.md#停用一条定义)。

## 校验与加载

- 键必须是物品 id 或 `#物品标签`。
- `value` 必须是正整数（`> 0`）。
- `unavailable_when` 中任一条件成立时，这一栈不参与货币结算，价值读作 `0`。
- `exchanges` 必须存在；没有兑换时写 `[]`。
- 同一件物品被多份值命中时只有 `priority` 最大的那份生效，同分取后处理的那份：`value` 与 `exchanges` 都按它读。
- 每条 `cost` 必须落在 `1..99`。
- `result` 必须是有效的物品堆模板。
- 数据表在世界加载时读取，并在客户端加入时同步；改完要重新加载世界或重启服务器，`/reload` 不适用于它。
