---
title: /curse
---

# `/curse`

| Command | Effect |
|---|---|
| `/mxt curse list [<target>]` (= `/curse`) | Lists the curses a holder carries: name, stacks, and the ticks left or "never expires". Without a target it looks at you, and it needs no permission. |
| `/mxt curse apply <targets> <curse> [<stacks>] [<duration_ticks>]` (= `/curse apply …`) | Applies a curse (needs the `gamemaster` permission); `stacks` is 1–256. It goes through the same transaction content uses: conditions, stacking and `on_apply` behave normally, and a definition the current pack does not provide (its file was deleted, or a `neoforge:conditions` block keeps it out) is refused by `ResourceArgument` while the command is parsed. `duration_ticks` can only tighten the definition's own length. |
| `/mxt curse remove <targets> <curse>` (= `/curse remove …`) | Removes it with the `explicit` reason (needs the `gamemaster` permission). This is also the **only way off** for a curse whose definition is no longer in the current pack. |
| `/mxt curse cleanse <targets> <tag>` (= `/curse cleanse …`) | Cleanses by `mxt:curse` tag (needs the `gamemaster` permission), with the same `cleansed` reason an antidote uses; an instance whose definition is no longer in the current pack refuses and says why. |
