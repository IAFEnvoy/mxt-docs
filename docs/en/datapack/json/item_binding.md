---
title: Item Binding (item_binding)
description: "Claims existing items for the mxt:item_binding datapack registry and hands them an ordered list of actions, a use gate, an optional quality ladder and an element."
aside: false
---

# Item Binding (item_binding)

An item binding turns items that already exist into carriers of data pack behaviour: it claims them through `items` and gives them an ordered list of `actions`, a use gate, an optional quality ladder and an element.

## File Location

Item binding JSON files go in `data/<namespace>/mxt/item_binding/` within your data pack.

**Purpose**: Bindings from existing items to arrays of actions. This table does not create items; it only claims them.

The filename corresponds to its ID. For example, `data/example/mxt/item_binding/root_pellet.json` has the ID `example:root_pellet`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | Item id, `#tag` or a mixed array | **required** | Which items this definition claims; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher) |
| `priority` | Int | `0` | When several definitions match one item, the higher number goes first; only equal numbers fall back to registry order |
| `actions` | `EntityAction[]` | `[]` | The actions run in order on the tick the item's use cycle finishes |
| `conditions` | `EntityCondition[]` | `[]` | The use gate; every entry must pass |
| `element` | Element id, `#tag` or a mixed array | `[]` | What element this item **is**; the reading is below |

## Usage

**A binding table only matches items that are already registered, and it never creates one.** Technique manuals do not come through this table: whether a stack is a manual follows its own `mxt:technique` component, or the optional `items` of [technique_binding](./technique_binding.md). `weapon_binding` and `pill_binding` carry fields of their own and share none of them with this table. A weapon's attributes and its attack / use / tick actions belong in `weapon_binding`.

::: warning
`actions` does **not** hook right-click. It runs on the tick the item's **use cycle finishes** — the moment a piece of food is swallowed. An item that right-clicking never raises into a use cycle never gets here, and none of its actions run.
:::

`items` is the shared matcher: one item id, one `#tag` or a mixed array all work, and a single entry does not have to be wrapped in an array. Any array entry may also be a matcher object carrying a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage` and `mxt:herb_tag`). A matcher only ever references items that are already registered.

**Loading ends one of two ways.** An array is a forgiving list: an entry that fails to decode is dropped on its own, with an `Ignoring invalid list element` line in the log, and the rest of the array still applies — a mistyped item id only makes that one entry miss. **A single entry does not take that road**: if it fails to decode, the whole definition fails to load. An empty array loads fine, it just matches nothing.

`priority` is the only "who wins" rule. When several definitions match one item, the one with the **highest** declared `priority` wins; the field defaults to `0`, and only two definitions carrying the **same** number fall back to registry order, so which one wins is written in the pack and never decided by file names. **The kind of matcher entry that matched is irrelevant**: any matching definition is ranked by the number it declares, and naming the item by id does not move it up. Ten tables accept the field: `artifact`, the six bindings `item` / `weapon` / `pill` / `tool` / `blueprint` / `technique`, `spirit_herb`, `item_aura` and `currency` (the same direction as `aura_zone` and `element_reaction`). See [`ItemMatcher`](/en/datapack/types/shared_data_types#itemmatcher).

**Per-stack extras go through components; everything else comes from the definition.** An item claimed by this table may carry two components of its own: `mxt:quality` (single value — a **whole quality object**: written on a stack it wins, and it brings the ladder its own tier belongs to) and `mxt:element` (a list — **unioned** with the `element` the definition declares). `actions` and `conditions` have **no** component and come only from the definition. To change one stack, write a definition that names it through `items`, or handle it while the item is registered, with KubeJS or vanilla components.

```json
{
  "items": ["minecraft:iron_sword", "#minecraft:swords"],
  "actions": [{"type": "mxt:grant_spirit_root", "spirit_root": "mxt:fire_root"}],
  "conditions": [
    {"type": "mxt:always"},
    {
      "condition": {"type": "mxt:realm", "realm": "example:foundation"},
      "description": "condition.example.foundation_required"
    }
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

**Which ladder this family reads follows entirely from the tier it resolves** (the ladder's name is written on the `quality` entry itself, see [quality](./quality)); a binding declares no ladder. To give one stack both another tier and another ladder, write `mxt:quality="<quality id>"` on that stack.

**The element of an item** has exactly one reading, which asks two questions in order:

1. **Declarations**: the stack's own `mxt:element` component, plus whichever of `weapon_binding`, this table and [artifact](./artifact.md) claims the stack and writes `element`. Each registry takes its single highest-`priority` matching definition, and every result is **unioned**; each declaration is expanded through the element registry, so a `#tag` stands for every element under it.
2. **The aura the item carries**: only when nothing was declared at all — the **single** aura in its `mxt:spirit_storage`, or (when that store is empty or holds several) the aura its `mxt:item_aura` definition declares, and then that aura's `aura_type`. An artifact's `spirit_capacity` **does not count**: that says what an item can hold, not what it is.

The full reading is on [weapon_binding](./weapon_binding.md), and the `mxt:item_element` item condition reads exactly this.
