---
title: Blueprint Binding (blueprint_binding)
description: A blueprint binding claims an item that already exists as a blueprint, so the blueprints it offers show up at the Forge Table.
aside: false
---

# Blueprint Binding (blueprint_binding) {#blueprint_binding}

A blueprint binding treats **items that already exist** as blueprints: a blueprint sitting in the left-hand slots of the Forge Table offers the blueprints listed in its `blueprints`. It creates no items — the blueprints themselves are defined in [forging_blueprint](./forging_blueprint.md).

## File Location

`blueprint_binding` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/blueprint_binding/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/blueprint_binding/sword_manual.json` is `example:sword_manual`. The mod ships no entry for this table; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:blueprint_binding` lists the items these definitions claim.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required, must not be empty** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `blueprints` | array of `forging_blueprint` IDs | **required** | The blueprints this item offers; must not be empty or repeat an entry. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

Only once blueprint items sit in the three left-hand slots of the Forge Table do the blueprints they offer appear in the blueprint list; **with the three slots empty the blueprint list is empty**, and there is no branch that falls back to the whole registry. A session cannot start until a blueprint slot holds an item.

**Two routes for one blueprint item**: the registry has a definition written for that item, or the **stack** itself carries the `mxt:forging_blueprints` item component (an array of `forging_blueprint` IDs). A single sheet of paper that prints exactly one blueprint therefore needs no definition file at all. The two are **unioned**.

`data/example/mxt/blueprint_binding/sword_manual.json`:

```json
{
  "items": "example:sword_manual",
  "blueprints": ["example:iron_sword"]
}
```

A one-off blueprint with no definition file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:iron_sword"]]
```
