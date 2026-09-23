---
title: Tool Binding (tool_binding)
description: A tool binding lists the forging methods an existing tool item unlocks at the Forge Table.
aside: false
---

# Tool Binding (tool_binding)

A tool binding attaches a set of forging methods to an existing tool item, so that placing the tool on the Forge Table makes those methods available.

## File Location

Tool binding JSON files go in `data/<namespace>/mxt/tool_binding/` within your data pack.

**Purpose**: Forging methods provided by tool items.

The filename corresponds to its ID. For example, `data/example/mxt/tool_binding/smith_hammer.json` has the ID `example:smith_hammer`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `methods` | `Holder<forging_method>[]` | **required** | The forging methods this tool unlocks. A definition that leaves it empty or repeats a method fails to load. |

## Usage

A tool item references this registry through the `mxt:tool_binding` item component. The component stores a `Holder`, so the item itself does not copy the definition.

Once tools are placed in the three slots on the right of the Forge Table, the methods they unlock appear in the method list. **Available methods = the blueprint's `allowed_methods` ∩ the union of the `methods` of every placed tool.** When there is no session yet (no blueprint selected) or the blueprint declares no `allowed_methods`, the blueprint side restricts nothing and the list is simply the union of the tools.

The tool slots are **not locked** while a session is running, so adding another hammer mid-session immediately widens the method list.

## Example

```json
{
  "methods": ["mxt_test:heavy_strike", "mxt_test:light_strike", "mxt_test:draw_out", "mxt_test:flatten", "mxt_test:quench"]
}
```

The method IDs it lists are defined by [Forging Method](./forging_method.md), and the other half of the intersection comes from [Forging Blueprint](./forging_blueprint.md).

