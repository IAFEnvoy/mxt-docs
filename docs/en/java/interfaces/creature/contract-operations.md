---
title: ContractOperations
---

# ContractOperations

What a bound creature does on its own. **Every default is the code the framework used to hardcode** (teleport, follow, pathfind), so a creature that implements the interface and overrides nothing behaves exactly as a contract always did. **Not implementing it means not wanting that behaviour**: the creature can still be bound, but the framework will not follow, recall or report combat for it, and `follow_action` and `combat_action` therefore never run - they exist to colour exactly those two moments. `ContractContext` carries the creature, the owner's UUID, the online owner (empty while offline) and the contract type.

| Member | Description |
| --- | --- |
| `List<ContractBehavior> behaviors()` | Which orders this beast takes, in the order the bell's wheel shows them. The framework's four by default (follow / wander / stay / recall); **both sides have to answer it**, because the bell reads it to fill the wheel page. |
| `boolean onBehaviorSelected(ContractContext context, ContractBehavior behavior)` | The **input** end: the owner gave an order. Returning `false` refuses it and leaves the order in force alone. |
| `void tick(ContractContext context, ContractBehavior behavior)` | The per-tick drive; the default dispatches to `follow` / `wander` / `stay` and ignores any other order. |
| `void recall(ContractContext context)` | The owner rang the bell and landing it is handed to the creature; the default teleports it to the owner, and this call consumes the recall latch. |
| `void follow(ContractContext context)` | Every tick, with the owner online and in the same level: past 32 blocks teleport, past 4 blocks pathfind. |
| `void wander(ContractContext context)` | Past 32 blocks it is brought over first, so a strolling beast is never left behind for good; otherwise, once every couple of seconds and only when it has nothing left to walk to, it picks a new spot 3-8 blocks around its owner. **The framework adds no goal**, so a creature's own stroll keeps working until it overrides this. |
| `void stay(ContractContext context)` | Stops the path and drops the quarry - stopping rather than freezing; a creature whose own goals walk it around overrides this to hold truly still. |
| `void onDealtDamage(ContractContext context, LivingEntity target, double damage)` | After damage this creature dealt is resolved; the hit itself is never mutated here. |

**An order is a class, not an enum**: `ContractBehavior` (`id` + `momentary` + `name()`, with `equals` reading the id) plus `ContractBehaviors` as the holder, so a content mod adds one with `new` and `register(...)` - "hold fire", "go home" - **without touching the framework's list**. `momentary` separates the orders that stay in force from the ones that happen once (a recall's latch and cooldown belong to the framework, so it goes through `ContractService.requestRecall` and writes no state).

The order in force has **exactly one copy**, on the `mxt:contract` attachment (an id; an id that no longer resolves reads as follow). The single input entry point is `ContractBehaviorService`: bound -> owner -> the interface is implemented -> **the order is on that creature's `behaviors()` list** -> `onBehaviorSelected` -> written (a lasting order) or run once (a momentary one).

**The bell is only a pointer**: right-clicking a creature writes "beast UUID + display name + the orders it answered with" into the item component `mxt:contract_bell`, and right-clicking with nothing in front opens the wheel on the "contract beast" page. That page reads the snapshot on the bell, so **no creature has to be resolved on the client** - and before an order takes effect the server re-reads the bell, the creature's record, the owner and the order itself. Eligibility is the other interface, see [Contractable](./contractable.md); the player-facing entry point is the [command](/en/player-guide/commands/contract).
