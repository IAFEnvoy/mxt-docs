---
title: tool_binding（工具绑定）
aside: false
---

# tool_binding（工具绑定） {#tool_binding}

`tool_binding` 是一张**物品数据表**（NeoForge Registry Data Map），不是注册表，文件固定放在 `data/mxt/data_maps/item/tool_binding.json`。**第一段命名空间必须是表自己的 `mxt`，不是内容包自己的**：内容包要加值，是往 `data/mxt/data_maps/item/` 里再放一个文件。`values` 的键就是**物品 id 或 `#物品标签`**（标签在加载期展开成它当时的每个物品），值是下面字段表描述的那个对象——这张表**没有 `items` 字段**。写法详见[数据表](../overview.md#数据表data-map)。

工具绑定给**已有工具物品**一套锻打方式：这件工具能让锻造台的方法列表里出现哪些手法。它不创建物品，也不改物品自身的属性。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `priority` | Int | `0` | 同一件物品被多份值命中时的先后：数值大者先；**同分后处理者赢**（同一文件里按书写顺序，不同文件按数据包加载顺序）。 |
| `methods` | `forging_method` id 数组 | **必填** | 该工具解锁的锻打方式，不能为空或重复。 |

锻造台右侧三格放入工具后，其解锁的方式才会出现在方法列表中。**可用方法 = 蓝图 `allowed_methods` ∩ 所有已放置工具 `methods` 的并集。** 没有会话（还没选蓝图）或蓝图未声明 `allowed_methods` 时，蓝图一侧不做限制，列表即工具的并集。工具槽在会话进行中**不锁定**，所以中途加一把锤子可以立刻拓宽方法列表。

**一件工具的两条路**：数据表里为那件物品写一条值，或者那**一堆**自带物品组件 `mxt:forging_methods`（写一个 `forging_method` id 数组，不需要任何数据表文件）。两者**取并集**，所以第二把锤子、或临时塞进去的一份手法，只会追加，不会覆盖或删减。工具槽的判定问的就是「这堆能解析出至少一种手法吗」。

数据表放在 `data/mxt/data_maps/item/tool_binding.json`：

```json
{
  "values": {
    "example:smith_hammer": {
      "methods": [
        "example:heavy_strike", "example:light_strike",
        "example:quench", "example:temper"
      ]
    }
  }
}
```

不带任何定义文件的临时工具，直接把列表写在堆上：

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
