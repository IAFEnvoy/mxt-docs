---
title: Weapon Binding (weapon_binding)
aside: false
---

# Weapon Binding (weapon_binding) {#weapon_binding}

`weapon_binding` is an **item data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at `data/mxt/data_maps/item/weapon_binding.json`. **The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. The keys of `values` are **item ids or `#`-prefixed item tags** (a tag expands at load time into every item it held then), and the value is the object the field table below describes — this table has **no `items` field**. See [Data Maps](../overview.md#data-maps) for the file shape.

A weapon binding gives **items that are already registered** a set of weapon attributes and behaviours: `attributes` are the vanilla attribute modifiers it contributes, and the three actions are right-click, hit and held-tick. It creates no items and replaces none of the item's own numbers.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `priority` | Int | `0` | Order between several values hitting one item: the larger number goes first, and **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files). |
| `attributes` | `AttributeEntry[]` | `[]` | The vanilla attribute modifiers this weapon contributes; an optional `value` updates the item's attribute component every tick. **A weapon's own attack damage and attack speed go here too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`). |
| `use_action` | `EntityAction` | `mxt:no_op` | Right-click use behaviour. |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | Behaviour on a hit. |
| `tick_action` | `EntityAction` | `mxt:no_op` | Held-tick behaviour. |
| `conditions` | `EntityCondition[]` | `[]` | Conditions checked before use, attacks and attribute application; supports inline conditions or described condition objects. |
| `element` | element ID or `#element tag`, an array is allowed | `[]` | What element this weapon **is**: one entry is one element, a `#` tag is a set of them. The `mxt:element` component on the stack is unioned with it. |

**A weapon's own attack damage and attack speed go in `attributes` too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`): they are **added on top of** the modifiers the item already ships with and **never replace** the item's own numbers. If you want "this weapon's base damage is exactly 8", change the item's own `minecraft:attribute_modifiers` (recipe components, `mxt:merge_components` or KJS), or start from a base item that carries no attack modifiers at all. Each entry says which attribute it belongs to, which vanilla modifier it uses and how much it moves the number; the modifier itself uses the vanilla attribute modifier shape.

```json
// data/mxt/data_maps/item/weapon_binding.json
{
  "values": {
    "example:frost_blade": {
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
  }
}
```

**A weapon has exactly two components**: `mxt:quality` (single value — a **whole quality object**: written on a stack it wins, and it brings the ladder its own tier belongs to) and `mxt:element` (a list — unioned with what the data map writes). `attributes`, the three actions (`use_action` / `attack_action` / `tick_action`) and `conditions` **exist only in the data map**: for a stack whose numbers you want to change, write the vanilla `minecraft:attribute_modifiers` (KubeJS or recipe components), or write a value under that item's own id.

**The element of an item** has exactly one reading, which asks two things in order: first the **declarations** — the `mxt:element` component on the stack, plus whichever of `weapon_binding`, [item_binding](./item_binding.md) or [artifact](./artifact.md) writes a value for or claims this stack and whether it writes `element` (the three tables are unioned, each taking its single highest-`priority` entry, and tags expand into sets of elements); only when none of them declares anything does it read the **aura the item carries** — the single aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` value declares, then that aura's `aura_type`. The `mxt:item_element` condition reads exactly this.

The keys of `values` come in exactly two forms: an item id, or a `#`-prefixed item tag (a tag expands at load time into every item it held then). This table does **not** take `type`-carrying matcher entries such as `mxt:wildcard` / `mxt:regex` / `mxt:technique` / `mxt:spirit_storage` / `mxt:herb_tag` — those belong only to the registries that have an `items` field. When several values hit one item, they are ranked by the `priority` each declares, **highest first** (the field defaults to `0`), and **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files), with no fallback to registry order. **Whether the key is an item or a tag is irrelevant**: a value that matches is ranked by the number it declares, and naming the item by id does not move it up.
