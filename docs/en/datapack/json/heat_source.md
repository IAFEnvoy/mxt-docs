---
title: Heat Source (heat_source)
description: The temperature and heating rate of a heat block, which cell it stands in, and how the furnace's temperature ceiling is settled.
aside: false
---

# Heat Source (heat_source) {#heat_source}

A `heat_source` gives one family of blocks two numbers: how hot it lets a furnace run (`max_temperature`) and how many degrees it adds each tick (`heating_per_tick`). How the temperature advances and when it falls back is the server's business; the definition only answers those two numbers.

## File Location

Heat source files go in `data/<namespace>/mxt/heat_source/` within your data pack.

**Purpose**: The heating numbers of one family of blocks.

The filename corresponds to its ID. For example, `data/example/mxt/heat_source/magma.json` has the ID `example:magma`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `blocks` | a block id, `#tags`, or a mixed array | **required** | Which blocks this definition matches; must not be empty. |
| `max_temperature` | Double | **required** | The highest temperature this block can give the furnace; finite and greater than `0`. |
| `heating_per_tick` | Double | **required** | How many degrees it adds every tick; finite and greater than `0`. |
| `priority` | Integer | `0` | Which definition wins when several match the same block - the highest wins, and a tie falls back to registry order, the earlier entry first. |

```json
{
  "blocks": ["minecraft:magma_block"],
  "max_temperature": 200,
  "heating_per_tick": 4
}
```

```json
{
  "blocks": ["#minecraft:campfires"],
  "max_temperature": 150,
  "heating_per_tick": 2,
  "priority": 5
}
```

When several definitions match one block only one of them is used: `priority` decides first and the highest wins; on a tie the entry that comes earlier in registry order is taken. The numbers are never added together.

## Where the Heat Cell Is

The heat cell is the furnace's **bottom layer centre cell** (local index 4, directly below the centre of the layer above). That cell is **neither checked nor claimed** by the structure: only the four corners of the bottom layer count, so whatever stands there, or nothing at all, and whether its chunk is loaded, makes no difference to forming.

Only the block in that one cell can supply heat, read through this table: when the block is not in it, or the cell is empty, the furnace has no heat block, the settable ceiling is `0`, and starting a batch is refused over temperature without spending any materials.

A heat block is not consumed. Breaking the core does not drop it - it is a separate cell in the world and stays where it is. Removing it or swapping it for another block while a batch is running does not abort that batch: the temperature simply stops climbing and falls back at the furnace specification's `cooling_per_tick`.

## The Temperature Ceiling

What a player may actually set is `min(the lowest rating of the 18 casings, the heat block's max_temperature)`. The 18 casings are described under [Wall Material](./alchemy_wall_material.md), and the set point with the cooling rate under [Furnace Specification](./alchemy_furnace.md).

## When the Block Answers for Itself

A block may implement `com.iafenvoy.mxt.api.AlchemyHeatSource` and answer the two numbers itself (a different value while it is lit than while it is out, or something that depends on what stands around it). Such a block **answers for itself and its entry in this table is ignored** - the interface is the finer control on top of the table, never required, and most blocks only need the table. Its answers must be finite and greater than zero, or the furnace treats that cell as having no heat block.

**The mod ships no heat block**, and no bundled values for lava or fire: what a block is worth is up to your data pack or content pack. The three blocks in the test pack exist for testing only and are not what a content pack should register.
