---
title: Currency (currency)
description: "Defines an item-based currency denomination, its value and its one-way exchange options through the mxt:currency datapack registry."
---

# Currency (currency)

A currency definition gives a registered item a denomination and a set of one-way exchange options. Any registered item can act as currency; the Cheque Table, the Exchange Station and the settlement service all read the same `mxt:currency` registry.

## File Location

Currency JSON files go in `data/<namespace>/mxt/currency/` within your data pack. For example:

**Purpose**: Item currency denominations and exchange.

```text
data/example/mxt/currency/iron_coin.json
```

Its definition ID is `example:iron_coin`.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `items` | `ItemMatcher` | One of `items` or `item`. A single item ID, an item tag, or a mixed array of both |
| `item` | Item ID | One of `items` or `item`. The single-item shorthand, expanded to a one-entry `items` matcher; older examples still use it |
| `value` | Long | **required**, must be greater than `0`. The value of one item, used for cheques and general settlement |
| `unavailable_when` | `ItemCondition[]` | Optional. When any `condition` holds for the current item stack, the current currency value of that item is `0` and the matching `reason` is displayed |
| `exchanges` | Exchange array | **required**, may be empty. Once the item is placed into the Exchange Station, all of its entries are displayed |

### `unavailable_when`

Each entry consists of an existing `ItemCondition` and a reason text. `reason` may be a translation-key string or a vanilla text component object. Contexts that need a player (for example the Cheque Table, the Exchange Station and tooltips) evaluate the condition with the current player; pure server-side queries without an entity context do not guess the condition result.

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

The entries inside `exchanges` are displayed in array order in the Exchange Station's stonecutter-style option list.

| Field | Type | Description |
|-------|------|-------------|
| `cost` | Integer | **required**, range `1` to `99`. The amount consumed from the currency item in the input slot |
| `result` | Item Stack | **required**. The item stack produced after a successful exchange |

`result` uses the vanilla Item Stack shape:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | Item ID | none | **required**. The output item |
| `count` | Integer | `1` | The output count, range `1` to `99` |
| `components` | Object | none | Optional vanilla data component patch |

::: warning One-Way Exchange
Exchanges are one-way. To allow the reverse exchange, the reverse entry must be declared explicitly in the `exchanges` array of the target currency.
:::

## Examples

A copper coin offering a one-way exchange option:

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

When only one item is matched, the `item` shorthand can be used instead:

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

An item tag together with an output that carries components:

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
          "minecraft:custom_name": "{\"text\":\"Trade Token\"}"
        }
      }
    }
  ]
}
```

A currency without exchange options must still write an empty array:

```json
{
  "items": "minecraft:emerald",
  "value": 100,
  "exchanges": []
}
```

## Exchange Station Behaviour

The Exchange Station uses a stonecutter-style interface: the input slot accepts currency items that have a non-empty `exchanges` list; the right side shows every exchange entry of that currency; and after an entry is selected, the output only appears in the result slot once the input count reaches `cost`. Taking the result consumes `cost` input items.

Both the list and the result are confirmed by the server-side menu. The client only uses the synchronized datapack registry to display the same exchange options.

## Disabled Tag

The disabled tag of the currency registry is located at `data/mxt/tags/mxt/currency/disabled.json`:

```json
{
  "replace": false,
  "values": [
    "mxt:copper_coin"
  ]
}
```

A currency disabled through the `mxt:disabled` tag does not take part in exchanges, cheques or settlement, but it can still be referenced by other data definitions.

## Validation and Loading

- At least one of `items` and `item` must be provided, and the matcher it produces must not be empty; `items` is recommended because it also supports bulk matching.
- `value` must be a positive integer.
- When any condition inside `unavailable_when` holds, that stack does not take part in currency settlement.
- `exchanges` must be present; use `[]` when no exchange is offered.
- Every `cost` must be between `1` and `99`.
- `result` must be a valid Item Stack.
- Definitions are validated while the world loads and synchronised to clients on join, so an edit is applied by loading the world again.

