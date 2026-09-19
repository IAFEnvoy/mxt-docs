---
title: Shared Data Types
description: Complex data types reused by many MiXianTu definitions, including resource costs and gains, attribute entries, holder and tag selectors, and item matchers.
---

# Shared Data Types

These are complex values that are referenced by many definitions, actions and conditions across the mod. They have no `type` field of their own unless stated, and they are written inline wherever a field table names them.

---

## Icon Reference

Every icon field in the mod takes the same value: **either** a GUI texture **or** an item. Definitions that carry one are [ability](../json/ability.md), [resource](../json/resource.md), [forging method](../json/forging_method.md) and [technique](../json/technique.md).

| Form | Type | Description |
|------|------|-------------|
| A JSON string | Identifier | A 16x16 GUI texture, for example `example:textures/gui/icon/sword.png` |
| A JSON object | `ItemStackTemplate` | An item stack template such as `{"id": "minecraft:iron_ingot"}`, optionally with `count` and `components` |

The texture branch is tried first, and it is a plain `Identifier`, so **any bare string is a texture**. An item therefore always has to be written as an object with an `id`, because a bare item ID would be read as the path of a texture instead.

```json
"icon": "example:textures/gui/icon/sword.png"
```

```json
"icon": {"id": "minecraft:iron_ingot"}
```

An item icon is stored as a template rather than a ready-made stack, because a datapack registry is parsed before item components are bound. The client materialises it when it draws, so an icon that needs components still shows them.

---

## ResourceCost

Every field that **consumes** resources takes an array of resource costs. Each entry names a resource registry entry and the amount to take.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Holder<resource>` | The resource registry entry |
| `amount` | `NumberProvider` | The cost; it must evaluate to a finite positive number at runtime |

```json
"costs": [
  {"id": "example:qi", "amount": "5 + level"},
  {"id": "example:stamina", "amount": 2}
]
```

---

## Aura Gain

An aura gain names one aura and the amount of it to hand over, and it is the shape the `aura_gains` field of a [cultivate action](../json/cultivate_action.md) uses. Gains are less strict than costs: `0` is allowed, but a negative result is rejected.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Holder<aura>` | The aura registry entry |
| `amount` | `NumberProvider` | The gain; it must evaluate to a finite, non-negative number |

```json
"aura_gains": [
  {"id": "example:qi", "amount": 10},
  {"id": "example:insight", "amount": "level * 0.5"}
]
```

A plain counter is raised with the `mxt:add_resource` entity action instead, which takes a `resource` and an `amount` and needs no aura definition behind the value.

::: tip
A cost of `0` or less is invalid, so a cost entry can never be used to grant anything. Use a gain for that.
:::

---

## AttributeEntry

Vanilla attribute modifiers use the vanilla attribute holders such as `minecraft:attack_damage`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `attribute` | `Holder<Attribute>` | **required** | Vanilla attribute ID |
| `id` | `Identifier` | **required** | Unique ID of the vanilla `AttributeModifier` |
| `amount` | `Double` | **required** | Base value used when there is no dynamic `value` |
| `operation` | Enum | **required** | `add_value`, `add_multiplied_base` or `add_multiplied_total` |
| `value` | `NumberProvider` | none | When present, the value is recomputed every tick on the server and replaces `amount` |

```json
{
  "attribute": "minecraft:max_health",
  "id": "example:body_tempering",
  "amount": 4,
  "operation": "add_value",
  "value": "2 + caster_minecraft_max_health * 0.1"
}
```

A dynamic `value` is evaluated with the entity alone, without a resource context, so it can read the `caster_` family but not `realm_rank` or `absorbed_aura`.

---

## Holders, Tags and Mixed Arrays

Fields that cross registries are resolved into holders during datapack load instead of being looked up at runtime.

### Single Value and Tag

A single entry is written as an ID, and a tag reference keeps its required `#` prefix:

```json
{
  "aura": "example:qi",
  "ability_requirements": "#example:fire_abilities"
}
```

### Mixed Arrays

Fields that accept both IDs and tags can be written as an array:

```json
{
  "ability_requirements": [
    "example:fireball",
    "#example:basic_fire_abilities"
  ]
}
```

Every array entry stays a `Holder` or a `TagKey`; duplicate values do not change the meaning. `AutoIgnoreListCodec` allows invalid optional entries in a list to be ignored, and each field table states whether that codec is used.

---

## ItemMatcher

The `items` field of `item_binding`, `weapon_binding`, `pill_binding`, `technique_binding`, `spirit_herb`, `item_aura` and `currency` accepts three forms. The matcher type IDs behind them are listed in [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type).

A single item ID:

```json
"items": "minecraft:apple"
```

A single item tag:

```json
"items": "#minecraft:logs"
```

A mixed array:

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

Array entries may also be typed objects, which is how a wildcard, a regular expression, a spirit herb tag (`mxt:herb_tag`) or the capability matcher `mxt:spirit_storage` is written. See [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type) for the registered entry types and their fields.

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:spirit_storage"}
]
```

A matcher only references items that are already registered; it never creates items. When several definitions match, they are selected by `priority` from low to high, and for the current data classes that priority is fixed at `0`.
