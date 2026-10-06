---
title: Item Aura (item_aura)
description: Turn an existing item into cultivation fuel; read the same definition the other way round and it is what describes holding right-click to pour aura into that item.
aside: false
---

# Item Aura (item_aura) {#item_aura}

`item_aura` turns an **existing item** into cultivation fuel: while cultivating, the whole stack is consumed tick by tick and the aura is released into the resource bar bound to the current realm stage. Read the same definition the other way round and it is what describes the holder holding right-click to pour aura into that item.

## File Location

`item_aura` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/item_aura/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/item_aura/qingxiao_spirit_crystal.json` is `example:qingxiao_spirit_crystal`. The mod's own entries live under `data/mxt/mxt/item_aura/`; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:item_aura` lists the items these definitions claim.

**Purpose**: Cultivation fuel provided by a held item.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `type` | Aura ID | **required** | The **aura** this item consumes and releases (an `mxt:aura` registry entry, such as `mxt:common`). |
| `aura` | `NumberProvider` | **required** | When a stack of items is processed for the first time, the aura total per item multiplied by the stack count is written into its `mxt:item_aura.remain`; for an item that can be poured into, it is the per-item charging maximum. |
| `consume_speed` | `NumberProvider` | **required** | Fuel value consumed per tick, multiplied by the stack count; the total consumption time therefore stays the same. |
| `release_speed` | `NumberProvider` | **required** | Fuel amount released per tick into the resource bar of the current realm stage, multiplied by the stack count. |
| `result_stack` | `ItemStackTemplate` | none | An extra item returned when the current item is fully exhausted; leave it out and the original item is simply removed. |
| `exhausted_action` | `EntityAction` | `mxt:no_op` | The behaviour that runs when the current fuel is exhausted. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. It decides which aura is poured and burned. |

When several definitions hit one item, the one with the highest `priority` wins (the field defaults to `0`); only two definitions with the same `priority` fall back to registry order. **Whether `items` names an item or a tag is irrelevant**: any definition that hits is ranked by the number it declares, and naming the item by id does not move it up.

`type` names the **aura**, not the value it is counted in (the value is what the aura definition's `resource` points back at), and not an `mxt:element` either: the element is that aura definition's `aura_type`, and it only takes part in the type checks of spirit roots, creature preferences and environment rendering. One read or write handles a single aura; recipes or behaviours that need several auras have to handle them separately.

`aura`, `consume_speed` and `release_speed` must all evaluate to a **positive number** at actual runtime; spirit stone storage counts in whole units, and the fractional part does not count towards capacity.

## Example

`data/example/mxt/item_aura/qingxiao_spirit_crystal.json`:

```json
{
  "items": "example:qingxiao_spirit_crystal",
  "type": "example:spirit_power",
  "aura": 180,
  "consume_speed": 1,
  "release_speed": 3,
  "result_stack": {"id": "mxt:impurity", "count": 1},
  "exhausted_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:regeneration",
    "duration_ticks": 100
  }
}
```

The speeds can also be written as formulas, and `items` may be an item tag that covers a whole family with one definition:

```json
{
  "items": "#example:spirit_fuel",
  "type": "mxt:common",
  "aura": 100,
  "consume_speed": "0.5 + level * 0.05",
  "release_speed": "1 + level * 0.1",
  "exhausted_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:fire_resistance",
    "duration_ticks": 40
  }
}
```

## Burning: How the Stack Is Spent While Cultivating

The aura fuel value is hidden server-side state. When processing starts, the system takes the whole matching stack out of the player's inventory and puts it into the entity's `mxt:float_holding_item` attachment; the `mxt:item_aura` component is then written onto that one stack only, and the component has just one field, `remain`. Every server tick after that, the definition matched at that time subtracts `consume_speed × stack count` and charges `release_speed × stack count` into the resource bar bound to the current realm stage, still clamped by that bar's own maximum. Both sides are multiplied by the stack count, so the **total consumption time does not change with the stack count**: one stack and one item at a time take the same number of ticks.

When the attachment is empty, the system first resumes a stack from the inventory that carries the `mxt:item_aura` component and still matches a valid definition, always picking the stack with the **smallest** `remain`; only when there is no half-exhausted stack does it take a whole new matching stack, in the order main hand, off hand, then inventory, and write the `aura` computed from the stack count into the component. Interrupting cultivation, logging out or dying returns the stack in the attachment unchanged; only when `remain` runs out is anything settled: ordinary fuel is removed and `result_stack` is given for the original count, while an item with its own storage (the ones that can be poured into, a spirit stone for instance) is drained and **returned unchanged**, so `result_stack` does not apply to it. `exhausted_action` runs after that settlement.

`mxt:float_holding_item` can also be used by other mechanics to hold items temporarily, so the aura service only touches items that carry the `mxt:item_aura` component **and** still match a valid definition; an attachment item that does not qualify is not moved, modified or deleted. The client renders no fuel bar, and never deducts or consumes items on its own.

::: info

An item that can be poured into (a spirit stone is one) has its own storage component, `mxt:spirit_storage`; its content and capacity are described under "The Reverse Direction: Pouring" below.

:::

## The Reverse Direction: Pouring (Hold Right-Click to Charge)

An item that can be poured into takes the holder's own aura when **right-click is held**, reading this definition's two speed fields the other way round:

| Direction | Item side | Holder side |
| --- | --- | --- |
| Burn (while cultivating) | `−consume_speed × stack` per tick | `+release_speed × stack` per tick |
| Pour (while holding right-click) | `+consume_speed × stack` per tick | `−release_speed × stack` per tick |

Both sides use the same pair of numbers, so pouring aura in and burning it out cancel exactly: a pour creates no aura, it only stores the holder's aura in the item for a while (a spirit stone is a battery). The gesture, the pose (`BLOCK`) and the sound (an amethyst chime) come from the hold module, the same mechanism reading a technique manual uses.

- **Which aura is poured**: decided by the `type` of the definition this item hits — the same one it burns; when several definitions hit, the one with the **highest** `priority` wins (the field defaults to `0`), and only a tie falls back to registry order. An item that has already stored something goes by **the record it made itself**: `mxt:spirit_storage` files amounts under the **aura** key (the same component a talisman uses), so re-typing the definition's `type` later cannot silently reinterpret the spirit stones already in the world — they simply stop matching the new `type` and can be neither filled nor burned.
- **Whole-unit pouring**: the storage itself records **fractional** numbers (a flying artifact burns its per-tick fuel at that precision), but the pour gesture moves whole units, so a tick injects `max(1, floor(consume_speed × stack))`. That is the only place a declared rate is not applied exactly; a speed that evaluates to zero or is illegal means the item does not become a pour at all (the right-click only reports that it cannot take anything).
- **Gesture length**: `ceil(capacity / intake per tick)`, capped at 200 ticks. An item whose capacity is far larger than its intake is not filled in one gesture; repeat the gesture. A full item is never armed again (the right-click reports that it is full). The length is derived from the **capacity** rather than the deficit, so it does not change as the item fills within one gesture.
- **An item without the component counts as full**, so a freshly crafted spirit stone is already full, and pouring really only affects stones that have been drained and empty ones taken from the creative menu. The storage component's shape is one table of aura → stored amount (`{amounts:{"mxt:common":100}}`, the keys being `mxt:aura` registry entries and the values fractional numbers); an item may hold a single aura (a spirit stone, which reads its **only** record) or several (a talisman carrier, read entry by entry against its capacity); an empty table means drained. Capacity is always answered by the item itself (a spirit stone takes the definition's `aura`, a talisman works it out from the `capacity` multiplier).
- **Price and failure**: payment, storing aura in a spirit vessel and the burn direction all take the same route (they do not pass the resource use gate), and how many whole units can be afforded is decided before paying, so a tick can never take payment and put nothing in. When no whole unit can be paid for, that tick injects nothing and pays nothing, and the action bar reports insufficient aura.
- **Feedback**: the action bar shows the item's own `stored / capacity (percentage)`, in the same colours as the tooltip; the tooltip, the display stand and the `mxt:spirit_storage_not_full` condition read that same value.
- Environment aura takes no part in pouring: a pour only moves the holder's own pool. An item that can be burned but **cannot be poured into** (a spirit crystal that is only fuel, for instance) does not gain right-click charging from that; conversely, whether an item "can be charged" is decided by the item and the definition together.
- **An item may also declare its own pouring**. `item_aura` is the shared language of "one item", with capacity scaled by the stack count; an item whose capacity depends on **what is written on this particular stack** answers for itself (one entry per aura — how much is stored and how much fits, in pouring order), with the numbers given for the whole stack and no longer multiplied by the count. A talisman carrier is such an item: its capacity is the inscribed definition's `capacity` multiplier times one invocation's aura amount (the multiplier that applies is further capped by the carrier's remaining uses), measured per aura. Such an item does **not** need an `item_aura` definition, and so does not incidentally become cultivation fuel. The **rate and price of a pour are still the gesture's** (a self-described store is poured at 1 unit per tick, 1:1; with a definition, the definition's two speeds are used in reverse), and the item only has to say clearly what it is.
- **What happens once it is full is up to the item, but the writer reports it**: whoever writes aura into a store (the hold-to-pour gesture, writers such as the display stand) reports only **after a real write**, and the item decides whether it is full and whether to act. The report carries both the **actor** and **where this write happened**: the actor pays and answers for the ability, while the position is **where this thing is** — a talisman on a display stand is filled by someone standing elsewhere or by a spirit burst, so the position cannot be read off the holder; it also has to say whether this counts as a **hand's spending** or a **placed store's spending**, which is exactly what tells the talisman's two rule sets apart (cooldown only counts the hand path, spending is split by position). That is where a talisman invokes, writing the position into the ability's formula (`block_x`/`block_y`/`block_z`) **and handing it to positional behaviours as this invocation's origin** (projectiles, particles, explosions, sounds, movement, block behaviours; see [Pouring and Invocation](./talisman.md) for the details).

## Disabling a Definition

The condition goes at the **top level of the file** (one file is one definition). When it does not hold the definition never enters the registry:

```json
{
  "neoforge:conditions": [
    {"type": "neoforge:never"}
  ],
  "items": "example:legacy_fuel",
  "type": "mxt:common",
  "aura": 100,
  "consume_speed": 1,
  "release_speed": 1
}
```

A definition whose condition does not hold is as good as absent: that item has no such definition. The available conditions are on the [Datapack Development Overview](../overview.md#disabling-a-definition).
