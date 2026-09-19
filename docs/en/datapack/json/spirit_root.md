---
title: Spirit Root (spirit_root)
description: Defines a spirit root that is strongly bound to a single element and grants cultivation bonuses and abilities.
---

# Spirit Root (spirit_root)

A `spirit_root` is a stackable source attached to an entity that is strongly bound to one element and modifies cultivation and element affinity.

## File Location

Spirit root files go in `data/<namespace>/mxt/spirit_root/` within your datapack.

**Purpose**: A spirit root bound to a single element.

The filename corresponds to its ID. For example, `data/example/mxt/spirit_root/fire_root.json` has the ID `example:fire_root`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `element` | `Holder<element>` | **required** | The element the spirit root belongs to. |
| `cultivation_multiplier` | `NumberProvider` | `1` | Cultivation multiplier. |
| `element_ability_modifier` | `NumberProvider` | `1` | Element affinity ability multiplier. |
| `rarity` | String | `common` | Rarity marker used by content packs. |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | Granted abilities. |

::: info Grouping and Filtering
Spirit root grouping, compatibility and filtering use vanilla tags at `data/<namespace>/tags/mxt/spirit_root/<name>.json`. There are no duplicate custom grouping fields.
:::

## Example

```json
{
  "element": "example:fire",
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "rarity": "rare",
  "granted_abilities": ["example:fire_control"]
}
```

