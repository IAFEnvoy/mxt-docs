---
title: Spirit Herb (spirit_herb)
description: Marks existing items as spirit herbs with a default quality and a set of classification metadata, without registering a new item.
aside: false
---

# Spirit Herb (spirit_herb) {#spirit_herb}

`spirit_herb` marks an **existing item** as a spirit herb and gives it a default quality and a set of classification metadata. It registers no new item: the herb itself comes from a content pack or another mod, and this definition only turns an item that already exists into a spirit herb.

## File Location

Spirit herb files go in `data/<namespace>/mxt/spirit_herb/` within your data pack.

**Purpose**: Spirit herb metadata for existing items.

The filename is its ID. For example, `data/example/mxt/spirit_herb/fire_ginseng.json` has the ID `example:fire_ginseng`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Binds existing items; it creates no new spirit herb item. |
| `priority` | Int | `0` | Order between several definitions of the same kind matching one item: the higher number goes first (see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher)); ties fall back to registry order. |
| `quality` | quality id | **required** | The quality of that item, and the **last** slot of the whole resolution order: override component → forge result → definition default (artifact / technique) → the chain's `default` → here (see [Quality Chain](./quality_chain.md#resolution)). |
| `age` | `NumberProvider` | `0` | Age metadata. |
| `element_tags` | Array of element ids or `#tags` | `[]` | Which elements this herb belongs to, written against the **element registry**: an entry is one element, a `#` tag is a set of them. `mxt:herb_tag` (`element`) matches it, so a herb can be named anywhere an `ItemMatcher` is accepted (item conditions, bindings, `mxt:item_matcher`, …). |
| `material_tags` | Identifier[] | `[]` | Material classification tags, matched the same way through `mxt:herb_tag`'s `material`. |
| `growth_rate` | `NumberProvider` | `0` | Growth rate metadata. |
| `drop_chance` | `NumberProvider` | `1` | Drop chance metadata. |

## Example

```json
{
  "items": ["minecraft:red_mushroom", "#mxt_test:spirit_herbs"],
  "quality": "mxt_test:spirit_iron",
  "age": 100,
  "element_tags": ["mxt_test:fire"],
  "material_tags": ["mxt_test:herb"],
  "growth_rate": 0.05,
  "drop_chance": 1
}
```

`items` uses the shared item matcher common to these definitions: a single item ID, a single `#namespace:tag`, or an array mixing both, where an array entry may also be a typed object carrying `type`, dispatched by the built-in `item_matcher_entry_type` registry — see [Shared Data Types](../types/shared_data_types.md). `element_tags` and `material_tags` are properties of the herb, not of the item, so a content pack can write "any fire spirit herb" without knowing which items get bound to that herb later.

::: info Work in progress

Binding, quality lookup, the tooltip and the matching of both classification tags are wired up (`mxt:herb_tag`); `age`, `growth_rate` and `drop_chance` are metadata for content mods to read, with no lifecycle behind them — the mod ships no planting or growth system, so growth, harvesting and spawning are left to content mods by design. `mxt:aura_zone`'s `spirit_plant_bonus` and `natural_spawn_herb` have no consumer for the same reason.

:::

A spirit herb is a material for [Alchemy Recipe](./alchemy_recipe.md), and its quality is defined by [Quality](./quality.md).
