---
title: Realm Instance (realm_instance)
description: "Define a secret realm as a template that opens instance dimensions on demand: generation, border, structures, landing points, claiming and the entry and exit rules."
---

# Realm Instance (realm_instance)

A realm definition is a **template**, not one fixed dimension: every entry opens an **instance dimension** from it, and that dimension key is what an instance is. The key is always `<definition namespace>:realm/<definition path>/<index>`, counting from `0` — **the index is there even when a definition can only ever open one instance** (`example:realm/trial_realm/0`). Each instance therefore keeps its terrain under `dimensions/<namespace>/realm/<path>/<index>/`, and an aura zone can hit it by that id directly (see [Aura integration](#aura-integration)).

## File Location

Realm instance files go in `data/<namespace>/mxt/realm_instance/` within your datapack.

**Purpose**: Realm templates: instance dimension generation, borders, structures, landing points, claiming and the entry and exit rules.

The filename corresponds to its ID. For example, `data/example/mxt/realm_instance/trial_realm.json` has the ID `example:trial_realm`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `generation` | generation parameters | **required** | How the instance dimension is produced, see below. |
| `seed` | Long | `0` | `0` means every instance rolls its own seed; a non-zero value is shared by all instances. |
| `border` | object | none | The realm border: `center` (`[x, z]`, default `[0, 0]`), `size` (diameter, default the vanilla `29999984`), `warning_blocks` (default `5`), `warning_time` (default `15`, seconds), `damage_per_block` (default `0.2`) and `safe_zone` (default `5`). **Omitting the border does not mean "anything goes"**: a freshly created instance dimension is explicitly set to the vanilla default border instead of inheriting a shrunken overworld border; `mxt:existing` is the exception, and it only touches that real dimension's border when a `border` is written. |
| `max_instances` | Integer `1..256` | `1` | The cap on **all instances of this definition together**, independent of `owned`; once it is reached, entering fails (`NO_FREE_INSTANCE`). |
| `max_members` | Integer `1..100000` | none (unlimited) | The simultaneous member cap of **one instance**. |
| `owned` | Boolean | `false` | Whether the instance can be claimed, see below. |
| `duration_ticks` | Long | `0` | The instance time limit; `0` never expires. When it runs out everybody is sent home and the round ends. |
| `structures` | array | `[]` | Structures placed after the instance is built and before anybody enters, see below. |
| `entry` | object or array | none (random landing) | Where travellers arrive. A single object is the only landing point; an array picks one by `weight`, see below. |
| `enter_condition` | `EntityCondition` | `mxt:always_true` | Evaluated against the entering player; when it fails the entry is refused (`CONDITION_NOT_MET`). |
| `exit_condition` | `EntityCondition` | `mxt:always_true` | **Only constrains a voluntary exit** (the token's right-click, `/mxt realm_instance exit`); an expiry and an administrator's return ignore it, otherwise a datapack could lock a player inside a realm forever. |
| `enter_denied_message` | `Component` | none | The message sent to a player whose entry condition failed; without it the failure code is shown. A bare string is treated as a translation key. |
| `exit_denied_message` | `Component` | none | The same, for the exit condition. |
| `enter_action` | `EntityAction` | `mxt:no_op` | The entry behaviour, run on the entering player after the teleport has landed. |
| `exit_action` | `EntityAction` | `mxt:no_op` | The exit behaviour, run on the leaving player before the teleport back to the origin. |

### `generation` (required)

| `type` | Parameters | Meaning |
|--------|------------|---------|
| `mxt:stem` | `stem` (a `LevelStem` id) | Takes one registered dimension generator as the template and opens an instance under a new dimension key. |
| `mxt:flat` | `preset` (a vanilla superflat layer string), `dimension_type` (default `minecraft:overworld`), `structures` (default `true`) | A superflat world, for example `"1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"`. |
| `mxt:void` | `biome` (default `minecraft:the_void`), `dimension_type`, `structures` (default `false`) | An empty world: no layers, one biome and no structures by default, which suits a realm furnished entirely from `structures`. |
| `mxt:template` | `template` (`[A-Za-z0-9_-]+`), `stem` | Copies `region`, `entities` and `poi` from `<server directory>/mxt_realm/<template>/` before loading, which is the route for a hand-built map. |
| `mxt:existing` | `dimension` (a dimension id) | Creates no dimension at all and uses one that already exists (including a datapack `dimension/` entry). `max_instances` is meaningless for it, and the realm never unloads or deletes that dimension. |

The registry entries a `generation` names (`stem`, `dimension_type`, `biome`) are resolved **when an instance is created**, because datapack registries load in parallel and a holder read while decoding may not be bound yet. A failed resolution fails the creation (`GENERATION_FAILED`) and logs one line; no half-built instance is left behind.

### `structures` (optional)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `nbt` | Identifier | **required** | The structure template id, read from `data/<namespace>/structure/<path>.nbt` — the vanilla structure block files, which both resource packs and datapacks can override. |
| `pos` | `[x, y, z]` | **required** | The position inside the instance dimension (relative to the entry point when `relative_to_entry` is true). When a `border` is written, an absolute position must lie inside it or the definition fails to load. |
| `rotation` | Enum | `none` | `none`, `clockwise_90`, `clockwise_180` or `counterclockwise_90`, around the structure origin. |
| `mirror` | Enum | `none` | `none`, `left_right` or `front_back`. |
| `integrity` | Double `0..1` | `1.0` | How complete the structure is; the lower it is, the more it looks like ruins. |
| `chance` | Double `0..1` | `1.0` | Rolled independently **per instance** to decide whether this structure is placed at all this time. |
| `relative_to_entry` | Boolean | `false` | Takes the coordinates from the entry landing, for "the entrance is inside the building" layouts. |
| `ignore_entities` | Boolean | `false` | Skips the entities the structure carries. |
| `keep_liquids` | Boolean | `true` | Keeps the structure's own fluid settings. |

### `entry` (optional)

A single object or an array of objects; an array picks one by `weight` (default `1`), and an entry whose weight is `0` is never picked.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pos` | `[x, y, z]` | none | A fixed landing point, used exactly as written. An entry without `pos` lands randomly instead, dropped onto the surface of that column. |
| `yaw` / `pitch` | Float | the entering player's own angles | A fixed facing. |
| `random_center` | `[x, z]` | the border centre | The centre of the random landing when `pos` is absent. |
| `random_radius` | Double | 80% of the border diameter (`64` without a border) | The radius of the random landing. |
| `spread` | Double | `3.0` | How far apart one group of arrivals is spread, in blocks; `0` puts them all on one spot. The first arrival always lands on the anchor itself. |

The landing point that was picked becomes this instance's **anchor** and is stored in the instance record, so later visitors arrive near the same place instead of scattering to the far end of the realm.

### `owned` (optional, default `false`)

`owned: true` means this instance **can be claimed**. The first player inside becomes its owner, and that ownership is recorded on the instance and exposed to datapacks:

- The entity condition [mxt:in_realm_instance](../types/condition/entity_condition_types.md) asks "am I inside an instance", with `role` set to `any` (inside), `owner` (I am the owner) or `guest` (inside but not the owner); an optional `definition` field narrows the question to one definition or tag.
- The formula variables `realm_instance_is_owner` (`1` or `0`), `realm_instance_members`, `realm_instance_limit`, `realm_instance_elapsed`, `realm_instance_duration` and `realm_instance_index` can be read from the entry and exit conditions and behaviours. Outside any instance these names count as "cannot be provided" (a development environment logs it). The `realm_instance_` prefix exists because `realm` already means a cultivation stage; see [Formula Variables](../types/formula_variables.md).

The claim matters most **after everybody is gone**:

| Case | After the last member leaves |
|------|------------------------------|
| `owned: true` | The dimension is **unloaded but not deleted**: the terrain, block changes and placed structures stay, the owner can carry on from where they left off next time (the clock starts over) and the record survives a restart. |
| `owned: false` | The instance is **destroyed** with the last departure: the dimension is unloaded and its **whole instance folder is deleted** — chunk data together with the level and attachment data under `data/` — so the next entry is a brand new one. |
| `mxt:existing` | Whatever `owned` says, that dimension is neither unloaded nor deleted; only the member list is cleared. |

`max_instances` counts every instance together (the owner is not exempt): a realm with `max_instances: 2` holds at most two at once, and a third visitor joins an existing one that is not full, or fails.

## Aura integration {#aura-integration}

An instance dimension is a runtime dimension with no `LevelStem` entry of its own, so in [aura_zone](./aura_zone.md) `dimensions` may name the instance dimension id (`<namespace>:realm/<path>/<index>`) directly, the `stem` the instance was generated from (such as `minecraft:the_end`), or the definition id — the last two match **every instance** of it. A rule such as "End-style realms are all dead aura" therefore needs one zone only.

## Example

```json
// data/example/mxt/realm_instance/trial_realm.json
{
  "generation": { "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" },
  "seed": 0,
  "border": { "center": [0.0, 0.0], "size": 256.0, "warning_blocks": 5, "damage_per_block": 0.2 },
  "max_instances": 2,
  "max_members": 4,
  "owned": true,
  "duration_ticks": 12000,
  "structures": [
    { "nbt": "example:trial/arena", "pos": [0, 64, 0] },
    { "nbt": "example:trial/pillar", "pos": [32, 64, 0], "rotation": "clockwise_90", "chance": 0.5 }
  ],
  "entry": [
    { "pos": [0.5, 65.0, 0.5], "yaw": 90.0, "weight": 3 },
    { "random_center": [64.0, 64.0], "random_radius": 24.0, "weight": 1 }
  ],
  "enter_condition": { "type": "mxt:has_realm", "aura": "example:qi" },
  "enter_denied_message": "realm.example.too_weak",
  "enter_action": { "type": "mxt:apply_effect", "effect": "minecraft:night_vision", "duration_ticks": 12000 },
  "exit_action": { "type": "mxt:heal", "amount": 4 }
}
```

**Destroy a realm's instances before deleting its definition.** Instance records persist the definition as a registry holder, so removing a definition that still has instances makes those records unreadable at the next start, and their terrain is then treated as leftover data. Run `/mxt realm_instance destroy <dimension>` first.

A failure code appears in the `item.mxt.realm_token.enter_failed` message unless the definition supplies a `*_denied_message` of its own: `DISABLED` (the definition is in the `mxt:disabled` tag), `ALREADY_TRAVELLING`, `CONDITION_NOT_MET`, `NO_FREE_INSTANCE`, `MISSING_STRUCTURE`, `GENERATION_FAILED`, `MISSING_DIMENSION` (only `mxt:existing` can miss its dimension), `FULL`, `CANCELLED` (the `EnterPre` event was cancelled), `EXIT_DENIED`, `NOT_TRAVELLING` and `MISSING_ORIGIN`.
