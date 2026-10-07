---
title: Define a Currency
description: "Give an existing item a denomination and a set of one-way exchanges: who claims it, when a stack is not money, and what the Exchange Station turns it into."
---

# Define a Currency

A currency definition is one file at `data/<namespace>/mxt/currency/<path>.json`, in the `mxt:currency` registry. It gives **an item that is already registered** a denomination: what the stack is worth, and what it can be turned into. It creates no item and changes none — **any registered item can act as currency**, vanilla, from another mod or registered by KubeJS, and the Exchange Station and the settlement service all read this one table.

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `items` | Item entry | none | Which items it claims: a single item id, a `#item tag`, or an array of them. |
| `item` | Item id | none | The shorthand for claiming exactly one item; it is the same as one item id inside `items`. |
| `value` | Long | **required** | The denomination of one item, and it has to be above `0`. |
| `unavailable_when` | `ItemCondition` array | `[]` | While a condition holds, this stack reads as worth `0` and shows the paired reason. |
| `exchanges` | Exchange array | **required** | One-way exchange entries; an empty array is allowed. |
| `priority` | Int | `0` | Ordering when several definitions claim one item: the higher number wins, and a tie falls back to registry order. |

At least one of `items` and `item` has to be written, `value` has to be positive and `exchanges` has to exist (write `[]` when there are none), or the definition is refused at load. The full field list is in [Currency](../datapack/json/currency.md).

## What You Are Building

| File | Purpose |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | *(one line added)* Registers the **Spirit Coin**. |
| `data/example/mxt/currency/spirit_coin.json` | The only definition on this page: it claims the coin, gives it a value and offers two exchanges. |

The Spirit Coin does not exist in the example pack yet, so step 1 registers it. The four items the pack already has are `kubejs:qi_pill`, `kubejs:root_pellet`, `kubejs:spirit_sword` and `kubejs:azure_manual` (see [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md)), and none of them is money, so this page **claims the newly registered `kubejs:spirit_coin`** rather than borrowing one of them.

## Step 1 — The Item Comes First

A currency definition can only reference an item that is **already registered**, and items are registered once, at startup:

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('spirit_coin')
    .displayName('Spirit Coin')
})
```

`event.create('spirit_coin')` produces `kubejs:spirit_coin` (an item registered without a namespace lives under `kubejs`). Editing this file needs a **game restart**: startup scripts run before the game registers its items, and `/reload` never runs them again.

**Why that is enough.** A currency value is not a property of the item but of the definition in the registry: the item only has to exist, and the number is written in `spirit_coin.json`. The same `kubejs:spirit_coin` can therefore be worth `1` in one pack and `100` in another without a line of code changing.

## Step 2 — Claiming Items: `item`, `items` and the Tie Rule

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": [
    {"cost": 10, "result": {"id": "mxt:spirit_stone"}}
  ]
}
```

Look at the claiming line first:

- `item` is the shorthand for "exactly one item" and it means the same as `items: ["kubejs:spirit_coin"]`. To claim a family of items, switch to `items`, which is written like every other table that claims items: `["kubejs:spirit_coin", "#example:coins"]`.
- Do not drop the namespace: an item a script registers without one lives under `kubejs`, and writing `example:spirit_coin` claims nothing.
- What a definition claims is a **matcher**, so tags and items mix freely; a single unknown item id fails the data pack load, while an unknown id inside an array only logs a line and drops that entry, leaving the rest of the file loaded.

**One item can be claimed by several definitions, and only one wins.** The order comes from each definition's own `priority`: the higher number first, and only two equal numbers fall back to registry order (that is, by entry id). It has nothing to do with whether the claim was written as an item or a tag, and both `value` and `exchanges` are read from the winner — the losing declaration contributes neither a value nor an exchange. The field defaults to `0`, so to override a same-item definition from another pack you raise your own; this example has one definition and can leave it out.

## Step 3 — `value`: What One Is Worth

`value` is the **per-item** denomination, an integer that has to be above `0`. The `1` above means "one Spirit Coin counts as 1". A stack is worth the denomination times its count, and both an overflow and "this is not currency" leave the question unanswered.

Two readers use that value, both from the same definition:

| Reader | What it gets |
| --- | --- |
| The item tooltip | One `item.mxt.currency_value` line, showing the **settled** per-item value. |
| The Exchange Station, the Cheque Table and the settlement service | The per-item value times the count, to price the whole stack. |

A tier multiplies the denomination: the quality's own `value_multiplier` is applied to the `value` written here, so a higher tier of the same currency is worth more according to its own tier. **`value` is not a cost**: it, and `exchanges[].cost` with it, are prices and never go through `Cost`.

`value` only answers "how much is it worth" — it does **not** answer "may it be spent". That is the next field.

## Step 4 — `unavailable_when`: When a Stack Is Not Money

`unavailable_when` is an array, and each entry pairs **an item condition** with **a reason**. While the condition holds, the stack reads as worth `0` and the reason is shown:

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "unavailable_when": [
    {
      "condition": {"type": "mxt:relative_durability", "comparison": "<=", "compare_to": 0},
      "reason": "tooltip.example.spirit_coin_worn"
    }
  ],
  "exchanges": []
}
```

| Field | Type | What it does |
| --- | --- | --- |
| `condition` | Item condition | While it holds, this stack reads as `0`; the types are in [Item Conditions](../datapack/types/condition/item_condition_types.md). |
| `reason` | Text | The reason shown to the player, as a translation key or a vanilla text component object. |

Three semantics to remember:

- **A holding condition means "worth 0", not "the definition is gone"**: the item is still currency, this stack is simply not worth anything right now. The Exchange Station also puts its options away (step 6).
- **A place with a player at hand evaluates the condition with that player**: the tooltip with the one looking at the item, the station with the one operating it. A **pure server-side query with no entity context does not guess**; it counts the entry as not holding, since it cannot judge one without a player.
- **The reason is a piece of text, not a required one**: written, it adds a red line under the value line; left out, the mod supplies a generic one (`tooltip.mxt.currency_invalid`).

"Worth how much" from step 3 and "counts as money or not" here are two different questions: `value` decides the amount, `unavailable_when` decides whether it counts at all at this moment. This example uses `mxt:relative_durability` for "a coin worn away is not taken"; the mod's own spirit stones use `mxt:spirit_storage_not_full` (a spirit stone that is not full is not money), see [Currency](../datapack/json/currency.md).

## Step 5 — `exchanges`: Turning This Currency Into Something

```json
// data/example/mxt/currency/spirit_coin.json
{
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": [
    {"cost": 10, "result": {"id": "mxt:spirit_stone"}},
    {"cost": 100, "result": {"id": "minecraft:gold_ingot", "count": 2, "components": {"minecraft:custom_name": "{\"text\":\"Spirit Note\"}"}}}
  ]
}
```

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `cost` | Integer | **required** | How many of the input slot's currency items are consumed, from `1` to `99`. |
| `result` | `ItemStackTemplate` | **required** | The stack produced by a successful exchange. |

`result` uses the item stack template shape, which has exactly three fields:

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | Item ID | none | **required**, the output item. |
| `count` | Integer | `1` | The output count, from `1` to `99`. |
| `components` | Object | none | An optional vanilla data component patch. |

Three semantics to remember:

- **An exchange is one-way.** The first entry says "10 Spirit Coins become 1 Spirit Stone" and it does **not** give you the reverse; to let a spirit stone become coins, write that entry in the spirit stone's own definition. "Two-way" is therefore always two definitions, one written in each.
- **`cost` counts items, not denominations.** It is not derived from `value`: 10 coins becoming a spirit stone and the spirit stone's own definition saying `10` are two independent facts, and the station does not work out the difference for you.
- **`result` takes no formula.** The count is the fixed `count`, so "make change according to the denomination" means writing more entries, or leaving it to a module other than the station. No entry can read a variable.
- **`components` is a vanilla data component patch**, which is what the second entry above uses to rename its output; it is written in vanilla component syntax, so mod definitions do not belong there.

`exchanges` is a required field: a currency with no exchanges still writes `"exchanges": []`. Such a currency **still has a denomination** (the tooltip prices it and settlement reads it), but the Exchange Station's input slot will not take it — see the next step.

## Step 6 — Using It at the Exchange Station

The `mxt:exchange_station` block is a stonecutter-style screen: one input slot, a column of options, one result slot. Place it, right-click it open, and put the currency into the input slot.

| What you see | Why |
| --- | --- |
| The currency will not go into the input slot | That slot only takes currency whose **exchange list is non-empty** and currently available: a definition with no exchanges is not an exchange input. |
| Swapping the item in the input slot | The option list is recomputed and the previous selection is dropped. |
| A column of options on the right | Exactly the `exchanges` entries of that definition, in array order. |
| An option selected with no output | The input count has not reached that entry's `cost` yet. |
| Taking the result | `cost` input items are consumed and whatever is left in the input slot stays. |

Both the list and the result are confirmed by the server; the client only draws the same options from the registry it was synced. The full behaviour is in the Exchange Station section of [Currency](../datapack/json/currency.md).

**Disabling a definition** is written at the top level of the file and uses the data pack's load-time conditions: while the condition does not hold the definition never enters the registry, so that item is not currency and takes no part in exchanges or settlement.

```json
{
  "neoforge:conditions": [
    {"type": "neoforge:never"}
  ],
  "item": "kubejs:spirit_coin",
  "value": 1,
  "exchanges": []
}
```

## Verify

Currency is a data pack registry, read when the **world loads**, and `/reload` does not read it again; items are registered at startup, so the two halves need one restart each:

```text
(restart the game)                → kubejs:spirit_coin exists only now
(load the world again)            → the currency definition is read only now
/mxt registries validate          → every problem in one pass
/mxt registries list              → mxt:currency=1
```

1. `/give @s kubejs:spirit_coin`: the tooltip gains a gold `item.mxt.currency_value` line showing `1`.
2. Change its `value` to `100`, open the world again and look again: that line follows.
3. Place an Exchange Station, right-click it open and put the coins in: the one entry in `exchanges` is listed on the right. Select it and the output appears in the result slot once you hold ten; take it and the input slot is ten coins lighter.
4. Set `exchanges` to `[]` and open the world again: the item **still has a denomination**, but it will no longer go into the station's input slot.
5. Make a stack that satisfies the condition in `unavailable_when` (this example's condition is `mxt:relative_durability`, so give it a `minecraft:max_damage` and a `minecraft:damage` component): the value line drops to `0` with a red reason line under it.
6. `/picker mxt:currency` lists the items these definitions claim.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The world refuses to load with a codec error | Neither `items` nor `item` was written, `value` is not positive, or `exchanges` is missing entirely — all three are refused at load. |
| No value line in the tooltip | This definition does not claim that item, or it does but a definition with a higher `priority` outranks it (the winner is what counts). |
| The number in the tooltip differs from `value` | That line shows the **settled** value: the quality's own `value_multiplier` multiplies the denomination. |
| The item will not go into the Exchange Station's input slot | This definition's `exchanges` is an empty array (legal, but not an exchange input), or its `unavailable_when` holds right now. |
| An option is selected but no result ever appears | The input slot holds fewer than that entry's `cost`; `cost` counts items, not denominations. |
| The reverse exchange does not exist | Exchanges are one-way: the reverse entry has to be written in the **target currency's own** `exchanges`. |
| Editing the JSON changes nothing | Data pack registries are read when the world loads and `/reload` does not read them again; and an unknown item id in `items` fails the whole load. |
| Writing `value_multiplier` in the currency definition does nothing | `value_multiplier` is a **quality** field, not a currency one; currency has `value` and nothing else for the amount. |

## Next

- [Currency](../datapack/json/currency.md) — every field in full, plus the Exchange Station's behaviour and how to disable a definition.
- [Generic Items and Components](../player-guide/items.md) — the mod's own four spirit stone tiers with their default currency values, and the Exchange Station, Trade Station and Cheque Table blocks.
- [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) — which file the registration in step 1 goes into, and when items and data packs each take effect.
