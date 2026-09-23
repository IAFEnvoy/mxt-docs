---
title: Trigger Rule (trigger)
description: "Datapack event rules: react to a published signal by running a condition and an action on its actor."
aside: false
---

# Trigger Rule (trigger)

A `trigger` entry is a standalone event reaction. When a signal is published, every rule whose trigger matches it evaluates its condition against the actor and, if the condition holds, runs its action. That is the whole feature: no ability has to own the reaction, so a content pack can turn any published signal into an effect — for example "when a block is broken, add `1` to a resource".

::: info Trigger rules, trigger matchers and signals
Three things share the word *trigger* and they are not the same thing:

- **A rule** (this page, `mxt/trigger`) is data: signal matcher + condition + action.
- **A trigger matcher** is the intrinsic [`mxt:trigger_type`](../../java/registries.md) registry: how a signal is matched. The built-in matchers are one per signal (`mxt:tick`, `mxt:attack`, `mxt:block_break`, …) and `mxt:js` lets a script match anything it likes. Abilities use the same matchers for the triggers they own.
- **A signal** is the runtime notification itself. MiXianTu publishes one per event (`mxt:tick`, `mxt:hurt`, `mxt:breakthrough`, …) and scripts can publish their own through the KubeJS runtime API.
:::

## File Location

Trigger rule files go in `data/<namespace>/mxt/trigger/` within your datapack.

**Purpose**: Datapack event rules: a signal, a condition and an action.

The filename corresponds to its ID. For example, `data/example/mxt/trigger/qi_from_mining.json` has the ID `example:qi_from_mining`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `trigger` | `Trigger` | **required** | Which signal this rule reacts to, written like an ability trigger: `{"type": "mxt:block_break"}` for a built-in signal, or a scripted matcher that inspects the whole signal. |
| `condition` | `EntityCondition` | `mxt:always_true` | Evaluated against the signal's actor with the event's formula context. One condition or an array, which requires all of them. |
| `action` | `EntityAction` | `mxt:no_op` | Runs for the actor once the condition holds. One action or an array, which runs in order. |

A rule needs an actor. Signals published without one reach subscriptions but never a rule, because both the condition and the action belong to one entity.

The condition and the action receive the event context as their parent context, so the formula values the publisher put into it are readable: a rule reacting to `mxt:hurt` can size its effect with `damage`, and a script that publishes a custom signal with `MxtTriggers` can read its own payload the same way.

## Example

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

## Ported Vanilla Triggers

A second family of matchers carries vanilla's own advancement triggers: each one mirrors one vanilla trigger and keeps its id, and **the decision is made by vanilla's own instance code, so the `conditions` fields are word for word the ones vanilla writes** — a `conditions` object copied out of an advancement works here unchanged. Where vanilla's `player_killed_entity` takes `entity` and `killing_blow`, so does `mxt:player_killed_entity`.

| Signal / `type` | Vanilla trigger | `conditions` fields |
|-----------------|-----------------|---------------------|
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

Fields like `player`, `entity` and `victim` keep vanilla's shape: either a list of loot conditions (`[{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {...}}]`, all of which must hold) or a plain entity predicate (`{"type": "minecraft:zombie"}`). Since they are loot conditions, MiXianTu's own conditions work inside them too, for example `{"condition": "mxt:realm", "realm": "mxt:foundation"}`.

Two differences from vanilla advancements are deliberate, three are a matter of timing:

- MiXianTu's own hooks publish these signals, so they are **repeatable and runtime only**, and like the built-in signals they serve rules, ability triggers and breakthrough conditions alike. The criterion vanilla fires at the same moment is a one-shot boolean owned by one player and one advancement, and it is persisted.
- A signal is published for the player vanilla would have called with (vanilla's advancements only ever see `ServerPlayer`), so a field that describes an entity always has the context it needs to be evaluated.
- `mxt:changed_dimension` is published **before** the transfer, because NeoForge only offers the pre-transfer event while vanilla does its bookkeeping afterwards; `mxt:tame_animal` is published **before** the taming is written back, so a predicate reading the tamed flag itself (`nbt`, `flags`) sees the old value.
- `mxt:effects_changed` is published at the end of the tick, so `effects` describes the set after the change; several changes in one tick are reported once.
- `mxt:fishing_rod_hooked` only covers the loot roll — vanilla fires a second time for a hooked entity and NeoForge has no event for it — and the event names the hook rather than the rod, so the rod is looked for in the player's hands.

The damage signals publish `damage` for matching and additionally offer `original_damage`, `blocked` (`1`/`0`) and `blocked_damage` to formulas; `mxt:consume_item` offers `use_duration` and `mxt:levitation` offers `duration` (the ticks it has lasted).

Eleven of them are triggers vanilla itself polls - `ServerPlayer` compares something every tick or when a fall starts - so they are ported by copying that comparison and keep vanilla's cadence: `mxt:location` once every 20 ticks; `mxt:using_item` once per tick while an item is in use; `mxt:levitation` once per tick while the effect lasts; `mxt:ride_entity_in_lava` once per tick while the vehicle is in lava; `mxt:fall_from_height` records where the fall started and reports it on landing; `mxt:fall_after_explosion` asks the same question when the fall starts and reads vanilla's public `currentImpulseImpactPos` and `currentExplosionCause`, so like vanilla it only answers for real impulses such as a wind charge; `mxt:nether_travel` records where the nether was entered and reports the trip back to the overworld; `mxt:inventory_changed` reports the slots that differ from the previous tick; `mxt:slept_in_bed` reports the moment sleep starts.

`mxt:enter_block` is the one approximation in that family: vanilla tests the blocks the movement of that tick passed through - which is why standing still in water keeps firing - while this reports the blocks the player's box started overlapping (fluids count, blocks without collision of their own such as grass or a torch do not). Walking into something is the same moment, but standing still does not repeat; use `mxt:tick` or a cooldown when a continuous effect is wanted.

The last two are recognised from that same inventory comparison: `mxt:filled_bucket` is an empty bucket being replaced by a non-empty item, and `mxt:item_durability_changed` is the damage value of one item going up (a repair does not fire, exactly as in vanilla). The decision still runs vanilla's instance, which is handed the stack **as it was**: that is why a damage taken shows up as a negative `delta` (`{"max": -1}`) and `durability` is the **remaining** durability after the change. The price is that these two are wider than vanilla - taking a filled bucket out of a chest, or editing the inventory with a command, looks the same as filling one.

Two vanilla triggers are deliberately left out: `summoned_entity` needs the player who placed the last block, which only exists inside the block code (`FinalizeSpawnEvent` and `BlockEvent.EntityPlaceEvent` each hold half of it, and joining them would credit the wrong player), and `cured_zombie_villager` names its cause in `ZombieVillager`'s private `conversionStarter` field, which `LivingConversionEvent` does not expose.

::: info How a rule is dispatched
Rules are indexed by the signal their trigger names while the server cache is built, so publishing a signal costs one map lookup and rules of other signals are not touched. A rule that publishes a signal its own action reacts to is skipped while it is already running, which keeps a self-triggering rule from recursing; a rule that throws is logged and does not stop the other rules or the subscriptions of that signal.

Subscriptions — the same signals waited for by an ability, by a breakthrough condition or by a server script — are indexed per owner as well, so two entities that hold the same definition never displace each other's subscription.
:::

::: tip Checking a rule without waiting for the event
`/mxt registries validate` lists every problem the last build found, each naming the file it comes from, and a rule that declares a `condition` but forgets its `action` is one of them — the default action does nothing, so such a rule could never react. `/mxt trigger rules <signal>` shows which rules answer a signal, and `/mxt trigger publish <signal>` fires one by hand.
:::

::: tip Adding a resource is not the only action
`action` is the shared entity action list, so a rule can grant an ability, apply a curse, play a sound, run a sequence, or use `mxt:chance` and `mxt:if_else` to make the reaction conditional. See [Entity Action Types](../types/action/entity_action_types.md).
:::

::: tip Growing a technique's mastery
A rule is the natural place to grow the resource a [cultivation technique](./technique.md#advancement) measures its mastery with — that is what makes the technique advance without any code. The reverse direction works too: a technique that reaches a new level publishes `mxt:technique_stage`, so a rule can react to the promotion itself, with `stage` (the rank reached) available as a formula value.
:::

