---
title: resource_bar_context（资源条上下文）
description: 资源条上下文族 resource_bar_context 的五个 ID、取数来源、默认值与显示名规则。
---

# resource_bar_context（资源条上下文）

上下文从实体或客户端状态里提取当前值、最小值、最大值和最后变化 tick，并用传入的数值 ID 生成显示名。它写在 [resource](../../json/resource.md) 内联 `bars` 的 `context` 里。

这一族由模组注册，数据包只能选用，不能新增。灵气区块的环境储存上限是另一族，见[灵气上限类型](./aura-maximum.md)。

上下文通过 **ID 字符串**选择，不是 `type` 对象：它写在资源条的 `context` 里，只写那一串 ID 本身。`context` 省略时按 `mxt:self_hud` 算。上下文没有 JSON 字段，数据包也加不了第六项。

| ID | 布局 | 说明 |
| --- | --- | --- |
| `mxt:self_hud` | 自我 HUD | 读取实体上存下来的数值 |
| `mxt:target_overlay` | 目标浮层 | 读取实体上存下来的数值 |
| `mxt:boss_overlay` | Boss 浮层 | 读取实体上存下来的数值 |
| `mxt:environment_concentration` | 自我 HUD | 只在客户端读同步下来的环境灵气模板，不含区块库存以及方块、阵法的贡献 |
| `mxt:actual_concentration` | 自我 HUD | 只在客户端读同步下来的最终浓度，环境、区块库存、方块、阵法全都算上 |

```json
{
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1}
    }
  ]
}
```

三个读已存数值的上下文在这条数值还没被初始化时不给值，那条资源条不画。两条浓度上下文要求这条数值有对应的[灵气定义](../../json/aura.md)：没有定义，或那个池子的最大值与当前值都不为正时，它们同样不给值。

两条浓度上下文报的最小值恒为 `0`，也没有变更时刻，所以 `mxt:recently_changed` 对它们永远不成立。显示名按数值名生成：`mxt:self_hud` 直接用数值名，`mxt:target_overlay` 与 `mxt:boss_overlay` 加「目标 / Boss」前缀，两条浓度上下文加「环境 / 实际」前缀与「浓度」后缀，所以数值名是「灵气」时分别显示成「环境灵气浓度」与「实际灵气浓度」。

`mxt:target_overlay` 与 `mxt:boss_overlay` 按 `anchor` 分左右两遍绘制，写 `anchor: right` 的目标条就画在右边。
