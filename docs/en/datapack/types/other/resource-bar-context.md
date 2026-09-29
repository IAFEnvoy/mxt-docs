---
title: Resource Bar Contexts (resource_bar_context)
description: The five contexts of the resource_bar_context family, where each one reads from, and how the display name is built.
---

# Resource Bar Contexts (resource_bar_context)

A context extracts the current value, the minimum, the maximum and the last-changed tick from an entity or from client state, and builds a display name out of the value ID it is given. It is written in the `context` of an inline `bars` entry of a [resource](../../json/resource.md).

This family is registered by the mod; a data pack picks one, it cannot add a new one. The environmental storage maximum of an aura chunk is a separate family, see [aura maximum types](./aura-maximum.md).

A context is picked by an **ID string**, not by a `type` object: it goes in the `context` field of a resource bar, and that ID string is all you write there. An omitted `context` counts as `mxt:self_hud`. A context has no JSON fields, and a data pack cannot add a sixth one.

| ID | Layout | Description |
| --- | --- | --- |
| `mxt:self_hud` | Self HUD | Reads the value stored on the entity |
| `mxt:target_overlay` | Target overlay | Reads the value stored on the entity |
| `mxt:boss_overlay` | Boss overlay | Reads the value stored on the entity |
| `mxt:environment_concentration` | Self HUD | Reads the environmental aura template synchronized to the client, excluding chunk stock and block or formation contributions |
| `mxt:actual_concentration` | Self HUD | Reads the final concentration synchronized to the client, with environment, stock, blocks and formations all counted |

```json
{
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1}
    }
  ]
}
```

The three contexts that read a stored value report nothing while that value has not been initialized, and the bar is not drawn. The two concentration contexts need a matching [aura definition](../../json/aura.md) for the value: with no definition, or when both the maximum and the current value of that pool are not positive, they report nothing either.

Both concentration contexts always report a minimum of `0` and have no change time, so `mxt:recently_changed` never holds for them. Display names are built from the value name: `mxt:self_hud` uses it as is, `mxt:target_overlay` and `mxt:boss_overlay` prefix it with target or boss, and the two concentration contexts add an environmental or actual prefix plus a concentration suffix, so a value named "Aura" shows as "Environmental Aura Concentration" and "Actual Aura Concentration".

`mxt:target_overlay` and `mxt:boss_overlay` are drawn in two passes split by `anchor`, so a target bar written with `anchor: right` is drawn on the right.
