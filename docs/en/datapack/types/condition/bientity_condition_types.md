---
title: Bi-entity Condition Types
description: Every built-in bi-entity condition type registered by the mod, with the JSON fields that each type accepts.
---

# Bi-entity Condition Types

A **bi-entity condition** checks a relationship or a comparison between two entities: an **actor** and a **target**. The pair is supplied by whatever data table declares the condition, so the condition itself only describes what to check about the two entities it is given.

Bi-entity conditions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the table below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

A condition is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:distance",
  "maximum": 8
}
```

Because conditions are used as values inside other data tables, the same structure usually appears nested under a field such as `bientity_condition`:

```json
"bientity_condition": {
  "type": "mxt:actor_condition",
  "condition": {
    "type": "mxt:entity_type",
    "entity_type": "minecraft:player"
  }
}
```

Anywhere a bi-entity condition is expected, an array of conditions is also accepted. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"bientity_condition": [
  { "type": "mxt:can_see" },
  { "type": "mxt:distance", "maximum": 16 }
]
```

::: info Directed and Undirected Use
Most bi-entity conditions distinguish the actor from the target, so swapping the two entities changes the result. `mxt:undirected` runs a nested condition in both directions, and `mxt:both` / `mxt:either` deliberately apply the same entity condition to both endpoints. Nested entity checks use the [entity condition types](entity_condition_types.md) family.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the table here.
:::

## Condition Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:always_true` | — | Always passes. |
| `mxt:js` | `id`, `params?` | Calls a bi-entity condition handler that was registered through the KubeJS bridge. |
| `mxt:and` | `conditions` | Passes only when every nested bi-entity condition passes. |
| `mxt:or` | `conditions` | Passes when at least one nested bi-entity condition passes. |
| `mxt:not` | `condition` | Negates a nested bi-entity condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability between `0` and `1`. |
| `mxt:constant` | `value` | Always returns the given boolean value. |
| `mxt:distance` | `maximum` | Checks that the distance between the actor and the target is at most `maximum`. |
| `mxt:team` | `same_team?` | Compares the actor's alliance with the target; with the default `same_team` of `true` it requires an alliance, and with `false` it requires the opposite. |
| `mxt:relation` | `allied?` | Compares the actor's ally relationship with the target; with the default `allied` of `true` it requires an ally, and with `false` it requires a non-ally. |
| `mxt:friend` | — | Passes when the actor considers the target a friend. |
| `mxt:element_overcomes` | — | Passes when at least one of the actor's spirit root elements overcomes an element of the target's spirit roots. It asks whether the relation exists, not what it is worth — the multiplier of an edge belongs to the [damage pipeline](../../damage.md), so content that only needs the pairing writes `1.0`. |
| `mxt:can_see` | `shape_type?`, `fluid_handling?` | Checks that the target is within 128 blocks of the actor in the same level and that no block clips the line between their eye positions. |
| `mxt:actor_condition` | `condition` | Tests an [entity condition](entity_condition_types.md) against the actor. |
| `mxt:target_condition` | `condition` | Tests an [entity condition](entity_condition_types.md) against the target. |
| `mxt:both` | `condition` | Passes when the entity condition passes for the actor **and** for the target. |
| `mxt:either` | `condition` | Passes when the entity condition passes for the actor **or** for the target. |
| `mxt:riding_recursive` | — | Passes when the target appears anywhere in the actor's riding chain, not only as the direct vehicle. |
| `mxt:same_team` | — | Passes when the actor is on a scoreboard team and is allied to the target. |
| `mxt:relative_rotation` | `axis?`, `actor_rotation?`, `target_rotation?`, `comparison`, `compare_to` | Compares the actor's and the target's rotation vectors. |
| `mxt:undirected` | `condition` | Passes when the nested bi-entity condition passes in either direction. |

::: info `mxt:can_see` Values
`shape_type` uses the vanilla clip shape and defaults to `visual`, so transparent blocks such as glass do not block the check. `fluid_handling` defaults to `none`; the other vanilla fluid modes are `source_only`, `any` and `water`. `mxt:relative_rotation` restricts the axes with `axis`, which is an array of `x`, `y` and `z` and defaults to all three, and chooses which rotation each endpoint contributes through `actor_rotation` (`head` by default) and `target_rotation` (`body` by default).
:::

::: info Similar Types
`mxt:team`, `mxt:same_team` and `mxt:relation` answer almost the same question with slightly different rules: `mxt:same_team` additionally requires the actor to actually be on a team, `mxt:team` and `mxt:relation` only compare the alliance result and can be inverted through their field.
:::
