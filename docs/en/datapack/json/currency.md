---
title: Currency (currency)
description: Gives a registered item a denomination and a set of one-way exchanges, defined by the mxt:currency registry.
aside: false
---

# Currency (currency)

A currency definition gives an **existing item** a denomination and a set of one-way exchanges: what it is worth, and what it can be turned into. Any registered item can act as currency — the Cheque Table, the Exchange Station and the settlement service all read the same `mxt:currency` registry.

## File Location

Currency files go in `data/<namespace>/mxt/currency/` within your data pack.

**Purpose**: Item currency denominations and exchange.

The filename corresponds to its ID. For example:

```text
data/example/mxt/currency/iron_coin.json
```

Its definition ID is `example:iron_coin`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | one of `items` / `item` | The items that count as this currency: a single item ID, an item tag, or a mixed array. |
| `priority` | Int | `0` | Order between several definitions of the same kind claiming one item: the larger number wins (see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher)); ties fall back to registry order. |
| `item` | Item ID | none | Single-item shorthand, identical to writing `items` with this one entry. |
| `value` | Long | **required** | Value of one item; must be greater than `0`. |
| `unavailable_when` | `ItemCondition` array | `[]` | Each entry binds one item condition to one reason; while the condition holds, the currency value of this stack reads as `0` and the matching reason is shown. |
| `exchanges` | Exchange entry array | **required** | One-way exchange options; may be written as an empty array. |

Provide at least one of `items` and `item`. When two currency definitions claim the same item, only the one with the highest `priority` applies (see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher)): both `value` and `exchanges` are read from it, and the losing definition contributes neither a value nor any exchange. Prefer `items`: it supports items and tags alike, and it accepts matcher entries such as wildcards and regular expressions.

### `unavailable_when`

Each entry pairs an existing item condition with a piece of reason text. `reason` may be a translation-key string or a vanilla text component object. Places that have a player at hand (the Cheque Table, the Exchange Station and tooltips) evaluate the condition with the current player; a pure server-side query with no entity context does not guess at the condition result.

```json
{
  "items": "mxt:spirit_stone",
  "value": 10,
  "unavailable_when": [
    {
      "condition": { "type": "mxt:spirit_storage_not_full" },
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

A copper coin offering a one-way exchange:

```json
{
  "items": ["mxt:copper_coin", "#example:copper_coins"],
  "value": 1,
  "exchanges": [
    {
      "cost": 10,
      "result": {
        "id": "mxt:iron_coin"
      }
    }
  ]
}
```

When only one item is matched, the `item` shorthand works:

```json
{
  "item": "mxt:iron_coin",
  "value": 10,
  "exchanges": [
    {
      "cost": 1,
      "result": {
        "id": "mxt:copper_coin",
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

An item tag with a component-carrying output:

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
  "items": "minecraft:emerald",
  "value": 100,
  "exchanges": []
}
```

## Exchange Station Behaviour

The Exchange Station is a stonecutter-style screen: the input slot only accepts currency items carrying a non-empty `exchanges`; the right side lists every exchange entry of that currency; and after an entry is selected, the result slot shows the output only once the input count reaches `cost`. Taking the result consumes `cost` input items.

Both the list and the result are confirmed by the server-side menu; the client only draws the same options from the synchronized registry.

## Disabling a Definition

Write the NeoForge resource conditions into the currency definition's own file; an entry whose condition does not hold never enters the registry:

```json
{
  "neoforge:conditions": [
    { "type": "neoforge:never" }
  ],
  "value": 1
}
```

While a condition does not hold, the currency is as good as absent: it takes no part in exchanges, cheques or settlement, and a reference to it fails to decode along with it. Available conditions are on the [Datapack Development Overview](../overview.md#disabling-a-definition).

## Validation and Loading

- At least one of `items` and `item` must be provided, and the two merged must not be empty.
- `value` must be a positive integer (`> 0`).
- When any condition in `unavailable_when` holds, that stack takes no part in currency settlement and its value reads as `0`.
- `exchanges` must be present; write `[]` when no exchange is offered.
- When several definitions claim the same item, only the one with the highest `priority` applies: both its `value` and its `exchanges` are read.
- Every `cost` must fall within `1..99`.
- `result` must be a valid item stack template.
- Definitions are validated while the world loads and synchronized to clients on join; after an edit, load the world again or restart the server, because `/reload` does not apply to datapack registries.
