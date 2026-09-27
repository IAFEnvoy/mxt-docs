---
title: Cost
---

# Cost

The abstraction for what an ability, a formation or another action consumes. A `Cost` only answers what one entry takes (evaluating it against the channels the context offers, read-only), while **the checking and the spending are both done by `CostTransaction` from that one evaluated plan**: `plan` evaluates each entry and looks up its channel, `commit` writes through the channels, and any refusal in the middle restores what was already written.

| Member | Description |
| --- | --- |
| `Either<Charge, CostFailure> charge(CostContext context)` | Evaluates this entry against the channels the context offers. The right side is a failure: a formula that cannot produce a finite, positive amount, or a channel this context does not have. **Nothing is written here.** |
| `MapCodec<? extends Cost> codec()` | The codec of this concrete cost type. |
| `Codec<Cost> TYPED_CODEC` | Dispatched on the `type` field. |
| `Codec<Cost> CODEC` | The one data files use: it tries a typed object first and then the `{ "id": ..., "amount": ... }` shorthand, read as `mxt:resource`. |
| `Codec<List<Cost>> LIST_CODEC` | The list codec used by every field that takes several costs at once. |

Four built-in types are registered in `mxt:cost_type`: `mxt:resource`, `mxt:aura`, `mxt:item` and `mxt:js`. Adding one means writing an implementation and registering it in `MxtRegistries.COST_TYPE`; the field shape does not change, since every cost field is this array - see [Shared Data Types](/en/datapack/types/shared_data_types#cost).

The payer and the channels come from the **call site** (`CostContext` carries the payer and which channels it offers), and a datapack only writes what is wanted: `mxt:item` and `mxt:js` need a player, and a missing channel is a refusal rather than an error; a field such as a formation's upkeep names a resource account directly, because its owner may be offline. **Currency is not a cost**: the prices and the value multiplier in `currency` never become a `Cost`. The aura entries of a talisman are the one exception in this shape - they spend the charge the carrier itself was filled with, and its capacity comes from a separate multiplier field.
