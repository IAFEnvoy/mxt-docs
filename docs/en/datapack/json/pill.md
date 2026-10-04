---
title: Pill (pill)
description: "What one pill does: the action it runs, how much toxicity it adds and what an overdose leaves behind. Which items count as that pill, how often they may be taken and how long the cooldown is belong to pill_binding."
aside: false
---

# Pill (pill) {#pill}

File location: `data/<namespace>/mxt/pill/<path>.json`

**Purpose**: what one pill **does** — the action it runs, how much toxicity it adds, and what an overdose leaves behind. This table claims no item and owns neither the use cap nor the cooldown: **which items are that pill, how many times they may be taken and how long you wait between doses** belong to that family's [pill_binding](./pill_binding.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `pill.mxt.<namespace>.<path>` | Display name. When omitted the key in the left column is used. |
| `description` | Text Component | the same key plus `.description` | Description. |
| `quality` | Quality id | none | Optional. The tier a dose of this pill starts on. |
| `color` | Colour | `#FFFFFF` | The icon colour of the **built-in carrier** `mxt:pill`, written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too, always opaque); white means no tint. It tints that one item only — an item a binding claims keeps its own texture. |
| `on_consume` | `EntityAction` | `mxt:no_op` | The action run once consumption finishes. |
| `toxicity_gain` | `NumberProvider` | `0` | The toxicity this dose adds. |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | The overdose threshold. Only a total that reaches it counts as an overdose, and it is a firing line rather than a ban on eating more. |
| `on_overdose` | `EntityAction` | `mxt:no_op` | The action run when the threshold is crossed. |
| `toxicity_after_overdose` | `NumberProvider` | `0` | The value toxicity is **set to** after an overdose, not cleared to zero. |
| `conditions` | `EntityCondition[]` | `[]` | The check run before consumption; accepts inline conditions or described condition objects. |

`quality` is optional: every pill shares the one built-in carrier item `mxt:pill`, so the item itself cannot say which tier it is — only the definition the stack carries can: a dose of this pill starts on that tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) data map. The `mxt:pill` component on a stack overrides only the effect fields (`on_consume`, `toxicity_gain` and the rest) and **never the tier**: the tier read is always the `quality` the definition itself declares.

One definition describes only what a dose does, `data/example/mxt/pill/warming_pill.json`:

```json
{
  "color": "#FF9955",
  "toxicity_gain": 25,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 20,
  "on_consume": {"type": "mxt:heal", "amount": 4}
}
```

Then one [pill_binding](./pill_binding.md) points that family of items at it:

```json
// data/example/mxt/pill_binding/warming_pill.json
{
  "items": ["example:qi_pill"],
  "pill": "example:warming_pill",
  "max_uses": 2,
  "cooldown": 20
}
```

## One Half Each: Pill and Binding

**The pill answers "what happens when this is eaten"; the binding answers "which items are it, and how often may this family be taken".** They are split so one effect can hang on several item families: each family writes a binding of its own, all naming the same pill id, and each keeps its own use count and cooldown.

A binding has exactly one entry, `items`, so an empty one means that definition does nothing; and an item only counts as that pill while some binding's `items` claims it — a component on the stack can name the effect, but it never creates that identity, see below.

## How the Component Overrides the Binding

A stack of pills may carry an `mxt:pill` component of its own, overriding this definition field by field. There is one resolution order:

1. **The component's `pill` wins**: when it names a definition, that one is used; without a `pill` key the pill named by the matched binding is used.
2. **Five effect keys are laid over it**: `on_consume`, `toxicity_gain`, `toxicity_threshold`, `on_overdose`, `toxicity_after_overdose`; a key left out still reads the definition.
3. **A named pill whose reference has no value** (the key is still there, the registry holds nothing for it) refuses the dose, with no fallback to another definition and no fallback to the defaults. Note that naming a pill the pack does not provide **from a definition** is not that refusal — it fails the whole data pack load (see [Datapack Development Overview](../overview.md#disabling-a-definition)).

```mcfunction
give @s mxt:pill[mxt:pill={pill:"example:warming_pill",toxicity_gain:2}]
```

The component has no `max_uses`, `cooldown`, `conditions` or `priority`, so it **cannot change the use cap, the cooldown or the consumption gate**.

## Caps and Cooldown Follow the Binding

**An item has a dosing identity only because some `pill_binding`'s `items` claims it**; a component creates no identity. So a stack that writes only effect keys, or one whose component names a pill while no binding claims the item, **counts no uses and has no cooldown**. With a binding, the identity is that binding and the component cannot change it. What each field means, how uses are counted and when a cooldown expires are on [pill_binding](./pill_binding.md).

## Toxicity and Overdose

Past the gate `on_consume` runs first, then `toxicity_gain` is added to that entity's toxicity and the new value is recorded. When `toxicity_threshold` evaluates to a finite number and the new value **reaches** it, that counts as an overdose: `on_overdose` runs, and toxicity is then **set to** `toxicity_after_overdose` (not cleared), so carrying on eating keeps overdosing. When the threshold does not evaluate to a finite number this pill never overdoses, however much is stacked on. The overdose itself says so on the taker's action bar; `on_overdose` may still run actions of its own. **Adding toxicity with `mxt:modify_pill_toxicity` never checks the threshold** — an overdose only happens on the eating path.

Toxicity is read with the entity condition `mxt:pill_toxicity` (`comparison` and `compare_to`) and the formula variable `pill_toxicity`; an entity that has never taken a pill reads `0` and no attachment is created just to answer that. Toxicity is changed with the `mxt:modify_pill_toxicity` action: `mode` is `add` or `set`, defaulting to `add`, and `amount` is required; `set` with a constant below `0` is a load error, a negative `add` purges toxicity, and the result never drops below `0`. How that ledger is saved, synced and decayed is on [pill_binding](./pill_binding.md).

## Conditions and the Tooltip

`conditions` is the check run **before** consumption: one entry that does not hold refuses the dose, leaving the item, any container remainder, the effect and the use count as they were. Every entry may also be written as `{condition, description}`: a described condition is marked in the tooltip with a green `✓` or a red `✗`, and `description` is a language key rather than free text. A dose already swallowed is never denied afterwards by a hunger or health condition that changed while it went down.

## Carrier and Display Name

The built-in `mxt:pill` item only provides vanilla eating, a name and a tooltip; the effect still runs exactly **once**. The carrier's title comes from the pill this stack resolves to when the component names one; **with no component** (the dose named by the binding) the title stays the built-in `item.mxt.pill`, and that pill's name shows on the first tooltip line. The component itself takes no part in quality or element merging, see [Item Binding](./item_binding.md).

**Whether the stack can be eaten is answered by the item a binding claims**: vanilla starts a use cycle only from a `minecraft:consumable` on the stack. An item that carries one is eaten with that item's own duration and pose (a food is still refused while the player is full, which now says so on the action bar); an item that carries none has one written for it on the click and taken back when the gesture ends, so a pill bound to an item with no use of its own can be taken and the item is left untouched. Items with a use of their own (swapping, shields, kinetic weapons) and items a hold declaration claims keep their own path — a pill never takes that click away. See [pill_binding](./pill_binding.md).

**The icon colour tints that one item as well**: the carrier is painted with the `color` of the pill the stack resolves to, and a named pill that is not in the registry (a dose that would be refused) leaves it untinted. The colour lives on the definition and the component has no such key, so every stack of one pill looks the same; items a binding claims and any other item keep their textures untouched.
