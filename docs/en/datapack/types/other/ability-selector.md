---
title: Ability Target Selectors (ability_target_selector_type)
---

# Ability Target Selectors (ability_target_selector_type)

`ability_target_selector_type` decides which entities an ability's bi-entity behaviour applies to. It is written in the ability's top-level `target_selector`, and the default is `mxt:self`.

## `ability_target_selector_type`

The three selectors `mxt:area` / `mxt:ray` / `mxt:cone` all take `include_actor`, `limit` and `order`; `mxt:self` and `mxt:js` have none of those three fields — `mxt:self` always selects the caster alone, and `mxt:js` hands over however many the script returns.

When it is read is decided by the ability type:

- `mxt:active`, `mxt:triggered`, `mxt:channelled` and `mxt:interval` go through the selector every time they run their actions.
- `mxt:aura` reads it only when it is **fired one-off** (a command, a script or a talisman); its own recurring pulses do not read the selector and pick entities by `radius` alone.
- `mxt:targeted` uses it to ask "who does this cast reach": an area skill and a raycast skill differ in this selector alone — one writes `radius`, the other `length`, and both have to state a distance.

### `mxt:self`

Selects the ability's caster only.

It has no fields; the whole selector is `{"type": "mxt:self"}`.

```json
{"type": "mxt:self"}
```

### `mxt:area`

A **box** centred on the caster (or on this invocation's origin).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | `NumberProvider` | **required** | The box's radius |
| `include_actor` | Boolean | `false` | Whether the caster is included in the selection |
| `limit` | Integer | `0` | At most how many targets to keep |
| `order` | `nearest` / `farthest` / `random` | `nearest` | Which targets survive when there are more than `limit` |

The shape of the box: with no origin it is the actor's own collision box widened by `radius`, and with one it is a cube of side `2 × radius` — **not a sphere**.

```json
{"type": "mxt:area", "radius": 6, "include_actor": true, "limit": 3, "order": "nearest"}
```

### `mxt:ray`

A **cylinder** along the caster's look.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `NumberProvider` | **required** | How far it reaches along the look |
| `radius` | `NumberProvider` | `0.5` | The cylinder's thickness |
| `include_actor` | Boolean | `false` | Whether the caster is included in the selection |
| `limit` | Integer | `0` | At most how many targets to keep |
| `order` | `nearest` / `farthest` / `random` | `nearest` | Which targets survive when there are more than `limit` |

The cylinder starts at the eye position (or this invocation's origin), is `length` blocks long and `radius` blocks thick.

```json
{"type": "mxt:ray", "length": 24, "radius": 0.5, "limit": 1}
```

### `mxt:cone`

A **cone** along the caster's look, where `angle` is the **half-angle**.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `NumberProvider` | **required** | How far it reaches along the look |
| `angle` | `NumberProvider` | **required** | The cone's half-angle in degrees, between `0` and `180` |
| `include_actor` | Boolean | `false` | Whether the caster is included in the selection |
| `limit` | Integer | `0` | At most how many targets to keep |
| `order` | `nearest` / `farthest` / `random` | `nearest` | Which targets survive when there are more than `limit` |

```json
{"type": "mxt:cone", "length": 8, "angle": 30}
```

::: info Both the cylinder and the cone are stopped by blocks

The `mxt:ray` cylinder is clipped by blocks along its **centre line**, so it never reaches through a wall; the `mxt:cone` centre line is clipped the same way, so a wall straight ahead shortens the cone. **Occlusion from the side of a cone is not tested per target**: a target inside the cone is selected while the centre line is clear, even with something between it and the caster.

:::

### `mxt:js`

Selects the entities a server script returns; it has no `limit` and no `order`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback ID registered with `MxtAbilities.selector(id, callback)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}}
```

The callback runs on the server while the ability executes and returns an array of entities. Every execution of the ability performs one selection, so a missing callback selects no entities and logs a warning. It never receives this invocation's origin.

**These caps are clamped at runtime, not reported as errors**: `mxt:area`'s `radius` is clamped to `128`, `mxt:ray`'s `radius` to `64`, `mxt:ray` / `mxt:cone`'s `length` to `128`, and a `mxt:cone` `angle` that evaluates above `180` counts as `180`. The clamp is what keeps one selection from walking the whole level.

**Only values written as constants are checked at load time**: `limit` must not be negative, `length` must be finite and positive, `mxt:ray`'s `radius` must be finite and non-negative, and `angle` must be between `0` and `180`. **`mxt:area`'s `radius` is not checked at load time**: a constant negative merely makes that selection empty. A value written as a formula is only settled at runtime, and an invalid evaluation makes that selection empty.

**When nothing is selected**: a `radius` that is negative or non-finite, or a `length` that is non-finite or non-positive, makes that selection empty. A `limit` of `0` or a negative number keeps everything.

**`order` only matters when a limit is really applied**: all three area-like selectors can write "the nearest three" and "a random few" with it, and **ties are broken by entity id**, so the same instant always selects the same beings.

**Two "radii" are not the same shape**: the `mxt:area` selector picks a **box**, while an `mxt:aura` pulse is a **sphere** (centred on the caster, comparing each candidate's straight-line distance). Both spell their field `radius`, but they cover different sets of entities.
