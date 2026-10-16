---
title: Technique Binding (technique_binding)
description: "Which stacks count as a technique's manual, the carrier item the mod generates for it, and the conditions that gate learning. Whether a stack is a manual, and which technique it teaches, follows the stack's mxt:technique component first; only when there is none does a declaration's items decide."
aside: false
---

# Technique Binding (technique_binding) {#technique_binding}

File location: `data/<namespace>/mxt/technique_binding/<path>.json`

**Purpose**: which items are a technique's **manual**, which item the mod generates as its carrier, and the conditions that gate learning. How long a read lasts and how it looks is not here — that is written on the [technique](./technique.md) itself. **Whether a stack is a manual, and which technique it teaches, follows the stack's `mxt:technique` item component first; only when there is none does a declaration's `items` claim the stack.**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `technique` | `technique` id | **required** | The technique this declaration describes. One declaration per technique is enough. |
| `items` | item ID, `#tag` or a mixed array | `[]` | **Optional**: these items count as a manual for this technique even while carrying no component; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). When omitted, the declaration can only be reached by technique id. |
| `priority` | Int | `0` | When two declarations both claim one item, the larger number wins. |
| `carrier_item` | item ID | `mxt:technique_book` | The item the mod uses when it **generates** a carrier for this technique (`/picker mxt:technique` uses it). A single item ID — item tags, wildcards and arrays are not accepted. **When the declaration's `items` names concrete items, the picker hands those items out directly and generates no carrier.** |
| `conditions` | `EntityCondition[]` | `[]` | Conditions checked before learning; inline conditions or described condition objects both work. |

::: warning `items` means "a manual even without the component"
A declaration's `items` makes that stack a manual for this technique **without any component**, but **identity still follows the stack's `mxt:technique` component first**: when the same item carries the component, what is read is the technique the component names, not the `technique` this declaration writes.
:::

## What Counts as a Manual {#manual}

**Which stack teaches which technique follows the component first.** The order is: **① the `mxt:technique` component on the stack** (its value is a technique definition id) — it is the stack's identity; **② with no component**, whichever `technique_binding` has an `items` that claims the stack, whose `technique` names the technique that stack teaches. With neither, the stack is not a manual and right-clicking it does nothing.

```mcfunction
give @s mxt:technique_book[mxt:technique="example:azure_breath"]
```

An item can therefore be a manual for a technique **without carrying any component** — as long as some declaration's `items` names it; the same item carrying the component still reads the technique the component names. Conversely, the same item with neither a component nor any `items` claiming it — a `mxt:technique_book` taken out of the creative inventory, for instance — **teaches nothing and shows no technique in its tooltip**.

The component is **stack data**, so items that generate naturally in the world never carry it by themselves. Any route that can write onto a stack works just as well:

- the `components` of a recipe result;
- a loot function;
- the item component syntax of `/give`, as above.

## The Carrier the Mod Generates {#carrier}

The mod walks the `mxt:technique` registry and **generates one carrier per technique**; the generated item is the one named by `carrier_item` in that technique's declaration, and **absent means the technique book** `mxt:technique_book`. The `/picker mxt:technique` category of the item picker is that entry point; **the creative tab generates no carriers**. `carrier_item` is the item this generation uses only while the declaration claims no items of its own: when the declaration's `items` names concrete items, the picker hands those items out directly — **nothing is generated, and no component is written onto them**.

To use an item of your own as a manual, both routes work: write `carrier_item: "namespace:item"` and let the picker generate that stack with the `mxt:technique` component already on it; or, more directly, put the item into the declaration's `items`, and that stack is the manual **without any component**.

How long a read takes, which pose it plays and which sound it makes come from the [technique definition](./technique.md); a stack that should read differently writes the `mxt:technique_reading` component (same field names as the technique, all optional, overriding that set **field by field**). Which quality ladder this family sits on is not decided here: the ladder's name is written on the `quality` entry itself — on the entry tier — and the runtime carries it along `next` to every tier above it.

**A technique can have no binding at all.** Bindings are matched by technique id, so a technique with no `technique_binding` file simply has no extra condition before learning and the technique book as its carrier. Such a technique is still learned through the stack's component, and how it reads is decided by its own definition (and by that component).

## Example

A technique that uses an item of the content pack as its carrier:

```json
// data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}]
}
```

The content pack's own item counting as this technique's manual **without any component**:

```json
{
  "technique": "mxt_test:azure_water_manual",
  "items": "mxt_test:azure_water_manual",
  "conditions": [{"type": "mxt:always"}]
}
```

Once written, a manual comes from one of two places: the item named by the declaration's `items` (no component needed), or any **stack carrying the component** — via the `give` item component syntax above, or a recipe result carrying `{"mxt:technique": "mxt_test:azure_water_manual"}`. A hold of three seconds with a bundle pose is written on that technique's definition; see [technique](./technique.md).
