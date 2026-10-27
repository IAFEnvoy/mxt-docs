---
title: /picker
---

# `/picker`

<div class="cmd-tree">

- `/picker [<category>]`

  Opens the item picker, which lists the items behind the selected categories; `category` is a category ID such as `mxt:aura`, `mxt:artifact`, `mxt:currency`, `mxt:item_binding` or `mxt:technique`, and leaving it out walks every registered category. It needs the `gamemaster` permission and only works in creative mode.

</div>

## What each category lists

`/picker` comes from the **Picker** mod - this mod bundles it through `jarJar`, so installing this mod is enough. What the screen looks like, how the search matches and how an item leaves it are that mod's business; what follows is only what each category lists.

The `category` argument is the ID of one datapack registry: tables that claim items (`item_aura`, `item_binding`, `default_quality` and so on through `items`, `currency` through `item`) are expanded into the items they claim, while `block_aura` and `heat_source` claim blocks with `blocks` and give one row per block, and `spirit_herb` expands into its **fruit** (`growth.drops`), one row per fruit item - the stack a tooltip and a furnace actually ask about, with a herb that writes no `growth` falling back to the item form of the blocks it claims. The registered categories are, in order (the first two are the Picker's own built-ins):

`minecraft:item`, `minecraft:block`, `mxt:item_aura`, `mxt:currency`, `mxt:spirit_herb`, `mxt:pill_binding`, `mxt:artifact`, `mxt:item_binding`, `mxt:weapon_binding`, `mxt:tool_binding`, `mxt:blueprint_binding`, `mxt:default_quality`, `mxt:block_aura`, `mxt:heat_source`, `mxt:pill`, `mxt:contract_type`, `mxt:secret_realm`, `mxt:formation`, `mxt:talisman`, `mxt:technique`, `mxt:alchemy_furnace`, `mxt:alchemy_wall_material`, `mxt:aura`, `mxt:spirit_root`, `mxt:physique`, `mxt:quality`.

Note that `mxt:technique` is a category but `mxt:technique_binding` is not: a technique is what gets a row, and the row is the carrier stack the mod generates for it (the item the technique's declaration names as its `carrier_item`, or the technique book), already carrying its `mxt:technique` component. See [Technique Binding](/en/datapack/json/technique_binding#carrier).

Without an argument every category is walked. A definition with no item of its own is shown on a stand-in item (a spirit stone, a contract scroll, a secret realm token, a formation plate, a talisman carrier, a pill carrier, a furnace core, a casing or the identification mirror) whose row is searched by the definition's name and registry ID as well as by what the stack looks like; item-claiming registries (`artifact`, `item_aura`, `currency`, `item_binding`, `default_quality` and so on) are expanded to the items they claim, one row per item, named by the item's own name plus the definition name and ID; `block_aura` and `heat_source` claim blocks with `blocks` and give one row per block, named the same way, while `spirit_herb` expands into the fruit items it claims (a herb with no `growth` falls back to the item form of its blocks); `mxt:pill` gives one component-carrying pill carrier per definition, while `mxt:pill_binding` expands into the items it claims. The `mxt:spirit_root` and `mxt:physique` rows are not plain stand-ins either: each stack comes with its `mxt:spirit_root` / `mxt:physique` component already written, so taking it out and right-clicking gains that spirit root or that physique.
