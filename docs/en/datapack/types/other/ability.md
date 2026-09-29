---
title: Ability Types (ability_type)
description: The fourteen ability types in mxt:ability_type, which fields each one reads and when it runs.
---

# Ability Types (ability_type)

The **top-level** `type` of an ability definition comes from this table:

```json
{"type": "mxt:active", "costs": [{"id": "example:qi", "amount": 10}], "cooldown": 40}
```

The common fields — the handful every type reads — are on the [ability definition](../../json/ability.md) page. This page records only the keys each type **itself** reads. A key that is listed nowhere is read by nobody even when it is written.

## Overview

| `type` | What it does | Needs a key |
| --- | --- | --- |
| [`mxt:empty`](#mxt-empty) | Does nothing | No |
| [`mxt:active`](#mxt-active) | One press, one run | **Yes** |
| [`mxt:triggered`](#mxt-triggered) | One run when a signal arrives | No |
| [`mxt:channelled`](#mxt-channelled) | Hold to keep it up, one run per beat | **Yes** |
| [`mxt:targeted`](#mxt-targeted) | One press, the payload ability on each of a batch of targets | **Yes** |
| [`mxt:aura`](#mxt-aura) | Every so often, one run on every entity in radius | No |
| [`mxt:interval`](#mxt-interval) | Runs itself over and over on a cadence | No |
| [`mxt:modifier`](#mxt-modifier) | Passive attribute bonuses | No |
| [`mxt:mount`](#mxt-mount) | Declares the artifact a flying mount | No |
| [`mxt:flight_control`](#mxt-flight-control) | One press to take off, one to land | **Yes** |
| [`mxt:storage`](#mxt-storage) | One press opens a carried storage | **Yes** |
| [`mxt:upkeep`](#mxt-upkeep) | A periodic price | No |
| [`mxt:composite`](#mxt-composite) | Delegates to child abilities | No |
| [`mxt:word`](#mxt-word) | The two whitelisted effects | No |

**Needs a key** only affects the wheel: only pressable types enter the wheel pool, and no other type does. Commands, scripts and item-carried abilities cast a type of any kind directly.

## The Four Action Fields {#action-fields-by-type}

`entity_action`, `target_selector`, `target_condition` and `bi_entity_action` are written at the top level of the ability (beside `type`), with the defaults `mxt:no_op` / `mxt:self` / `mxt:always` / `mxt:no_op`. Only the five types that run actions read them: `mxt:active`, `mxt:triggered`, `mxt:channelled`, `mxt:aura` and `mxt:interval`.

The order inside one run never changes: `entity_action` first, then `target_selector` picks targets, every target is tested by `target_condition`, and only a target that passes runs `bi_entity_action`. One target failing does not affect the others, and an action that throws only logs a line rather than stopping the rest.

Each of the five types runs this set at **its own moment**:

| Type | When it runs the four keys |
| --- | --- |
| `mxt:active` | On the press (with a `cast_time`, the tick it finishes). |
| `mxt:triggered` | Once the trigger fires, the chance passes and the costs are paid. |
| `mxt:channelled` | Once on activation, then once per `tick_interval` after each upkeep deduction succeeds. |
| `mxt:aura` | A pulse that comes due on `interval` **finds entities by radius one by one**, and each entity only runs `target_condition` + `bi_entity_action` (a pulse reads neither `target_selector` nor `entity_action`); fired one-off (a command, a script, a talisman) it runs the whole set once through the ordinary path. |
| `mxt:interval` | Runs the whole set on its own `interval`; fired one-off by a command or a script it runs once through the ordinary path. |

Every other type reads **none of it**: `mxt:word` carries a terminal payload of its own (its `effect` field), `mxt:composite` delegates to its children, `mxt:targeted` only picks targets (it runs the payload's one-target half), and `mxt:modifier` / `mxt:mount` / `mxt:flight_control` / `mxt:storage` / `mxt:upkeep` / `mxt:empty` have no such layer either.

`mxt:targeted` also writes a key called `target_selector`, but that is its own "who does this cast reach", not half of the set above.

## Which Fields Each Type Reads

| `type` | Its own fields |
| --- | --- |
| `mxt:empty` | none |
| `mxt:active` | `cooldown`, the four action fields |
| `mxt:triggered` | `triggers`, `chance`, `damage_condition`, `cooldown`, the four action fields |
| `mxt:channelled` | `cooldown`, `tick_interval`, `upkeep_costs`, the four action fields |
| `mxt:targeted` | `target_selector`, `ability`, `cooldown` |
| `mxt:aura` | `cooldown`, `interval`, `radius`, the four action fields |
| `mxt:interval` | `interval`, the four action fields |
| `mxt:modifier` | `modifiers` |
| `mxt:mount` | `speed`, `seats`, `sit`, `render`, `entity_type`, `display`, `width`, `height`, `step_height`, `seat_offsets`, `mount_action`, `trail` |
| `mxt:flight_control` | `hand`, `speed_multiplier`, `cooldown` |
| `mxt:storage` | `slots`, `cooldown` |
| `mxt:upkeep` | `interval`, `on_fail`, `owner_only` |
| `mxt:composite` | `abilities`, `all_required` |
| `mxt:word` | `effect`, `requires_operator`, `amount`, `cooldown` |

`cooldown` and `damage_condition` are read by only some types, so they are not in the common field table — but they are still written beside `type` in JSON.

- **`cooldown`** (`NumberProvider`, default `0`): the cooldown length, written into the `mxt:cooldown` state. Every path that pays reads it — `mxt:active` / `mxt:triggered` / `mxt:channelled` / `mxt:aura` / `mxt:word` / `mxt:targeted` / `mxt:flight_control` / `mxt:storage`. A type that pays nothing reads nothing from it.
- **`damage_condition`** (`DamageCondition`, default `mxt:always`): **only `mxt:triggered` reads it**. Subscribing to the `mxt:hurt` signal tests this condition first and skips that signal while it fails. Written on any other type it is a key nobody reads; to pick a situation, use `condition`.

## State Kinds

Which state kinds an ability can store is decided by its `type`; a data pack does not declare it. This table decides whether `mxt:modify_storage` and the six `mxt:storage_*` conditions accept a value:

| `type` | Declared state kinds |
| --- | --- |
| `mxt:empty` / `mxt:modifier` / `mxt:mount` / `mxt:upkeep` / `mxt:composite` | Only the default `mxt:active_state` |
| `mxt:active` / `mxt:triggered` / `mxt:channelled` / `mxt:aura` | `mxt:active_state`, `mxt:cooldown`, and `mxt:charges` when `charges` is written, plus `mxt:toggle` / `mxt:timer` / `mxt:resource` / `mxt:target_lock` |
| `mxt:interval` | `mxt:active_state` and those four content-side kinds; no `mxt:cooldown` and no `mxt:charges` |
| `mxt:targeted` | `mxt:active_state`, `mxt:cooldown`, and `mxt:charges` when `charges` is written; none of those four |
| `mxt:flight_control` | `mxt:active_state`, `mxt:cooldown` |
| `mxt:storage` | `mxt:active_state`, `mxt:cooldown`, `mxt:container` |
| `mxt:word` | `mxt:active_state`, `mxt:cooldown`, and `mxt:charges` when `charges` is written |

The fields of those six kinds, how they are written and how they are read are on [Ability Casting](/en/technical/ability).

## `mxt:empty`

No fields and no lifecycle: `{"type": "mxt:empty"}` is the whole ability. Useful as a placeholder, or where all you want is to grant an id.

## `mxt:active`

One press runs the four action fields once; with a `cast_time` it is the tick the cast finishes on.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | Cooldown length, in ticks |
| `entity_action` | `EntityAction` | `mxt:no_op` | Runs on the caster first |
| `target_selector` | `TargetSelector` | `mxt:self` | How targets are picked |
| `target_condition` | `BiEntityCondition` | `mxt:always` | Every target has to pass it |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Only targets that pass the condition run it |

**It has no `slot` field.** Which wheel cell an ability sits in is the player's own twelve-cell layout, nothing to do with the definition.

```json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 10}],
  "cooldown": 40,
  "entity_action": {"type": "mxt:spawn_particles", "particle": {"type": "minecraft:flame"}},
  "target_selector": {"type": "mxt:ray", "length": 16},
  "target_condition": {"type": "mxt:not_owner"},
  "bi_entity_action": {"type": "mxt:set_on_fire", "ticks": 60}
}
```

## `mxt:triggered`

Once a signal in `triggers` arrives, `chance` passes and the costs are paid, the four action fields run once.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `triggers` | `Trigger` list | `[]` | An empty list means it never triggers |
| `chance` | `NumberProvider` | `1` | Whether this one counts |
| `damage_condition` | `DamageCondition` | `mxt:always` | Only used on the `mxt:hurt` signal |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |
| `entity_action` | `EntityAction` | `mxt:no_op` | Runs on the caster first |
| `target_selector` | `TargetSelector` | `mxt:self` | How targets are picked |
| `target_condition` | `BiEntityCondition` | `mxt:always` | Every target has to pass it |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Only targets that pass the condition run it |

How `chance` is read: an evaluation that throws or is not finite does **not** pass, `≤ 0` does not pass, `≥ 1` always passes, and anything in between rolls the entity's random once. This is **not** the same rule as the `chance` of the same name in the [trigger rules](/en/datapack/json/trigger), where a value that cannot be computed counts as `1`.

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:item_use"}],
  "costs": [{"id": "example:qi", "amount": "10 + level"}],
  "cooldown": 100,
  "condition": {"type": "mxt:sneaking"},
  "entity_action": {"type": "mxt:spawn_particles", "particle": {"type": "minecraft:crit"}},
  "target_selector": {"type": "mxt:ray", "length": 6, "limit": 1},
  "target_condition": {"type": "mxt:not_owner"},
  "bi_entity_action": {"type": "mxt:damage", "amount": "6 + level"}
}
```

## `mxt:channelled`

The activation itself is a full cast; after that it is kept up once every `tick_interval`: `condition` is tested first, then `upkeep_costs` are charged all or nothing, and only on success do the four action fields run. A failure at any step stops the channel.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |
| `tick_interval` | `NumberProvider` | `1` | Ticks between two upkeep payments |
| `upkeep_costs` | `Cost` list | `[]` | What each upkeep costs |
| `entity_action` | `EntityAction` | `mxt:no_op` | Runs on the caster first, on activation and on every upkeep |
| `target_selector` | `TargetSelector` | `mxt:self` | How targets are picked |
| `target_condition` | `BiEntityCondition` | `mxt:always` | Every target has to pass it |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Only targets that pass the condition run it |

```json
{
  "type": "mxt:channelled",
  "tick_interval": 20,
  "upkeep_costs": [{"id": "example:qi", "amount": 1}],
  "entity_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
}
```

## `mxt:targeted`

One press runs one full cast, uses `target_selector` to pick targets, and then runs **the payload ability `ability`'s one-target half** on each of them: the payload's `target_condition` filters, the payload's `bi_entity_action` happens, and the actor stays whoever pressed.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `target_selector` | `TargetSelector` | **required** | Who this cast reaches; the distance and the shape are written here |
| `ability` | Ability id | **required** | The payload ability run on every target |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |

The payload takes **concrete ids only, never a `#tag`**, and it has to be one of the five types that run the four action fields; naming `mxt:modifier` / `mxt:composite` / `mxt:word` / another `mxt:targeted` is refused before anything is paid.

None of the payload's own `costs` / `cast_time` / `cooldown` / `charges` / `condition` / element affinity is read, and neither are its `entity_action` and `target_selector`.

Picking nobody at all (or having every pick filtered out by the payload's `target_condition`) is `NO_TARGET`; a payload type with no one-target half is `NOT_APPLICABLE`. Both are decided before anything is paid.

## `mxt:aura`

Every `interval` ticks it runs one pulse around itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |
| `interval` | `NumberProvider` | `20` | Ticks between two pulses |
| `radius` | `NumberProvider` | `4` | How far a pulse reaches |
| `entity_action` | `EntityAction` | `mxt:no_op` | Runs on the caster first when fired one-off; a pulse does not read it |
| `target_selector` | `TargetSelector` | `mxt:self` | How targets are picked when fired one-off; a pulse does not read it |
| `target_condition` | `BiEntityCondition` | `mxt:always` | Every entity in range has to pass it |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Only in-range targets that pass the condition run it |

A pulse picks entities **by `radius` alone**: a sphere centred on the caster, comparing each target's straight-line distance, reading neither `target_selector` nor `entity_action`. A `radius` that evaluates non-finite or negative skips that beat. A pulse puts two extra formula variables, `aura_radius` and `distance`, on the bi-entity context.

Fired one-off by a command, a script or a talisman, it runs the whole set once through the ordinary path.

Mind that `mxt:aura`'s `radius` is a **sphere** while the `mxt:area` selector's `radius` is a **box**. Same name, but they do not cover the same entities.

## `mxt:interval`

It runs itself over and over on a cadence: every `interval` ticks (the ticks world time divides by it) while it counts as in effect, one full pass over the four action fields.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `interval` | `NumberProvider` | `20` | Ticks between two passes |
| `entity_action` | `EntityAction` | `mxt:no_op` | Runs on the caster first |
| `target_selector` | `TargetSelector` | `mxt:self` | How targets are picked |
| `target_condition` | `BiEntityCondition` | `mxt:always` | Every target has to pass it |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | Only targets that pass the condition run it |

An `interval` that yields no usable tick count (not finite, or below `1`) skips that beat. Fired one-off by a command or a script it ignores its cadence and runs once straight away.

It pays nothing, so it has no `cooldown` and no charges.

## `mxt:modifier`

While it is granted, `modifiers` are contributed to the holder's vanilla attributes and `condition` is tested again every tick; when it fails, the contribution is withdrawn.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `modifiers` | `AttributeEntry` list | `[]` | Attribute modifiers |

Each `AttributeEntry` is `attribute` plus `id` / `amount` / `operation`, with an optional `value`: with `value` written the modifier is evaluated from it, otherwise from `amount` (recomputed every tick). The field details are on [Shared Data Types](../shared_data_types.md).

An `amount` that is not finite is not a load error; that entry is skipped at runtime.

It is not a pressable type, it runs no `entity_action`, and it never enters the wheel pool.

```json
{
  "type": "mxt:modifier",
  "modifiers": [
    {"attribute": "minecraft:attack_damage", "id": "example:blade", "amount": 2, "operation": "add_value"}
  ]
}
```

## `mxt:mount`

**A `mxt:mount` is how an artifact declares itself a flying mount**: once it is in the artifact's `abilities`, the flying skill can take it from either hand and fly it — how fast, how many seats, what fuel it burns and what it looks like are all answered here. It is **never activated**: it reads only its own fields, the top-level `costs` (the fuel of every tick) and `condition` (re-read every tick, and failing it lands).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `speed` | `NumberProvider` | **required** | Mount speed |
| `seats` | int | `1` | Total seats including the driver, from `1` to `4` |
| `sit` | bool | `false` | Riding pose, shared by the whole vehicle |
| `render` | Renderer | `mxt:item` | Which renderer draws the mount |
| `entity_type` | entity type id | `mxt:flying_sword` | Which entity type flies it; it has to implement the [mount contract](../../../java/interfaces/mount/vehicle.md), and a wrong id fails at load |
| `display` | `{translation, rotation, scale}` | absent means the renderer's own default pose | How the mount sits relative to the mount's origin |
| `width` | double | `0.35` | Collision box width |
| `height` | double | `0.12` | Collision box height |
| `step_height` | double | `0` | Step height |
| `seat_offsets` | `Vec3` list | spread behind by `0.8` per seat, the first at `0.65` high | Where each seat lands, in blocks |
| `mount_action` | `{on_mount, on_dismount, tick}` | all three are `mxt:no_op` | The mount's own three behaviours |
| `trail` | Object | absent means no trail | Trail particles |

**`entity_type` swaps "which entity flies it"**: leave it out and the framework's own `mxt:flying_sword` is used; write it and the id is looked up in the vanilla entity type registry, where a wrong id fails at **load**. Whether the body can carry a flight is the entity's own answer — the type has to implement the [mount contract](../../../java/interfaces/mount/vehicle.md), or take-off is refused (the action bar still reports "cannot be boarded", and the log names the type, once per type). **A different entity type is a different set of behaviour**: movement, landing, seats, boarding, size, saved data and drawing all live on that entity, and the definition's `width` / `height` / `seat_offsets` / `sit` / `step_height` / `render` / `display` have to be read by it as well — which is why "boat / palanquin / airship" is an addon registering one entity type and one renderer, with a pack naming it.

`costs` is the fuel of every tick: the artifact's own store of the same aura is spent first, and only the remainder falls to the driver; fractions are allowed.

`render` picks **which renderer** draws it: `mxt:item` by default (the item model of the carried item), `mxt:geckolib` (a GeckoLib model and its animations, which needs GeckoLib on the client), or a type a content mod registered. `display` is optional; leave it out and the renderer uses its own default pose (`[0,0,0]` / `[90,0,-45]` / `[2,2,2]` on the item track, no rotation and `1` on the GeckoLib track). Its fields have the same names and meanings as a vanilla item model's `display`: `translation` is written in 1/16 blocks and stored in blocks, `rotation` is degrees combined as `rotationXYZ`, and `scale` is a factor (a negative value mirrors, which is legal). The three `render.type` values, the GeckoLib asset paths and the seven poses are on [Mount Renderers](./mount-render.md). Changing the collision box takes effect at once.

The last `seat_offsets` entry written is reused for any seats past the list. `seats` is the total head count including the driver; the driver has to be a player, and any other seat is taken by right-clicking the mount. The driver steers with the movement keys: jump climbs, the descend key sinks, sprinting gives 1.5x horizontal speed, and forward/back/left/right follow the look direction by default (**Server Config → Flight → Fly Where You Look**); sneaking is still the vanilla dismount. Movement is computed on the server only.

All three behaviours of `mount_action` run on the **driver**: the moment the flight starts, the moment it lands (before the seat is given up), and every tick (once the fuel is paid).

`trail`'s fields are `particle` (required) plus `interval` (default `1`, `1`–`200`), `count` (default `1`, `0`–`256`), `speed` (default `0`), `spread` (default `[0.2, 0.1, 0.2]`), `offset_x` / `offset_y` / `offset_z` (default `0` / `0.1` / `0`) and `moving_only` (default `false`). `particle` has to be written as an object, for example `{"type": "minecraft:end_rod"}`; a bare id string is a load error. `spread` and `offset_*` are measured in **blocks** (unlike `mxt:spawn_particles`, which scales by the entity's size); with `moving_only` on, it only emits on a tick where it really moved.

Load-time refusals: `seats` outside `1`–`4`, more than four `seat_offsets` entries or a non-finite vector among them, a non-positive or non-finite `width` / `height`, a negative or non-finite `step_height`, a non-finite `speed` / `spread` / `offset_*` on `trail`, and an out-of-range `trail.interval` / `trail.count`.

Hitting a block or the ground lands the flight.

## `mxt:flight_control`

One press takes the flying artifact out of the main hand, then the off hand, and takes off; a second press lands. A technique usually grants it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `hand` | `main` / `off` / `either` | `either` | Which hand the mount is looked for in |
| `speed_multiplier` | `NumberProvider` | `1` | Multiplied into the mount's `speed` |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |

It reads `costs`, `condition`, `cooldown` and the display fields. It reads none of `cast_time` / `charges` / the four action fields / `damage_condition` / element affinity.

Neither it nor `mxt:storage` spends a charge.

## `mxt:storage`

One press opens the carried item's own storage. It needs an item to carry it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `slots` | `NumberProvider` | **required** | Storage slot count |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |

How the slot count settles: `floor(value)` → clamped to the 32-bit integer range, `0` at the bottom → anything `≤ 0` counts as 0 (a press then reports `INVALID_FORMULA`) → rows `clamp((slots + 8) / 9, 0, 6)` → capacity = rows x 9, **54 slots at most**.

Failure reasons on a press: not a server-side player = `UNAVAILABLE`, nothing carried in hand = `NO_CARRIER`, not the owner = `NOT_OWNED`.

The contents live in the item component `mxt:storage`, as one record under this ability's own id. Two storage abilities on one carrier keep two separate boxes.

It spends no charge either.

## `mxt:upkeep`

A periodic price: every server tick the carriers in the hands of online players (main hand, off hand, every Curios slot) are looked at, and every `interval` ticks each one's own `costs` are charged all or nothing. It needs an item to carry it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `interval` | `NumberProvider` | `20` | Ticks between two settlements |
| `on_fail` | `ItemAction` | `mxt:no_op` | Runs on the holder and that stack when the price cannot be paid |
| `owner_only` | Boolean | `true` | Only the owner pays; with `false`, whoever carries it pays |

`interval` runs on the world's clock and only settles on ticks divisible by it; when the evaluation is unusable (not finite, below `1`, or beyond the 64-bit integer range) it falls back to the default `20`, rather than becoming every tick.

When settlement is skipped: the stack carries no `mxt:upkeep`, `costs` is empty, `owner_only` is true and the holder is not the owner, or the current tick is not divisible by `interval`.

It is not a pressable type.

## `mxt:composite`

It does nothing itself and delegates to child abilities.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | Ability id list | **required** | The child abilities |
| `all_required` | Boolean | `true` | Whether all of them have to pass before anything runs |

The children take **concrete ids only, never a `#tag`**; a tag counts as a bad entry and is dropped with a log line. An artifact's `abilities`, a technique's `granted_abilities` and a talisman's `abilities` are the other way round and take either.

Its own `costs` / `cast_time` / `cooldown` / `charges` all take no effect — the money and the cooldown are booked under **each child's own id**. `condition` and element affinity are still tested against the composite itself first.

With `all_required: false` only the **first** child in the list is handed to the cast and the rest are never looked at; an empty list reports `NOT_GRANTED`. With `true` every child is first draft-previewed (condition, element affinity, costs, charges, cooldown all worked into the draft), a failure in any one of them means nothing lands at all and not a single child runs, and only once all of them pass are they committed in list order and run one after another. A child with `cast_time > 0` is refused during that preview with `INVALID_FORMULA`.

## `mxt:word`

A terminal payload: it executes no target behaviour of its own.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | `self_heal` / `purge_self_curses` | **required** | The effect; an unknown value is a load error |
| `requires_operator` | Boolean | `true` | The caster has to be a player with gamemaster permission |
| `amount` | `NumberProvider` | `0` | The magnitude passed to the effect, only meaningful for `self_heal` |
| `cooldown` | `NumberProvider` | `0` | Cooldown length |

`effect` is a fixed whitelist; a data pack cannot add a third value. It is not an arbitrary command string and has nothing to do with the action fields on an ability — for anything else, write an ability with an `entity_action` (such as `mxt:heal`).

`amount` has to evaluate finite, non-negative and no larger than a single-precision float allows, or this cast is refused with `PERMISSION_DENIED`. Failing `requires_operator` refuses it the same way.

It is not a pressable type; usually it is a child of an `mxt:composite`, or cast by a command or a script.
