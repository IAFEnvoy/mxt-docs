---
title: blueprint_binding（图纸绑定）
aside: false
---

# blueprint_binding（图纸绑定） {#blueprint_binding}

`blueprint_binding` 把**已经注册的物品**认成图纸：锻造台左侧那几格里的图纸提供它 `blueprints` 列出的蓝图。它不创建物品，蓝图本身在 [forging_blueprint](./forging_blueprint.md) 里定义。

## 文件位置

`blueprint_binding` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/blueprint_binding/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/blueprint_binding/sword_manual.json` 就是 `example:sword_manual`。本体不为这张注册表提供条目；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:blueprint_binding` 列出这些定义认领的物品。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | **必填、不能为空** | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `blueprints` | `forging_blueprint` id 数组 | **必填** | 该物品提供的蓝图；不能为空，也不能重复。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

锻造台左侧三格放入图纸物品后，其提供的蓝图才会出现在蓝图列表中；**三格为空则蓝图列表为空**，没有回退到全注册表的分支。蓝图槽不放入物品就无法开始会话。

**一件图纸物品的两条路**：注册表里为那件物品写一条定义，或者那**一堆**自带物品组件 `mxt:forging_blueprints`（写一个 `forging_blueprint` id 数组）。只印一张图纸的一张纸因此不需要任何定义文件。两者**取并集**。

`data/example/mxt/blueprint_binding/sword_manual.json`：

```json
{
  "items": "example:sword_manual",
  "blueprints": ["example:iron_sword"]
}
```

不带任何定义文件的临时图纸，直接把列表写在堆上：

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:iron_sword"]]
```
