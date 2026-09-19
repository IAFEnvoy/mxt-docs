---
title: Keys and HUD
description: Default keybinds, the shared ability and spirit power hotbar, resource bars, the aura HUD, the character information panel and the technique panel.
---

# Keys and HUD

MiXianTu ships the client-side controls and overlays that its framework gameplay needs: keybinds, a shared ability and spirit power hotbar, resource bars, an aura HUD and a character information panel. They all work with the mod installed on its own, even before any datapack adds content.

## Keybinds

| Keybind ID | Default | Name in the language file | Action |
|---|---|---|---|
| `key.mxt.cultivate` | `C` | Toggle Cultivation Mode | Starts or stops cultivating. |
| `key.mxt.information_panel` | `Z` | Open Character Information | Opens the character information panel when no other screen is open. |
| `key.mxt.technique_panel` | unbound | Open Technique Panel | Opens the technique panel when no other screen is open. It is also reachable from a button in the character information panel, which is why it ships without a default key. |
| `key.mxt.ability_menu` | `LAlt` | Show Ability Hotbar | Opens the shared hotbar on its ability entries. |
| `key.mxt.spirit_burst` | `V` | Fire Spirit Power | Opens the shared hotbar on its spirit power entries; the chosen resource fires while its number key is held. |
| `key.mxt.swap_back` | unbound | Swap Main Hand with Back Weapon Slot | Swaps the main hand stack with the first `back_weapon` Curios slot. |

The first four keybinds live in the `MiXianTu` category (`key.category.mxt.general`) and the two hotbar keybinds in the `MiXianTu Hotbar` category (`key.category.mxt.hotbar`). Every one of them can be changed in the vanilla controls settings; "Swap Main Hand with Back Weapon Slot" and "Open Technique Panel" are unbound by default. See [Curios Slots](./curios-slots.md) for the slot rules the swap keybind follows.

## Ability and Spirit Power Hotbar

Abilities and spirit power share one client hotbar. Opening one automatically closes the other.

- Number keys `1`–`9` select entries, and several number keys can be held at the same time.
- The vanilla `1`–`9` hotbar selection is intercepted while the hotbar is open; the mouse wheel still switches inventory slots. The client setting **Client Settings → Ability Hotbar → Vanilla Number Keys** (off by default) restores vanilla number-key selection.
- The client setting **Client Settings → Ability Hotbar → Open Mode** chooses between "Hold to Show" (the default) and "Press to Toggle".
- While the ability hotbar is open, a casting progress bar is drawn above it.

The hotbar shows up to nine entries. The **Configure Hotbar** screen (`screen.mxt.hotbar_configuration`) chooses which entries appear in which slot: open it with `/mxt aura` for the spirit power entries and `/mxt ability` for the ability entries. A saved entry whose definition no longer exists in the current datapack is filled from the current runtime entries, while a slot deliberately left empty stays empty.

::: info

Entries and casting are server-authoritative: the client sends a request, and the server decides costs, cooldowns, durations and effects. Client code can register its own entries for a hotbar mode — see the [Java API hotbar page](../java/hotbar.md).

:::

## Resource Bars and Aura HUD

Resource bars and the aura concentration bar are driven by server-synced state; the client only draws them. The server syncs the aura at your position every **Server Config → Aura → Sync Period** ticks (5 by default), and fog and particles never decide aura values in reverse.

| Client setting | Effect |
|---|---|
| **Client Settings → Resource Bars → Show Names** | Shows the name next to each resource bar. |
| **Client Settings → Resource Bars → Icon Layout** | Draws the icons on "Two Sides" (default) or in the "Center". |

Bars are labelled by their context, for example Stored aura, Sensed concentration, and environmental or actual concentration of a resource. A bar can also be drawn for a target or a boss. To inspect raw values instead, use `/mxt resourcebar` and `/mxt aura query` — see [Commands](./commands.md).

## Character Information Panel

`Z` opens the **Character Information** panel (`screen.mxt.information_panel`) when no other screen is open.

| Group | Entries |
|---|---|
| Basic Information | Health, food, experience level, dimension. |
| Cultivation Information | Realm (or Mortal), cultivation progress, whether you are currently cultivating, the breakthrough state, spirit roots, physiques and techniques. |

The breakthrough line reports whether the required progress is reached and whether its conditions are met. The client setting **Client Settings → Information Panel → Refresh Interval** (20 by default) controls how often the panel refreshes.

## Technique Panel

The **Techniques** panel (`screen.mxt.technique_panel`) lists every technique you have learned, one row each, and scrolls when the list is longer than the panel. Open it with its own keybind — unbound by default — or with the **Techniques** button in the character information panel.

| Row part | Shows |
|---|---|
| Icon | The technique's icon, inside a slot frame. A technique that defines no `icon` leaves the frame empty. |
| Level | The name of the level you stand on, plus your rank in that chain, as `Level <name> (<rank>/<total>)`. A level whose data pack defines no display name falls back to the rank number. |
| Mastery | Your mastery against what the next level asks for, as `<current> / <required>`, or `Mastered` at the top of a chain. |
| Progress bar | How far along that requirement you are, tinted with the mastery resource's particle colour. |

Hovering a row shows the technique's full name, the level's ID and the technique's `grade` as `Grade: <value>`. A grade is free-form text, so it is shown exactly as the data pack wrote it unless the language file defines `mxt.technique_grade.<grade>`, which is how a pack translates its own grades. A technique that defines no mastery chain is listed with `Level -` and no progress; a technique with a chain but no `mastery_resource` shows `No mastery`.

Two things decide what the bar measures, and the client setting **Client Settings → Techniques → Progress Display** switches between them:

- **Total Mastery** (the default) measures your stored value against the next level's requirement, so the bar spans the whole climb and the numbers match the `mastery` field of [`skill_stage`](../datapack/json/skill_stage.md).
- **Within Level** subtracts what the current level already asked for, so every level starts from an empty bar.

The panel is a view over synchronized state — learned techniques, their levels and their mastery values all reach the client already — so it never asks the server for anything and refreshes on the same interval as the character information panel.

## Spirit Crafting Table

The Spirit Crafting Table (`mxt:spirit_crafting_table`) reuses the vanilla crafting layout but only accepts `spirit_shaped` and `spirit_shapeless` recipes. Items placed in the grid stay in the menu, and aura is only accepted when a matching recipe is present; it is deducted when the result is taken out of the output slot. JEI lists the spirit recipes together with their aura cost, and Jade shows how much aura the table currently holds.

## Display Stand

A Display Stand (`mxt:oak_display_stand` and the five other wood variants) holds a single item:

- Using an item on an empty stand places one of that item on the stand.
- Using the stand again returns the displayed item, which drops above the centre of the block. Breaking the stand also drops it.
- If the displayed item implements the aura access interface, Jade shows the item and its spirit power percentage, and the stand tries to charge a displayed spirit stone whenever it receives spirit power.

See [Items and Blocks](./items.md) for the full block list.

## /display Command

`/display [player] [slot]` shows an equipped item in chat as a hoverable item link.

| Usage | Result |
|---|---|
| `/display` | Broadcasts your main hand item to the whole server. |
| `/display <slot>` | Broadcasts your item in that slot. Available slots: `mainhand`, `offhand`, `head`, `chest`, `legs`, `feet`. |
| `/display <player>` | Sends your main hand item to that player only. |
| `/display <player> <slot>` | Sends your item in that slot to that player only. |

The command requires a player and no operator permission. It reads vanilla equipment slots, so Curios slots are not accepted. See [Commands](./commands.md) for the rest of the command surface.
