---
title: JSON Data Formats
description: Reference for every JSON datapack registry provided by MiXianTu, including its file path and purpose.
---

# JSON Data Formats

This section documents the JSON format of every datapack registry the mod provides. Definitions are plain JSON files loaded by the vanilla datapack registry system and become immutable after loading. Basic value shapes shared by all definitions are listed in [Shared Data Types](../types/shared_data_types.md).

The pages are sorted by registry id and each title carries that id in parentheses, so the sidebar can be read as a lookup list: finding `mxt:item_binding` in a datapack leads to [Item Binding (item_binding)](./item_binding.md).

## File Paths

Definition files go in `data/<namespace>/mxt/<registry>/` within your datapack:

```text
data/<namespace>/mxt/<registry>/<path>.json
```

The filename corresponds to the entry ID. For example, `data/example/mxt/ability/fireball.json` has the ID `example:fireball`.

Tags use the vanilla tag directory:

```text
data/<namespace>/tags/mxt/<registry>/<name>.json
```

Every registry also supports the `mxt:disabled` tag. Because the tag id itself is `mxt:disabled`, the file always lives in the `mxt` namespace:

```text
data/mxt/tags/mxt/<registry>/disabled.json
```

::: info Disabling entries
Entries listed in `disabled` are not used by the corresponding service, but they stay in the registry, so other definitions can safely hold their `Holder`. Tag value order is never gameplay order; quality order is handled by the quality reading interface through the vanilla tag order.
:::

## Registries

The table below lists the 34 datapack registries the mod registers, in registry id order, plus the two recipe types documented in this section. `mxt:alchemy`, `mxt:spirit_shaped` and `mxt:spirit_shapeless` are vanilla recipe types rather than datapack registries, and are listed here because their JSON is documented in this section too.

| Registry | Directory | Purpose |
|----------|-----------|---------|
| [`ability`](./ability.md) | `mxt/ability` | Active, passive and triggered abilities. |
| [`alchemy_recipe`](./alchemy_recipe.md) | `recipe` | Vanilla recipe type (`mxt:alchemy`), not a datapack registry. |
| [`aura`](./aura.md) | `mxt/aura` | The aura identity of one stored value: what it is, its realm chain entry, regeneration, conversions and availability. |
| [`aura_zone`](./aura_zone.md) | `mxt/aura_zone` | Environment aura templates. |
| [`block_aura`](./block_aura.md) | `mxt/block_aura` | Aura provided by blocks. |
| [`blueprint_binding`](./blueprint_binding.md) | `mxt/blueprint_binding` | Forging blueprints provided by blueprint items. |
| [`contract_type`](./contract_type.md) | `mxt/contract_type` | Contract lifecycle. |
| [`creature_profile`](./creature_profile.md) | `mxt/creature_profile` | Creature profiles and entity binding conditions. |
| [`cultivate_action`](./cultivate_action.md) | `mxt/cultivate_action` | The cultivation process and its environment requirements. |
| [`currency`](./currency.md) | `mxt/currency` | Item currency denominations and exchange. |
| [`curse`](./curse.md) | `mxt/curse` | Curse definitions that can be referenced. |
| [`element`](./element.md) | `mxt/element` | Element relations (`overcomes`/`adapted_to`), what each relation is worth in damage, the damage types the element claims (`damage_types`), its accumulation numbers, and its display colour; an aura points at one through its `aura_type`. |
| [`element_reaction`](./element_reaction.md) | `mxt/element_reaction` | What happens once enough of an element has accumulated on a body: the demand, what it consumes and the action it runs. |
| [`forging_blueprint`](./forging_blueprint.md) | `mxt/forging_blueprint` | Forging targets and quality settlement. |
| [`forging_method`](./forging_method.md) | `mxt/forging_method` | A single forging strike method. |
| [`formation`](./formation.md) | `mxt/formation` | Formation lifecycle and aura overrides. |
| [`item_archetype`](./item_archetype.md) | `mxt/item_archetype` | Artifact archetypes and abilities. |
| [`item_aura`](./item_aura.md) | `mxt/item_aura` | Cultivation fuel provided by held items. |
| [`item_binding`](./item_binding.md) | `mxt/item_binding` | Bindings from existing items to action arrays. |
| [`item_quality`](./item_quality.md) | `mxt/item_quality` | Shared quality and quality conditions. |
| [`physique`](./physique.md) | `mxt/physique` | Physique bonuses that are independent of elements. |
| [`pill_binding`](./pill_binding.md) | `mxt/pill_binding` | Pill and pill toxicity rules for existing items. |
| [`realm_instance`](./realm_instance.md) | `mxt/realm_instance` | Realm templates: instance dimension generation, borders, structures, landing points, claiming and the entry and exit rules. |
| [`realm_stage`](./realm_stage.md) | `mxt/realm_stage` | Linear realm chains and breakthrough. |
| [`resource`](./resource.md) | `mxt/resource` | Entity resources such as cultivation progress, spirit power and stamina, plus inline resource bars. |
| [`skill_stage`](./skill_stage.md) | `mxt/skill_stage` | One level of a skill mastery chain. |
| [`spirit_crafting`](./spirit_crafting.md) | `recipe` | Vanilla recipe types (`mxt:spirit_shaped`, `mxt:spirit_shapeless`), not a datapack registry. |
| [`spirit_herb`](./spirit_herb.md) | `mxt/spirit_herb` | Spirit herb metadata for existing items. |
| [`spirit_root`](./spirit_root.md) | `mxt/spirit_root` | A spirit root bound to a single element. |
| [`talisman`](./talisman.md) | `mxt/talisman` | Talisman definitions: the abilities one inscribed talisman carries. |
| [`technique`](./technique.md) | `mxt/technique` | Cultivation technique definitions: learnable, granting abilities and cultivation modifiers by level. |
| [`technique_binding`](./technique_binding.md) | `mxt/technique_binding` | Bindings from existing items to cultivation technique learning. |
| [`tool_binding`](./tool_binding.md) | `mxt/tool_binding` | Forging methods provided by tool items. |
| [`tribulation`](./tribulation.md) | `mxt/tribulation` | A tribulation: its start gate, the timeline it consumes, and its two endings. |
| [`trigger`](./trigger.md) | `mxt/trigger` | Datapack event rules: a signal, a condition and an action. |
| [`weapon_binding`](./weapon_binding.md) | `mxt/weapon_binding` | Weapon attributes and actions for existing items. |

::: info Removed registries
`title` and `badge` once existed as reserved registries with a data structure but no gameplay consumer. Both have been **removed completely**: they are not registered, nothing reads them, and leftover `mxt/title` or `mxt/badge` files in a datapack are ignored without an error. Likewise, the registry that used to be called `mxt:cultivation` is now `mxt:aura`.

`sect` was removed as well: it defined a rank ladder, contribution tasks and contribution exchanges, but nothing in the mod ever granted membership (`SectService.join` had no production caller), so the whole subsystem — registry, runtime service, attachments, territory protection, `/mxt sect claim|release` and the KubeJS `sect` event group — was deleted. Leftover `mxt/sect` files are ignored without an error. A content pack that wants sects must build them on the generic pieces (`TokenComponent`, the currency tables, KubeJS callbacks) or on an external team/claims mod.
:::

## Built-in Type Dispatch

The following fields use `MapCodec`s from Java built-in registries. A datapack may only supply the `type` and the parameters of that type; datapacks cannot add new `type` values.

| Data Type | Dispatch Field | Purpose |
|-----------|----------------|---------|
| `Ability` | `ability.type` | The top-level field is named `ability`; the `type` inside that nested object selects the ability lifecycle and trigger style. |
| `CurseType` | `type` | How a curse persists and expires. |
| `EntityAction` | `type` | Entity actions. |
| `BiEntityAction` | `type` | Bi-entity actions. |
| `BlockAction` | `type` | Block actions. |
| `ItemAction` | `type` | Item actions. |
| `EntityCondition` | `type` | Entity conditions. |
| `BiEntityCondition` | `type` | Bi-entity conditions. |
| `BlockCondition` | `type` | Block conditions. |
| `ItemCondition` | `type` | Item conditions. |
| `DamageCondition` | `type` | Damage conditions. |
| `ResourceValueProvider` | `type` | Resource value sources read by resource bars and extensions, including environment and actual aura concentration. |
| `ResourceBarRenderer` | `type` | Resource bar renderers. |
| `ResourceBarVisibility` | `type` | Resource bar visibility conditions. |

Action and condition arrays are shorthand: every element is executed in order, and an array of conditions means that all of them must be satisfied.

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

The concrete fields of every action follow the built-in type codecs. Built-in types are registered in groups by classes such as `MxtEntityActions`, `MxtBiEntityActions`, `MxtBlockActions`, `MxtItemActions` and `MxtEntityConditions`; a data pack never adds entries to these built-in registries.

See the [type reference](../types/index.md) for the available action and condition types, and [Datapack Overview](../overview.md) for loading, overriding, reference and disabled-tag rules. Advancements and loot tables are plain vanilla JSON rather than datapack registries; the types the mod adds for them are in [Loot and Advancement Criteria](../loot-and-criteria.md).
