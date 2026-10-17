---
title: formation_shape
description: The definition of a formation's figure — the two stroke kinds, the coordinates and growth rules, and the paint, density and window each stroke carries.
aside: false
---

# formation_shape

File location: `data/<namespace>/mxt/formation_shape/<path>.json`

A `formation_shape` is the figure a formation draws: a list of **strokes**, each of which is a **circle** or a **polyline** — those are the only two things the renderer can walk, so every other shape has to be built out of them. The display module [`mxt:particle`](../types/other/formation-action.md#mxt-particle) points at one of these through its `shape`, and the client samples the definition and lays out the dust itself, so a dense figure costs no more than one id on the wire.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `strokes` | Array of [stroke kinds](../types/other/formation-stroke-type.md) | **required** | What the figure is made of: **at least one stroke, at most 256**, in the order they are written. |

```json
{
  "strokes": [
    { "type": "mxt:circle", "radius": 1, "color": "#80c0ff" },
    { "type": "mxt:polyline", "points": [[1, 0], [-0.809, 0.588], [0.309, -0.951], [0.309, 0.951], [-0.809, -0.588], [1, 0]], "color": "#ffd76a" }
  ]
}
```

## Coordinates and where a stroke starts {#coordinates}

Every coordinate is a pair `[x, z]` in the plane of the formation, **in units of the array's radius**: `1` is exactly the ring the array's own `radius` draws, so one figure scales with every array that reads it and nothing has to be rewritten when the radius changes.

**Direction 0 is due east (+X)** and the angle increases towards +Z, which reads clockwise on a north-up map. Each of the two kinds starts somewhere of its own:

- A **circle** starts due east and goes all the way round; `start_angle` moves that start (degrees, positive towards +Z). Its `center` is the controller unless it says otherwise.
- A **polyline** starts at its first point and walks to its last.

## Growth and each stroke's own window {#growth}

A figure is not drawn all at once: `mxt:particle`'s `duration_ticks` says how long it takes and the client lays it out tick by tick. **Every stroke has a stretch of that progress to itself**: `start` and `end` (0–1, `0` and `1` by default) are the stretch it takes part in, and how far the figure's progress has gone into that stretch is how much of the stroke is drawn — one written with `start: 0.5` draws nothing at all during the first half.

With no window written, every stroke grows together: **each one is cut at its own length**, so at half progress the ring is drawn halfway round and the star halfway along itself, and an unclosed polyline grows from its first point towards its last. Staggering the windows is what draws them one after another — the ring at `end: 0.5` and the star at `start: 0.5`, say. `end` has to be above `start`.

**The point count follows from the length and the stroke's own `spacing`**: a stroke asks for `ceil(drawn length in blocks ÷ its own spacing) + 1` points, and it always ends exactly on the point the progress names. One stroke is capped at 2048 points, which is a client-side guard rather than a rule for the author and is only reached by a tiny `spacing` or a huge radius.

## How finely a stroke is laid out {#layout}

`spacing` and `size` are the stroke's own fields, exactly like `color`:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `spacing` | Number `0.01..64` | `0.33` | How many blocks apart two of this stroke's dusts sit. It decides the point count and nothing else. |
| `size` | Number `0.01..4` | `2` | How big one dust of this stroke is drawn. Too small looks broken up, too big smears together. |

That is what lets one figure carry a sparse outline and a dense detail: of two strokes of the same length, the one written `spacing: 1` asks for twice the points of one written `spacing: 2`. A stroke that writes neither takes the defaults above. **Neither field is on `mxt:particle`** — that module only decides which figure, how long it takes and how often the keep-alive goes out.

## A stroke's own paint {#paint}

**Every stroke carries its own colour**, in one `color` field written one of two ways:

| Field | Type | Description |
| --- | --- | --- |
| `color` | Colour, or an array of 2–16 `{"at": …, "color": …}` | One colour for the whole stroke (`#RRGGBB`, written the way colours are anywhere else), or a ramp along **that stroke's own length**. In a ramp `at` 0 is its first point and 1 its last, and the stops **must be written in ascending order**; outside the outermost stops the end colour is held, so a ramp need not reach either end. |

There is no figure-wide colour to fall back to, so a stroke that writes no `color` fails to load — and one field means a stroke is never both flat and ramped. A ramp follows the stroke's length rather than stretching with the progress: while the figure is half drawn, what is on screen is the first half of that ramp.

## The three the mod ships {#builtin}

The mod's own pack ships `mxt:five` (the ring plus a pentagram), `mxt:six` (the ring plus two triangles) and `mxt:eight` (the ring plus two squares). Nothing in the code is special about them: they load through the same path a pack's figure does, every stroke of all three is written `#ffffff`, and their density and dust size are the defaults (`0.33` and `2`).
