---
title: Ability, State and Curse Types
---

# Ability, State and Curse Types

## `ability_type`

The nested `ability` object of an ability definition uses this registry. The ID is written as `ability.type`.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:empty` | none | No lifecycle of its own |
| `mxt:active` | `slot` | Castable from the wheel; where it sits is the player's own twelve-cell layout |
| `mxt:triggered` | `triggers`, `chance` | Fired when one of its triggers matches |
| `mxt:modifier` | none | Passive modifier ability, applied while granted and re-checked against `condition` every tick |
| `mxt:aura` | `interval`, `radius` | Repeats around the actor on an interval |
| `mxt:channelled` | `tick_interval`, `upkeep_costs` | Runs once on activation and then once per interval while its upkeep is paid |
| `mxt:composite` | `abilities`, `all_required` | Delegates to child abilities rather than acting itself |
| `mxt:word` | `effect`, `requires_operator`, `amount` | Terminal, code-whitelisted word effect |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:active` | `slot` | String | `primary` | No longer read: the wheel's twelve cells are the player's own layout. Must not be blank. |
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

`mxt:empty` has no fields. `mxt:word` is a terminal payload that never executes target behaviour, and datapacks cannot supply an arbitrary command string for it.

```json
{
  "ability": {
    "type": "mxt:channelled",
    "tick_interval": 20,
    "upkeep_costs": [{"id": "example:qi", "amount": 1}]
  }
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

Selects which entities an ability's bi-entity behaviour applies to.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:self` | none | Selects only the ability actor |
| `mxt:area` | `radius`, `include_actor` | Selects entities in an actor-centred area |
| `mxt:js` | `id`, `params?` | Selects the entities a server script returns |

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `radius` | `NumberProvider` | **required** | Area radius, capped at `128`; a negative or non-finite value selects nothing |
| `include_actor` | Boolean | `false` | Whether the actor is included in the selection |

```json
{"type": "mxt:area", "radius": 6, "include_actor": true}
```

`mxt:js` takes an `id` registered with `MxtAbilities.selector(...)` and an optional `params` object:

```json
{"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}}
```

The callback runs on the server while the ability executes and returns an array of entities. Selection happens for every execution of the ability, so a missing callback selects nobody and logs a warning.

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
