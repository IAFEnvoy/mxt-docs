---
title: Damage Conditions (damage_condition_type)
description: Every built-in damage condition type registered by the mod, and the JSON fields each type accepts.
---

# Damage Conditions (damage_condition_type)

A **damage condition** inspects an incoming hit: its source and its amount, and returns `true` or `false`. The source and the amount come from the data table that declares the condition, so the condition itself only describes what to check about those two.

It is a Java (built-in) registry, so `type` has to be one of the ids listed below, written with the `mxt` namespace. A data pack can neither add entries to this registry nor remove them. Custom types take Java or the KubeJS bridge — see the [KubeJS API](../../../kubejs/api-reference.md).

## Common Structure

A condition is a JSON object: `type` names the built-in type, and every other key is a field of that type:

```json
{
  "type": "mxt:damage_type_tag",
  "tag": "minecraft:is_fire"
}
```

A condition is usually a value nested inside another data table, under a field such as `damage_condition`:

```json
"damage_condition": {
  "type": "mxt:amount_range",
  "min": 4,
  "max": 20
}
```

Anywhere a damage condition is accepted, an array is accepted too. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"damage_condition": [
  { "type": "mxt:projectile" },
  { "type": "mxt:amount_range", "min": 2, "max": 10 }
]
```

::: info Damage Registries
`damage_type` accepts the id of a registered damage type, for example `minecraft:fall`; `damage_type_tag` accepts a damage type tag such as `minecraft:is_fire`. Both read the vanilla damage type registry, so damage types and tags added by data packs are visible here.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists a type's fields interactively, which is handy for checking a field name without digging through the tables on this page.
:::

## Meta Conditions

These do not inspect the damage itself; they assemble other damage conditions, or hand back a constant result.

### `mxt:always`

Always `true`. No fields.

```json
{ "type": "mxt:always" }
```

### `mxt:never`

Always `false`. No fields.

```json
{ "type": "mxt:never" }
```

### `mxt:js`

Hands the decision to a damage condition handler registered through the KubeJS bridge. The script callback receives the damage source, the damage amount, `params` and the evaluation context.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The id written to `MxtConditions.damage(id, callback)`. |
| `params` | JSON object | `{}` | Arguments passed to the handler unchanged. |

```json
{
  "type": "mxt:js",
  "id": "example:on_fire_hit",
  "params": { "threshold": 4 }
}
```

### `mxt:and`

Passes only when every nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | Damage condition array | **required** | The nested conditions to check one by one. |

```json
{
  "type": "mxt:and",
  "conditions": [
    { "type": "mxt:fire" },
    { "type": "mxt:amount_range", "min": 1, "max": 100 }
  ]
}
```

### `mxt:or`

Passes when at least one nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | Damage condition array | **required** | The nested conditions to check one by one. |

```json
{
  "type": "mxt:or",
  "conditions": [
    { "type": "mxt:fire" },
    { "type": "mxt:magic" }
  ]
}
```

### `mxt:not`

Negates the result of the nested condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Damage condition | **required** | The condition to negate. |

```json
{
  "type": "mxt:not",
  "condition": { "type": "mxt:projectile" }
}
```

### `mxt:chance`

Passes randomly with the given probability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `chance` | Double | **required** | Probability of passing, from `0` to `1`; out of range is refused at load. |

```json
{ "type": "mxt:chance", "chance": 0.25 }
```

When the damage source carries an entity, `mxt:chance` draws from that entity's own random stream, so the roll follows it instead of opening a second generator. When the source has no entity at all, it falls back to a new unseeded random source, and that case is not reproducible between client and server.

## Condition Types

### `mxt:amount_range`

Checks whether the damage amount lies between `min` and `max`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `min` | `NumberProvider` | **required** | Lower bound of the range. |
| `max` | `NumberProvider` | **required** | Upper bound of the range. |

```json
{ "type": "mxt:amount_range", "min": 4, "max": 20 }
```

### `mxt:directness`

Checks whether the damage source has a direct entity independent of its owner.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `direct` | Boolean | `true` | `true` requires a direct entity; writing `false` requires the opposite. |

```json
{ "type": "mxt:directness", "direct": false }
```

### `mxt:damage_type`

Matches one concrete registered damage type.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `damage_type` | Damage type id | **required** | The one damage type to match. |

```json
{ "type": "mxt:damage_type", "damage_type": "minecraft:fall" }
```

### `mxt:damage_type_tag`

Matches the damage source against a damage type tag.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | Damage type tag | **required** | The tag to match, written without `#`. |

```json
{ "type": "mxt:damage_type_tag", "tag": "minecraft:is_fire" }
```

### `mxt:fire`

Matches damage that belongs to the vanilla fire damage tag. No fields.

```json
{ "type": "mxt:fire" }
```

It is equivalent to `mxt:damage_type_tag` with the vanilla fire damage tag. To point at a different tag without writing a new type, use the tag form.

### `mxt:magic`

Matches vanilla damage sources that are classified as magic. No fields.

```json
{ "type": "mxt:magic" }
```

### `mxt:projectile`

Matches projectile damage, optionally restricted to one projectile entity type and filtered by an entity condition on that projectile.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `projectile` | Entity type id | no restriction | Only matches this projectile. |
| `projectile_condition` | Entity condition | `mxt:always` | Filters the projectile that dealt the damage with an [entity condition](entity_condition_types.md). |

```json
{
  "type": "mxt:projectile",
  "projectile": "minecraft:arrow",
  "projectile_condition": { "type": "mxt:glowing" }
}
```

### `mxt:element`

Matches the hit by its **elements**.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | Element id, `#` tag, or an array of them | **required** | Passes when one of the listed elements is among the hit's elements; at least one entry. |

```json
{ "type": "mxt:element", "elements": ["#example:fire", "example:metal"] }
```

The hit's elements are the ones the damage pipeline reads: the damage type's claimants, falling back to the attacker's spirit roots only when nobody claims it. So the elements a condition names always agree with the multiplier the target actually takes, and once an element claims `minecraft:lava`, lava damage answers this condition too. `elements` needs at least one entry: an empty array is refused at load rather than turning into a condition that never passes.
