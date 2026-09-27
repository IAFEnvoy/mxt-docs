---
title: 'MxtLifespan: Lifespan'
description: "Read and write an entity's lifespan ledger - the ticks left, the ceiling, a rewrite and an adjustment - and make a body be reborn on the spot."
---

# `MxtLifespan`: Lifespan

`MxtLifespan` is the script-side entry point for the lifespan ledger. The ledger lives on each body and holds two numbers: how many ticks of life are left and the ceiling this life was granted. **Writes from data packs and commands always record**, and the master switch only decides whether time passes, so a script's write is not gated by it either. The gameplay, the config and the command are on [Lifespan](/en/player-guide/lifespan).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `remaining(entity)` | `Entity` | `long` | Ticks of life left; `-1` when the entity **has no ledger**. Read-only: asking does not create one. |
| `total(entity)` | `Entity` | `long` | The ceiling this life was granted; `-1` when it has no ledger. |
| `set(entity, ticks)` | `LivingEntity`, `long` | `Result` | Rewrites both numbers to `ticks`. A negative `ticks` is refused with the `invalid_value` failure. |
| `add(entity, ticks)` | `LivingEntity`, `long` | `Result` | Adjusts the ledger: a positive amount raises both the remaining life and its ceiling, while **a negative amount only lowers what is left and never the ceiling** (floored at `0`). |
| `reincarnate(entity)` | `LivingEntity` | `Result` | Makes the entity be **reborn** on the spot: it runs the reset list on the **Server Config → Reincarnation** tab and reopens the ledger from **Server Config → Lifespan → Base lifespan** (with that at `0` the account is closed and the body reads as "not accounted for" again). It fires **no** `lifespanEnd` event (that one belongs to expiry only) and fires `lifespanRebirth`'s `Pre` / `Post` instead, so a listener can cancel it; it runs even with the lifespan master switch off, and a target that is a player is told in chat. Its `failure` is `server_only` (client side) or `cancelled` (a listener vetoed it) and it **never** returns `invalid_value`; on success the ledger afterwards is what the next life starts from. |

`set`, `add` and `reincarnate` all return the same `Result` record, read with its Java accessors: `changed()` says it really took effect and `failure()` is the failure enum (`null` on success). For `set` / `add` the values are `server_only` or `invalid_value`; for `reincarnate` they are `server_only` (client side) or `cancelled` (a listener vetoed it) and **never** `invalid_value`. A client-side script always reads `-1` from `remaining` / `total`, and none of the three writes lands on a client either (`reincarnate` also returns a `Result` whose `failure` is `SERVER_ONLY` there and changes nothing). After a rebirth, `remaining(entity)` / `total(entity)` show the ledger the new life starts from.

```js
// kubejs/server_scripts/mxt_lifespan.js
// A hundred more years (24000 ticks is one game day).
const result = MxtLifespan.add(player, 100 * 24000)
if (!result.changed()) {
  console.warn(`lifespan not written: ${result.failure()}`)
}
```

## Related

- The gameplay, the server config and the command: [Lifespan](/en/player-guide/lifespan).
- The callback when a lifespan runs out: `lifespanEnd` in [MxtEvents](/en/kubejs/api/events); the callback for an explicit rebirth (this method, the command or the `mxt:reincarnate` action) is `lifespanRebirth` there.
- [KubeJS API Reference](/en/kubejs/api-reference).
