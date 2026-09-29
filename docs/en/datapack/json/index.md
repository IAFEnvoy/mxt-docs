---
title: Dynamic Registries
description: All 38 datapack registries with their file directory and purpose, plus the built-in type dispatch table and the KubeJS extension types.
---

# Dynamic Registries

The table below lists the mod's 38 datapack registries. In the field tables, "Default" is the value used when a field is omitted, and "Required" means loading fails without it. The `alchemy_recipe` and `spirit_crafting` rows are not datapack registries but recipe types built on the vanilla recipe system (`mxt:alchemy` and `mxt:spirit_shaped` / `mxt:spirit_shapeless`), listed here so they can be looked up in the same place: their JSON goes in `data/<namespace>/recipe/`, never in `mxt/alchemy_recipe/`. File location, and how to sort JSON into subdirectories by category, is on the [Datapack Development Overview](../overview.md).

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
| `technique` | `mxt/technique` | Cultivation technique definitions: learnable, granting abilities and cultivation modifiers by progression level. |
| `progression` | `mxt/progression` | One level of a progression chain. |
| `cultivation` | `mxt/cultivation` | One cultivation routine: which ambient aura it absorbs, what it does every tick and on a tick that settles, and what it costs and yields. |
| `spirit_herb` | `mxt/spirit_herb` | Spirit herb metadata for existing items. |
| `medicinal_property` | `mxt/medicinal_property` | Medicinal identities: a name and description for one medicinal effect. |
| `alchemy_furnace` | `mxt/alchemy_furnace` | Furnace specifications: slots, per-batch capacity and cooling rate. |
| `alchemy_wall_material` | `mxt/alchemy_wall_material` | Wall materials: the temperature limit of one casing block. |
| `alchemy_recipe` | `recipe` (recipe type `mxt:alchemy`) | Alchemy recipes. |
| `spirit_crafting` | `recipe` (recipe type `mxt:spirit_shaped` / `mxt:spirit_shapeless`) | Spirit crafting recipes, which only run in the Spirit Crafting Table (`mxt:spirit_crafting_table`). |
| `formation` | `mxt/formation` | Formation lifecycle and aura overrides. |
| `tribulation` | `mxt/tribulation` | A tribulation: its start gate, timeline beats, and what happens on success or failure. |
| `creature_profile` | `mxt/creature_profile` | Creature attribute profiles: matching, gates, the inner core, and one action run when the profile is written. |
| `contract_type` | `mxt/contract_type` | Contract lifecycle: conditions on both sides, four actions on the beast side plus three and a grant on the owner side, the signing cost and two caps. |
| `secret_realm` | `mxt/secret_realm` | Secret realm templates: an instance dimension opened on demand for each entry. |
| `currency` | `mxt/currency` | Item currency denominations and exchange. |
| `item_binding` | `mxt/item_binding` | Bindings from existing items to action arrays. |
| `weapon_binding` | `mxt/weapon_binding` | Weapon attributes and actions for existing items. |
| `pill` | `mxt/pill` | What one pill does: the dose action, its toxicity gain, the overdose threshold and what an overdose leaves behind. |
| `pill_binding` | `mxt/pill_binding` | Claims a family of existing items as one pill, with its use cap and cooldown. |
| `technique_binding` | `mxt/technique_binding` | Bindings from existing items to cultivation technique learning. |
| `aura_zone` | `mxt/aura_zone` | Environment aura templates. |
| `block_aura` | `mxt/block_aura` | Aura provided by blocks. |
| `item_aura` | `mxt/item_aura` | Cultivation fuel provided by held items. |
| `quality` | `mxt/quality` | Shared quality: name, colour, three modifiers, a use condition, and where the tier sits on its ladder with what one step up costs. |
| `trigger` | `mxt/trigger` | Event rules: a signal, a condition and an action. |
| `talisman` | `mxt/talisman` | Talisman definitions: the ability one inscribed talisman carries. |

## Built-in Type Dispatch

Plenty of fields pick one entry out of a built-in registry on `type`: the top level of an ability, how a curse persists, the four action families, the five condition families, a resource bar's value source and renderer, a tribulation beat, ability state, and so on. **The full list, the entry page of every family and each family's own default are on the [Type Reference](/en/datapack/types/index)** — type tables live on those pages only.

Action and condition arrays are shorthand for running everything in order:

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

A datapack cannot **add a new `type`** to a built-in registry; it can only pick from the registered ones. `mxt:js` is the only one of them that hands behaviour to a script; its `mxt:js` fields and register methods are on the [Type Reference](/en/datapack/types/index).
