---
title: AlchemyHeatSource
---

# AlchemyHeatSource

An exotic-fire item implements this to heat a furnace (`com.iafenvoy.mxt.api`). **Implementing it is the whole of it** - the server-side alchemy service reads these two numbers and works out the warming, the holding and the cooling itself, so the item only answers "how hot can this fire get, and how many degrees does it add each tick".

| Member | Description |
| --- | --- |
| `double maxTemperature(ItemStack stack, ServerLevel level, BlockPos pos)` | The highest temperature this fire can reach in a furnace. |
| `double heatingPerTick(ItemStack stack, ServerLevel level, BlockPos pos)` | How many degrees this fire adds to the furnace temperature each tick. |

Both members are **read-only**, and both receive the single fire stack in the core (its count is always `1`), the `ServerLevel` it sits in and the core's `BlockPos` - so the same item can answer differently in different furnaces.

**The answer must be finite and greater than zero**, otherwise the furnace treats that fire as absent: an illegal `maxTemperature` makes the whole furnace's settable ceiling `0`, and an illegal `heatingPerTick` counts as no heating at all, so the furnace only cools. Do not build a temperature curve or allocate a temporary object on every tick - the furnace reads these two numbers, and how the temperature advances is its own decision.

**Writing the temperature is not the implementer's job**: the temperature is the furnace core's own state (`setTemperature` / `setTargetTemperature` are members of [AlchemyWorkstation](./alchemy-workstation.md)) and only the server-side alchemy service advances it, so an item must not touch the batch or write a temperature itself.

**The mod ships no production heat source**: the interface is in `api` and the item is what a content pack registers. Furnace specs, the settable ceiling and the temperature tolerance are in [alchemy_furnace](/en/datapack/json/alchemy_furnace), and whether a fire may go in or come out is answered by [AlchemyWorkstation](./alchemy-workstation.md).
