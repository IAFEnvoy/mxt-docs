---
title: /lightning
---

# `/lightning`

Strikes a bolt right now; needs the `gamemaster` permission. Also available as `/mxt lightning …`.

<div class="cmd-tree">

- `/lightning ...`

  - `... [pos] color <six hex digits> [alpha [thickness [damage [visual_only]]]]`

    A single-colour bolt: strikes one bolt of that colour at `pos`.

  - `... [pos] palette <colour,colour,…> [alpha [thickness [damage [visual_only]]]]`

    A gradient bolt: the colour runs down the list from the top to the ground.

</div>

Without `pos` the bolt lands at the command executor's feet. Apart from the colour it is a vanilla lightning bolt: damage, ignition, lightning-rod charging, copper oxidation, the thunder and the sky flash, and the lightning transformations (villager to witch, pig to zombified piglin, creeper to charged creeper) all happen as usual.

```
/mxt lightning
/mxt lightning ~ ~ ~
/mxt lightning ~ ~ ~ color 66CCFF
/mxt lightning ~ ~ ~ color 66CCFF alpha 0.5 thickness 2 damage 10 visual_only
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF,FF4444 alpha 0.5 visual_only
```

## Arguments

| Argument | Default | Description |
|---|---|---|
| `pos` | the executor's position | The landing position; `~` relative coordinates are accepted. |
| `color <six hex digits>` | `737380` (the vanilla cool white) | Written without `#`, for example `66CCFF`; tab completion offers a few common colours. |
| `palette <colour,colour,…>` | none | A **gradient**: comma-separated six-digit hexadecimal colours, the **first at the top** (where the bolt starts) and the last at the ground, at most 16 of them; tab completion offers a few presets. Once `palette` is written, `color` no longer tints the bolt. |
| `alpha <0..1>` | `0.3` | The bolt's **brightness**. Vanilla lightning is additive-blended, so the vertex colour's `RGB × alpha` is its glow strength — it is not an opacity. |
| `thickness <0.1..4>` | `1` | The thickness multiplier of the bolt column. |
| `damage <≥0>` | `5` | The lightning damage. |
| `visual_only` | off | Strikes the bolt without damage or ignition, for pure decoration. |

`color <colour>` and `palette <gradient>` are two alternative branches, and each is followed by the same fixed-order tail `[alpha [thickness [damage [visual_only]]]]`: to write a later one you must write the earlier ones too (tab completion walks you through whatever is left), so reaching `thickness` means writing a colour or a gradient and then `alpha`.

The datapack-side behaviour `mxt:spawn_lightning` accepts any combination of its fields, with the gradient written as `palette`; see the [entity action types](../../datapack/types/action/entity_action_types.md).

Registry ids in the command use the vanilla `ResourceArgument`, which also answers the parsing, the tab completion and the "no such entry" error; the suggestions come from the server's current registries, so whatever completion offers is usable, because an entry a `neoforge:conditions` block keeps out never enters the registry. For the arguments that do not take that road, see "Completion" on the [commands overview](../commands.md).
