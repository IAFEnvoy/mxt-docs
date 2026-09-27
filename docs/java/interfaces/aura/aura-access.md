---
title: AuraAccess
---

# AuraAccess

方块实体实现的**灵气存取**接口：展示架、容器这类"能存一份灵气"的方块实体按**整单位**交换某一种灵气。容量是数据包算出来的（`item_aura`、环境池那一套），由 `getCapacity` 给出，不在 Java 里写死。

| 成员 | 说明 |
| --- | --- |
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity)` | 这个目标每种灵气能装多少。没有持有者时（机器、被管道驱动的展示架）`entity` 为空。 |
| `int getCapacity(@Nullable LivingEntity entity, Holder<Aura> aura)` | 单独问一种灵气的容量，默认实现读上面那张表。 |
| `int insert(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | 存进去一种灵气，返回 `amount` 里**没能移动**的数量。 |
| `int extract(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | 取出来一种灵气，返回 `amount` 里**没能移动**的数量。 |
| `static int requireNonNegative(int amount)` | 负数直接抛 `IllegalArgumentException`，实现的入口套一下。 |

`simulate = true` 只算不写，用来预判"装不装得下"，状态一点都不变。一次调用只处理一种灵气，多种要自己循环。

**参数是 `Holder<Aura>` 而不是 `resource`**：`resource` 只是一套数值系统（边界、图标、资源条），它不知道自己这个数是干什么用的；`aura` 才是"哪一种灵气"的身份，它引用一个 `resource` 作为自己被计量的单位（`Aura.resource()` = "我用哪个数计量"）。所以凡是"哪一种灵气"的字段、参数与存储键都用 `Holder<Aura>`——存取接口、物品与方块存储、环境灵气池、`item_aura.type` 都是。反过来，纯计数器没有灵气身份，**不能**被存进物品（它能进玩家的池子，因为池子按值开键）。
