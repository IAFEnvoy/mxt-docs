---
title: Physique (physique)
description: Defines a physique that grants vanilla attribute bonuses and abilities independently of any element.
aside: false
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
| `name` | Text Component | `physique.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `physique.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `attribute_modifiers` | `List<AttributeEntry>` | `[]` | Vanilla attribute bonuses independent of spirit roots; when `value` is filled in they are recalculated every tick from the entity context. |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | Granted abilities. |
| `holder_condition` | `EntityCondition` | `mxt:always_true` | The holder condition checked before granting; conditions such as `mxt:has_spirit_root` and `mxt:has_physique` can be combined to express prerequisite physiques or spirit roots. |
| `exclusive_tags` | `Identifier[]` | `[]` | Mutual exclusion tags. |
| `rarity` | String | `common` | Rarity marker; the info panel and `/mxt physique list` show the raw text, and the `mxt.rarity.<rarity>` translation is used when one exists. |
| `allow_stacking` | Boolean | `false` | Whether the same physique may stack. |
| `damage_dealt_multiplier` | `NumberProvider` | `1` | Damage the holder **deals** is multiplied by this in layer one of the pipeline. Several active physiques multiply together. |
| `damage_taken_multiplier` | `NumberProvider` | `1` | Damage the holder **takes** is multiplied by this in layer two of the pipeline. Several active physiques multiply together. |

::: info Elements
A physique is not bound to an element; element-related logic belongs in spirit roots or environment configuration.
:::

## Example

```json
// data/example/mxt/physique/innate_sword_bone.json
{
  "attribute_modifiers": [
    { "attribute": "minecraft:attack_damage", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value" }
  ],
  "granted_abilities": ["example:sword_intent"],
  "exclusive_tags": ["example:physique/skeletal"],
  "rarity": "epic",
  "damage_dealt_multiplier": "1 + 0.05 * realm_rank",
  "damage_taken_multiplier": 0.9
}
```

## Element Fields Are Ignored {#element-fields}

"A physique carries no element" is a line drawn by the **field table**, not by a load-time check. A physique reads only the keys listed above, so the following keys **neither fail nor do anything** when they appear in a physique definition:

`element`, `elements`, `element_affinity`, `element_tags`, `element_ability_modifier`, `conflicting_elements`, `relations`, `overcomes`, `adapted_to`, `damage_types`, `attachment_decay`, `damage_attachment`, `aura_type`, `cultivation_multiplier`.

The reason is a practical one: `RecordCodecBuilder` **reads only the keys it was told about** and ignores the rest — that is the mod's one reading everywhere (it used to refuse these by name here, and no longer does). A physique that "looks like it has elements but actually carries nothing" therefore keeps running quietly, so **check your key names against the table above** rather than expecting the loader to catch them. Writing the wrong registry (reaching for `spirit_root` or `element` by mistake) is equally silent.

## The Two Damage Multipliers {#damage-multipliers}

They are the seam through which a physique can talk about combat without talking about elements: the numbers themselves have nothing to do with elements, and the two layers of [damage settlement](../../technical/damage.md) read them separately — layer one reads the attacker's `damage_dealt_multiplier`, layer two reads the target's `damage_taken_multiplier`.

- The multiplier is evaluated in the **holder's own** formula context: how much this body takes cannot depend on who is asking, and the formula can read the `caster_*` family of variables.
- `0` is a legal value (immunity, or being unable to deal anything), and written as a number it is validated as finite and non-negative while loading; a negative or non-finite value produced by a formula counts as "no contribution" (the same rule as the same class of formula used for passive attributes).
- Several active physiques **multiply**, because each one is an independent source.
- They **do not enter the formula context**: only the pipeline reads them, so there is no chance for the data pack to multiply them a second time. This is where they differ from `element_modifier`, whose historical use was being written into formulas by hand, which is why the documentation specifically warns against multiplying it twice.

## Holding and Switching Off {#holding}

Both `spirit_root` and `physique` can be granted and removed with entity actions: `mxt:grant_spirit_root`, `mxt:remove_spirit_root`, `mxt:grant_physique` and `mxt:remove_physique`. Whether one is held can be tested with the entity conditions `mxt:has_spirit_root` and `mxt:has_physique`; the script side is `MxtSpiritRoots` and `MxtPhysiques`, and the administrator side is `/mxt spirit_root` and `/mxt physique`.

A physique that is already held can be **switched off** without being lost: once it is off, its attribute modifiers, granted abilities and both damage multipliers all stop applying, but it is still "held" (`mxt:has_physique` still answers true, and it can still be removed normally).
