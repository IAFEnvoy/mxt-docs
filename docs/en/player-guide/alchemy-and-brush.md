---
title: Alchemy and the Brush
---

# Alchemy and the Brush

Two systems the player works by hand: a 3x3x3 furnace built on the spot to produce pills, and a brush dipped in pigment to draw talismans.

## Alchemy and Spirit Herbs

A furnace is not one block: it is a fixed 3x3x3 you build by hand. The core carries the furnace spec, the two input stores split main ingredients from auxiliary ingredients and the catalyst, the output store only hands results out, and the other 18 cells are casing (the bottom layer only needs its four corners).

| Block | ID | Function |
|---|---|---|
| Alchemy Furnace Core | `mxt:alchemy_furnace` | The cell on the front face at the middle layer. The heat readout plus the Set / Start / Abort controls sit on the page this cell opens. |
| Main Ingredient Input | `mxt:alchemy_main_input` | On your left when you face the front. Two main-ingredient slots. |
| Auxiliary Ingredient Input | `mxt:alchemy_auxiliary_input` | On your right when you face the front. Two auxiliary slots plus one catalyst slot. |
| Alchemy Output | `mxt:alchemy_output` | Top centre. Four take-only output slots. |
| Alchemy Furnace Casing | `mxt:alchemy_furnace_casing` | The four bottom corners and the two layers above, 18 cells in all, each carrying its own wall material. Casing opens no screen. |
| Pill | `mxt:pill` | The pill carrier: vanilla eating, a name and a tooltip. What a dose does is on [Pill](../datapack/json/pill.md); which items are that pill, how many times it can be taken and how much toxicity it adds come from its [Pill Binding](../datapack/json/pill_binding.md). |

**A heat block in the bottom centre cell, main ingredients in the left store, auxiliary ingredients and the catalyst in the right store, and the result taken from the output store.** Loading materials never starts a batch by itself; a player presses Start on the core's page. A shell with a missing cell, an invalid wall material or a cell claimed by another furnace does not form and cannot run.

**The mod ships no heat block.** The numbers a heat block gives come from the `mxt:heat_source` registry (a block may also implement the interface itself), and the mod supplies no default. The temperature ceiling is the lowest of three: the furnace specification's own optional `max_temperature`, the coldest wall material in the whole furnace, and the highest temperature the heat block gives. A higher-tier specification with a large `max_temperature` can raise it, but never past the walls and the heat block.

Eating a pill accumulates toxicity: what a dose does, where the threshold sits and what is left after an overdose are on [Pill](../datapack/json/pill.md), and the mod only keeps the ledger. Toxicity does not fade on its own by default; with **Server Config → Alchemy → Natural toxicity decay per second** set to a positive number, an active entity that already has toxicity loses some once every 20 ticks, nothing happens offline, and an entity that has never taken a pill does not gain an empty ledger.

## Brushes and Pigment

The talisman brush `mxt:talisman_brush` **does not stack** — one brush is one store of pigment of its own, kept in the item component `mxt:brush_pigment`: a non-negative integer where **one unit is one pixel of stroke length**, and omitting the component is the same thing as writing `0` (an empty brush either way). The little strip in the inventory cell is how much is left (it only shows while there is pigment), and the tooltip carries a "Pigment: stored / ceiling" line whose ceiling is **Server Config → Talisman → Brush Capacity** (4000 by default, roughly enough to trace 3–5 talismans).

Refilling is the same click the vanilla bundle uses: with the brush on the cursor, **click a stack of pigment** (either mouse button) and the brush takes **one portion — one item — per click**, so four clicks are four portions; a full brush takes nothing. **It is not tied to one screen or one slot**: your inventory, a chest and the drawing workstation all work, and no screen has a pigment slot of its own. What one portion is worth is **Server Config → Talisman → Pigment Per Portion** (1000 by default), and a pack adds a kind of pigment by putting the item in the `#mxt:brush_pigment` tag (cinnabar `mxt:cinnabar` only in the base pack) — no recipe is involved.

The pigment is what drawing spends: at the talisman workstation it is taken by the length of each stroke, see [`mxt:talisman_drawing`](/en/datapack/json/talisman_drawing).
