---
title: forging_blueprint（锻造图纸）
description: 锻造图纸声明一次锻造要什么材料、允许哪些锻打方式、锻打条与目标区间、收尾模式、品质阶梯与失败结算。
aside: false
---

# forging_blueprint（锻造图纸）

文件位置：`data/<namespace>/mxt/forging_blueprint/<path>.json`

**用途**：锻造目标和品质结算。

一张图纸描述一次完整的锻造：要什么材料、允许哪些锻打方式、当前值要落进哪个区间、最后一锤要打什么花样、打得够好是什么品质、打坏了剩什么。图纸怎么发到玩家手里见[图纸绑定](./blueprint_binding.md)，单次锻打怎么写见[锻造手法](./forging_method.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `input` | 材料需求数组 | **必填** | 无序材料需求，每项为 `{ "id": <物品 ID>, "count": <数量> }`，`count` 默认 `1`。 |
| `allowed_methods` | 锻打方式 id、`#标签` 或数组 | 空 | 本蓝图允许的锻打方式。 |
| `meter_min` / `meter_max` | Integer | **必填** | 锻打条边界，必须跨过 `0`。 |
| `target_min` / `target_max` | Integer | **必填** | 成功区间，必须位于条边界内。 |
| `finish_pattern` | 收尾模式对象 | 空模式 | 最后一锤的六步模式。 |
| `max_steps` | Integer | `0` | 最大步数。写 `0` 或省略则该蓝图永不因步数失败。 |
| `quality_by_extra_steps` | 档位数组 | **必填** | 额外步数到品质的升序映射。最后一项必须为 `2147483647`。 |
| `result` | Identifier | **必填** | 成功输出物品 ID。 |
| `complete_action` | `EntityAction` | `mxt:no_op` | 成功行为，作用于玩家。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 失败行为，作用于玩家。 |
| `failure_settlement` | 失败结算对象 | 销毁输入 | 失败时的返还和材料损失。 |

## `input`

**顺序无关**：锻造台只要求 15 格输入槽里合计持有每项声明的数量，材料来自哪些槽位不影响判定。

加载期会拒绝空列表、超过 15 项、同一物品重复出现，以及无法解析的物品 ID。因为数据包注册表早于物品组件绑定解析，`input` 用 `id` + `count` 而不是物品堆。

材料按**物品**匹配，不看物品堆上的组件：一摞带品质组件的材料与普通的同名物品在"够不够"上完全一样。

## `allowed_methods`

省略或写空列表 = **不做限制**，可用方法就完全由工具决定。一个标签即使一个成员都没解析出来也算一条限制声明，和"空列表"不是同一件事：标签的成员在加载期读不出来，所以这里只认"写没写"。

## 锻打条与目标区间

`meter_min` / `meter_max` / `target_min` / `target_max` 一起校验：`meter_min` 必须小于 `0`，`meter_max` 必须大于 `0`，并且 `meter_min ≤ target_min ≤ target_max ≤ meter_max`。

## `finish_pattern`

字段为 `steps`（六个锻打方式）和 `required_suffix_steps`（`0..6`）。`required_suffix_steps > 0` 时必须提供六步模式，即 `steps` 正好六项；写成 `0` 时 `steps` 要么空、要么也写满六项。**只有 `steps` 的末 `N` 项会被校验**，前 `6-N` 项既不显示也不判定——界面上它们是屏障格。

成功要求最终值落入目标区间，并且要求的末尾步骤完全匹配；额外步数决定品质。

## `quality_by_extra_steps`

每项是 `{ "max_extra_steps": <额外步数上限>, "quality": <品质 id> }`，档位必须**升序**，并且最后一项的 `max_extra_steps` 必须是 `2147483647`。

品质取第一个满足 `有效额外步数 ≤ max_extra_steps` 的档。**额外步数 = 实际步数 − 最短步数**，最短步数在会话开始时算出来，不是"数值超出目标多少"；材料的锻造修正会先作用在这个额外步数上（有效额外步数 = 额外步数 ÷ 修正），修正取自这场会话**锁定的材料**，多种材料取其中最低的一档。

**这张档位表就在这份蓝图的 tooltip 里逐行画出来**（每行用该档品质自己的 `color`，末项写成"额外步数不限"）；交工后右侧读数区还会写一行「品质：<名>」，用的是服务端写进成品的那一档——界面**不预测**档位。

## `max_steps`

`max_steps` 是**唯一**的失败来源，默认 `0` 表示不限步。写了正数之后，步数已经达到它时那一次锻打根本不执行，直接按失败结算；不写（或写 `0`）则玩家可以一直锻打到满足条件为止。

## `failure_settlement`

失败时的返还。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `result` | Identifier | 无 | 失败时可能产出的"废料"。 |
| `input_return_ratio` | Double `0..1` | `0` | 整份材料原样退回的概率。 |
| `material_loss_ratio` | Double `0..1` | `1` | 材料损失比例；它的反面 `1 - 该值` 是产出废料的概率。 |

结算是**两次独立掷骰**：先按 `input_return_ratio` 决定要不要把锁定的材料放回输入格（放不下的掉给玩家），再按 `1 - material_loss_ratio` 决定要不要额外给一份废料。所以"既退回材料、又拿到废料"是会发生的。整个 `failure_settlement` 省略就是什么都不还，**写了 `result` 但没有把 `material_loss_ratio` 调低到 `1` 以下时那份废料永远不会出现**。

## 示例

```json
{
  "input": [
    { "id": "minecraft:iron_ingot", "count": 2 },
    { "id": "minecraft:stick", "count": 1 }
  ],
  "allowed_methods": [
    "example:light_strike", "example:heavy_strike",
    "example:quench", "example:temper"
  ],
  "meter_min": -8,
  "meter_max": 8,
  "target_min": 2,
  "target_max": 4,
  "finish_pattern": {
    "steps": [
      "example:light_strike", "example:heavy_strike", "example:light_strike",
      "example:heavy_strike", "example:light_strike", "example:heavy_strike"
    ],
    "required_suffix_steps": 2
  },
  "max_steps": 24,
  "quality_by_extra_steps": [
    { "max_extra_steps": 0, "quality": "example:flawless" },
    { "max_extra_steps": 4, "quality": "example:refined" },
    { "max_extra_steps": 2147483647, "quality": "example:common" }
  ],
  "result": "minecraft:iron_sword",
  "complete_action": { "type": "mxt:add_resource", "resource": "example:qi", "amount": 5 },
  "fail_action": { "type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 100 },
  "failure_settlement": {
    "result": "minecraft:iron_nugget",
    "input_return_ratio": 0.25,
    "material_loss_ratio": 0.75
  }
}
```
