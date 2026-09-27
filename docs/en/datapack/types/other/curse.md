---
title: Curse Types
description: The four lifecycle policies of the curse_type family, their fields and duration rules.
---

# Curse Types

## `curse_type`

The `type` of a curse definition selects its lifecycle policy: `type` only decides how that definition lives out its life, while how long the life lasts is decided by the curse definition's own `duration_ticks`. These types are registered by the mod, so a data pack picks one but cannot add one.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `duration_ticks` | `NumberProvider` | `0` | How long the curse lasts, in ticks |

### `mxt:timed`

Expires after the configured duration; the duration must be positive.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

### `mxt:permanent`

Never expires, and `duration_ticks` takes no part.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:permanent"}
```

### `mxt:triggered`

Application and removal are driven by the owning event bridge; a non-positive duration means no expiry.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `triggers` | Array | `[]` | The signals that make this curse act, written exactly like an ability trigger; when any matching signal arrives `on_tick` runs once, and loading rejects an empty list |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:hurt"}]}
```

### `mxt:empty`

No lifecycle at all.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:empty"}
```

---

**`mxt:timed` is the only type whose duration must be positive**: a constant is checked at load time, a formula is judged at the moment it is evaluated, and a duration that cannot be honoured rejects that one application instead of throwing. A non-positive duration on `mxt:triggered` means no expiry, and `mxt:permanent` and `mxt:empty` never look at `duration_ticks` at all.
