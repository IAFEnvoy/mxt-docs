---
title: tool_binding（工具绑定）
aside: false
---

# tool_binding（工具绑定） {#tool_binding}

文件位置：`data/<namespace>/mxt/tool_binding/<path>.json`

工具绑定给**已有工具物品**一套锻打方式：这件工具能让锻造台的方法列表里出现哪些手法。它不创建物品，也不改物品自身的属性。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或混合数组 | **必填** | 这份定义认领哪些工具物品，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。**不能为空**：这张表只能靠物品匹配到达，一条不认领任何物品的定义永远读不到，所以加载期直接拒绝。 |
| `priority` | Int | `0` | 多条定义匹配同一件物品时数值大者先。 |
| `methods` | `forging_method` id 数组 | **必填** | 该工具解锁的锻打方式，不能为空或重复。 |

锻造台右侧三格放入工具后，其解锁的方式才会出现在方法列表中。**可用方法 = 蓝图 `allowed_methods` ∩ 所有已放置工具 `methods` 的并集。** 没有会话（还没选蓝图）或蓝图未声明 `allowed_methods` 时，蓝图一侧不做限制，列表即工具的并集。工具槽在会话进行中**不锁定**，所以中途加一把锤子可以立刻拓宽方法列表。

**一件工具的两条路**：被某条定义的 `items` 认领（一件物品也可以只为自己写一条定义），或者那**一堆**自带物品组件 `mxt:forging_methods`（写一个 `forging_method` id 数组，不需要任何定义文件）。两者**取并集**，所以第二把锤子、或临时塞进去的一份手法，只会追加，不会覆盖或删减。工具槽的判定问的就是「这堆能解析出至少一种手法吗」。

这份定义放在 `data/example/mxt/tool_binding/smith_hammer.json`：

```json
{
  "items": "example:smith_hammer",
  "methods": [
    "example:heavy_strike", "example:light_strike",
    "example:quench", "example:temper"
  ]
}
```

不带任何定义文件的临时工具，直接把列表写在堆上：

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
