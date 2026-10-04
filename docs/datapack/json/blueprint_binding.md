---
title: blueprint_binding（图纸绑定）
aside: false
---

# blueprint_binding（图纸绑定） {#blueprint_binding}

`blueprint_binding` 是一张**物品数据表**（NeoForge Registry Data Map），不是注册表，文件固定放在 `data/mxt/data_maps/item/blueprint_binding.json`。**第一段命名空间必须是表自己的 `mxt`，不是内容包自己的**：内容包要加值，是往 `data/mxt/data_maps/item/` 里再放一个文件。`values` 的键就是**物品 id 或 `#物品标签`**（标签在加载期展开成它当时的每个物品），值是下面字段表描述的那个对象——这张表**没有 `items` 字段**。写法详见[数据表](../overview.md#数据表data-map)。

图纸绑定把**已经注册的物品**认成图纸：数据表里为那件物品写一条值，锻造台左侧那几格里的图纸就提供 `blueprints` 列出的蓝图。它不创建物品，蓝图本身在 [forging_blueprint](./forging_blueprint.md) 里定义。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `priority` | Int | `0` | 同一件物品被多份值命中时的先后：数值大者先；**同分后处理者赢**（同一文件里按书写顺序，不同文件按数据包加载顺序）。 |
| `blueprints` | `forging_blueprint` id 数组 | **必填** | 该物品提供的蓝图，不能为空或重复。 |

锻造台左侧三格放入图纸物品后，其提供的蓝图才会出现在蓝图列表中；**三格为空则蓝图列表为空**，没有回退到全注册表的分支。蓝图槽不放入物品就无法开始会话。

**一件图纸物品的两条路**：数据表里为那件物品写一条值，或者那**一堆**自带物品组件 `mxt:forging_blueprints`（写一个 `forging_blueprint` id 数组）。只印一张图纸的一张纸因此不需要任何数据表文件。两者**取并集**。

```json
// data/mxt/data_maps/item/blueprint_binding.json
{
  "values": {
    "example:sword_manual": {
      "blueprints": ["example:spirit_sword"]
    }
  }
}
```

不带任何定义文件的临时图纸，直接把列表写在堆上：

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:spirit_sword"]]
```
