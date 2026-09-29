---
title: Block Conditions (block_condition_type)
description: Every built-in block condition type registered by the mod, and the JSON fields each type accepts.
---

# Block Conditions (block_condition_type)

A **block condition** checks one block position in the world and returns `true` or `false`. Which level and which position get checked is decided by the data table that declares the condition, so a condition only ever describes what the block at that position has to look like.

Block conditions are a Java (built-in) registry, so `type` can only be one of the ids listed below, written with the `mxt` namespace. A data pack cannot add entries to this registry, and it cannot remove them either. Adding a custom type means writing Java, or going through the KubeJS bridge — see the [KubeJS API](../../../kubejs/api-reference.md).

## Common Structure

A condition is a JSON object: `type` names the built-in type and every remaining key is a field of that type.

```json
{
  "type": "mxt:block_tag",
  "tag": "minecraft:logs"
}
```

Conditions usually appear nested as a value inside other data tables, for example under a field such as `block_condition`:

```json
"block_condition": {
  "type": "mxt:hardness",
  "comparison": ">=",
  "compare_to": 3.0
}
```

Anywhere a block condition is accepted, an array is accepted too. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"block_condition": [
  { "type": "mxt:movement_blocking" },
  { "type": "mxt:height", "comparison": "<", "compare_to": 64 }
]
```

An entry the array cannot decode is dropped and leaves one `Ignoring invalid list element` line in the log; the other entries are still evaluated normally. An empty array is legal as well, and `mxt:and` with an empty array is always `true`.

::: info Comparison Fields
A group of types compares a value against a number. `comparison` (the operator) and `compare_to` (the number compared against) are always two separate keys written directly on the condition object, as in the examples above. The operators are `==`, `!=`, `<`, `<=`, `>` and `>=`, and `compare_to` is always a plain number.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists a type's fields interactively, which is handy for checking field names without scrolling through the tables on this page.
:::

## Meta Conditions

This group does not look at a block at all. They either assemble other block conditions or answer with a constant.

### mxt:always

Always `true`. Takes no fields.

```json
{ "type": "mxt:always" }
```

### mxt:never

Always `false`. Takes no fields.

```json
{ "type": "mxt:never" }
```

### mxt:js

Hands the test to a block condition handler registered through the KubeJS bridge. The script side receives the `Level`, the `BlockPos`, `params` and the evaluation context when it is registered.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **Required** | The id the handler was registered under. |
| `params` | JSON object | Empty object | Passed to the handler as-is. |

```json
{
  "type": "mxt:js",
  "id": "example:my_check",
  "params": { "limit": 3 }
}
```

### mxt:and

Passes only when every nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | Block condition array | **Required** | The nested conditions to check one by one. |

```json
{
  "type": "mxt:and",
  "conditions": [
    { "type": "mxt:block_tag", "tag": "minecraft:logs" },
    { "type": "mxt:height", "comparison": ">", "compare_to": 60 }
  ]
}
```

### mxt:or

Passes when at least one nested condition passes.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `conditions` | Block condition array | **Required** | The nested conditions to check one by one. |

```json
{
  "type": "mxt:or",
  "conditions": [
    { "type": "mxt:block_id", "block": "minecraft:water" },
    { "type": "mxt:block_id", "block": "minecraft:lava" }
  ]
}
```

An empty array is always `false`.

### mxt:not

Inverts the result of the nested condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Block condition | **Required** | The nested condition to invert. |

```json
{
  "type": "mxt:not",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" }
}
```

### mxt:chance

Passes randomly with a probability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `chance` | Number | **Required** | The probability of passing, from `0` to `1`. |

```json
{ "type": "mxt:chance", "chance": 0.25 }
```

A value outside `0..1` is refused at load time. The test is "a random number is less than `chance`", so even `1` is not a guaranteed pass; only `0` is a guaranteed failure.

## Block Conditions

This group actually looks at the block or the environment at that position.

### mxt:block_id

Matches the block at the position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block` | Block id | **Required** | The block to compare against. |

```json
{ "type": "mxt:block_id", "block": "minecraft:stone" }
```

Only one concrete block id is accepted here; a `#` tag does nothing, so use `mxt:block_tag` to match by tag.

### mxt:block_tag

Matches the block at the position against a block tag. Both vanilla tags and tags added by data packs work.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | Block tag | **Required** | The tag id to compare against. |

```json
{ "type": "mxt:block_tag", "tag": "minecraft:logs" }
```

### mxt:biome_tag

Matches the biome at the position against a biome tag.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | Biome tag | **Required** | The tag id to compare against. |

```json
{ "type": "mxt:biome_tag", "tag": "minecraft:is_forest" }
```

### mxt:aura_range

Tests the aura concentration at the position against a per-aura requirement.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Map from aura id to requirement object | **Required** | Keys are [aura](../../json/aura.md) ids, values are `{ "min"?, "max" }`. |

```json
{
  "type": "mxt:aura_range",
  "aura": {
    "example:azure_aura": { "min": 20, "max": 200 }
  }
}
```

In a requirement object `max` is required and `min` is optional (default `0`), and both accept a [number provider](../number_provider_types.md). The condition passes only when every listed aura's concentration falls inside that aura's own range. The server resolves the concentration at the position being evaluated.

Entries in the map whose key or value cannot be decoded are dropped with a log line rather than treated as an error.

### mxt:offset

Tests a nested condition at a relative offset.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Block condition | **Required** | The condition to test at the offset position. |
| `x` | Integer | `0` | Offset along X. |
| `y` | Integer | `0` | Offset along Y. |
| `z` | Integer | `0` | Offset along Z. |

```json
{
  "type": "mxt:offset",
  "condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "y": -1
}
```

### mxt:hardness

Compares the block's hardness.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The hardness to compare against. |

```json
{ "type": "mxt:hardness", "comparison": ">=", "compare_to": 3.0 }
```

### mxt:height

Compares the Y coordinate of the position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The Y coordinate to compare against. |

```json
{ "type": "mxt:height", "comparison": "<", "compare_to": 64 }
```

### mxt:light_level

Compares the light level at the position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `light_type` | String | none | Write a vanilla light layer name, for example `block` or `sky`, to compare one layer only. |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The light level to compare against. |

```json
{ "type": "mxt:light_level", "light_type": "block", "comparison": "<=", "compare_to": 7 }
```

With no `light_type` the comparison uses the maximum raw brightness at the position. An unrecognised light layer name is refused at load time.

### mxt:slipperiness

Compares the block's slipperiness.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The slipperiness to compare against. |

```json
{ "type": "mxt:slipperiness", "comparison": ">", "compare_to": 0.6 }
```

### mxt:blast_resistance

Compares the block's blast resistance.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The blast resistance to compare against. |

```json
{ "type": "mxt:blast_resistance", "comparison": ">=", "compare_to": 10.0 }
```

This reads the block's base resistance value, with no explosion context attached.

### mxt:movement_blocking

Passes when the block blocks motion and has a non-empty collision shape. Takes no fields.

```json
{ "type": "mxt:movement_blocking" }
```

Both conditions have to hold at once: having a collision shape is not enough on its own, since cobwebs and bamboo saplings have one yet do not block motion.

### mxt:adjacent

Counts the neighbouring blocks that match a nested condition and compares that count against a number.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `adjacent_condition` | Block condition | **Required** | The nested condition that filters the neighbouring blocks. |
| `comparison` | Operator | **Required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Number | **Required** | The number of neighbours to compare against. |

```json
{
  "type": "mxt:adjacent",
  "adjacent_condition": { "type": "mxt:block_tag", "tag": "minecraft:logs" },
  "comparison": ">=",
  "compare_to": 3
}
```

Each of the six directions counts once and adds one on a hit, so the count tops out at `6`. Only positions in loaded chunks take part; an unloaded side is simply not counted, and it is not an error either.
