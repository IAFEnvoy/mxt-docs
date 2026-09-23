---
title: Creature Profile (creature_profile)
description: "Define a creature's realm stage, intelligence, inner core, loot table, contract tags, preferred aura elements and minimum aura requirements."
aside: false
---

# Creature Profile (creature_profile)

A Creature Profile defines the cultivation profile of an existing creature type: its realm stage, intelligence, inner core, loot table, the aura elements it prefers and the minimum aura it needs to spawn or be strengthened. A profile does not create an entity type.

## File Location

Creature Profile JSON files go in `data/<namespace>/mxt/creature_profile/` within your data pack.

**Purpose**: Creature profiles and entity binding conditions.

The filename corresponds to its ID. For example, `data/example/mxt/creature_profile/spirit_wolf.json` has the ID `example:spirit_wolf`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `realm_stages` | `Holder<realm_stage>[]` | `[]` | The creature's realm stage profile, written as an array. |
| `intelligence` | `NumberProvider` | `0` | The intelligence value. |
| `condition` | Entity Condition | `mxt:always_true` | The condition under which the profile applies; a single condition or an array of conditions may be written, and it does not replace the vanilla spawning rules. |
| `inner_core` | Identifier | none | The inner core item ID. |
| `loot_table` | Identifier | none | The creature loot table ID. |
| `contract_tags` | Identifier[] | `[]` | The contract kinds this profile declares. An entry names either a `mxt:contract_type` id or a `mxt:contract_type` tag that type belongs to. |
| `entity_type_tags` | `HolderOrTag<EntityType>[]` | `[]` | The creature types or tags this profile applies to. |
| `preferred_aura_elements` | `HolderOrTag<element>[]` | `[]` | The preferred aura elements. |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | The minimum amount of each aura required to spawn or be strengthened. The keys are `mxt:aura` entries, not stored values. |

::: info

The realm stage field is named `realm_stages` and takes an array of realm stages in the mod's codec, which is the form used by the shipped data files and by the example below.

:::

`contract_tags` feeds contract eligibility: a creature qualifies for a [contract type](./contract_type.md) when that type's own `creature_condition` passes **or** the profile applied to the creature lists an entry that either equals the contract type's id or names a `mxt:contract_type` tag that type belongs to. Both routes only ever add eligibility, so a profile can widen a contract's reach but never narrow it. When no profile is applied, when its list is empty or when its entries name nothing, the contract type's own condition decides alone, exactly as it did before.

## Example

```json
{
  "realm_stages": ["example:foundation"],
  "intelligence": 12,
  "condition": { "type": "mxt:always_true" },
  "inner_core": "minecraft:amethyst_shard",
  "contract_tags": ["example:contract/master_servant"],
  "entity_type_tags": ["minecraft:wolf", "#example:spirit_wolves"],
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 }
}
```

