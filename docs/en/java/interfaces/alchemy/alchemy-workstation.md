---
title: AlchemyWorkstation
---

# AlchemyWorkstation

The contract a **placed furnace core** (a block entity) implements (`com.iafenvoy.mxt.api`): the framework reads the nine logical slots, the two temperatures, the heat cell and the structure result from it, and then hands the lighting, the advance and the settlement to the server-side alchemy service. The core holds the single furnace item and the active batch, while the heat block is a cell of its own in the world, and **the main, auxiliary and output bins keep their own items in their own block entities**, so `container()` is a live logical view rather than a copy of one inventory.

| Member | Description |
| --- | --- |
| `Container container()` | A **live view of the nine logical slots** (main 0-1, auxiliary 2-3, catalyst 4, output 5-8), not a copied input list. |
| `AlchemyWorkstationState state()` | The running batch and the two temperatures; this is what the server tick writes. |
| `BlockPos getBlockPos()` | The core's position. |
| `ItemStack furnaceItem()` | The single furnace item, count always `1`; callers **must not mutate it**. |
| `Optional<Holder<AlchemyFurnaceDefinition>> furnaceDefinition()` | The furnace spec this item resolves to. |
| `double temperature()` / `double targetTemperature()` | The current furnace temperature / the set temperature. |
| `boolean setTargetTemperature(double temperature)` | The set temperature: accepted, returning `true`, only when it is finite and lies between `0` and `maximumTemperature()`. |
| `void setTemperature(double temperature)` | Writes the current furnace temperature directly. |
| `BlockPos heatSourcePos()` | The heat cell: the centre cell of the bottom layer, which the structure never checks and never claims. |
| `double wallTemperatureLimit()` | The **lowest** of the 18 wall ratings; `0` as soon as one wall is missing, unloaded, or has no material or no readable material definition. |
| `double heatTemperatureLimit()` | The maximum temperature of the block in the heat cell; `0` when that cell is empty, unloaded, or the answer is not finite and positive. |
| `double maximumTemperature()` | The lowest of three: the specification's own optional `max_temperature`, the walls and the heat source; `0` when the walls or the heat source are unavailable (the furnace cannot run at all then). |
| `AlchemyFurnaceStructure.Status structureStatus()` | The structure result: formed, complete, missing blocks, unloaded chunks, cells claimed by another furnace. |
| `AlchemyPhase phase()` | `IDLE` / `WARMING` / `RUNNING` / `READY`. |
| `void setChanged()` | Marks the state dirty for saving and syncing after it changes. |

**The heat cell is the centre cell of the bottom layer** (local index 4, directly below the centre of the furnace above): that cell is neither checked nor claimed by the structure, and how it is read is on [heat_source](/en/datapack/json/heat_source). A heat block is not consumed; breaking the core does not drop it, because it stays where it is; removing it or swapping it for another block while a batch is running does not abort that batch - the temperature simply stops climbing and falls back at the specification's `cooling_per_tick`.

**The settable ceiling is the lowest of three limits**: `wallTemperatureLimit()` takes the lowest of the 18 wall ratings, and one missing wall, one unloaded wall, or one unreadable wall material definition makes it `0` - a high-rated wall may not average away a weak spot; `heatTemperatureLimit()` reads the maximum of the block in the heat cell, which is `0` when that cell is empty, its chunk is unloaded, or the answer is not finite and positive; `maximumTemperature()` then folds in the furnace specification's own optional `max_temperature` (write it as large as you like and it still cannot beat the other two), and gives `0` when the walls or the heat source are unavailable, in which case the set temperature can only sit at `0`. The set temperature must be finite and lie between `0` and that ceiling, and an illegal request is refused.

**Advancing and settling belong to the server-side alchemy service**: reading the heat of the block in the heat cell, pushing the temperature towards the set value without overshooting, entering and leaving `WARMING` / `RUNNING` / `READY`, generating the pending output, judging a batch as failed and settling it all happen there, so the core must not run a second temperature model in its own tick. **Lighting the furnace is not the core's job**: starting, previewing and aborting all go through `AlchemyWorkstationService` (`start` / `preview` / `abort`) in the [Public API](../../api.md), which takes the inputs it needs to decide from `container()`, `furnaceItem()`, `furnaceDefinition()`, `structureStatus()`, `getBlockPos()` and `state()` (busy or not, and which phase), plus `targetTemperature()` / `maximumTemperature()`; the core neither consumes the materials nor judges a recipe itself.

**The structure check follows the framework's fixed shell**: 3×3×3, with the core at `(1,1,0)`, the main bin on the left, the auxiliary bin on the right, the output bin directly above the middle centre cell (the centre of the top layer), and the other 18 cells as walls (the four bottom corners plus the two layers above), while the remaining five cells of the bottom layer are not checked; `structureStatus()` answers that check as it stands, reporting missing blocks, unloaded chunks and cells claimed by another furnace separately. The framework uses that to decide between skipping one tick (unloaded) and settling the batch as failed once (missing or conflicting).

**The core must not implement `Container`**: vanilla removal and hoppers would follow `Container` and eat the live stacks of the bins, so only the one logical transaction view, `container()`, may be handed out. `furnaceItem()` returns the live single item, and callers must not modify it in place.

Furnace specs, slot numbering and the catalyst position are in [alchemy_furnace](/en/datapack/json/alchemy_furnace).
