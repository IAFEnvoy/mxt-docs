---
title: AuraAccess
---

# AuraAccess

The **aura access** interface implemented by block entities: a display stand or a container exchanges whole units of one aura at a time. The capacity is data-driven (an `item_aura` definition, an environmental pool) and comes from `getCapacity` rather than being hard-coded in Java.

| Member | Description |
| --- | --- |
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity)` | How much of each aura this target accepts. The `entity` is empty for a machine or a display stand driven by a pipe. |
| `int getCapacity(@Nullable LivingEntity entity, Holder<Aura> aura)` | The capacity of one aura; a default that reads the map above. |
| `int insert(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | Moves one aura in; the return value is the part of `amount` that could **not** be moved. |
| `int extract(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | Moves one aura out; the return value is the part of `amount` that could **not** be moved. |
| `static int requireNonNegative(int amount)` | Rejects a negative amount with an `IllegalArgumentException`; call it at the entry of your implementation. |

`simulate = true` only computes, so nothing changes; that is what a caller uses to ask "would this fit". One call handles one aura, so loop over several yourself.

**The parameter is a `Holder<Aura>` rather than a `resource`**: a `resource` is only a numeric system (bounds, an icon, the bars), and it does not know what its own number is for; the `aura` is the identity of *which aura* it is, and it references a `resource` as the unit it is measured in (`Aura.resource()` = "which number do I count in"). So every field, parameter and storage key that means "which aura" uses a `Holder<Aura>` - the access interfaces, item and block stores, the environmental aura pools and `item_aura.type` all do. Conversely, a pure counter has no aura identity and **cannot** be stored in an item (it can enter a player's pool, because pools are keyed by value).
