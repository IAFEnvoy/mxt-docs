---
title: /display
---

# `/display`

Shows a piece of equipped gear in chat, optionally to a single player. Every form also exists as `/mxt display …`, and it is player-only.

<div class="cmd-tree">

- `/display`

  Shows your main hand item and broadcasts it to everyone.

- `/display <player|slot>`

  A slot name shows that slot of yours and broadcasts it; a player name sends your main hand to that player privately.

- `/display <player> <slot>`

  Sends that player the named slot privately.

</div>

The slot names are `mainhand`, `offhand`, `head`, `chest`, `legs` and `feet`; an empty slot, an unknown player name or an unknown slot name is reported instead. The item is shown with the vanilla item hover.
