---
title: Physique (physique)
description: Defines a physique that grants vanilla attribute bonuses, abilities and two damage multipliers independently of elements.
aside: false
---

# Physique (physique)

File location: `data/<namespace>/mxt/physique/<path>.json`

A physique hands out bonuses that stand apart from elements: vanilla attributes, abilities and two damage multipliers. Who gets it and when is decided by `holder_condition`, so prerequisites such as "a fire physique only once you hold a fire root" are written here. Physique and element are two paths that never meet - the element half belongs to [Spirit Root](./spirit_root.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `physique.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column; when written, that text is used. |
| `description` | Text Component | `physique.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is stored and read, but no screen draws it. |
| `attribute_modifiers` | Attribute modifier entry array | `[]` | Vanilla attribute bonuses independent of spirit roots. |
| `granted_abilities` | Array of ability ids or `#tags` | `[]` | Granted abilities. |
| `holder_condition` | `EntityCondition` | `mxt:always` | The holder condition checked before granting. |
| `exclusive_tags` | Identifier array | `[]` | Mutual exclusion tags. |
| `rarity` | String | `common` | Rarity marker. |
| `allow_stacking` | Boolean | `false` | Whether the same physique may stack. |
| `damage_dealt_multiplier` | `NumberProvider` | `1` | Damage the holder **deals** is multiplied by this in layer one of [damage settlement](/en/technical/damage). |
| `damage_taken_multiplier` | `NumberProvider` | `1` | Damage the holder **takes** is multiplied by this in layer two of the pipeline. |

An `attribute_modifiers` entry writes `attribute` plus the vanilla modifier's `id/amount/operation`; when an entry fills in `value`, the value is recalculated every tick from the entity context by a formula instead.

`holder_condition` can combine `mxt:has_spirit_root` and `mxt:has_physique` to express a prerequisite spirit root or prerequisite physique.

The info panel and `/mxt physique list` show `rarity` as raw text, and use the `mxt.rarity.<rarity>` translation when one exists.

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

"A physique carries no element" is a boundary drawn by the **field table** above, not by a load-time check. A physique reads only the keys listed in that table, so writing the following into a physique definition **neither fails nor does anything**:

`element`, `elements`, `element_affinity`, `element_tags`, `element_ability_modifier`, `conflicting_elements`, `relations`, `overcomes`, `adapted_to`, `damage_types`, `attachment_decay`, `damage_attachment`, `aura_type`, `cultivation_multiplier`.

The reason is a practical one: decoding a definition reads only the keys it was told about and ignores everything else. A physique that "looks like it has elements but actually carries nothing" therefore keeps running quietly: **check your key names against the table above** and do not expect the loader to catch them for you. Writing into the wrong registry (putting a physique in `mxt/spirit_root/`, or the other way round) is equally silent.

## The Two Damage Multipliers {#damage-multipliers}

They are the seam that lets a physique talk about combat without talking about elements: the numbers themselves have nothing to do with elements, and the two layers of damage settlement read them separately - layer one reads the attacker's `damage_dealt_multiplier`, layer two reads the target's `damage_taken_multiplier`.

- The multiplier is evaluated in the **holder's own** formula context, so how much this body takes does not depend on who is asking; a `value` formula can read the `caster_*` family of variables.
- `0` is a legal value (immunity, or hitting for nothing). Written as a number it is validated as finite and non-negative while loading; a negative or non-finite value produced by a formula contributes nothing.
- Several active physiques **multiply**, because each one is an independent source.
- They **do not enter the formula context**: only the pipeline reads them, so there is no chance for the data pack to multiply them a second time. That is where they differ from `element_modifier`, which can be written into formulas by hand and therefore carries an explicit warning not to multiply it twice.

## Holding and Switching Off {#holding}

Granting and removing both go through entity actions: `mxt:grant_physique` and `mxt:remove_physique` (the spirit root side is `mxt:grant_spirit_root` and `mxt:remove_spirit_root`). Whether one is held is tested with the entity condition `mxt:has_physique` (spirit roots use `mxt:has_spirit_root`); the script side is `MxtPhysiques` (spirit roots use `MxtSpiritRoots`) and the administrator side is `/mxt physique` (spirit roots use `/mxt spirit_root`).

The mod also ships a **physique item**, `mxt:physique`: the `mxt:physique` component on the stack names the physique it grants, and right-clicking grants it — through the same check the actions and the command use, so "already held" (only while `allow_stacking` is false), an unmet `holder_condition` and an exclusive-tag conflict are all refused as usual, with the attributes, abilities and both damage multipliers recalculated on the spot. A grant spends one item and **creative mode spends none**; a refusal leaves the item in hand and says why, while a bare item with no component only says which physique it fails to name. Take one with `/give @s mxt:physique[mxt:physique="example:sword_bone"]`, or use `/picker mxt:physique` — one row per physique definition, each **already carrying the component**. That is the item's use path, which is a different thing from the switch below.

A physique that is already held can be **switched off without being lost**: once it is off, its attribute modifiers, granted abilities and both damage multipliers all stop applying, but it is still "held" (`mxt:has_physique` still answers true, and it can still be removed normally). That state lives in the `spirit_identity` attachment, so it is saved and synchronised with the entity.

**Switching off** has **no player-facing entry point** (no keybind and no screen): the operation is the script-side `MxtPhysiques.setEnabled`, or the administrator command `/mxt physique enable|disable`. That is a different question from taking the definition out of the data pack: the switch only governs the one entry that was switched off, and that entry is still held, while removing the definition takes it out of the registry entirely (write `neoforge:conditions`, see [Disabling a Definition](../overview.md#disabling-a-definition)).
