---
title: 'MxtSpiritRoots: Spirit Roots'
description: Query, grant, remove and switch spirit roots on and off; the element half of a body's cultivation identity.
---

# `MxtSpiritRoots`: Spirit Roots

A spirit root is the **element half** of a body's cultivation identity: holding one binds that body to an element, changes the cultivation speed of that element's aura, and scales the abilities attuned to that element. The element-independent half is [MxtPhysiques](/en/kubejs/api/physiques). Granting and removal go through the authoritative service, so `conflicting_elements` conflicts and the abilities a root grants are handled as usual.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | Every spirit root the entity **holds**, sorted by ID. A switched-off root, or one whose definition is disabled or deleted, is still listed — it really is still held. |
| `active(entity)` | `Entity` | `List<String>` | The roots that are **in effect** right now: switched-off ones, and ones whose bound element is disabled, do not count. |
| `has(entity, root)` | `Entity`, root ID | `boolean` | Whether it is held (the same meaning as `mxt:has_spirit_root`: a switched-off root still counts). |
| `enabled(entity, root)` | `Entity`, root ID | `boolean` | Whether that root is currently switched on; `false` when it is not held. |
| `grant(entity, root)` | `LivingEntity`, root ID | `{changed, failure}` | Goes through the authoritative service, so [`conflicting_elements`](/en/datapack/json/spirit_root) and the granted abilities are handled as usual. |
| `remove(entity, root)` | `LivingEntity`, root ID | `boolean` | Gives up that root together with its element and everything it granted; `false` when it was not held. |
| `setEnabled(entity, root, enabled)` | `LivingEntity`, root ID, `boolean` | `{changed, failure}` | "Switch off without losing": `changed: true` only when the state really changed and the grants were recomputed, and `failure: "NOT_HELD"` when it is not held. |

Spirit roots and physiques share one `failure` vocabulary: `DISABLED` (the definition does not exist, or is disabled by `mxt:disabled`), `ALREADY_HELD`, `CONDITIONS` (the physique's `holder_condition` is not met), `EXCLUSIVE_CONFLICT`, `ELEMENT_CONFLICT` (the root's `conflicting_elements`), `NOT_HELD` and `SERVER_ONLY` (called on a client). The four readers work on either side — the `spirit_identity` attachment is synchronised, and an item tooltip asking "are you a fire root?" is exactly that use — while the state-changing methods are server operations.

```js
// kubejs/server_scripts/mxt_identity.js
// Reshaping: swap one spirit root for another and switch the new physique on along the way.
const result = MxtSpiritRoots.grant(player, 'mxt_test:qingxiao_fire_root')
if (result.changed) {
  MxtSpiritRoots.remove(player, 'mxt_test:water_root')
  MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', true)
} else {
  console.warn(`grant refused: ${result.failure}`)
}
// "Is he on a fire root right now?" — a switched-off root is still held, so ask active rather than has.
const active = MxtSpiritRoots.active(player)
```

## Related

- Data pack side: [`spirit_root`](/en/datapack/json/spirit_root).
- The other half of the identity: [MxtPhysiques](/en/kubejs/api/physiques); the element it binds: [MxtElements](/en/kubejs/api/elements).
- The operator command: [/spirit_root](/en/player-guide/commands/spirit_root).
- [KubeJS API Reference](/en/kubejs/api-reference).
