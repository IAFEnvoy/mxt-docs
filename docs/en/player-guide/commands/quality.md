---
title: /quality
---

# `/quality`

| Command | Effect |
|---|---|
| `/quality` (= `/mxt quality`) | Shows the quality of **your own main-hand** item: the tier it resolves to right now, and the chain it belongs to. No permission needed. |
| `/quality get [<target>]` (= `/mxt quality get …`) | The same, for somebody else (needs the `gamemaster` permission). |
| `/quality set <targets> <quality>` (= `/mxt quality set …`) | Writes the quality **override component** onto the target's main-hand item (needs the `gamemaster` permission). It outranks the definition that stack carries and the data map layer, and `/quality clear` takes it off again; whether that tier may be used is still decided by its own `condition` and by the chain it belongs to. |
| `/quality clear <targets>` (= `/mxt quality clear …`) | Removes the override component from the main-hand item (the one `/quality set`, a **forge settlement** and an **inscription** all write) so it falls back to the tier the definition it carries declares and then to the tier `mxt:default_quality` writes (needs the `gamemaster` permission). A target that had no override reports a failure on its own. |
| `/quality upgrade <targets>` (= `/mxt quality upgrade …`) | Moves the main-hand item **one tier up** the ladder it belongs to (needs the `gamemaster` permission): the **next tier's** `upgrade_condition` is checked first, and its price is that tier's `upgrade_costs` (`plan` then `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier). Being already at the top, or resolving to a tier that is not on the ladder, is reported per target. |
| `/quality chain <quality>` (= `/mxt quality chain …`) | Prints the whole **quality ladder** that tier sits on; no permission needed. The tiers below it are grey, the tier itself is green and the tiers above it are white. A tier sits on exactly one ladder (the one the runtime walks out of `next`), so a tier with no ladder - or one whose ladder does not walk - reports that no quality ladder contains it, and a tier the current pack does not provide is refused like any other missing definition. The ladder's name is written on the entry tier, so it reads `null` up front when the entry tier has none. |

## Which tier is it

A stack's quality is the **first** of these that answers:

1. A `mxt:quality` **component** on the stack (a whole quality object) — what `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription write; when the id on it names no entry in the current pack, this layer answers nothing;
2. the tier **the definition the stack itself carries** declares, read from whichever component on that item names a definition identity. The nine definitions declaring `quality` are `technique`, `alchemy_furnace`, `alchemy_wall_material`, `spirit_root`, `physique`, `pill`, `formation`, `secret_realm` and `contract_type`;
3. the [default_quality](/en/datapack/json/default_quality) data map: whichever tier the item is given there.

Layer 2 is what answers for "several definitions of a type share one built-in item, so the item cannot say which tier applies": every technique manual, every pill, every furnace specification, the spirit-root stone and the physique stone. `artifact` and `spirit_herb` are claimed by item, so nothing on the stack names a definition identity, and a `talisman` carrier holds a list of bills rather than one definition — those three write their tier in layer 3 alone.

The ladder follows the tier the stack resolves: the ladder's name is written on the tier itself (on the entry tier), so neither a binding nor a component has to declare it, see [Quality](/en/datapack/json/quality). When none of the three layers answers, the stack has no quality at all and **no ladder's entry tier is supplied for it**.

`set` writes that first layer, so it outranks the two below it; `clear` sends the item back to layer 2, and only when the definition declares no tier either does it reach what the data map writes — **the tier a forge run or an inscription wrote is cleared with it** (it lives in that same component rather than being stored separately). A successful `upgrade` writes the new tier into the same override component, so an upgraded item is decided by the override from then on and `/quality clear` resolves the three layers again.

## One tier at a time

`upgrade` moves exactly **one** tier and pays the `upgrade_costs` the **next tier** declares; climbing two tiers means running it twice and paying twice. A tier that writes `next` without any cost has that step at an empty price, so it is effectively free; to make a tier the top, leave its `next` out. The full rules are on [Quality](/en/datapack/json/quality).

The top-level `/quality` alias is controlled by the **Command Aliases** tab of the server configuration (the entry is named `quality`, and it defaults to on); switching it off leaves `/mxt quality` fully usable.
