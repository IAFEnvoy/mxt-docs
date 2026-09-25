---
title: Spirit Root (spirit_root)
description: Defines a spirit root that is strongly bound to a single element and grants cultivation bonuses and abilities.
aside: false
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
| `name` | Text Component | `spirit_root.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `spirit_root.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `element` | `Holder<element>` | **required** | The element the spirit root belongs to. |
| `cultivation_multiplier` | `NumberProvider` | `1` | Cultivation multiplier. Written as a number it is validated as finite and non-negative while loading. |
| `element_ability_modifier` | `NumberProvider` | `1` | Element affinity ability multiplier: when an ability whose `element_affinity` names this root's element is cast, it is a factor of layer one of [damage settlement](../../technical/damage.md) (several matching roots are averaged or best-picked by `element_affinity_mode`), and it is also readable in formulas as `element_modifier`. Written as a number it is validated as finite and non-negative while loading. |
| `rarity` | String | `common` | Rarity marker; the info panel and `/mxt spirit_root list` show the raw text, and the `mxt.rarity.<rarity>` translation is used when one exists. |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | Granted abilities. |
| `conflicting_elements` | `HolderOrTag<element>[]` | `[]` | The elements that **cannot coexist in one body**: granting a root whose element is listed on a held root — or the other way round — is rejected. An element carrying `mxt:disabled` takes no part in the question. |

::: info Grouping and Filtering
Spirit root grouping, compatibility and filtering use vanilla tags at `data/<namespace>/tags/mxt/spirit_root/<name>.json`. There are no duplicate custom grouping fields. The `spirit_root` field of both the `mxt:has_spirit_root` entity condition and the loot condition accepts an entry, a tag or an array of them, so "any fire root" is one tag.
:::

`conflicting_elements` is not a reading of the element relations: two elements may be opposed in the damage pipeline and still be perfectly possible to hold together, and a pack that wants "fire and water do not mix in one body" says so here. The check is symmetric, so writing the rule on either root is enough, and a switched-off root takes no part in it. A disabled element does not count as an element at all: if either side of the pair is out of play, the rule simply does not hold. **It has a second consumer**: when an element of the attacker's main-hand item is listed as conflicting by one of their active roots, that element's `conflict_multiplier` multiplies everything the attacker deals — see [element](./element.md), "Conflict With The Wielder".

`element_ability_modifier` and the element relations are two independent paths: the relations (`overcomes` / `adapted_to`) say who overcomes whom, and both sides' spirit roots take part in that; this multiplier says what it is worth when *this body* casts the element it is attuned to, and it is decided only by the casting side and by **this one casting**. The same fire technique therefore produces different numbers from a fire root at 1.1 and one at 1.3, while the half that sits on the opponent is decided by the opponent's element alone.

## Switching a Root or Physique Off

Every **held** spirit root and physique can be switched **off without being lost**. A switched-off root or physique still counts as held — `mxt:has_spirit_root` / `mxt:has_physique` stay true and it can still be removed normally — but it contributes no element, no cultivation multiplier, no granted abilities, no passive attributes, no damage multipliers and no `conflicting_elements` rule. The state lives in the `spirit_identity` attachment as `disabled_spirit_roots` / `disabled_physiques`, so it is saved and synchronised with the entity.

This module has **no player-facing entry point** — there is no keybind and no screen. The operations are the script-side `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`, or the administrator command `/mxt spirit_root enable|disable` / `/mxt physique enable|disable`, and how it is wired up is still left to content packs or modpacks. That makes it a different mechanism from the `mxt:disabled` data pack tag, which seals a whole definition and hides it from every consumer: the switch only governs the one entry that was switched off, and that entry is still held.

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

