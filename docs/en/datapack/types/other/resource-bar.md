---
title: Resource Bars and Aura Types
description: "Every ID, field, default, range and color form of the four resource bar type families: contexts, renderers, visibilities and value providers."
---

# Resource Bars and Aura Types

Resource bars are written in the inline `bars` of a [resource](../../json/resource.md), and one bar is assembled from three families: a context pulls the numbers and decides the layout, a renderer decides how it is drawn, and a visibility decides whether it is drawn. The value provider is the fourth family — it resolves one number for a value, and scripts evaluate it.

All four families are registered by the mod; a data pack picks one, it cannot add a new one. The environmental storage maximum of an aura chunk is a separate family, see [aura maximum types](./aura-maximum.md).

## `resource_bar_context`

A context extracts the current value, the minimum, the maximum and the last-changed tick from an entity or from client state, and builds a display name out of the value ID it is given.

A context is picked by an **ID string**, not by a `type` object: it goes in the `context` field of a resource bar, and that ID string is all you write there. An omitted `context` counts as `mxt:self_hud`. A context has no JSON fields, and a data pack cannot add a sixth one.

| ID | Layout | Description |
| --- | --- | --- |
| `mxt:self_hud` | Self HUD | Reads the value stored on the entity |
| `mxt:target_overlay` | Target overlay | Reads the value stored on the entity |
| `mxt:boss_overlay` | Boss overlay | Reads the value stored on the entity |
| `mxt:environment_concentration` | Self HUD | Reads the environmental aura template synchronized to the client |
| `mxt:actual_concentration` | Self HUD | Reads the final concentration synchronized to the client |

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

---

## `resource_bar_render_data_type`

The `renderer` field of a resource bar picks a draw mode, and the `type` goes inside `renderer`. The default footprint is 71x8; only a renderer that overrides the size differs.

### `mxt:boss_bar`

An Origins-style bar with an icon: background, fill and a column of 8x8 icons are cut out of one sprite sheet, and the icon shares the row index with the bar.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sprite_location` | `SpriteIcon`, textures only | `mxt:textures/gui/resource_bar.png` | Sprite sheet |
| `bar_index` | Integer, `0..24` | `0` | Which bar of the sheet to use |
| `icon_index` | Integer, `0..24` | `bar_index` | Which icon of the sheet to use |
| `inverted` | Boolean | `false` | Reverses the fill direction |

```json
{"type": "mxt:boss_bar", "bar_index": 1}
```

### `mxt:textured_bar`

Draws a background and a fill, each at the width and height the bar declares.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `background_sprite` | `SpriteIcon` | **required** | Background |
| `fill_sprite` | `SpriteIcon` | **required** | Fill |
| `width` | Integer, `1..1024` | **required** | Width |
| `height` | Integer, `1..1024` | **required** | Height |
| `fill_color` | RGB color | `#FFFFFF` | Fill tint |
| `show_value` | Boolean | `false` | Whether the current value is drawn on the bar |

```json
{
  "type": "mxt:textured_bar",
  "background_sprite": {"texture": "example:textures/gui/qi_bar.png"},
  "fill_sprite": {"texture": "example:textures/gui/qi_bar_fill.png"},
  "width": 71,
  "height": 8,
  "fill_color": "#66CCFF"
}
```

### `mxt:segmented_bar`

Discrete segments, 8 pixels each.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `segments` | Integer, `1..256` | **required** | Number of segments |
| `gap` | Integer, `0..32` | `1` | Gap between segments |
| `full_color` | RGB color | `#FFFFFF` | Color of a filled segment |
| `empty_color` | RGB color | `#555555` | Color of an empty segment |

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

### `mxt:radial_bar`

A ring.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | Integer, `1..512` | **required** | Radius |
| `thickness` | Integer, `1..128` | **required** | Thickness of the ring |
| `start_angle` | Double | `0` | Start angle in degrees |
| `end_angle` | Double | `360` | End angle in degrees |
| `fill_color` | RGB color | `#FFFFFF` | Fill tint |

```json
{"type": "mxt:radial_bar", "radius": 16, "thickness": 3, "fill_color": "#66CCFF"}
```

### `mxt:text_only`

Draws text and no bar.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | String | `%current%` | Text format |
| `color` | RGB color | `#FFFFFF` | Text color |
| `show_maximum` | Boolean | `false` | Whether the maximum is appended when the format has no `%maximum%` |

```json
{"type": "mxt:text_only", "format": "%current% / %maximum%", "color": "#66CCFF"}
```

`%current%` and `%maximum%` in the format are replaced with the current value and the maximum; `show_maximum` appends the maximum only when the format itself has no `%maximum%`.

### `mxt:missing`

Placeholder render data with no visual output.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:missing"}
```

A segmented bar is `segments * 8 + (segments - 1) * gap` pixels wide, and a radial bar occupies `radius * 2 + thickness` pixels in both directions. `mxt:boss_bar`, `mxt:text_only` and `mxt:missing` use the default 71x8, `mxt:textured_bar` uses the width and height it declares. Colors accept `#RRGGBB` or an integer from `0` to `16777215`. Drawing happens on the client, and only values synchronized from the server are shown.

`sprite_location` of `mxt:boss_bar` and both artwork fields of `mxt:textured_bar` take a [`SpriteIcon`](../shared_data_types.md#spriteicon), not a bare Identifier. A bare string keeps the field's original meaning: `sprite_location` is a **texture path**, while `background_sprite` / `fill_sprite` are **GUI atlas sprites**. The object form names either a GUI atlas sprite with `{"sprite": ...}` or one texture with `{"texture": ...}`.

`region` cuts one piece out of a texture and its fields are `u` / `v` / `texture_width` / `texture_height` (the origin defaults to `0,0` and the whole image to `256x256`); `width` / `height` give the **target** size it is drawn at, must be written as a pair, and when omitted the bar's own width and height are used.

Three load-time constraints: `mxt:boss_bar` cuts background, fill and icon cells out of its sheet, so `sprite_location` accepts **textures only**; a sprite cannot declare a `region`; and exactly one of `sprite` and `texture` must be written in an object — both or neither is an error, and so is writing only one of `width` / `height`.

Size belongs to the background side only: `background_sprite` and the sheet texture of `mxt:boss_bar` may carry `width` / `height`, while **a size written on `fill_sprite` has no effect** — the fill is cut by the bar's own progress, a fixed size means nothing there, those two keys take no part in drawing, and only the background's size is drawn.

A `SpriteIcon` is **not the same value** as the **icon reference** used by `ability.icon` / `resource.icon`: an icon reference is one 16x16 texture or one item drawn in a single cell, it has no `region` / `width` / `height` and does not accept `{"sprite": ...}`; conversely a `SpriteIcon` cannot be written as an item either.

---

## `resource_bar_visibility_type`

A visibility is a pure display policy: it decides whether the bar is drawn, and it never affects how a value is accounted. An omitted `visibility` counts as `mxt:always`.

### `mxt:always`

Always visible.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:always"}
```

### `mxt:non_full`

Visible while the current value is below the maximum.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:non_full"}
```

### `mxt:non_zero`

Visible while `maximum - minimum` is positive, hidden when the difference is zero or negative.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:non_zero"}
```

### `mxt:recently_changed`

Visible for a while after the value last changed.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `hold_ticks` | Long | `60` | Ticks to keep it visible after a change |

```json
{"type": "mxt:recently_changed", "hold_ticks": 120}
```

### `mxt:resource_range`

Visible while the current value falls inside an inclusive range.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `min` | Double | **required** | Inclusive lower bound |
| `max` | Double | **required** | Inclusive upper bound |

```json
{"type": "mxt:resource_range", "min": 1, "max": 50}
```

### `mxt:and`

Visible when every nested visibility is visible.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | Visibility array | **required** | Nested visibilities |

```json
{"type": "mxt:and", "values": [{"type": "mxt:non_full"}, {"type": "mxt:non_zero"}]}
```

### `mxt:or`

Visible when any nested visibility is visible.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | Visibility array | **required** | Nested visibilities |

```json
{"type": "mxt:or", "values": [{"type": "mxt:non_full"}, {"type": "mxt:recently_changed"}]}
```

### `mxt:not`

Inverts one nested visibility.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Visibility | **required** | The visibility to invert |

```json
{"type": "mxt:not", "value": {"type": "mxt:non_full"}}
```

`hold_ticks` must be non-negative, `min` / `max` of `resource_range` must both be finite with `max` not below `min`, and both endpoints are inclusive. `mxt:non_zero` looks at `maximum - minimum` and ignores the current value. All of these are load-time errors when they do not hold.

---

## `resource_value_provider_type`

A value provider resolves one number for a value: the current value, the defined maximum, the regeneration speed, how far it is from the maximum, and the two aura concentrations. It is not written in a resource bar — scripts evaluate it: hand the object to `MxtValues.evaluateResource(entity, resource, definition)`, and register the callback of `mxt:js` with `MxtValues.resourceValue(id, callback)`, see the [KubeJS API reference](../../../kubejs/api/values.md).

### `mxt:current`

The current value stored on the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:current"}
```

### `mxt:max`

The `max` evaluated from the definition of this value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:max"}
```

### `mxt:regen`

The `regen` of that value's aura definition, that is the natural regeneration per tick.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:regen"}
```

### `mxt:missing`

How much is missing to the maximum, never below `0`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:missing"}
```

### `mxt:environment_concentration`

The environmental template concentration at the position, excluding chunk storage and block or formation contributions.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:environment_concentration"}
```

### `mxt:actual_concentration`

The concentration finally resolved at the position, including every effective source.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:actual_concentration"}
```

### `mxt:constant`

A fixed number.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `NumberProvider` | **required** | The number to resolve |

```json
{"type": "mxt:constant", "value": "level * 10"}
```

### `mxt:js`

A number decided by a script callback.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback ID registered through `MxtValues.resourceValue(id, callback)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:js", "id": "example:qi_bonus", "params": {"scale": 2}}
```

`mxt:regen` resolves to `0` when no matching aura definition can be read. Both concentration sources read world state and therefore need an entity: with no entity they resolve to `0`. The server computes them from world state, the client reads the aura pool that was synchronized down. A missing or throwing `mxt:js` callback logs a warning and resolves to `0`.

Both concentration IDs appear in two places, do not mix them up: written in the `context` of a resource bar they are contexts, they read the pool synchronized to the client and need no entity; written as a type on this page they need an entity, and the server computes them from world state itself.
