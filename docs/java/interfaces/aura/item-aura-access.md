---
title: ItemAuraAccess
---

# ItemAuraAccess

物品的灵气存取接口。容量和存取数量均为 `double`，按整堆物品计算，支持小数；计数、槽位与耐久仍是整数。存取模式与返回约定同 [AuraAccess](./aura-access.md)。

| 成员 | 说明 |
| --- | --- |
| `Object2DoubleMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, Provider registries, ItemStack stack)` | 查询整堆物品的容量。 |
| `double getCapacity(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura)` | 查询指定灵气的容量。 |
| `double insert(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | 存入并返回未移动量。 |
| `double extract(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | 取出并返回未移动量。 |

`exact=true` 全额或不写；`simulate=true` 完全只读，两者可以组合。参数与容量必须有限非负。灵石与符箓不能先把存量取整再扣除：存有 `1.75` 时取出 `1.0`，必须剩 `0.75`；精确取出 `2.0` 则拒绝且保持原组件不变。

灵石、符箓与法器的灵气存量使用 `mxt:spirit_storage`；灵力容器通过自己的资源容器映射灵气，并且只允许经此接口存入。缺组件的含义由物品决定：灵石视为满，符箓视为空。已有存量按自己的灵气键读取，定义重载不能把它改读成另一种灵气。

仅实现存储不会启用按住灌注；需要该手势时实现 [UseItemAuraAccess](./use-item-aura-access.md)。计算与同步保留小数，展示保留两位。
