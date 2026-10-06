---
title: tool_binding（工具绑定）
aside: false
---

# tool_binding（工具绑定） {#tool_binding}

`tool_binding` 给**已有工具物品**一套锻打方式：这件工具能让锻造台的方法列表里出现哪些手法。它不创建物品，也不改物品自身的属性。

## 文件位置

`tool_binding` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/tool_binding/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/tool_binding/smith_hammer.json` 就是 `example:smith_hammer`。本体不为这张注册表提供条目；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:tool_binding` 列出这些定义认领的物品。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | **必填、不能为空** | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `methods` | `forging_method` id 数组 | **必填** | 该工具解锁的锻打方式；不能为空，也不能重复。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

锻造台右侧三格放入工具后，其解锁的方式才会出现在方法列表中。**可用方法 = 蓝图 `allowed_methods` ∩ 所有已放置工具 `methods` 的并集。** 没有会话（还没选蓝图）或蓝图未声明 `allowed_methods` 时，蓝图一侧不做限制，列表即工具的并集。工具槽在会话进行中**不锁定**，所以中途加一把锤子可以立刻拓宽方法列表。

**一件工具的两条路**：注册表里为那件物品写一条定义，或者那**一堆**自带物品组件 `mxt:forging_methods`（写一个 `forging_method` id 数组，不需要任何定义文件）。两者**取并集**，所以第二把锤子、或临时塞进去的一份手法，只会追加，不会覆盖或删减。工具槽的判定问的就是「这堆能解析出至少一种手法吗」。

`data/example/mxt/tool_binding/smith_hammer.json`：

```json
{
  "items": "example:smith_hammer",
  "methods": ["example:heavy_strike", "example:light_strike"]
}
```

不带任何定义文件的临时工具，直接把列表写在堆上：

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
