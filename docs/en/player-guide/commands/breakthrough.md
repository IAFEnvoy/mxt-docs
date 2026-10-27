---
title: /breakthrough
---

# `/breakthrough`

Attempts one breakthrough on an aura on the spot. It needs operator level 2 and has to be run by a player; every form also exists as `/mxt breakthrough …`.

<div class="cmd-tree">

- `/breakthrough <aura>`

  Attempts one breakthrough along that aura's realm chain.

</div>

`<aura>` is an entry of `mxt:aura`, and completion comes from the server's current registries.

## Which stage it reaches

One aura definition links into a chain that only moves forward, and the target follows where the body stands:

- **already on that chain**: the target is the next rung `next_realm` names, walked along the chain the server validated; a chain that breaks at some rung (blocked by `neoforge:conditions`, or a deleted file) has no next rung;
- **never entered that chain**: the target is the definition's `first_realm`, the entrance of the chain.

## How it differs from a natural breakthrough

It takes the **same path a breakthrough takes**: the progress threshold, that stage's own `breakthrough` condition, its `ability_requirements`, the costs and the `Pre` / `Post` events all behave as usual, and a success resets that chain's cultivation progress to zero. What it skips is the one external decision of whether to start at all — the command ignores the automatic flag and does not require meditating, which makes it an operator's single press.

The price is declared by that stage's `breakthrough_costs`, and which resource it names comes from the realm itself; a shortfall names the resource.

## Results

Success reports "Breakthrough succeeded: `<aura name>`", and a refusal reports "Breakthrough failed: `<reason>`". The usual reasons: no next realm to reach, not enough progress, conditions unmet, the price cannot be paid (naming the resource), the stage's numbers are misconfigured, or a listener cancelled it.

How realms are built is on [Define Aura and Realms](../../tutorial/define-aura-and-realms.md), and the fields one stage asks for are on [realm_stage](../../datapack/json/realm_stage.md).
