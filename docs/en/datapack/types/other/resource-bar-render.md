---
title: Resource Bar Renderers (resource_bar_render_data_type)
description: The six renderers of the resource_bar_render_data_type family, their fields, defaults, ranges and artwork forms.
---

# Resource Bar Renderers (resource_bar_render_data_type)

The `renderer` field of a resource bar picks a draw mode, and the `type` goes inside `renderer`. Bars are written in the inline `bars` of a [resource](../../json/resource.md).

This family is registered by the mod; a data pack picks one, it cannot add a new one. The default footprint is 71x8; only a renderer that overrides the size differs.

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

---

A segmented bar is `segments * 8 + (segments - 1) * gap` pixels wide, and a radial bar occupies `radius * 2 + thickness` pixels in both directions. `mxt:boss_bar`, `mxt:text_only` and `mxt:missing` use the default 71x8, `mxt:textured_bar` uses the width and height it declares. Colors are written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too) and are always treated as opaque. Drawing happens on the client, and only values synchronized from the server are shown.

`sprite_location` of `mxt:boss_bar` and both artwork fields of `mxt:textured_bar` take a [`SpriteIcon`](../shared_data_types.md#spriteicon), not a bare Identifier. A bare string keeps the field's original meaning: `sprite_location` is a **texture path**, while `background_sprite` / `fill_sprite` are **GUI atlas sprites**. The object form names either a GUI atlas sprite with `{"sprite": ...}` or one texture with `{"texture": ...}`.

`region` cuts one piece out of a texture and its fields are `u` / `v` / `texture_width` / `texture_height` (the origin defaults to `0,0` and the whole image to `256x256`); `width` / `height` give the **target** size it is drawn at, must be written as a pair, and when omitted the bar's own width and height are used.

Three load-time constraints: `mxt:boss_bar` cuts background, fill and icon cells out of its sheet, so `sprite_location` accepts **textures only**; a sprite cannot declare a `region`; and exactly one of `sprite` and `texture` must be written in an object — both or neither is an error, and so is writing only one of `width` / `height`.

Size belongs to the background side only: `background_sprite` and the sheet texture of `mxt:boss_bar` may carry `width` / `height`, while **a size written on `fill_sprite` has no effect** — the fill is cut by the bar's own progress, a fixed size means nothing there, those two keys take no part in drawing, and only the background's size is drawn.

A `SpriteIcon` is **not the same value** as the **icon reference** used by `ability.icon` / `resource.icon`: an icon reference is one 16x16 texture or one item drawn in a single cell, it has no `region` / `width` / `height` and does not accept `{"sprite": ...}`; conversely a `SpriteIcon` cannot be written as an item either.
