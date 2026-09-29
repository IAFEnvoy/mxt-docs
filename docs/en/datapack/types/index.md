---
title: Types Reference
description: How built-in type dispatch works in MiXianTu and where each type family is documented.
---

# Types Reference

Actions, conditions, number providers and the like are **type tables held by the code of the mod**: every entry is registered under an ID, and a data pack writes `type` to pick one.

```json
{
  "type": "mxt:heal",
  "amount": 2
}
```

`type` goes in the object that carries the parameters, level with them, with no extra wrapper around it.

A data pack can **only pick an existing type**, never add one: an unknown `type` fails the load. New types are registered in code or from a script.

Always write `type` with its full ID: the built-in types live in the `mxt:` namespace, so `"and"` is read as `minecraft:and` and the load fails with "no such `type`".

Several families accept **shorthand**: a JSON number is `mxt:constant`, a string is `mxt:expression`, and an item ID such as `"minecraft:apple"` is the matcher entry `mxt:item`. Wherever a shorthand exists, writing the full typed object works just as well.

**One dispatch registry per page, hung under the definition page that writes it**: Ability Types, Ability Target Selector, Data Storage and Mount Renderers are under [`ability`](../json/ability.md); Curse Types under [`curse`](../json/curse.md); Formation Actions under [`formation`](../json/formation.md); Timeline Entries under [`tribulation`](../json/tribulation.md); Secret Realm Generations under [`secret_realm`](../json/secret_realm.md); the four resource bar families (context, renderer, visibility, value source) under [`resource`](../json/resource.md); Aura Maximum under [`aura_zone`](../json/aura_zone.md); Triggers under [`trigger`](../json/trigger.md). Actions, conditions, costs, the item matcher, number providers and formula variables are referenced all over a pack and belong to no single definition, so they stay in this group.

## Dispatched Fields

| Field | Type family | See |
| --- | --- | --- |
| `type` (top level of an ability) | Ability type `mxt:ability_type` | [Ability Types](./other/ability) |
| `render.type` | Mount renderer `mxt:mount_render_type` | [Mount Renderers](./other/mount-render) |
| `type` | Target selector `mxt:ability_target_selector_type` | [Ability Target Selector](./other/ability-selector) |
| `type` | State kind `mxt:data_storage_type` | [Data Storage](./other/data-storage) |
| `type` | Curse type `mxt:curse_type` | [Curse Types](./other/curse) |
| `type` | Trigger `mxt:trigger_type` | [Triggers](./other/trigger-type) |
| `type` | Cost `mxt:cost_type` | [Costs](./other/cost-type) |
| `type` | Formation module `mxt:formation_action_type` | [Formation Actions](./other/formation-action) |
| `type` | Tribulation beat `mxt:timeline_entry_type` | [Timeline Entries](./other/timeline-entry) |
| `type` | Secret realm generation `mxt:secret_realm_generation_type` | [Secret Realm Generations](./other/secret-realm-generation) |
| `type` | Resource value source `mxt:resource_value_provider_type` | [Resource Value Providers](./other/resource-value-provider) |
| `type` | Aura maximum `mxt:aura_maximum_type` | [Aura Maximum](./other/aura-maximum) |
| `context` (ID string) | Resource bar context `mxt:resource_bar_context` | [Resource Bar Contexts](./other/resource-bar-context) |
| `renderer.type` | Resource bar renderer `mxt:resource_bar_render_data_type` | [Resource Bar Renderers](./other/resource-bar-render) |
| `visibility.type` | Resource bar visibility `mxt:resource_bar_visibility_type` | [Resource Bar Visibility](./other/resource-bar-visibility) |
| `type` | Item matcher entry `mxt:item_matcher_entry_type` | [Item Matcher](./other/item-matcher) |
| `type` | Entity action | [Entity Action Types](./action/entity_action_types) |
| `type` | Bi-entity action | [Bi-entity Action Types](./action/bientity_action_types) |
| `type` | Block action | [Block Action Types](./action/block_action_types) |
| `type` | Item action | [Item Action Types](./action/item_action_types) |
| `type` | Entity condition | [Entity Condition Types](./condition/entity_condition_types) |
| `type` | Bi-entity condition | [Bi-entity Condition Types](./condition/bientity_condition_types) |
| `type` | Block condition | [Block Condition Types](./condition/block_condition_types) |
| `type` | Item condition | [Item Condition Types](./condition/item_condition_types) |
| `type` | Damage condition | [Damage Condition Types](./condition/damage_condition_types) |
| `type` | Number provider `mxt:number_provider_type` | [Number Provider Types](./number_provider_types) |
| A name, not a field | Formula variable `mxt:formula_variable` | [Formula Variables](./formula_variables) |

Action and condition **arrays are shorthand** for running all of them, in order:

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

## Shared Data Types

Complex values shared by many fields are documented once in [Shared Data Types](./shared_data_types): `Cost`, `AuraGain`, `AttributeEntry`, icon references, holders and tags, `ItemMatcher`, and formulas.

## Types Handed to Scripts

With a few exceptions every family pre-registers an `mxt:js` type, which is also the only type that hands behaviour to a script. A script registers a callback in `kubejs/server_scripts/` and a data pack refers to it by `id`:

| Dispatch | `mxt:js` fields | Register with |
| --- | --- | --- |
| Entity / bi-entity / block / item action | `id`, `params` | `MxtActions.entity` / `biEntity` / `block` / `item` |
| Entity / bi-entity / block / item / damage condition | `id`, `params` | `MxtConditions.entity` / `biEntity` / `block` / `item` / `damage` |
| Number provider | `id`, `params` | `MxtValues.number` |
| Resource value source | `id`, `params` | `MxtValues.resourceValue` |
| Cost | `id`, `params` | `MxtCosts.register` |
| Trigger | `signal`, `id`, `params` | `MxtTriggers.matcher` |
| Ability target selector | `id`, `params` | `MxtAbilities.selector` |
| Vanilla loot condition / function | `id`, `params` | `MxtLoot.condition` / `MxtLoot.function` |

A `mxt:js` trigger writes one extra field, `signal`: the runtime dispatches by signal layer. Callbacks run on the server. A missing or throwing callback falls back to a safe value each time — an action does nothing, a condition is false, a number resolves to `0`, a cost cannot be paid, a trigger never matches, a selector selects nobody — and logs a warning.

A `Trigger` needs that `signal` because the runtime indexes subscriptions as "signal → owner → subscriber". Apart from `Cost`, every callback also gets the formula context of the dispatch; `Cost` is only ever evaluated for a player, so its context is built from that player alone and carries no event payload. Loot conditions and functions are written inside a vanilla loot table (the `condition` / `function` dispatch keys) and likewise only run on the server while loot is generated.

## Related

- [Ability definition](../json/ability.md) — where an ability's top-level `type` goes and which fields every ability shares
- [Arrays and shorthands](../overview.md) — how action and condition arrays are merged
