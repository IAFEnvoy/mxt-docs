---
title: /quality
---

# `/quality`

Reads and rewrites an item's **quality**. Every node also exists as `/mxt quality …`; writes need the `gamemaster` permission and reads do not.

<div class="cmd-tree">

- `/quality ...`

  Shows the quality of **your own main-hand** item: the tier it resolves to right now, and the chain it belongs to.

  - `... get [<target>]`

    The same, for somebody else (needs the `gamemaster` permission).

  - `... set <targets> <quality>`

    Writes the quality **override component** onto the target's main-hand item (needs the `gamemaster` permission).

  - `... clear <targets>`

    Removes the override component from the main-hand item (needs the `gamemaster` permission).

  - `... upgrade <targets>`

    Moves the main-hand item **one tier up** the ladder it belongs to (needs the `gamemaster` permission).

  - `... chain <quality>`

    Prints the whole **quality ladder** that tier sits on.

</div>

## set and clear

The component `set` writes outranks the definition that stack carries and the registry layer, and `/quality clear` takes it off again; whether that tier may be used is still decided by its own `condition` and by the chain it belongs to.

What `clear` removes is the single override that `/quality set`, a **forge settlement** and an **inscription** all write, so the item falls back to the tier the definition it carries declares and then to the tier `mxt:default_quality` writes. A target that had no override reports a failure on its own.

## upgrade

The **next tier's** `upgrade_condition` is checked first, and its price is that tier's `upgrade_costs` (`plan` then `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier). Being already at the top, or resolving to a tier that is not on the ladder, is reported per target.

## chain

The tiers below it are grey, the tier itself is green and the tiers above it are white. A tier sits on exactly one ladder (the one the runtime walks out of `next`), so a tier with no ladder - or one whose ladder does not walk - reports that no quality ladder contains it, and a tier the current pack does not provide is refused like any other missing definition. The ladder's name is written on the entry tier, so it reads `null` up front when the entry tier has none.

## Which tier is it

A stack's quality is the **first** of these that answers:

1. A `mxt:quality` **component** on the stack (a whole quality object) — what `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription write; when the id on it names no entry in the current pack, this layer answers nothing;
2. the tier **the definition the stack itself carries** declares, read from whichever component on that item names a definition identity. The nine definitions declaring `quality` are `technique`, `alchemy_furnace`, `alchemy_wall_material`, `spirit_root`, `physique`, `pill`, `formation`, `secret_realm` and `contract_type`;
3. the [default_quality](/en/datapack/json/default_quality) registry: whichever tier the item is given there.

## One tier at a time

`upgrade` moves exactly **one** tier and pays the `upgrade_costs` the **next tier** declares; climbing two tiers means running it twice and paying twice. A tier that writes `next` without any cost has that step at an empty price, so it is effectively free; to make a tier the top, leave its `next` out. The full rules are on [Quality](/en/datapack/json/quality).

The top-level `/quality` alias is controlled by the **Command Aliases** tab of the server configuration (the entry is named `quality`, and it defaults to on); switching it off leaves `/mxt quality` fully usable.
