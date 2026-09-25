---
title: /hud
---

# `/hud`

| Command | Effect |
| --- | --- |
| `/hud` | Lists every movable HUD element the framework holds: layout key, display name, position, size, how many blocks it offers to draw, and whether it is visible and movable. |
| `/hud open` | Opens the HUD layout editor, the same as the `key.mxt.hud_layout` keybind (right `Shift` by default). |
| `/hud <layout key> reset` | Puts one element back in its default position; the layout key is in the `/hud` output, such as `resource_bars.left`. The reset also **deletes the saved value for that element**, so it is still in its default place after a restart (with nothing saved, the element follows the window again until you move it once more). |

`/hud` is a **client command**: it is registered with the client's own dispatcher, so it never enters the `/mxt` tree and nothing is sent to the server. It only works when typed into chat by hand (not from a command block, and not when another mod sends it for you), and it needs no permission. The command and the `key.mxt.hud_layout` keybind open the same editor.

## Why it exists

"The editor holds nothing" and "an element is registered but has nothing to draw this frame" look identical on screen, and this is the only thing that tells them apart:

- `The HUD layout holds no movable element` means the framework has nothing registered at all;
- `resource_bars.left` / `resource_bars.right` / `wheel.selection` with `0 blocks` means the framework does hold elements and simply has nothing to draw right now — in a save with no resource bars those two columns still draw empty frames (71x8, the size of an empty column), while the wheel grid draws itself, so it always reports `0 blocks` and its size follows its contents.

The position and size it prints are the element's rectangle **right now**: positions are stored as a fraction of the window, so changing the resolution or the GUI scale does not move the layout, and an element is always kept inside the window.

Dragging, resetting and each element's default place are on [Wheel, Resource Bars and Aura HUD](../keys-and-hud.md#hud-layout-editor); how a module registers an element is on [Client Screens](../../java/screens.md).
