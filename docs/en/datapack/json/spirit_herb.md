---
title: Spirit Herb (spirit_herb)
description: A spirit herb attaches quality and herb metadata to existing items without creating a new item.
aside: false
---

# Spirit Herb (spirit_herb)

A spirit herb marks existing items as spirit herbs for alchemy and gathering gameplay, giving them a default quality and classification metadata.

## File Location

Spirit herb JSON files go in `data/<namespace>/mxt/spirit_herb/` within your data pack.

**Purpose**: Spirit herb metadata for existing items.

The filename corresponds to its ID. For example, `data/example/mxt/spirit_herb/fire_ginseng.json` has the ID `example:fire_ginseng`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Binds existing items. It does not create a new spirit herb item. |
| `quality` | `Holder<item_quality>` | **required** | The default quality of that item. |
| `age` | `NumberProvider` | `0` | Age metadata. |
| `element_tags` | `HolderOrTag<element>[]` | `[]` | The element alignment of this herb, written against the **element registry**: an entry is one element and a `#` tag is a set of them, and disabled elements do not count. It is matched by `mxt:herb_tag` (`element`), so a herb can be named anywhere an `ItemMatcher` is accepted (item conditions, bindings, `mxt:item_matcher`, …). |
| `material_tags` | Identifier[] | `[]` | Material classification tags. |
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

::: info Work in progress

The mod has no spirit herb planting or growth system at all: growth, harvesting and generation are left to content mods, as the mod's own code states. Binding, quality lookup, the element and material tags and the tooltip are wired up, while `age`, `growth_rate` and `drop_chance` are declared metadata with no lifecycle behind them. For the same reason the [`spirit_plant_bonus`](./aura_zone.md) and [`natural_spawn_herb`](./aura_zone.md) rules of an aura zone have no consumer.

:::

The `items` matcher is the shared item matcher used by several formats; it accepts a single item ID, a single `#namespace:tag` or a list of both, and an array entry may also be a typed object dispatched by the built-in `item_matcher_entry_type` registry. See [Shared Data Types](../types/shared_data_types.md). The quality it points at is defined by [Item Quality](./item_quality.md), where a spirit herb's `quality` is also the last fallback an item's resolved quality uses when no component, forge result or quality group decides it. Herbs are intended as materials for [Alchemy Recipe](./alchemy_recipe.md).

