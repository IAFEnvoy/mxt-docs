---
title: Mount Renderers (mount_render_type)
description: Every built-in mxt:mount_render_type entry, its fields, the GeckoLib resource paths and the seven poses.
---

# Mount Renderers (mount_render_type)

## `mount_render_type`

The `render` of [`mxt:mount`](../../json/ability.md) picks a renderer from this family to draw the vehicle. A data pack can only pick an existing type and cannot add new ones. Rendering happens on the client only: a dedicated server decodes `render` as ordinary data, neither drawing it nor checking whether this machine has a matching renderer.

```json
"render": {
  "type": "mxt:geckolib",
  "model": "example:vehicle/azure_sword",
  "texture": "example:textures/entity/vehicle/azure_sword.png"
}
```

Two types are built in, and a content mod can register its own; see Custom Renderers below.

### `mxt:item`

Draws the item model of the carried item, using the item frame context (original size, an unmoved flat card). **This is the default**: leaving `render` out entirely selects it.

It has no fields of its own. This type automatically sits the model's bottom face on the bottom face of the hitbox, so any item model lands on the same plane; [`display`](../../json/ability.md#mount-render) defaults to `[0,0,0]` / `[90,0,-45]` / `[2,2,2]` here.

### `mxt:geckolib`

Draws with a GeckoLib model and animations. **The client must have GeckoLib installed**; without it the client logs one warning and falls back to `mxt:item` (the data pack still loads and the vehicle still flies).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `model` | model resource id | **required** | The model file. |
| `texture` | texture id | **required** | The texture. |
| `animations` | animation resource id | none | The animation file; leaving it out means a static model, and the file is not even looked up. |
| `states` | object | none | Poses mapped to animation names, see the table below. |
| `transition_ticks` | int | `5` | Blend ticks shared by both animation controllers. |
| `scale` | double | `1` | Multiplied onto the model's own scale. |

**The three resource ids are written the way a GeckoLib cache key looks** (its own loader strips the prefix and suffix to build the key): `assets/<namespace>/geckolib/models/<path>.geo.json` is written as `"<namespace>:<path>"`, an animation file lives at `assets/<namespace>/geckolib/animations/<path>.animation.json` the same way, and the texture is a plain texture id.

| `states` key (pose) | What the client looks at | Meaning |
| --- | --- | --- |
| `idle` | position unchanged this tick | Hovering. **Facing does not count** — the driver turning their head is not flying |
| `moving` | horizontal movement above the threshold | Level flight |
| `ascending` | upward movement above the threshold | Climbing; **vertical wins over horizontal**, so a climb is no longer `moving` |
| `descending` | downward movement above the threshold | Diving |
| `empty` | passenger count `0` | Empty (only possible in the instant the sword takes off: an unmanned vehicle clears itself) |
| `ridden` | passenger count `1` | The driver alone |
| `carrying` | passenger count `≥ 2` | Someone in the back (multi-seat vehicles) |

The two sets (`idle` / `moving` / `ascending` / `descending` are the **motion** set, `empty` / `ridden` / `carrying` the **crew** set) are each a **total function**: every moment hits exactly one value per set, and each set is played by its own animation controller, so "carrying someone while climbing" plays two animations at once, each driving its own bones. `states` maps a pose to an **animation name inside the animation file**; **an entry left out falls back to the pose's own name** (writing only `{"moving": "fly"}` still looks for an animation named `idle` when idling). **A name that does not exist in the file is not played** (the model holds its rest pose) and logs one warning per animation file plus name, not one per frame.

This type does **not** sit the model down automatically: the model's origin is the vehicle origin as authored in the modelling tool, so move it with `display.translation`. `display` defaults to `[0,0,0]` / `[0,0,0]` / `[1,1,1]` here.

```json
{
  "type": "mxt:mount",
  "speed": 0.12,
  "render": {
    "type": "mxt:geckolib",
    "model": "example:vehicle/azure_sword",
    "texture": "example:textures/entity/vehicle/azure_sword.png",
    "animations": "example:vehicle/azure_sword",
    "states": { "idle": "hover", "moving": "fly", "ascending": "climb", "descending": "dive" },
    "transition_ticks": 5
  }
}
```

### Custom Renderers

A renderer is a client-side Java object, so neither data packs nor scripts can reach it. Once a content mod has registered one, a data pack can write `{"type": "<that mod's id>", ...its own fields}`. Three boundaries:

- **An unregistered `type`** written in `render` fails at load time with an unknown registry key — a loud failure, not a silent fallback.
- **A registered type whose renderer this client does not have** (the renderer comes from a mod that is not installed, for instance) falls back to the item model and logs one warning.
- **The server never resolves renderers**: on a dedicated server a custom type is just decoded data.

How to register one is on the [mount renderer](../../../java/interfaces/mount/renderer.md) page.
