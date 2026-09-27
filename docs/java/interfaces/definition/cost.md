---
title: Cost
---

# Cost

技能、阵法与其他行为"要付什么"的抽象。一个 `Cost` 只回答"这一项要扣什么"（求值加通道检查，只读），**实际校验与扣除由 `CostTransaction` 用同一份计划完成**：`plan` 逐项求值与查通道，`commit` 按通道写入，中途任何一项拒付就把已经写下的还原。

| 成员 | 说明 |
| --- | --- |
| `Either<Charge, CostFailure> charge(CostContext context)` | 按上下文给出的通道求值这一项。右边是失败：公式算不出有限的正当数量，或这个上下文没有需要的通道。**这里什么都不写。** |
| `MapCodec<? extends Cost> codec()` | 这一种消耗类型的 codec。 |
| `Codec<Cost> TYPED_CODEC` | 按 `type` 字段分派。 |
| `Codec<Cost> CODEC` | 数据文件用的那个：先试带 `type` 的对象，再试 `{ "id": ..., "amount": ... }` 简写（读作 `mxt:resource`）。 |
| `Codec<List<Cost>> LIST_CODEC` | 一次收多项消耗的字段用的列表 codec。 |

四种固有类型登记在 `mxt:cost_type`：`mxt:resource`、`mxt:aura`、`mxt:item`、`mxt:js`。新增一种 = 写一个实现再在 `MxtRegistries.COST_TYPE` 里登记，字段形状不跟着变——所有消耗字段都是这个数组，写法见[共享数据类型](/datapack/types/shared_data_types#cost)。

付款者与通道由**调用点**提供（`CostContext` 带着付款者与它有哪些通道），数据包只写"要什么"：`mxt:item` / `mxt:js` 需要玩家，缺通道就是拒付而不是报错；阵法维护这类"主人可能不在线"的字段直接点名一个资源账户。**货币不是消耗**：`currency` 的报价与价值乘数永远不进 `Cost`。符箓的灵气条目是这套形状里唯一的例外——它扣的是载体自己灌进去的存量，容量另由一个倍率字段给出。
