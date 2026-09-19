---
title: Item Aura (item_aura)
description: "Define an existing item as aura fuel that is consumed and released into the current realm's resource bar while cultivating, and that can be poured into by hand."
---

# Item Aura (item_aura)

An Item Aura defines an existing item as aura fuel used during cultivation: while it is held, the item is consumed tick by tick and its aura is released into the resource bar bound to the current realm stage. The same definition is also what describes the item when the direction is reversed and a holder pours aura into it by hand.

## File Location

Item Aura JSON files go in `data/<namespace>/mxt/item_aura/` within your data pack.

**Purpose**: Cultivation fuel provided by held items.

The filename corresponds to its ID. For example, `data/example/mxt/item_aura/spirit_stone.json` has the ID `example:spirit_stone`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | The existing items that can act as aura fuel while held. A single item ID, an item tag, or a mixed array of both. |
| `type` | `Holder<aura>` | **required** | The aura this item consumes and releases — an entry of the `mxt:aura` registry, such as `mxt:common`, not the stored value it is counted in (that value is named by the `resource` field of the aura definition) and not an `mxt:element` either. Which element it belongs to is read from that aura's own `aura_type`. |
| `aura` | `NumberProvider` | **required** | When a stack of items is processed for the first time, the aura total per item multiplied by the stack count is written into its `mxt:item_aura.remain`. It must evaluate to a positive number at actual runtime; spirit stone storage counts in whole units, and the fractional part does not count towards capacity. For items that implement `ItemAuraAccess`, `aura` acts as the charging maximum of each item instead. |
| `consume_speed` | `NumberProvider` | **required** | Fuel value consumed per tick, stacked by the stack count; the total consumption time stays the same. It must evaluate to a positive number at actual runtime. The pouring direction reads the same value the other way round: it is also the whole units injected into the item per tick. |
| `release_speed` | `NumberProvider` | **required** | Fuel amount released per tick into the resource bar of the current realm stage, stacked by the stack count. It must evaluate to a positive number at actual runtime. The pouring direction reads the same value the other way round: it is also the amount deducted from the holder's aura pool per tick. |
| `result_stack` | `ItemStackTemplate` | none | An additional return item given when the current item is fully exhausted; when it is not configured, the original item is simply removed. For items that implement `ItemAuraAccess`, `result_stack` does not take part in processing: such items keep themselves and are simply drained. |
| `exhausted_action` | Entity Action | `mxt:no_op` | The behaviour when the current fuel is exhausted. |

Every entry must fill in `type`, which is the aura the item consumes and releases (an `mxt:aura` entry such as `mxt:common`). It is not the stored value the aura is counted in — the aura definition's `resource` field points back at that — and it is not an `mxt:element` either: the element is the aura's own `aura_type`, and it only takes part in the type checks of spirit roots, creature preferences and environment rendering. The aura exchange interface handles one aura at a time; recipes or behaviours that need several kinds of aura should call the interface separately for each of them.

## Example

```json
{
  "items": "mxt:spirit_stone",
  "type": "mxt:common",
  "aura": 100,
  "consume_speed": 1,
  "release_speed": 2,
  "exhausted_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:fire_resistance",
    "duration_ticks": 40
  }
}
```

A definition whose speeds are formulas:

```json
{
  "items": ["mxt:spirit_stone", "#example:spirit_fuel"],
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

## Runtime Behaviour

The aura fuel value is hidden server-side state. When processing starts, the system takes the whole matching stack out of the player's inventory and puts it into the entity `mxt:float_holding_item` attachment; the `mxt:item_aura` component is then written only onto that stack, and the component has just one field, `remain`. On every server tick the definition matched at that time is used to subtract `consume_speed × stack count` from `remain` and to charge `release_speed × stack count` into the resource bar bound to the current realm stage, and the resource bar is still clamped by its own maximum. The total consumption time therefore does not change with the stack count.

When the attachment is empty, valid items in the player's inventory that carry the `mxt:item_aura` component are resumed first, and the stack with the smallest `remain` is always chosen; only when there is no half-exhausted item is a whole new matching stack taken, in the order main hand, then off hand, then inventory, and the `aura` computed from the stack count is written into the component. When cultivation is interrupted, or the player logs out or dies, the stack in the attachment is returned unchanged; when `remain` runs out, an `ItemAuraAccess` item is returned as a whole stack in an empty charging state, while other items are removed and the optional `result_stack` is given for the original stack count, after which `exhausted_action` runs.

`float_holding_item` can be used by other mechanics to hold items temporarily. The aura fuel service only consumes items that both carry the `mxt:item_aura` component and still match a valid `item_aura` definition; attachment items that do not qualify are not moved, modified or deleted.

::: info

The client does not currently render a fuel bar, and does not deduct or consume items on its own.

:::

## The Reverse Direction: Pouring

An item that implements `UseItemAuraAccess` can be charged by **holding right click**: the holder's own aura is poured into it, reading the other two fields of this definition the other way round. The spirit stone is such an item — it implements the pouring interface to join the gesture, while its shape is still described by this definition, so leaving `SpiritPour` empty means "follow the definition".

| Direction | Item side | Holder side |
|-----------|-----------|-------------|
| Release (while cultivating) | `−consume_speed × stack` per tick | `+release_speed × stack` per tick |
| Pour (while holding right click) | `+consume_speed × stack` per tick | `−release_speed × stack` per tick |

Both directions use the same pair of numbers, so pouring in and burning out cancel exactly: a pour does not create aura, it only stores the holder's aura in the item for a while. The gesture, the pose (`BLOCK`) and the sound are driven by the hold module, shared with reading a technique manual, so an item needs no code beyond implementing the interface.

- Which aura is poured is the `type` of the `item_aura` definition that matches the item — the same one it burns; when several definitions match, the first one in registry order is taken. An item that has already stored something goes by the aura it recorded itself: `mxt:spirit_storage` files amounts under the **aura** key (`{amounts:{"mxt:common":100}}`, shared with the talisman carrier), so re-typing a definition later cannot silently reinterpret spirit stones already in the world — they simply stop matching the new `type`, and can then neither be filled nor burned.
- Whole units: an item store counts in whole units, so a tick injects `max(1, floor(consume_speed × stack))`. That is the one place a declared rate is not applied exactly; a speed that evaluates to zero or to something illegal means the item is not poured at all, and the click only reports that it cannot take anything.
- Gesture length: `ceil(capacity / intake per tick)`, capped at 200 ticks. An item whose capacity dwarfs its intake is not filled in one gesture and needs several; a full item is never armed again, and the click reports that it is full. The length is derived from the **capacity** rather than from the deficit, so it does not change as the item fills.
- An item without the component counts as full (the existing reading of `SpiritStoneItem`), so a freshly crafted spirit stone is already full; pouring really only affects stones that have been drained and empty ones taken from the creative menu. The store component is one table of aura → stored units (`{amounts:{...}}`); an item may hold a single aura (a spirit stone, which reads its **only** record) or several (a talisman carrier, billed line by line). An empty table means drained, and the capacity is always answered by the item itself — a spirit stone takes it from the definition, a talisman carrier from its bill.
- Cost and failure: payment goes through `ResourceService` (the same way a spirit vessel stores aura and the release direction works; it does not pass the resource use gate), and whether a whole unit can be afforded is decided before paying, so a tick never takes payment and stores nothing. When no whole unit can be paid for, that tick injects nothing, pays nothing and reports insufficient aura on the action bar.
- Feedback: the action bar shows the item's own `stored / capacity (percentage)`, in the same colours as the tooltip; the tooltip, the display stand and the `mxt:spirit_storage_not_full` condition read that same value.
- Environment aura takes no part in pouring: a pour only moves the holder's own pool. An item that can be burned but does not implement the interface (a spirit crystal that is only fuel) does not gain right-click charging, and conversely whether an item can be charged is decided by the interface together with the definition.
- An item may also declare its own pour. `item_aura` is the shared language of "one item", scaled by the stack count; an item whose capacity depends on **what is written on this particular stack** answers for itself in `UseItemAuraAccess.pour` (one entry per aura — how much is stored and how much fits, in pouring order), with the numbers given for the whole stack and not multiplied by the count. A talisman carrier is such an item: its capacity is the `aura_cost` total of the inscriptions, measured per aura. Such an item does **not** need an `item_aura` definition, and so does not incidentally become cultivation fuel. The rate and cost of a pour are still the gesture's — a self-described store is poured at one unit per tick, one for one, while an item with a definition has those two speeds used in reverse — the item only has to say clearly what it is.
- What happens when it is full is up to the item, but the writer reports it: whoever writes aura into a store (the hold-to-pour gesture, aura-access blocks such as the display stand) calls `UseItemAuraAccess.onCharged(source, stack)` after a real write, and the item decides whether it is full and whether to act. The report carries a `SpiritSource(level, position, actor, consumedByHand)`: the actor pays and is asked for the ability, while the position is **where this thing is** — a talisman on a display stand is filled by someone standing elsewhere, or by a spirit burst, so the position cannot be read from the holder; `consumedByHand` says whether spending it counts as a hand's spending or as a placed store's, which is the only thing the talisman's two rule sets are told apart by. That is where a talisman invokes: it writes the position into the ability's formula (`block_x`/`block_y`/`block_z`) and hands it to positional behaviours as the origin of this invocation.

## Disabling an Entry

Like other datapack registries, an entry can be disabled through `data/mxt/tags/mxt/item_aura/disabled.json`.

