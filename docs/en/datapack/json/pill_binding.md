---
title: Pill Binding (pill_binding)
description: "Gives an already registered edible item its pill rules: the action run on eating, how much toxicity it adds, when that counts as an overdose, how many times it can be taken and how long the cooldown is."
aside: false
---

# Pill Binding (pill_binding) {#pill_binding}

File location: `data/<namespace>/mxt/pill_binding/<path>.json`

**Purpose**: gives an already registered edible item its pill rules — what eating it does, how much toxicity it builds up, when that counts as an overdose, how many times it can be taken, and how long you wait between doses.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `pill_binding.mxt.<namespace>.<path>` | Display name. When omitted the key in the left column is used. |
| `description` | Text Component | the same key plus `.description` | Description. |
| `items` | `ItemMatcher` | `[]` | Matches existing edible items; see [ItemMatcher](../types/shared_data_types.md#itemmatcher). May be omitted — leave it empty when the `binding` component names the definition. |
| `priority` | Int | `0` | Order between several definitions of the same kind matching one item: the larger number goes first; equal numbers fall back to registry order. **Only reached when there is no `binding`.** |
| `max_uses` | Integer | none | An optional positive integer. Omitting it means unlimited uses. Uses are counted **per definition**, so moving the pill to another carrier item cannot get around the cap. |
| `cooldown` | `NumberProvider` | `0` | Cooldown in ticks. A constant must be finite and `>= 0`. It runs on overworld `gameTime`, so it also expires while you are offline. |
| `on_consume` | `EntityAction` | `mxt:no_op` | The action run once consumption finishes. |
| `toxicity_gain` | `NumberProvider` | `0` | Pill toxicity added. |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | The overdose threshold. It only fires once the accumulated value reaches it, and it does not forbid eating by default. |
| `on_overdose` | `EntityAction` | `mxt:no_op` | The action run when the threshold is reached or passed. |
| `toxicity_after_overdose` | `NumberProvider` | `0` | The toxicity value after an overdose. |
| `conditions` | `EntityCondition[]` | `[]` | The check run before consumption; accepts inline conditions or described condition objects. |

`data/example/mxt/pill_binding/qi_pill.json`:

```json
{
  "items": "example:qi_pill",
  "max_uses": 2,
  "cooldown": 20,
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

Eating the stack passes two gates first: every `conditions` entry holds, and the definition this stack resolves to is neither over its `max_uses` nor on `cooldown`. A failure refuses the dose outright: the item, any container remainder, the effect and the use count all stay as they were. A dose already swallowed is never denied afterwards by a hunger or health condition that changed while it went down.

Past the gates `on_consume` runs first, then `toxicity_gain` is added to that entity's toxicity and the new value is recorded. When `toxicity_threshold` evaluates to a finite number and the new value is `>=` the threshold, that counts as an overdose: `on_overdose` runs, and toxicity is then **set to** `toxicity_after_overdose` (not cleared), so carrying on eating keeps overdosing. When the threshold does not evaluate to a finite number the stack never overdoses, however much is stacked on.

`max_uses` is this definition's own cap, counted per definition rather than per stack: splitting the carrier into several stacks or moving the pill to another item cannot get around it. Uses and cooldown are kept in a ledger separate from toxicity; both are saved, synced and copied on death — dying, changing dimension and logging back in clear neither uses nor toxicity, and purging toxicity does not clear uses either.

Toxicity is read with the entity condition `mxt:pill_toxicity` (`comparison` and `compare_to`) and the formula variable `pill_toxicity`; an entity that has never taken a pill reads `0` and no attachment is created just to answer that. Toxicity is changed with the `mxt:modify_pill_toxicity` action: `mode` is `add` or `set`, defaulting to `add`, and `amount` is required; `set` with a constant below `0` is a load error, a negative `add` purges toxicity, and the result never drops below `0`. **Server Config → Alchemy → Natural toxicity decay per second** defaults to `0`, meaning it never decays on its own; set it positive and it subtracts once per `20` accumulated active entity ticks, only from a body that already carries non-zero toxicity. It does not decay while offline and does not create an attachment for a body that never took a pill.

**A stack of pills can carry an `mxt:pill` object of its own.** The optional `binding` names a definition; `on_consume`, `toxicity_gain`, `toxicity_threshold`, `on_overdose` and `toxicity_after_overdose` override it **field by field** — writing only `toxicity_threshold` means "only this stack overdoses later", with every other field still read from the definition. Resolution looks at `binding` first: if it names a definition that is not in the registry the stack is refused rather than falling back to matching. Only without a `binding` are `items` matched by `priority`, after which the field overrides apply. The component has no `max_uses`, `cooldown`, `conditions` or `priority`, so it cannot override the use cap, the cooldown or the gates, and it cannot change what the count is keyed to. With neither a binding nor an `items` match, a stack may write only the effect keys and get the defaults under them, but such a stack has no binding identity and counts no uses and no cooldown. The bound definition's name is the carrier's display name; with no binding the item's own translation is used. A `mxt:quality` component works as usual and changes not only the tier but also the ladder that tier belongs to.

```mcfunction
give @s mxt:pill[mxt:pill={binding:"example:warming_pill"}]
```

The built-in `mxt:pill` item only provides vanilla eating, a name and a tooltip; the effect still runs exactly once. Every `conditions` entry may also be written as `{condition, description}`: a described condition is marked in the tooltip with a green `✓` or a red `✗`.

`items` is the shared matcher: an item ID, a `#tag` or a mixed array all work, and any array entry may also be a matcher object carrying a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage` and `mxt:herb_tag`). A matcher only ever references items that are already registered. When several definitions match one item, **each registry keeps only the single definition matching it with the largest `priority`** (the field defaults to `0`; ten tables accept it — `artifact`, the six bindings `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique`, `spirit_herb`, `item_aura` and `currency`); only two definitions with the same `priority` fall back to registry order, so which one wins is written into the pack rather than decided by file names (the same direction as the `priority` of `aura_zone` and `element_reaction`). **The kind of matcher entry that matched is irrelevant**: any definition that matches is ranked by the number it declares, and naming the item by ID does not move it up. See [`ItemMatcher`](../types/shared_data_types.md#itemmatcher).
