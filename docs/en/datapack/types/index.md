---
title: Types Reference
description: How built-in type dispatch works in MiXianTu and where each type family is documented.
---

# Types Reference

This section documents the built-in types that MiXianTu JSON can select through a `type` field, together with the shared data types those types consume.

## How Type Dispatch Works

Actions, conditions, number providers and a number of smaller families are **Java-owned registries of codecs**. The mod registers each entry under an ID such as `mxt:heal` or `mxt:uniform`, and a datapack selects one of those entries by writing a `type` field:

```json
{
  "type": "mxt:heal",
  "amount": 2
}
```

The `type` key is **inlined** into the same JSON object that carries the parameters of that type. There is no wrapper object and no separate parameter section: the discriminator and the fields it selects live side by side.

::: info Datapacks Cannot Add Types
A datapack can only supply `type` and the parameters of an existing type. A data pack never adds entries to these built-in registries, and an unknown `type` ID fails the load. New types must be registered from Java or from a script.
:::

Several families accept a plain JSON **shorthand** for their most common case, which is exactly equivalent to writing the type with its default fields. For example a JSON number is `mxt:constant` and a JSON string is `mxt:expression`, while an item ID such as `"minecraft:apple"` is the item matcher entry `mxt:item`. Where a shorthand exists, the explicit typed object remains valid.

## Dispatched Fields

The following fields use the `MapCodec` of a Java built-in registry. Datapacks can pass `type` and that type's arguments, but cannot introduce a new `type`:

| Data Type | Dispatch Field | Purpose |
|-----------|----------------|---------|
| `Ability` | top-level `type` | The top-level `type` selects the ability lifecycle and trigger style (eleven built-ins, see [Ability Types](./other/ability-and-curse.md#ability-type)); an entry of an artifact's `abilities` writes an ability registry id or a `#ability tag` |
| `CurseType` | `type` | How a curse lasts and expires |
| `EntityAction` | `type` | Entity action |
| `BiEntityAction` | `type` | Bi-entity action |
| `BlockAction` | `type` | Block action |
| `ItemAction` | `type` | Item action |
| `EntityCondition` | `type` | Entity condition |
| `BiEntityCondition` | `type` | Bi-entity condition |
| `BlockCondition` | `type` | Block condition |
| `ItemCondition` | `type` | Item condition |
| `DamageCondition` | `type` | Damage condition |
| `ResourceValueProvider` | `type` | Resource value source read by resource bars and extensions, including environmental and actual aura concentration |
| `ResourceBarRenderer` | `type` | Resource bar renderer |
| `ResourceBarVisibility` | `type` | Resource bar visibility condition |

Action and condition **arrays are shorthand** for "all of them, in order":

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

The concrete fields of every action and condition are defined by its built-in codec. The built-in types are registered in groups by `MxtEntityActions`, `MxtBiEntityActions`, `MxtBlockActions`, `MxtItemActions`, `MxtEntityConditions` and their sibling classes; a data pack does not add entries to any of those registries.

::: info
MiXianTu's number provider registry is its own, keyed `mxt:number_provider_type`, and its ids all carry the `mxt` namespace, such as `mxt:constant` and `mxt:uniform`.
:::

## Action Types

| Action Category | Reference |
|-----------------|-----------|
| Entity Action | [Entity Action Types](./action/entity_action_types.md) |
| Bi-entity Action | [Bi-entity Action Types](./action/bientity_action_types.md) |
| Block Action | [Block Action Types](./action/block_action_types.md) |
| Item Action | [Item Action Types](./action/item_action_types.md) |

## Condition Types

| Condition Category | Reference |
|--------------------|-----------|
| Entity Condition | [Entity Condition Types](./condition/entity_condition_types.md) |
| Bi-entity Condition | [Bi-entity Condition Types](./condition/bientity_condition_types.md) |
| Block Condition | [Block Condition Types](./condition/block_condition_types.md) |
| Item Condition | [Item Condition Types](./condition/item_condition_types.md) |
| Damage Condition | [Damage Condition Types](./condition/damage_condition_types.md) |

## Number Provider Types

Any number that must change with level, realm or event context is a `NumberProvider`. See [Number Provider Types](./number_provider_types.md) for the shorthand forms, the built-in providers and the formula functions, and [Formula Variables](./formula_variables.md) for every variable a formula can read, where it is available and how an unknown name is reported.

## Other Type Families

The remaining built-in families share the same dispatch rules but are small enough to document together. See [Other Type Families](./other_types.md) for the registered IDs and JSON fields of each of them:

- `trigger_type`
- `cost_type`
- `ability_type`
- `data_storage_type`
- `ability_target_selector_type`
- `curse_type`
- `formation_action_type`
- `timeline_entry_type`
- `resource_bar_context`
- `resource_bar_render_data_type`
- `resource_bar_visibility_type`
- `resource_value_provider_type`
- `aura_maximum_type`
- `item_matcher_entry_type`

## Shared Data Types

Complex values that appear in many definitions are documented once in [Shared Data Types](./shared_data_types.md): `Cost`, `ResourceGain`, `AttributeEntry`, the generic holder/tag/matcher syntax, and the `ItemMatcher` entries.

## Registering Custom Types

Custom types are registered in code, never in JSON:

| Extension Route | Reference |
|-----------------|-----------|
| Java registration into the built-in registries | [Registry Guide](../../java/registries.md) |
| Script callbacks through the pre-registered `mxt:js` types | [KubeJS API Reference](../../kubejs/api-reference.md) |

The `mxt:js` entry exists for entity, bi-entity, block and item actions, for entity, bi-entity, block, item and damage conditions, for number providers, resource value providers, trigger matchers, costs, ability target selectors, and for the loot conditions and loot functions MiXianTu adds to vanilla loot tables. Callbacks are registered from `kubejs/server_scripts/`, and a missing callback makes an action do nothing, a condition return `false`, a value resolve to `0`, a cost become unpayable, a trigger never match, a target selector select nobody and a loot function keep the stack, with a warning in the log. Action and condition callbacks also receive the formula context of the dispatch, so a script reads the same event payload a built-in type would.
