---
title: Item Condition Types
description: Every built-in item condition type registered by the mod, with the JSON fields that each type accepts.
---

# Item Condition Types

An **item condition** checks a single item stack and returns `true` or `false`. The holder entity and the stack are supplied by whatever data table declares the condition, so the condition itself only describes what to check about the stack it is given.

Item conditions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the table below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

A condition is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:item_tag",
  "tag": "minecraft:swords"
}
```

Because conditions are used as values inside other data tables, the same structure usually appears nested under a field such as `item_condition`:

```json
"item_condition": {
  "type": "mxt:relative_durability",
  "comparison": "<=",
  "compare_to": 0.25
}
```

Anywhere an item condition is expected, an array of conditions is also accepted. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"item_condition": [
  { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  { "type": "mxt:relative_durability", "comparison": ">", "compare_to": 0.5 }
]
```

::: info Where Item Conditions Run
The stack to test is normally supplied by the declaring table, for example through the `mxt:equipped_item` entity condition or an item action field. The comparison operators are `==`, `!=`, `<`, `<=`, `>` and `>=`.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the table here.
:::

## Condition Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:always_true` | — | Always passes. |
| `mxt:js` | `id`, `params?` | Calls an item condition handler that was registered through the KubeJS bridge. |
| `mxt:and` | `conditions` | Passes only when every nested item condition passes. |
| `mxt:or` | `conditions` | Passes when at least one nested item condition passes. |
| `mxt:not` | `condition` | Negates a nested item condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability between `0` and `1`. |
| `mxt:constant` | `value` | Always returns the given boolean value. |
| `mxt:item_id` | `item` | Matches the stack's item id. |
| `mxt:owned_by` | — | Passes when the stack's artifact owner (`owner_uuid` of `mxt:artifact_state`) is the current holder; a stack with no owner does not pass. |
| `mxt:energy_range` | `aura`, `min`, `max` | Checks that **one named aura's** stored amount on the stack lies between `min` and `max`, inclusive; `aura` is a concrete aura and is required. |
| `mxt:item_tag` | `tag` | Matches the stack against a vanilla or data pack item tag. |
| `mxt:item_matcher` | `items` | Matches any item id, item tag or typed matcher entry listed in one value. |
| `mxt:amount` | `comparison`, `compare_to` | Compares the stack's count. |
| `mxt:fuel` | `comparison`, `compare_to` | Compares the stack's furnace burn time. |
| `mxt:is_equipable` | `slot?` | Checks that the stack has an equippable component, optionally for one specific equipment slot. |
| `mxt:relative_durability` | `comparison`, `compare_to` | Compares the stack's remaining durability divided by its maximum durability. |
| `mxt:armor_value` | `comparison`, `compare_to` | Compares the armor value the stack contributes in its equippable slot. |
| `mxt:durability` | `comparison`, `compare_to` | Compares the stack's remaining durability. |
| `mxt:on_cooldown` | — | Passes when the stack is on the vanilla item cooldown of the holder. |
| `mxt:ingredient` | `ingredient` | Matches the stack against a vanilla ingredient. |
| `mxt:tool_ability` | `ability` | Checks whether the stack can perform a NeoForge item ability. |
| `mxt:base_enchantment` | `enchantment`, `comparison`, `compare_to` | Compares the level of one enchantment stored on the stack. |
| `mxt:has_component` | `component` | Checks whether the stack has the given data component. |
| `mxt:component` | `component`, `nbt` | Matches the serialized value of a data component using partial NBT comparison. |
| `mxt:spirit_storage_not_full` | — | Matches chargeable items whose stored spirit power is below their capacity. |
| `mxt:item_element` | `elements` | Passes when the item carries one of the listed elements. It reads "the element of an item": the `element` declared by its `weapon_binding` / `item_binding` / `artifact` (those are unioned), and only when none of them declares anything does it fall back to the `aura_type` of the aura the item carries. An element or an element tag is accepted, and an empty list is refused while loading. See [weapon_binding](../../json/weapon_binding.md). |

::: info `mxt:item_matcher`
The `items` field accepts a single value or an array, and the array may freely mix item ids, item tags and typed matcher entries. The typed entries are `mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:herb_tag` (a spirit herb carrying a given element or material tag) and the fieldless `mxt:spirit_storage`, which matches every item that stores aura; see [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type). It is the most compact way to accept a set of items that is not already covered by an existing tag.
:::

::: info `mxt:durability` Compared With `mxt:relative_durability`
`mxt:durability` compares the raw remaining durability, so the same value means different things on items with different maximum durability. `mxt:relative_durability` compares the remaining fraction between `0` and `1` and is the better choice for a generic rule. Both only pass for damageable items.
:::
