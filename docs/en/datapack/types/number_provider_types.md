---
title: Number Provider Types
description: The shorthand forms, structured expressions, and the type, fields and value ranges of every built-in number provider.
---

# Number Provider Types

Any number that has to change with level, realm or event context is a number provider. It accepts three input forms: a JSON number, an expression string, and an object with a `type`.

Evaluation happens entirely on the server; the client only sees the synchronized result. The same definition can produce different numbers on different entities, because the variables are read from the entity at the moment of evaluation.

| Form | Written as | Equivalent to |
| --- | --- | --- |
| Number | `5` | `mxt:constant` |
| String | `"4 + level * 0.5"` | `mxt:expression` |
| Object | `{"type": "mxt:uniform", "min": 1, "max": 3}` | That `type`'s own shape |

In the object form, `type` sits next to the other keys; there is no outer wrapper.

```json
"amount": 5
```

```json
"amount": "4 + level * 0.5"
```

```json
"amount": {"type": "mxt:constant", "value": 5}
```

## Expression Strings

A string is always an expression: operators, parentheses, functions, and the variable names the context provides. The load checks three things — whether the expression parses, whether every name in `params` is a legal variable name, and whether every key in `params` really appears in the expression. Any one of them failing is a decode error: the definition does not load, but the loader **collects every failing entry of that load and lists them together**, rather than reporting only the first.

A string is shorthand for `mxt:expression`; writing a `type` inside the string is neither needed nor accepted.

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

The values in `params` are number providers themselves and accept all three forms. During evaluation, `params` overrides the variable of the same name.

Whether a variable name is legal is decided at load time: the first character is a letter or an underscore, the rest may be letters, digits or underscores. A key in `params` that the expression never uses is a load error too, rather than something kept around unused.

Whether a name is **available** is decided by the built-in variable table together with the current context, and that is only known at evaluation time. A name the context cannot supply is reported: a development environment prints the full ERROR log (with the exception and stack trace), production prints one WARN line per distinct message; both keep evaluating with `0` and never abort the caller. A result that is not finite is reported the same way and returns `0`. The name list is in [Formula Variables](./formula_variables).

## Built-In Number Providers

Each type below gets its own third-level heading. A field that is not marked required in its table may be omitted.

### `mxt:constant`

A single fixed number. The JSON number shorthand is equivalent to it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Double | **required** | Fixed number; must be finite |

```json
{"type": "mxt:constant", "value": 12}
```

### `mxt:expression`

An exp4j expression; `params` may override context variables.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `expression` | String | **required** | The expression text |
| `params` | Map of variable name to number provider | `{}` | Overrides context variables of the same name |

```json
{
  "type": "mxt:expression",
  "expression": "heal + bonus",
  "params": {"bonus": "level * 0.5"}
}
```

### `mxt:context_variable`

Reads one context variable directly, falling back when it cannot be read.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `variable` | String | **required** | Variable name; must not be blank |
| `fallback` | Double | `0` | Value returned when the built-in variable table does not know the name at all; must be finite |

`fallback` only covers "nothing recognizes this name". A name that is known but this context cannot supply still takes the error-reporting path and returns `0`, the same as an expression.

```json
{"type": "mxt:context_variable", "variable": "absorbed_aura", "fallback": 0}
```

### `mxt:sum`

Adds several terms together.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `summands` | List of number providers | **required** | At least one entry; an empty list is rejected at load time |

```json
{"type": "mxt:sum", "summands": [1, "level * 0.25", {"type": "mxt:uniform", "min": 0, "max": 2}]}
```

### `mxt:uniform`

Draws a uniform random value inside a range.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `min` | Number provider | **required** | Lower bound |
| `max` | Number provider | **required** | Upper bound |

Both bounds are evaluated first, and the random source comes from the evaluation context. When `min` is greater than `max`, or either bound is `NaN`, the provider logs a warning and returns `0`; when the two are equal it returns that value directly without rolling.

```json
{"type": "mxt:uniform", "min": 2, "max": "2 + level"}
```

### `mxt:binomial`

`n` Bernoulli trials; returns the number of successes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `n` | Number provider | **required** | Number of trials; after evaluation it must be an integer in `0..16384` |
| `p` | Number provider | **required** | Probability of one success; after evaluation it must be in `0..1` |

When `n` is not an integer or is out of range, or `p` is out of range (including evaluating to `NaN`), the provider logs a warning and returns `0`.

```json
{"type": "mxt:binomial", "n": 5, "p": 0.35}
```

### `mxt:weighted_list`

Picks one entry by weight and evaluates it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `distribution` | List of entries | **required** | At least one entry; an empty list is rejected at load time |

Each entry is a weighted entry, with the same shape everywhere in the mod:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Number provider | **required** | Value returned when this entry is picked |
| `weight` | Integer | `1` | Integer weight |

An entry with a weight of `≤ 0` counts as `0` and is never picked. When every weight in the table is `0` (or the weights sum overflows the integer range), the provider logs a warning and returns `0` without drawing any entry.

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

Checks the branches in order and returns the value of the first branch whose condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `branches` | List of branches | `[]` | Checked in written order |
| `fallback` | Number or expression string | none | Value returned when no player is available or no branch matches; returns `0` when omitted |

Each branch is:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Entity condition | **required** | Condition tested against the player |
| `value` | Number provider | **required** | Value returned when the condition passes |

`fallback` accepts **only a number or an expression string**; writing an object such as `{"type": "mxt:constant", "value": 1}` is a load error.

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

Hands this one evaluation to a server-side script.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback ID registered with `MxtValues.number(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

The callback receives the same formula context the built-in types receive; how to read it is in [MxtValues](/en/kubejs/api/values). When no callback is registered for `id`, the provider logs a warning and returns `0` — it does not fail the load.

```json
{"type": "mxt:js", "id": "example:luck_roll", "params": {"base": 3}}
```

## Aura Concentration Sources

Two numbers describe how much aura a position holds. They are not in `mxt:number_provider_type` but in the resource value provider registry `resource_value_provider_type`:

| `type` | Description |
| --- | --- |
| `mxt:environment_concentration` | The environmental template concentration at the current position. Only environmental sources such as biome, dimension and zone are counted; chunk storage and the aura released by blocks and formations are not. |
| `mxt:actual_concentration` | The final resolved concentration at the current position, including the environment, chunk storage and every active source such as blocks and formations. |

Both read world state and therefore need a position: with no entity to attach to, they resolve to `0`. The full list of resource value providers is in [Resource Bar and Aura Types](/en/datapack/types/other/resource-bar#resource-value-provider-type).
