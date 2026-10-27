---
title: /talisman
---

# `/talisman`

Hands out blank or already inscribed talisman carriers. The whole subtree needs the `gamemaster` permission, and every node also exists as `/mxt talisman …`.

<div class="cmd-tree">

- `/talisman ...`

  - `... blank [count <count>]`

    Hands you `count` blank carriers; the count accepts 1–64 and defaults to 1.

  - `... give <talisman> [count <count>] [stored]`

    Hands you carriers inscribed with that talisman definition. `count` gives several copies (1–64, one by default), and `stored` inscribes them in storing mode, so they are poured by hand instead of firing on the next click.

  - `... give <talisman> count <count> charged`

    As above, and fills the carrier's whole capacity as well, which is what makes the carrier fire on the next click; `charged` is only offered after `count`.

</div>

`/talisman` on its own hands you a single blank carrier.

Where the definition declares a `durability`, its cap is written **onto the carrier right away**, so the bar is there the moment you get it — and `count` then hands out that many **single** carriers, since a worn carrier cannot be stacked (see [the talisman definition](../../datapack/json/talisman)).

`give` takes **one** talisman ID: a carrier is inscribed with a single definition, and inscribing another replaces it. To write the item component yourself the field is the single `talisman` — `give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:flame_sigil"}]`, with the fields described under [the talisman definition](../../datapack/json/talisman).
