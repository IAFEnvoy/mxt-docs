---
title: ItemAuraAccess
---

# ItemAuraAccess

The **storage** interface implemented by chargeable items, which answers only three things: which auras it can take, how much went in and how much came out. The capacity is computed from the stack itself - `getCapacity` takes the stack and its holder (which may be empty) - so a capacity must never be hard-coded in Java.

| Member | Description |
| --- | --- |
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, ItemStack stack)` | What this stack takes right now, split by aura; the numbers are for the **whole stack**. |
| `int getCapacity(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura)` | The capacity of one aura in this stack; a default that reads the map above. |
| `int insert(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | Adds one aura to this stack; the return value is the part of `amount` that could **not** be moved. |
| `int extract(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | Takes one aura out of this stack; the return value is the part of `amount` that could **not** be moved. |

Which aura is stored and how much of it is recorded on the item itself by the `mxt:spirit_storage` component: a table of "aura → stored amount" keyed by `Holder<Aura>` with fractional values, shared by spirit stones, talisman carriers and artifacts, while this interface itself exchanges **whole units**. That is why a spirit stone treats its definition only as the source of the capacity, and does not re-read an existing store as another aura when a datapack changes `item_aura.type`.

A missing component reads as "full" for a spirit stone and as "empty" for a talisman, and that answer is **given by the item**, not by the component - the component is only data.

Storage is asked **from anywhere**: a display stand reading and writing a talisman, the hotbar reading an item and an `item_aura` definition describing an item all use it. So an item that only implements this interface is **stored into**, and is not "poured into by holding right-click" - that gesture is something an item separately opts into, see [UseItemAuraAccess](./use-item-aura-access.md).
