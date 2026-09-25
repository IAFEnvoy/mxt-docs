---
title: Formation (formation)
description: Define a formation built from a structure template or an inline block list, with its radius, costs, lifecycle actions and the function modules it runs.
aside: false
---

# Formation (formation)

A Formation defines a structure that players can build and activate: it declares the shape it is built from, how far it reaches, what it consumes, the behaviours that run on activation, on every maintenance cycle and on failure, and the function modules that say what the array actually does.

## File Location

Formation JSON files go in `data/<namespace>/mxt/formation/` within your data pack.

**Purpose**: Formation lifecycle and aura overrides.

The filename corresponds to its ID. For example, `data/example/mxt/formation/spirit_gathering_array.json` has the ID `example:spirit_gathering_array`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `formation.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `formation.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `structure_template` | Identifier | see below | The vanilla structure template ID. Its air entries are ignored, so a template says what must be present and never what must be absent. It is one of the two structure fields: with `structure_check: "structure"` **exactly one** of them has to be written. |
| `structure_check` | `structure` / `always` | `structure` | Whether the structure is checked when the array is raised. `always` means **this array can be raised anywhere**, and then neither `structure_template` nor `structure` may be written (writing one is a load error, not something ignored). |
| `structure` | `List<RequiredBlock>` | see below | An inline structure: a list of blocks at offsets from the controller. |
| `radius` | `NumberProvider` | **required** | The formation's area of effect radius. |
| `activation_costs` | `List<Cost>` | `[]` | Paid once on activation out of the **activator's** own account, all or nothing as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `maintenance_costs` | `List<Cost>` | `[]` | Paid every maintenance cycle: the aura the array's own blocks supply is offset first and the owner pays the rest, and the formation fails when it cannot be paid. `mxt:item` and `mxt:js` entries can never be paid here. |
| `storage` | `Storage` | none | What the array may keep of the aura its own ground supplies. The `capacity` field is required and maps each aura to its per-aura ceiling. |
| `actions` | `List<Formation Action>` | `[]` | The function modules of this array. See [Formation modules](#formation-modules) below. |
| `spare_friends` | Boolean | `false` | The friend-or-foe switch: with it, the per-entity work reaches only the entities **no** owner recognises as a friend; without it, it reaches everyone the array covers. |
| `activate_action` | Block Action | `mxt:no_op` | The activation block behaviour. |
| `tick_action` | Block Action | `mxt:no_op` | The formation periodic block behaviour. |
| `deactivate_action` | Block Action | `mxt:no_op` | The block behaviour on removal. |
| `entity_tick_action` | Entity Action | `mxt:no_op` | Executed for every entity within the radius. |
| `entity_enter_action` | Entity Action | `mxt:no_op` | Executed when an entity enters the radius. |
| `entity_exit_action` | Entity Action | `mxt:no_op` | Executed when an entity leaves the radius or the formation is removed. |

### Structure

`structure_check` decides whether a structure is checked at all when the array is raised:

- **`structure` (the default)**: `structure_template` and `structure` take **exactly one** — supplying both, or neither, fails the load.
- **`always`**: the array **can be raised anywhere**, and neither structure field may be written; writing one is a **load error** rather than being ignored. This is how an array that is not built out of a structure (one a script or a command raises, say) says so.

```json
"structure": [
  { "offset": [0, 0, 0], "state": "minecraft:gold_block" },
  { "offset": [0, 0, -8], "state": "mypack:wood_flag" }
]
```

`offset` is relative to the controller. `state` takes a bare block ID (its default state), or vanilla's `{ "Name": "...", "Properties": { ... } }` object when a specific state is needed.

### Owners

Ownership is a **set** (since 2026-09-25): the player who raises the array is written into the list when the plate activates it, and **every player on that list counts as an owner**. `mxt:formation_owner` passes for **any** of them, `mxt:formation_member` passes for an entity on the ownership list of any registered formation in the current level, and the dismantle permission and the modules' "owner / allies" targets read the whole set too.

A shared array is managed with `/mxt formation owners <pos> [add|remove <player>]`; adding and removing need the `gamemaster` permission, and `/mxt formation list` prints the whole list comma-separated. **Allies are asked of every listed owner, and a friend of any owner counts** as a friend of the array.

The payer is the **first** listed owner (with a single owner, the one who raised it), so an array with maintenance costs is taken down once that owner is offline and no payer can be resolved - unless a script cancels `UpkeepFailed`, or the array's own `storage` can still cover the period.

### Storage

`storage` takes one field, `capacity`, a `Map<Holder<aura>, NumberProvider>` that is **required** when the field is written. A capacity that evaluates to a non-finite or non-positive number means that aura is not stored at all.

Each entry of `activation_costs` and `maintenance_costs` is a `Cost`; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost) for the five shapes it may take. `activation_costs` is charged from the activator's own account. `maintenance_costs` is charged from the formation's own store first (the aura its blocks supply) and from the owner's account after that, so `mxt:item` and `mxt:js` entries can never be paid there. Both lists are evaluated with the owner's formula context while the owner is loaded, and with a level context when the owner is offline.

## Formation modules

`actions` answers what this formation **does**. It is a list of modules; each entry selects one built-in module with its own `type` and carries only the fields that module needs. Modules never replace the generic lifecycle hooks above — they run alongside them.

```json
{
  "structure": [ { "offset": [0, 0, 0], "state": "minecraft:gold_block" } ],
  "radius": 12,
  "activation_costs": [ { "id": "mxt:common", "amount": 100 } ],
  "actions": [
    { "type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt" },
    { "type": "mxt:protection", "spare_friends": true }
  ]
}
```

Rules:

- **The same type may appear more than once.** The list is not merged, so two attack modules with different numbers are two strikes.
- **Modules and the generic hooks add up.** Each period runs the modules first and `entity_tick_action` after them, so a custom hook sees the state the modules left behind. A module that acts on the array itself (currently only `mxt:range_display`) runs before `tick_action`.
- **A module only runs for the entities the array covers**, and who is covered is decided by the top-level `spare_friends` switch.
- **A misspelled `type` fails the load** instead of degrading to "does nothing": nearly every module field is optional, so a silent fallback would turn a typo into an array that just stands there.
- The built-in modules are `mxt:attack`, `mxt:buff`, `mxt:protection`, `mxt:range_display`, and `mxt:none` (an empty module, and the registry's default entry).

### `mxt:attack`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `damage` | `NumberProvider` | `0` | The damage dealt to every affected entity each period. |
| `damage_type` | damage_type | none | The damage type. Without it, the strike uses vanilla's "the owner hit it" reading, with the **first** listed owner as that owner. |
| `attribute_to_owner` | Boolean | `true` | Credits the **first** listed owner (the one who raised the array) as the attacker. This decides kill credit, mob aggro and every condition that reads the attacker; `false` makes it an unowned, environmental hit. |
| `effects` | `List<ApplyEffect>` | `[]` | The status effects applied each period. The fields are exactly those of `mxt:apply_effect`: `effect`, `duration_ticks` and `amplifier`. |
| `target_condition` | Entity Condition | `mxt:always_true` | An extra filter on the **target entity** (undead only, players only, …), evaluated after the friend-or-foe decision. |

Every per-entity strike goes through the [damage system](../../technical/damage.md): when the owner is credited, their spirit roots are read against the target's element on the attacking side, and the target's own adaptation reduces what it takes. The multipliers live in the `element` definitions, not here.

### `mxt:buff`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `abilities` | `List<ability>` | `[]` | Granted to the entities in range. The source is derived from the formation ID, so a grant is revoked when the entity leaves the radius, the array is removed, or the entity is no longer selected. |
| `target` | `all` / `allies` / `owner` | `all` | Who receives the benefit. `allies` goes through the friend check — which asks every listed owner, a friend of any of them counting — and gives nothing to an unidentifiable entity. |
| `aura_zone` | `Holder<aura_zone>` | none | A high-priority runtime aura override for the formation's position. |
| `max_bonus` | `Map<Holder<aura>, NumberProvider>` | `{}` | The aura maximum bonus for the aura the override provides; overlapping formations take the highest value. |

`max_bonus` only ever raises an aura the selected zone already provides: a module without `aura_zone` has no override to attach the bonus to, and an aura that the resolved environment does not carry cannot be created by a bonus.

Attribute modifiers are not a module field here: an `ability` carries its own `modifiers`, so granting an ability is what grants its modifiers.

### `mxt:protection`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `block_break` | Boolean | `true` | Block breaking. |
| `block_place` | Boolean | `true` | Block placing. |
| `block_interact` | Boolean | `true` | Right-clicking blocks (chests, doors, crafting tables, …), including using an item on a block. |
| `explosions` | Boolean | `true` | Explosions that change the terrain. Only blocks are removed from the explosion; entities still take damage. |
| `mob_griefing` | Boolean | `true` | Mob block destruction, such as an enderman carrying a block. |
| `entity_interact` | Boolean | `true` | Right-clicking entities (villagers, horses, armour stands, …). |
| `attack_entity` | Boolean | `true` | **Melee** attacks on entities. |
| `item_use` | Boolean | `true` | Using an item (buckets, potions, drawing a bow, …). |
| `spare_friends` | Boolean | `true` | Exempts every owner's friends. |
| `delegate_to_claims` | Boolean | `false` | Hands the protection to a claim plugin such as FTB Chunks: while a claim plugin is protecting the area, none of the flags above are enforced. |

Every flag defaults to `true`, so declaring the module is the whole statement; write `false` for the one thing you want to allow. A flag answers for **either end** of the action: the actor is inside the radius, or the block or entity being acted on is inside it. `item_use` has no target, so it only looks at the actor. Explosions and mob griefing have no actor, so they only look at the position.

### `mxt:range_display`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `particle` | particle | **required** | The particle to draw. |
| `shape` | `ring` / `sphere` | `ring` | `ring` is a horizontal circle at the controller's height; `sphere` spreads the points over the whole sphere. |
| `points` | Integer (`1..512`) | `32` | How many points to draw per period. |
| `interval_periods` | Integer (`1..1200`) | `1` | How often to draw, counted in **formation periods** (1 period = 20 ticks). |

This module only draws: it affects no entity and takes no part in the friend-or-foe decision. It is sent to the players who can see the array.

### `mxt:none`

An empty module that declares nothing and does nothing. It is the registry's default entry, and writing it is how a definition that only uses the generic lifecycle hooks says it has no function module of its own.

## Example

```json
{
  "structure_template": "example:spirit_gathering_array",
  "radius": 8,
  "actions": [
    { "type": "mxt:buff", "max_bonus": { "example:spirit_power": 50 }, "aura_zone": "example:spirit_gathering" }
  ]
}
```

A formation with costs, block behaviours and entity behaviour:

```json
{
  "structure_template": "example:spirit_gathering",
  "radius": 8,
  "activation_costs": [{ "id": "example:spirit_power", "amount": 10 }],
  "maintenance_costs": [{ "id": "example:spirit_power", "amount": 1 }],
  "storage": { "capacity": { "example:spirit_power": 500 } },
  "actions": [
    { "type": "mxt:buff", "max_bonus": { "example:spirit_power": 50 }, "aura_zone": "example:spirit_gathering" }
  ],
  "activate_action": { "type": "mxt:change_aura", "aura": { "example:spirit_power": 20 } },
  "tick_action": { "type": "mxt:change_aura", "aura": { "example:spirit_power": 2 } },
  "deactivate_action": { "type": "mxt:change_aura", "aura": { "example:spirit_power": -10 } },
  "entity_tick_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:regeneration",
    "duration_ticks": 40
  }
}
```

