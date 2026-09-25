---
title: /wheel
---

# `/wheel`

| Command | Effect |
| --- | --- |
| `/wheel` (= `/wheel configure`) | Opens the **wheel editor**, the same as the `key.mxt.wheel_configuration` keybind (**unbound by default** - set one in the controls screen if you want it). |

**Opening it asks nothing of the server.** The editor is purely client-side: it reads the attachments and registries that have already been synchronised, so this command sends no payload and needs no permission - `/wheel` and `/wheel configure` are two spellings of the same entry point. **Outside a world it does not open an empty screen**: it only answers "the wheel editor cannot be opened right now - enter a world first".

## What the editor does

- The upper row holds two pools: **six columns of spirit power on the left** and **six columns of abilities on the right** (abilities the player holds plus the ones the carried artifacts declare, skills that need a key included), each scrolling on its own, with a tooltip on hover.
- The row underneath is the **main wheel**'s twelve cells (`1` is straight up, counting clockwise): left-click an entry in a pool to pick it up, then click a cell to put it there; clicking a cell with nothing picked clears it.
- `Escape` **saves and closes** (this screen has no cancel: nothing on it happens by accident). Saving sends the **whole layout**: the server forces it to twelve cells, checks every id against the registry its kind names, and only then stores it in your save.
- A saved entry that later goes stale (the grant was revoked, the definition was deleted, its conditions no longer hold) draws a red `?` and says so in its tooltip. It is **never replaced by something else** - nothing drifts between cells - and clicking that cell is how you clear it.

## Only the main wheel is edited here

**The pages behind it are not here**: the cells contributed by the main hand, the off hand, artifacts and a contract beast are read **live** from what you carry and from the beast bell in your hand, so what the editor would show and what you see in a fight are not the same thing - the editor neither previews nor edits them (its header line says so). **A fresh save starts with an empty wheel**: nothing is filled in for you, so put entries into the twelve cells here first; with **the whole wheel empty**, pressing "Wheel Select" (`R` by default) does not open the wheel, because there is nothing to choose.

How the wheel itself is used (`R` to choose, `V` to use, paging, cooldowns and stale entries) is on [Wheel, Resource Bars and Aura HUD](../keys-and-hud.md#wheel-menu); how cells are numbered and why the layout lives on the server is on [Wheel Entries](../../java/wheel.md).
