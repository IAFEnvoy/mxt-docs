---
title: Blueprint Binding (blueprint_binding)
description: A blueprint binding claims an item that already exists as a blueprint, so the blueprints it offers show up at the Forge Table.
aside: false
---

# Blueprint Binding (blueprint_binding) {#blueprint_binding}

`blueprint_binding` is an **item data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at `data/mxt/data_maps/item/blueprint_binding.json`. **The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. The keys of `values` are **item ids or `#`-prefixed item tags** (a tag expands at load time into every item it held then), and the value is the object the field table below describes — this table has **no `items` field**. See [Data Maps](../overview.md#data-maps) for the file shape.

A blueprint binding treats **items that already exist** as blueprints: the data map has a value written for that item, and a blueprint sitting in the left-hand slots of the Forge Table offers the blueprints listed in `blueprints`. It creates no items — the blueprints themselves are defined in [forging_blueprint](./forging_blueprint.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `priority` | Int | `0` | Order between several values hitting one item: the larger number goes first, and **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files). |
| `blueprints` | array of `forging_blueprint` IDs | **required** | The blueprints this item offers; must not be empty or repeat an entry. |

Only once blueprint items sit in the three left-hand slots of the Forge Table do the blueprints they offer appear in the blueprint list; **with the three slots empty the blueprint list is empty**, and there is no branch that falls back to the whole registry. A session cannot start until a blueprint slot holds an item.

**Two routes for one blueprint item**: the data map has a value written for that item, or the **stack** itself carries the `mxt:forging_blueprints` item component (an array of `forging_blueprint` IDs). A single sheet of paper that prints exactly one blueprint therefore needs no data map file at all. The two are **unioned**.

```json
// data/mxt/data_maps/item/blueprint_binding.json
{
  "values": {
    "example:sword_manual": {
      "blueprints": ["example:spirit_sword"]
    }
  }
}
```

A one-off blueprint with no data map file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:spirit_sword"]]
```
