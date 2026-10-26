---
title: Cost
description: Fixed cost quotes, duplicate-target diagnostics, ordered simulation and deduction, and continuation after a real failure.
---

# Cost

Abilities, cultivation, formations, forging, contracts, talismans and quality upgrades share one cost array. Each fee binds its target and amount before simulation and deduction. Its formula is evaluated once for that quote and is not evaluated again during deduction.

## Quotes and edits

A quote fixes each fee's target, amount and script parameters without deducting stock. Event edits replace the current fees, and scaling changes that fixed quote. Removing a fee does not restore its original price during deduction.

Quote totals are display projections. A resource or aura total does not mean entries will be merged or have already been paid. Fees from different contexts can be appended to one payment and share both passes.

## The three steps of a payment

1. Check for repeated deduction targets. Log WARN in development mode and DEBUG in production; the diagnostic does not refuse payment. Quoting alone does not emit it.
2. Simulate each entry in array order, checking current balances, stock and channels without writing. If any entry refuses, no real deduction starts and no business effect runs.
3. Once every simulation passes, attempt each real deduction in the same order. A refusal or runtime exception always logs WARN and continues with later fees and business effects. It does not propagate, roll back, cancel or retry automatically.

Both passes preserve array order, including each script's position. Submitting the same payment again returns its cached result without another deduction. Scripts check their own condition again before consume; a refusal in that real pass also only warns.

**Payment success means simulation passed and the real deduction attempts finished; it does not guarantee full collection.** Reported spending contains only known receipts, including partial spending returned by a failed fee. If a fee writes and then throws without returning an amount, its spending is unknown and must not be inferred as zero or the full price. Fatal JVM errors are outside this recovery rule.

## Prefer one entry per target

Repeated targets do not merge amounts or transactions and do not reserve balances. With a balance of 5 and fees of 4 followed by 3, both simulations can pass. The first deduction leaves 1, the second only warns, the payment succeeds, and known spending is 4.

Targets follow the actual store:

- An `mxt:resource` and an `mxt:aura` measured in that resource name the same account balance.
- A world aura pool is identified by dimension, chunk and section. Different positions inside one section still share stock.
- Accounts, world pools and block banks are separate stores, even for the same aura.
- Item diagnostics recognise the same container with an identical demand; they do not solve arbitrary overlap between matchers.
- The same script id for the same payer is diagnosed as repeated, while each call remains independent.

Follow the [shared data type guidance](/en/datapack/types/shared_data_types#cost): express a target's whole fee in one entry and avoid overlapping item demands. Diagnostics cannot identify every indirect overlap or infer which stores a script uses internally.

## Deduction by channel

| Channel | Simulation | Real deduction and receipts |
| --- | --- | --- |
| Resource account | Checks balance and use permission | A single fee is fully charged or refused; reports actual resource spending |
| World aura pool | Checks the selected section's aura | A single fee is fully charged or refused; reports actual aura spending |
| Block bank | Requests an exact check | Real extraction also requests exact; a violating partial transfer fails that fee and reports the known amount taken, while the payment continues |
| Items | Plans slots for that entry without writing | Rechecks before writing; receipts preserve the count and components of the items removed |
| Script | Calls a read-only check | Checks again, then calls consume; a completion receipt records the script's claim, without inferring internal resource amounts |

Amounts must be finite and positive. Item counts round upward, and counts beyond the integer range are refused before deduction. Bank aura retains fractions: `0.25` is charged and receipted as `0.25`. Item entries plan independently without reserving slots across entries, so a later real fee can fail after an earlier one used the stock.

Each script callback receives a separate parameter copy. Changes during simulation cannot alter consume's input. Check must be read-only, consume is not automatically refundable, and a successful simulation does not promise that real execution will succeed.
