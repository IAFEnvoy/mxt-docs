---
title: /curse
---

# `/curse`

Lists, applies, removes and cleanses curses. Every node also exists as `/mxt curse …`.

<div class="cmd-tree">

- `/curse ...`

  - `... list [<target>]`

    Lists the curses a holder carries: name, stacks, and the ticks left or "never expires"; without a target it looks at you, and it needs no permission.

  - `... apply <targets> <curse> [<stacks>] [<duration_ticks>]`

    Applies a curse; `stacks` is 1–256.

  - `... remove <targets> <curse>`

    Removes it with the `explicit` reason.

  - `... cleanse <targets> <tag>`

    Cleanses by `mxt:curse` tag.

</div>

`apply`, `remove` and `cleanse` need the `gamemaster` permission.

## apply

It goes through the same transaction content uses: conditions, stacking and `on_apply` behave normally. A definition the current pack does not provide (its file was deleted, or a `neoforge:conditions` block keeps it out) is refused by `ResourceArgument` while the command is parsed. `duration_ticks` can only tighten the definition's own length.

## remove

Removes with the `explicit` reason, which is also the **only way off** for a curse whose definition is no longer in the current pack.

## cleanse

Shares the `cleansed` reason with an antidote; an instance whose definition is no longer in the current pack refuses and says why.
