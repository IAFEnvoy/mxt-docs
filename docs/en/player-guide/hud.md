---
title: HUD and Panels
---

# HUD and Panels

The movable HUD elements, the resource and aura bars, and the character panel on `Z`. The keybinds themselves are on [Keys and Wheel](./keys-and-wheel.md).

## HUD Layout Editor

"Edit HUD Layout" (right `Shift` by default) opens a screen of its own: every movable HUD element the framework knows about is drawn with a translucent rectangle and its name. **Drag with the left button**, or **nudge with the arrow keys** one pixel at a time (`Shift` moves ten), and `Escape` drops the element currently in hand; the Done button in the bottom right closes the screen. A position is written to the HUD layout file as it moves, so leaving halfway through loses nothing. This version of the editor adds three things: **the eight squares along the window border are anchors** - dropping an element on one binds it there (binding never makes the element jump: it only changes which window point the position is measured from, and from then on the element follows that point as the window grows or shrinks) and draws a connecting line from the anchor to the element; **the small box inside an element's top-right corner is its visibility checkbox** - unchecking it stops the element from being drawn, but it stays a faint block in the editor (the checkbox itself stays opaque) so you can always turn it back on; and **the selection survives releasing the button**, so the arrow keys and the connecting line do not need the mouse held down.

**What can be dragged today is the two columns of resource bars and the wheel's grid** - the stacks either side of the centre of the screen, each column moving as one piece; and the twelve wheel cells, which start against the left edge of the window halfway down and carry a cooldown as the vanilla item sheet on the cell itself. Which column a resource appears in is declared by the data pack (`anchor` in `resource.bars`), but **where the columns sit is the player's own setting**: pull them apart to clear another mod's HUD, or move the right column towards the middle to watch a target's resources. The target and boss overlays are pinned to the entity under the crosshair and do not move, and the editor deliberately does not blur its background - the elements being placed would be blurred with it.

Positions are stored as a **window anchor plus a pixel offset** (the `layout` table in `config/mxt/mxt-hud.json`, keyed `resource_bars.left` / `resource_bars.right` / `wheel.selection`, each value shaped like `{"anchor": {"horizontal": "center", "vertical": "bottom"}, "offset_x": -55, "offset_y": -47, "visible": true}`), so a layout survives a change of resolution or GUI scale. An element is always kept inside the window: shrinking the window pins it to the edge without rewriting what is stored, and growing it back returns the element to where it was. The file is read and written by the mod itself rather than by the settings framework.

A column that has never been dragged keeps its default place: **its default anchor is the midpoint of the window's bottom edge**, the left column's anchor sits left of the centre of the screen and the right one's to the right of it (`20` pixels plus half a column away from the centre), and the anchor's height is 47 pixels up from the bottom - which is exactly where those two columns used to be. As bars come and go the column grows upward and its bottom edge stays put, and the default follows the window. Drop a column on another anchor square (left-centre, top-right, bottom-centre, …) and it binds to that one instead, following that point from then on. **In a save with no resource bars both columns still draw as empty boxes**, so you can place them first and have them ready when there is something to show.

::: info

The layout editor belongs to the framework the mod draws its own HUD elements with; the two resource-bar columns and the wheel's grid are what is wired into it so far. If you cannot find something, type `/hud` in chat: it lists every movable element with its layout key, **the anchor it is bound to**, position, size and whether it currently has anything to draw, and `/hud <layout key> reset` puts one back in its default place, **deleting the saved value** so it is still there after a restart. See the [client screens page](../java/screens.md) for how a module plugs an element in.

:::

## Resource Bars and Aura HUD

Resource bars and the aura concentration bar are driven by server-synced state; the client only draws them. The server syncs the aura at your position every **Server Config → Aura → Sync Period** ticks (5 by default), and fog and particles never decide aura values in reverse.

| Client setting | Effect |
|---|---|
| **Client Settings → Resource Bars → Show Names** | Shows the name next to each resource bar. |
| **Client Settings → Resource Bars → Icon Layout** | Draws the icons on "Two Sides" (default) or in the "Center". |

Bars are labelled by their context, for example Stored aura, Sensed concentration, and environmental or actual concentration of a resource. A bar can also be drawn for a target or a boss. To inspect raw values instead, use `/resource` and `/mxt aura query` — see [Commands](./commands.md).

## Character Information Panel

`Z` opens the **Character Information** panel (`screen.mxt.information_panel`) when no other screen is open, and pressing `Z` again while it is up closes it (`Esc` closes it too). The **Character Info** and **Learned Techniques** tabs at the panel's top left switch between its two pages, which share one panel; the panel carries no separate title line.

| Group | Entries |
|---|---|
| Basic Information | Health, food, experience level, dimension. |
| Cultivation Information | Realm (or Mortal), cultivation progress, whether you are currently cultivating, the breakthrough state, spirit roots, physiques and techniques. |

The breakthrough line reports whether the required progress is reached and whether its conditions are met. The client setting **Client Settings → Information Panel → Refresh Interval** (20 by default) controls how often the panel refreshes.

## Learned Techniques Page

The technique page (`screen.mxt.technique_panel`) is the second page of the character information panel: open the panel with `Z` and click the **Learned Techniques** tab. It lists every technique you have learned, one row each, and scrolls when the list is longer than the page.

| Row part | Shows |
|---|---|
| Icon | The technique's icon, inside a slot frame. A technique that defines no `icon` leaves the frame empty. |
| Name | The technique's own name, in the ordinary text colour (**a technique no longer has a grade of its own**, so there is no tier colour to draw it in). A name too long for the line is cut with an ellipsis, while the level beside it is never cut for the name's sake. |
| Level | The name of the level you stand on, plus your rank in that chain, as `Level <name> (<rank>/<total>)`. A level whose data pack defines no display name falls back to the rank number. |
| Mastery | Your mastery against what the next level asks for, as `<current> / <required>`, or `Mastered` at the top of a chain. |
| Progress bar | How far along that requirement you are, tinted with the mastery resource's particle colour. |

Hovering a row shows the technique's full name and the level's ID; **there is no "Grade" line any more**, because a technique no longer declares a tier of its own. A technique that defines no progression chain is listed with `Level -` and no progress; a technique with a chain but no `mastery_resource` shows `No mastery`.

Two things decide what the bar measures, and the client setting **Client Settings → Techniques → Progress Display** switches between them:

- **Total Mastery** (the default) measures your stored value against the next level's requirement, so the bar spans the whole climb and the numbers match the `mastery` field of [`progression`](../datapack/json/progression.md).
- **Within Level** subtracts what the current level already asked for, so every level starts from an empty bar.

The panel is a view over synchronized state — learned techniques, their levels and their mastery values all reach the client already — so it never asks the server for anything and refreshes on the same interval as the character information panel.
