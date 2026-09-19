---
title: Block Condition Types
description: Every built-in block condition type registered by the mod, with the JSON fields that each type accepts.
---

# Block Condition Types

A **block condition** checks a single block position in a level and returns `true` or `false`. The level and position are supplied by whatever data table declares the condition, so the condition itself only describes what to check about the block at that position.

Block conditions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the table below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

A condition is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:block_tag",
  "tag": "minecraft:logs"
}
```

Because conditions are used as values inside other data tables, the same structure usually appears nested under a field such as `block_condition`:

```json
"block_condition": {
  "type": "mxt:hardness",
  "comparison": ">=",
  "compare_to": 3.0
}
```

Anywhere a block condition is expected, an array of conditions is also accepted. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"block_condition": [
  { "type": "mxt:movement_blocking" },
  { "type": "mxt:height", "comparison": "<", "compare_to": 64 }
]
```

::: info Comparison Fields
Several types compare a value against a number. The `comparison` operator and the number it is compared against, `compare_to`, always sit directly on the condition object as two separate keys, as in the example above. The comparison operators are `==`, `!=`, `<`, `<=`, `>` and `>=`, and `compare_to` is always a plain number.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the table here.
:::

## Condition Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:always_true` | — | Always passes. |
| `mxt:js` | `id`, `params?` | Calls a block condition handler that was registered through the KubeJS bridge. |
| `mxt:and` | `conditions` | Passes only when every nested block condition passes. |
| `mxt:or` | `conditions` | Passes when at least one nested block condition passes. |
| `mxt:not` | `condition` | Negates a nested block condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability between `0` and `1`. |
| `mxt:constant` | `value` | Always returns the given boolean value. |
| `mxt:block_id` | `block` | Matches the block at the position. |
| `mxt:aura_range` | `aura` | Tests the aura concentration at the position against per-aura requirements. `aura` maps an aura ID to an object with a required `max` and an optional `min`. |
| `mxt:block_tag` | `tag` | Matches the block against a vanilla or data pack block tag. |
| `mxt:biome_tag` | `tag` | Matches the biome at the position against a data pack biome tag. |
| `mxt:hardness` | `comparison`, `compare_to` | Compares the block's hardness. |
| `mxt:height` | `comparison`, `compare_to` | Compares the Y coordinate of the position. |
| `mxt:light_level` | `light_type?`, `comparison`, `compare_to` | Compares the light level at the position, optionally for one light layer. |
| `mxt:slipperiness` | `comparison`, `compare_to` | Compares the block's slipperiness. |
| `mxt:blast_resistance` | `comparison`, `compare_to` | Compares the block's blast resistance. |
| `mxt:movement_blocking` | — | Passes when the block blocks motion and has a non-empty collision shape. |
| `mxt:adjacent` | `adjacent_condition`, `comparison`, `compare_to` | Compares the number of adjacent blocks that match a nested block condition. |
| `mxt:offset` | `condition`, `x?`, `y?`, `z?` | Tests a nested block condition at a relative offset from the position. |

::: info `mxt:aura_range`
`aura` is a map from an [aura](../../json/aura.md) to a requirement object with an optional `min` (default `0`) and a required `max`, both of which accept a [number provider](../number_provider_types.md). The condition passes when every listed pool lies inside its range.
:::

::: info `mxt:light_level` and `mxt:adjacent`
`light_type` accepts a vanilla light layer name, for example `block` or `sky`; when it is omitted the maximum local raw brightness is used. `mxt:adjacent` counts the blocks touching the position, and only positions in loaded chunks are considered.
:::
