---
title: Damage Condition Types
description: Every built-in damage condition type registered by the mod, with the JSON fields that each type accepts.
---

# Damage Condition Types

A **damage condition** inspects an incoming damage source and its damage amount, and returns `true` or `false`. The source and the amount are supplied by whatever data table declares the condition, so the condition itself only describes what to check about the damage it is given.

Damage conditions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the table below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

A condition is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:damage_type_tag",
  "tag": "minecraft:is_fire"
}
```

Because conditions are used as values inside other data tables, the same structure usually appears nested under a field such as `damage_condition`:

```json
"damage_condition": {
  "type": "mxt:amount_range",
  "min": 4,
  "max": 20
}
```

Anywhere a damage condition is expected, an array of conditions is also accepted. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"damage_condition": [
  { "type": "mxt:projectile" },
  { "type": "mxt:amount_range", "min": 2, "max": 10 }
]
```

::: info Damage Registries
`damage_type` accepts the id of a registered damage type, for example `minecraft:fall`, and `damage_type_tag` accepts a damage type tag such as `minecraft:is_fire`. Both follow the standard vanilla damage type registry, so data packs that add damage types or tags are visible here.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the table here.
:::

## Condition Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:always_true` | — | Always passes. |
| `mxt:js` | `id`, `params?` | Calls a damage condition handler that was registered through the KubeJS bridge. |
| `mxt:and` | `conditions` | Requires every nested damage condition to pass. |
| `mxt:or` | `conditions` | Passes when at least one nested damage condition passes. |
| `mxt:not` | `condition` | Negates a nested damage condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability between `0` and `1`. |
| `mxt:constant` | `value` | Always returns the given boolean value. |
| `mxt:amount_range` | `min`, `max` | Checks that the damage amount lies between `min` and `max`. |
| `mxt:directness` | `direct?` | Checks whether the damage source has a direct entity independent of its owner; `direct` defaults to `true`, and `false` requires the opposite. |
| `mxt:damage_type` | `damage_type` | Matches one concrete registered damage type. |
| `mxt:damage_type_tag` | `tag` | Matches the damage source against a damage type tag. |
| `mxt:fire` | — | Matches damage that belongs to the vanilla fire damage tag. |
| `mxt:magic` | — | Matches vanilla damage sources that are classified as magic. |
| `mxt:projectile` | `projectile?`, `projectile_condition?` | Matches projectile damage, optionally restricted to one projectile entity type and filtered by an [entity condition](entity_condition_types.md) on the projectile. |
| `mxt:element` | `elements` | Matches the strike by the elements it is made of. `elements` is a `HolderOrTag<element>[]`, and the condition passes when any element the strike belongs to is listed. The strike's elements are exactly the ones the damage pipeline reads — the damage type's claimants, falling back to the attacker's spirit roots only when nobody claims it — so the condition can never disagree with the multiplier the target actually took, and it answers for a lava tick once an element claims `minecraft:lava`. |

::: info Difference Between `mxt:fire` and a Damage Tag
`mxt:fire` takes no fields and is equivalent to `mxt:damage_type_tag` with the vanilla fire damage tag. Use the tag form when you want to point at a different tag without writing a new type.
:::

::: info Chance and Randomness
`mxt:chance` draws from the damage source entity's own random stream when the source has one, so the roll follows that entity rather than a fresh generator. When the source has no entity at all it falls back to a new unseeded random source, so that case is not reproducible across sides.
:::
