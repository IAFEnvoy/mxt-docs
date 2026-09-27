---
title: Tool Binding (tool_binding)
description: A tool binding claims an existing tool item and lists the forging methods that item unlocks at the Forge Table.
aside: false
---

# Tool Binding (tool_binding) {#tool_binding}

File location: `data/<namespace>/mxt/tool_binding/<path>.json`

A tool binding gives an **existing tool item** a set of forging methods: it decides which methods the tool puts into the Forge Table's method list. It creates no items and changes nothing about the item itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | item ID, `#tag` or a mixed array | **required** | Which tool items this definition claims; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). |
| `priority` | Int | `0` | When several definitions match the same item, the larger number wins. |
| `methods` | array of `forging_method` IDs | **required** | The forging methods this tool unlocks; must not be empty or repeat an entry. |

`items` **must not be empty**: this table can only be reached by matching an item, so a definition that claims no item could never be read and is refused at load.

Once tools sit in the three right-hand slots of the Forge Table, the methods they unlock appear in the method list. **Available methods = the blueprint's `allowed_methods` ∩ the union of the `methods` of every placed tool.** With no session (no blueprint picked yet) or a blueprint that declares no `allowed_methods`, the blueprint side restricts nothing and the list is just the union of the tools. The tool slots are **not locked** while a session runs, so adding a hammer halfway through widens the method list immediately.

**Two routes for one tool**: it is claimed by the `items` of some definition (an item may also have a definition written for it alone), or the **stack** itself carries the `mxt:forging_methods` item component (an array of `forging_method` IDs, needing no definition file at all). The two are **unioned**, so a second hammer, or one method stuffed onto a single stack, only ever adds — it never replaces or removes anything. The tool slot asks exactly one thing: does this stack resolve to at least one method?

This definition lives at `data/example/mxt/tool_binding/smith_hammer.json`:

```json
{
  "items": "example:smith_hammer",
  "methods": [
    "example:heavy_strike", "example:light_strike",
    "example:quench", "example:temper"
  ]
}
```

A one-off tool with no definition file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
