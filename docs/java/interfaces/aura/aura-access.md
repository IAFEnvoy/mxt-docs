---
title: AuraAccess
---

# AuraAccess

通用灵气存取接口。目标按 `Holder<Aura>` 区分灵气，容量、请求量和返回量均为有限非负 `double`，支持小数。方块存储与绑定位置的环境池都可实现它；物品版本见 [ItemAuraAccess](./item-aura-access.md)。

| 成员 | 说明 |
| --- | --- |
| `Object2DoubleMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, Provider registries)` | 查询各灵气容量，持有者可以为空。 |
| `double getCapacity(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura)` | 查询指定灵气容量，默认读容量表。 |
| `double insert(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | 存入，返回未移动量。 |
| `double extract(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | 取出，返回未移动量。 |
| `static double requireNonNegative(double amount)` | 拒绝负数、NaN 与无穷；非法 Java 调用抛出 `IllegalArgumentException`。 |

`exact=true` 要求全额或零写入；`exact=false` 移动能接受的部分。`simulate=true` 只检查，不能写组件、创建附件、触发回调或顺便规范化存量。请求为零时不写入。正常浮点运算误差可以收敛，但不能把空库存中的小额请求当成成功，也不能在正数请求没有造成可表示变化时报告已移动。

返回值 `0.0` 表示全额可移动，原请求量表示完全未移动。一次只处理一种灵气，多种灵气由调用者逐项处理。容量不等于当前库存；查询可抽取量要模拟 `extract`。

灵气身份使用 `Holder<Aura>`；`Aura.resource()` 只是计量该灵气的数值资源。`Provider` 显式传入，因此机器和无持有者场景也能解析定义。计算、存档与同步保留小数，数值展示统一保留两位小数。
