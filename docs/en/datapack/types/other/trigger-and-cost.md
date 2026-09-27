---
title: Trigger and Cost Types
description: Every built-in entry, field, default and decision rule of the mxt:trigger_type trigger matchers and the mxt:cost_type costs.
---

# Trigger and Cost Types

## `trigger_type`

Trigger matchers decide which runtime events an ability, a breakthrough condition and an event rule respond to. A built-in signal matcher hard-codes one signal id per entry and, at dispatch, answers whether the signal that arrived is that one; `mxt:js` is the exception, since its signal comes from the definition itself. `type` is written on the trigger object and takes one of the ids listed below, always in the `mxt` namespace. The whole family is dispatched by the built-in `mxt:trigger_type` registry: a data pack picks an entry, it never adds one.

A trigger object is written under the `trigger` field of an [event rule](../../json/trigger.md#trigger); an ability and a breakthrough condition write a list of triggers in a `triggers` array:

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:item_use"}]}
```

Apart from `mxt:js`, none of these matchers takes a field: the whole entry is that one `{"type": ...}` layer.

### `mxt:tick`

A periodic entity tick.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:tick"}
```

### `mxt:attack`

The entity attacked another entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:attack"}
```

### `mxt:hurt`

The entity took damage.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:hurt"}
```

### `mxt:kill`

The entity killed another entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:kill"}
```

### `mxt:block_break`

The entity broke a block.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:block_break"}
```

### `mxt:block_use`

The entity used a block.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:block_use"}
```

### `mxt:item_use`

The entity finished using an item.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:item_use"}
```

### `mxt:equip`

The entity's equipment changed.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:equip"}
```

### `mxt:death`

The entity died.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:death"}
```

### `mxt:breakthrough`

The entity completed a breakthrough.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:breakthrough"}
```

### `mxt:technique_stage`

A learned technique reached a new stage.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | Takes no fields. |

```json
{"type": "mxt:technique_stage"}
```

### `mxt:js`

A matcher decided by a server script callback.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `signal` | Identifier | **required** | The signal id this matcher listens to; subscriptions are indexed by it |
| `id` | String | **required** | Callback id registered with `MxtTriggers.matcher` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill"}]}
```

This is the only way a data pack reacts to a **custom** signal id: a server script raises the signal with `MxtTriggers.publish`, and then either subscribes a script to it, or declares this trigger on an ability, in an event rule, or in some value's breakthrough conditions. The callback only decides whether the signal that reached the subscription counts as a match, so a missing callback — or one that throws — never matches. See the [KubeJS API Reference](../../../kubejs/api-reference.md).

### Ported Vanilla Triggers

These entries belong to `mxt:trigger_type` as well: each one mirrors a vanilla advancement trigger, keeps the vanilla id, and hands the decision to vanilla's own instance code, so the fields are word for word what vanilla writes — a `conditions` block from an advancement can be copied over as it is. The only difference is the outer layer: vanilla wraps the parameters in `conditions`, while here there is no such wrapper and the fields sit side by side with `type` (vanilla's `player_killed_entity` writes `entity` + `killing_blow`, and here it is the same two fields).

The `type` in the left column is always in the `mxt:` namespace; the vanilla trigger name is there only for comparison.

| Signal / `type` | Vanilla Trigger | Fields Read |
| --- | --- | --- |
| `mxt:consume_item` | `minecraft:consume_item` | `player`, `item` |
| `mxt:brewed_potion` | `minecraft:brewed_potion` | `player`, `potion` |
| `mxt:tame_animal` | `minecraft:tame_animal` | `player`, `entity` |
| `mxt:bred_animals` | `minecraft:bred_animals` | `player`, `parent`, `partner`, `child` |
| `mxt:villager_trade` | `minecraft:villager_trade` | `player`, `villager`, `item` |
| `mxt:used_totem` | `minecraft:used_totem` | `player`, `item` |
| `mxt:started_riding` | `minecraft:started_riding` | `player` |
| `mxt:changed_dimension` | `minecraft:changed_dimension` | `player`, `from`, `to` |
| `mxt:effects_changed` | `minecraft:effects_changed` | `player`, `effects`, `source` |
| `mxt:lightning_strike` | `minecraft:lightning_strike` | `player`, `lightning`, `bystander` |
| `mxt:player_hurt_entity` | `minecraft:player_hurt_entity` | `player`, `damage`, `entity` |
| `mxt:entity_hurt_player` | `minecraft:entity_hurt_player` | `player`, `damage` |
| `mxt:player_killed_entity` | `minecraft:player_killed_entity` | `player`, `entity`, `killing_blow` |
| `mxt:entity_killed_player` | `minecraft:entity_killed_player` | `player`, `entity`, `killing_blow` |
| `mxt:shot_crossbow` | `minecraft:shot_crossbow` | `player`, `item` |
| `mxt:player_interacted_with_entity` | `minecraft:player_interacted_with_entity` | `player`, `item`, `entity` |
| `mxt:fishing_rod_hooked` | `minecraft:fishing_rod_hooked` | `player`, `rod`, `entity`, `item` |
| `mxt:thrown_item_picked_up_by_player` | `minecraft:thrown_item_picked_up_by_player` | `player`, `item`, `entity` |
| `mxt:enter_block` | `minecraft:enter_block` | `player`, `block`, `state` |
| `mxt:location` | `minecraft:location` | `player` |
| `mxt:slept_in_bed` | `minecraft:slept_in_bed` | `player` |
| `mxt:levitation` | `minecraft:levitation` | `player`, `distance`, `duration` |
| `mxt:using_item` | `minecraft:using_item` | `player`, `item` |
| `mxt:fall_from_height` | `minecraft:fall_from_height` | `player`, `start_position`, `distance` |
| `mxt:fall_after_explosion` | `minecraft:fall_after_explosion` | `player`, `start_position`, `distance`, `cause` |
| `mxt:ride_entity_in_lava` | `minecraft:ride_entity_in_lava` | `player`, `start_position`, `distance` |
| `mxt:nether_travel` | `minecraft:nether_travel` | `player`, `start_position`, `distance` |
| `mxt:inventory_changed` | `minecraft:inventory_changed` | `player`, `slots`, `items` |
| `mxt:filled_bucket` | `minecraft:filled_bucket` | `player`, `item` |
| `mxt:item_durability_changed` | `minecraft:item_durability_changed` | `player`, `item`, `durability`, `delta` |

Fields such as `player`, `entity` and `victim` keep vanilla's shape: either a list of loot conditions (`[{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {...}}]`, where several entries all have to hold) or a plain entity predicate (`{"type": "minecraft:zombie"}`). Since they are loot conditions, the mod's own conditions fit in them too, for example `{"condition": "mxt:realm", "realm": "mxt:foundation"}`. The three below are copied from vanilla advancements, with only the `conditions` layer removed:

```json
{"type": "mxt:consume_item", "item": {"items": "minecraft:golden_apple"}}
```

```json
{
  "type": "mxt:player_killed_entity",
  "entity": [{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {"type": "minecraft:breeze"}}]
}
```

```json
{"type": "mxt:changed_dimension", "to": "minecraft:the_nether"}
```

These signals are published by the mod's own hooks, so they are **repeatable and runtime only**, and like the built-in signals they serve event rules, ability triggers and breakthrough conditions alike. A signal is only published for the player it originally served (vanilla's advancement triggers only ever see a player), so a field holding an entity predicate always has the context it needs.

Three of them differ in timing:

- `mxt:changed_dimension` is published **before** the transfer (vanilla does its bookkeeping once the transfer is done); `mxt:tame_animal` is published **before** the taming lands (vanilla fires after the tamed flag is written back), so a predicate reading the tame state itself (`nbt`, `flags`) sees the old value.
- `mxt:effects_changed` is published at the end of a tick, so `effects` describes the effect set after the change; several changes in one tick are merged into one.
- `mxt:fishing_rod_hooked` only covers the loot roll (vanilla fires a second time for a hooked entity), and the event carries the hook rather than the rod, so the rod is worked out from the player's hands.

Damage signals publish `damage` for matching and additionally offer `original_damage`, `blocked` (`1`/`0`) and `blocked_damage` to formulas; `mxt:consume_item` offers `use_duration`, and `mxt:levitation` offers `duration` (the ticks it has lasted so far).

Eleven of them are triggers vanilla **polls itself** (comparing every tick or when it lands), so porting one means copying that comparison, and the cadence matches vanilla: `mxt:location` once every 20 ticks; `mxt:using_item` once per tick while an item is in use; `mxt:levitation` once per tick while the effect lasts; `mxt:ride_entity_in_lava` once per tick after the vehicle enters lava; `mxt:fall_from_height` records where the fall started and publishes on landing; `mxt:fall_after_explosion` asks the same question at the start of the fall, so it only holds for an explosion that really carries impulse, such as a wind charge, exactly as in vanilla; `mxt:nether_travel` records the position on entering the nether and publishes on the return to the overworld; `mxt:inventory_changed` and `mxt:slept_in_bed` publish when an inventory slot changes and at the moment sleep starts.

`mxt:enter_block` is the one **approximation** in this family: vanilla tests the **path of movement** of that tick against the inside shape of blocks, which is why standing still in water repeats every tick; here the test is the blocks the player's collision box has **newly** covered — fluids count, grass and torches that have no collision do not. Walking in is the same moment, but standing still does not repeat. For a continuous effect use `mxt:tick`, or add a `cooldown` to the rule.

`mxt:filled_bucket` watches for an empty bucket being replaced by a non-empty item, and `mxt:item_durability_changed` for the damage value of one item going up (a repair does not fire, as in vanilla). The decision still runs vanilla's instance, which is handed the stack **as it was before the change**, so under vanilla's algorithm damage taken comes out as a negative `delta` (write `{"max": -1}`), and `durability` is the **remaining** durability after the change. The price is that these two are **wider** than vanilla: taking a filled bucket out of a chest, or changing the inventory with a command, also counts as a bucket having been filled.

Two more vanilla triggers are **deliberately not ported**: `summoned_entity` needs to know who placed the block, which only exists inside the block code and would credit the wrong player if pieced together; the player that caused a `cured_zombie_villager` is not exposed.

---

## `cost_type`

Every field that consumes something is an array, and each entry writes one `Cost`. The four shapes that write a `type` are dispatched by the built-in `mxt:cost_type` registry: `mxt:resource`, `mxt:aura`, `mxt:item` and `mxt:js`; the other is the shorthand that writes no `type` and only `id` and `amount`, read as `mxt:resource`. The all-or-nothing semantics of the whole array, the channel rules and the shared evaluation rules are on [Shared Data Types · `Cost`](../shared_data_types.md#cost).

### `mxt:resource`

Spends a data pack value out of the payer's own value account.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | Value ID | **required** | The value to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}
```

### `mxt:aura`

Spends by aura identity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura ID | **required** | The aura identity to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number |

```json
{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}
```

What gets charged depends on the payment channel: when the payer pays, the **value that aura is measured in** is charged (what a payer carries is a value, not an aura); when a shared aura pool or a block's store pays, that aura itself is charged, rounded up to whole units. The difference between the two channels is on [Shared Data Types · `Cost`](../shared_data_types.md#cost).

### `mxt:item`

Spends matching items out of a player's inventory.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **required** | Which items may be spent; see [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **required** | Number of matching items to spend, rounded up; a non-positive or non-finite result means this `Cost` cannot be paid |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

### `mxt:js`

Both the check and the payment go to a server script callback.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback id registered with `MxtCosts.register` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

A script `Cost` is checked and then paid on the server, and it needs a player. The callback receives the payer and `params`, not the ability's formula context, because a `Cost` is evaluated with the payer alone.

**The shorthand without `type`.** An entry in the array may also write only `id` and `amount`, and it is read as `mxt:resource`:

```json
{"id": "example:qi", "amount": 5}
```

That entry is equivalent to `{"type": "mxt:resource", "resource": "example:qi", "amount": 5}`.

The payer is a **living entity** (a player, a mob and a summoned creature all count), not necessarily a player. `mxt:item` needs a player's inventory, so a payer that is not a player (or a formation with no owner) simply **cannot pay** — that is a refusal, not a broken definition; `mxt:js` needs a player and runs **last, after every other channel has finished paying** — a script cost is not staged, so the script has to stay idempotent about it.

A whole array is **all or nothing**: if any one entry cannot be paid, nothing is deducted. Two entries in the same array that point at the same store (the same value written twice, or the same aura written twice) make the definition **fail to load**; a `mxt:resource` entry together with a `mxt:aura` entry measured in that value has the amounts added together, and that is not an error. An entry that cannot be decoded also fails the load; it is never dropped silently.
