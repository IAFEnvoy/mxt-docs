---
title: Laser Particles
description: Use mxt:laser to create a vertical glowing particle column with configurable colour, direction and flow speed.
---

# Laser Particles

`mxt:laser` is a glowing particle column that only extends along the world Y axis. It is drawn by the particle system rather than an entity, so it can be used directly with `/particle`, `ParticleEffect`, and other paths that send `ParticleOptions`.

## Quick test

This command creates a default pale-yellow, upward-flowing laser that is eight blocks tall and lasts 40 ticks:

```mcfunction
/particle mxt:laser{y_max:8.0f} ~ ~ ~ 0 0 0 0 1 force
```

A blue laser flowing downward:

```mcfunction
/particle mxt:laser{color:"#FF79BFFF",y_min:-2.0f,y_max:6.0f,width:0.24f,flow_direction:"down",flow_speed:1.8f,lifetime:200} ~ ~ ~ 0 0 0 0 1 force
```

## Fields

| Field | Default | Meaning |
| --- | --- | --- |
| `color` | `#FFFFE8A8` | ARGB colour. The highest byte is the overall alpha. |
| `x` / `z` | `0` / `0` | Horizontal offset from the particle spawn point. |
| `y_min` / `y_max` | `0` / `8` | Vertical range relative to the particle spawn point; `y_max` must be greater than `y_min`. |
| `width` | `0.18` | Diameter of the bright core; the halo expands by fixed factors. |
| `flow_direction` | `"up"` | Surface-flow direction, either `"up"` or `"down"`. |
| `flow_speed` | `1` | Surface-flow speed; it cannot be negative. |
| `lifetime` | `40` | Particle lifetime in ticks. |

`color` uses an ARGB string, for example `#CCFFF0A0` is about 80% opaque. The laser uses full-bright lighting, so its colour and halo remain visible in shadow.

