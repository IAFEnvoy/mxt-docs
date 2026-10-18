---
title: Formation Figure Editor
description: Draw the ring and the polylines an array traces, and write a mxt:formation_shape definition a pack reads as is.
aside: false
---

# Formation Figure Editor

The figure an array draws through its `mxt:particle` module is a `mxt:formation_shape` definition of its own — the module's `shape` names it and the client lays the dust out from its own copy. Save it as `data/<namespace>/mxt/formation_shape/<name>.json`.

The editor below draws that definition's `strokes`; `Copy JSON` gives you the whole entry, wrapper included. Coordinates are in **units of the array's radius**, so `1` is exactly the ring the array draws and one figure scales with every array that reads it. The board is the array seen from straight above: `+X` to the right (east), `+Z` downwards (south), north up, and each axis end carries its compass letter and the coordinate it sits at (`1` on the ring, `-1` the same distance the other way).

<div class="mxt-tool-open"><a href="/en/tools/formation-figure-full" target="_blank" rel="noopener">Open the editor in a new window</a></div>

<ToolFrame tool="formation-figure" host="mxt-tool-formation" />

## How to draw

- **Polyline**: click the vertices, then `Enter`, a right click or a double click ends the stroke and `Esc` drops it.
- **Circle**: press where the centre goes and drag out the radius. The centre need not sit on the controller — which is a snap target of its own, so putting one there is still one click. Dragging **the centre or the start point** afterwards moves it, resizes it and turns it.
- **Drag a vertex** to move it; `⇄` in the list reverses a stroke (so it grows the other way), `✕` removes one, `Ctrl+Z` / `Ctrl+Y` undo and redo.
- **Snapping** is the three things that make a regular figure exact instead of nearly right: a `0.05` grid, the ring (`r = 1`), and the **N divisions** of the circle — `N` rays out of the controller, ray 0 due east, one every `360/N` degrees. The ring and the divisions beat the grid, so a regular vertex is not rounded twice.
- **Generators**: `Star N/K` writes the {N/K} star the way `FormationShape` builds it, one closed polyline per cycle of the step — `5/2` is the mod's own `mxt:five`, `6/2` is `mxt:six` (two triangles), `8/2` is `mxt:eight` (two squares), and `K = 1` is the plain N-gon. `N-gon` writes one closed polyline and `Rays` writes the `N` rays as `N` strokes. All three are undoable.
- **Paint** is per stroke: one hex colour, or a list of `{"at": …, "color": …}` stops running **along the stroke's own length** (ascending `at`, and the outermost colours are held outside the ends). There is no figure-wide colour to fall back to, so a stroke always carries paint — a fresh one is painted in the `new strokes` colour. The strip below the toolbar is the selected stroke's ramp: **click it to add a stop, drag a marker to move one**, and `+ stop` / `− stop` add and drop stops.
- **`start` / `end`** are the window of the draw-in the stroke belongs to — the figure's progress is mapped onto it, so `start: 0.5` keeps a stroke for the second half and two strokes written one after the other take turns. A window has to open (`start` below `end`), so the two inputs move out of each other's way instead of crossing.
- **`spacing` / `size`** are the stroke's own too: how many blocks apart its dusts sit and how big each one is drawn, `0.33` and `2` unless it says otherwise. A sparse outer ring with a dense inner detail is fine, and both fields stay out of the file while they are the defaults.

## What it computes

- **The point count is the game's own arithmetic**: one stroke asks for `ceil(its length in blocks / its own spacing) + 1` points at the `radius` you type, so the readout is what one frame of that array asks the client for. One stroke is capped at `2048` points, after which its far end is dropped — the tool reports that before a pack has to.
- **Growth is the game's rule, not a tool setting**: every stroke is cut at its own share of the progress, so strokes with the same window grow together. The slider is that progress and `Play` runs the draw-in the way the game plays it — `duration_ticks` ticks at 20 a second, from the first point of the first stroke to the last of the last.
- **`speed` and `loop` are preview-only** (the default `1×` is the game's own pace: a `duration_ticks: 24000` draw-in is worth slowing down, a `20`-tick one worth speeding up), and the clock beside them reads `elapsed / duration_ticks`. None of the three reaches the file, and `duration_ticks` is the module's field rather than the figure's.
- **The lines animate too**: `lines` strokes each stroke from its own start to wherever the walk has reached (a circle sweeps by angle, a polyline walks by arc length). With `dust` off you are watching the figure being written; what has not been reached stays on as a ghost, which keeps a half-drawn figure editable and stops progress `0` from being a blank board.

## What it writes

```json
{
  "strokes": [
    {"type": "mxt:circle", "radius": 1, "color": [{"at": 0, "color": "#80c0ff"}, {"at": 1, "color": "#ffffff"}]},
    {"type": "mxt:polyline", "points": [[1, 0], [-0.809, 0.588], [0.309, -0.951], [0.309, 0.951], [-0.809, -0.588], [1, 0]], "color": "#ffd76a"}
  ]
}
```

`type` is a registry id, so **the namespace is required**: a bare `"circle"` is `minecraft:circle` to the mod and fails the whole definition. The editor still reads a bare one and writes it back as `mxt:circle`.

Only `radius` (the array's own) and the preview knobs never reach the file — they are here so the count and the dust size are honest.

## Next

- [formation_shape](../datapack/json/formation_shape.md) — the field table, the per-stroke fields and the geometry rules.
- [the mxt:particle module](../datapack/types/other/formation-action.md) — how `shape` is referenced and where `duration_ticks` / `interval_ticks` live.
- [Define a Formation](../tutorial/define-a-formation.md) — starting from a whole array.
