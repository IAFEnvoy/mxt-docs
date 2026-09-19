---
title: Physique (physique)
description: Defines a physique that grants vanilla attribute bonuses and abilities independently of any element.
---

# Physique (physique)

A `physique` is a stackable source attached to an entity that grants vanilla attribute bonuses and abilities independently of elements.

## File Location

Physique files go in `data/<namespace>/mxt/physique/` within your datapack.

**Purpose**: Physique bonuses that are independent of elements.

The filename corresponds to its ID. For example, `data/example/mxt/physique/blazing_body.json` has the ID `example:blazing_body`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `attribute_modifiers` | `List<AttributeEntry>` | `[]` | Vanilla attribute bonuses independent of spirit roots; when `value` is filled in they are recalculated every tick from the entity context. |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | Granted abilities. |
| `holder_condition` | `EntityCondition` | `mxt:always_true` | The holder condition checked before granting; conditions such as `mxt:has_spirit_root` and `mxt:has_physique` can be combined to express prerequisite physiques or spirit roots. |
| `exclusive_tags` | `Identifier[]` | `[]` | Mutual exclusion tags. |
| `rarity` | String | `common` | Rarity marker used by content packs. |
| `allow_stacking` | Boolean | `false` | Whether the same physique may stack. |

::: info Elements
A physique is not bound to an element; element-related logic belongs in spirit roots or environment configuration.
:::

::: info Granting and Removing
Granting and removing both spirit roots and physiques is done with entity actions: `mxt:grant_spirit_root`, `mxt:remove_spirit_root`, `mxt:grant_physique` and `mxt:remove_physique`. Ownership can be tested with the entity conditions `mxt:has_spirit_root` and `mxt:has_physique`.
:::

## Example

```json
{
  "attribute_modifiers": [{"attribute": "minecraft:max_health", "id": "example:physique/blazing_body", "amount": 2, "operation": "add_value"}],
  "granted_abilities": [],
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
}
```

