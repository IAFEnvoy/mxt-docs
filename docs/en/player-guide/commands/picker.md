---
title: /picker
---

# `/picker`

| Command | Effect |
|---|---|
| `/picker [<category>]` (= `/mxt picker`) | Opens the item picker, which lists the items behind the definitions of the selected registries; `category` is a registry ID such as `mxt:aura`, `mxt:artifact`, `mxt:currency`, `mxt:item_binding` or `mxt:technique`, and leaving it out walks every registered category. It needs the `gamemaster` permission and only works in creative mode. |

## `/picker`

`/picker [<category>]` opens a client-side screen modelled on the vanilla creative search tab: a title, a search well, a scrollable five-by-nine grid and the player's real hotbar row underneath. The entries are the items behind this mod's definitions plus the vanilla item and block registries, so the grid is a way to see what a content pack actually registers rather than a copy of the creative inventory.

`<category>` names one datapack registry, and the registered categories are, in order:

`minecraft:item`, `minecraft:block`, `mxt:item_aura`, `mxt:currency`, `mxt:spirit_herb`, `mxt:item_binding`, `mxt:weapon_binding`, `mxt:pill_binding`, `mxt:technique`, `mxt:artifact`, `mxt:contract_type`, `mxt:secret_realm`, `mxt:formation`, `mxt:talisman`, `mxt:aura`, `mxt:block_aura`, `mxt:quality`.

Note that `mxt:technique` is a category but `mxt:technique_binding` is not: a technique is what gets a row, and the row is the carrier stack the mod generates for it (the item the technique's declaration names as its `carrier_item`, or the jade slip), already carrying its `mxt:technique` component. See [Technique Binding](/en/datapack/json/technique_binding#carrier).

Without an argument every category is walked. A definition with no item of its own is shown on a stand-in item (a spirit stone, a contract scroll, a secret realm token, a formation plate, a talisman carrier or the identification mirror) whose row is searched by the definition's name and registry ID as well as by what the stack looks like; item-shaped registries are expanded to the items they name.

The search field matches every whitespace-separated token: a token starting with `@` matches only the item's namespace, and anything else is a substring of the row's names. An item leaves the screen exactly as it does in the creative tab — by being carried into a hotbar slot or by being thrown out of the panel — so it travels over the vanilla creative-mode channel, which the server refuses unless the player really is in creative mode. The command itself needs an executing player, the `gamemaster` permission and creative mode.
