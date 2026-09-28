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
| `/quality upgrade <targets>` (= `/mxt quality upgrade …`) | Moves the main-hand item **one tier up** the ladder it belongs to (needs the `gamemaster` permission): the **next tier's** `upgrade_condition` is checked first, and its price is that tier's `upgrade_costs` (`plan` then `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier). Being already at the top, or resolving to a tier that is not on the ladder, is reported per target. |
| `/quality chain <quality>` (= `/mxt quality chain …`) | Prints the whole **quality ladder** that tier sits on; no permission needed. The tiers below it are grey, the tier itself is green and the tiers above it are white. A tier sits on exactly one ladder (the one the runtime walks out of `next`), so a tier with no ladder - or one whose ladder does not walk - reports that no quality ladder contains it, and a tier the current pack does not provide is refused like any other missing definition. The ladder's name is written on the entry tier, so it reads `null` up front when the entry tier has none. |

## Which tier is it

A stack's quality is the **first** of these that answers:

1. A `mxt:quality` **component** on the stack (a whole quality object);
2. the tier recorded by a forge result (`mxt:forging_result`) on the stack;
3. a **definition default**, asked in order: `quality` on an [artifact](/en/datapack/json/artifact), the tier the inscriptions on a talisman carrier declare, `quality` on a [technique](/en/datapack/json/technique), and `quality` on an [alchemy furnace](/en/datapack/json/alchemy_furnace);
4. the `quality` a matching [spirit herb](/en/datapack/json/spirit_herb) declares.

The ladder follows the tier the stack resolves: the ladder's name is written on the tier itself (on the entry tier), so neither a binding nor a component has to declare it, see [Quality](/en/datapack/json/quality). When none of the four answers, the stack has no quality at all and **no ladder's entry tier is supplied for it**.

`set` writes that first slot, so it outranks the three steps below it; `clear` sends the item back to its definition default. A successful `upgrade` writes the new tier into the same override component, so an upgraded item is decided by the override from then on and `/quality clear` returns it to the definition default.

## One tier at a time

`upgrade` moves exactly **one** tier and pays the `upgrade_costs` the **next tier** declares; climbing two tiers means running it twice and paying twice. A tier that writes `next` without any cost has that step at an empty price, so it is effectively free; to make a tier the top, leave its `next` out. The full rules are on [Quality](/en/datapack/json/quality).

The top-level `/quality` alias is controlled by the **Command Aliases** tab of the server configuration (the entry is named `quality`, and it defaults to on); switching it off leaves `/mxt quality` fully usable.
