---
title: Item Matcher Types
description: The seven entries of item_matcher_entry_type, with the fields and matching rules of each.
---

# Item Matcher Types

`item_matcher_entry_type` is the type family of each entry in an [`ItemMatcher`](../shared_data_types.md#itemmatcher): an `ItemMatcher` is one or more such entries, and each entry picks a matching mode by writing one of the IDs below in its `type`; a string without a `type` is read as a bare item ID or an item tag.

`mxt:item` and `mxt:tag` are the expanded forms of the shorthands, and `mxt:technique` and `mxt:spirit_storage` have no fields at all. Entries in the array may be plain strings, objects with a `type`, or a mix of both.

## `item_matcher_entry_type`

| `type` | Fields |
| --- | --- |
| `mxt:item` | `item` |
| `mxt:tag` | `tag` |
| `mxt:wildcard` | `pattern` |
| `mxt:regex` | `pattern` |
| `mxt:technique` | none |
| `mxt:spirit_storage` | none |
| `mxt:herb_tag` | `element`, `material` |

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:regex", "pattern": "othermod:(ruby|jade)_gem"}
]
```

### `mxt:item`

Matches one exact item.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `item` | Identifier | **required** | Item registry ID; the shorthand form is the bare ID string |

```json
{"type": "mxt:item", "item": "minecraft:apple"}
```

### `mxt:tag`

Matches every item in an item tag.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | Item tag ID | **required** | Tag reference; write the tag ID without `#` here, the shorthand form is the `#`-prefixed string |

```json
{"type": "mxt:tag", "tag": "minecraft:logs"}
```

### `mxt:wildcard`

Matches item IDs with `*` and `?` wildcards.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `pattern` | String | **required** | `*` matches any run of characters and `?` matches a single character; must not be empty |

```json
{"type": "mxt:wildcard", "pattern": "mxt:*_spirit_stone"}
```

### `mxt:regex`

Matches item IDs with a regular expression.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `pattern` | String | **required** | A full regular expression matched against the item ID; must not be empty |

```json
{"type": "mxt:regex", "pattern": "mxt:(medium|high)_spirit_stone"}
```

### `mxt:technique`

Matches an item whose stack carries the `mxt:technique` component, that is, a stack of technique manuals.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields |

```json
{"type": "mxt:technique"}
```

It goes by which technique the stack teaches, not by the item ID. It asks the component only: an item claimed by some `technique_binding`'s `items` but carrying no `mxt:technique` component does not match.

### `mxt:spirit_storage`

Matches every item that stores aura.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields |

```json
{"type": "mxt:spirit_storage"}
```

It is the only entry that matches by capability rather than by ID, so an item added later that can store aura is covered without editing the file that declared this matcher.

### `mxt:herb_tag`

Matches an item that is a [spirit herb](../../json/spirit_herb.md) whose `element_tags` / `material_tags` intersect the given query.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `element` | Element id or `#tag` | none | The element alignment of the matching spirit herb |
| `material` | Identifier | none | Material ID the matching spirit herb has to list in `material_tags`; at least one of `element` and `material` must be given |

```json
{"type": "mxt:herb_tag", "element": "example:fire"}
```

```json
{"type": "mxt:herb_tag", "element": "#example:fire_like", "material": "example:herb"}
```

`mxt:herb_tag` is the entry that reads the `mxt:spirit_herb` data pack registry rather than only vanilla's item registry: it matches an item that is a [spirit herb](../../json/spirit_herb.md), that is, an `mxt:spirit_herb` definition whose own matcher accepts the stack, and then asks that definition's alignment: `element` queries `element_tags` and `material` queries `material_tags`; giving both means both have to be satisfied, and giving neither is rejected when the data pack loads.

`element` and `element_tags` are both written against the element registry (an entry or a `#tag`) and are expanded into element sets on **both** sides before the intersection is taken, so a herb aligned with fire matches a query for `#warm_elements` and the other way round; which side the tag is written on does not affect the result. `material` stays a plain identifier. The tags are a property of the herb rather than of the item, so content can say "any fire-aligned spirit herb" without knowing which items a later pack binds to that herb. The herb registry only exists while a server runs, so on the client the entry simply reports no match.

It can be nested inside `mxt:item_matcher` in an entity condition (its `items` is an `ItemMatcher`), for example with `mxt:has_equipped_item` to test "holding a fire-aligned spirit herb":

```json
{
  "type": "mxt:has_equipped_item",
  "item_condition": {
    "type": "mxt:item_matcher",
    "items": [
      {"type": "mxt:item", "item": "minecraft:blaze_powder"},
      {"type": "mxt:herb_tag", "element": "example:fire"},
      {"type": "mxt:herb_tag", "material": "example:herb"}
    ]
  }
}
```

## Shorthand

A bare string and a `#tag` string are shorthands for `mxt:item` and `mxt:tag`, and the three forms can be mixed in one array:

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

`mxt:item` stands for `{"type": "mxt:item", "item": ...}` and `mxt:tag` for `{"type": "mxt:tag", "tag": ...}`. Every entry in the array stays an entry or a tag; duplicate values do not change the meaning on their own.

## Match order

A matcher only references items that are already registered. When several definitions match the same item, the one with the **highest** declared `priority` is picked (the field defaults to `0`, and ten tables accept it: `artifact`, the six `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` bindings, `spirit_herb`, `item_aura` and `currency`); only two definitions with the same `priority` fall back to registry order, so which one wins is written in the pack itself and has nothing to do with file names (the same direction as `priority` on `aura_zone` and `element_reaction`). **Which kind of matcher entry matched is irrelevant**: any definition that hits joins the ranking with the number it declares, and naming an item does not move it up.

Wildcard and regex entries are matched against the item ID, such as `minecraft:apple`, not against display names.
