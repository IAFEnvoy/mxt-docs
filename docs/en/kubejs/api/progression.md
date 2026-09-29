---
title: 'MxtProgression: Progression Levels'
description: Read and write the progression level a body holds, per owner; techniques and spirit beasts share the same ledger.
---

# `MxtProgression`: Progression Levels {#mxtprogression}

A spirit beast's level and a technique's use the same ledger, and the only difference is the **owner** - the owner id is the key of the level record: a technique writes its own id, a spirit beast writes the id of its own [creature profile](/en/datapack/json/creature_profile). The readers work on either side, while `setLevel` is a server operation.

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `level(entity, owner)` | `Entity`, owner ID | `String` or `null` | The **recorded** level ID; `null` when it never advanced (it may still stand on the entry level, which is what `current` answers). |
| `current(entity, owner)` | `Entity`, owner ID | `String` or `null` | The level **in force**: the record, or the owner's entry level. `null` when the entity does not hold that owner at all. |
| `next(entity, owner)` | `Entity`, owner ID | `String` or `null` | The level after the current one; `null` at the highest level or when the entity does not hold that owner. |
| `mastery(entity, owner)` | `Entity`, owner ID | `{have, required, resource}` or `null` | How far the next level still is: the current value of `mastery_resource`, the amount that level asks for and the resource id. `null` when there is no next level, the owner names no `mastery_resource`, or the formula cannot be evaluated. |
| `setLevel(entity, owner, level)` | `LivingEntity`, owner ID, level ID | `{changed, failure}` | Goes through the same service as `/contract level`: it checks that the level is on its chain, writes the record, rebuilds what it grants and publishes one `mxt:progression_level` signal. It **ignores** that level's own `mastery` and `condition`. |

The `failure` vocabulary: `UNKNOWN_OWNER` (the body does not hold that owner, or its definition has no chain), `FOREIGN_LEVEL` (that level is not on its chain), `SAME_LEVEL` (it already stands on that level), `UNKNOWN_LEVEL` (that id is not in the registry) and `SERVER_ONLY` (called on a client).

```js
// kubejs/server_scripts/mxt_progression.js
// A spirit beast: the owner is the id of its own profile, and writing a level grants that level's abilities on the spot.
const current = MxtProgression.current(beast, 'mxt_test:probe_beast')
const growth = MxtProgression.mastery(beast, 'mxt_test:probe_beast')   // {have, required, resource}
const advanced = MxtProgression.setLevel(beast, 'mxt_test:probe_beast', 'mxt_test:beast_3')
if (!advanced.changed) {
  console.warn(`promotion refused: ${advanced.failure}`)
}
// A technique goes through the same entry point, with the technique id as the owner.
const sword = MxtProgression.level(player, 'mxt_test:sword_manual')
```

## Related

- Data pack side: [`progression`](/en/datapack/json/progression), [`technique`](/en/datapack/json/technique).
- Spirit beast growth: [`creature_profile`](/en/datapack/json/creature_profile).
- The operator command: [/contract](/en/player-guide/commands/contract).
- [KubeJS API Reference](/en/kubejs/api-reference).
