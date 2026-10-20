---
title: Cost
---

# Cost

技能、阵法与其他行为“要付什么”的抽象。一项 `Cost` 只做一件事：拿着付款的上下文把自己算成一份**已绑定的付款事务**（`Transaction`）——一个固定的存储，一个固定的数量。它不问任何存储够不够、不写、两次调用之间也不记东西，所以“这一项多少钱”只有一个地方决定，而“能不能付”与“扣”都属于付款。

| 成员 | 说明 |
| --- | --- |
| `ResultWithData<Transaction> prepare(CostContext context)` | 把这一项算成本次付款的事务：金额在这里求值**一次**，存储从上下文解析，参数就地冻结。没有库存检查、没有脚本调用、不加载区块、不建附件。算不出金额（公式不是有限正数）就在这一步拒付，所以只报了一半价的付款一分不扣。 |
| `MapCodec<? extends Cost> codec()` | 这一种消耗类型的 codec。 |
| `Codec<Cost> TYPED_CODEC` | 按 `type` 字段分派。 |
| `Codec<Cost> CODEC` | 数据文件用的那个：先试带 `type` 的对象，再试 `{ "id": ..., "amount": ... }` 简写（读作 `mxt:resource`）。 |
| `Codec<List<Cost>> LIST_CODEC` | 一次收多项消耗的字段用的列表 codec。 |

`Transaction` 是绑定后的一项费用，`Cost.Transaction` 只有四个成员：

| 成员 | 说明 |
| --- | --- |
| `CostTarget target()` | 这一项从哪个存储出，以及通道种类。同一次付款里两项指向同一个目标，就是同一个存储。 |
| `double amount()` | 固定数量，单位是那个存储自己的单位：实数数值、整数物品、整数银行灵气、一次脚本调用。 |
| `ResultWithData<List<Debit>> execute(boolean simulate)` | 两遍都走这一个方法：传 `true` 只问、什么都不写；传 `false` 真扣自己那条通道，并返回实际扣走的凭据。第一次实扣的结果就是终态，同一项不会被扣第二次。 |
| `Transaction withAmount(double amount)` | 同一个绑定换个固定数量。付款改价就是这么改的，不会重跑原来的公式；`0` 由付款直接去掉，不执行一个空事务。 |

四种固有类型登记在 `mxt:cost_type`：`mxt:resource`、`mxt:aura`、`mxt:item`、`mxt:js`。新增一种 = 写一个实现再在 `MxtRegistries.COST_TYPE` 里登记，字段形状不跟着变——所有消耗字段都是这个数组，写法见[共享数据类型](/datapack/types/shared_data_types#cost)。

付款 `CostPayment` 是唯一的编排口：`price` 只报价，`resourceAmounts()` / `auras()` / `resources()` 是只读投影，`replaceResourceAmounts` 与 `scale` 改账，`test` 模拟一遍，`pay` 先模拟全部再一次实扣。改账改的是账单本身——替换出来的资源费用就是新的固定事务、缩放出来的数量就是新的固定事务——所以模拟与实扣用的是同一份金额，报价之后不会再有第二次求值。

一个目标写两项不是加载错误：执行前用 LoggerDispatcher 输出开发 WARN、运行 DEBUG。条目不合并，模拟与实扣都保持 List 原序，包括脚本位置；同一付款者的相同脚本 id 单独诊断，各调用仍独立。应把一个目标的费用一次性写完。

模拟失败则整笔不实扣。全部模拟通过后，实扣失败或 RuntimeException 只用普通 LOGGER.warn，不分派、不抛出、不回滚、不取消，继续后续费用与业务；最终返回成功与已知真实 Debit。成功不保证全额收齐，失败条目的部分凭据也要保留，未知扣量不得伪造。终态缓存使再次 pay 不再写入。

这套形状为什么这么定、以及重复目标的边界，见[技术细节 · 消耗](/technical/cost)。

付款者与通道由**调用点**提供（`CostContext` 带着付款者与它有哪些通道），数据包只写“要什么”：`mxt:item` / `mxt:js` 需要玩家，缺通道就是拒付而不是报错；阵法维护这类“主人可能不在线”的字段直接点名一个资源账户。**货币不是消耗**：`currency` 的报价与价值乘数永远不进 `Cost`。符箓的灵气条目是这套形状里唯一的例外——它扣的是载体自己灌进去的存量，容量另由一个倍率字段给出。
