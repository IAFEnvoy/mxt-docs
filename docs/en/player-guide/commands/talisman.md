---
title: /talisman
---

# `/talisman`

| Command | Effect |
|---|---|
| `/talisman` (= `/mxt talisman`) | Hands you a blank talisman carrier. Every node of the subtree needs the `gamemaster` permission. |
| `/talisman blank [count <count>]` (= `/mxt talisman blank [count <count>]`) | Hands you `count` blank carriers; the count accepts 1–64 and defaults to 1. |
| `/talisman give <talisman> [count <count>] [stored]` (= `/mxt talisman give …`) | Hands you carriers inscribed with that talisman definition; `count` gives several copies (1–64, one by default), and `stored` inscribes them in storing mode, so they are poured by hand instead of firing on the next click. |
| `/talisman give <talisman> count <count> charged` (= `/mxt talisman give …`) | As above, and pours the whole bill in as well, which is what makes the carrier fire on the next click. `charged` is only offered after `count`. |

`give` takes **one** talisman ID, and a carrier is inscribed with a single definition; the old comma-separated list is gone. To write several onto one carrier (a firing sigil next to a storing one, say), use the item component instead: `give @s mxt:talisman[mxt:talisman={talismans:["mxt_test:flame_sigil","mxt_test:common_sigil"]}]`, with the fields described under [the talisman definition](../../datapack/json/talisman).
