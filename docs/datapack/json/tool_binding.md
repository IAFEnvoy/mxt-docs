---
title: tool_binding（工具绑定）
---

# tool_binding（工具绑定） {#tool_binding}

文件位置：`data/<namespace>/mxt/tool_binding/<path>.json`

**用途**：工具物品提供的锻打方式。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `methods` | `Holder<forging_method>[]` | **必填** | 该工具解锁的锻打方式，不能为空或重复。 |

工具物品通过 `mxt:tool_binding` 物品组件引用本注册表（组件存 `Holder`，物品本身不复制定义）。锻造台右侧三格放入工具后，其解锁的方式才会出现在方法列表中。**可用方法 = 蓝图 `allowed_methods` ∩ 所有已放置工具 `methods` 的并集。** 没有会话（还没选蓝图）或蓝图未声明 `allowed_methods` 时，蓝图一侧不做限制，列表即工具的并集。工具槽在会话进行中**不锁定**，所以中途加一把锤子可以立刻拓宽方法列表。

