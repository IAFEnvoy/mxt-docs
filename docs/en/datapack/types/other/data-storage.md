---
title: Data Storage Types
description: Every entry of mxt:data_storage_type — the declaration and state fields of the six kinds content can write, of the container and of the default kind, plus the family + id addressing.
---

# Data Storage Types

State an ability leaves behind at runtime is stored by **kind**, and the top-level `type` of each value comes from the `mxt:data_storage_type` registry. The kind decides what that value stores, and its fields come in two halves: **declaration fields** are the parameters fixed when the kind is declared on a host, and **state fields** are the current values filled in by whoever writes the value.

Content writes with the [`mxt:modify_storage`](../action/entity_action_types) entity action and reads with the six `mxt:storage_toggle` / `mxt:storage_timer` / `mxt:storage_resource` / `mxt:storage_target` / `mxt:storage_charges` / `mxt:storage_cooldown` entity conditions. For the fields, the checks and the moments each condition is read, see [Ability Casting](/en/technical/ability). Only a kind the host has **declared** can be written and read; for which ability type declares which kinds, see [Ability Types](./ability).

## `data_storage_type`

Of the nine entries below, the first six are the ones content can write; `mxt:container`, `mxt:active_state` and `mxt:empty` are not among them.

### `mxt:toggle`

A switch.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:toggle` | none | `default`, `state` |

```json
{"type": "mxt:toggle", "default": false, "state": true}
```

`state` is the current switch; when it was never written it reads as `default`, and `default` defaults to `false`.

### `mxt:timer`

A timer that is running.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:timer` | `duration` | `ends_at` |

```json
{"type": "mxt:timer", "duration": 100, "ends_at": 2400}
```

`duration` is how long this run lasts, and `ends_at` is the tick it ends on. A reader looks at `ends_at` alone; without it the timer is not running.

### `mxt:resource`

A number stored for one value.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:resource` | none | `resource`, `amount` |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": 5}
```

`resource` names which value it points at, and `amount` is the quantity kept for it; both are given by whoever writes the value, and both may be omitted.

### `mxt:target_lock`

One locked target.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:target_lock` | `range` | `target` |

```json
{"type": "mxt:target_lock", "range": 16, "target": "5c1f0b3a-9c1e-4f5a-8b2d-7e6a1c2d3e4f"}
```

`range` is part of this kind's declaration; `target` is the UUID of the locked entity, written as a string.

### `mxt:charges`

A pool of available uses.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:charges` | `maximum`, `recharge_ticks` | `remaining`, `last_change` |

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": "100 - level * 5"}
```

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1}
```

The `charges` written on an ability definition is exactly this kind's two declaration fields: how many uses at most, and how many ticks between refills. `remaining` is how many are left, and one that was never written reads as full; `last_change` is the tick of the last change, and also the anchor the automatic refill counts from.

### `mxt:cooldown`

A cooldown.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:cooldown` | none | `duration`, `started_at` |

```json
{"type": "mxt:cooldown", "duration": 40, "started_at": 1200}
```

The length is not written on this kind: whatever the ability's own `cooldown` field says, that is what is stored here; `started_at` is the tick this cooldown began on. A stored value without a `duration` reads as a zero-length cooldown, that is, as not cooling down. Content should write it with care: a `duration` written in really does gate the cast, and the start is counted from the moment of that write.

### `mxt:container`

The contents of a carrier's own storage slots.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:container` | none | `contents` |

```json
{"type": "mxt:container", "contents": [{"id": "minecraft:iron_ingot", "count": 2}]}
```

The slot count is not written here; it comes from the `slots` of the `mxt:storage` ability type itself. `contents` is padded to the slot count, and an empty stack spells an empty slot. It lives in the `mxt:storage` component on the item side, content cannot write it, and none of the six conditions reads it.

### `mxt:active_state`

The one that is already there by default.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:active_state` | none | `active` |

```json
{"type": "mxt:active_state", "active": true}
```

Every host carries it. It records the result of the last `condition` evaluation, and the runtime uses it to decide when an ability counts as active; `active` defaults to `false`. It is not a switch for content to read — to read a switch, use `mxt:toggle`.

### `mxt:empty`

The empty kind.

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:empty` | none | none |

```json
{"type": "mxt:empty"}
```

It says this host keeps no state of its own: it has neither declaration fields nor state fields.

## Address

A data pack addresses a value with two fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry ID | **required** | The data pack registry the host lives in |
| `id` | Identifier | **required** | The host itself |

Today `family` is only ever `mxt:ability`, and `id` is the ability's own id. **One address holds one record**, and a write replaces it whole: writing the same host and the same kind twice makes the second replace the first; a host holds at most one record per kind, because the kind itself is the slot and slots are not named, so one ability cannot hold two `mxt:charges` at once.

`mxt:storage_cooldown` is the exception on the reading side: every payment writes a cooldown, so any ability that goes through the payment gate can be read by it.

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:iron_palm",
  "value": {"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 2}
}
```
