---
title: Number Provider Types
description: The shorthand forms, built-in number providers, formula functions and formula variables used by MiXianTu number fields.
---

# Number Provider Types

Every value that must change with level, realm or event context is a `NumberProvider`. Evaluation happens on the **server**; the client only uses the synchronized result.

---

## Shorthand

A JSON number is automatically parsed as a constant:

```json
"amount": 5
```

A JSON string is automatically parsed as an expression:

```json
"amount": "4 + level * 0.5"
```

Anything else is a structured provider object with an inlined `type`:

```json
"amount": {
  "type": "mxt:constant",
  "value": 5
}
```

---

## Structured Expressions

```json
{
  "type": "mxt:expression",
  "expression": "base_damage * multiplier",
  "params": {
    "base_damage": 8,
    "multiplier": "1 + level * 0.1"
  }
}
```

The values inside `params` are themselves `NumberProvider`s and override the context variables of the same name. A variable the context cannot provide is reported when the expression is evaluated — a development environment logs the whole error, production logs one warning line per distinct message — and the expression continues with `0`. A formula syntax error is a decode error: the load fails, and it fails together with every other broken formula of that load. A runtime `NaN` or infinity is reported the same way and returns `0`.

Parameter names must be valid variable names: the first character is a letter or `_`, and the rest may be letters, digits or `_`. Every key in `params` must actually appear in the expression, otherwise the load is rejected.

---

## Built-In Providers

### `mxt:constant`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | Double | **required** | Fixed value; must be finite |

A JSON number is equivalent to this type.

```json
{"type": "mxt:constant", "value": 12}
```

### `mxt:expression`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `expression` | String | **required** | exp4j expression |
| `params` | Object of `NumberProvider` | `{}` | Values that override context variables of the same name |

```json
{
  "type": "mxt:expression",
  "expression": "heal + bonus",
  "params": {"bonus": "level * 0.5"}
}
```

### `mxt:context_variable`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `variable` | String | **required** | Name of the context variable to read |
| `fallback` | Double | `0` | Value used when no variable provides that name at all |

```json
{"type": "mxt:context_variable", "variable": "absorbed_aura", "fallback": 0}
```

`fallback` covers a name that no variable provides at all. A name that a variable does provide but this particular context cannot supply is still reported and read as `0`, exactly like an expression would.

### `mxt:sum`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `summands` | List of `NumberProvider` | **required** | The values to add; at least one entry |

```json
{"type": "mxt:sum", "summands": [1, "level * 0.25", {"type": "mxt:uniform", "min": 0, "max": 2}]}
```

### `mxt:uniform`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `min` | `NumberProvider` | **required** | Lower bound |
| `max` | `NumberProvider` | **required** | Upper bound |

The value is drawn from the `RandomSource` carried by the passed context. Equal bounds return that bound directly, and `min` greater than `max` logs a warning and returns `0`.

```json
{"type": "mxt:uniform", "min": 2, "max": "2 + level"}
```

### `mxt:binomial`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `n` | `NumberProvider` | **required** | Number of Bernoulli trials; an integer from `0` to `16384` |
| `p` | `NumberProvider` | **required** | Success probability from `0` to `1` |

Returns the number of successes. Out-of-range parameters log a warning and return `0`.

```json
{"type": "mxt:binomial", "n": 5, "p": 0.35}
```

### `mxt:weighted_list`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `distribution` | List of entries | **required** | At least one entry |

Each entry has its own fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `NumberProvider` | **required** | The value produced by this entry |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often, a weight of `0` or less is never picked, and an all-zero table picks uniformly |

```json
{
  "type": "mxt:weighted_list",
  "distribution": [
    {"value": 1, "weight": 3},
    {"value": "level * 2", "weight": 1}
  ]
}
```

### `mxt:conditional`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `branches` | List of branches | `[]` | Branches checked in order |
| `fallback` | Number or expression string | none | Value used when there is no `Player` or no branch matched; `0` when omitted |

Each branch has its own fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `condition` | `EntityCondition` | **required** | Condition tested against the player |
| `value` | `NumberProvider` | **required** | Value returned when the condition passes |

`fallback` only accepts a number or an expression string, not an arbitrary provider object.

```json
{
  "type": "mxt:conditional",
  "branches": [
    {"condition": {"type": "mxt:sneaking"}, "value": 4},
    {"condition": {"type": "mxt:has_realm", "aura": "example:qi"}, "value": "level + 1"}
  ],
  "fallback": 1
}
```

### `mxt:js`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | **required** | Callback ID registered with `MxtValues.number(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

Calls a KubeJS number provider extension. When no callback is registered for `id`, the provider logs a warning and returns `0`. See the [KubeJS API Reference](../../kubejs/api-reference.md).

```json
{"type": "mxt:js", "id": "example:luck_roll", "params": {"base": 3}}
```

---

## Aura Concentration Sources

Two numbers describing the aura at a position are provided by the separate `resource_value_provider_type` family rather than by `number_provider_type`:

| `type` | Description |
|--------|-------------|
| `mxt:environment_concentration` | The environmental template concentration at the current position. Only environmental sources such as biome, dimension and zone are counted; chunk storage and aura released by blocks or formations are excluded. |
| `mxt:actual_concentration` | The final resolved concentration at the current position, including the environment, chunk storage and every active source such as blocks and formations. |

The full list of resource value providers is in [Other Type Families](/en/datapack/types/other/resource-bar#resource-value-provider-type).

The `RandomSource` of an entity or a `Level` is passed to the random providers first. Do not re-roll a random value on the client to decide a game result; the client only displays the synchronized server result.

---

## Formula Functions

Formulas are evaluated with exp4j. The mod registers these additional functions into the built-in `mxt:formula_function` registry:

| Function | Arguments | Description |
|----------|-----------|-------------|
| `round(x)` | 1 | Rounds to the nearest whole number |
| `clamp(x, min, max)` | 3 | Limits `x` to the inclusive range `min..max` |
| `min(a, b)` | 2 | Smaller of the two values |
| `max(a, b)` | 2 | Larger of the two values |

The standard exp4j functions are also available: `abs`, `acos`, `asin`, `atan`, `cbrt`, `ceil`, `cos`, `cosh`, `cot`, `exp`, `expm1`, `floor`, `log`, `log10`, `log1p`, `log2`, `pow`, `signum`, `sin`, `sinh`, `sqrt`, `tan` and `tanh`. The constants `pi` and `e` are recognized as well. The mod's own name scanner recognizes the four functions above plus `abs`, `acos`, `asin`, `atan`, `cbrt`, `ceil`, `cos`, `cosh`, `exp`, `floor`, `log`, `log10`, `sin`, `sinh`, `sqrt`, `tan` and `tanh`, so an expression that uses one of the remaining exp4j functions can still be reported as reading an unknown variable.

---

## Formula Variables

Formulas read named variables. An explicit value in the context always wins over the variable registry, `params` overrides any name inside its own expression, and an unknown name is reported instead of being ignored.

Which names exist depends on **where the formula is evaluated**: every resource, cultivation and ability formula runs with an entity context, bi-entity formulas add the `target_` set, and each trigger adds a few names of its own.

The full list, the flattening rule for resource and attribute names, the availability matrix and the error policy are in **[Formula Variables](./formula_variables.md)**.

In short, the built-in `mxt:formula_variable` registry provides two names that work in every context:

| Variable | Description |
|----------|-------------|
| `zero` | Always `0` |
| `random` | A new random double between `0` and `1`, drawn from the authoritative `RandomSource` of the context |

Everything else — the `caster_` and `target_` families, the resource variables such as `realm_rank` and `absorbed_aura`, and the per-system values such as `damage` or `element_modifier` — is documented in [Formula Variables](./formula_variables.md).
