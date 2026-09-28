---
title: Pill Binding (pill_binding)
description: "Claims a family of already registered edible items as one pill, and gives that family its own use cap and cooldown. What a dose does belongs to the pill table."
aside: false
---

# Pill Binding (pill_binding) {#pill_binding}

File location: `data/<namespace>/mxt/pill_binding/<path>.json`

**Purpose**: claims a family of already registered edible items as one pill and gives that family its own use cap and cooldown. **What a dose runs, how much toxicity it adds and what an overdose leaves behind** are not on this table — they are on [pill](./pill.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `pill_binding.mxt.<namespace>.<path>` | Display name. When omitted the key in the left column is used. |
| `description` | Text Component | the same key plus `.description` | Description. |
| `items` | `ItemMatcher` | `[]` | Matches existing edible items; see [ItemMatcher](../types/shared_data_types.md#itemmatcher). This is a binding's only entry, so an empty list means the definition does nothing. |
| `pill` | the id of a `pill` definition | **required** | Which pill this item family is, see [pill](./pill.md). |
| `priority` | Int | `0` | Order between several definitions of the same kind matching one item: the larger number goes first; equal numbers fall back to registry order. |
| `max_uses` | Integer | none | An optional positive integer. Omitting it means unlimited uses. Uses are counted **per definition**, so moving the pill to another carrier item or splitting it into several stacks cannot get around the cap. |
| `cooldown` | `NumberProvider` | `0` | Cooldown in ticks. A constant must be finite and `>= 0`. It runs on overworld `gameTime`, so it also expires while you are offline. |

`data/example/mxt/pill_binding/qi_pill.json`:

```json
{
  "items": "example:qi_pill",
  "pill": "example:warming_pill",
  "max_uses": 2,
  "cooldown": 20
}
```

Eating the stack passes two gates first: every `conditions` entry of the pill this binding names holds, and this binding is neither over its `max_uses` nor on `cooldown`. A failure refuses the dose outright: the item, any container remainder, the effect and the use count all stay as they were. A dose already swallowed is never denied afterwards by a hunger or health condition that changed while it went down.

**Uses and cooldown are recorded against this definition's identity**: `max_uses` is counted per definition rather than per stack, so splitting the carrier into several stacks or moving the pill to another item cannot get around it. Uses and cooldown are kept in a ledger separate from toxicity; both are saved, synced and copied on death — dying, changing dimension and logging back in clear neither uses nor toxicity, and purging toxicity does not clear uses either.

Toxicity is read with the entity condition `mxt:pill_toxicity` (`comparison` and `compare_to`) and the formula variable `pill_toxicity`; an entity that has never taken a pill reads `0` and no attachment is created just to answer that. Toxicity is changed with the `mxt:modify_pill_toxicity` action: `mode` is `add` or `set`, defaulting to `add`, and `amount` is required; `set` with a constant below `0` is a load error, a negative `add` purges toxicity, and the result never drops below `0`. **Server Config → Alchemy → Natural toxicity decay per second** defaults to `0`, meaning it never decays on its own; set it positive and it subtracts once per `20` accumulated active entity ticks, only from a body that already carries non-zero toxicity. It does not decay while offline and does not create an attachment for a body that never took a pill.

**A stack of pills can carry an `mxt:pill` object of its own, but that only changes what the dose does.** The optional `pill` names a definition and wins over the one this binding names; `on_consume`, `toxicity_gain`, `toxicity_threshold`, `on_overdose` and `toxicity_after_overdose` override it **field by field** — writing only `toxicity_threshold` means "only this stack overdoses later", with every other field still read from the definition. The component has no `max_uses`, `cooldown`, `conditions` or `priority`, so it cannot override the use cap, the cooldown or the gate. **The identity still only comes from an `items` match**: a stack that writes only effect keys, or one whose component names a pill while no binding claims the item, counts no uses and has no cooldown. A named pill whose **reference has no value** (the key is still there, the registry no longer holds anything for it) is refused rather than falling back to matching; naming a pill the current pack does not provide cannot be written — a **definition** that names it fails the whole data pack load. The full order is on [pill](./pill.md).

```mcfunction
give @s mxt:pill[mxt:pill={pill:"example:warming_pill"}]
```

The built-in `mxt:pill` item only provides vanilla eating, a name and a tooltip, and the effect still runs exactly once; the carrier's display name comes from the pill this binding names, or from the one the component names when it names one.

`items` is the shared matcher: an item ID, a `#tag` or a mixed array all work, and any array entry may also be a matcher object carrying a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage` and `mxt:herb_tag`). A matcher only ever references items that are already registered. When several definitions match one item, **each registry keeps only the single definition matching it with the largest `priority`** (the field defaults to `0`; ten tables accept it — `artifact`, the six bindings `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique`, `spirit_herb`, `item_aura` and `currency`); only two definitions with the same `priority` fall back to registry order, so which one wins is written into the pack rather than decided by file names (the same direction as the `priority` of `aura_zone` and `element_reaction`). **The kind of matcher entry that matched is irrelevant**: any definition that matches is ranked by the number it declares, and naming the item by ID does not move it up. See [`ItemMatcher`](../types/shared_data_types.md#itemmatcher).
