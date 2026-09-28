---
title: Aura Zone (aura_zone)
description: "Define an environment aura template: per-aura inventory, matching dimensions and biomes, fluctuation, rules, particles, client fog and HUD bars."
aside: false
---

# Aura Zone (aura_zone) {#aura_zone}

An `aura_zone` is an environment aura template: how much of each aura is here to begin with, its maximum, regeneration and colour, which dimensions and biomes it matches, how it fluctuates over time, which cultivation rules it applies, and the fog, particles and HUD bars the client sees. The template stores no quantities itself — consumable aura lives on the chunk attachment, so every system at the same position reads the same inventory.

## File Location

Aura zone files go in `data/<namespace>/mxt/aura_zone/` within your data pack.

**Purpose**: Environment aura templates.

The filename corresponds to its ID. For example, `data/example/mxt/aura_zone/spirit_land.json` has the ID `example:spirit_land`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Map of aura ID to value | `{}` | Which auras this template holds, and each one's initial amount, maximum, regeneration and colour. |
| `distribution` | Enum | `equal` | How aura is shared when it is insufficient for several players in one chunk: `random`, `equal`, `realm_weighted`. |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | The condition under which this environment allows cultivation; checked together with the current realm stage condition. |
| `dimensions` | array of dimension IDs or `#tags` | `[]` | Dimension matching. |
| `biomes` | array of biome IDs or `#tags` | `[]` | Biome matching. |
| `fluctuation` | Object | `static` / `0` | Day-night or moon phase fluctuation. |
| `rules` | Object | all off | Cultivation suppression, tribulation, spirit herb and alchemy environment rules. |
| `element_fit_bonus` | Double | `0` | Spirit root element fit bonus: added by this much when this root's own aura is present here. |
| `element_conflict_penalty` | Double | `0` | Element conflict penalty: multiplied by the opposition concentration. |
| `noise` | Object | off | Two-dimensional noise distribution with a seed. |
| `particle` | `ParticleEffect` | none | Optional server-controlled particles. |
| `client_render` | Object | white, `64`, `0.35` | Client fog colour and fog strength. |
| `client_hud` | Object | both hidden | The current inventory bar and the sensed concentration bar. |
| `priority` | Integer | `0` | Selection priority when several templates overlap within the same level (biome or dimension). |

**Opposition concentration** is the sum of the concentrations of every **other** element in the zone that has an `overcomes` / `adapted_to` relation with the spirit root element, so an empty zone is never treated as an opposing one.

## Each `aura` Entry

Every value of `aura` has the same shape, and [block_aura](./block_aura.md) uses it too:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Double | `0` | Initial inventory of this aura; must be non-negative. On the block side it is the base amount each block contributes. |
| `max` | Maximum | `initial_multiplier`, multiplier `1` | The aura's maximum; the four forms are below. |
| `regen_per_tick` | Double | `0` | How much is restored per tick. |
| `color` | `RGBColor` | `#FFFFFF` | Colour, used for environment rendering only. |

A natural environment takes each aura's `amount` as its initial inventory, and noise and fluctuation act on that; when `max` is omitted it equals the initial value. `max` has four forms: a fixed number, `{ "type": "mxt:fixed", "value": 100 }`, `{ "type": "mxt:initial_multiplier", "multiplier": 2 }` or `{ "type": "mxt:unlimited" }`. A bare number is shorthand for `mxt:fixed`; `mxt:initial_multiplier` multiplies the initial inventory by `multiplier`, so omitting `max` means the maximum follows the initial inventory; `mxt:unlimited` means there is no maximum, and the cultivation speed side switches from `concentration / maximum` to `concentration / (concentration + 1)`. That dispatcher comes from the built-in registry `mxt:aura_maximum_type`, so a data pack can only choose an algorithm that already exists.

What you write here is the **environment base** maximum. Block aura raises the effective capacity of the matching aura on top of it without consuming this maximum, and a formation can add more. `element_fit_bonus` and `element_conflict_penalty` must be finite numbers, and both `maximum` values under `client_hud` must be finite and greater than `0`; anything else is a load error.

## `fluctuation`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enable` | Boolean | `false` | Whether fluctuation is enabled. |
| `cycle_type` | Enum | `static` | `day`, `moon` or `static`. |
| `amplitude` | Double | `0` | Fluctuation amplitude. |
| `offset_tick` | Long | `0` | Cycle sampling offset. |

Fluctuation only affects the queried environment concentration and never rewrites the chunk inventory; the inventory is restored by `regen_per_tick × elapsed ticks`, on the period set by **Server Config → Aura → Block Aura Period** (every 10 ticks by default).

## `rules`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `cultivate_suppress` | Boolean | `false` | Whether cultivation is forbidden or aborted. |
| `tribulation_modify` | Double | `0` | Tribulation difficulty modifier; a positive value makes it harder. |
| `spirit_plant_bonus` | Double | `0` | Spirit herb growth bonus. Must be finite and at least `-1`. |
| `alchemy_env_bonus` | Boolean | `false` | Stands in for a pill recipe's environment gate `minimum_aura`. It does not pay a furnace's fuel. |

`rules.cultivate_suppress` aborts cultivation that is already running. `tribulation_modify` injects the formula variable `aura_tribulation_modifier`.

`spirit_plant_bonus` multiplies the growth a spirit herb plot settles once every `20` ticks: `growth.growth_rate` from [spirit_herb](./spirit_herb.md) is evaluated first, then multiplied once by `max(0, 1 + spirit_plant_bonus)`, so do not multiply it again inside the expression. The value must be finite and at least `-1`; anything outside that is a load error.

With `alchemy_env_bonus` on, a pill recipe whose position falls inside the zone **counts as satisfying** `minimum_aura` outright — it is a switch with no scalable quantity, so it can only stand in for the requirement rather than enlarge the pool, and it supplies no heat to the furnace; with it off, every entry is still compared against the recipe's own minimum.

## `noise`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enable` | Boolean | `false` | Whether two-dimensional noise is enabled. |
| `seed` | Long | `0` | A reproducible seed controlled by the data pack. |
| `scale` | Double | `640` | Sampling scale; the larger it is, the smoother the result. |
| `amplitude` | Double | `0` | Noise amplitude. |

When a chunk is loaded for the first time it is initialised as `max(0, (that aura's amount + Perlin noise) / 10 - 5)`, with negative values clamped to zero; `noise.seed` is fully controlled by the data pack, which lets modpacks reproduce a distribution. The larger `noise.scale`, the smoother the spatial variation; built-in environments use roughly `640` to `960`. For an ordinary environment keep `noise.amplitude` at `5`, which corresponds to a noise disturbance of roughly `-5` to `5` before truncation.

## `client_render`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `fog_color` | `RGBColor` | `#FFFFFF` | Fog colour; accepts `#RRGGBB` or an integer in `0..16777215`. |
| `render_distance` | Integer | `64` | Distance the fog affects, range `8..256`. |
| `fog_strength` | Float | `0.35` | Proportion by which the vanilla fog is overridden, range `0..1`. |

`client_render` covers client fog only; particles are not part of it. `fog_strength` controls the proportion by which the fog colour and the fog distance override the vanilla values, where `0` is no override and `1` is a full override. Fog strength is also scaled by the environment concentration, so low-concentration areas look fainter.

## `particle`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `particle` | `ParticleOptions` | **required** | A vanilla particle type and its parameters. |
| `count` | Integer | `16` | Number sent per emission; `0` keeps the vanilla directed-particle semantics. |
| `speed` | Float | `0` | Vanilla particle speed parameter. |
| `force` | Boolean | `false` | Whether the particle is forced to clients. |
| `spread` | Vec3 | `[0.5,0.5,0.5]` | Spread range on the three axes. |
| `offset_x` / `offset_y` / `offset_z` | Float | `0,0.5,0` | Spawn position offset. |

`particle` is the optional particle effect at the top level of an aura zone, parsed as a vanilla particle type; the particle type is written as an object:

```json
"particle": { "type": "minecraft:glow" }
```

Particles are only not sent when the field is omitted. `count`, `speed`, `spread`, `offset_*` and `force` are passed through unchanged to the vanilla particle send API; `count: 0` keeps the vanilla special directed-particle semantics. Aura particles refresh on the sync period, every `5` ticks by default.

## `aura_zone.client_hud`

`stored_aura` and `sensed_concentration` may both be omitted, and either one may be written on its own; each entry has these fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `maximum` | Double | **required** | The aura value that fills the bar; must be greater than `0`. |
| `bar_index` | Integer | `0` | Origins-style texture row. |
| `inverted` | Boolean | `false` | Whether the bar is displayed inverted. |
| `anchor` | `left` / `right` | `left` | HUD left or right column. |
| `order` | Integer | `0` | Ordering within the same side. |

`stored_aura` shows the actual inventory in the chunk attachment, and `sensed_concentration` shows the environment template concentration at the current position. Both use the Origins-style 71x8 texture: `maximum` is the concentration that fills the bar and must be greater than zero; `bar_index` selects the texture row and the icon; `inverted` is optional and defaults to `false`. `anchor` is `left` or `right`, and `order` controls the bottom-to-top order of aura bars on the same side; aura bars are automatically placed above the resource bars on the same side. The resource bar context additionally provides `mxt:environment_concentration` and `mxt:actual_concentration`, for the environment value and the actual value from all sources.

## How the Environment Is Resolved

Environment resolution priority is fixed: **biome binding < dimension binding < permanent manual area < active formation**. Each later level replaces the aura types, element values, rules and display template of the one before it wholesale. The consumable aura of an ordinary chunk is still stored in the chunk attachment, so every system at the same position shares one aura inventory.

- `dimensions` and `biomes` may both be filled in; dimension matching takes precedence over biome matching. An empty list only means the template takes no part in static binding — a manual area or a formation can still reference it.
- `priority` is only compared inside the same level. When several biome templates match at once, or several dimension templates match at once, the largest `priority` wins; ties take the first template in ascending template ID order, so the choice between overlapping definitions is stable and reproducible after every load. Dimension bindings always outrank biome bindings, and a higher biome `priority` never crosses into the dimension level.
- `cultivate_condition` is the entity condition under which this environment allows cultivation, defaulting to `mxt:always`. `mxt:aura_range`, for example, can require the current final concentration to lie within `min..max`; once the environment condition passes, each `realm_stage.cultivate_condition` is judged independently along its resource chain, and a chain that fails only skips its own regeneration and conversion.
- Players whose cultivation is due inside the same chunk share the aura inventory in the chunk attachment. `distribution` controls how it is handed out when the inventory is short: `random` shuffles and then satisfies requests in that order; `equal` (the default) splits it with max-min fairness and redistributes unused shares; `realm_weighted` weights by the current realm's `aura_share_weight` and redistributes unused shares. When overlapping dynamic aura zones exist inside a shared chunk, the policy of the environment of the first requester after a stable sort is used.
- The cultivation progress and `aura_gains` obtained are multiplied by the concentration multiplier at the current position. A finite maximum uses `concentration / maximum`, an unlimited environment uses `concentration / (concentration + 1)`; when the allocated aura falls short of the requested amount, the gain is reduced further in proportion to the actual quota.
- There is no environment kind field here: which auras a place has is exactly the key set of its `aura` map. Asking for a place where cultivation or alchemy is possible is written as a condition (the `start_condition` / `cultivate_condition` / `tick_condition` of a `cultivation`) or as `minimum_aura` (alchemy), and both speak in aura IDs or `#tags`.
- `block_aura` does not consume the environment base maximum: it adds an equal amount of storable aura capacity to the current chunk at the same time. With an environment maximum of 100 and a total block contribution of 30, the effective maximum of that chunk is 130. A position query uses a bounded sub-chunk algorithm: within 3 sub-chunks of the current one, blocks are computed at their real positions, further out they are approximated by the sub-chunk centre and attenuated by `1 / max(1, distance squared)`; a source sub-chunk is roughly split by the number of players currently visiting it, and the chunk inventory is still shared between players.
- The block aura cache and the chunk inventory update period are controlled by **Server Config → Aura → Block Aura Period**, which defaults to an update every 10 ticks and allows a range of 1 to 1200 ticks.
- A recommended natural aura template sets every aura's `amount` to `0` and enables positive and negative noise. After the `/ 10 - 5` handling, large areas have no natural aura; block contributions accumulate on top of that by the number of blocks in the chunk, so a spirit stone vein can be configured far above the natural value.
- The keys of `aura` are aura IDs from the `mxt:aura` registry. Each aura stores its amount, maximum, regeneration speed and environment colour independently; its element marker is the `aura_type` of that same `mxt:aura` definition (an optional `mxt:element`).

## Example

```json
{
  "aura": {
    "example:spirit_power": {
      "amount": 120.0,
      "max": { "type": "mxt:initial_multiplier", "multiplier": 2.0 },
      "regen_per_tick": 0.05,
      "color": "#88ffdd"
    }
  },
  "distribution": "realm_weighted",
  "cultivate_condition": {
    "type": "mxt:aura_range",
    "aura": { "example:spirit_power": { "min": 20, "max": 200 } }
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
    "alchemy_env_bonus": true
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

## What the Client Sees

The server syncs the actual and environment concentration at the current position to players on **Server Config → Aura → Sync Period**, once every 5 ticks by default. In the sync, `actual` contains every source — environment, chunk inventory, blocks and formations — while `environment` contains only the environment template; `stored_aura` still shows the actual inventory, and `sensed_concentration` and the fog only show the value computed from the environment template. Environment fluctuation does not rewrite the displayed inventory directly, but block contributions, cultivation consumption and inventory regeneration still change the actual concentration. The client only draws; it decides neither the deductions nor the gains.

## Formation Interaction

A formation definition can carry an `mxt:buff` function module and add an `aura_zone` to it:

```json
{
  "structure_template": "example:gathering_array",
  "radius": 8,
  "actions": [
    {
      "type": "mxt:buff",
      "max_bonus": { "example:spirit_power": 50 },
      "aura_zone": "example:spirit_gathering"
    }
  ]
}
```

An active formation covers the environment within the range covered by its core and `radius`. `max_bonus` is optional, defaults to `0`, and appends a value to the effective maximum of the chunks in range; overlapping formations take the highest bonus. Once the formation lapses, its maintenance fails or its structure is broken, the coverage disappears on its own.

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

Manual areas are saved to the world. The larger `priority` is, the higher the precedence when manual areas of the same kind overlap. The KubeJS event name is `MxtEvents.auraZone`, and the event's `kind` is `enter`, `leave`, `tick` or `override`; `override` can be cancelled to refuse a formation environment override.

## Other System Fields

Alchemy recipes can use:

```json
{
  "minimum_aura": { "example:spirit_power": 50 }
}
```

Creature profiles can use:

```json
{
  "preferred_aura_elements": ["example:fire"],
  "minimum_aura": { "example:spirit_power": 30 }
}
```

On the server, these commands query the aura under your feet:

| Command | What it does |
| --- | --- |
| `/mxt aura query` | Lists every aura at this position with its amount. |
| `/mxt aura query <aura id>` | Shows only the named aura. |
| `/mxt aura query element <element id>` | Shows only auras whose element marker is that element; several auras can carry the same element marker, so this asks about the element. |
| `/mxt aura vein` | Standing on spirit stone ore, queries the block count and tier of the connected vein. |
| `/mxt aura cache clear [radius]` | Clears the block aura query cache; radius `0..32`, defaulting to `3` when omitted; needs gamemaster permission. |
