---
title: Pill Binding (pill_binding)
description: "Gives an already registered edible item its pill rules: the action run on eating, the toxicity it adds, the overdose threshold and what happens past it."
aside: false
---

# Pill Binding (pill_binding) {#pill_binding}

File location: `data/<namespace>/mxt/pill_binding/<path>.json`

**Purpose**: gives an already registered edible item its pill rules — what eating it does, how much toxicity it builds up, and when that counts as an overdose.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | item ID, `#tag` or a mixed array | **required** | Matches existing edible items; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). |
| `priority` | Int | `0` | Order between several definitions of the same kind matching one item: the larger number goes first (see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher)); equal numbers fall back to registry order. |
| `on_consume` | `EntityAction` | `mxt:no_op` | The action run once consumption finishes. |
| `toxicity_gain` | `NumberProvider` | `0` | Pill toxicity added. |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | The overdose threshold. |
| `on_overdose` | `EntityAction` | `mxt:no_op` | The action run when the threshold is reached or passed. |
| `toxicity_after_overdose` | `NumberProvider` | `0` | The toxicity value after an overdose. |
| `conditions` | `EntityCondition[]` | `[]` | The check run before consumption; accepts inline conditions or described condition objects. |

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "example:qi_pill",
  "on_consume": {"type": "mxt:no_op"},
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25,
  "on_overdose": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:poison",
    "duration_ticks": 100
  },
  "conditions": [
    {
      "condition": {"type": "mxt:realm", "realm": "example:foundation"},
      "description": "condition.example.foundation_required"
    }
  ]
}
```

Eating the stack runs `on_consume` first, then adds `toxicity_gain` to that entity's toxicity and records the new value. When `toxicity_threshold` evaluates to a finite number and the new value is `>=` the threshold, that counts as an overdose: `on_overdose` runs, and toxicity is then **set to** `toxicity_after_overdose` (not cleared), so carrying on eating keeps overdosing. When the threshold does not evaluate to a finite number the stack never overdoses, however much is stacked on.

Every `conditions` entry may also be written as `{condition, description}`: a described condition is marked in the tooltip with a green `✓` or a red `✗`, and every entry must pass before the stack can be eaten.

**A stack of pills can carry two components of its own.** `mxt:pill` uses the same keys as the table above, all optional, and overrides this definition **field by field** — writing only `toxicity_threshold` means "only this stack overdoses later", with every other field still read from the definition; a stack no definition claims at all may also carry just this component, and the remaining fields take the defaults from the table above. A `mxt:quality` component (single value — a whole quality object) changes more than the tier: it also decides the ladder that tier belongs to. `items`, `priority` and `conditions` have no component and come only from the definition.

`items` is the shared matcher: an item ID, a `#tag` or a mixed array all work, and any array entry may also be a matcher object carrying a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage` and `mxt:herb_tag`). A matcher only ever references items that are already registered. When several definitions match one item, **each registry keeps only the single definition matching it with the largest `priority`** (the field defaults to `0`; ten tables accept it — `artifact`, the six bindings `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique`, `spirit_herb`, `item_aura` and `currency`); only two definitions with the same `priority` fall back to registry order, so which one wins is written into the pack rather than decided by file names (the same direction as the `priority` of `aura_zone` and `element_reaction`). **The kind of matcher entry that matched is irrelevant**: any definition that matches is ranked by the number it declares, and naming the item by ID does not move it up. See [`ItemMatcher`](/en/datapack/types/shared_data_types#itemmatcher).
