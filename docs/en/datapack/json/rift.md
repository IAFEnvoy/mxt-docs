---
title: Rift Presets (rift)
description: Shared portal outlines, appearance and realm portal layout format.
aside: false
---

# Rift Presets (rift) {#rift}

File location: `data/<namespace>/mxt/rift/<path>.json`

Presets provide shape and appearance for commands and Secret Realm Tokens. The creation entry supplies position and destination. Built-in presets are `mxt:default` and `mxt:rectangle`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `shape` | Object | required | `vertices` contains local `[u, v]` pairs. |
| `appearance` | Object | default appearance | See below. |

## Shape

`vertices` follows a closed outline; do not repeat the first point at the end. Use 3–128 points, at most 32 blocks of span on either local axis, with each coordinate’s absolute value at most 1024. Self-intersection, overlapping edges, duplicate points, zero-length edges and degenerate area are rejected. Intermediate points on a straight edge may be retained for editing, but edges cannot double back and overlap. Concave outlines and reversed winding are supported; holes are not. The server may lower the vertex cap.

```json
{
  "shape": {"vertices": [[-1, 0], [1, 0], [1, 2.5], [-1, 2.5]]},
  "appearance": {"style": "portal", "color": -1, "edge_width": 0.06}
}
```

## Appearance

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `style` | String | `rift` | `rift` or `portal`. |
| `color` | Integer | `-1` | Primary colour; `-1` derives it from the destination identity. |
| `edge_color` | Integer | `-1` | Edge colour; `-1` brightens the primary colour. |
| `speed` | Double `0..10` | `1` | Surface texture speed. |
| `edge_width` | Double `0..0.5` | `0.06` | Edge width in local coordinates. |
| `glow` | Double `0..1` | `0.2` | Soft interior edge glow strength. |
| `particles` | Double `0..1` | `0.1` | Client edge particle density within a per-tick budget. |
| `texture_scale` | Double `0.01..100` | `1` | Texture scale. |
| `texture_rotation` | Double `-360..360` | `0` | Texture rotation in degrees. |
| `texture_u` | Double `-1024..1024` | `0` | Horizontal texture offset. |
| `texture_v` | Double `-1024..1024` | `0` | Vertical texture offset. |

The surface is opaque. Glow is not scene bloom, and particles do not affect travel. Disabling the custom shader selects a solid-colour surface.

## Portal Templates and Realm Layouts

The [secret_realm](./secret_realm.md) `portals` array contains templates directly rather than preset ids. The editor exports designed portals in this format.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `key` | String `1..64` | required | Unique within the layout. |
| `placement` | Object | required | Three 3D vectors: `origin`, `normal`, `tangent`. |
| `relative_to_entry` | Boolean | `false` | Whether origin is relative to the instance entrance. |
| `shape` | Object | required | Same as presets. |
| `destination` | Object | required | See below. |
| `appearance` | Object | default appearance | Same as presets. |
| `duration_ticks` | Nonnegative Long | `0` | Portal lifetime; `0` is permanent. |
| `enabled` | Boolean | `true` | Whether travel is enabled. |

`normal` and `tangent` must be nonzero and nonparallel; they are orthonormalized on loading. World positions are `origin + tangent*u + (normal × tangent)*v`. Template vertices must fit the dimension’s height and border.

Destination `type` selects:

| type | Fields | Rule |
| --- | --- | --- |
| `position` | Required `pos`; optional `dimension`, `yaw`, `pitch`; `nearby` defaults to false | Missing dimension means the containing instance. Pitch is -90..90; nearby permits a safe search up to 4 blocks. |
| `secret_realm` | Required `realm` | Realm definition id; first successful entry binds an instance. |
| `return` | none | The entity’s saved realm entry origin. |

Travel searches existing safe positions first. If none is found, it tries a single dirt layer in empty space, usually 3×3 for a player and larger for bigger entities with a one-block margin. The platform cannot replace blocks, remove fluids or obstructions, cross the world border or occupy other entities. When building, foot height rounds upward to an integer and stays at least one block above the world's minimum height. `nearby=false` tries only the original location with that height adjustment; `true` permits further attempts at offsets up to 4 blocks along each axis. Travel is refused if a safe landing is still unavailable.

```json
{
  "portals": [{
    "key": "exit",
    "placement": {"origin": [3, 0, 0], "normal": [0, 0, 1], "tangent": [1, 0, 0]},
    "relative_to_entry": true,
    "shape": {"vertices": [[-1, 0], [1, 0], [1, 2.5], [-1, 2.5]]},
    "destination": {"type": "return"},
    "duration_ticks": 0
  }]
}
```

A layout holds up to 128 portals. All entries are validated before publishing, after structures and the entrance are prepared. Installation only happens on the first preparation; reopening a prepared instance does not restore removed or expired portals.
