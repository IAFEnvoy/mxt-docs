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
| `conflicting_elements` | `HolderOrTag<element>[]` | `[]` | The elements that **cannot coexist in one body**: granting a root whose element is listed on a held root — or the other way round — is rejected. |

::: info Grouping and Filtering
Spirit root grouping, compatibility and filtering use vanilla tags at `data/<namespace>/tags/mxt/spirit_root/<name>.json`. There are no duplicate custom grouping fields. The `spirit_root` field of both the `mxt:has_spirit_root` entity condition and the loot condition accepts an entry, a tag or an array of them, so "any fire root" is one tag.
:::

`conflicting_elements` is not a reading of the element relations: two elements may be opposed in the damage pipeline and still be perfectly possible to hold together, and a pack that wants "fire and water do not mix in one body" says so here. The check is symmetric, so writing the rule on either root is enough, and a switched-off root takes no part in it.

## Switching a Root or Physique Off

Every **held** spirit root and physique can be switched **off without being lost**. A switched-off root or physique still counts as held — `mxt:has_spirit_root` / `mxt:has_physique` stay true and it can still be removed normally — but it contributes no element, no cultivation multiplier, no granted abilities, no passive attributes and no `conflicting_elements` rule. The state lives in the `spirit_identity` attachment as `disabled_spirit_roots` / `disabled_physiques`, so it is saved and synchronised with the entity.

The mod provides **no player-facing entry point** for this: there is no command, keybind or screen, and the wiring is left to content packs that need it. That makes it a different mechanism from the `mxt:disabled` data pack tag, which seals a whole definition and hides it from every consumer.

## Example

```json
{
  "element": "example:fire",
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "rarity": "rare",
  "granted_abilities": ["example:fire_control"],
  "conflicting_elements": ["example:water"]
}
```

