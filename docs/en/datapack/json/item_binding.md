---
title: Item Binding (item_binding)
description: "Claims existing items for the mxt:item_binding datapack registry and hands them an ordered list of actions, a use gate, an optional quality ladder and an element."
aside: false
---

# Item Binding (item_binding)

An item binding gives items that already exist data pack behaviour: the data map's key is the item, and its value carries an ordered list of `actions`, a use gate, an optional quality ladder and an element.

## File Location

`item_binding` is an **item data map** (a NeoForge Registry Data Map), not a registry, and its file always lives at:

```text
data/mxt/data_maps/item/item_binding.json
```

**The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. A wrong namespace only leaves one log line, `Found data map file for non-existent data map type`.

**Purpose**: Bindings from existing items to arrays of actions. This table does not create items; it only claims them.

The keys of `values` are **item ids or `#`-prefixed item tags** (a tag expands at load time into every item it held then), and the value is the object the field table below describes. The file-level `replace` / `remove`, plus the value-level `{"value": …, "replace": true}` and **value-level** `neoforge:conditions`, are on [Data Maps](../overview.md#data-maps).

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `priority` | Int | `0` | When several values hit one item, the higher number goes first; **a tie goes to whichever was processed later** (writing order within one file, data pack load order across files). |
| `actions` | `EntityAction[]` | `[]` | The actions run in order on the tick the item's use cycle finishes |
| `conditions` | `EntityCondition[]` | `[]` | The use gate; every entry must pass |
| `element` | Element id, `#tag` or a mixed array | `[]` | What element this item **is**; the reading is below |

## Usage

**A data map only matches items that are already registered, and it never creates one.** Technique manuals do not come through this table: whether a stack is a manual follows its own `mxt:technique` component, or the optional `items` of [technique_binding](./technique_binding.md). `weapon_binding` and `pill_binding` carry fields of their own and share none of them with this table. A weapon's attributes and its attack / use / tick actions belong in `weapon_binding`.

::: warning
`actions` does **not** hook right-click. It runs on the tick the item's **use cycle finishes** — the moment a piece of food is swallowed. An item that right-clicking never raises into a use cycle never gets here, and none of its actions run.
:::

The keys of `values` come in exactly two forms: an item id, or a `#`-prefixed item tag — a tag expands at load time into every item it held then, so one value can cover a whole family. This table has **no `items` field** and does **not** take `type`-carrying matcher entries such as `mxt:wildcard` / `mxt:regex` / `mxt:technique` / `mxt:spirit_storage` / `mxt:herb_tag`; those still belong to the registries that do have an `items` field (`artifact`, `pill_binding`, `spirit_herb`, `technique_binding`).

`priority` is the only "who wins" rule. When several values hit one item, the one with the **highest** `priority` wins; the field defaults to `0`, and **a tie goes to whichever was processed later** — writing order within one file, data pack load order across files — with no fallback to registry order, so which one wins is written in the pack and never decided by file names. **Whether the key is an item or a tag is irrelevant**: any value that hits is ranked by the number it declares, and naming the item by id does not move it up. The four claiming tables that are still registries (`artifact`, `pill_binding`, `spirit_herb`, `technique_binding`) accept the field too, and among them a tie falls back to registry order.

**Per-stack extras go through components; everything else comes from the data map.** An item this table claims may carry two components of its own: `mxt:quality` (single value — a **whole quality object**: written on a stack it wins, and it brings the ladder its own tier belongs to) and `mxt:element` (a list — **unioned** with the `element` written in the data map). `actions` and `conditions` have **no** component and come only from the data map. To change one stack, write a value under that item's own id, or handle it while the item is registered, with KubeJS or vanilla components.

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "#minecraft:swords": {
      "actions": [{"type": "mxt:grant_spirit_root", "spirit_root": "mxt:fire_root"}],
      "conditions": [
        {"type": "mxt:always"},
        {
          "condition": {"type": "mxt:realm", "realm": "example:foundation"},
          "description": "condition.example.foundation_required"
        }
      ]
    }
  }
}
```

A `conditions` entry may be a plain condition, or a `{condition, description}` object whose `description` is a translation key. Every entry must pass. A described condition is marked in the item tooltip with a green `✓` or a red `✗`, and the description text keeps its normal style. This layer is the **use gate**: while it fails, the item cannot be used at all — right-click, right-click on a block, attacks and the use cycle are all stopped, with the reason in the action bar. `actions` asks once more right before it runs, so an action does not fire when a condition stops passing in the meantime.

When `actions` contains `mxt:grant_spirit_root`, the item tooltip gains a line naming the spirit root it grants; the advanced tooltip also prints that root's entry id.

Holding a spirit root or a physique, granting one and removing one are all data pack primitives: `mxt:has_spirit_root` / `mxt:has_physique` for conditions, `mxt:grant_spirit_root` / `mxt:remove_spirit_root` / `mxt:grant_physique` / `mxt:remove_physique` for actions. The definition below only applies to a player who already holds a fire root, and swaps that fire root for a water root:

```json
{
  "values": {
    "kubejs:root_switching_pill": {
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
  }
}
```

**Which ladder this family reads follows entirely from the tier it resolves** (the ladder's name is written on the `quality` entry itself, see [quality](./quality)); a binding declares no ladder. To give one stack both another tier and another ladder, write `mxt:quality="<quality id>"` on that stack.

**The element of an item** has exactly one reading, which asks two questions in order:

1. **Declarations**: the stack's own `mxt:element` component, plus whichever of `weapon_binding`, this table and [artifact](./artifact.md) writes a value for or claims the stack and writes `element`. Each table takes its single highest-`priority` entry, and every result is **unioned**; each declaration is expanded through the element registry, so a `#tag` stands for every element under it.
2. **The aura the item carries**: only when nothing was declared at all — the **single** aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` definition declares, and then that aura's `aura_type`. An artifact's `spirit_capacity` **does not count**: that says what an item can hold, not what it is.

The full reading is on [weapon_binding](./weapon_binding.md), and the `mxt:item_element` item condition reads exactly this.
