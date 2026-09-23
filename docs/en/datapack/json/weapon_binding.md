---
title: Weapon Binding (weapon_binding)
description: "Adds weapon attack damage, attack speed, attributes and combat actions to an existing item through the mxt:weapon_binding datapack registry."
aside: false
---

# Weapon Binding (weapon_binding)

A weapon binding maps one existing item to weapon-only fields. Like every other binding it only matches already registered items, so the physical weapon must come from Minecraft, a content mod, or KubeJS. Weapon bindings provide attack damage, attack speed and vanilla attribute modifiers, together with use, attack and tick actions; these fields are not mixed with the item, pill or technique bindings.

## File Location

Weapon binding JSON files go in `data/<namespace>/mxt/weapon_binding/` within your data pack.

**Purpose**: Weapon attributes and actions for existing items.

The filename corresponds to its ID. For example, `data/example/mxt/weapon_binding/firebound_sword.json` has the ID `example:firebound_sword`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Matches existing weapon items |
| `attack_damage` | `NumberProvider` | `0` | The attack damage granted by the binding |
| `attack_speed` | `NumberProvider` | `0` | The attack speed granted by the binding |
| `attributes` | `List<AttributeEntry>` | `[]` | Additional vanilla attribute modifiers; an optional `value` updates the item's attribute component every tick |
| `use_action` | `EntityAction` | `mxt:no_op` | The right-click use action |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | The action executed on a successful hit |
| `tick_action` | `EntityAction` | `mxt:no_op` | The action executed while the weapon is held in the main hand |
| `quality_group` | `Tag<item_quality>` | none | The allowed quality group |
| `conditions` | `EntityCondition[]` | `[]` | The conditions checked before use, attack and attribute application; supports inline conditions or described condition objects |
| `element` | `HolderOrTag<element>[]` | `[]` | What this weapon **is made of**: an entry names one element and a `#tag` names a set of them. This is the first source of "the element of an item", explained below. |
| `attachment_multiplier` | Double | `1.0` | What this weapon is worth as a ward: while it is carried (both hands and the Curios slots), every strike that leaves an element on the carrier leaves this fraction of it — `0.5` for half, `0` for none. Several carried items multiply, and the default is a no-op. See the buildup step on [The damage system](/en/technical/damage). |

**The element of an item** has exactly one reading, which asks two questions in order. First the **declarations**: whichever of `weapon_binding`, [item_binding](./item_binding.md) or [artifact](./artifact.md) claims the stack and writes `element` (the three registries are unioned, tags expand to every element they hold, and anything disabled by `mxt:disabled` is left out). Only when none of them declares anything does it read the **aura the item carries**: the single aura in its `mxt:spirit_storage`, or — for a store that is empty or names several — the aura its `mxt:item_aura` definition declares, and then that aura's `aura_type`. The `mxt:item_element` condition is this same reading.

### `items`

The `items` matcher accepts one item ID, one item tag (such as `"#example:fire_weapons"`), or a mixed array of both; one binding can therefore cover many physical weapons. Any array entry may also be written as a typed object dispatched by the built-in `item_matcher_entry_type` registry (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:herb_tag` and the `mxt:spirit_storage` capability matcher); see [Shared Data Types](../types/shared_data_types.md) for the entry types. When multiple bindings match an item, the matcher selects the definition with the lowest `priority` first, and all four binding types currently use priority `0`.

### `attributes`

Each entry uses the vanilla `AttributeModifier` shape: `attribute`, `id`, `amount` and `operation`, plus an optional dynamic `value` formula. An entry that declares `value` is recalculated on the server every tick from the entity context and replaces `amount`. The weapon's own `attack_damage` and `attack_speed` are installed as main-hand `ADD_VALUE` modifiers on top of the item's existing ones, so an item whose binding conditions or quality gate currently fail keeps its vanilla attributes. See [Shared Data Types](../types/shared_data_types.md).

### `quality_group`

`quality_group` must be a native item-quality tag reference prefixed with `#`. Its `values` order defines the group's quality order. When no explicit `mxt:item_quality` component or forge result exists, the last member not disabled by the `mxt:disabled` tag becomes the default quality.

The weapon cannot be used when its current quality is outside the group, the group has no usable member, a binding condition fails, or the quality's own `condition` fails. See [Item Quality](./item_quality.md).

### `conditions`

`conditions` is optional. Each entry may be an inline `EntityCondition`, or an object with `condition` and an optional translation-key `description`. Described entries are shown in the item tooltip with a green `✓` when true or a red `✗` when false. The check blocks right-click use, block interaction, attacks, weapon tick effects, and binding-added weapon attributes.

## Example

```json
// data/example/mxt/weapon_binding/firebound_sword.json
{
  "items": ["kubejs:firebound_sword", "#example:fire_weapons"],
  "attack_damage": 8,
  "attack_speed": -2.4,
  "quality_group": "#example:group/firebound_weapon",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}],
  "use_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 5},
  "attack_action": {"type": "mxt:target_action", "action": {"type": "mxt:damage", "amount": 3}},
  "tick_action": {"type": "mxt:no_op"}
}
```

The behaviour ids used by `use_action` and `tick_action` come from the [Entity Action Types](../types/action/entity_action_types.md) list, `attack_action` uses the [BiEntity Action Types](../types/action/bientity_action_types.md) list, and the condition ids come from the [Entity Condition Types](../types/condition/entity_condition_types.md) list.

