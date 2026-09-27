---
title: Dynamic Registries
description: The mods 35 datapack registries with their file directory and purpose, plus the built-in type dispatch table and the KubeJS extension types.
---

# Dynamic Registries

The table below lists the mod's 35 datapack registries. In the field tables, "Default" is the value used when a field is omitted, and "Required" means loading fails without it. The `alchemy_recipe` and `spirit_crafting` rows are not datapack registries but recipe types built on the vanilla recipe system, listed here so they can be looked up in the same place. File location, and how to sort JSON into subdirectories by category, is on the [Datapack Development Overview](../overview.md).

| Registry | Directory | Purpose |
| --- | --- | --- |
| `resource` | `mxt/resource` | Entity resources such as cultivation progress, spirit power and stamina, plus inline resource bars. |
| `artifact` | `mxt/artifact` | Artifacts: which existing items they claim, how much of each aura they store, and which abilities they offer. |
| `aura` | `mxt/aura` | An aura definition for one value: element marks, the realm chain entry, regeneration and conversion. |
| `realm_stage` | `mxt/realm_stage` | Linear realm chains and breakthrough. |
| `element` | `mxt/element` | Element relations and counter multipliers: `overcomes`, `adapted_to`, the claimed damage types and the display colour. |
| `element_reaction` | `mxt/element_reaction` | The reaction fired once element accumulation meets its requirement. |
| `spirit_root` | `mxt/spirit_root` | A spirit root bound to one or more elements: cultivation multiplier, affinity multiplier, granted abilities and exclusivity. |
| `physique` | `mxt/physique` | Physique bonuses independent of elements: vanilla attributes, granted abilities and damage multipliers. |
| `ability` | `mxt/ability` | Active, passive and triggered abilities. |
| `curse` | `mxt/curse` | Curse definitions and duration types that several modules can reference. |
| `forging_method` | `mxt/forging_method` | A single forging strike method. |
| `forging_blueprint` | `mxt/forging_blueprint` | Forging targets and quality settlement. |
| `tool_binding` | `mxt/tool_binding` | Claims tool items and lists the forging methods they unlock. |
| `blueprint_binding` | `mxt/blueprint_binding` | Claims blueprint items and lists the forging blueprints they offer. |
| `technique` | `mxt/technique` | Cultivation technique definitions: learnable, granting abilities and cultivation modifiers by level. |
| `skill_stage` | `mxt/skill_stage` | One level of a skill mastery chain. |
| `cultivate_action` | `mxt/cultivate_action` | One cultivation routine: which ambient aura it absorbs, what it does every tick, and what it costs and yields. |
| `spirit_herb` | `mxt/spirit_herb` | Spirit herb metadata for existing items. |
| `alchemy_recipe` | `recipe` (recipe type `mxt:alchemy`) | Alchemy recipes. |
| `spirit_crafting` | `recipe` (recipe type `mxt:spirit_shaped` / `mxt:spirit_shapeless`) | Spirit crafting recipes, which only run in the Spirit Crafting Table (`mxt:spirit_crafting_table`). |
| `formation` | `mxt/formation` | Formation lifecycle and aura overrides. |
| `tribulation` | `mxt/tribulation` | A tribulation: its start gate, timeline beats, and what happens on success or failure. |
| `creature_profile` | `mxt/creature_profile` | Creature attribute profiles: matching, gates, the inner core, and one action run when the profile is written. |
| `contract_type` | `mxt/contract_type` | Contract lifecycle: conditions on both sides, actions at four moments, the signing cost and two caps. |
| `secret_realm` | `mxt/secret_realm` | Secret realm templates: an instance dimension opened on demand for each entry. |
| `currency` | `mxt/currency` | Item currency denominations and exchange. |
| `item_binding` | `mxt/item_binding` | Bindings from existing items to action arrays. |
| `weapon_binding` | `mxt/weapon_binding` | Weapon attributes and actions for existing items. |
| `pill_binding` | `mxt/pill_binding` | Pill and pill toxicity rules for existing items. |
| `technique_binding` | `mxt/technique_binding` | Bindings from existing items to cultivation technique learning. |
| `aura_zone` | `mxt/aura_zone` | Environment aura templates. |
| `block_aura` | `mxt/block_aura` | Aura provided by blocks. |
| `item_aura` | `mxt/item_aura` | Cultivation fuel provided by held items. |
| `quality` | `mxt/quality` | Shared quality: name, colour, three modifiers and a use condition. |
| `quality_chain` | `mxt/quality_chain` | Quality chains: the tier list from low to high, the default tier, and the cost and condition of each upgrade step. |
| `trigger` | `mxt/trigger` | Event rules: a signal, a condition and an action. |
| `talisman` | `mxt/talisman` | Talisman definitions: the ability one inscribed talisman carries. |

## Built-in Type Dispatch

The types of the following fields are dispatched by built-in registries on `type`. The "Where It Is Written" column is the spot in a datapack where these `type` values show up. A datapack can only pass `type` and that type's arguments; it cannot add a new `type`:

| Where It Is Written | Dispatch Field | Purpose |
| --- | --- | --- |
| Top level of `mxt:ability` | `type` (top-level field) | The top-level `type` selects an ability's lifecycle and trigger style, fourteen in all (`empty`, `active`, `triggered`, `modifier`, `aura`, `interval`, `channelled`, `targeted`, `composite`, `word`, `mount`, `flight_control`, `storage`, `upkeep`); an entry in an artifact's `abilities` writes an ability registry id or a `#ability tag`, see [Ability](./ability.md#ability-types). |
| `mxt:curse`'s `type` | `type` | How a curse persists and expires. |
| Each entry of an `entity_action` field | `type` | Entity actions. |
| Each entry of a `bi_entity_action` field | `type` | Bi-entity actions. |
| Each entry of a `block_action` field | `type` | Block actions. |
| Each entry of an `item_action` field | `type` | Item actions. |
| Each entry of a `condition` field | `type` | Entity conditions. |
| Each entry of a `bi_entity_condition` field | `type` | Bi-entity conditions. |
| Each entry of a `block_condition` field | `type` | Block conditions. |
| Each entry of an `item_condition` field | `type` | Item conditions. |
| Each entry of a `damage_condition` field | `type` | Damage conditions. |
| Value source of a resource bar field | `type` | Resource value sources read by resource bars and extensions, covering the environment and the actual aura concentration. |
| Resource bar renderer | `type` | Resource bar renderers. |
| Resource bar visibility condition | `type` | Resource bar visibility conditions. |
| One entry of a tribulation timeline | `type` | One beat of a tribulation timeline: run an action, idle for a duration, or wait for a condition to hold. |
| Ability state | `type` | The state kinds an ability can store: cooldown, charges, toggle, duration and so on. An ability's `type` decides which ones it needs. |

Action and condition arrays are shorthand for running everything in order:

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

Each type's concrete fields follow its own entry, see the [action and condition type pages](/en/datapack/types/index). These built-in types are registered by the mod; a datapack never adds entries to them.

### KubeJS Extension Type `mxt:js`

Every dispatch below pre-registers one `mxt:js` type: once a script registers a callback under `kubejs/server_scripts/`, a datapack can reference it by `id`. When the callback is missing or throws, each one falls back to a safe default and logs a warning rather than failing the load.

| Dispatch | `mxt:js` Fields | Register Method |
| --- | --- | --- |
| `EntityAction` / `BiEntityAction` / `BlockAction` / `ItemAction` | `id`, `params` | `MxtActions.entity` / `biEntity` / `block` / `item` |
| `EntityCondition` / `BiEntityCondition` / `BlockCondition` / `ItemCondition` / `DamageCondition` | `id`, `params` | `MxtConditions.entity` / `biEntity` / `block` / `item` / `damage` |
| `NumberProvider` | `id`, `params` | `MxtValues.number` |
| `ResourceValueProvider` | `id`, `params` | `MxtValues.resourceValue` |
| `Cost` | `id`, `params` | `MxtCosts.register` |
| `Trigger` | `signal`, `id`, `params` | `MxtTriggers.matcher` |
| `TargetSelector` | `id`, `params` | `MxtAbilities.selector` |
| Vanilla loot condition / loot function | `id`, `params` | `MxtLoot.condition` / `MxtLoot.function` |

A `Trigger`'s `mxt:js` must also declare `signal`, because the runtime dispatches through a layered index of signal → owner → subscriber. All `mxt:js` callbacks run on the server. Apart from `Cost`, every callback receives the formula context of the current dispatch; `Cost` is evaluated from a player alone, so its context is built from that player and carries no event payload. Loot conditions and functions are written in vanilla loot tables (the `condition` / `function` dispatch keys) and likewise only run on the server while loot is being generated.

A datapack cannot **add a new `type`** to a built-in registry; it can only pick from the registered ones. `mxt:js` is the only one of them that hands behaviour to a script.
