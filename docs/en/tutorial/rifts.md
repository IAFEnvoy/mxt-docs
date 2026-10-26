---
title: Rifts
description: Design planar portals with AUI and export realm layouts.
---

# Rifts

## What You Are Building

A planar portal fitted to a frame, with an exact destination in the current dimension, exported as a realm layout. Designing requires operator level 2; travel does not.

## Step 1 — Record the Destination

```mcfunction
give @s mxt:rift_anchor
```

Stand at a safe destination and sneak-use the anchor. It records dimension, position and orientation. Provide support below the feet and keep the body space clear of collisions and fluids.

## Step 2 — Open a Draft

Use the anchor on a frame’s block face. The editor takes that face as its plane and replaces no blocks. Check the recorded coordinates on the destination tab, then set enabled to true on the placement tab. `/mxt rift edit` also starts a disabled draft.

## Step 3 — Shape the Outline

Generate a rectangle or arch, then drag vertices to fit the building. Snap spacing `0.0625` is 1/16 block. Shift selection, box selection and numeric coordinates edit groups of vertices. Wheel zooms and right drag pans. The edge tool moves both endpoints.

Use world preview to check the fit. For a tilted plane, select Three-point Plane, enter preview and enable world editing. Right-drag outside the top panel to look, aim through the screen center, and left-click three noncollinear block hit points. Esc exits world editing, and panel buttons remain usable. Invalid drafts show red and cannot be published; undo restores earlier shapes.

## Step 4 — Apply and Export

Apply publishes the whole portal together. Duration `0` is permanent; normal edits preserve expiry.

The blueprint tab can save to the held anchor or export a preset, layout, relative layout or local-destination layout. Export copies JSON first; saving a file is a separate action. Presets go under `data/<namespace>/mxt/rift/<path>.json`. Merge the layout’s `portals` array into a realm definition; the fragment is not a complete realm definition.

## Verify

```mcfunction
/mxt rift info
/mxt rift spawn mxt:rectangle ~ ~ ~ south position minecraft:overworld ~8 ~ ~
```

1. `info` gives each portal UUID for `edit`, `enabled`, `duration` and `remove`.
2. Only contact with the actual surface teleports; cutouts and frames do not. Unsafe destinations leave you in place.
3. Reopen the editor after applying and verify the same outline and destination.
4. A regular player’s realm token summons a portal; contact enters it. Inside a realm the token summons a return portal.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| No travel | Disabled portal, cooldown, missed outline or unsafe landing. |
| Cannot submit shape | Self-intersection, collinearity, duplicate vertices, limits or world bounds. |
| Cannot edit | Operator level below 2, distance over 64 blocks or expired session. |
| Cannot save file | Nothing exported, invalid filename or an existing file. |
| No exit in structure NBT | Portals are separate world records; export the portals layout too. |

## Next

- [Rifts](../player-guide/rift.md): tools, travel rules and commands.
- [rift](../datapack/json/rift.md): preset and layout fields.
- [secret_realm](../datapack/json/secret_realm.md): instances and portals.
