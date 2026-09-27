---
title: Aura Maximum Types
description: The three algorithms of the mxt:aura_maximum_type aura maximum, their fields, the bare number shorthand, and what an omitted max means.
---

# Aura Maximum Types

`mxt:aura_maximum_type` resolves the **environmental** storage maximum of an aura chunk. Every entry in the `aura` of [aura_zone](../../json/aura_zone.md) and [block_aura](../../json/block_aura.md) has the same shape, and the maximum is written in that entry's `max`. Block contributions and formation bonuses are applied separately at runtime and do not occupy this maximum.

The mod registers these algorithms; a data pack can only choose one of them and cannot add new ones.

## `aura_maximum_type`

An omitted `max` counts as `mxt:initial_multiplier` with a multiplier of `1`, so the maximum follows the initial stock. A bare **non-negative** number is shorthand for `mxt:fixed`: `100` and `{"type": "mxt:fixed", "value": 100}` are equivalent, while a bare negative number does not decode and fails to load.

### `mxt:fixed`

A fixed maximum, independent of the initial stock.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Double | **required** | The fixed maximum, `0` or greater. |

```json
{"type": "mxt:fixed", "value": 100}
```

Bare number shorthand:

```json
100
```

### `mxt:initial_multiplier`

The maximum is a multiple of the initial stock.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `multiplier` | Double | `1` | Factor applied to the non-negative initial stock, `0` or greater. |

```json
{"type": "mxt:initial_multiplier", "multiplier": 2}
```

### `mxt:unlimited`

No maximum.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:unlimited"}
```

---

`mxt:initial_multiplier` multiplies the initial stock **after it is clamped to non-negative**: a negative initial stock counts as `0`, and the multiplier is itself limited to `0` or greater, so the result is never negative.

`mxt:unlimited` evaluates to positive infinity. The cultivation speed side switches an infinite maximum from `concentration / maximum` to `concentration / (concentration + 1)`; the chunk stock and the block and formation contributions still add on top, and the maximum stays infinite.

`max` is only the **environmental** maximum: block aura additionally raises the effective capacity of the same aura, and that part is not limited by `mxt:fixed` or `mxt:initial_multiplier`.
