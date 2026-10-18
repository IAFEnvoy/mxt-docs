---
title: Talisman Stroke Editor
description: Draw a mxt:talisman_drawing's pattern.strokes on the paper's own canvas, and see the shapes the loader would refuse.
aside: false
---

# Talisman Stroke Editor

A recipe's `pattern.strokes` is a list of strokes, each one a list of points normalised to `[0,1]²` against the fixed `90 × 210` canvas. That is what this editor draws: the board uses that ratio, paper `#FFFE85` and ink `#FF0000` — the two colours the recipe type defaults to — so it looks like the workstation's paper.

<div class="mxt-tool-open"><a href="/en/tools/talisman-strokes-full" target="_blank" rel="noopener">Open the editor in a new window</a></div>

<ToolFrame tool="talisman-strokes" host="mxt-tool-talisman" />

## How to draw

- **Polyline**: click the vertices, then `Enter`, a right click or a double click ends the stroke and `Esc` drops it.
- **Freehand**: drag. On release the stroke is simplified with Ramer-Douglas-Peucker at the toolbar's ε — the scorer throws those points away anyway, and keeping them only makes the recipe harder to read.
- `Ctrl+Z` / `Ctrl+Y` undo and redo, the list removes one stroke, `Clear` empties the board.
- `Snap to whole pixels` lands on whole canvas pixels, `Grid` draws the grid, and `Stroke order` shows each stroke's start and number — which is what `pattern.show_order: true` asks the game to draw.
- `Load from JSON` takes either a bare strokes array or a whole `pattern` block.
- `Zoom` is display only (the canvas stays `90 × 210`) and `Decimals` is how many decimals the written coordinates keep.

## What it reports

- **Stroke order and ink**: the pixel length of each stroke in the list is about what the brush is charged, since paint is spent per pixel of drawn length.
- **Load-time problems**: a stroke with fewer than two points, more than `256` strokes, more than `4096` points in one stroke, and a point cloud with no spread at all are the shapes the loader rejects. The tool reports them before you have to find out in game.

Scoring normalises translation and scale away but **not rotation** — where a stroke sits and how big it is do not matter, while a turned one does. It resamples every `2` pixels and simplifies at `0.5 × tolerance` (`6.3` pixels at the default `0.06`), so anything finer than that does not survive.

## What it writes

```json
[
  [[0.5, 0.05], [0.5, 0.95]],
  [[0.1, 0.5], [0.9, 0.5]]
]
```

That list is the value of `pattern.strokes`. The editor writes the shape only: `pattern.tolerance`, `pattern.guide` and `pattern.show_order` are the recipe's own fields, and so are `talisman`, `result` and the grades.

## Next

- [talisman_drawing](../datapack/json/talisman_drawing.md) — every field of the recipe, `pattern` and the grades included.
- [Author a Talisman Drawing](../tutorial/author-a-talisman-drawing.md) — the whole flow starting from one drawing.
- [Talisman Scoring](../technical/talisman-scoring.md) — how the score resamples, normalises and weights.
