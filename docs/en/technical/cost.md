---
title: Cost
description: How one payment goes from "what must be paid" to the real deduction — why the amount is bound before anything is checked, why one store should only be written by one entry, why the ledger-and-shares design was deleted, and what the current shape still costs.
---

# Cost

Every field that asks for something to be paid is one costs array, shared by abilities, cultivation, formations, forging, contracts, talismans and quality upgrades. What actually pays it is `CostPayment` (one **bill**), and each entry does exactly one thing: hand back a **bound transaction**.

| Layer | Name | Responsibility |
| --- | --- | --- |
| Definition | `Cost` (`mxt:resource` / `mxt:aura` / `mxt:item` / `mxt:js`) | Turn the context into a transaction: evaluate the amount **once**, resolve the store from the context, freeze the parameters |
| The bound fee | `Cost.Transaction` | A fixed target `CostTarget` and a fixed `amount`, with one `execute(simulate)` for both passes |
| The bill | `CostPayment` | Price, edit, simulate every fee, take every fee, and report the real debits |

The whole shape serves one purpose: **what this payment costs, whether it was taken, and how much of it was taken must never be three different answers.**

## The four steps of one payment

| Step | Entry point | Does it write |
| --- | --- | --- |
| Price | `CostPayment#price(costs)` / `price(costs, context)` | No. Only calls `prepare(context)` on every entry and keeps the transactions |
| Edit | `replaceResourceAmounts(table)` / `scale(selection, ratio)` | No. Replaces the selected fees with **new transactions** (same binding, new fixed amount) |
| Check | `CostPayment#test()` | No. Groups by target, then `execute(true)` on each group |
| Pay | `CostPayment#pay()` | Yes. Simulates every group first, then `execute(false)` on each of them |

`pay(costs, ctx)` is "price, then pay" as one call, and both the static entry points and a single KubeJS cost go through it - there is no faster second path.

Pricing and editing are **preparation**; checking and paying are **execution**. After `pay()` the bill is closed (it sets `closed`): pricing into it, editing it or paying it again only replays the same terminal answer and never charges a second time. A caller that prices an array with `price` and then calls `pay` still runs the full simulation - "I checked it already" is not a pass.

## Why the amount is bound while pricing

The old first layer was "call the same method twice": `execute(context, true)` evaluated the amount and wrote it into the payment's shared price table, and `execute(context, false)` read that entry's own share back out. The money had two sources - the entry's own formula and the payment's table - and keeping those two in step needed a per-entry share table, a proportional re-derivation, and a "am I verifying or taking" flag.

| | Calling the same method twice | Pricing returns a bound transaction |
| --- | --- | --- |
| Who decides the amount | The simulated pass writes it into a table, the real pass reads a share back | `prepare` evaluates it once; the formula is never read again |
| Dynamic formulas | Evaluated once per pass, so they can produce two different prices | Evaluated once, and the real pass charges that number |
| Re-pricing | Edit the table, then re-derive every entry's share | Swap in a new transaction whose amount is the new amount |
| Price without paying | Needs a cross-phase flag, or a script's consume is skipped | No flag; `pay` always runs both passes itself |
| Two entries on one store | Must apportion, or one balance is checked twice and taken twice | The bill sums them when it freezes, and takes that store once |

The cost of the shares was that **they could be wrong**, and always in quiet ways - after a bill was edited, what an entry re-derived and what the total said could disagree.

## Why one store should only be written by one entry

When two entries reach the same balance, the two passes become "check one balance twice, take it twice". The older design tolerated that and apportioned it, and that tolerance produced four kinds of defect that charge the wrong amount:

1. **The amount stops adding up.** One entry charges its formula, the other its share; after a re-price the two disagree - a removed price is still charged at the old amount, and an added one has no entry that executes it.
2. **A refusal still writes half of it.** The check asks "can this entry pay", but the write charges its own share, so when the second entry refuses the first has already taken its part. Item entries show it worst - they shrank as they scanned, so a shortage first emptied what was there and then reported the failure.
3. **The debit disagrees with the deduction.** The stack was copied after being emptied, so the receipt was empty; a bank handed over part of the price and was still reported as paid.
4. **Re-entrancy and the terminal answer fall through.** With one store reached by two routes, entering the same payment again did not trip the guard; a script entry generated a fresh target on every pricing, so a nested payment walked straight past it.

What these four share is not "a little too much was taken" - it is that **what the payment costs, whether it was taken, and how much of it was taken become three answers that can contradict each other**. So nothing is apportioned any more:

- when the bill freezes it groups by `CostTarget`, and the amounts of one target are added in **that store's own unit** and charged once;
- the identity is physical and ignores the cost type: an `mxt:aura` charged on the payer is the value it is measured in, so it and the `mxt:resource` naming that value are one target; a pool, a bank and an account stay three targets even when they hold the same aura;
- adding up only applies to plain amounts: items are grouped by container plus matcher, and scripts are never merged (what a script takes is its own business, not a number that can be summed);
- writing one target twice is **not a load error** - the bill logs one run-time warning and still charges correctly - but a reader still has to add the two entries up by hand, which is why the shape rule stays [one entry per target](/en/datapack/types/shared_data_types#cost).

## Two designs that were dropped

**Drafts plus snapshot rollback.** Each entry used to be copied into a draft when the payment was built, and a failure restored whatever had really been written. The problem is that a rollback cannot cross channels: a shared aura pool drained by another system, a script that already consumed, an item that already went into another container - none of those have a "put it back" operation, and remembering which writes succeeded is itself another ledger that has to agree with reality. The trade-off now is: **a built-in single fee is all-or-nothing, the whole bill is simulated first, a refusal in the real pass neither lies nor retries, and whatever was taken is reported** (as real debits in `PaymentResult`).

**Committing several payments in turn.** Cultivation used to split itself into "environment aura, then body cost" and commit them one after the other, with no boundary in between: when the second refused, the first had already been taken. Different contexts can now be priced into **one bill** (`price(costs, context)` with another context), so the simulation and the real pass both happen inside one payment.

## How each store is charged

| Target | Simulation | Real pass | Unit |
| --- | --- | --- | --- |
| Resource account (`CostTarget.Account`) | `tryConsume` against a copy | `tryConsume` | real number, must be finite and positive |
| World aura pool (`CostTarget.AuraStore`, keyed by chunk section) | `canConsume` | `AuraService.consume`, all or nothing | real number |
| Block entity store (`CostTarget.AuraStore`, keyed by that block) | `extract(…, true)` | asks `extract` again; a non-zero remainder is a refusal | whole units, rounded up once while pricing |
| Container (`CostTarget.Items`) | reads the slots to plan | re-checks, then writes, and the debit is the copy of what really left | whole items, rounded up once while pricing |
| Script (`CostTarget.Script`) | `check` | `check` again, then `consume` | one call, which is what the debit records |

The item channel is worth reading on its own: the planning pass only reads, turning "which slot gives how many" into a table; the write re-checks the slots and the counts, and only then `shrink`s them and notifies the container. One item fee is therefore all-or-nothing, with no "not enough material, but what was there is gone" middle state.

The order is the bill's, not the caller's: built-in stores first, scripts last, and the written order within each kind. A script asks its own condition again right before consuming, so a transaction executed on its own still cannot skip its check.

## What this costs

- **No group rollback.** When the second group refuses in the real pass, what the first group already took stays taken, and the result carries exactly that as debits. The defence is the shape of the data (one entry per target), not a rollback.
- **An exception after a write leaves no terminal answer.** When an outside implementation or a script throws after writing, this payment has no terminal answer to cache, so it **does not promise** the next attempt will not charge again - a caller either contains the exception or does not throw halfway through.
- **Several different matchers in one container are each all-or-nothing.** They are not one shared, optimal slot plan: two demands for different items are checked and written separately, so the second can fail because the first already ate the stock. A pack should avoid overlapping demands.
- **A script is opaque.** It takes no part in amount merging, cannot run partially, and cannot be refunded after `consume`; the script itself has to stay idempotent about repeated calls.
- **An outside bank only offers logistics.** `extract` returns the part it could not move rather than "all or nothing", so a bank fee counts as paid only when the remainder is zero, treats a partial move as a refusal, and never stuffs the moved part back.

## Source map

| Location | Contents |
| --- | --- |
| `data/cost/Cost.java` | The entry contract: `prepare(context)` and the nested `Transaction` |
| `data/cost/CostTransaction.java` | The transaction skeleton: immutable amount, simulation not cached, the first real take is terminal |
| `data/cost/CostTarget.java` | The physical identity of a target (account / pool and bank / container / script) |
| `data/cost/Debit.java` | The real deduction receipt |
| `data/cost/CostPayment.java` | The bill: pricing, editing, merging, both passes, the re-entrancy guard, read-only projections |
| `data/cost/builtin/` | The four built-in types and the writes of their stores |
