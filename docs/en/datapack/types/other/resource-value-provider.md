---
title: Resource Value Providers (resource_value_provider_type)
description: The eight sources of the resource_value_provider_type family, their fields, defaults and boundaries.
---

# Resource Value Providers (resource_value_provider_type)

A value provider resolves one number for a value: the current value, the defined maximum, the regeneration speed, how far it is from the maximum, and the two aura concentrations. It is not written in a resource bar — scripts evaluate it: hand the object to `MxtValues.evaluateResource(entity, resource, definition)`, and register the callback of `mxt:js` with `MxtValues.resourceValue(id, callback)`, see the [KubeJS API reference](../../../kubejs/api/values.md).

This family is registered by the mod; a data pack picks one, it cannot add a new one.

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

---

`mxt:regen` resolves to `0` when no matching aura definition can be read. Both concentration sources read world state and therefore need an entity: with no entity they resolve to `0`. The server computes them from world state, the client reads the aura pool that was synchronized down. A missing or throwing `mxt:js` callback logs a warning and resolves to `0`.

Both concentration IDs appear in two places, do not mix them up: written in the `context` of a resource bar they are contexts, they read the pool synchronized to the client and need no entity; written as a type on this page they need an entity, and the server computes them from world state itself.
