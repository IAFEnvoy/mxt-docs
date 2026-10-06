---
title: Weapon Binding (weapon_binding)
aside: false
---

# Weapon Binding (weapon_binding) {#weapon_binding}

`weapon_binding` gives **items that are already registered** a set of weapon attributes and behaviours: `attributes` are the vanilla attribute modifiers it contributes, and the three actions are right-click, hit and held-tick. It creates no items and replaces none of the item's own numbers.

## File Location

`weapon_binding` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/weapon_binding/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/weapon_binding/frost_blade.json` is `example:frost_blade`. The mod ships no entry for this table; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:weapon_binding` lists the items these definitions claim.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `attributes` | `AttributeEntry[]` | `[]` | The vanilla attribute modifiers this weapon contributes; an optional `value` updates the item's attribute component every tick. **A weapon's own attack damage and attack speed go here too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`). |
| `use_action` | `EntityAction` | `mxt:no_op` | Right-click use behaviour. |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | Behaviour on a hit. |
| `tick_action` | `EntityAction` | `mxt:no_op` | Held-tick behaviour. |
| `conditions` | `EntityCondition[]` | `[]` | Conditions checked before use, attacks and attribute application; supports inline conditions or described condition objects. |
| `element` | element ID or `#element tag`, an array is allowed | `[]` | What element this weapon **is**: one entry is one element, a `#` tag is a set of them. The `mxt:element` component on the stack is unioned with it. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

**A weapon's own attack damage and attack speed go in `attributes` too** (`minecraft:attack_damage` / `minecraft:attack_speed`, with `operation` set to `add_value`): they are **added on top of** the modifiers the item already ships with and **never replace** the item's own numbers. If you want "this weapon's base damage is exactly 8", change the item's own `minecraft:attribute_modifiers` (recipe components, `mxt:merge_components` or KJS), or start from a base item that carries no attack modifiers at all. Each entry says which attribute it belongs to, which vanilla modifier it uses and how much it moves the number; the modifier itself uses the vanilla attribute modifier shape.

`data/example/mxt/weapon_binding/frost_blade.json`:

```json
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

When several definitions hit one item, the one with the highest `priority` wins (the field defaults to `0`); only two definitions with the same `priority` fall back to registry order. **Whether `items` names an item or a tag is irrelevant**: any definition that hits is ranked by the number it declares, and naming the item by id does not move it up.

**A weapon has exactly two components**: `mxt:quality` (single value — a **whole quality object**: written on a stack it wins, and it brings the ladder its own tier belongs to) and `mxt:element` (a list — unioned with what the definition writes). `attributes`, the three actions (`use_action` / `attack_action` / `tick_action`) and `conditions` **exist only in this registry**: for a stack whose numbers you want to change, write the vanilla `minecraft:attribute_modifiers` (KubeJS or recipe components), or write a definition under that item's own id.

**The element of an item** has exactly one reading, which asks two things in order: first the **declarations** — the `mxt:element` component on the stack, plus `weapon_binding`, [item_binding](./item_binding.md) or [artifact](./artifact.md) — whichever of them claims this stack and whether it writes `element` (the three registries are unioned, each taking its single highest-`priority` definition, and tags expand into sets of elements); only when none of them declares anything does it read the **aura the item carries** — the single aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` definition declares, then that aura's `aura_type`. The `mxt:item_element` condition reads exactly this.
