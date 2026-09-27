---
title: blueprint_binding（图纸绑定）
aside: false
---

# blueprint_binding（图纸绑定） {#blueprint_binding}

文件位置：`data/<namespace>/mxt/blueprint_binding/<path>.json`

图纸绑定把**已经注册的物品**认成图纸：定义写 `items`，锻造台左侧那几格里的图纸就提供 `blueprints` 列出的蓝图。它不创建物品，蓝图本身在 [forging_blueprint](./forging_blueprint.md) 里定义。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或混合数组 | **必填** | 这份定义认领哪些图纸物品，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。**不能为空**，理由同 [tool_binding](./tool_binding.md)：这张表只能靠物品匹配到达，一条不认领任何物品的定义永远读不到，加载期直接拒绝。 |
| `priority` | Int | `0` | 多条定义匹配同一件物品时数值大者先；相同则按注册表顺序。 |
| `blueprints` | `forging_blueprint` id 数组 | **必填** | 该物品提供的蓝图，不能为空或重复。 |

锻造台左侧三格放入图纸物品后，其提供的蓝图才会出现在蓝图列表中；**三格为空则蓝图列表为空**，没有回退到全注册表的分支。蓝图槽不放入物品就无法开始会话。

**一件图纸物品的两条路**：被某条定义的 `items` 认领，或者那**一堆**自带物品组件 `mxt:forging_blueprints`（写一个 `forging_blueprint` id 数组）。只印一张图纸的一张纸因此不需要任何定义文件。两者**取并集**。

```json
// data/example/mxt/blueprint_binding/sword_manual.json
{
  "items": "example:sword_manual",
  "blueprints": ["example:spirit_sword"]
}
```

不带任何定义文件的临时图纸，直接把列表写在堆上：

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:spirit_sword"]]
```
