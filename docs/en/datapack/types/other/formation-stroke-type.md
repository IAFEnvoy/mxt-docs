---
title: Formation Stroke Types (formation_stroke_type)
description: The fields of the two strokes a formation figure is made of — mxt:circle and mxt:polyline — and the paint and window they share.
---

# Formation Stroke Types (formation_stroke_type)

## `formation_stroke_type`

Each entry of a [formation figure's](../../json/formation_shape.md) `strokes` picks one ID from this family through its `type`: the `type` decides how that stroke is drawn, and the geometry is its own fields. There are **only two** — the renderer walks a circle by angle and a polyline by arc length, and has no third walk — so a data pack cannot add one.

| `type` | How it is drawn | Its own fields |
| --- | --- | --- |
| `mxt:circle` | One turn from `start_angle` | `radius`, `center`, `start_angle` |
| `mxt:polyline` | From its first point to its last | `points` |

Both kinds also carry the same five fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | Colour, or an array of 2–16 `{"at": …, "color": …}` | **required** | One colour for the whole stroke, or a ramp along the stroke's own length; see [the figure page](../../json/formation_shape.md#paint). |
| `spacing` | Number `0.01..64` | `0.33` | How many blocks apart its dusts sit; see [the figure page](../../json/formation_shape.md#layout). |
| `size` | Number `0.01..4` | `2` | How big one of its dusts is drawn. |
| `start` | Number `0..1` | `0` | Where in the figure's progress this stroke begins to be drawn. |
| `end` | Number `0..1` | `1` | Where it stops. **Has to be above `start`**. |

`color` is required, and one field is written one way: a flat colour and a ramp never appear together. `start` and `end` are the window described under [growth](../../json/formation_shape.md#growth). Coordinates and units are on [the same page](../../json/formation_shape.md#coordinates).

## `mxt:circle`

Starts at `start_angle` and goes one full turn in the direction the angle increases. Its length is `2π × radius`, and the growth is cut at that length.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | Number | **required** | The radius in units of the array's radius, **greater than 0**. `1` is the array's own ring. |
| `center` | `[x, z]` | `[0, 0]` | The centre, in the same units. Left out it is the controller, so a stroke need not be centred on it. |
| `start_angle` | Number `-360..360` | `0` | Where it starts, in **degrees** past due east (+X), positive towards +Z (south). `90` starts at the south. |

```json
{"type": "mxt:circle", "radius": 1, "color": "#80c0ff"}
{"type": "mxt:circle", "radius": 0.5, "center": [0.3, -0.2], "start_angle": 90, "color": "#80c0ff"}
```

## `mxt:polyline`

Walks from its first point to its last, its length being the sum of the segments. **Two points at least**, up to 4096; a last point equal to the first closes the figure.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `points` | Array of `[x, z]` | **required** | 2–4096 points, in units of the array's radius. |

```json
{"type": "mxt:polyline", "points": [[1, 0], [0.309, 0.951], [-0.809, 0.588], [-0.809, -0.588], [0.309, -0.951], [1, 0]], "color": "#80c0ff"}
```

**The order of the points is the direction it grows**: a stroke grows from the first entry of `points`, so writing the array backwards makes it grow the other way.
