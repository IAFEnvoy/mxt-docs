---
title: Tool Binding (tool_binding)
description: A tool binding claims an existing tool item and lists the forging methods that item unlocks at the Forge Table.
aside: false
---

# Tool Binding (tool_binding) {#tool_binding}

`tool_binding` is an **item data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at `data/mxt/data_maps/item/tool_binding.json`. **The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. The keys of `values` are **item ids or `#`-prefixed item tags** (a tag expands at load time into every item it held then), and the value is the object the field table below describes — this table has **no `items` field**. See [Data Maps](../overview.md#data-maps) for the file shape.

A tool binding gives an **existing tool item** a set of forging methods: it decides which methods the tool puts into the Forge Table's method list. It creates no items and changes nothing about the item itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `priority` | Int | `0` | Order between several values hitting one item: the larger number goes first, and **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files). |
| `methods` | array of `forging_method` IDs | **required** | The forging methods this tool unlocks; must not be empty or repeat an entry. |

Once tools sit in the three right-hand slots of the Forge Table, the methods they unlock appear in the method list. **Available methods = the blueprint's `allowed_methods` ∩ the union of the `methods` of every placed tool.** With no session (no blueprint picked yet) or a blueprint that declares no `allowed_methods`, the blueprint side restricts nothing and the list is just the union of the tools. The tool slots are **not locked** while a session runs, so adding a hammer halfway through widens the method list immediately.

**Two routes for one tool**: the data map has a value written for that item, or the **stack** itself carries the `mxt:forging_methods` item component (an array of `forging_method` IDs, needing no data map file at all). The two are **unioned**, so a second hammer, or one method stuffed onto a single stack, only ever adds — it never replaces or removes anything. The tool slot asks exactly one thing: does this stack resolve to at least one method?

The data map lives at `data/mxt/data_maps/item/tool_binding.json`:

```json
{
  "values": {
    "example:smith_hammer": {
      "methods": [
        "example:heavy_strike", "example:light_strike",
        "example:quench", "example:temper"
      ]
    }
  }
}
```

A one-off tool with no data map file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
