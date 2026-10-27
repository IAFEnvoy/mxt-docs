---
title: /hud
---

# `/hud`

Without arguments it lists every movable HUD element the framework holds: layout key, display name, the anchor it is bound to, position, size, how many blocks it offers to draw, and whether it is visible and movable.

<div class="cmd-tree">

- `/hud ...`

  - `... open`

    Opens the HUD layout editor, the same as the `key.mxt.hud_layout` keybind (right `Shift` by default).

  - `... <layout key> reset`

    Puts one element back in its default position; the layout key is in the `/hud` output, such as `resource_bars.left`.

</div>

The reset also **deletes the saved value for that element**, so it is still in its default place after a restart (with nothing saved, the element follows the window again until you move it once more).

`/hud` is a **client command**: it is registered with the client's own dispatcher, so it never enters the `/mxt` tree and nothing is sent to the server. It only works when typed into chat by hand (not from a command block, and not when another mod sends it for you), and it needs no permission. The command and the `key.mxt.hud_layout` keybind open the same editor.
