---
title: Block Aura (block_aura)
description: Define which blocks provide aura to their chunk, and how much capacity, regeneration and colour each aura gets from them.
---

# Block Aura (block_aura)

A Block Aura defines which blocks act as aura sources: each matching block contributes to the aura inventory of the chunk it is in, on top of the natural environment.

## File Location

Block Aura JSON files go in `data/<namespace>/mxt/block_aura/` within your data pack.

**Purpose**: Aura provided by blocks.

The filename corresponds to its ID. For example, `data/example/mxt/block_aura/spirit_stone_ore.json` has the ID `example:spirit_stone_ore`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `blocks` | `HolderOrTag<Block>[]` | **required** | The matching blocks or block tags. The list must not be empty. |
| `aura` | `Map<Holder<aura>, AuraValue>` | `{}` | The amount, capacity, regeneration speed and colour of each aura provided by every block. |

Each `AuraValue` entry defines the aura amount a single block provides, together with its capacity, regeneration speed and colour, using the same `amount`, `max`, `regen_per_tick` and `color` fields as an [Aura Zone](./aura_zone.md) `aura` entry. The keys are `mxt:aura` entries, not `mxt:resource` entries: a resource only stores a number, while the aura is what says which aura that number is counted in.

There is no separate "aura kind" field. The auras a block emits are exactly the key set of its `aura` map, so a block cannot claim a kind of aura it does not actually supply.

## Example

```json
{
  "blocks": [
    "mxt:spirit_stone_ore",
    "#example:aura_emitters"
  ],
  "aura": {
    "mxt:common": { "amount": 5.0, "max": 5.0, "regen_per_tick": 0.01 },
    "mxt:water": { "amount": 5.0, "max": 5.0, "regen_per_tick": 0.01 }
  }
}
```

## Runtime Behaviour

- The cache is rebuilt after a chunk is loaded, a block changes, or the data tables are loaded.
- A spirit stone vein can provide aura far above the natural environment through several `block_aura` entries and block tags.
- At runtime the query is performed over a 7x7x7 sub-chunk range: within the 3x3x3 range of sub-chunks around the current sub-chunk the real positions of matching blocks are used, while the outer ring approximates them with sub-chunk centres, and everything decays uniformly by `1 / max(1, distance squared)`.
- The contribution of each source sub-chunk is roughly split according to the number of players currently visiting, while the inventory itself is still shared at the chunk level.
- Block aura does not occupy the environment base maximum: it adds an equal amount of storable aura capacity to the current chunk at the same time. With an environment maximum of 100 and a total block contribution of 30, the effective maximum of that chunk is 130.
- The block aura cache and the chunk inventory update period are controlled by **Server Config → Aura → Block Aura Period**: it defaults to an update every 10 ticks and allows a range of 1 to 1200 ticks.
- A recommended natural aura template keeps the environment `amount` low and enables positive and negative noise; after the `/ 10 - 5` handling large areas have no natural aura, and `block_aura` accumulates on top of that by the number of blocks in the chunk, so a spirit stone vein can be configured far above the natural value.

## Commands

On the server, `/mxt aura query` queries the final environment under your feet; when standing on spirit stone ore, `/mxt aura vein` queries the size and tier of the connected vein.

