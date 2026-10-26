---
title: Light Beam Particles
description: Use mxt:light_beam to create a vertical glowing particle column with configurable colour, direction and flow speed.
---

# Light Beam Particles

`mxt:light_beam` is a glowing stream along the world Y axis with a circular cross-section. Solid streaks fill the disk by default; `filled:false` places them only on the column's surface. Each streak is a closed cylinder with a constant radius, while `spread:true` gives it a broad middle and tapered ends. Each streak chooses a random transverse position when it is emitted and keeps that position in the vertical section; later streaks choose new positions. Some streaks are thin and sharp; others are wider with a faint, soft halo. Gaps separate the streaks as they flow in the selected direction. It uses the particle system and works with `/particle`, datapack particle effects, and other particle emitters.

## Quick test

This command creates a default pale-yellow, upward-flowing light beam that is eight blocks tall and lasts 40 ticks:

```mcfunction
/particle mxt:light_beam{y_max:8.0f} ~ ~ ~ 0 0 0 0 1 force
```

A blue light beam flowing downward:

```mcfunction
/particle mxt:light_beam{color:"#FF79BFFF",y_min:-2.0f,y_max:6.0f,width:0.24f,flow_direction:"down",flow_speed:1.8f,lifetime:200} ~ ~ ~ 0 0 0 0 1 force
```

## Coloured streams

Each column uses one colour. Run these three commands separately to place cyan, golden-yellow, and violet streams nearby for 60 seconds:

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:24.0f,width:0.5f,lifetime:1200} ~-3 ~ ~5 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FFFFE91C",y_max:24.0f,width:0.5f,lifetime:1200} ~ ~ ~5 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FF9A21FF",y_max:24.0f,width:0.5f,lifetime:1200} ~3 ~ ~5 0 0 0 0 1 force
```

These commands use a `count` of `1`, with all spread values and velocity set to `0`. One particle draws a complete column; emit separately at each position when you need several columns.

## Distribution radius and density

`radius` controls the radius of the horizontal disk containing the streaks. It defaults to `0.5` blocks and accepts values from `0.001` to `64`. `width` controls the thickness and length scale of individual streaks. `density` specifies flow channels per square block of cross-section, defaults to `16`, and accepts values from `0.001` to `1024`. The channel count is `ceil(π × radius² × density)`: below the limits, doubling the radius produces approximately four times as many channels and preserves the distribution density:

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",radius:1.5f,density:16.0f,width:0.18f,y_max:12.0f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

Each column uses at most 1024 flow channels and has a draw budget of 2048 entries. Each streak uses one entry; enabling `glow` uses one additional entry for the whole column's glow. Very large radii, densities or heights produce a sparser distribution once a limit is reached. Channels determine how many streams emit streaks along the height; each streak has its own random transverse position, so they do not form fixed tracks.

The client has a total draw budget of 8192 entries per frame, shared by all columns' streaks and column glows. When the budget is exhausted, nearby columns receive a greater share of the density; if more than 8192 columns are visible, farther columns may be omitted. Cross-sections and bends use fewer subdivisions at distance, with thresholds at 32 and 96 blocks. Streaks retain a solid shape at every distance.

The local halos extend slightly beyond the distribution disk; client culling bounds include them.

## Surface distribution and static glow

`filled` defaults to `true`, distributing streaks throughout the disk. Setting it to `false` places streak centres only on the whole column's cylindrical surface, leaving the interior empty. Individual streaks keep their solid shape. Both distributions use the same `density` count formula.

`glow` defaults to `false`. Enabling it adds a static glow of the same colour inside the column. Its extent follows `radius`, `y_min` and `y_max`; its opacity follows `color` and the whole column's lifetime fade. It has no flow animation and is unaffected by `flow_direction`, `flow_speed` or `spread`. It does not extend onto the terminal planes. This switch does not affect the local halos around individual streaks.

This creates a beam with streaks only on its surface and a static glow inside:

```mcfunction
/particle mxt:light_beam{filled:false,glow:true,radius:1.0f,y_max:8.0f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

## Broader streaks

`spread` defaults to `false`, which keeps each streak as a closed cylinder with a constant radius. Set it to `true` to make every streak wider and longer, with wider streaks also receiving more length. Each tapers smoothly from its broad middle to pointed upper and lower ends, while retaining its own brightness, opacity, and soft glow:

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:24.0f,width:0.5f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

In JSON, put the boolean inside the particle object. It controls streak shape; the outer particle effect's `spread` array controls emission scatter. Both can be used together:

```json
{
  "particle": {
    "type": "mxt:light_beam",
    "y_max": 24.0,
    "radius": 1.5,
    "density": 16.0,
    "width": 0.5,
    "spread": true,
    "filled": false,
    "glow": true,
    "lifetime": 1200
  },
  "count": 1,
  "speed": 0,
  "spread": [0, 0, 0]
}
```

## Flow at the terminal planes

`bottom_effect` and `top_effect` independently enable the lower and upper terminal effects. Both default to `false`. Streaks turn smoothly along a circular arc between the vertical column and a horizontal plane, keeping their solid cross-sections. `spread` still selects constant-radius or tapered streaks. The planes are at `y_min` and `y_max`; they do not inspect blocks or tilt with terrain.

| `flow_direction` | Lower terminal | Upper terminal |
| --- | --- | --- |
| `"up"` | Converge inward along the plane, then flow upward | Turn onto the plane and spread outward |
| `"down"` | Turn onto the plane and spread outward | Converge inward along the plane, then flow downward |

These two columns flow upward and downward, with both terminals enabled:

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:8.0f,radius:0.8f,width:0.18f,spread:true,bottom_effect:true,top_effect:true,lifetime:1200} ~-3 ~ ~6 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FFFF79BF",y_max:8.0f,radius:0.8f,width:0.18f,spread:true,flow_direction:"down",bottom_effect:true,top_effect:true,lifetime:1200} ~3 ~ ~6 0 0 0 0 1 force
```

For outward flow at the lower terminal only, select downward flow and enable only `bottom_effect`:

```mcfunction
/particle mxt:light_beam{y_max:8.0f,flow_direction:"down",bottom_effect:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

The outward reach is automatically set to `max(0.75, radius × 1.5, width × 4)` blocks and fades near its outer edge. Streak centres lie on the terminal plane, while their cross-sections and halos extend slightly to either side. Client culling bounds include the full extension and halos. Terminals share the column's draw budget of 2048 entries; enabling them increases mesh cost.

## Fields

| Field | Default | Meaning |
| --- | --- | --- |
| `color` | `#FFFFE8A8` | ARGB colour. The highest byte is the overall alpha. |
| `x` / `z` | `0` / `0` | Horizontal offset from the particle spawn point. |
| `y_min` / `y_max` | `0` / `8` | Vertical range relative to the particle spawn point; `y_max` must be greater than `y_min`. |
| `radius` | `0.5` | Distribution radius of the horizontal disk, from `0.001` to `64` blocks. |
| `density` | `16` | Flow channels per square block of cross-section, from `0.001` to `1024`. |
| `width` | `0.18` | Individual streak size; its halo spans at most 1.4 times this value. |
| `spread` | `false` | Keep a closed constant-radius cylinder; `true` makes streaks wider and longer, with a broad middle and smoothly tapered, pointed ends. |
| `filled` | `true` | Distribute streaks throughout the disk; `false` places them only on the whole column's surface. |
| `glow` | `false` | Draw a static glow of the same colour inside the column. |
| `bottom_effect` | `false` | Enable inward or outward flow on the lower plane at `y_min`. |
| `top_effect` | `false` | Enable inward or outward flow on the upper plane at `y_max`. |
| `flow_direction` | `"up"` | Streak movement direction, either `"up"` or `"down"`. |
| `flow_speed` | `1` | Streak movement speed; it cannot be negative. |
| `lifetime` | `40` | Particle lifetime in ticks. |

`color` uses an ARGB string, for example `#CCFFF0A0` is about 80% opaque. The light beam uses full-bright lighting, so its colour and halo remain visible in shadow.

Set `flow_speed:0.0f` to pause streak movement. Columns fade in and out at the beginning and end of their lifetime, and each column starts at a slightly different point in the pattern.

## Scene depth enhancement

Client configuration “World Effects → Scene depth enhancement” is disabled by default. When enabled, streaks fade softly where they meet opaque terrain, and the column glow is clipped against that terrain. It reads the opaque scene only: it does not provide exact occlusion between glass, water or other transparent effects, and does not add screen-space bloom.

The basic effect is used when the enhancement is unavailable. With shader packs, check occlusion in front of and behind walls, from inside the column, and while moving the camera. Disable this option if the effect becomes misaligned or leaks through surfaces. The particle's `glow` parameter still determines whether the column glow is drawn.

## Visibility of tall columns

The server uses vanilla particle delivery rules, measuring from the centre of the player's block to the particle spawn point: 32 blocks in normal mode or 512 blocks with `force`. `radius`, `x` / `z`, the vertical range and terminal extensions do not expand this range. A nearby section of a column is not enough to receive the particle if its spawn point is too far away.

Once received, the client checks the full column against the view. A visible middle or upper section is enough to draw it; the spawn point does not need to be on screen. Terrain occlusion and distance fog still apply. Its emissive appearance does not illuminate nearby blocks.

