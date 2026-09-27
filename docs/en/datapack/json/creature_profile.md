---
title: Creature Profile (creature_profile)
aside: false
---

# Creature Profile (creature_profile) {#creature_profile}

File location: `data/<namespace>/mxt/creature_profile/<path>.json`

A creature profile is attached to a creature type and applied once, when the creature enters the world: it decides that creature's attributes, aura requirements, inner core, and one action that runs at the moment the profile is written. It does **not** decide who can be contracted - eligibility is a code fact of the target creature, see [contract_type](./contract_type.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entities` | array of creature type IDs or `#tags` | `[]` | The creature types or tags this profile applies to. |
| `spawn_action` | `EntityAction` | `mxt:no_op` | The action **run once** when the profile is written onto this creature. |
| `intelligence` | `NumberProvider` | `0` | The intelligence value. |
| `condition` | `EntityCondition` | `mxt:always` | The condition under which the profile applies. |
| `inner_core` | Item stack template | none | The inner core stack template; the creature drops exactly this stack on death. |
| `preferred_aura_elements` | array of element IDs or `#tags` | `[]` | The preferred aura elements. |
| `minimum_aura` | Map of aura ID to value | `{}` | The minimum value of each aura required to spawn or be strengthened. |

`entities` takes a single entry, a tag, or a mixed array.

`condition` takes a single condition or an array of conditions. It governs whether this profile applies at all; it does not replace the vanilla spawning rules.

`inner_core` is written as `{"id": "..."}` (with an optional `count` (`1..99`) and `components`), or as a bare item ID. It takes a **template**, not an already bound stack: datapack registries are resolved before item components are bound.

A profile is written only once, so `spawn_action` also runs only once: it runs together with the profile the first time the creature enters the server-side world, and a creature that already carries the profile does not run it again. It takes **one action** - an array is rejected at load time, so use `mxt:sequence` to do several things in a row. When the condition or an aura requirement fails, the profile is not written and this action does not run either. It is the only field in the profile that touches the world.

**Extra drops are not managed by the profile**: anything other than the inner core belongs in a vanilla loot table (the entity's own loot table, or a loot modifier attached to it). To split pools by a cultivator's state, use the loot conditions the mod registers - `mxt:realm`, `mxt:has_ability`, `mxt:has_curse`, `mxt:has_spirit_root`, `mxt:has_element`, `mxt:has_physique`, `mxt:technique`, `mxt:js` - see [Loot and Criteria](../loot-and-criteria.md).

```json
{
  "entities": ["minecraft:wolf", "#example:spirit_wolves"],
  "spawn_action": { "type": "mxt:set_no_gravity" },
  "intelligence": 12,
  "condition": { "type": "mxt:always" },
  "inner_core": { "id": "minecraft:amethyst_shard" },
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 }
}
```
