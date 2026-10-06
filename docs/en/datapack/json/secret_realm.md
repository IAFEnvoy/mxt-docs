---
title: Secret Realm (secret_realm)
description: "A secret realm definition is a template: every entry opens an instance dimension from it, and the border, structures, landing points, claiming and entry and exit rules all come from it."
aside: false
---

# Secret Realm (secret_realm) {#secret_realm}

File location: `data/<namespace>/mxt/secret_realm/<path>.json`

**Purpose**: Secret realm templates: instance dimension generation, borders, structures, landing points, claiming and the entry and exit rules.

A secret realm definition is **a template**, not one fixed dimension: every entry opens an **instance dimension** from it, and that dimension key is what an instance is. The key is always `<definition namespace>:secret_realm/<definition path>/<index>`, counting from `0` — **the index is there even when a definition can only ever open one instance** (`example:secret_realm/trial_realm/0`). Each instance therefore keeps its terrain under `dimensions/<namespace>/secret_realm/<path>/<index>/`, and an aura zone can hit it by that id directly (see [Aura Integration](#aura-integration) below).

`mxt:existing` creates no dimension; its instance identity is simply the dimension id it names.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `secret_realm.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `secret_realm.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `quality` | Quality id | none | Optional. The tier a token into this realm starts on. |
| `generation` | Generation parameters | **required** | How the instance dimension is produced, see below. |
| `seed` | Long | `0` | `0` means every instance rolls its own seed; any other value is shared by all instances. |
| `border` | Object | none | The realm border: `center` (`[x, z]`, default `[0, 0]`), `size` (diameter, default the vanilla `29999984`), `warning_blocks` (default `5`), `warning_time` (default `15`, seconds), `damage_per_block` (default `0.2`) and `safe_zone` (default `5`). |
| `max_instances` | Integer `1..256` | `1` | The cap on **all instances of this definition together**, independent of `owned`; once it is reached, entering fails (`NO_FREE_INSTANCE`). |
| `max_members` | Integer `1..100000` | none (unlimited) | The simultaneous member cap of **one instance**. |
| `owned` | Boolean | `false` | Whether the instance can be claimed, see below. |
| `duration_ticks` | Long | `0` | The instance time limit; `0` never expires. |
| `structures` | Array | `[]` | Structures placed after the instance is built and before anybody enters, see below. |
| `entry` | Object or array | none (random landing) | Where travellers arrive. A single object is the only landing point; an array picks one by `weight`, see below. |
| `enter_condition` | `EntityCondition` | `mxt:always` | Evaluated against the entering entity; when it fails the entry is refused (`CONDITION_NOT_MET`). |
| `exit_condition` | `EntityCondition` | `mxt:always` | **Only constrains a voluntary exit** (the token's right-click, `/mxt secret_realm exit`). |
| `enter_denied_message` | `Component` | none | The message sent to a player whose entry condition failed; without it the failure code is shown. A bare string is treated as a translation key. |
| `exit_denied_message` | `Component` | none | The same, for the exit condition. |
| `enter_action` | `EntityAction` | `mxt:no_op` | The entry behaviour, run on the entering entity after the teleport has landed. |
| `exit_action` | `EntityAction` | `mxt:no_op` | The exit behaviour, run on the leaving entity before the teleport back to the origin. |

`quality` is optional: every realm shares the one token item `mxt:secret_realm_token`, so the item itself cannot say which tier it is — only the definition the stack carries can: a token into this realm starts on that tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) registry.

`exit_condition` **looks at neither** an expiry nor a forced return, otherwise a datapack could lock a player inside a secret realm forever.

`duration_ticks` at `0` never expires; a positive value starts counting from the moment of entry, and once it runs out everybody inside is sent home and the round ends. The clock resets after everybody has left, and the next arrival starts it over.

**Omitting a border does not mean "anything goes"**: a freshly created instance dimension is explicitly set to the vanilla default border instead of inheriting a shrunken overworld border; `mxt:existing` is the exception, and it only touches that real dimension's border when a `border` is written.

When a `border` is written, those numbers are validated together: `size` must be a positive finite number, `warning_blocks` and `warning_time` must not be negative, and `damage_per_block` and `safe_zone` must be finite and non-negative.

## `generation` (required)

`type` is one of five and decides how the instance dimension is built: use a registered dimension generator as a template, a superflat world, an empty world, a copy of a template directory, or a dimension that already exists. **Each `type`'s fields, defaults and when they resolve are on [Secret Realm Generation Types](/en/datapack/types/other/secret-realm-generation).**

```json
{ "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" }
```

## `structures` (optional)

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `nbt` | Identifier | **required** | The structure template id, read from `data/<namespace>/structure/<path>.nbt` — the vanilla structure block files, which both resource packs and datapacks can override. |
| `pos` | `[x, y, z]` | **required** | The position inside the instance dimension (relative to the entry landing when `relative_to_entry` is true). When a `border` is written, an absolute position must lie inside it or the definition fails to load. |
| `rotation` | Enum | `none` | `none`, `clockwise_90`, `clockwise_180` or `counterclockwise_90`, around the structure origin. |
| `mirror` | Enum | `none` | `none`, `left_right` or `front_back`. |
| `integrity` | Double `0..1` | `1.0` | How complete the structure is; the more blocks are missing, the more it looks like ruins. |
| `chance` | Double `0..1` | `1.0` | Rolled independently **per instance** to decide whether this structure is placed this time. |
| `relative_to_entry` | Boolean | `false` | Takes the coordinates from the entry landing, for "the entrance is inside the building" layouts. |
| `ignore_entities` | Boolean | `false` | Skips the entities the structure carries. |
| `keep_liquids` | Boolean | `true` | Keeps the structure's own fluid settings. |

## `entry` (optional)

A single object or an array of objects; an array picks one by `weight` (default `1`), and an entry whose weight is `0` is never picked.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `pos` | `[x, y, z]` | none | A fixed landing point, used exactly as written when all three numbers are there. An entry without `pos` lands randomly instead, dropped onto the surface of that column. |
| `yaw` / `pitch` | Float | the arriving entity's own angles | A fixed facing. |
| `random_center` | `[x, z]` | the border centre | The centre of the random landing when `pos` is absent. |
| `random_radius` | Double | 40% of the border diameter (`64` without a border) | The radius of the random landing. |
| `spread` | Double | `3.0` | How far apart one group of arrivals is spread, in blocks; `0` puts them all on one spot. The first arrival always lands on the anchor. |

Every `weight` in the array must not be negative, `spread` must be a finite non-negative number, and a written `random_radius` must be greater than `0`. When the weights do not add up to a positive number, one entry is picked at equal odds instead of the whole thing failing.

A random landing is sampled uniformly inside the radius, not "denser the further out you go". Its height comes from the surface of that column (the first block that stops movement); a hard-coded `pos` gets no such snapping. One group of arrivals is spread over six equal points on the circle: the first lands on the anchor, and the spread ones snap again to the surface of their own column.

The landing point that was picked becomes this instance's **anchor** and is stored in the instance record: later travellers (players or mobs) land near the same spot instead of each rolling their own way to the far end of the secret realm.

## `owned` (optional, default `false`)

`owned: true` means this instance **can be claimed**. The first one inside becomes the owner, and that ownership is recorded on the instance and exposed to datapacks:

- The entity condition [mxt:in_secret_realm](/en/datapack/types/condition/entity_condition_types) asks "am I inside an instance", with `role` set to `any` (inside), `owner` (I am the owner) or `guest` (inside but not the owner); an optional `definition` field narrows the question to one definition or tag.
- The formula variables `secret_realm_is_owner` (`1` or `0`), `secret_realm_members`, `secret_realm_limit`, `secret_realm_elapsed`, `secret_realm_duration` and `secret_realm_index`, readable from the entry and exit conditions and behaviours. Outside any instance these names cannot be supplied at all, so they are reported as errors rather than silently reading `0`; `secret_realm_limit` is `-1` when the definition writes no `max_members`. The names carry the `secret_realm_` prefix because `realm` already means a cultivation stage; see [Formula Variables](/en/datapack/types/formula_variables).

The claim matters most **after everybody is gone**:

| Situation | After the last member leaves |
| --- | --- |
| `owned: true` | The dimension is **unloaded but not deleted**: the terrain, block changes and placed structures stay, the owner carries on from where they left off next time (the clock starts over), and the record survives a restart. |
| `owned: false` | The instance is **destroyed** with the last departure: the dimension is unloaded and its **whole instance directory is deleted** — chunk data together with the level and attachment data under `data/` — so the next entry is a brand new one. |
| `mxt:existing` | Whatever `owned` says, that dimension is neither unloaded nor deleted; only the member list is cleared. |

`max_instances` counts every instance together (the owner is not exempt): a secret realm with `max_instances: 2` holds at most two at once, a third arrival joins an existing one that is not full, and otherwise it fails. Someone who is already inside does not count towards filling that instance, so they can go back in.

## Aura Integration {#aura-integration}

An instance dimension is a runtime dimension with no generator registry entry of its own, so in [aura_zone](./aura_zone.md), `dimensions` can name the instance dimension id (`<namespace>:secret_realm/<path>/<index>`) directly, or the `stem` the instance was generated from (such as `minecraft:the_end`), or the definition id — the latter two match **every instance** of it. A rule such as "End-style secret realms are all dead aura" therefore needs one zone only.

## Example

```json
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
  "enter_denied_message": "secret_realm.mxt.example.too_weak",
  "enter_action": { "type": "mxt:apply_effect", "effect": "minecraft:night_vision", "duration_ticks": 12000 },
  "exit_action": { "type": "mxt:heal", "amount": 4 }
}
```

::: warning Clear out instances before deleting a definition

An instance record stores a reference to this definition, so deleting a secret realm definition that **still has instances** makes that record unreadable at the next start, and its terrain is then cleaned up as leftover data. Run `/mxt secret_realm destroy <dimension>` first, then delete the definition.

:::

A failure code shows up in the `item.mxt.secret_realm_token.enter_failed` message unless the definition supplies a `*_denied_message` of its own: `DISABLED` (that id is not in the current registry, including a definition a `neoforge:conditions` block keeps out), `ALREADY_TRAVELLING`, `CONDITION_NOT_MET`, `NO_FREE_INSTANCE`, `MISSING_STRUCTURE`, `GENERATION_FAILED`, `MISSING_DIMENSION` (only `mxt:existing` can miss its dimension), `FULL`, `CANCELLED` (the entry event was cancelled), `EXIT_DENIED`, `NOT_TRAVELLING`, `MISSING_ORIGIN`.
