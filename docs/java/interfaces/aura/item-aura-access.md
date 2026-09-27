---
title: ItemAuraAccess
---

# ItemAuraAccess

可充能物品实现的**存储**接口，只回答三件事：能装哪些灵气、装进去多少、取出多少。容量从这件物品**动态**算出来——`getCapacity` 收的是这一堆与它的持有者（可以是空），不能在 Java 里写死一个数。

| 成员 | 说明 |
| --- | --- |
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, ItemStack stack)` | 这一堆现在能装多少，按灵气分开；数值算的是**整堆**。 |
| `int getCapacity(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura)` | 单独问一种灵气的容量，默认实现读上面那张表。 |
| `int insert(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | 装进去一种灵气，返回 `amount` 里**没能移动**的数量。 |
| `int extract(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | 取出来一种灵气，返回 `amount` 里**没能移动**的数量。 |

装的是哪种灵气与装了多少记在**物品自己**的 `mxt:spirit_storage` 组件上：一张「灵气 → 已存单位」的表，键是 `Holder<Aura>`，数值是浮点数，灵石、符箓载体与法器共用；这个接口本身按**整单位**交换。所以灵石只把定义当容量来源，数据包改了 `item_aura.type` 也不会把已有存量改读成另一种灵气。

缺组件时读作"满"还是"空"**由物品回答**（灵石读满、符箓读空），不是由组件回答——组件只是一份数据。

存取被问在**任何地方**：展示架读写一张符、热键栏读一件物品、`item_aura` 定义描述一件物品，走的都是它。所以只实现这个接口的物品是**被存进去**的，不会被"按住右键灌"——那个手势是物品额外选择加入的，见 [UseItemAuraAccess](./use-item-aura-access.md)。
