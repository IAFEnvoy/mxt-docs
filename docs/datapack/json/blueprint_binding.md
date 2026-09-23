---
title: blueprint_binding（图纸绑定）
aside: false
---

# blueprint_binding（图纸绑定） {#blueprint_binding}

文件位置：`data/<namespace>/mxt/blueprint_binding/<path>.json`

**用途**：蓝图物品提供的锻造蓝图。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blueprints` | `Holder<forging_blueprint>[]` | **必填** | 该物品提供的蓝图，不能为空或重复。 |

蓝图/书籍物品通过 `mxt:blueprint_binding` 物品组件引用本注册表。锻造台左侧三格放入蓝图物品后，其提供的蓝图才会出现在蓝图列表中；**三格为空则蓝图列表为空**，没有回退到全注册表的分支。蓝图槽不放入物品就无法开始会话。

