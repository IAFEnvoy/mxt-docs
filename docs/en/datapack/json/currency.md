---
title: Currency (currency)
description: Gives a registered item a denomination and a set of one-way exchanges, defined by the mxt:currency registry.
aside: false
---

# Currency (currency)

A currency definition gives an **existing item** a denomination and a set of one-way exchanges: what it is worth, and what it can be turned into. Any registered item can act as currency — the Cheque Table, the Exchange Station and the settlement service all read the same `mxt:currency` registry.

## File Location

`currency` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/currency/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/currency/copper_coin.json` is `example:copper_coin`. The mod's own entries live under `data/mxt/mxt/currency/`; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper**, and one file describes one definition; to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:currency` lists the items these definitions claim.

**Purpose**: Item currency denominations and exchange.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | none | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `item` | Item id | none | Shorthand for claiming exactly one item; equivalent to writing one item id in `items`. |
| `value` | Long | **required** | Denomination of one item; must be greater than `0`. |
| `unavailable_when` | `ItemCondition` array | `[]` | Each entry binds one item condition to one reason; while the condition holds, the currency value of this stack reads as `0` and the matching reason is shown. |
| `exchanges` | Exchange entry array | **required** | One-way exchange options; may be written as an empty array. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

At least one of `items` and `item` has to be written: a definition with neither, or with a `value` that is not positive, is refused at load time.

When several definitions hit one item, only the one with the highest `priority` wins (the field defaults to `0`); only two definitions with the same `priority` fall back to registry order, and both `value` and `exchanges` are read from it — the losing one contributes neither a value nor any exchange. **Whether `items` names an item or a tag is irrelevant**.

### `unavailable_when`

Each entry pairs an existing item condition with a piece of reason text. `reason` may be a translation-key string or a vanilla text component object. Places that have a player at hand (the Cheque Table, the Exchange Station and tooltips) evaluate the condition with the current player; a pure server-side query with no entity context does not guess at the condition result.

`data/example/mxt/currency/spirit_stone.json`:

```json
{
  "item": "mxt:spirit_stone",
  "value": 10,
  "unavailable_when": [
    {
      "condition": {"type": "mxt:spirit_storage_not_full"},
      "reason": "tooltip.mxt.currency_spirit_not_full"
    }
  ],
  "exchanges": []
}
```

## Exchange Entries

Entries in `exchanges` are displayed in array order in the Exchange Station's stonecutter-style option list.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `cost` | Integer | **required** | How many currency items are consumed from the input slot; range `1..99`. |
| `result` | `ItemStackTemplate` | **required** | The item stack produced by a successful exchange. |

`result` uses the item stack template shape:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | Item ID | none | **required**, the output item. |
| `count` | Integer | `1` | Output count; range `1..99`. |
| `components` | Object | none | Optional vanilla data component patch. |

::: warning Exchanges Are One-Way

An `exchanges` array only describes turning **this** currency into something else. To allow the reverse, write the reverse entry explicitly in the `exchanges` of the target currency.

:::

## Examples

`data/example/mxt/currency/copper_coin.json`, claiming a batch of items at once:

```json
{
  "items": ["minecraft:iron_nugget", "#example:nuggets"],
  "value": 1,
  "exchanges": []
}
```

`data/example/mxt/currency/iron_coin.json`, using the `item` shorthand and offering two exchanges:

```json
{
  "item": "example:iron_coin",
  "value": 10,
  "exchanges": [
    {
      "cost": 1,
      "result": {
        "id": "example:copper_coin",
        "count": 10
      }
    },
    {
      "cost": 10,
      "result": {
        "id": "mxt:gold_coin"
      }
    }
  ]
}
```

A tag with a component-carrying output:

```json
{
  "items": "#minecraft:emeralds",
  "value": 100,
  "exchanges": [
    {
      "cost": 4,
      "result": {
        "id": "minecraft:diamond",
        "components": {
          "minecraft:custom_name": "{\"text\":\"Exchange Token\"}"
        }
      }
    }
  ]
}
```

A currency with no exchange options must still write an empty array; `exchanges` is a required field:

```json
{
  "item": "minecraft:emerald",
  "value": 100,
  "exchanges": []
}
```

## Exchange Station Behaviour

The Exchange Station is a stonecutter-style screen: the input slot only accepts currency items carrying a non-empty `exchanges`; the right side lists every exchange entry of that currency; and after an entry is selected, the result slot shows the output only once the input count reaches `cost`. Taking the result consumes `cost` input items.

Both the list and the result are confirmed by the server-side menu; the client only draws the same options from the synchronized registry.

## Disabling a Definition

The condition is written **at the top level of the file** (one file is one definition). When it does not hold, the definition never enters the registry at all:

```json
{
  "neoforge:conditions": [
    {"type": "neoforge:never"}
  ],
  "item": "example:legacy_coin",
  "value": 1,
  "exchanges": []
}
```

A definition whose condition does not hold is as good as unwritten: that item is not currency and takes no part in exchanges, cheques or settlement. The available conditions are on the [Datapack Development Overview](../overview.md#disabling-a-definition).

## Validation and Loading

- `items` may only name item ids that are already registered, plus `#item tags`; a matcher entry carrying a `type` is written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page.
- At least one of `items` and `item` has to be written and `value` must be greater than `0`; otherwise the definition fails to load.
- While any condition in `unavailable_when` holds, that stack takes no part in currency settlement and its value reads as `0`.
- `exchanges` must be present; write `[]` when no exchange is offered.
- When several definitions hit one item, only the one with the highest `priority` wins, and a tie falls back to registry order: both its `value` and its `exchanges` are read.
- Every `cost` must fall within `1..99`.
- `result` must be a valid item stack template.
- A datapack registry is read **while the world loads** and is synchronized to the client with the pack; after an edit, load the world again or restart the server, because `/reload` does not apply to it.
