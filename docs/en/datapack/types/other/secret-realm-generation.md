---
title: Secret Realm Generations (secret_realm_generation_type)
description: The five built-in mxt:secret_realm_generation_type entries, their fields, defaults and when they resolve.
---

# Secret Realm Generations (secret_realm_generation_type)

## `secret_realm_generation_type`

The `generation` of a [secret realm](../../json/secret_realm.md) picks a generation type from this family to decide how the instance dimension is built. A data pack can only pick an existing type and cannot add new ones.

The registry entries a `generation` names (`stem`, `dimension_type`, `biome`) are resolved **when an instance is created**: datapack registries load in parallel, so what is read at decode time may not be bound yet. A failed resolution fails the creation (`GENERATION_FAILED`) and logs one line; no half-built instance is left behind.

```json
"generation": { "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" }
```

### `mxt:stem`

Takes one registered dimension generator as its template and opens an instance under a new dimension key.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `stem` | Dimension generator id | **required** | For example `minecraft:overworld`, `minecraft:the_end`. |

```json
{ "type": "mxt:stem", "stem": "minecraft:the_end" }
```

### `mxt:flat`

A superflat world.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `preset` | String | **required** | A vanilla superflat layer string, for example `"1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"`. |
| `dimension_type` | Dimension type id | `minecraft:overworld` | Which dimension type the instance uses. |
| `structures` | Boolean | `true` | Whether to generate structures. |

```json
{ "type": "mxt:flat", "preset": "1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains" }
```

### `mxt:void`

An empty world: no layers, one biome and no structures by default, which suits a secret realm furnished entirely from `structures`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `biome` | Biome id | `minecraft:the_void` | The biome the whole instance uses. |
| `dimension_type` | Dimension type id | none | Which dimension type the instance uses. |
| `structures` | Boolean | `false` | Whether to generate structures. |

```json
{ "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" }
```

### `mxt:template`

Copies `region`, `entities` and `poi` from `<server directory>/mxt_secret_realm/<template>/` and then loads them; this is the route for a hand-built map.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `template` | String | **required** | The template directory name; only `[A-Za-z0-9_-]+` is accepted, and anything else fails the creation. |
| `stem` | Dimension generator id | **required** | The dimension generator used to load this template. |

```json
{ "type": "mxt:template", "template": "trial_arena", "stem": "minecraft:overworld" }
```

### `mxt:existing`

Creates no dimension at all and uses one that already exists (including a datapack `dimension/` entry). `max_instances` is meaningless for it, and the secret realm never unloads or deletes that dimension when an instance ends.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `dimension` | Dimension id | **required** | Uses this existing dimension as the instance directly. |

```json
{ "type": "mxt:existing", "dimension": "minecraft:the_end" }
```

The border belongs to this type as well: it is the only one that touches that real dimension's border when a [`border`](../../json/secret_realm.md) is written, while every other type explicitly sets a freshly created dimension to the vanilla default border.
