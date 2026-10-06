---
title: Item Binding (item_binding)
description: "Claims existing items for the mxt:item_binding datapack registry and hands them an ordered list of actions, a use gate, an optional quality ladder and an element."
aside: false
---

# Item Binding (item_binding)

`item_binding` claims **items that are already registered** for a list of actions, a use gate and an element declaration. It creates no items and changes nothing about the item's own numbers.

## File Location

`item_binding` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/item_binding/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/item_binding/frost_blade.json` is `example:frost_blade`. The mod ships no entry for this table; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** — one file describes exactly one definition — and to override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:item_binding` lists the items these definitions claim.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `actions` | `EntityAction[]` | `[]` | The actions run in order on the tick the item's use cycle finishes. |
| `conditions` | `EntityCondition[]` | `[]` | The use gate; every entry must pass. |
| `element` | Element id, `#tag` or a mixed array | `[]` | What element this item **is**; the reading is below. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

## Usage

`items` is the only way in, and it only references items that are already registered. Technique manuals do not come through this registry: whether a stack is a manual follows its own `mxt:technique` component, or the optional `items` of [technique_binding](./technique_binding.md). [weapon_binding](./weapon_binding.md) and [pill_binding](./pill_binding.md) carry fields of their own and share none of them with this registry: a weapon's attributes and its attack / use / tick actions belong in `weapon_binding`.

::: warning
`actions` does **not** hook right-click. It runs on the tick the item's **use cycle finishes** — the moment a piece of food is swallowed. An item that right-clicking never raises into a use cycle never gets here, and none of its actions run.
:::

When several definitions hit one item, the one with the highest `priority` wins (the field defaults to `0`); only two definitions with the same `priority` fall back to registry order. **Whether `items` names an item or a tag is irrelevant**: any definition that hits is ranked by the number it declares, and naming the item by id does not move it up.

`data/example/mxt/item_binding/frost_blade.json`:

```json
{
  "items": ["example:frost_blade", "#example:swords"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "conditions": [
    {"condition": {"type": "mxt:always"}, "description": "condition.example.ready"}
  ]
}
```

A `conditions` entry may be a plain condition, or a `{condition, description}` object whose `description` is a translation key. Every entry must pass. A described condition is marked in the item tooltip with a green `✓` or a red `✗`, and the description text keeps its normal style. This layer is the **use gate**: while it fails, the item cannot be used at all — right-click, right-click on a block, attacks and the use cycle are all stopped, with the reason in the action bar. `actions` asks once more right before it runs, so an action does not fire when a condition stops passing in the meantime.

When `actions` contains `mxt:grant_spirit_root`, the item tooltip gains a line naming the spirit root it grants; the advanced tooltip also prints that root's entry id.

Holding a spirit root or a physique, granting one and removing one are all data pack primitives: `mxt:has_spirit_root` / `mxt:has_physique` for conditions, `mxt:grant_spirit_root` / `mxt:remove_spirit_root` / `mxt:grant_physique` / `mxt:remove_physique` for actions. The definition below only applies to a player who already holds a fire root, and swaps that fire root for a water root:

```json
{
  "items": "kubejs:root_switching_pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_spirit_root", "spirit_root": "mxt:fire_root"},
      "description": "condition.example.requires_fire_root"
    }
  ],
  "actions": [
    {"type": "mxt:remove_spirit_root", "spirit_root": "mxt:fire_root"},
    {"type": "mxt:grant_spirit_root", "spirit_root": "mxt:water_root"}
  ]
}
```

**Which ladder this family reads follows entirely from the tier it resolves** (the ladder's name is written on the `quality` entry itself, see [quality](./quality)); a claiming registry declares no ladder. To give one stack both another tier and another ladder, write `mxt:quality="<quality id>"` on that stack.

**The element of an item** has exactly one reading, which asks two questions in order:

1. **Declarations**: the stack's own `mxt:element` component, plus [weapon_binding](./weapon_binding.md), this registry and [artifact](./artifact.md) — whichever of them claims the stack and writes `element`. Each registry takes its single highest-`priority` definition, and every result is **unioned**; each declaration is expanded through the element registry, so a `#tag` stands for every element under it.
2. **The aura the item carries**: only when nothing was declared at all — the **single** aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` definition declares, and then that aura's `aura_type`. An artifact's `spirit_capacity` **does not count**: that says what an item can hold, not what it is.

The full reading is on [weapon_binding](./weapon_binding.md), and the `mxt:item_element` item condition reads exactly this.
