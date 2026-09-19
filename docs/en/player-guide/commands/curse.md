---
title: /curse
---

# `/curse`

| Command | Effect |
|---|---|
| `/mxt curse list [<target>]` (= `/curse`) | Lists the curses a holder carries: name, stacks, and the ticks left or "never expires". Without a target it looks at you, and it needs no permission. |
| `/mxt curse apply <targets> <curse> [<stacks>] [<duration_ticks>]` (= `/curse apply …`) | Applies a curse (needs the `gamemaster` permission); `stacks` is 1–256. It goes through the same transaction content uses: conditions, stacking and `on_apply` behave normally, and a definition that is disabled through `#mxt:disabled` or deleted is refused with the reason. `duration_ticks` can only tighten the definition's own length. |
| `/mxt curse remove <targets> <curse>` (= `/curse remove …`) | Removes it with the `explicit` reason (needs the `gamemaster` permission). This is also the **only way off** for a disabled or deleted definition. |
| `/mxt curse cleanse <targets> <tag>` (= `/curse cleanse …`) | Cleanses by `mxt:curse` tag (needs the `gamemaster` permission), with the same `cleansed` reason an antidote uses; a frozen instance refuses and says why. |
