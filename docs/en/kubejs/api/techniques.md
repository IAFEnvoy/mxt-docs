---
title: 'MxtTechniques: Techniques'
description: Query, learn and forget techniques; a technique is the whole unit of practice and carries its own progression level.
---

# `MxtTechniques`: Techniques

A technique is the **whole unit** of practice: learning one grants its attributes and abilities at once, while its **progression level** (`progression`) is recorded on the body separately. Learning and forgetting both go through the authoritative service, so the learn condition, the exclusive-tag conflicts and the two learning events are handled as usual.

Forgetting removes that technique **and its own progression level record** (re-learning starts at the entry level) and rebuilds what it granted; the realm, the cultivation progress, the resources and the running method are untouched.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | Every technique the entity has **learned**, sorted by ID. A technique whose definition is no longer in the current pack is still listed — it really is still learned. |
| `has(entity, technique)` | `Entity`, technique ID | `boolean` | Whether it is learned (the same meaning as the entity condition `mxt:technique`). |
| `level(entity, technique)` | `Entity`, technique ID | `String` or `null` | The progression level that technique is at; `null` when it is not learned or carries no level record yet. |
| `learn(entity, technique)` | `LivingEntity`, technique ID | `{changed, failure}` | Goes through the authoritative service, so `learn_condition`, `exclusive_tags` and the two learning events are handled as usual. |
| `forget(entity, technique)` | `LivingEntity`, technique ID | `{changed, failure}` | Forgets the technique **and deletes its own level record**, then rebuilds what it granted; `ABSENT` when it was not learned. |

The `failure` vocabulary: `DISABLED` (that id is not in the registry, including a definition a `neoforge:conditions` block keeps out), `ALREADY_LEARNED`, `CONFLICT` (its `exclusive_tags` collide with a technique already practiced), `CONDITIONS` (`learn_condition` is not met), `CANCELLED` (a listener cancelled the attempt), `ABSENT` (forgetting a technique the entity never learned) and `SERVER_ONLY` (called on a client). The three readers work on either side — the `spirit_identity` attachment is synchronised — while the two state-changing methods are server operations.

```js
// kubejs/server_scripts/mxt_techniques.js
// Learn a technique; write the reason to the log when it is refused.
const learned = MxtTechniques.learn(player, 'mxt_test:azure_water_manual')
if (!learned.changed) {
  console.warn(`learning refused: ${learned.failure}`)
}
// Wash it away: the technique and its own level record go together, realm and progress stay.
MxtTechniques.forget(player, 'mxt_test:qingxiao_breathing_manual')
// Which level is that technique at now? (null when it is not learned or has no record)
const level = MxtTechniques.level(player, 'mxt_test:azure_water_manual')
```

## Related

- Data pack side: [`technique`](/en/datapack/json/technique).
- Cultivation progress and breakthrough: [MxtCultivation](/en/kubejs/api/cultivation).
- The operator command: [/technique](/en/player-guide/commands/technique).
- [KubeJS API Reference](/en/kubejs/api-reference).
