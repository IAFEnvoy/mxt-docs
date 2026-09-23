---
title: Aura Zone (aura_zone)
description: "Define an aura environment template: per-aura inventory, match conditions, fluctuation, rules, particles, client fog and HUD bars."
aside: false
---

# Aura Zone (aura_zone)

An Aura Zone defines an aura environment template: the per-aura inventory supplied to a chunk, which dimensions and biomes it matches, how it fluctuates over time, which cultivation rules it applies, and how it looks on the client.

## File Location

Aura Zone JSON files go in `data/<namespace>/mxt/aura_zone/` within your data pack.

**Purpose**: Environment aura templates.

The filename corresponds to its ID. For example, `data/example/mxt/aura_zone/spirit_land.json` has the ID `example:spirit_land`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `aura` | `Map<Holder<aura>, AuraValue>` | `{}` | Independent environment inventory definition for each aura; `AuraValue` contains the amount, maximum, regeneration speed and colour. |
| `distribution` | Enum | `equal` | How aura is shared inside one chunk when it is insufficient for several players: `random`, `equal`, `realm_weighted`. |
| `cultivate_condition` | Entity Condition | `mxt:always_true` | The condition under which the current environment allows cultivation; checked together with the current realm stage condition. |
| `dimensions` | `HolderOrTag<LevelStem>[]` | `[]` | Dimension matching. |
| `biomes` | `HolderOrTag<Biome>[]` | `[]` | Biome matching. |
| `fluctuation` | Object | static/0 | Day/night or moon phase fluctuation. |
| `rules` | Object | all off | Cultivation suppression, tribulation, spirit herb and alchemy environment rules. |
| `element_fit_bonus` | Double | `0` | Spirit root element fit bonus: added when this root's own aura is present in the zone. |
| `element_conflict_penalty` | Double | `0` | Element conflict penalty: multiplied by the **opposition concentration**, the sum of the concentrations of every *other* element this root's element has an `overcomes`/`adapted_to` relation with, so an empty zone is no longer treated as a hostile one. |
| `noise` | Object | off | Two-dimensional noise distribution driven by a seed. |
| `particle` | `ParticleEffect` | none | Optional server-controlled particles. |
| `client_render` | Object | white, 64, 0.35 | Client fog colour and fog strength. |
| `client_hud` | Object | both hidden | The current inventory bar and the sensed concentration bar. |
| `priority` | Integer | `0` | Selection priority when several templates overlap within the same level (biome or dimension). |

The `fluctuation` field is `enable`, `cycle_type` (`day`, `moon`, `static`), `amplitude` and `offset_tick`. The `rules` field is `cultivate_suppress`, `tribulation_modify`, `spirit_plant_bonus`, `alchemy_env_bonus` and `natural_spawn_herb`.

A natural environment uses each aura's `amount` as its initial inventory, and noise and fluctuation act on that aura. When `AuraValue.max` is omitted it defaults to the initial value. You can use a plain number, `{ "type": "mxt:fixed", "value": 100 }`, `{ "type": "mxt:initial_multiplier", "multiplier": 2 }` or `{ "type": "mxt:unlimited" }`. Block aura additionally raises the effective capacity of the matching aura without occupying the environment maximum. Environment priority is biome < dimension < permanent area < formation override. `priority` is only compared inside the same level: between overlapping biome templates, or between overlapping dimension templates, the highest `priority` wins; when `priority` is equal the first template in ascending template ID order is taken, so the choice between overlapping definitions is stable and reproducible. Dimension bindings still take precedence over biome bindings, and a higher biome `priority` never crosses the dimension level. Several players share the per-aura inventory of the same chunk: `random` distributes randomly, `equal` splits evenly, and `realm_weighted` distributes by realm weight.

### `AuraValue`

| Field | Type | Description |
|-------|------|-------------|
| `amount` | Double | The aura's initial environment inventory. |
| `max` | Aura maximum | The base environment maximum of the chunk. When omitted it equals the chunk's initial environment aura; a plain number is shorthand for a fixed maximum; `{ "type": "mxt:fixed", "value": 200 }`, `{ "type": "mxt:initial_multiplier", "multiplier": 2 }` and `{ "type": "mxt:unlimited" }` are also accepted. The dispatcher comes from the built-in registry `mxt:aura_maximum_type`, so datapacks can only choose an existing algorithm. |
| `regen_per_tick` | Double | Inventory regeneration per tick. |
| `color` | `RGBColor` | Environment colour of the aura. |

The keys of `aura` are aura IDs from the `mxt:aura` registry. Each aura stores its amount, maximum, regeneration speed and environment colour independently; its element marker is the `aura_type` of that same `mxt:aura` definition, an optional `mxt:element`. See [Number Provider Types](../types/number_provider_types.md) for the `NumberProvider` shape used by fields such as `max`.

### `fluctuation`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enable` | Boolean | `false` | Whether fluctuation is enabled. |
| `cycle_type` | Enum | `static` | `day`, `moon` or `static`. |
| `amplitude` | Double | `0` | Fluctuation amplitude. |
| `offset_tick` | Long | `0` | Cycle sampling offset. |

Fluctuation only affects the queried environment concentration; the chunk inventory is topped up by `regen_per_tick × elapsed ticks`, on the period set by **Server Config → Aura → Block Aura Period** (10 ticks by default).

### `rules`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cultivate_suppress` | Boolean | `false` | Whether cultivation is forbidden or aborted. |
| `tribulation_modify` | Double | `0` | Tribulation difficulty modifier; a positive value makes it harder. |
| `spirit_plant_bonus` | Double | `0` | Reserved for a spirit herb growth multiplier. It has no consumer: the mod has no spirit herb planting or growth system at all, so growth, harvesting and generation are left to content mods. |
| `alchemy_env_bonus` | Boolean | `false` | Whether the zone itself satisfies an alchemy recipe's `minimum_aura` requirement at that position. It is a plain flag, so it stands in for the requirement rather than scaling an aura pool. |
| `natural_spawn_herb` | Boolean | `false` | Reserved for natural spirit herb spawning. It has no consumer, for the same reason as `spirit_plant_bonus`. |

`rules.cultivate_suppress` aborts cultivation that is already running. `tribulation_modify` injects the formula variable `aura_tribulation_modifier`. `alchemy_env_bonus` is read when an alchemy batch starts: a zone that sets it satisfies the recipe's `minimum_aura` requirement at every position inside the zone.

::: warning Work in Progress

`spirit_plant_bonus` and `natural_spawn_herb` still have no consumer: the mod has no spirit herb planting or growth system at all, and its own code states that growth, harvesting and generation are left to content mods. `alchemy_env_bonus`, by contrast, is settled and is described above.

:::

### `noise`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enable` | Boolean | `false` | Whether two-dimensional noise is enabled. |
| `seed` | Long | `0` | A reproducible seed controlled by the data pack. |
| `scale` | Double | `640` | Sampling scale; the larger it is, the smoother the result. |
| `amplitude` | Double | `0` | Noise amplitude. |

The larger `noise.scale` is, the more gradual the spatial variation; built-in environments use roughly `640` to `960`. For ordinary environments it is recommended to keep `noise.amplitude` at `5`, which corresponds to a noise disturbance of roughly `-5` to `5` before truncation.

When a chunk is loaded for the first time it is initialised as `max(0, (initial aura + Perlin noise) / 10 - 5)`; `noise.seed` is fully controlled by the data pack, which makes the distribution reproducible for modpacks. Negative values are clamped to zero, and the aura contribution of blocks such as spirit stone is still added on top of that.

### `particle`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `particle` | `ParticleOptions` | **required** | A vanilla particle type and its parameters. |
| `count` | Integer | `16` | Number sent per emission; `0` keeps the vanilla directed-particle semantics. |
| `speed` | Float | `0` | Vanilla particle speed parameter. |
| `force` | Boolean | `false` | Whether the particle is forced to be sent to clients. |
| `spread` | Vec3 | `[0.5,0.5,0.5]` | Spread range on the three axes. |
| `offset_x/y/z` | Float | `0,0.5,0` | Spawn position offset. |

`particle` is an optional particle effect at the top level of an aura zone, and the particle type is parsed with the vanilla `ParticleTypes.CODEC`. `count`, `speed`, `spread`, `offset_*` and `force` are passed through unchanged to the vanilla particle send API; particles are only not sent when the field is omitted, and `count: 0` keeps the vanilla special directed-particle semantics. Aura particles are still refreshed every 5 ticks.

### `client_render`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fog_color` | `RGBColor` | `#FFFFFF` | Fog colour; accepts `#RRGGBB` or an integer in `0..16777215`. |
| `render_distance` | Integer | `64` | Distance affected by the fog, range `8..256`. |
| `fog_strength` | Float | `0.35` | Proportion by which the vanilla fog is overridden, range `0..1`. |

`client_render` is only responsible for client fog; particles are no longer placed inside it. `fog_strength` controls the proportion by which the fog colour and fog distance override the vanilla values, where `0` means no override and `1` means a full override. The fog strength is also scaled by the environment concentration, so low-concentration areas look fainter.

### `client_hud`

`stored_aura` and `sensed_concentration` may both be omitted; each entry has the following fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maximum` | Double | **required** | The aura value that corresponds to a full bar; it must be greater than `0`. |
| `bar_index` | Integer | `0` | Origins-style texture row. |
| `inverted` | Boolean | `false` | Whether the bar is displayed inverted. |
| `anchor` | `left` / `right` | `left` | HUD left or right column. |
| `order` | Integer | `0` | Ordering within the same side. |

`client_hud` may be omitted entirely. `stored_aura` shows the final aura inventory in the chunk attachment, while `sensed_concentration` shows the environment template concentration at the current position; either one may also be omitted on its own. The resource bar context additionally provides `mxt:environment_concentration` and `mxt:actual_concentration`, corresponding to the environment value and the actual value from all sources.

Both HUD bars use the Origins-style 71x8 texture. `maximum` is the concentration that corresponds to a full bar and must be greater than zero; `bar_index` selects the texture row and icon, and `inverted` is optional and defaults to `false`. `anchor` is `left` or `right`, and `order` controls the bottom-to-top order of aura bars on the same side; aura bars are automatically placed above the resource bars on the same side.

The server synchronises the actual and environment concentration at the current position according to **Server Config → Aura → Sync Period**, by default once every 5 ticks, and the client only uses the synchronised snapshot to draw the HUD and the fog. In the network sync, `actual` contains every source — environment, chunk inventory, blocks and formations — while `environment` only contains the environment template; `stored_aura` still shows the actual inventory, and `sensed_concentration` and the fog only show the value computed from the environment template. Environment fluctuation does not directly rewrite the displayed inventory, but block contributions, cultivation consumption and inventory regeneration still change the actual concentration.

## Example

```json
{
  "aura": {
    "mxt:common": {
      "amount": 120.0,
      "max": { "type": "mxt:initial_multiplier", "multiplier": 2.0 },
      "regen_per_tick": 0.05,
      "color": "#88ffdd"
    }
  },
  "distribution": "realm_weighted",
  "cultivate_condition": {
    "type": "mxt:aura_range",
    "aura": { "mxt:common": { "min": 20, "max": 200 } }
  },
  "dimensions": ["minecraft:the_nether"],
  "biomes": ["minecraft:badlands"],
  "fluctuation": {
    "enable": true,
    "cycle_type": "day",
    "amplitude": 0.3,
    "offset_tick": 0
  },
  "rules": {
    "cultivate_suppress": false,
    "tribulation_modify": 0.15,
    "spirit_plant_bonus": 0.2,
    "alchemy_env_bonus": true,
    "natural_spawn_herb": true
  },
  "element_fit_bonus": 0.25,
  "element_conflict_penalty": 0.2,
  "noise": {
    "enable": true,
    "seed": 739430,
    "scale": 640.0,
    "amplitude": 5.0
  },
  "particle": {
    "particle": { "type": "minecraft:glow" },
    "count": 4,
    "speed": 0.01,
    "force": false,
    "spread": [0.5, 0.5, 0.5],
    "offset_x": 0.0,
    "offset_y": 0.5,
    "offset_z": 0.0
  },
  "client_render": {
    "fog_color": "#88ffdd",
    "render_distance": 64,
    "fog_strength": 0.35
  },
  "client_hud": {
    "stored_aura": {
      "maximum": 200.0,
      "bar_index": 1,
      "anchor": "left",
      "order": 4
    },
    "sensed_concentration": {
      "maximum": 200.0,
      "bar_index": 2,
      "anchor": "left",
      "order": 5
    }
  }
}
```

## Environment Resolution

The environment resolution priority is fixed: biome binding < dimension binding < permanent manual area < active formation. Each later level replaces the aura types, element values, rules and display template of the previous one. The consumable aura of an ordinary chunk is still stored in the chunk attachment, so every system at the same position shares the same aura inventory.

- `dimensions` and `biomes` may both be filled in; dimension matching takes precedence over biome matching. An empty list only means the template does not take part in static binding — it can still be referenced by a manual area or a formation.
- There is **no environment kind field**. Which aura a place has is exactly the key set of its `aura` map; asking for "a place where cultivation or alchemy is possible" is written as a `condition` (the `start_condition`/`condition` of a [`cultivate_action`](./cultivate_action.md)) or as `minimum_aura` (alchemy), both of which speak in aura IDs.
- `cultivate_condition` is the entity condition under which this environment allows cultivation, defaulting to `mxt:always_true`. For example, `mxt:aura_range` can require the current final concentration to be within `min..max`; once the environment condition passes, each `realm_stage.cultivate_condition` is judged independently along its aura chain, and a chain that is not satisfied only skips its own regeneration and conversion.
- Players whose cultivation is due inside the same chunk share the aura inventory in the chunk attachment. `distribution` controls how it is allocated when the inventory is insufficient: `random` shuffles and satisfies requests in that order; `equal` (the default) splits it with max-min fairness and redistributes unused shares; `realm_weighted` distributes by the current realm's `aura_share_weight` and redistributes unused shares. When overlapping dynamic aura zones exist inside a shared chunk, the policy of the environment of the first requester after a stable sort is used.
- The cultivation progress and `aura_gains` obtained are multiplied by the concentration multiplier at the current position. A finite maximum uses `concentration / maximum`, while an unlimited environment uses `concentration / (concentration + 1)`; when the allocated aura is less than the requested amount, the gain is additionally reduced in proportion to the actual quota.
- `block_aura` does not occupy the environment base maximum: it adds an equal amount of storable aura capacity to the current chunk at the same time. With an environment maximum of 100 and a total block contribution of 30, the effective maximum of that chunk is 130. A recommended natural aura template keeps the environment `amount` low and enables positive and negative noise; after the `/ 10 - 5` handling large areas have no natural aura, and `block_aura` accumulates on top of that by the number of blocks in the chunk, so a spirit stone vein can be configured far above the natural value.
- The block aura cache and the chunk inventory update period are controlled by **Server Config → Aura → Block Aura Period**, which defaults to an update every 10 ticks and allows a range of 1 to 1200 ticks.

## Formation Interaction

A formation definition can carry an `mxt:buff` action module holding an `aura_zone`:

```json
{
  "structure_template": "example:gathering_array",
  "radius": 8,
  "actions": [
    {
      "type": "mxt:buff",
      "max_bonus": { "mxt:common": 50 },
      "aura_zone": "example:spirit_gathering"
    }
  ]
}
```

An active formation covers the environment within range around its core and `radius`. `max_bonus` is optional, defaults to `0`, and appends a value to the effective maximum of the chunks in range; overlapping formations take the highest bonus. After a formation fails, its maintenance fails or its structure is broken, the coverage disappears automatically.

## Manual Areas and KubeJS

```js
const aura = MxtAura.get(player.level, player.blockPos)
console.log(aura.concentration())

const area = MxtAura.addBox(
  player.level, 'example:blessing_land',
  0, 64, 0, 64, 128, 64, 10
)
MxtAura.remove(player.level, area)
```

Manual areas are saved to the world. `addBox` only accepts a server level and a `zone` that is a loaded `aura_zone` datapack ID, and returns the generated area ID that `remove` takes. The larger `priority` is, the higher the precedence when manual areas of the same kind overlap.

The KubeJS event name is `MxtEvents.auraZone`; the event's `kind` is `enter`, `leave`, `tick` or `override`; `override` can be cancelled to refuse a formation environment override.

## Other System Fields

Alchemy recipes can use:

```json
{
  "minimum_aura": { "mxt:common": 50 }
}
```

Creature profiles can use:

```json
{
  "preferred_aura_elements": ["example:fire"],
  "minimum_aura": { "mxt:common": 30 }
}
```

On the server, `/mxt aura query` queries the final environment under your feet; when standing on spirit stone ore, `/mxt aura vein` queries the size and tier of the connected vein.

