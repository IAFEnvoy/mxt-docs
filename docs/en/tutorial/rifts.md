---
title: Rifts
description: Build a rift from blocks, item data and commands — how to lay it out, aim it at a dimension, colour it, and where you land.
---

# Rifts

**A rift has no datapack definition.** There is no JSON to write and no id to register — the whole thing is driven by the block, the data each block keeps for itself, the item component on the Rift Anchor, and the `/mxt rift` commands. Everything below is placing blocks and running commands.

## What You Are Building

A rift you can walk into: one or more `mxt:rift` blocks, each remembering which dimension it leads to, plus a colour if you want one. No screen, and no files.

| Piece | Job |
| --- | --- |
| `mxt:rift` | The rift itself; it has a block item and is placed like any other block. Each block keeps its own destination and colour. |
| `mxt:rift_anchor` | The Rift Anchor: it only rewrites rifts that already exist. It **never places a rift**. |
| `/mxt rift` | The admin entry point for placing, inspecting and rewriting one rift. |
| Particles and rendering | Looks only, tuned from the client settings. |

## Step 1 — Placing Rifts

Three ways in, all producing the same block:

| Way | What it does |
| --- | --- |
| `/setblock <pos> mxt:rift` | A vanilla command, straight into that position. |
| Place `mxt:rift` in creative mode | The block item places like any other block. |
| `/mxt rift place <pos> <dimension>` | Places the rift and writes the destination in the same go; a position that cannot be replaced is refused. |

The first two always give you **a rift that leads to the overworld with an automatic colour**. Pointing it somewhere else takes a separate step; see Step 3.

Decide where it goes before you place it: a rift cannot be mined in survival (breaking takes -1), it is extremely blast resistant, and breaking it in creative mode drops nothing either.

## Step 2 — The Shape Comes From Position

The shape is not a parameter, and neighbours are decided by position alone: two rifts are neighbours when they differ by at most 1 on any axis, so diagonals and stacked blocks count.

| Layout | Result |
| --- | --- |
| One block on its own | Fine — it draws as a single point. |
| Inside a 3×3×3 | Two neighbouring blocks get a link between them. |
| Three blocks, every pair neighbours | They close a filled triangle. |

Unloaded chunks are skipped: a distant stretch of rifts that is not loaded yet is not a neighbour right now, and is not drawn.

## Step 3 — Aim Each Block at a Dimension

**Every rift keeps its own "which dimension" — rifts are not paired up.** A link only says the two blocks are next to each other; it says nothing about where either of them leads, and re-aiming one leaves its neighbours alone.

`/mxt rift target <pos> <dimension>` changes the dimension one block leads to, and its tab completion lists every server dimension.

For a whole row of blocks the Rift Anchor is quicker. Hold `mxt:rift_anchor` in your main hand; what you right-click decides what happens.

| Right-click on | Result |
| --- | --- |
| A rift | The dimension and colour stored in the item are applied to that block. |
| A block that is not a rift, while sneaking | The dimension you are standing in is written into the item. |
| A block that is not a rift, not sneaking | Nothing: nothing is consumed and nothing is said. |

`/mxt rift bind <dimension> [color]` is the same as the sneak-use, except it can name any dimension and colour directly; with no anchor in your main hand it only says so.

The Rift Anchor never places a rift. It only rewrites one that already exists.

## Step 4 — Colour

- **Automatic (`auto`) is the default**: a fixed colour computed from the target dimension, so the same dimension is always the same colour and different dimensions differ.
- `/mxt rift color <pos> <auto|RRGGBB|#RRGGBB>` sets a colour by hand, or writes `auto` to go back to automatic. An invalid value is refused.
- Right-clicking a rift with a dye reads vanilla's dye component and consumes one dye; creative mode consumes none.

Colour is looks only. It does not change where a rift leads.

## Step 5 — Walking Through

- An entity triggers the rift as soon as it enters the block's position. **No second block is needed.**
- **The one hard requirement for a cross-dimension jump is that the target dimension is loaded.** If it is not, nothing happens — a teleport never drags a world open. Same-dimension travel goes down the same path and teleports too.
- The landing point is the coordinate scaled between the two dimensions and clamped to the world border. **It is not "back out where you came in".**
- Near the arrival point the game looks for a rift that already **leads back the way you came**, to serve as a return landmark; if there is none it **creates one** (leading to the dimension you came from, automatic colour). The spot has to be standable — no collision, no fluid, support underneath — otherwise it tries a few blocks higher.
- On arrival you get a short slow-fall, plus a short teleport cooldown so you are not sent straight back.

## Step 6 — Inspecting It and Tuning the Look

`/mxt rift info <pos>` is the main tool: read-only, five lines — position, which dimension it leads to, colour (automatic or set by hand), link count / triangle count / how many blocks it is connected to, and whether it is isolated.

Two entries on the client settings' **Rifts** page are looks only and **change neither connectivity nor teleporting**:

| Entry | Effect |
| --- | --- |
| Custom Shaders | Turning it off uses plain translucent colour instead — the way out when the shader or the driver does not get along with it. |
| Rift Thickness | How thick the points, links and fills are drawn; there are limits, and anything outside them is clamped. |

## Verify

```text
/mxt rift info <pos>
/mxt rift target <pos> <dimension>
/mxt rift color <pos> auto
/mxt rift place <pos> <dimension>
/mxt rift bind <dimension>
```

1. `info` prints five lines; where there is no rift it says so instead of printing an empty report.
2. The whole `/mxt rift` subtree needs admin permission, read-only `info` included, and no server setting can turn it off.
3. Place two neighbouring rifts and run `info` again: the link count is no longer 0. Put three blocks down so every pair is a neighbour and the triangle count moves off 0 as well.
4. Stand inside one of the blocks and you should be sent away; on the other side there should be a rift nearby that leads back. A target dimension that is not loaded is the only thing that stops a cross-dimension jump.
5. The test pack ships a rift probe (`/mxt_test rift`).

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Nothing happens | The target dimension is not loaded, the teleport cooldown is still running, or you never actually stepped into the block. |
| You arrive somewhere else | A hand-placed rift leads to the overworld by default and its destination was never set. |
| The landing point is not the coordinate you left from | The landing point is scaled between dimensions; it is not a return trip. |
| The colour looks random | `auto` is a fixed colour computed from the target dimension, so different dimensions differ. That is normal. |
| No links or triangles appear | The blocks are not inside a 3×3×3, or the three blocks are not all neighbours of each other. |
| The Rift Anchor does nothing | It is not in your main hand, or you are facing a block that is not a rift without sneaking. |

## Next

- [Rifts](../player-guide/rift.md) — the player-guide page: how the points, links and triangles are drawn, where the colour comes from, and which of the two items does what.
- [Commands](../player-guide/commands.md) — where `/mxt rift` sits for permissions and tab completion.
