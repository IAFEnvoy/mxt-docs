---
title: default_quality（默认品质）
description: 给一件已有物品一个兜底的默认品质档，它是品质解析的第三层、也是最后一层。
aside: false
---

# default_quality（默认品质） {#default_quality}

`default_quality` 给一件**已有物品**一个兜底的品质档：解析这一堆是哪一档时它排在最后，堆上的 `mxt:quality` 组件与这一堆携带的定义都没有答案时才读它。

## 文件位置

`default_quality` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/default_quality/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/default_quality/common_materials.json` 就是 `example:common_materials`。本体不为这张注册表提供条目；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，**也没有「值就是一个档位 id」的简写**：哪一档写在必填的 `quality` 字段里。要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:default_quality` 列出这些定义认领的物品。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | **必填** | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `quality` | 品质条目 id | **必填** | 兜底给这一堆哪一档，指向一条 `mxt:quality` 定义。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

同一件物品被多条定义命中时，按每条定义自己的 `priority` **从高到低**选一条，字段默认 `0`；只有 `priority` 相同的两条才回落到注册表顺序。**这与 `items` 里写的是物品还是标签无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。

## 示例

`data/example/mxt/default_quality/common_materials.json`：

```json
{
  "items": ["minecraft:cobblestone", "#example:quality_probe"],
  "quality": "example:poor"
}
```

## 它是第三层，也是最后一层

一件物品堆最终是哪一档，按固定的**三层**往下取，先命中的赢：

1. 堆上的 `mxt:quality` **组件**（锻造台结算与画符铭刻写的就是它，[`/quality set`](/player-guide/commands/quality) 与一次成功的 `upgrade` 也写它）；
2. 这一堆**携带的定义**自己声明的 `quality`——一类定义共用一件内置物品，物品本身说不清是哪一档，只有堆上那份定义说得清，它经由那一类定义已登记的载体组件读到；
3. 这张注册表。

**它恰好在这一堆没有定义可问的时候给出答案**：裸的创造模式 / `/give` 物品，以及按物品认领的定义（`artifact` 与 `spirit_herb` 命中一件物品就算数，它们不往堆上写身份组件）。只要堆上带着一份声明了 `quality` 的定义，答案就停在第 2 层；那份定义当前包不再提供（被删掉、或引用没绑定）时才会落到这里。给一批**没有任何定义的普通材料**一个默认档时它最省事。

`/quality clear` 摘掉组件之后，物品退回**携带的定义**那一档，再退回这里。完整顺序与链的关系见 [quality](./quality.md#resolution)。

## 校验与加载

- `quality` 必须指向当前包里**存在**的品质条目：写一个当前包不提供的 id，注册表里的引用就没有绑定，**整个数据包加载失败**，不是跳过这一条定义。
- 这张注册表**随包同步给客户端**：物品提示框、`/picker` 与信息面板都在客户端读品质。
- 数据包注册表在**世界加载时**读取；改完要重新加载世界或重启服务器，`/reload` 不适用于它。
