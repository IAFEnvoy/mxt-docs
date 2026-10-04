---
title: Block Aura (block_aura)
description: Define which blocks provide aura to their chunk, and the amount, capacity, regeneration and colour each aura gets from them.
aside: false
---

# Block Aura (block_aura)

A `block_aura` defines which blocks are aura sources: every matching block contributes to the aura inventory of the chunk it is in, on top of the natural environment. A spirit stone vein is what uses it to push the concentration far above the natural value.

## File Location

`block_aura` is a **block data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at `data/mxt/data_maps/block/block_aura.json`. **The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/block/`. The keys of `values` are **block ids or `#`-prefixed block tags** (a tag expands at load time into every block it held then) — this table has **no `blocks` field**. See [Data Maps](../overview.md#data-maps) for the file shape.

**Purpose**: Aura provided by blocks.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| (key) | block ID or a `#`-prefixed block tag | — | **This is "which block"**; no other field says it. |
| (value) | Map of aura ID to value | `{}` | The aura table this block provides. **There is no outer field name** — the value is that table itself. |

The keys of the map are `mxt:aura` registry entries, not `mxt:resource` ones: a resource only stores a number, while the aura is what says which aura that number counts towards. Every entry in the map has the same fields as an `aura` entry in [aura_zone](./aura_zone.md):

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Double | `0` | How much each matching block contributes. |
| `max` | Maximum | `initial_multiplier=1` | The maximum, written as on the [aura maximum types](/en/datapack/types/other/aura-maximum) page. |
| `regen_per_tick` | Double | `0` | How much is restored per tick. |
| `color` | `RGBColor` | `#FFFFFF` | Colour, used for environment rendering only. |

`amount` must be finite and non-negative, and `regen_per_tick` must be finite, otherwise the value is rejected at load time.

There is no "aura kind" field: the auras a block emits are exactly the key set of that map, so a block cannot claim an aura it does not actually supply.

**When several values hit the same block they are added together** (block aura is an additive quantity) and **`priority` plays no part** — only it and `default_quality` (which has no `priority` field at all) settle conflicts without `priority`, see the merge section of [Data Maps](../overview.md#data-maps).

## Example

```json
// data/mxt/data_maps/block/block_aura.json
{
  "values": {
    "#example:aura_emitters": {
      "mxt:common": { "amount": 5.0, "regen_per_tick": 0.01 }
    },
    "mxt:spirit_stone_ore": {
      "mxt:common": { "amount": 20.0, "max": 40.0, "regen_per_tick": 0.05 }
    }
  }
}
```

## Runtime Behaviour

- The cache is rebuilt after a chunk is loaded, a block changes, or the data tables are loaded.
- A spirit stone vein can be stacked from several `block_aura` values and block tags to provide aura above the natural environment.
- At runtime the query is performed over a 7×7×7 sub-chunk range: within the 3×3×3 range around the current sub-chunk the **real positions** of matching blocks are used, the outer ring is approximated with sub-chunk centres, and everything decays uniformly by `1 / max(1, distance squared)`.
- The contribution of each source sub-chunk is roughly split by the number of players currently visiting it, while the inventory is still shared at the chunk level.
- Block aura does not occupy the environment base maximum: it also adds an equal amount of storable aura capacity to the current chunk. With an environment maximum of 100 and a total block contribution of 30, the effective maximum of that chunk is 130.
- The block aura cache and the chunk inventory update period are controlled by **Server Config → Aura → Block Aura Period**, every 10 ticks by default, with an allowed range of 1 to 1200 ticks.
- A recommended natural aura template keeps the environment `amount` very low and enables positive and negative noise; after the `/ 10 - 5` handling large areas have no natural aura, block contributions accumulate on top of that by the number of blocks in the chunk, so a spirit stone vein can be configured far above the natural value.

## Commands

On the server, `/mxt aura query` queries the final environment under your feet; standing on spirit stone ore, `/mxt aura vein` queries the block count and tier of the connected vein.
