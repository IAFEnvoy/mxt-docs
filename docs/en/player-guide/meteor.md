---
title: Meteors
description: "Summon mxt:meteor and customize its burning color, size, tail, and flight velocity."
---

# Meteors

`mxt:meteor` displays one continuous flame volume, with a moving head and a tail extending opposite its direction of travel. The flame changes over time, and relative wind affects the tail's length and bend. The entity has no gravity and travels in a straight line at its current velocity. It deals no damage and creates no explosion by default.

## Summoning

Start with a stationary meteor nearby to inspect the flame:

```mcfunction
/summon mxt:meteor ~ ~2 ~3 {lifetime:1200}
```

A stationary meteor's tail points upward. This example spawns a meteor overhead, moving along positive world X while descending. `Motion` is measured in blocks per tick:

```mcfunction
/summon mxt:meteor ~ ~12 ~ {Motion:[0.3d,-0.15d,0.0d],lifetime:200}
```

Remove all meteors in the current dimension:

```mcfunction
/kill @e[type=mxt:meteor]
```

## Appearance and Lifetime

| NBT field | Default | Meaning |
| --- | --- | --- |
| `color` | `-419460558` (`#E6FF8A32`) | ARGB color of the whole flame. |
| `radius` | `0.55` | Flame head radius in blocks. |
| `tail_length` | `3` | Base tail length in blocks. |
| `scale` | `1` | Overall flame scale. |
| `lifetime` | `80` | Lifetime in ticks. |

`color` is a signed 32-bit integer, with opacity in its highest byte. The hot core approaches white while the tail darkens. All three size fields must be finite and positive; their effective range is `0.01`–`32`. Lifetime must be a positive integer and is capped at `72000` ticks. Visual dimensions do not change the `0.2 × 0.2` block collision box.

This example creates a larger blue flame with `CC` opacity, about 80%:

```mcfunction
/summon mxt:meteor ~ ~2 ~4 {color:-864495105,radius:0.8f,tail_length:4.0f,scale:1.5f,lifetime:1200}
```

Without `collide_action`, the meteor passes through blocks until its lifetime expires. `collide_action` and `caster` follow the same rules as [sword aura impacts](/en/tutorial/launch-a-sword-aura): solid blocks are checked only when an impact action is present, and an impact removes the meteor. The action is attributed to `caster`; if the caster cannot be resolved, the meteor simply disappears. Entity collisions and fluids are not checked.

## Flame Settings and Visual Checks

Client configuration “Projectile Flames → Enable projectile flames” controls the effect. Disabling it makes meteors invisible. Flame intensity, wind coefficient, world wind, and distance settings are shared with sword auras. Near, middle, and far effects switch at `16`, `48`, and `128` blocks by default; flames are hidden beyond the maximum distance. Particle sample counts and surface flame opacity affect sword auras only.

Inspect stationary and moving flames from the side, head-on, and close to the core. Also check occlusion behind walls and the appearance through glass or water. Animation should stop while the game is paused. Meteors are visual entities; summoning one does not automatically ignite nearby blocks.
