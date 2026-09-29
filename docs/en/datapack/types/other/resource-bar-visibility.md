---
title: Resource Bar Visibility (resource_bar_visibility_type)
description: The eight conditions of the resource_bar_visibility_type family, their fields, defaults and load-time constraints.
---

# Resource Bar Visibility (resource_bar_visibility_type)

A visibility is a pure display policy: it decides whether the bar is drawn, and it never affects how a value is accounted. It is written in the `visibility` of an inline `bars` entry of a [resource](../../json/resource.md), and an omitted `visibility` counts as `mxt:always`.

This family is registered by the mod; a data pack picks one, it cannot add a new one.

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

---

`hold_ticks` must be non-negative, `min` / `max` of `resource_range` must both be finite with `max` not below `min`, and both endpoints are inclusive. `mxt:non_zero` looks at `maximum - minimum` and ignores the current value. All of these are load-time errors when they do not hold.
