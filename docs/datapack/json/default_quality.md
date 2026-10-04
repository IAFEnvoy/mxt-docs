---
title: default_quality（默认品质）
description: 给一件已有物品一个兜底的默认品质档，它是品质解析的第三层、也是最后一层。
aside: false
---

# default_quality（默认品质） {#default_quality}

`default_quality` 给一件**已有物品**一个兜底的品质档：解析这一堆是哪一档时它排在最后，堆上的 `mxt:quality` 组件与这一堆携带的定义都没有答案时才读它。它不是注册表，而是**物品数据表**，文件固定放在：

```text
data/mxt/data_maps/item/default_quality.json
```

**第一段命名空间必须是表自己的 `mxt`，不是内容包自己的**：内容包要加值，是往 `data/mxt/data_maps/item/` 里再放一个文件。放错命名空间只会在日志里留一条 `Found data map file for non-existent data map type`。

## 字段

| 键 | 类型 | 说明 |
| --- | --- | --- |
| （键） | 物品 id 或 `#物品标签` | **这就是「哪件物品」**——这张表没有 `items` 字段，标签在加载期展开成它当时的每个物品。 |
| （值） | 品质 id | 一个 `mxt:quality` 条目的 id，写成**裸字符串**（如 `"example:common"`）。值就是那一档本身，没有外层字段名。 |

**这张表没有 `priority`**：同一件物品被两个包各写一份时按「后处理者赢」（同一文件里按书写顺序，不同文件按数据包加载顺序），不像另外几张物品数据表那样比值。值级 `replace` 与值级条件的写法见[数据表](../overview.md#数据表data-map)。

## 示例

```json
// data/mxt/data_maps/item/default_quality.json
{
  "values": {
    "minecraft:clay_ball": "example:common",
    "#example:common_materials": "example:common"
  }
}
```

## 它是第三层，也是最后一层

一件物品堆最终是哪一档，按固定的**三层**往下取，先命中的赢：

1. 堆上的 `mxt:quality` **组件**（锻造台结算与画符铭刻写的就是它，[`/quality set`](/player-guide/commands/quality) 与一次成功的 `upgrade` 也写它）；
2. 这一堆**携带的定义**自己声明的 `quality`——一类定义共用一件内置物品，物品本身说不清是哪一档，只有堆上那份定义说得清，它经由那一类定义已登记的载体组件读到；
3. 这张数据表。

**它恰好在这一堆没有定义可问的时候给出答案**：裸的创造模式 / `/give` 物品，以及按物品认领的定义（`artifact` 与 `spirit_herb` 命中一件物品就算数，它们不往堆上写身份组件）。只要堆上带着一份声明了 `quality` 的定义，答案就停在第 2 层；那份定义当前包不再提供（被删掉、或引用没绑定）时才会落到这里。给一批**没有任何定义的普通材料**一个默认档时它最省事。

`/quality clear` 摘掉组件之后，物品退回**携带的定义**那一档，再退回这里。完整顺序与链的关系见 [quality](./quality.md#resolution)。

## 校验与加载

- 值必须指向当前包里**存在**的品质条目：写一个不存在的 id 会让**这个文件**整份解不出来，日志里留一条 `Could not read data map of type mxt:default_quality`，别的数据表不受影响。
- 这张表**随包同步给客户端**：物品提示框、`/picker` 与信息面板都在客户端读品质。
- 数据表在**世界加载时**读取；改完要重新加载世界或重启服务器，`/reload` 不适用于它。
