---
title: ItemAuraAccess
---

# ItemAuraAccess

The item aura transfer contract. Capacities and transferred amounts are `double` values for the entire stack, including fractions; item counts, slots and durability remain integral. Modes and remainders follow [AuraAccess](./aura-access.md).

| Member | Meaning |
| --- | --- |
| `Object2DoubleMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, Provider registries, ItemStack stack)` | Query the entire stack's capacity. |
| `double getCapacity(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura)` | Query one aura's capacity. |
| `double insert(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | Insert and return the amount not moved. |
| `double extract(@Nullable LivingEntity entity, Provider registries, ItemStack stack, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | Extract and return the amount not moved. |

`exact=true` requires the whole request or no write; `simulate=true` is entirely read-only. The flags can be combined. Requests and capacities must be finite and non-negative. A spirit stone or talisman holding `1.75` must retain `0.75` after extracting `1.0`; an exact request for `2.0` must fail without rewriting the component.

Spirit stones, talismans and artifacts use `mxt:spirit_storage`. Spirit vessels map aura to their resource container and only accept insertion through this interface. Missing components are interpreted by the item: full for stones, empty for talismans. Existing stock keeps its aura identity when definitions reload.

Storage alone does not enable held pouring; opt into [UseItemAuraAccess](./use-item-aura-access.md) for that gesture. Calculations and synchronization retain fractions; presentation uses two decimal places.
