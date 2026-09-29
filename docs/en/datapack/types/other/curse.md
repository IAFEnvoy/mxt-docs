---
title: Curse Types (curse_type)
description: The four lifecycle policies of the curse_type family, their fields and duration rules.
---

# Curse Types (curse_type)

## `curse_type`

A [curse definition](../../json/curse.md) picks one ID from this family in its top-level `type`: `type` only decides how that definition lives out its life, while how long the life lasts is decided by the definition's own `duration_ticks`. The four types are registered by the mod, so a data pack picks one but cannot add one.

The definition is decoded once when the world loads: both `type` and the fields it carries (`triggers` on `mxt:triggered`) are read there, and a constant duration is checked at load time too. A formula duration is only evaluated at the moment the curse is applied, so that form can only be rejected by that one application.

`duration_ticks` and `tick_interval` are fields of the curse definition itself, documented on the [curse definition](../../json/curse.md) page; the sections below only cover how each type reads them.

| `type` | Expiry | Periodic behaviour |
| --- | --- | --- |
| `mxt:timed` | After `duration_ticks` | On `tick_interval` |
| `mxt:permanent` | Never expires, `duration_ticks` takes no part | On `tick_interval` |
| `mxt:triggered` | Expires on time with a positive `duration_ticks`, never with none or a non-positive one | Driven by the signals in `triggers`, `tick_interval` takes no part |
| `mxt:empty` | Never expires, `duration_ticks` takes no part | Runs no behaviour at all |

### `mxt:timed`

Expires after `duration_ticks`. **This is the only type whose duration must be positive**: a non-positive constant is rejected at load time, a formula is judged at the moment it is evaluated, and a duration that cannot be honoured rejects that one application instead of throwing. The periodic behaviour runs on `tick_interval`. It has no fields of its own.

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

### `mxt:permanent`

Never expires, and `duration_ticks` takes no part. The periodic behaviour runs on `tick_interval`. It has no fields of its own.

```json
{"type": "mxt:permanent"}
```

### `mxt:triggered`

With a positive `duration_ticks` it expires on time; with none, or a non-positive one, it never expires. The periodic behaviour is not driven by `tick_interval` but by **signals**: when a signal matched by any `Trigger` in `triggers` arrives, `on_tick` runs once on the holder.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `triggers` | Array | `[]` | The signals that make this curse act; written exactly like an ability trigger |

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:hurt"}],
  "on_tick": {"type": "mxt:damage", "amount": 1}
}
```

That is "act once per hit". Loading rejects an `mxt:triggered` curse with an empty `triggers` list.

### `mxt:empty`

It never expires — `duration_ticks` takes no part — and runs **no behaviour at all**: `on_apply` / `on_tick` / `on_expire` / `on_cleanse` never run. It exists only as a placeholder or a marker. It has no fields of its own.

```json
{"type": "mxt:empty"}
```
