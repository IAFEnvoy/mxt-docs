---
title: AlchemyHeatSource
---

# AlchemyHeatSource

A block implements this to heat a furnace (`com.iafenvoy.mxt.api`). **It is optional**: the furnace reads the block in its **bottom centre cell**, and by default it only looks at the [`mxt:heat_source`](/en/datapack/json/heat_source) data map, which gives `max_temperature` and `heating_per_tick` per block or block tag; a block that implements this interface **answers for itself and the value written for it in that table is ignored**. Most blocks only ever need the table - the interface is for a block whose answer depends on its own state or on what stands around it (a lit fire, a filled brazier).

| Member | Description |
| --- | --- |
| `double maxTemperature(BlockState state, ServerLevel level, BlockPos pos)` | The highest temperature this block can give the furnace. |
| `double heatingPerTick(BlockState state, ServerLevel level, BlockPos pos)` | How many degrees it adds to the furnace temperature each tick. |

Both members are **read-only**, and both receive the block's own state, the `ServerLevel` it sits in and the **heat cell's own** `BlockPos` (never the core), so one block can answer differently depending on its state or its surroundings.

**The answer must be finite and greater than zero**, otherwise the furnace treats that cell as having no heat block: an illegal `maxTemperature` makes the whole furnace's settable ceiling `0`, and an illegal `heatingPerTick` counts as no heating at all, so the furnace only cools. Do not build a temperature curve or allocate a temporary object on every tick - the furnace reads these two numbers, and how the temperature advances is its own decision.

**Writing the temperature is not the implementer's job**: the temperature is the furnace core's own state (`setTemperature` / `setTargetTemperature` are members of [AlchemyWorkstation](./alchemy-workstation.md)) and only the server-side alchemy service advances it, so a block must not touch the batch or write a temperature itself. Reading happens on the server only, and never loads a chunk just to ask the question.

**The mod ships no production heat block**: the interface is in `api`, the block is what a content pack registers, and the numbers alone can live in `mxt:heat_source`. Furnace specs, the settable ceiling and the temperature tolerance are in [alchemy_furnace](/en/datapack/json/alchemy_furnace), and where the heat cell is plus the table itself are in [heat_source](/en/datapack/json/heat_source). The test pack carries three testing-only blocks: `mxt_test:alchemy_test_fire` (150 / 40, through a block tag entry), `mxt_test:alchemy_weak_fire` (80 / 10, through a `priority: 5` entry that beats the tag) and `mxt_test:alchemy_advanced_fire` (implements this interface: 250 / 25 while lit, 0 while out). They are not blocks for a content pack to copy.
