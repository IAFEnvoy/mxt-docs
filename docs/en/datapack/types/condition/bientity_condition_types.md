---
title: Bi-entity Condition Types
description: Every built-in bi-entity condition type registered by the mod, and the JSON fields each type accepts.
---

# Bi-entity Condition Types

A **bi-entity condition** checks the relationship between two entities: an **actor** and a **target**. The pair comes from whichever field declares the condition, so the condition itself cannot pick entities — it only describes what to check about the two it is given. Most types tell the two ends apart, and swapping actor and target changes the result.

Bi-entity conditions are a Java (built-in) registry with fixed `type` ids: a data pack can neither add entries nor remove them. `type` picks one built-in type and its value is one of the ids listed on this page, written with the `mxt` namespace. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md). A field name followed by `?` is optional; every other field is required.

## Common Structure

`type` and every other key sit on the same level:

```json
{
  "type": "mxt:distance",
  "maximum": 8
}
```

A condition is used as a value inside other data tables, so it usually lands under a field such as `bientity_condition`:

```json
"bientity_condition": {
  "type": "mxt:actor_condition",
  "condition": {
    "type": "mxt:entity_type",
    "entity_type": "minecraft:player"
  }
}
```

Anywhere a bi-entity condition is wanted, an array of conditions is accepted too. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"bientity_condition": [
  { "type": "mxt:can_see" },
  { "type": "mxt:distance", "maximum": 16 }
]
```

The array shorthand only works where a condition itself is expected: inside the `conditions` of `mxt:and` and `mxt:or`, every entry still has to be a condition object, not another array.

Seven types — `mxt:always`, `mxt:never`, `mxt:js`, `mxt:and`, `mxt:or`, `mxt:not` and `mxt:chance` — do not look at the entities at all; they answer with a constant, call a script, or combine other conditions. Every other type looks at the actor and target it is handed.

::: info Directed and Undirected Use
Most bi-entity conditions tell the actor from the target, so swapping the two entities changes the result. `mxt:undirected` runs a nested condition once in each direction and passes when either one holds; `mxt:mutual` is its counterpart and passes only when **both** directions hold — that is what "the two of them are friends with each other" is written as. `mxt:both` / `mxt:either` deliberately apply the same entity condition to both ends. Nested entity checks use the [entity condition types](entity_condition_types.md).
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists each type's fields interactively, handy for checking a field name without digging through the tables here.
:::

## Condition Types

### `mxt:always`

Always passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:always"}
```

### `mxt:never`

Always fails.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:never"}
```

### `mxt:js`

Calls a bi-entity condition handler registered through the KubeJS bridge.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The handler id registered with `MxtConditions.biEntity(...)`. |
| `params?` | Object | `{}` | Arguments handed to the callback as-is. |

```json
{"type": "mxt:js", "id": "my_check", "params": {"radius": 4}}
```

An `id` that is not registered, or a callback that throws, counts as `false`.

### `mxt:and`

Passes only when every nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | [Bi-entity condition](bientity_condition_types.md) array | **required** | Every entry has to pass. |

```json
{"type": "mxt:and", "conditions": [{"type": "mxt:can_see"}, {"type": "mxt:friend"}]}
```

### `mxt:or`

Passes when at least one nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | [Bi-entity condition](bientity_condition_types.md) array | **required** | One passing entry is enough. |

```json
{"type": "mxt:or", "conditions": [{"type": "mxt:same_team"}, {"type": "mxt:friend"}]}
```

### `mxt:not`

Negates the nested condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Bi-entity condition](bientity_condition_types.md) | **required** | The condition to negate. |

```json
{"type": "mxt:not", "condition": {"type": "mxt:friend"}}
```

### `mxt:chance`

Passes randomly with the given probability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `chance` | Double | **required** | Probability of passing, between `0` and `1`. |

```json
{"type": "mxt:chance", "chance": 0.25}
```

A `chance` outside `0` to `1` is refused at load.

### `mxt:distance`

Checks that the distance between the actor and the target is at most `maximum`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `maximum` | [Number provider](../number_provider_types.md) | **required** | Upper bound on the distance. |

```json
{"type": "mxt:distance", "maximum": 8}
```

It compares the straight-line distance between the two entities' centers. The condition fails when `maximum` evaluates to a non-finite number or a negative one.

### `mxt:team`

Compares the actor's alliance with the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `same_team?` | Boolean | `true` | `true` requires an alliance, `false` requires the opposite. |

```json
{"type": "mxt:team", "same_team": false}
```

The actor does not have to be on a team itself.

### `mxt:relation`

Compares the actor's ally relationship with the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `allied?` | Boolean | `true` | `true` requires an ally, `false` requires a non-ally. |

```json
{"type": "mxt:relation", "allied": false}
```

### `mxt:friend`

Passes when the actor treats the target as one of its own.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:friend"}
```

### `mxt:element_overcomes`

Passes when at least one of the actor's spirit root elements overcomes one of the target's spirit root elements.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:element_overcomes"}
```

It only asks whether that overcoming relation exists, not what it is worth — the multiplier of the relation belongs to the [damage system](/en/technical/damage), so content that only needs the pairing writes `1.0`.

### `mxt:element_adapted_to`

Passes when the actor is adapted to (`adapted_to`) an element the target carries.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:element_adapted_to"}
```

It is the defensive mirror of `mxt:element_overcomes`, answering "do I resist you"; again it only asks whether the relation exists, and the multiplier still belongs to the [damage system](/en/technical/damage).

### `mxt:can_see`

Checks that the target is within 128 blocks in the actor's dimension and that the line between the two entities' eye positions is not clipped by a block.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `shape_type?` | Vanilla clip shape | `visual` | Which shape decides whether a block blocks sight. |
| `fluid_handling?` | Vanilla fluid mode | `none` | Which mode decides whether a fluid blocks sight. |

```json
{"type": "mxt:can_see"}
```

It fails when the two entities are not in the same dimension; past 128 blocks it skips the ray cast and fails outright.

::: info `mxt:can_see` Values
`shape_type` uses the vanilla sight clip shape and defaults to `visual`, so transparent blocks such as glass do not block the check. `fluid_handling` defaults to `none`; the other vanilla fluid modes are `source_only`, `any` and `water`.
:::

### `mxt:actor_condition`

Tests an [entity condition](entity_condition_types.md) against the actor.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Entity condition](entity_condition_types.md) | **required** | The condition tested against the actor. |

```json
{"type": "mxt:actor_condition", "condition": {"type": "mxt:entity_type", "entity_type": "minecraft:player"}}
```

### `mxt:target_condition`

Tests an [entity condition](entity_condition_types.md) against the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Entity condition](entity_condition_types.md) | **required** | The condition tested against the target. |

```json
{"type": "mxt:target_condition", "condition": {"type": "mxt:sneaking"}}
```

### `mxt:both`

Passes when the [entity condition](entity_condition_types.md) passes for the actor **and** the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Entity condition](entity_condition_types.md) | **required** | The condition both ends have to satisfy. |

```json
{"type": "mxt:both", "condition": {"type": "mxt:entity_type", "entity_type": "minecraft:player"}}
```

### `mxt:either`

Passes when the [entity condition](entity_condition_types.md) passes for the actor **or** the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Entity condition](entity_condition_types.md) | **required** | The condition one end has to satisfy. |

```json
{"type": "mxt:either", "condition": {"type": "mxt:glowing"}}
```

### `mxt:riding_recursive`

Passes when the target shows up anywhere in the actor's riding chain; the direct vehicle counts too.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:riding_recursive"}
```

### `mxt:same_team`

Passes when the actor is on a scoreboard team and is allied to the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:same_team"}
```

::: info Similar Types
`mxt:team`, `mxt:same_team` and `mxt:relation` answer almost the same question with slightly different rules: `mxt:same_team` additionally requires the actor to actually be on a team, while `mxt:team` and `mxt:relation` only compare the alliance result and can each be inverted through their own field.
:::

### `mxt:relative_rotation`

Compares the actor's and the target's rotation vectors.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `axis?` | Array of `x` / `y` / `z` | All three | The axes taking part in the comparison. |
| `actor_rotation?` | `head` / `body` | `head` | Which rotation the actor contributes. |
| `target_rotation?` | `head` / `body` | `body` | Which rotation the target contributes. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The value the angle cosine is compared against. |

```json
{"type": "mxt:relative_rotation", "actor_rotation": "head", "target_rotation": "body", "comparison": ">=", "compare_to": -0.8}
```

An axis left out of `axis` is zeroed before the comparison. `head` takes the look direction and `body` the body facing; a non-living entity with no body facing falls back to its look direction. What is compared is the dot product of the two direction vectors divided by the product of their lengths, that is the cosine of the angle between them — the example above asks whether the two entities are more or less facing each other. It fails when either vector is zero.

### `mxt:undirected`

Passes when the nested bi-entity condition passes in either direction.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Bi-entity condition](bientity_condition_types.md) | **required** | The condition tested once per direction. |

```json
{"type": "mxt:undirected", "condition": {"type": "mxt:can_see"}}
```

### `mxt:mutual`

Passes when the nested bi-entity condition passes in **both** directions. It is the counterpart of `mxt:undirected`: that one asks for either direction, this one for both.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Bi-entity condition](bientity_condition_types.md) | **required** | The condition that has to hold both ways. |

```json
{"type": "mxt:mutual", "condition": {"type": "mxt:friend"}}
```

The example asks whether the two entities consider **each other** friends: `mxt:friend` is directed (it reads the actor's own friend list), so a bare `{"type": "mxt:friend"}` means "the actor counts the target as a friend", and only both directions together mean mutual.

