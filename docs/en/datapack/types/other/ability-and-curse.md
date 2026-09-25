---
title: Ability, State and Curse Types
---

# Ability, State and Curse Types

## `ability_type`

The **top-level** `type` of an ability definition uses this registry. The ID is written directly in the top-level `type` (`{"type": "mxt:active", ...}`), not inside a nested `ability` object.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:empty` | none | No lifecycle of its own |
| `mxt:active` | none | Castable from the wheel; where it sits is the player's own twelve-cell layout, and **it has no `slot` field** (writing one is a load error that names `slot`) |
| `mxt:triggered` | `triggers`, `chance` | Fired when one of its triggers matches |
| `mxt:modifier` | none | Passive modifier ability, applied while granted and re-checked against `condition` every tick |
| `mxt:aura` | `interval`, `radius` | Repeats around the actor on an interval |
| `mxt:channelled` | `tick_interval`, `upkeep_costs` | Runs once on activation and then once per interval while its upkeep is paid |
| `mxt:composite` | `abilities`, `all_required` | Delegates to child abilities rather than acting itself |
| `mxt:word` | `effect`, `requires_operator`, `amount` | Terminal, code-whitelisted word effect |
| `mxt:mount` | `speed`, `seats`, `sit`, `display`, `width` / `height`, `step_height`, `seat_offsets`, `mount_action`, `trail` | The mount (**data, never pressed**): speed, seats, pose, look, box and seat layout. It reads only its own fields, its top-level `costs` (the fuel of every tick: the carried artifact's store is spent first and only the remainder falls to the driver) and its `condition` (re-read every tick); **any other top-level field is a load error** rather than being ignored. Hitting a block or the ground ends the flight |
| `mxt:flight_control` | `hand`, `speed_multiplier` | The skill that flies (**needs a key**, one wheel cell): it takes the flying artifact out of the main hand and then the off hand and takes off, and a second press lands. A technique usually grants it - without it there is no cell. It reads `costs` / `condition` / `cooldown` / `components` and the display fields; `cast_time` / `entity_action` / `target_selector` / `target_condition` / `bi_entity_action` / `modifiers` / `damage_condition` / `element_affinity` / `element_affinity_mode` / `item_action` are load errors |
| `mxt:storage` | `slots` | The carrier's own storage slot count: **needs an item to carry it**, and needs a key (one wheel cell) with no state |
| `mxt:upkeep` | `interval`, `on_fail`, `owner_only` | A periodic price: while carried, the ability's own `costs` are settled all-or-nothing every `interval` ticks; **needs an item to carry it** and needs no key |

`mxt:storage`, `mxt:upkeep` and today's `mxt:mount` / `mxt:flight_control` once belonged to another table, `mxt:artifact_ability_type` (**deleted whole**): they are ordinary ability types now, and any source can grant them. The full field list is on [Ability](../../json/ability.md#ability-types).

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:triggered` | `triggers` | List of `Trigger` | `[]` | Trigger matchers that fire this ability |
| `mxt:triggered` | `chance` | `NumberProvider` | `1` | Chance that a matching trigger actually fires |
| `mxt:aura` | `interval` | `NumberProvider` | `20` | Ticks between aura applications |
| `mxt:aura` | `radius` | `NumberProvider` | `4` | Aura radius |
| `mxt:channelled` | `tick_interval` | `NumberProvider` | `1` | Ticks between upkeep payments |
| `mxt:channelled` | `upkeep_costs` | List of `Cost` | `[]` | Paid by the caster on every upkeep tick, all or nothing as one array; see [Shared Data Types · `Cost`](../shared_data_types.md#cost) |
| `mxt:composite` | `abilities` | List of `Holder<ability>` | **required** | Child abilities; invalid optional entries are ignored |
| `mxt:composite` | `all_required` | Boolean | `true` | When `false`, only the first child runs |
| `mxt:word` | `effect` | Enum | **required** | `self_heal` or `purge_self_curses` |
| `mxt:word` | `requires_operator` | Boolean | `true` | Whether the actor must be an operator |
| `mxt:word` | `amount` | `NumberProvider` | `0` | Magnitude passed to the word effect |
| `mxt:mount` | `speed` | `NumberProvider` | **required** | The mount's speed; the per-tick fuel is the ability's top-level `costs`, taken out of the carried artifact's own store first (the remainder falls to the driver; fractions are allowed) |
| `mxt:mount` | `seats` | int | `1` | Total seats including the driver, at most `4` |
| `mxt:mount` | `sit` | bool | `false` | The riding pose; one pose for the whole vehicle |
| `mxt:mount` | `display` | object | laid flat, blade forward, twice the authored size | How the mount sits relative to the item model it carries; same names and meaning as a vanilla item model's `display` |
| `mxt:mount` | `width` / `height` | double | `0.35` / `0.12` | The collision box; the mount re-measures itself when either changes |
| `mxt:mount` | `step_height` | double | `0` | The mount's `maxUpStep()` |
| `mxt:mount` | `seat_offsets` | array of three doubles | spread behind the model by `0.8` per seat, the first at `0.65` high | Where each seat's feet land, in blocks; the last written offset is reused for any seat past the list |
| `mxt:mount` | `mount_action` | object | all three are `mxt:no_op` | The mount's own three hooks, `on_mount` / `on_dismount` / `tick`, all running on the **driver**: the moment the flight starts, the moment it ends (before the seat is given up), and every tick once the fuel is paid |
| `mxt:mount` | `trail` | object | absent means no trail | Particles left behind, emitted by **the mount itself**: `particle` (required, a vanilla `ParticleOptions` in its **object form** `{"type": "minecraft:end_rod"}`; a bare id string is a load error, `Not a JSON object`) / `interval` (`1`) / `count` (`1`) / `speed` (`0`) / `spread` (`[0.2, 0.1, 0.2]`, blocks) / `offset_x` / `offset_y` (`0.1`) / `offset_z` (blocks) / `moving_only` (`false`; on means it only shows while actually moving) |
| `mxt:flight_control` | `hand` | `main` / `off` / `either` | `either` | Which hand the mount is looked for in; `either` means main hand first |
| `mxt:flight_control` | `speed_multiplier` | `NumberProvider` | `1` | Multiplied into the mount's `speed` |
| `mxt:storage` | `slots` | `NumberProvider` | **required** | Storage slots, rounded up to whole rows of nine and cut at six rows (54 slots) |
| `mxt:upkeep` | `interval` | `NumberProvider` | `20` | Ticks between settlements, on the **world's** clock (only ticks divisible by it settle) |
| `mxt:upkeep` | `on_fail` | `ItemAction` | `mxt:no_op` | What runs on the holder and that stack when the price cannot be paid |
| `mxt:upkeep` | `owner_only` | Boolean | `true` | Only the owner pays; with `false`, whoever carries it pays |

`mxt:empty` has no fields. Neither does `mxt:active` (its `slot` was removed on 2026-09-25): which cell a skill occupies is the **player's own twelve-cell layout** and was never part of the skill's definition; an old pack writing `"slot": "..."` is a **load error that names `slot`** (the "known key this type never reads" case, refused rather than silently ignored), so delete the line.

`mxt:word` is a terminal payload that never executes target behaviour, and its `effect` is a **code whitelist**: exactly `self_heal` and `purge_self_curses`, with no third value a datapack could add, and it is not an arbitrary command string; for anything else use an ordinary ability type with an `entity_action` (such as `mxt:heal`).

```json
{
  "type": "mxt:channelled",
  "tick_interval": 20,
  "upkeep_costs": [{"id": "example:qi", "amount": 1}]
}
```

---

## `data_storage_type`

The `components` array of an [ability](../../json/ability.md) declares the state that ability keeps, and this registry decides what each declaration stores. A kind is itself the storable object: it holds the declared parameters and the state it keeps in one record, and **its own class is the slot**, so one host holds at most one value per kind and nothing else has to name a slot.

| `type` | Declared fields | State field |
|--------|-----------------|-------------|
| `mxt:empty` | none | none — it declares no state of its own |
| `mxt:cooldown` | `ticks` (**required**) | `duration`: the length the last use got; the tick it was written is when that cooldown started |
| `mxt:charges` | `maximum`, `recharge_ticks` (**required**) | `remaining`: charges left; without it a value reads as full |
| `mxt:toggle` | `default` (default `false`) | `state`: the current flag |
| `mxt:timer` | `duration` (**required**) | `ends_at`: the tick the timer ends at |
| `mxt:resource` | `resource` (**required**) | `amount`: the amount kept for that resource |
| `mxt:target_lock` | `range` (**required**) | `target`: the locked entity's UUID, as a string |

Values live **in the attachment that owns them**: an ability's state sits in `mxt:ability_holder` next to the grants, addressed by **the ability's id plus the kind's class**. The attachment is the host, so no host class has to be recorded, and the same ability on two entities, or two abilities on one entity, never share a value. Saved data records the id only: a value is decoded by its own `type` dispatch, so the class comes back with it. The holder records the tick of every write, which is where a reader gets "when this state started", and a write marks its host attachment dirty, so a value is saved and synced with the content that owns it. What a write stores is the kind instance itself — declared fields and state together — so a reader gets exactly the implementation it asked for and the holder never has to know any shape.

Revoking an ability's last grant source clears everything it owned, so a re-granted ability does not come back with the charges it had before. Content writes one kind with the `mxt:modify_storage` [entity action](../action/entity_action_types.md), whose `value` is a whole storage object and which accepts declared kinds only; the cursors the runtime keeps for itself are refused as well — `mxt:cast_deadline`, `mxt:channel_pulse` and `mxt:aura_pulse` for abilities, and `mxt:entry_began` and `mxt:idle_countdown` for the single state slot a [tribulation](../../json/tribulation.md) run keeps, which is not addressed by an id at all.

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": "100 - level * 5"}
```

A declaration leaves the state field out; a write fills it in, and both forms are read back by the same `type` dispatch:

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1}
```

::: info Every kind is both written and read

`mxt:cooldown` and `mxt:charges` are read by the ability runtime, and `recharge_ticks` drives an automatic refill: a held ability whose declaration recharges gets one charge back once `recharge_ticks` have passed since the count was last written, at most one step per interval and at no cost, and nothing is written while the pool is full. All six kinds can also be asked about from content, through the matching [entity conditions](../condition/entity_condition_types.md) — `mxt:storage_toggle`, `mxt:storage_timer`, `mxt:storage_resource`, `mxt:storage_target`, `mxt:storage_charges` and `mxt:storage_cooldown` — which use the same `family` + `id` addressing and the same "the host must declare that kind" rule, so any declared state can be tested from any condition slot.

:::

---

## `ability_target_selector_type`

Selects which entities an ability's bi-entity behaviour applies to. All three area-like selectors take `include_actor`, `limit` and `order`.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:self` | none | Selects only the ability actor |
| `mxt:area` | `radius`, `include_actor`, `limit`, `order` | Selects entities in an area centred on the actor (or on this invocation's origin) |
| `mxt:ray` | `length`, `radius`, `include_actor`, `limit`, `order` | A **cylinder** along the actor's look: `length` blocks long and `radius` blocks thick, starting at the eye position (or this invocation's origin) |
| `mxt:cone` | `length`, `angle`, `include_actor`, `limit`, `order` | A **cone** along the actor's look, where `angle` is the **half-angle** in degrees (`0`..`180`) |
| `mxt:js` | `id`, `params?` | Selects the entities a server script returns |

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `radius` | `NumberProvider` | **required** for `mxt:area`, `0.5` for `mxt:ray` | The area's radius for `mxt:area` (capped at `128`) and the cylinder's thickness for `mxt:ray`; a negative or non-finite value selects nothing |
| `length` | `NumberProvider` | **required** (`mxt:ray` / `mxt:cone`) | How far the shape reaches along the look, capped at `128`; a non-finite or non-positive value selects nothing |
| `angle` | `NumberProvider` | **required** (`mxt:cone`) | The cone's **half-angle** in degrees, between `0` and `180` |
| `include_actor` | Boolean | `false` | Whether the actor is included in the selection |
| `limit` | Integer | `0` | At most how many targets to keep, `0` meaning no cap; `order` only matters when a `limit` is written |
| `order` | `nearest` / `farthest` / `random` | `nearest` | Which targets survive when there are more than `limit` |

`mxt:area` gained `limit` and `order` in the same change, so "the nearest three" and "a random few" can be written directly. **Ties in that ordering are broken by entity id**, so the same instant always selects the same beings.

**Only values written as constants are checked at load time**: `limit` must not be negative, `length` must be finite and positive, `radius` finite and non-negative and `angle` between `0` and `180`; a value written as a formula is only settled at runtime, and an invalid evaluation makes that selection empty.

```json
{"type": "mxt:area", "radius": 6, "include_actor": true, "limit": 3, "order": "nearest"}
{"type": "mxt:ray", "length": 24, "radius": 0.5, "limit": 1}
{"type": "mxt:cone", "length": 8, "angle": 30}
```

::: info Both the cylinder and the cone are stopped by blocks

The `mxt:ray` cylinder is clipped by blocks along its **centre line**, so it never reaches through a wall, and the `mxt:cone` centre line is clipped the same way, so a wall in front shortens the cone. **Occlusion from the side is not tested per target inside a cone**: a target inside the cone is selected while the centre line is clear, even with something between it and the actor.

:::

`mxt:js` takes an `id` registered with `MxtAbilities.selector(...)` and an optional `params` object:

```json
{"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}}
```

The callback runs on the server while the ability executes and returns an array of entities. Selection happens for every execution of the ability, so a missing callback selects nobody and logs a warning. `mxt:js` still implements only the two-argument `select(actor, context)`, so it never receives this invocation's origin.

---

## `curse_type`

The `type` of a curse definition selects its lifecycle policy. All four types are fieldless; the duration itself comes from the `duration_ticks` field of the curse definition.

| `type` | Description |
|--------|-------------|
| `mxt:timed` | Expires after the configured duration; the duration must be positive |
| `mxt:permanent` | Never expires |
| `mxt:triggered` | Application and removal are driven by the owning event bridge; a non-positive duration means no expiry |
| `mxt:empty` | No lifecycle at all |

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

---
