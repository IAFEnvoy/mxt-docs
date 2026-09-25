---
title: Rifts
description: How the Rift block and the Rift Anchor work — how the points, links and triangles are drawn, where the colour comes from, where you land, which of the two items does what, and what /mxt rift can do.
---

# Rifts

A rift (the `mxt:rift` block and its own block item) is a door to another dimension and draws a network of points and links; the Rift Anchor (`mxt:rift_anchor`) is what re-aims one at another dimension.

## Points, Links and Triangles

`mxt:rift` is a block that is invisible, has no collision and emits light level 15. It draws no model of its own; everything you see is built by a block entity renderer. It has **no direction**, and needs none — a link joins two neighbouring points, and there is nothing for a direction to decide:

| Behaviour | Rule |
| --- | --- |
| Point | Every rift draws a **cube** at its own block centre: its point. It is drawn whether or not there are neighbours, and it is the block's most basic form. |
| Link | It scans the **3×3×3 (26 neighbours)** around itself and links to **every rift it finds there**, whichever way either of them faces. |
| How a link is drawn | Each link is drawn from **both ends, half each**: from its own centre to the midpoint between the two centres. The halves meet exactly in the middle, so no block needs to know whether the other half is being drawn right now. |
| Triangle | If two of a rift's links are neighbours of each other as well, those three blocks close a triangle and **its interior is filled**. The fill is also drawn per block: each corner draws the share from "itself to the triangle's centroid", and the three shares tile the triangle exactly, with each share covering exactly one third of its area. |
| Thickness | The point's side, a link's diameter and a fill's thickness are **one value**, set by the client setting **Rifts → Rift Thickness** (default `0.125` of a block, range `0.0001`–`0.5`). A fill is not a sheet: it is drawn as a slab of that thickness with a top and a bottom face and closed outer edges. |

The 26-neighbour reach is much denser than linking along a line: the eight blocks of a 2×2×2 are all neighbours of each other, so they draw 28 links and close 56 triangles. Space a structure out if you want a sparse net.

## Colour and Destination

- **The colour defaults to the target dimension.** It is derived by hashing the dimension id, so the same dimension is the same colour on every client; the server never has to store a colour per rift or send a packet for it.
- Right-clicking a rift with a dye sets a per-block colour override (it consumes one dye); `/mxt rift color <pos> auto` clears it back to "follows the target dimension".
- **Opacity is locked at 1 and cannot be configured**: a rift is drawn fully opaque, because a translucent fill both hid the points and links inside it and made the block read as glass.
- The destination and the colour can be written **on the block item before placement**: the component `mxt:rift` is `{target: <dimension id>, color: <int>}`, where a `color` of `-1` means "follow the dimension". Item component syntax, KubeJS and commands can all write it; see [Data Component Examples](./items.md#data-component-examples).

## Teleporting

- **Touching the block teleports immediately** (it implements the vanilla `Portal`, `getPortalTransitionTime` is 0, so there is none of a nether portal's warm-up): `mxt:rift` has no collision and can be walked through, and an entity is sent on as soon as it touches the block. There is no plane to line up with, so entering from any side is the same.
- The landing point is scaled between dimensions and clamped to the world border, and then the game **looks for an existing rift that already leads back** to where you came from (within 16 blocks horizontally and 8 vertically, loaded chunks only): if it finds one you land next to it, and only otherwise does it carve a new rift there that leads back. So a round trip returns you where you started instead of opening a new door on every crossing. The search only looks at loaded chunks; it never generates terrain just to find one.
- On arrival you get 600 ticks of slow falling and a portal sound. The landing spot is chosen in the order "the rift itself → two blocks above → the four horizontal neighbours", taking the first that has a floor; if none has one you land at the rift itself, with the slow falling as the fallback.

## Placing and Breaking

- Orientation does not matter: there is nothing to think about while placing, and two rifts link up as soon as they are next to each other.
- Breaking a rift drops an `mxt:rift` item that **keeps the rift's destination and colour** (the block has no loot table; it handles its own drop), so a wall of rifts can be taken down and moved elsewhere.
- Random ticks spawn particles around the point **tinted by that rift's own colour** (the vanilla portal particle wearing the rift's colour instead of the portal's violet), and a rift plays **no ambient sound**.

## Placing and Adjusting: Two Items

| Item | Purpose |
| --- | --- |
| Rift (`mxt:rift`, the block's own item) | **Places rift blocks and nothing else**: right-click with it to put one down. If the stack carries a `mxt:rift` component (from a data pack, KubeJS, or the item a broken rift dropped) it is placed with that destination and colour, otherwise with the defaults (the overworld, colour following the dimension). |
| Rift Anchor (`mxt:rift_anchor`) | **Adjusts rifts and nothing else**: it carries a destination and a colour and never places a block. |

What the Rift Anchor does:

| Use | Behaviour |
| --- | --- |
| Use on an existing rift | **Rewrites that block's** destination and colour. |
| Sneak-use | Records the dimension you are standing in onto the anchor, which is how a destination is chosen without any command. |
| `/mxt rift bind <dimension> [color]` | The same as the sneak-use, except it can be written to any dimension directly. |

So the usual way to build a door is: lay the shape out with rift blocks, then set where it leads with the anchor (or with `/mxt rift target`).

## `/mxt rift`

The whole `/mxt rift` subtree needs the `gamemaster` permission. It reports and rewrites the state of a single rift, and it is the place to look when a rift does not show up; normal play places with the rift block and adjusts with the Rift Anchor.

| Subcommand | Behaviour |
| --- | --- |
| `info <pos>` | Prints where this rift leads, its colour (set by hand or following the target dimension), and its **link count, triangle count and how many blocks it is connected to**, plus whether it is **isolated** (no second rift anywhere in the surrounding 3×3×3) — one look tells you how it will be drawn and why it has not linked to a neighbour. |
| `target <pos> <dimension>` | Changes which dimension it leads to (tab completion lists every server dimension). |
| `color <pos> <RRGGBB\|auto>` | Sets the colour override, written `RRGGBB` (`#` accepted) or `auto`. |
| `place <pos> <dimension>` | Places a rift leading to that dimension at a replaceable position directly. |
| `bind <dimension> [color]` | Sets the held Rift Anchor to that destination; the same as the item's sneak-use. |

## Client Display

The points, links and fills are drawn by the mod's own layered-pattern shader: one set of geometry at one thickness and one colour, drawn fully opaque, so a rift reads as a single material. Two client settings apply:

- **Client Settings → Rifts → Custom Shaders** (on by default): turning it off uses plain translucent colour instead, so nothing depends on the custom pipeline.
- **Client Settings → Rifts → Rift Thickness** (default `0.125`, range `0.0001`–`0.5`): the point's side, a link's diameter and a fill's thickness all move together.

## See Also

- The Rift Anchor is listed with the other generic functional carriers in [Items and Blocks](./items.md).
- The rest of `/mxt` is in [Commands](./commands/mxt.md).
