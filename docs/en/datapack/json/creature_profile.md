---
title: Creature Profile (creature_profile)
description: "Define a creature's intelligence, inner core, spawn action, preferred aura elements and minimum aura requirements."
aside: false
---

# Creature Profile (creature_profile)

A Creature Profile defines the cultivation profile of an existing creature type: the action it runs once on spawn, its intelligence, inner core, the aura elements it prefers and the minimum aura it needs to spawn or be strengthened. A profile does not create an entity type, and it does not decide who may be contracted: eligibility is code, as described in [Contract Type](./contract_type.md).

## File Location

Creature Profile JSON files go in `data/<namespace>/mxt/creature_profile/` within your data pack.

**Purpose**: Creature attributes and entity binding conditions.

The filename corresponds to its ID. For example, `data/example/mxt/creature_profile/spirit_wolf.json` has the ID `example:spirit_wolf`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `entities` | `HolderOrTag<EntityType>[]` | `[]` | The creature types or tags this profile applies to; a single entry, a single tag or a mixed array are all accepted. |
| `spawn_action` | `EntityAction` | `mxt:no_op` | The action run **once**, when the profile is written onto the creature (the first time it joins the world; a creature that already carries the profile is skipped). It takes **one action**: a JSON array is rejected at load time, so use `mxt:sequence` to chain several. When a condition or an aura gate fails, the profile is not written and this action does not run either. |
| `intelligence` | `NumberProvider` | `0` | The intelligence value. |
| `condition` | Entity Condition | `mxt:always_true` | The condition under which the profile applies; a single condition or an array of conditions may be written, and it does not replace the vanilla spawning rules. |
| `inner_core` | `ItemStackTemplate` | none | The inner core stack template, written as `{"id": "..."}` with an optional `count` (`1..99`) and `components`, or as a bare item ID; the creature drops it on death. Native datapack registries are parsed before item components are bound, so this field takes a **template** rather than an `ItemStack`. |
| `preferred_aura_elements` | `HolderOrTag<element>[]` | `[]` | The preferred aura elements. |
| `minimum_aura` | `Map<Holder<aura>, NumberProvider>` | `{}` | The minimum amount of each aura required to spawn or be strengthened. The keys are `mxt:aura` entries, not stored values. |

::: info

`spawn_action` holds a **single** action: write one object with a `type`. Unlike the `*Action` base types, which accept an array as a shorthand for `mxt:sequence`, an array here is a load error.

:::

A profile is applied once, when the creature joins the world, and what it writes is attributes plus a **single** `spawn_action` that runs the moment the profile is written - the one field of the profile that touches the world. Contract eligibility used to be one of its fields and is not any more - see [Contract Type](./contract_type.md) for what replaced it.

**Extra drops are not part of the profile.** Anything other than the inner core belongs in a vanilla loot table - the entity's own table, or a loot modifier attached to it. To split pools by a cultivator's state, use the loot conditions the mod registers: `mxt:realm`, `mxt:has_ability`, `mxt:has_curse`, `mxt:has_spirit_root`, `mxt:has_element`, `mxt:has_physique` and `mxt:js`, described in [Loot and Criteria](/en/datapack/loot-and-criteria).

## Example

```json
{
  "entities": ["minecraft:wolf", "#example:spirit_wolves"],
  "spawn_action": { "type": "mxt:set_no_gravity" },
  "intelligence": 12,
  "condition": { "type": "mxt:always_true" },
  "inner_core": { "id": "minecraft:amethyst_shard" },
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 }
}
```
