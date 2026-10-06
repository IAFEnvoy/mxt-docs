---
title: Heat Source (heat_source)
description: The temperature and heating rate of a heat block, which cell it stands in, and how the furnace's temperature ceiling is settled.
aside: false
---

# Heat Source (heat_source) {#heat_source}

A `heat_source` gives one family of blocks two numbers: how hot it lets a furnace run (`max_temperature`) and how many degrees it adds each tick (`heating_per_tick`). How the temperature advances and when it falls back is the server's business; the definition only answers those two numbers.

## File Location

`heat_source` is a **datapack registry**, one definition per file:

```text
data/<namespace>/mxt/heat_source/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/heat_source/fire.json` is `example:fire`. The mod ships no entry for this table; a content pack writes its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same block from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry this one is read **while the world loads**, so `/reload` does not re-read it. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:heat_source` lists the blocks these definitions claim.

**Purpose**: The heating numbers of one family of blocks.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `blocks` | Block entries | **required, must not be empty** | Which blocks this definition claims: one block id, a `#`-prefixed block tag, or an array of them. |
| `max_temperature` | Double | **required** | The highest temperature this block can give the furnace; finite and greater than `0`. |
| `heating_per_tick` | Double | **required** | How many degrees it adds every tick; finite and greater than `0`. |
| `priority` | Integer | `0` | Order between several definitions hitting one block: the larger number wins, and **a tie falls back to registry order**. |

`data/example/mxt/heat_source/fire.json`:

```json
{
  "blocks": ["#example:heat/fire"],
  "max_temperature": 150,
  "heating_per_tick": 40
}
```

When several definitions hit one block only one of them is used: `priority` decides first and the larger number wins; only on a tie does it fall back to registry order. The numbers are never added together.

## Where the Heat Cell Is

The heat cell is the furnace's **bottom layer centre cell** (local index 4, directly below the centre of the layer above). That cell is **neither checked nor claimed** by the structure: only the four corners of the bottom layer count, so whatever stands there, or nothing at all, and whether its chunk is loaded, makes no difference to forming.

Only the block in that one cell can supply heat, read through this registry: when no definition claims the block, or the cell is empty, the furnace has no heat block, the settable ceiling is `0`, and starting a batch is refused over temperature without spending any materials.

A heat block's item tooltip prints the two numbers this registry gives it — a "Maximum furnace temperature" line and a "Heating: … per tick" line — while a block that implements the heat interface prints no numbers and only says the heat it gives depends on the block's own state.

A heat block is not consumed. Breaking the core does not drop it - it is a separate cell in the world and stays where it is. Removing it or swapping it for another block while a batch is running does not abort that batch: the temperature simply stops climbing and falls back at the furnace specification's `cooling_per_tick`.

## The Temperature Ceiling

What a player may actually set is the lowest of three: **the highest temperature this block gives**, the lowest rating among the 18 casings, and the [furnace specification](./alchemy_furnace.md)'s own optional `max_temperature`. The casings are described under [Wall Material](./alchemy_wall_material.md), and the set point with the cooling rate under [Furnace Specification](./alchemy_furnace.md).

## When the Block Answers for Itself

A block may implement `com.iafenvoy.mxt.api.AlchemyHeatSource` and answer the two numbers itself (a different value while it is lit than while it is out, or something that depends on what stands around it). Such a block **answers for itself and the value written for it in this table is ignored** - the interface is the finer control on top of the table, never required, and most blocks only need the table. Its answers must be finite and greater than zero, or the furnace treats that cell as having no heat block.

Looking at a heat block with Jade shows the same two numbers as block info - a "Maximum furnace temperature" line and a "Heating: … per tick" line - computed on the server and sent as Jade's server data, so a block that answers for itself shows its live value rather than a registry entry. Jade's own plugin settings can switch this display off on its own (it is listed as "Heat Source").

**The mod ships no heat block**, and no bundled values for lava or fire: what a block is worth is up to your data pack or content pack. The three blocks in the test pack exist for testing only and are not what a content pack should register.
