---
title: Tool Binding (tool_binding)
description: A tool binding claims an existing tool item and lists the forging methods that item unlocks at the Forge Table.
aside: false
---

# Tool Binding (tool_binding) {#tool_binding}

A tool binding gives an **existing tool item** a set of forging methods: it decides which methods the tool puts into the Forge Table's method list. It creates no items and changes nothing about the item itself.

## File Location

`tool_binding` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/tool_binding/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/tool_binding/smith_hammer.json` is `example:smith_hammer`. The mod ships no entry for this table; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:tool_binding` lists the items these definitions claim.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required, must not be empty** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `methods` | array of `forging_method` IDs | **required** | The forging methods this tool unlocks; must not be empty or repeat an entry. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

Once tools sit in the three right-hand slots of the Forge Table, the methods they unlock appear in the method list. **Available methods = the blueprint's `allowed_methods` ∩ the union of the `methods` of every placed tool.** With no session (no blueprint picked yet) or a blueprint that declares no `allowed_methods`, the blueprint side restricts nothing and the list is just the union of the tools. The tool slots are **not locked** while a session runs, so adding a hammer halfway through widens the method list immediately.

**Two routes for one tool**: the registry has a definition written for that item, or the **stack** itself carries the `mxt:forging_methods` item component (an array of `forging_method` IDs, needing no definition file at all). The two are **unioned**, so a second hammer, or one method stuffed onto a single stack, only ever adds — it never replaces or removes anything. The tool slot asks exactly one thing: does this stack resolve to at least one method?

`data/example/mxt/tool_binding/smith_hammer.json`:

```json
{
  "items": "example:smith_hammer",
  "methods": ["example:heavy_strike", "example:light_strike"]
}
```

A one-off tool with no definition file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:iron_ingot[mxt:forging_methods=["example:heavy_strike","example:light_strike"]]
```
