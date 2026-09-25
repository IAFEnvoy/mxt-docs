---
title: Pill Binding (pill_binding)
description: "Adds pill consumption behaviour and pill toxicity rules to an existing edible item through the mxt:pill_binding datapack registry."
aside: false
---

# Pill Binding (pill_binding)

A pill binding maps one existing item to pill-only fields. Like every other binding it only matches already registered items, so the physical pill must come from Minecraft, a content mod, or KubeJS. Pill bindings add a consumption action plus the pill toxicity rules that decide when a consumed pill becomes an overdose; these fields are not mixed with the item, weapon or technique bindings.

## File Location

Pill binding JSON files go in `data/<namespace>/mxt/pill_binding/` within your data pack.

**Purpose**: Pill and pill toxicity rules for existing items.

The filename corresponds to its ID. For example, `data/example/mxt/pill_binding/returning_pill.json` has the ID `example:returning_pill`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Matches existing edible items |
| `on_consume` | `EntityAction` | `mxt:no_op` | The action executed after consumption finishes |
| `toxicity_gain` | `NumberProvider` | `0` | Pill toxicity added by this pill |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | The overdose threshold |
| `on_overdose` | `EntityAction` | `mxt:no_op` | The action executed when the threshold is exceeded |
| `toxicity_after_overdose` | `NumberProvider` | `0` | The pill toxicity value after an overdose |
| `quality_chain` | `Holder<quality_chain>` | none | The quality chain this item belongs to. The chain answers membership (a resolved tier must be on it), the default tier (the chain's `default`) and the upgrade path |
| `conditions` | `EntityCondition[]` | `[]` | The check performed before consumption; supports inline conditions or described condition objects |

### `items`

The `items` matcher accepts one item ID, one item tag (such as `"#example:pills"`), or a mixed array of both; one binding can therefore cover many physical pills. Any array entry may also be written as a typed object dispatched by the built-in `item_matcher_entry_type` registry (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:herb_tag` and the `mxt:spirit_storage` capability matcher); see [Shared Data Types](../types/shared_data_types.md) for the entry types. When multiple bindings match an item, the matcher selects the definition with the lowest `priority` first, and all four binding types currently use priority `0`.

### `quality_chain`

`quality_chain` names one [Quality Chain](./quality_chain.md). The chain answers membership (a tier the pill resolves to must be on the chain, or it cannot be consumed), the default tier when neither an override component nor a settled result exists, and the upgrade path [`/quality upgrade`](/en/player-guide/commands/quality) walks.

The pill cannot be consumed when its current quality is not on the chain, a binding condition fails, or the quality's own `condition` fails. See [Quality](./quality.md).

### `conditions`

`conditions` is optional. Each entry may be an inline `EntityCondition`, or an object with `condition` and an optional translation-key `description`. Described entries are shown in the item tooltip with a green `✓` when true or a red `✗` when false; the description text itself keeps its normal style. The check runs before consumption.

## Example

```json
// data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "quality_chain": "example:pill",
  "conditions": [{"condition": {"type": "mxt:realm", "realm": "example:foundation"}, "description": "condition.example.pill"}],
  "on_consume": {"type": "mxt:heal", "amount": 4},
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

The behaviour id used inside `on_consume` and `on_overdose` comes from the [Entity Action Types](../types/action/entity_action_types.md) list, and the condition ids come from the [Entity Condition Types](../types/condition/entity_condition_types.md) list.

