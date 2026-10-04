---
title: Currency (currency)
description: Gives a registered item a denomination and a set of one-way exchanges, defined by the mxt:currency data map.
aside: false
---

# Currency (currency)

A currency definition gives an **existing item** a denomination and a set of one-way exchanges: what it is worth, and what it can be turned into. Any registered item can act as currency — the Cheque Table, the Exchange Station and the settlement service all read the same `mxt:currency` data map.

## File Location

`currency` is an **item data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at:

```text
data/mxt/data_maps/item/currency.json
```

**The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. A wrong namespace only leaves one log line, `Found data map file for non-existent data map type`.

The keys of `values` are **item ids or `#`-prefixed item tags** (a tag expands at load time into every item it held then), and the value is the object the field table below describes — this table has **no `items` field**, and the old single-item `item` shorthand is gone with it. The file-level `replace` / `remove`, plus the value-level `{"value": …, "replace": true}` and **value-level** `neoforge:conditions`, are on [Data Maps](../overview.md#data-maps).

**Purpose**: Item currency denominations and exchange.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `priority` | Int | `0` | Order between several values hitting one item: the larger number wins, and **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files). |
| `value` | Long | **required** | Value of one item; must be greater than `0`. |
| `unavailable_when` | `ItemCondition` array | `[]` | Each entry binds one item condition to one reason; while the condition holds, the currency value of this stack reads as `0` and the matching reason is shown. |
| `exchanges` | Exchange entry array | **required** | One-way exchange options; may be written as an empty array. |

When two values hit the same item, only the one with the highest `priority` applies (**a tie goes to whichever was processed later**): both `value` and `exchanges` are read from it, and the losing value contributes neither a value nor any exchange.

### `unavailable_when`

Each entry pairs an existing item condition with a piece of reason text. `reason` may be a translation-key string or a vanilla text component object. Places that have a player at hand (the Cheque Table, the Exchange Station and tooltips) evaluate the condition with the current player; a pure server-side query with no entity context does not guess at the condition result.

```json
{
  "values": {
    "mxt:spirit_stone": {
      "value": 10,
      "unavailable_when": [
        {
          "condition": { "type": "mxt:spirit_storage_not_full" },
          "reason": "tooltip.mxt.currency_spirit_not_full"
        }
      ],
      "exchanges": []
    }
  }
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
  "values": {
    "#example:copper_coins": {
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
  }
}
```

An iron coin keyed by its item id:

```json
{
  "values": {
    "mxt:iron_coin": {
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
  }
}
```

An item tag with a component-carrying output:

```json
{
  "values": {
    "#minecraft:emeralds": {
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
  }
}
```

A currency with no exchange options must still write an empty array; `exchanges` is a required field:

```json
{
  "values": {
    "minecraft:emerald": {
      "value": 100,
      "exchanges": []
    }
  }
}
```

## Exchange Station Behaviour

The Exchange Station is a stonecutter-style screen: the input slot only accepts currency items carrying a non-empty `exchanges`; the right side lists every exchange entry of that currency; and after an entry is selected, the result slot shows the output only once the input count reaches `cost`. Taking the result consumes `cost` input items.

Both the list and the result are confirmed by the server-side menu; the client only draws the same options from the synchronized data map.

## Disabling a Value

A condition **can only be written on a value** (the example below is the value-level form); one written at the top level of the file is silently ignored and the value applies anyway:

```json
{
  "values": {
    "example:legacy_coin": {
      "neoforge:conditions": [
        { "type": "neoforge:never" }
      ],
      "value": 1,
      "exchanges": []
    }
  }
}
```

A value whose condition does not hold is as good as unwritten: that item is not currency and takes no part in exchanges, cheques or settlement. The available conditions are on the [Datapack Development Overview](../overview.md#disabling-a-definition).

## Validation and Loading

- A key must be an item id or a `#`-prefixed item tag.
- `value` must be a positive integer (`> 0`).
- When any condition in `unavailable_when` holds, that stack takes no part in currency settlement and its value reads as `0`.
- `exchanges` must be present; write `[]` when no exchange is offered.
- When several values hit the same item, only the one with the highest `priority` applies, and a tie goes to whichever was processed later: both its `value` and its `exchanges` are read.
- Every `cost` must fall within `1..99`.
- `result` must be a valid item stack template.
- The data map is read while the world loads and synchronized to clients on join; after an edit, load the world again or restart the server, because `/reload` does not apply to it.
