---
title: Rifts
description: Free planar outlines, destinations, the editor and token-summoned portals.
---

# Rifts

A rift is a planar portal independent of blocks. Its local 2D vertices support concave polygons and arbitrary orientation without replacing stairs, slabs or the frame. Walls still occlude it; the portal does not cut holes into blocks.

The full portal record is saved in the chunk containing the center of its world-space outline bounds, with a location index at dimension level. Moving or reshaping the portal transfers the record when its center crosses a chunk boundary. Rebasing the editing origin without changing the world outline preserves the storage chunk. A portal spanning multiple chunks stays fully active while an edge chunk remains loaded. Unloading all related chunks releases runtime caches; loading them again restores the portal. Limited lifetimes keep counting while chunks are unloaded, and reloading cannot revive removed or expired portals. Existing planar portals transfer automatically, preserving their identity, expiry and destination.

## Creating and Editing

Creating, editing, deleting and exporting require **operator level 2**. Regular players may summon portals with Secret Realm Tokens and travel through enabled portals.

| Entry | Behaviour |
| --- | --- |
| `mxt:rift_anchor`, `mxt:rift` | Both are editor items. With no portal selected, use on a block face to open a draft without placing a block. |
| Sneak-use an editor item | Record the current dimension, position and view as a destination. |
| Use an editor item while aiming at a portal | Open the nearest portal along the view within 16 blocks, from either side. Blocks in front occlude it; blocks behind do not prevent selection. You can also use `/mxt rift edit <id>`. |
| `/mxt rift edit` | Start a disabled draft. Only submitting publishes it. |
| Secret Realm Token | Summon an entrance ahead of you, or a return portal while travelling in a realm. |

The outline canvas is on the left and scrollable properties on the right. Drag selected vertices; Shift adds or removes selections, dragging empty space box-selects, right or middle drag pans, and the wheel zooms. The edge tool moves both endpoints. Vertex indices start at `0` and support numeric selection and coordinates.

Coordinates use separate X / Y / Z inputs. Related parameters such as width and height, local coordinates, and scale appear side by side. Floating-point values display three decimal places; untouched values retain their original precision. Integer parameters remain integers. Checkboxes control portal activation and nearby safe landings. Dropdowns select the destination type and surface style, and the destination tab shows only the fields for the selected type. Numeric inputs support step adjustments; leave yaw and pitch empty to keep the incoming view angles.

Generators include rectangles, rounded rectangles, ellipses, regular polygons, arches and seeded fissures. Tools provide translation, rotation, scaling, shear, mirroring, chamfer, whole-outline offset and Bézier edges. Transforms with no selection affect all vertices. Snap spacing `1`, `0.5` and `0.0625` means whole blocks, half blocks and 1/16 blocks; `0` disables snapping.

World preview collapses the panel to the top. Enable world editing, then right-drag outside the panel to look and left-click to use the selected tool along the view through the screen center. Panel buttons remain usable. Esc exits world editing before a second Esc closes the editor; returning to the canvas also exits world editing. Choose a tool first: Three-point Plane takes three block hit points; Fit Block Face takes one block face; Draw adds the ray-plane intersection; Move places the selected vertices at the aimed point. Collinear points cannot define a plane.

Undo and redo retain 64 steps, and a whole drag is one step. Invalid outlines stay in the draft and cannot replace the published portal. Apply preserves expiry; changing duration or choosing Renew restarts it. Removal requires a second click within 3 seconds.

## Destinations and Travel

| Type | Behaviour |
| --- | --- |
| `position` | An explicit dimension and position, with optional yaw and pitch. `nearby=false` tries only that location; `true` searches offsets up to 4 blocks along each axis. |
| `secret_realm` | A realm definition. The first successful entrance binds the portal to that instance; a full instance refuses entry instead of opening another. |
| `return` | The origin saved when entering a realm. Entities without active realm travel cannot use it. |

The entity must contact the actual polygon from either side; concave cutouts do not trigger. Arrival applies portal cooldown and requires leaving all portal surfaces before another trigger. Riding, carrying passengers and platform-denied teleports are unsupported.

Coordinate destinations validate the entire body against collisions, fluids, hazards, world borders and support. Existing safe positions are searched first. If none is suitable, travel tries to place a single layer of dirt in empty space. Players usually receive a 3×3 platform; larger entities get a floor sized to their body with a one-block margin. Platforms cannot replace existing blocks, drain fluids, clear space, cross the world border or occupy other entities. If no platform can be safely placed, the entity stays put. Realm entrances, coordinate portals and return travel share this fallback.

When placing dirt, the foot height rounds upward to an integer and stays at least one block above the world's minimum height to leave room for the floor. This height adjustment also applies with `nearby=false`, which does not search other locations. Existing safe positions remain unchanged.

Missing chunks load asynchronously; leaving the portal, editing or removing it, or disconnecting cancels the wait. The timeout is 200 ticks. Coordinates into a private realm still obey membership, entry conditions and capacity.

Temporary chunk loading is released when the wait ends. If release fails, the temporary ticket expires after approximately 300 ticks, even while loading remains incomplete. This fallback does not extend the player's 200-tick wait limit. Both limits use server ticks.

## Secret Realm Tokens

Right-click summons a portal; contact performs travel. The token is not consumed. Its `preset` selects shape and appearance, and `duration_ticks` defaults to `0`, meaning a permanent portal. Reuse prefers the remembered valid portal in the same dimension and does not renew it. New summons have a 20-tick cooldown and a server player portal limit.

Destroying a realm invalidates portals bound to it. Reusing a dimension index cannot make them target a replacement instance. Portal lifetime and realm lifetime are independent.

Secret realm arrivals also undergo safety checks after the destination chunks are prepared. Failure messages distinguish missing support, collisions, fluids, hazards, world bounds and unloaded chunks. Operators can diagnose with `/secret_realm check <dimension>` or adjust the instance entrance with `/secret_realm anchor <dimension> <x> <y> <z>`; see [Secret Realm Commands](commands/secret_realm.md).

## Appearance and Limits

Styles are `rift` and `portal`, with primary and edge colours, speed, edge width, glow, edge particles and texture scale/rotation/offset. Primary colour `-1` derives a colour from the target identity. The surface is opaque and writes scene depth before later translucent effects. It does not show a live view of the destination.

Disabling client configuration “Rifts → Custom shader” selects a basic solid surface. Defaults are 128 vertices per portal, 32 blocks on either local axis, 1024 portals per dimension and 32 per section. The server validates limits.

## Commands

The entire `/mxt rift` subtree requires operator level 2. `id` is the portal UUID; coordinates and facing use the execution dimension. Facing is `north|south|east|west|up|down`.

Looking up or editing an unloaded portal by UUID reads its storage chunk. Listing the dimension or exporting its layout may read multiple chunks. UUID command suggestions do not load chunks.

```text
/mxt rift spawn <preset> <origin> <facing> position <dimension> <destination>
/mxt rift spawn <preset> <origin> <facing> secret_realm <definition>
/mxt rift spawn <preset> <origin> <facing> return
/mxt rift edit [id]
/mxt rift info [id]
/mxt rift target <id> position <dimension> <destination>
/mxt rift target <id> secret_realm <definition>
/mxt rift target <id> return
/mxt rift enabled <id> <true|false>
/mxt rift duration <id> <ticks>
/mxt rift copy <id> <origin>
/mxt rift transform <id> move <offset>
/mxt rift transform <id> rotate <degrees>
/mxt rift transform <id> scale <factor>
/mxt rift transform <id> mirror
/mxt rift remove <id>
/mxt rift export <id> <preset|layout>
```

## Blueprints and Export

Hold a Rift Anchor in the main hand and choose Save to Held Anchor to store the draft. Its next use on a block face reuses the outline, appearance and destination at the new location. Export presets for [rift definitions](../datapack/json/rift.md), or layouts for [secret_realm.portals](../datapack/json/secret_realm.md). Options include coordinates relative to the player, local destinations and the dimension layout (up to 128 portals).

Export validates on the server and copies JSON to the clipboard. Save File explicitly writes under the game directory’s `exports/mxt/rifts/`; existing files are never overwritten. Import accepts a single portal template, preset or one-portal layout. Exports omit members, owners, expiry timestamps and instance bindings.
