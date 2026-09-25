---
title: 'MxtSouls: Souls'
description: Reclaim an entity's transferable soul through the authoritative flow.
---

# `MxtSouls`: Souls

`MxtSouls` is the script-side entry point for souls: it uses the authoritative reclaim flow, only applies to **transferable** souls, and fires the reclaim pre/post events of `soul` (a script can veto it in `Pre`). Soul **transfer** has no script entry point: items and content trigger it themselves, and a script can only watch or cancel it through the events.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `reclaim(entity)` | `Entity` | `boolean` | Uses the authoritative soul reclaim flow. It only applies to transferable souls, and it fires the reclaim pre/post events of `soul`. |

```js
// kubejs/server_scripts/mxt_soul.js
if (!MxtSouls.reclaim(player)) {
  console.info('nothing reclaimable here')
}
```

## Related

- Callbacks around reclaiming and transferring: `soul` in [MxtEvents](/en/kubejs/api/events).
- [KubeJS API Reference](/en/kubejs/api-reference).
