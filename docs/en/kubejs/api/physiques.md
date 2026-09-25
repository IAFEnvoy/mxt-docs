---
title: 'MxtPhysiques: Physiques'
description: Query, grant, remove and switch physiques on and off; the element-independent half of a body's cultivation identity.
---

# `MxtPhysiques`: Physiques

A physique is the **element-independent half** of the same identity: it grants vanilla attributes and abilities, scales the damage its holder deals and takes, and excludes other physiques through its mutual-exclusion tags. The element-bound half is [MxtSpiritRoots](/en/kubejs/api/spirit_roots). On a grant, `holder_condition` and `exclusive_tags` are judged against the **current** entity.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | Every physique the entity **holds**, sorted by ID (with `allow_stacking` the same ID can appear more than once). |
| `active(entity)` | `Entity` | `List<String>` | The physiques that are **in effect** right now. |
| `has(entity, physique)` | `Entity`, physique ID | `boolean` | Whether it is held. |
| `enabled(entity, physique)` | `Entity`, physique ID | `boolean` | Whether that physique is currently switched on; `false` when it is not held. |
| `grant(entity, physique)` | `LivingEntity`, physique ID | `{changed, failure}` | Goes through the authoritative service; [`holder_condition`](/en/datapack/json/physique) and `exclusive_tags` are judged against the **current** entity. |
| `remove(entity, physique)` | `LivingEntity`, physique ID | `boolean` | Removes that physique together with its attributes, abilities and damage multipliers; `false` when it was not held. |
| `setEnabled(entity, physique, enabled)` | `LivingEntity`, physique ID, `boolean` | `{changed, failure}` | The same switch as a spirit root. |

Spirit roots and physiques share one `failure` vocabulary: `DISABLED` (the definition does not exist, or is disabled by `mxt:disabled`), `ALREADY_HELD`, `CONDITIONS` (the physique's `holder_condition` is not met), `EXCLUSIVE_CONFLICT`, `ELEMENT_CONFLICT` (the root's `conflicting_elements`), `NOT_HELD` and `SERVER_ONLY` (called on a client). The four readers work on either side, and the state-changing methods are server operations.

```js
// kubejs/server_scripts/mxt_physique.js
const result = MxtPhysiques.grant(player, 'mxt_test:blazing_body')
if (!result.changed) console.warn(`refused: ${result.failure}`)

// Switching it off is not losing it: the body still holds it, nothing it provides applies.
MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', false)
```

## Related

- Data pack side: [`physique`](/en/datapack/json/physique).
- The other half of the identity: [MxtSpiritRoots](/en/kubejs/api/spirit_roots) (the combined reshaping example lives there).
- The operator command: [/physique](/en/player-guide/commands/physique).
- [KubeJS API Reference](/en/kubejs/api-reference).
