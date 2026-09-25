---
title: /quality
---

# `/quality`

| Command | Effect |
|---|---|
| `/quality` (= `/mxt quality`) | Shows the quality of **your own main-hand** item: the tier it resolves to right now, and the chain it belongs to. No permission needed. |
| `/quality get [<target>]` (= `/mxt quality get …`) | The same, for somebody else (needs the `gamemaster` permission). |
| `/quality set <targets> <quality>` (= `/mxt quality set …`) | Writes the quality **override component** onto the target's main-hand item (needs the `gamemaster` permission). It outranks the definition default, and `/quality clear` takes it off again; whether that tier may be used is still decided by its own `condition` and by the chain it belongs to. |
| `/quality clear <targets>` (= `/mxt quality clear …`) | Removes the override component from the main-hand item so it falls back to its definition default (needs the `gamemaster` permission). A target that had no override reports a failure on its own. |
| `/quality upgrade <targets>` (= `/mxt quality upgrade …`) | Moves the main-hand item **one tier up** the chain it belongs to (needs the `gamemaster` permission): the step's `condition` is checked first, and its price is whatever `costs` that step declares (`plan` then `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier). A step with no declared cost cannot be taken; being already at the top, belonging to no chain, or having a tier that several chains hold is reported per target. |
| `/quality chain <quality>` (= `/mxt quality chain …`) | Prints every **quality chain** that tier is on; no permission needed. The tiers below it are grey, the tier itself is green and the tiers above it are white. A tier that several chains hold gets one line per chain, a tier no chain holds reports that no quality chain contains it, and a disabled tier is refused like any other disabled definition. |

## Which tier is it

A stack's quality is the **first** of these that answers:

1. An `mxt:item_quality` **override component** on the stack;
2. the tier recorded by a forge result (`mxt:forging_result`) on the stack;
3. a **definition default**: `quality` on an [artifact](/en/datapack/json/artifact) or on a [technique](/en/datapack/json/technique);
4. the **chain's `default`** for the chain this stack belongs to;
5. the `quality` a matching [spirit herb](/en/datapack/json/spirit_herb) declares.

The chain itself comes from the binding table's `quality_chain` (see [Quality Chain](/en/datapack/json/quality_chain)).

`set` writes that first slot, so it outranks the four steps below it; `clear` sends the item back to its definition default. A successful `upgrade` writes the new tier into the same override component, so an upgraded item is decided by the override from then on and `/quality clear` returns it to the definition default.

## One tier at a time

`upgrade` moves exactly **one** tier and pays that step's own declared price; climbing two tiers means running it twice and paying twice. A step the chain declares no `costs` for (because `upgrades` is shorter than the ladder, or omitted) cannot be taken and is **not** treated as free. The full rules are on [Quality Chain](/en/datapack/json/quality_chain).

The top-level `/quality` alias is controlled by the **Command Aliases** tab of the server configuration (the entry is named `quality`, and it defaults to on); switching it off leaves `/mxt quality` fully usable.
