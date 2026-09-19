---
title: Resource Bar and Aura Types
---

# Resource Bar and Aura Types

## `resource_bar_context`

A context extracts the value, minimum, maximum and last-changed tick for a bar, and decides its layout and display name. Unlike the other families, a context is selected by **ID string**, not by a `type` object, and it is written into the `context` field of an inline resource bar. Contexts have no JSON fields and can only be extended from Java or KubeJS.

| ID | Description |
|----|-------------|
| `mxt:self_hud` | Self HUD layout; reads the resource stored on the entity |
| `mxt:target_overlay` | Target overlay layout; reads the resource stored on the entity |
| `mxt:boss_overlay` | Boss overlay layout; reads the resource stored on the entity |
| `mxt:environment_concentration` | Self HUD layout; reads the environmental aura template only, on the client |
| `mxt:actual_concentration` | Self HUD layout; reads the fully resolved concentration, on the client |

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

The concentration contexts report no values until the client has received aura data, and they are named after the resource, so `resource.example.qi=Spirit Qi` is displayed as environmental or actual aura concentration for that resource.

---

## `resource_bar_render_data_type`

The `renderer` field of a resource bar selects one of these draw modes. Unless a mode overrides the size, the default footprint is 71x8.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:boss_bar` | `sprite_location`, `bar_index`, `icon_index`, `inverted` | Origins-style 71x8 bar with an icon |
| `mxt:textured_bar` | `background_sprite`, `fill_sprite`, `width`, `height`, `fill_color`, `show_value` | Two independent textures |
| `mxt:segmented_bar` | `segments`, `gap`, `full_color`, `empty_color` | Discrete segments |
| `mxt:radial_bar` | `radius`, `thickness`, `start_angle`, `end_angle`, `fill_color` | Radial bar |
| `mxt:text_only` | `format`, `color`, `show_maximum` | Text only |
| `mxt:missing` | none | Placeholder render data with no visuals |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:boss_bar` | `sprite_location` | Identifier | `mxt:textures/gui/resource_bar.png` | Sprite sheet |
| `mxt:boss_bar` | `bar_index` | Integer | `0` | Bar index in the sheet, `0..24` |
| `mxt:boss_bar` | `icon_index` | Integer | `bar_index` | Icon index in the sheet, `0..24` |
| `mxt:boss_bar` | `inverted` | Boolean | `false` | Reverses the fill direction |
| `mxt:textured_bar` | `background_sprite` | Identifier | **required** | Background texture |
| `mxt:textured_bar` | `fill_sprite` | Identifier | **required** | Fill texture |
| `mxt:textured_bar` | `width` | Integer | **required** | Width, `1..1024` |
| `mxt:textured_bar` | `height` | Integer | **required** | Height, `1..1024` |
| `mxt:textured_bar` | `fill_color` | RGB color | `#FFFFFF` | Fill tint |
| `mxt:textured_bar` | `show_value` | Boolean | `false` | Whether the numeric value is drawn |
| `mxt:segmented_bar` | `segments` | Integer | **required** | Number of segments, `1..256` |
| `mxt:segmented_bar` | `gap` | Integer | `1` | Gap between segments, `0..32` |
| `mxt:segmented_bar` | `full_color` | RGB color | `#FFFFFF` | Color of a filled segment |
| `mxt:segmented_bar` | `empty_color` | RGB color | `#555555` | Color of an empty segment |
| `mxt:radial_bar` | `radius` | Integer | **required** | Radius, `1..512` |
| `mxt:radial_bar` | `thickness` | Integer | **required** | Thickness, `1..128` |
| `mxt:radial_bar` | `start_angle` | Double | `0` | Start angle in degrees |
| `mxt:radial_bar` | `end_angle` | Double | `360` | End angle in degrees |
| `mxt:radial_bar` | `fill_color` | RGB color | `#FFFFFF` | Fill tint |
| `mxt:text_only` | `format` | String | `%current%` | Text format |
| `mxt:text_only` | `color` | RGB color | `#FFFFFF` | Text color |
| `mxt:text_only` | `show_maximum` | Boolean | `false` | Whether the maximum is shown next to the value |

A segmented bar is `segments * 8 + (segments - 1) * gap` pixels wide, and a radial bar occupies `radius * 2 + thickness` pixels in both directions. Colors accept `#RRGGBB` or an integer from `0` to `16777215`. Rendering runs on the client and only ever displays server-synchronized resource values.

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

---

## `resource_bar_visibility_type`

Visibility is a pure display policy: it decides whether a bar is drawn and never affects resource accounting.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:always` | none | Always visible |
| `mxt:non_full` | none | Visible while the current value is below the maximum |
| `mxt:non_zero` | none | Visible while `maximum - minimum` is positive, and hidden when the difference is zero or negative |
| `mxt:recently_changed` | `hold_ticks` | Visible for a while after the value last changed |
| `mxt:resource_range` | `min`, `max` | Visible while the current value is inside a range |
| `mxt:and` | `values` | Visible when every nested visibility is visible |
| `mxt:or` | `values` | Visible when any nested visibility is visible |
| `mxt:not` | `value` | Inverts a nested visibility |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:recently_changed` | `hold_ticks` | Long | `60` | Ticks to keep the bar visible after a change; must be non-negative |
| `mxt:resource_range` | `min` | Double | **required** | Inclusive lower bound; must be finite |
| `mxt:resource_range` | `max` | Double | **required** | Inclusive upper bound; must be finite and not below `min` |
| `mxt:and` | `values` | List of `ResourceBarVisibility` | **required** | The nested visibilities |
| `mxt:or` | `values` | List of `ResourceBarVisibility` | **required** | The nested visibilities |
| `mxt:not` | `value` | `ResourceBarVisibility` | **required** | The nested visibility to invert |

```json
{
  "type": "mxt:and",
  "values": [
    {"type": "mxt:non_full"},
    {"type": "mxt:resource_range", "min": 1, "max": 50}
  ]
}
```

---

## `resource_value_provider_type`

A resource value provider resolves one number for a resource, usually for a resource bar or for script evaluation.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:current` | none | The value stored on the entity |
| `mxt:max` | none | The `max` of the resource definition |
| `mxt:regen` | none | The `regen` of the value's [cultivation profile](../../json/aura.md) |
| `mxt:missing` | none | The amount missing to the maximum, never below `0` |
| `mxt:environment_concentration` | none | The environmental template concentration at the position, excluding chunk storage and block or formation contributions |
| `mxt:actual_concentration` | none | The final resolved concentration at the position, including every active source |
| `mxt:constant` | `value` | A fixed `NumberProvider` |
| `mxt:js` | `id`, `params` | A KubeJS resource value callback |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:constant` | `value` | `NumberProvider` | **required** | The value to resolve |
| `mxt:js` | `id` | String | **required** | Callback ID registered with `MxtValues.resourceValue(...)` |
| `mxt:js` | `params` | Object | `{}` | Arbitrary JSON passed to the callback |

The two concentration providers read world state and therefore need the owning entity; called without one they resolve to `0`. A missing `mxt:js` callback logs a warning and resolves to `0`.

```json
{"type": "mxt:constant", "value": "level * 10"}
```

---

## `aura_maximum_type`

This registry resolves the environmental storage limit of one aura chunk. Block contributions and formation bonuses are applied separately at runtime.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:fixed` | `value` | A fixed maximum |
| `mxt:initial_multiplier` | `multiplier` | The initial aura of the chunk multiplied by a factor |
| `mxt:unlimited` | none | No upper limit |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:fixed` | `value` | Double | **required** | Fixed maximum, `0` or greater |
| `mxt:initial_multiplier` | `multiplier` | Double | `1` | Factor applied to the non-negative initial aura |

A bare non-negative number is shorthand for `{"type": "mxt:fixed", "value": ...}`. Omitting the field entirely on the owning definition means the maximum equals the initial environmental aura of the chunk.

```json
{"type": "mxt:initial_multiplier", "multiplier": 2}
```

---
