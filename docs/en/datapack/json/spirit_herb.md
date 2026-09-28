---
title: Spirit Herb (spirit_herb)
description: Marks an existing item as a spirit herb with medicinal power, thermal bias, a default quality and age, and optionally a way to grow it.
aside: false
---

# Spirit Herb (spirit_herb) {#spirit_herb}

`spirit_herb` marks an **existing item** as a spirit herb and gives it medicinal power, a thermal bias and a default quality — plus, optionally, a way to grow it. It registers no new item: the herb itself comes from a content pack or another mod.

## File Location

Spirit herb files go in `data/<namespace>/mxt/spirit_herb/` within your data pack.

The filename is its ID. For example, `data/example/mxt/spirit_herb/fire_ginseng.json` has the ID `example:fire_ginseng`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `spirit_herb.mxt.<namespace>.<path>` | Display name. |
| `description` | Text Component | the same key plus `.description` | Description. |
| `items` | `ItemMatcher` | **required** | Binds existing items; it creates no new spirit herb item. When several definitions match, the one with the largest `priority` is used and their power is never added together. |
| `priority` | Int | `0` | Order between several herb definitions matching one item: the larger number goes first (see [ItemMatcher](../types/shared_data_types.md#itemmatcher)); ties fall back to registry order. |
| `quality` | quality ID | **required** | The item's default quality. Age never upgrades it, and a `mxt:quality` component on the stack still wins (the order is on [Which Tier an Item Reads](./quality.md#resolution)). |
| `default_age` | Integer | `0` | Non-negative. Used when the stack carries no `mxt:herb_age` component. |
| `element_tags` | Array of element IDs or `#tags` | `[]` | Elemental affinity, **not** a medicinal property. Written against the element registry; `mxt:herb_tag`'s `element` matches it. |
| `material_tags` | Identifier[] | `[]` | Material classification, matched by `mxt:herb_tag`'s `material`. |
| `main_effects` | Map of medicinal property ID to NumberProvider | `{}` | The power each item provides in the main role. |
| `auxiliary_effects` | same as above | `{}` | The power each item provides in the auxiliary role. |
| `catalyst_power` | `NumberProvider` | `0` | The harmonising power each item provides as the catalyst; non-negative. |
| `thermal_bias` | Double | `0` | Finite, in `[-1,1]`. Negative is cold and positive is hot, and neither is the same thing as a fire or water element. |
| `growth` | Object | none | Omitting it makes the item unsowable, though it can still be used in alchemy. |

`items` uses the shared item matcher common to these definitions: a single item ID, a single `#namespace:tag`, or an array mixing both, where an array entry may also be a typed object carrying `type`, dispatched by the built-in `item_matcher_entry_type` registry — see [Shared Data Types](../types/shared_data_types.md#itemmatcher). `element_tags` and `material_tags` are properties of the herb, not of the item, so a content pack can write "any fire spirit herb" without knowing which items get bound to that herb later.

## Age

Age is extra metadata about the herb, stored in the item component **`mxt:herb_age`** as a non-negative integer. There is one reading order: the component when the stack carries one, otherwise the definition's `default_age`.

A stack never ages on its own — inventories, containers and dropped items all leave it alone. Stacks of different ages form separate stacks by the vanilla component rules: they never merge, never average and never refresh each other.

Age is a **formula input**, not a second multiplier: while `main_effects` / `auxiliary_effects` / `catalyst_power` are evaluated, the current age is readable as the local variable `herb_age`. A pack that wants century-old herbs to be worth more writes the gain into the expression, for example `"3 * (1 + herb_age / 100)"`.

## `growth`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `seeds` | `ItemMatcher` | **required**, non-empty | Existing items that can serve as seeds. |
| `mature_age` | Integer | **required** | A positive integer. Once reached the plant can be harvested, and it may also keep growing. |
| `max_age` | Integer | **required** | A positive integer at least `mature_age`. Once reached it stops spending. |
| `growth_rate` | `NumberProvider` | **required** | Age added per `20` ticks the plant is actually loaded; non-negative. |
| `condition` | `BlockCondition` | `mxt:always` | Light, biome, neighbours, `aura_range` and so on. |
| `costs` | [`Cost`](../types/shared_data_types.md#cost) array | `[]` | Accepts only `mxt:aura` entries, paid from the aura pool of the place the plot stands in. |
| `harvest` | `ItemStackTemplate` | **required** | The item harvesting produces; it must resolve back to this herb. Count and components come from the data. |
| `texture` | Identifier | **required** | The crossed-grass texture. No block is registered per plant. |

`growth.seeds` and the herb's item binding are two separate lists: whatever can be sown does not have to be the item this herb binds or harvests. `harvest` must resolve back to this herb, otherwise it is reported as an error after loading.

## Plots and Growth

The plot is the block `mxt:spirit_herb_plot`: one plant per block, with no interface.

Right-clicking an empty plot with a valid seed checks the position and your interaction permission, then consumes `1` seed. A new planting starts at age `0` and does not inherit the seed's own age; right-clicking the same plot again cannot stack another plant. A material that cannot be sown, or a protected position, consumes no seed.

Every `20` loaded ticks one settlement runs: the definition must still be in the registry, age must be below `max_age`, `condition` must hold, and the growth amount must be valid — then the whole `costs` array is paid. An unpayable bill simply pauses the plant: no partial charge and no dead herb. Unloading a chunk or stopping the server catches nothing up.

The amount added is **`growth_rate` evaluated, then multiplied by `max(0, 1 + spirit_plant_bonus)`**. The pipeline applies that factor exactly once, so do not multiply it again inside the expression. Age is capped at `max_age`.

Right-clicking an immature plot with an empty hand shows the age, the maturity requirement and the reason it is paused. Right-clicking a mature plot with an empty hand harvests it: the plant is cleared and you get the `harvest` stack (with its age component set to the current progress rounded down) plus `1` of the original seed; anything that does not fit in the inventory is dropped once. Sneaking with an empty hand pulls the plant and returns only the original seed. Breaking the block drops the same way: a mature plant gives the harvest and the original seed, an immature one gives back only the seed. When the definition no longer resolves, growth stops but the saved seed can still be taken back.

## Example

```json
{
  "items": ["minecraft:red_mushroom", "#mxt_test:spirit_herbs"],
  "quality": "example:spirit_iron",
  "default_age": 100,
  "element_tags": ["example:fire"],
  "material_tags": ["example:herb"],
  "main_effects": { "example:nourish": "3 * (1 + herb_age / 100)" },
  "thermal_bias": 1,
  "growth": {
    "seeds": "minecraft:beetroot_seeds",
    "mature_age": 100,
    "max_age": 200,
    "growth_rate": 25,
    "costs": [{ "type": "mxt:aura", "aura": "example:spirit_power", "amount": 1 }],
    "harvest": { "id": "minecraft:red_mushroom", "count": 1 },
    "texture": "example:block/herb/fire_ginseng"
  }
}
```

## Related Systems

- Alchemy: a spirit herb is a material for a [pill recipe](./alchemy_recipe.md), and `main_effects` / `auxiliary_effects` / `catalyst_power` are exactly the power the main, auxiliary and catalyst roles read. The properties themselves come from [Medicinal Property](./medicinal_property.md).
- Matching: `mxt:herb_tag` is one entry type of the item matcher. It recognises "is this that kind of herb" by `element` or `material`, so it can be written anywhere an `ItemMatcher` is accepted. At least one of the two fields is required, and every field you write has to hold for the herb.
- Quality: the `quality` a herb declares is the last slot of quality resolution; see [Quality](./quality.md#resolution).
