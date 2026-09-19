---
title: forging_blueprint（锻造图纸）
---

# forging_blueprint（锻造图纸） {#forging_blueprint}

文件位置：`data/<namespace>/mxt/forging_blueprint/<path>.json`

**用途**：锻造目标和品质结算。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `input` | `List<ForgingMaterial>` | **必填** | 无序材料需求，每项为 `{ "id": <物品 ID>, "count": <数量> }`，`count` 默认 `1`。 |
| `allowed_methods` | `HolderSet<forging_method>` | 空 | 本蓝图允许的锻打方式。可写 ID 列表、单个 `"#命名空间:标签"`，或整个省略。**省略或写空列表 = 不做限制**，可用方法就完全由工具决定。 |
| `meter_min` / `meter_max` | Integer | **必填** | 锻打条边界，必须跨过 `0`。 |
| `target_min` / `target_max` | Integer | **必填** | 成功区间，必须位于条边界内。 |
| `finish_pattern` | Object | 空模式 | 最后六步模式。 |
| `max_steps` | Integer | 无 | 最大步数。**省略则该蓝图永不因步数失败。** |
| `quality_by_extra_steps` | `List<QualityThreshold>` | **必填** | 额外步数到品质的升序映射。最后一项必须为 `2147483647`。 |
| `result` | Identifier | **必填** | 成功输出物品 ID。 |
| `complete_action` | `EntityAction` | `mxt:no_op` | 成功行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 失败行为。 |
| `failure_settlement` | Object | 销毁输入 | 失败时的返还和材料损失。 |

`input` **顺序无关**：锻造台只要求 15 格输入槽里合计持有每项声明的数量，材料来自哪些槽位不影响判定。数据包加载期会拒绝空列表、超过 15 项、同一物品重复出现以及无法解析的物品 ID。因为原生数据包注册表早于物品组件绑定解析，`input` 使用 `id` + `count` 而不是 `ItemStack`。

`finish_pattern` 字段为 `steps`（六个锻打方式）和 `required_suffix_steps`（`0..6`）。`required_suffix_steps > 0` 时必须提供六步模式。**只有 `steps` 的末 `N` 项会被校验**，前 `6-N` 项既不显示也不判定 —— 界面上它们是屏障格。成功要求最终值落入目标区间，并且要求的末尾步骤完全匹配；额外步数决定品质。

`max_steps` 是**唯一**的失败来源：定义后，达到该步数仍未满足完成条件即判定失败；未定义时玩家可以一直锻打到满足条件为止。

