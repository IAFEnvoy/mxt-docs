---
title: Tools
description: Two editors for authoring datapack definitions, running in the page, writing JSON a definition file reads as is.
---

# Tools

Both pages are editors for people writing datapacks. They do not talk to the game: they draw the one part of a definition that is painful to write by hand and print the result as text you can paste into JSON.

| Tool | What it writes | Open |
| --- | --- | --- |
| Formation figure editor | the `strokes` of one `mxt:formation_shape` | [Formation figure editor](formation-figure.md) |
| Talisman stroke editor | the `pattern.strokes` of one `mxt:talisman_drawing` | [Talisman stroke editor](talisman-strokes.md) |

Both run in the page — nothing to download, nothing to build. `Copy JSON` or `Download JSON` takes the result away, and `Load from JSON` reads a file you wrote earlier back in.

An editor writes the shape only. A formation figure does not carry `duration_ticks` (that is the `mxt:particle` module's field) and a drawing's strokes do not carry `tolerance` / `guide` / `show_order` (those are the recipe's) — you still write those yourself.
