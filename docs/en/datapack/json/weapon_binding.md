---
title: Weapon Binding (weapon_binding)
aside: false
---

# Weapon Binding (weapon_binding) {#weapon_binding}

File location: `data/<namespace>/mxt/weapon_binding/<path>.json`

A weapon binding gives **items that are already registered** a set of weapon attributes and behaviours: `attributes` are the vanilla attribute modifiers it contributes, and the three actions are right-click, hit and held-tick. It creates no items and replaces none of the item's own numbers.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | item ID, `#tag` or a mixed array | **required** | Which weapon items this definition claims; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). |
| `priority` | Int | `0` | When several definitions of the same kind match the same item, the larger number goes first (see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher)); equal numbers fall back to registry order. |
| `attributes` | `AttributeEntry[]` | `[]` | The vanilla attribute modifiers this weapon contributes; an optional `value` updates the item's attribute component every tick. **A weapon's own attack damage and attack speed go here too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`). |
| `use_action` | `EntityAction` | `mxt:no_op` | Right-click use behaviour. |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | Behaviour on a hit. |
| `tick_action` | `EntityAction` | `mxt:no_op` | Held-tick behaviour. |
| `conditions` | `EntityCondition[]` | `[]` | Conditions checked before use, attacks and attribute application; supports inline conditions or described condition objects. |
| `element` | element ID or `#element tag`, an array is allowed | `[]` | What element this weapon **is**: one entry is one element, a `#` tag is a set of them. The `mxt:element` component on the stack is unioned with it. |

**A weapon's own attack damage and attack speed go in `attributes` too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`): they are **added on top of** the modifiers the item already ships with and **never replace** the item's own numbers. If you want "this weapon's base damage is exactly 8", change the item's own `minecraft:attribute_modifiers` (recipe components, `mxt:merge_components` or KJS), or start from a base item that carries no attack modifiers at all. Each entry says which attribute it belongs to, which vanilla modifier it uses and how much it moves the number; the modifier itself uses the vanilla attribute modifier shape.

```json
// data/example/mxt/weapon_binding/frost_blade.json
{
  "items": "example:frost_blade",
  "attributes": [
    {
      "attribute": "minecraft:attack_damage",
      "id": "example:frost_blade/damage",
      "amount": 5,
      "operation": "add_value"
    },
    {
      "attribute": "minecraft:attack_speed",
      "id": "example:frost_blade/speed",
      "amount": -1.5,
      "operation": "add_value"
    }
  ],
  "attack_action": {"type": "mxt:no_op"},
  "element": ["mxt:water"]
}
```

**A weapon has exactly two components**: `mxt:quality` (single value — a **whole quality object**: written on a stack it wins, and it brings the ladder its own tier belongs to) and `mxt:element` (a list — unioned with what the definition declares). `attributes`, the three actions (`use_action` / `attack_action` / `tick_action`) and `conditions` **exist only in a definition**: for a stack whose numbers you want to change, write the vanilla `minecraft:attribute_modifiers` (KubeJS or recipe components), or write a definition for it and name that stack through `items`.

**The element of an item** has exactly one reading, which asks two things in order: first the **declarations** — the `mxt:element` component on the stack, plus whichever of `weapon_binding`, [item_binding](./item_binding.md) or [artifact](./artifact.md) claims this stack and whether it writes `element` (the three registries are unioned, each taking its single highest-`priority` matching definition, and tags expand into sets of elements); only when none of them declares anything does it read the **aura the item carries** — the single aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` definition declares, then that aura's `aura_type`. The `mxt:item_element` condition reads exactly this.

`items` is the shared matcher: one item ID, one `#tag` or a mixed array all work, and any array entry may also be a matcher object carrying a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage` and `mxt:herb_tag`). A matcher only references items that are already registered. When several definitions match one item, they are ranked by the `priority` each declares, **highest first** (the field defaults to `0`; ten tables accept it: `artifact`, the six bindings `item` / `weapon` / `pill` / `tool` / `blueprint` / `technique`, `spirit_herb`, `item_aura` and `currency`); only two definitions with the **same** `priority` fall back to registry order, so which one wins is written in the pack and never decided by file names (the same direction as `aura_zone` and `element_reaction`). **Which kind of matcher entry matched is irrelevant**: a definition that matches is ranked by the number it declares, and naming the item by id does not move it up. See [`ItemMatcher`](/en/datapack/types/shared_data_types#itemmatcher).
