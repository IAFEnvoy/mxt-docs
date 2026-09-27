---
title: Blueprint Binding (blueprint_binding)
description: A blueprint binding claims an item that already exists as a blueprint, so the blueprints it offers show up at the Forge Table.
aside: false
---

# Blueprint Binding (blueprint_binding) {#blueprint_binding}

File location: `data/<namespace>/mxt/blueprint_binding/<path>.json`

A blueprint binding treats **items that already exist** as blueprints: the definition writes `items`, and a blueprint sitting in the left-hand slots of the Forge Table offers the blueprints listed in `blueprints`. It creates no items — the blueprints themselves are defined in [forging_blueprint](./forging_blueprint.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | item ID, `#tag` or a mixed array | **required** | The blueprint items this definition claims; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). |
| `priority` | Int | `0` | When several definitions match the same item, the larger number wins; equal numbers fall back to registry order. |
| `blueprints` | array of `forging_blueprint` IDs | **required** | The blueprints this item offers; must not be empty or repeat an entry. |

`items` **must not be empty**, for the same reason as [tool_binding](./tool_binding.md): this table can only be reached by matching an item, so a definition that claims no item could never be read and is refused at load.

Only once blueprint items sit in the three left-hand slots of the Forge Table do the blueprints they offer appear in the blueprint list; **with the three slots empty the blueprint list is empty**, and there is no branch that falls back to the whole registry. A session cannot start until a blueprint slot holds an item.

**Two routes for one blueprint item**: it is claimed by the `items` of some definition, or the **stack** itself carries the `mxt:forging_blueprints` item component (an array of `forging_blueprint` IDs). A single sheet of paper that prints exactly one blueprint therefore needs no definition file at all. The two are **unioned**.

```json
// data/example/mxt/blueprint_binding/sword_manual.json
{
  "items": "example:sword_manual",
  "blueprints": ["example:spirit_sword"]
}
```

A one-off blueprint with no definition file writes the list straight onto the stack:

```mcfunction
/give @s minecraft:paper[mxt:forging_blueprints=["example:spirit_sword"]]
```
