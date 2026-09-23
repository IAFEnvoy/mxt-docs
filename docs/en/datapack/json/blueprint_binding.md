---
title: Blueprint Binding (blueprint_binding)
description: A blueprint binding lists the forging blueprints an existing item offers to the Forge Table.
aside: false
---

# Blueprint Binding (blueprint_binding)

A blueprint binding attaches a set of forging blueprints to an existing blueprint or book item, so that placing the item on the Forge Table offers those blueprints to the player.

## File Location

Blueprint binding JSON files go in `data/<namespace>/mxt/blueprint_binding/` within your data pack.

**Purpose**: Forging blueprints provided by blueprint items.

The filename corresponds to its ID. For example, `data/example/mxt/blueprint_binding/sword_manual.json` has the ID `example:sword_manual`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `blueprints` | `Holder<forging_blueprint>[]` | **required** | The blueprints this item provides. It must not be empty or contain duplicates. |

## Usage

A blueprint or book item references this registry through the `mxt:blueprint_binding` item component.

Once blueprint items are placed in the three slots on the left of the Forge Table, the blueprints they provide appear in the blueprint list. **If those three slots are empty, the blueprint list is empty** — there is no branch that falls back to the whole registry. A session cannot be started without an item in a blueprint slot.

## Example

```json
{
  "blueprints": ["mxt_test:iron_sword"]
}
```

The blueprint IDs it lists are defined by [Forging Blueprint](./forging_blueprint.md).

