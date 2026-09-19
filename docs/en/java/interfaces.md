---
title: Interfaces
description: "The public interfaces a Java addon implements: AuraAccess, ItemAuraAccess, UseItemAuraAccess, TooltipAppender, Cost and HotbarEntry."
---

# Interfaces

These are the interfaces a Java addon implements or consumes directly. They are the seams between the framework and your content: aura exchange, item charge, tooltips, costs and the client hotbar.

## Overview

| Interface | Purpose |
|-----------|---------|
| `AuraAccess` | The aura access interface implemented by block entities such as display stands and containers. |
| `ItemAuraAccess` | The storage interface implemented by chargeable items. |
| `UseItemAuraAccess` | The interface that lets an item be poured into by holding it down; extends `ItemAuraAccess`. |
| `TooltipAppender` | The NeoForge tooltip extension point each item module registers its own appender through. |
| `Cost` | The abstraction for what an ability, a formation or another action consumes. |
| `HotbarEntry` | A pure client-side entry rendered by the shared hotbar. |

## `AuraAccess`

The **aura access** interface implemented by block entities such as display stands and containers: it exchanges whole units of one aura at a time (`insert`/`extract` handle one aura per call and return the amount that could **not** be moved; `simulate=true` only simulates and changes no state), and the capacity comes from `getCapacity(entity)`.

The parameter is a `Holder<Aura>` rather than a `resource`: a `resource` is only a numeric system (bounds, an icon, the bars), and it does not know what its own number is for; the `aura` is the identity of *which aura* it is, and it references a `resource` as the unit it is measured in (`Aura.resource()` = "which number do I count in"). So every field, parameter and storage key that means "which aura" uses a `Holder<Aura>` — the access interfaces, item and block stores, the environmental aura pools and `item_aura.type` all do. Conversely, a pure counter has no aura identity and therefore **cannot** be stored in an item (it can enter a player's pool, because pools are keyed by value). For the semantic boundary see `research/audit/resource-cultivation-split.md` §7.3/§7.4.

| Member | Description |
|--------|-------------|
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity)` | Returns the data-driven capacity for each aura this target can accept. |
| `int getCapacity(@Nullable LivingEntity entity, Holder<Aura> aura)` | The capacity of one aura; a convenience default that reads the map above. |
| `int insert(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | Attempts to move one aura in; the return value is the part of `amount` that could not be moved. |
| `int extract(@Nullable LivingEntity entity, Holder<Aura> aura, int amount, boolean simulate)` | Attempts to move one aura out; the return value is the part of `amount` that could not be moved. |
| `static int requireNonNegative(int amount)` | Rejects a negative amount with an `IllegalArgumentException`. |

## `ItemAuraAccess`

The **storage** interface implemented by chargeable items, which answers only three things: which auras it can take (`getCapacity`), how much went in (`insert`) and how much came out (`extract`). Beyond the aura, the in/out operations and the simulate parameter, the capacity is computed dynamically from the item through `getCapacity(LivingEntity, ItemStack)`, so a capacity must never be hard-coded in Java. Which aura is stored and how much of it is recorded on the item itself by the `mxt:spirit_storage` component (a table of "aura → stored units" keyed by `Holder<Aura>`, shared by spirit stones and talisman carriers), which is why `SpiritStoneItem` treats its definition only as the source of the capacity and does not re-read an existing store as another aura when a datapack changes `item_aura.type`. A missing component reads as "full" for a spirit stone and as "empty" for a talisman, and that answer is **given by the item**, not by the component — the component is only data.

Storage is asked **from anywhere**: a display stand reading and writing a talisman, the hotbar reading an item and an `item_aura` definition describing an item all use this interface. So an item that only implements it is **stored into**, and is not "poured into by holding right-click" — that gesture is something an item separately opts into, see below.

| Member | Description |
|--------|-------------|
| `Object2IntMap<Holder<Aura>> getCapacity(@Nullable LivingEntity entity, ItemStack stack)` | Returns the current data-driven capacity of this stack, including every item in the stack. |
| `int getCapacity(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura)` | The capacity of one aura in this stack; a convenience default that reads the map above. |
| `int insert(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | Attempts to add one aura to this stack; the return value is the part of `amount` that could not be moved. |
| `int extract(@Nullable LivingEntity entity, ItemStack stack, Holder<Aura> aura, int amount, boolean simulate)` | Attempts to extract one aura from this stack; the return value is the part of `amount` that could not be moved. |

## `UseItemAuraAccess`

The interface that lets an item be **poured into by holding right-click**, and it extends `ItemAuraAccess`: `HoldBinding`/`HoldService` own the gesture and the pose, and `SpiritChargeService` takes aura out of the holder's own pool every tick and writes it through `insert`. Implementing it **does not** mean describing your own shape — the spirit stone implements it and leaves `pour` empty, so it falls back to the shared reading of the `item_aura` definition. What it expresses is "this item can be held down and poured into", not "this item is special". A store that does not implement it (a generic item that only holds things, for instance) is never armed into the gesture.

It is split into two interfaces because "storage" and "being poured into" are not the same thing: storage can be asked anywhere, while being poured into happens only when somebody performs the gesture on the stack in their own hand. The three default methods correspond to the three moments of the gesture:

- **`pour(Provider registries, ItemStack stack)`** (before the gesture starts, and every tick after) — what this container **is**: a `SpiritPour` split by aura (how much of each aura is stored, and its limit, **in the order a pour should fill them**), with the numbers given for the whole stack and no longer multiplied by the stack. The default returns empty, meaning "I have nothing of my own to say", which falls back to the shared reading of the `item_aura` definition (the route the spirit stone takes). Only an item whose capacity depends on **what is written on this stack** (a talisman carrier) overrides it. Both sides ask it (the client sizes the gesture by it), so an implementation may only read the `Provider` it is handed and must answer the same for the same stack. Rates and costs are **not** here — they belong to the gesture (the definition route uses the two speeds in opposite directions, a self-describing store uses 1 unit/tick at 1:1).
- **`canPourInto(@Nullable LivingEntity holder, ItemStack stack)`** (every tick, **before the aura is paid**) — whether this tick is worth pouring. The gesture's order is "take the aura, then `insert`, then `onCharged`", so any case where "inserting it would be pointless" would waste aura for nothing; this method lets the item refuse before the payment. The default is `true` (a container that only takes has nothing to object to), and only items that **fire themselves when they are filled** override it — a talisman overrides it as `TalismanService.canFireFrom`, that is, "is this holder's cooldown window still open". Note that this is **not** the "should it fire automatically" question: that is decided by the carrier's own mode (the `mode` of the `mxt:talisman` component, where `fire` fires as soon as it is full and `store` only accumulates), which is a different thing from the pouring gate.
- **`onCharged(SpiritSource source, ItemStack stack)`** (after one **real** move) — "I was filled", and the item itself decides whether that means full and whether to act. The default does nothing.

**The writer is responsible for reporting**: whoever writes aura into a store (a held pour, an `AuraAccess` block entity, and so on) calls `onCharged(SpiritSource, ItemStack)` **after the real write** (`simulate` does not count), and the item decides for itself "is this full" and what follows from it (a talisman fires here and consumes one carrier item). It is the writer that reports rather than the item judging inside its own `add` because only the writer knows **where this thing is and who paid**: a talisman on a display stand was filled by somebody standing elsewhere (or by a spirit burst). `SpiritSource(level, position, actor, consumedByHand)` carries the position and the actor together — the actor pays, is recorded and answers for abilities; the position is the place of this activation, entering formulas as `block_x`/`block_y`/`block_z` and handed to position-type behaviours as the **origin** (see [The Reverse Direction: Pouring](../datapack/json/item_aura.md#the-reverse-direction-pouring)). And precisely because reporting is opt-in: a writer that meets an item implementing storage only has nothing to report in the first place.

## `TooltipAppender`

The item modules register their tooltips with the NeoForge `TooltipAppender`. Each module uses its own appender, so the resource, currency, quality and aura storage displays stay uncoupled from one another.

## `Cost`

The abstraction for what an ability, a formation or another action consumes. It provides player-facing check and consume methods, and a new cost type must be dispatched through the built-in registry rather than by writing a Java class name into JSON.

| Member | Description |
|--------|-------------|
| `boolean check(Player player)` | Returns whether the player can pay this cost. |
| `void consume(Player player)` | Consumes the cost from the player. |
| `MapCodec<? extends Cost> codec()` | The codec of the concrete cost type. |
| `Codec<Cost> TYPED_CODEC` | The type-dispatched codec read from the `type` field. |
| `Codec<Cost> CODEC` | The codec used by data files; it also accepts the legacy resource shorthand `{ "id": ..., "amount": ... }` next to a typed cost. |
| `Codec<List<Cost>> LIST_CODEC` | A list of costs, used by the fields that accept several costs at once. |

Register a new cost type through `MxtRegistries.COST_TYPE`, as shown in [Registries and Data Tables](./registries.md).

## `HotbarEntry`

The pure client-side entry interface. It provides a name, an optional icon, an accent colour and the press, held-tick and release callbacks used by the shared hotbar, plus the `cooldown(Player)` and `canPress(Player)` hooks; `render(...)` can be overridden in full.

| Member | Description |
|--------|-------------|
| `Component name()` | The entry's display name. |
| `Identifier id()` | A stable option ID used by configurable hotbar layouts; may be `null`. |
| `Optional<IconReference> icon()` | An optional icon, either an item or a texture. |
| `int accentColor()` | The accent colour drawn on the entry. |
| `void onPress(Player player)` | Called when the entry is pressed. |
| `void onPressTick(Player player)` | Called every client tick while the entry is held. |
| `void onRelease(Player player)` | Called when the entry is released. |
| `float cooldown(Player player)` | The remaining cooldown fraction, matching vanilla item cooldown rendering: `0` means ready and `1` means the cooldown has just started. |
| `boolean canPress(Player player)` | Prevents an entry that is still on cooldown from becoming visually pressed or sending a use request. |
| `void render(...)` | Draws the entry; override it to change the visuals without changing the shared overlay. |

See [Hotbar Entries](./hotbar.md) for a complete implementation example.
