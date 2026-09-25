---
title: /contract
---

# `/contract`

| Command | What it does |
| --- | --- |
| `/contract list [<player>]` (= `/mxt contract list`) | Lists the spirit beasts of that player from the **owner index**: contract type, beast UUID and whether it is loaded right now. Without `player` it is your own list, and no permission is needed. The index is a name list rather than the truth, so every row is checked back against the record on the creature and a row that no longer matches is dropped on the spot. |
| `/contract info <target>` (= `/mxt contract info`) | Reads the contract record on the target: type, owner, when it was signed, recall state, the cooldown left and the order in force. No permission needed. |
| `/contract bind <player> <target> <contract_type> [force]` (= `/mxt contract bind …`) | Binds the target creature to `<player>` (gamemaster permission), through exactly the same flow as the Contract Scroll, with the price paid by that player. `force` skips the price and the per-owner limit. |
| `/contract break <target> [force]` (= `/mxt contract break …`) | Releases the target from its contract (gamemaster permission) while the beast lives. `force` skips the "must be the owner" check. |
| `/contract recall <target> [force]` (= `/mxt contract recall …`) | Makes the target answer a recall, the same as picking its "recall" cell on the Beast Taming Bell's wheel. `force` skips the recall cooldown. |
| `/contract behavior <target> <behavior> [force]` (= `/mxt contract behavior …`) | Gives the target one order (gamemaster permission) through exactly the same flow as the bell's wheel. `behavior` is a code-side order id; the built-ins are `mxt:follow` / `mxt:wander` / `mxt:stay` / `mxt:recall` and they are what completion offers. A creature that does not take that order answers "it does not take that order". `mxt:recall` is **momentary** and equivalent to `recall` above. `force` skips the "must be the owner" check (and the cooldown for a recall). |

## Who can be contracted

**Eligibility is a code fact**: the target creature must implement `com.iafenvoy.mxt.api.Contractable` itself (see [Special Public Interfaces](/en/java/interfaces)). No data pack can grant it, so **vanilla creatures can never be contracted** - `bind` on a wolf answers "it cannot be contracted".

What a data pack can do is **narrow** it: a [contract_type](/en/datapack/json/contract_type) can restrict "which kind of creature signs this contract" with its own **entity type tag** `#<namespace>:contract/<path>`, restrict both sides with `owner_condition` / `creature_condition`, and charge a price with `costs`. **A tag that is absent, or written empty, places no restriction** (every creature implementing the interface may sign).

## The order of a binding

`bind` (and the Contract Scroll) asks in a fixed order, and **the payment comes last**:

1. Does it already have a contract? → Can it be contracted at all? → Is this contract type disabled by `#mxt:disabled`?
2. The interface's `acceptsContract` → `owner_condition` → `creature_condition` → the per-owner limit `max_owned`;
3. The `Pre` event (cancellable, and **nothing has been paid yet**);
4. The `costs` payment → the record is written → the owner index is written → the creature's `onContractBound`.

The price is paid by the **owner** and may use the owner's resource account, inventory and script channels (the beast pays nothing). Payment sits after the event because the script channel cannot be refunded: returning money after a cancellation is not something the framework can do.

## Release and death are two roads

`break` lets a living beast leave its contract: the contract type's `release_action` runs, the creature's `onContractReleased` is called, and then the record and the owner index are cleared. A beast that dies takes the other road: `death_action` runs, `onContractDeath` is called, and the record and index are cleared just the same, with the inner core still dropping (extra loot belongs to vanilla loot tables; see [Creature Profile](/en/datapack/json/creature_profile)). **Each action field answers exactly one moment**, so no single action has to serve two.

## Recall

`recall` only **sets the recall latch** (exactly what ringing the bell does); the actual movement happens on the beast's next tick and is landed by the operations interface the creature implements itself - the default implementation teleports it to its owner. The contract type's `recall_cooldown` is the shortest gap between two recalls, decided from the timestamp in the record; `force` is an operator's way around that wait. While the owner is offline or in another dimension the latch simply stays set until they are back.

## Orders

The orders an owner can give are **follow / wander / stay / recall**, and they are answered by **the creature's own code** (`ContractOperations.behaviors()`) rather than by a data pack field; a content mod may add one of its own. **There is only one copy of the order in force**, on the beast's contract record, and an old save or an id that no longer resolves reads as follow.

The player's entry point is the **Beast Taming Bell**: right-clicking one of your own bound beasts tunes the bell to it (the bell remembers its name and the orders it takes), and right-clicking with nothing in front opens the wheel on the "contract beast" page - picking a cell gives that order. **Follow / wander / stay** stay in force (the next one replaces them); **recall** happens once and leaves the current order alone. This `behavior` command is the operator's way in. A contract type's `follow_action` only runs while the order in force is follow.

## Capturing is the item's business

**Capturing is not a gate on the creature**: any creature may be captured, and **how a capture works is decided by the item** - what it may hold, whether it needs a contract, what it costs are all that item's own rules. The Spirit Beast Bag's own rule is "your own contracted beast, one at a time". A creature only hears about it if it implements `CaptureListener` (`onCaptured` / `onReleased`), and **one that does not implement it can still be taken** - it simply hears nothing.

## Refusal reasons

The scroll, the bell, the bag and this command all print from **one** table of texts, keyed `contract.mxt.failure.<lowercase enum name>`: `already_bound`, `disabled`, `not_contractable`, `owner_conditions`, `creature_conditions`, `limit_reached`, `insufficient_cost`, `not_bound`, `not_owner`, `recall_cooldown`, `cancelled`, `unsupported_behavior` (the creature does not take that order) and `behavior_refused` (it takes it, but refused this one).
