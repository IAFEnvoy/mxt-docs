---
title: /lightning
---

# `/lightning`

| Command | Effect |
|---|---|
| `/mxt lightning [pos] [color … \| palette …]` (= `/lightning`) | Strikes a bolt right now; needs the `gamemaster` permission. A single colour or a gradient, plus brightness, thickness and damage, are optional in a fixed order, described below. |

## `/mxt lightning`

Strikes a bolt at the given position; without `pos` it lands at the command executor's feet. Apart from the colour it is a vanilla lightning bolt: damage, ignition, lightning-rod charging, copper oxidation, the thunder and the sky flash, and the lightning transformations (villager to witch, pig to zombified piglin, creeper to charged creeper) all happen as usual.

```
/mxt lightning
/mxt lightning ~ ~ ~
/mxt lightning ~ ~ ~ color 66CCFF
/mxt lightning ~ ~ ~ color 66CCFF alpha 0.5 thickness 2 damage 10 visual_only
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF,FF4444 alpha 0.5 visual_only
```

| Argument | Default | Description |
|---|---|---|
| `pos` | the executor's position | The landing position; `~` relative coordinates are accepted. |
| `color <six hex digits>` | `737380` (the vanilla cool white) | Written without `#`, for example `66CCFF`; tab completion offers a few common colours. |
| `palette <colour,colour,…>` | none | A **gradient**: comma-separated six-digit hexadecimal colours, the **first at the top** (where the bolt starts) and the last at the ground, at most 16 of them; tab completion offers a few presets. Once `palette` is written, `color` no longer tints the bolt. |
| `alpha <0..1>` | `0.3` | The bolt's **brightness**. Vanilla lightning is additive-blended, so the vertex colour's `RGB × alpha` is its glow strength — it is not an opacity. |
| `thickness <0.1..4>` | `1` | The thickness multiplier of the bolt column. |
| `damage <≥0>` | `5` | The lightning damage. |
| `visual_only` | off | Strikes the bolt without damage or ignition, for pure decoration. |

`color <colour>` and `palette <gradient>` are two alternative branches, and each is followed by the same fixed-order tail `[alpha [thickness [damage [visual_only]]]]`: to write a later one you must write the earlier ones too (tab completion walks you through whatever is left), so reaching `thickness` means writing a colour or a gradient and then `alpha`. The datapack-side behaviour `mxt:spawn_lightning` accepts any combination of its fields, with the gradient written as `palette`; see the [entity action types](../../datapack/types/action/entity_action_types.md).
