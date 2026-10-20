---
title: Cost
---

# Cost

The abstraction for what an ability, a formation or another action consumes. A `Cost` does one thing: given the context of a payment it prices itself into a **bound payment transaction** (`Transaction`) - one fixed store at one fixed amount. It never asks a store whether it can pay, never writes, and remembers nothing between calls, so "what this costs" is decided in exactly one place while "can it be paid" and "take it" belong to the payment.

| Member | Description |
| --- | --- |
| `ResultWithData<Transaction> prepare(CostContext context)` | Prices this entry for one payment: the amount is evaluated **once**, the store is resolved from the context and the parameters are frozen. No stock check, no script call, no chunk loaded, no attachment created. An amount that cannot be priced (a formula that is not a finite positive number) is refused here, so a payment that could only be priced in part charges nothing. |
| `MapCodec<? extends Cost> codec()` | The codec of this concrete cost type. |
| `Codec<Cost> TYPED_CODEC` | Dispatched on the `type` field. |
| `Codec<Cost> CODEC` | The one data files use: it tries a typed object first and then the `{ "id": ..., "amount": ... }` shorthand, read as `mxt:resource`. |
| `Codec<List<Cost>> LIST_CODEC` | The list codec used by every field that takes several costs at once. |

`Transaction` is one bound fee, `Cost.Transaction`, and it has exactly four members:

| Member | Description |
| --- | --- |
| `CostTarget target()` | The store this fee comes out of, and what kind of channel it is. Two fees of one payment naming the same target are the same store. |
| `double amount()` | The fixed amount, in that store's own unit: a real number, whole items, whole bank units, one script call. |
| `ResultWithData<List<Debit>> execute(boolean simulate)` | Both passes go through this one call: `true` only asks and writes nothing; `false` takes from its channel and answers with what it really took. The first real answer is terminal, so one fee is never taken twice. |
| `Transaction withAmount(double amount)` | The same binding at another fixed amount, which is how a payment re-prices a fee without re-running the formula that priced it. Zero is dropped by the payment rather than executed as an empty fee. |

Four built-in types are registered in `mxt:cost_type`: `mxt:resource`, `mxt:aura`, `mxt:item` and `mxt:js`. Adding one means writing an implementation and registering it in `MxtRegistries.COST_TYPE`; the field shape does not change, since every cost field is this array - see [Shared Data Types](/en/datapack/types/shared_data_types#cost).

The payment `CostPayment` is the only entry point: `price` only prices, `resourceAmounts()` / `auras()` / `resources()` are read-only projections, `replaceResourceAmounts` and `scale` edit the bill, `test` simulates one pass and `pay` simulates every fee and then takes them all. An edit changes the bill itself - a replaced resource fee is a new fixed transaction, a scaled amount is a new fixed transaction - so the simulated and the real pass work on one set of amounts and nothing is evaluated a second time after the price was read.

Repeated targets are not a load error. Before execution, LoggerDispatcher logs WARN in development mode and DEBUG in production. Entries are not merged; both passes retain List order, including script positions. The same script id for the same payer is diagnosed separately while calls remain independent. Prefer one entry for a target's whole fee.

A simulation failure prevents all real deductions. Once all simulations pass, a real failure or RuntimeException only calls plain LOGGER.warn, without dispatch, propagation, rollback or cancellation. Later fees and business effects continue; the result is successful and contains known actual Debits. Success does not promise full collection. Partial receipts from failed fees are retained, unknown amounts are not invented, and the cached result prevents another pay from writing again.

Why the shape is drawn this way, and what "one target written twice" used to go wrong with, are on [Cost](../../../technical/cost.md).

The payer and the channels come from the **call site** (`CostContext` carries the payer and which channels it offers), and a datapack only writes what is wanted: `mxt:item` and `mxt:js` need a player, and a missing channel is a refusal rather than an error; a field such as a formation's upkeep names a resource account directly, because its owner may be offline. **Currency is not a cost**: the prices and the value multiplier in `currency` never become a `Cost`. The aura entries of a talisman are the one exception in this shape - they spend the charge the carrier itself was filled with, and its capacity comes from a separate multiplier field.
