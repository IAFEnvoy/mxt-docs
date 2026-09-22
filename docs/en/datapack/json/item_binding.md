---
title: Item Binding (item_binding)
description: "Maps existing items to an ordered list of generic actions through the mxt:item_binding datapack registry."
---

# Item Binding (item_binding)

An item binding maps existing items to an ordered list of generic actions, run after vanilla consumption finishes. The mod does not create logical datapack items: physical items must be registered by Minecraft, a content mod, or KubeJS, and datapacks only attach MXT gameplay rules to those existing item IDs.

```text
KubeJS / mod item registry
        -> mxt:item_binding -> actions
        -> mxt:weapon_binding
        -> mxt:pill_binding
        -> mxt:technique_binding -> cultivation technique
```

`mxt:item_binding` is the generic entry point of the four bindings. The other three carry fields of their own, and no field is shared between them.

## File Location

Item binding JSON files go in `data/<namespace>/mxt/item_binding/` within your data pack.

**Purpose**: Bindings from existing items to action arrays.

The filename corresponds to its ID. For example, `data/example/mxt/item_binding/root_pellet.json` has the ID `example:root_pellet`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | The item IDs, item tags, or mixed array of both this binding matches |
| `actions` | `List<EntityAction>` | `[]` | The ordered actions executed after vanilla consumption finishes |
| `quality_group` | `Tag<item_quality>` | none | The quality group in which the item is allowed to be used |
| `conditions` | `EntityCondition[]` | `[]` | Binding use conditions; each entry may be an inline condition, or a `{condition, description}` object carrying a translation-key `description`. Described conditions are marked in the tooltip with a green `✓` or a red `✗` |
| `element` | `HolderOrTag<element>[]` | `[]` | What this item **is made of**: an entry names one element and a `#tag` names a set of them. This is the first source of "the element of an item" — a declaration wins, and only when none is written does the item fall back to the `aura_type` of the aura it carries; the full reading is on [weapon_binding](./weapon_binding.md). |
| `attachment_multiplier` | Double | `1.0` | What this item is worth as a ward: while it is carried (both hands and the Curios slots), every strike that leaves an element on the carrier leaves this fraction of it — `0.5` for half, `0` for none. Several carried items multiply, and the default is a no-op. |

### `items`

Every binding uses the `items` matcher. It accepts one item ID, one item tag (such as `"#example:herbs"`), or a mixed array of both, so one binding can cover many physical items. Any array entry may also be written as an object whose `type` is dispatched by the built-in `item_matcher_entry_type` registry, which adds wildcard, regular expression and capability matchers on top of the two shorthand forms. When multiple bindings match an item, the matcher selects the definition with the lowest `priority` first; all four binding types currently use priority `0`, so registry order decides the tie.

::: info Matcher Forms
```json
"items": "minecraft:apple"
```

```json
"items": "#minecraft:logs"
```

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

```json
"items": [{"type": "mxt:wildcard", "pattern": "mxt:*_spirit_stone"}]
```

| `type` | Field | Matches |
|--------|-------|---------|
| `mxt:item` | `item` | One item; the expanded form of the bare ID shorthand |
| `mxt:tag` | `tag` | One item tag; the expanded form of the `#` shorthand |
| `mxt:wildcard` | `pattern` | Item IDs through `*` and `?` wildcards |
| `mxt:regex` | `pattern` | Item IDs through a full regular expression |
| `mxt:spirit_storage` | none | Every item implementing `ItemAuraAccess`, the capability matcher that covers items added later |
| `mxt:herb_tag` | `element?`, `material?` | A spirit herb whose `element_tags` / `material_tags` carry the given ids; at least one field is required |

The matcher only references already registered items. See [Shared Data Types](../types/shared_data_types.md) for the full `ItemMatcher` description and [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type) for the entry types.
:::

### `quality_group`

`quality_group` must be a native item-quality tag reference prefixed with `#`. Its `values` order defines the group's quality order. When no explicit `mxt:item_quality` component or forge result exists, the last member not disabled by the `mxt:disabled` tag becomes the default quality.

An item cannot be used when its current quality is outside the group, the group has no usable member, a binding condition fails, or the quality's own `condition` fails. See [Item Quality](./item_quality.md).

A quality definition's display name is translated under the `quality` category rather than the registry path, so `example:refined` in `mxt:item_quality` is looked up as `quality.example.refined`.

### `conditions`

`conditions` is optional on every binding. Each entry may be an inline `EntityCondition`, or an object with `condition` and an optional translation-key `description`. Described entries are shown in the item tooltip with a green `✓` when true or a red `✗` when false; the description text itself keeps its normal style.

Every matching binding condition and the current quality's condition must pass before the item can be used. The check blocks right-click use, block interaction, attacks, data-driven item effects, weapon tick effects, technique learning, and binding-added weapon attributes.

## Example

A pellet that grants a spirit root when consumed and is restricted to one quality group:

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": ["kubejs:root_pellet", "#example:root_pellets"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "quality_group": "#example:quality/root_pellet"
}
```

A pill that first checks for an existing fire spirit root and then swaps it for a water spirit root:

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

The same binding type also attaches context-free permanent bonuses, such as granting a physique:

```json
// data/example/mxt/item_binding/body_pill.json
{
  "items": "kubejs:body_pill",
  "actions": [
    {"type": "mxt:grant_physique", "physique": "example:innate_sword_bone"}
  ]
}
```

The behaviour id used inside `actions` comes from the [Entity Action Types](../types/action/entity_action_types.md) list, and the condition ids come from the [Entity Condition Types](../types/condition/entity_condition_types.md) list.

