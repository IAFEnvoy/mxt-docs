---
title: Trigger Rule (trigger)
description: "Datapack event rules: a published signal, a condition on its actor, and an action."
aside: false
---

# Trigger Rule (trigger) {#trigger}

File location: `data/<namespace>/mxt/trigger/<path>.json`

A standalone event reaction rule: when a signal is published, every rule whose trigger matches it evaluates its condition against the signal's actor and, if the condition holds, runs its action. It is not attached to any ability, so a content pack can turn any published signal into an effect — for example "add `1` to a resource when a block is broken".

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `Trigger` | **required** | The signal this rule answers, written like an ability trigger: a built-in signal is `{"type": "mxt:block_break"}`, and the scripted matcher (`mxt:js`) can inspect the whole signal. |
| `condition` | `EntityCondition` | `mxt:always` | Evaluated against the signal's actor with the formula context the event provides; an array means all of them have to hold. |
| `action` | `EntityAction` | `mxt:no_op` | Run on that actor once the condition holds; an array runs in order. |
| `chance` | `NumberProvider` | `1` | The probability rolled once each time the signal matches: `≤0` never runs, `≥1` always runs, and anything in between is rolled with the entity's random. |
| `cooldown` | `NumberProvider` | `0` | How many ticks to wait after running before this rule may run again, **recorded on the actor per rule id** (it is saved, and dying does not clear it). `0` means no throttling. |

A rule needs an actor. A signal published without one only reaches subscriptions and never triggers a rule, because the condition and the action both belong to one entity. `chance` and `cooldown` are per actor as well: **when two entities hold the same rule, each rolls its own chance and keeps its own cooldown**. A `chance` that does not resolve to a number (a non-finite value) counts as `1`.

The parent context the condition and the action receive is the event context, so the formula values the publisher wrote into it are readable: a rule answering `mxt:hurt` can size its numbers with `damage`, and a custom signal a script publishes with `MxtTriggers.publish` works the same way.

```json
// data/example/mxt/trigger/qi_from_mining.json
{
  "trigger": {"type": "mxt:block_break"},
  "condition": {"type": "mxt:health", "comparison": ">=", "compare_to": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 1}
}
```

```json
// data/example/mxt/trigger/qi_from_damage.json
{
  "trigger": {"type": "mxt:hurt"},
  "condition": {"type": "mxt:resource_compare", "resource": "example:qi", "min": 10},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": "damage / 2"}
}
```

Rules are indexed by the signal their trigger names while the server cache is built, so publishing a signal costs one lookup. A rule whose action publishes a signal the rule itself answers is skipped while it is running, which keeps it from recursing; a rule that throws is only logged and does not affect the other rules or the subscriptions of that signal.

Subscriptions are indexed in layers — signal → owner → module:identifier: an identifier is unique only inside the entity that holds it, so two entities holding the same definition never displace each other. Publishing first tests the owner for emptiness, then takes that owner's snapshot of subscriptions — a one-shot subscription removes itself while running, which is what the snapshot is for. When the publishing actor is a fake player the whole signal is ignored.

Validation happens while the cache is built and **collects every** problem instead of stopping at the first one: `/mxt registries validate` lists them all at once (each with its `data/<namespace>/mxt/<registry>/<path>` path), and `/mxt trigger rules <signal>` tells you whether a signal has any rule answering it. A rule that declares a `condition` but leaves out `action` counts as a problem too — the default action is a no-op, so such a rule never does anything.

Three things share the word *trigger* and have to be told apart: **a rule** (this page, the datapack registry `mxt/trigger`), **a trigger matcher** (the built-in registry `mxt:trigger_type`, which decides how a signal is matched; the built-ins match by signal type, and `mxt:js` is the other one), and **a signal** (the runtime notification itself, published by the mod for each kind of event and publishable from a script).

## Ported Vanilla Triggers

The second family of matchers carries vanilla's advancement triggers over: each one mirrors one vanilla trigger, keeps the vanilla id, and hands the decision to vanilla's own instance code, so its `conditions` fields are word for word what vanilla writes and a `conditions` block from an advancement can be copied over as it is. Vanilla's `player_killed_entity` writes `entity` and `killing_blow`; here it is the same two fields.

| Signal / `type` | Vanilla trigger | `conditions` fields |
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

Fields such as `player`, `entity` and `victim` keep vanilla's shape: either a list of loot conditions (`[{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {...}}]`, where several entries all have to hold) or a plain entity predicate (`{"type": "minecraft:zombie"}`). Since they are loot conditions, the mod's own conditions fit in them too, for example `{"condition": "mxt:realm", "realm": "mxt:foundation"}`.

What differs from vanilla advancements: these signals are published by the mod's own hooks, so they are **repeatable and runtime only**, and like the built-in signals they serve rules, ability triggers and cultivation breakthrough conditions alike; the criterion vanilla fires at that same moment is a one-shot boolean on one player's one advancement, and it is persisted. A signal is only published for the player it originally served (vanilla's advancement triggers only ever see a `ServerPlayer`), so a field holding an entity predicate always has the context it needs.

Three more differences are about timing:

- `mxt:changed_dimension` is published **before** the transfer (vanilla does its bookkeeping after the transfer is done, and NeoForge only offers the pre-transfer event); `mxt:tame_animal` is published **before** the taming lands (vanilla fires after the tamed flag is written back), so a predicate reading the tame state itself (`nbt`, `flags`) sees the old value.
- `mxt:effects_changed` is published at the end of a tick, so `effects` describes the effect set after the change; several changes in one tick are merged into one.
- `mxt:fishing_rod_hooked` only covers the loot roll (vanilla fires a second time for a hooked entity, and NeoForge has no matching event), and the event carries the hook rather than the rod, so the rod is worked out from the player's hands.

Damage signals publish `damage` for matching and additionally offer `original_damage`, `blocked` (`1`/`0`) and `blocked_damage` to formulas; `mxt:consume_item` offers `use_duration`, and `mxt:levitation` offers `duration` (the ticks it has lasted so far).

Eleven of them are triggers vanilla **polls itself** (a `ServerPlayer` compares something every tick or when it lands), so porting one means copying that comparison, and the cadence matches vanilla: `mxt:location` once every 20 ticks; `mxt:using_item` once per tick while an item is in use; `mxt:levitation` once per tick while the effect lasts; `mxt:ride_entity_in_lava` once per tick after the vehicle enters lava; `mxt:fall_from_height` records where the fall started and publishes on landing; `mxt:fall_after_explosion` asks the same question at the start of the fall and reads the vanilla public fields the mod can read, `currentImpulseImpactPos` and `currentExplosionCause`, so it only holds for an explosion that really carries impulse, such as a wind charge, exactly as in vanilla; `mxt:nether_travel` records the position on entering the nether and publishes on the return to the overworld; `mxt:inventory_changed` and `mxt:slept_in_bed` publish when an inventory slot changes and at the moment sleep starts.

`mxt:enter_block` is the one **approximation** in this family: vanilla tests the **path of movement** of that tick against the inside shape of blocks, which is why standing still in water repeats every tick; the mod tests the blocks the player's collision box has **newly** covered — fluids count, grass and torches that have no collision do not. Walking in is the same moment, but standing still does not repeat. For a continuous effect use `mxt:tick`, or add a cooldown.

`mxt:filled_bucket` watches for an empty bucket being replaced by a non-empty item, and `mxt:item_durability_changed` for the damage value of one item going up (a repair does not fire, as in vanilla). The decision still runs vanilla's instance, which is handed the stack **as it was before the change**, so under vanilla's algorithm a damage taken comes out as a negative `delta` (write `{"max": -1}`), and `durability` is the **remaining** durability after the change. The price is that these two are **wider** than vanilla: taking a filled bucket out of a chest, or changing the inventory with a command, also counts as a bucket having been filled.

Two more vanilla triggers are **deliberately not ported**: `summoned_entity` needs to know who placed the block, which only exists inside the block code (`FinalizeSpawnEvent` and `BlockEvent.EntityPlaceEvent` each hold half of it, and joining the two would credit the wrong player), and the player that caused a `cured_zombie_villager` is `ZombieVillager`'s private `conversionStarter` field, which `LivingConversionEvent` does not expose.
