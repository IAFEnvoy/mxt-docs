---
title: AuraAccess
---

# AuraAccess

A general aura transfer contract. Targets distinguish auras by `Holder<Aura>`; capacities, requests and remainders are finite, non-negative `double` values, including fractions. Block stores and position-bound world pools can implement it. See [ItemAuraAccess](./item-aura-access.md) for items.

| Member | Meaning |
| --- | --- |
| `Object2DoubleMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, Provider registries)` | Query capacity by aura; the holder may be absent. |
| `double getCapacity(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura)` | Query one aura's capacity; reads the map by default. |
| `double insert(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | Insert aura and return the amount not moved. |
| `double extract(@Nullable LivingEntity entity, Provider registries, Holder<Aura> aura, double amount, boolean exact, boolean simulate)` | Extract aura and return the amount not moved. |
| `static double requireNonNegative(double amount)` | Reject negatives, NaN and infinities; invalid Java calls throw `IllegalArgumentException`. |

`exact=true` requires the entire request or no write; `exact=false` moves the portion that fits. `simulate=true` only checks: it must not write components, create attachments, run callbacks or normalize existing stock. Zero requests write nothing. Ordinary floating-point noise may be reconciled, but a tiny request against an empty store must still fail, and a positive request that cannot produce a representable change must not report a transfer.

A remainder of `0.0` means the entire request can move; the original request means nothing can move. Each call handles one aura. Capacity is not stock: simulate `extract` to query extractable amounts.

`Holder<Aura>` names the aura; `Aura.resource()` only names its numeric unit. The explicit `Provider` also supports machines and absent holders. Calculation, persistence and synchronization retain fractions; displayed values use two decimal places.
