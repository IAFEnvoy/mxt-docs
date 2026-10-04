---
title: Default Quality (default_quality)
description: Gives an existing item a fallback quality tier, as the third and last layer of quality resolution.
aside: false
---

# Default Quality (default_quality) {#default_quality}

`default_quality` gives an **existing item** a fallback quality tier: it comes last in the resolution of which tier a stack is, read only when the `mxt:quality` component on the stack and the definition the stack carries both answer nothing. It is not a registry but an **item data map**, and its file always lives at:

```text
data/mxt/data_maps/item/default_quality.json
```

**The first namespace has to be the table's own namespace, `mxt`, not the content pack's**: a content pack adds values by dropping another file into `data/mxt/data_maps/item/`. A wrong namespace only leaves one log line, `Found data map file for non-existent data map type`.

## Fields

| Key | Type | Description |
| --- | --- | --- |
| (key) | item id or a `#`-prefixed item tag | **This is "which item"** — the table has no `items` field, and a tag expands at load time into every item it held then. |
| (value) | Quality id | The id of one `mxt:quality` entry, written as a **bare string** (such as `"example:common"`). The value is that tier itself, with no outer field name. |

**This table has no `priority`**: when two packs each write one value for the same item the later one wins (writing order within one file, data pack load order across files), instead of the comparison the other item data maps do. The value-level `replace` and value-level conditions are described under [Data Maps](../overview.md#data-maps).

## Example

```json
// data/mxt/data_maps/item/default_quality.json
{
  "values": {
    "minecraft:clay_ball": "example:common",
    "#example:common_materials": "example:common"
  }
}
```

## It Is the Third and Last Layer

Which tier a stack ends up as is taken through a fixed **three layers**, first hit wins:

1. the `mxt:quality` **component** on the stack (what a Forge Table settlement and a talisman inscription write, and what [`/quality set`](/en/player-guide/commands/quality) and a successful `upgrade` write too);
2. the `quality` declared by **the definition the stack carries** — several definitions of one type share a single built-in item, so the item itself cannot say which tier applies and only the definition on the stack can, read through a carrier component registered for that definition type;
3. this data map.

**It is the answer exactly when the stack has no definition to ask**: a bare creative or `/give` item, and the definitions claimed by item (`artifact` and `spirit_herb` are in force as soon as an item matches, and neither writes an identity component onto the stack). As long as the stack carries a definition that declares `quality`, the answer stops at layer 2; it only reaches here when the current pack no longer provides that definition (deleted, or the reference unbound). It is the easy way to give a whole family of **plain materials with no definitions** a default tier.

After `/quality clear` removes the component the item falls back to the tier of **the definition it carries**, and only then to here. The full order and how it relates to ladders is under [quality](./quality.md#resolution).

## Validation and Loading

- A value must point at a quality entry that **exists** in the current pack: a missing id makes **this file** fail to decode as a whole, leaving one `Could not read data map of type mxt:default_quality` line in the log, with the other data maps unaffected.
- The table is **synchronized to the client with the pack**: the item tooltip, `/picker` and the information panel all read quality on the client.
- The data map is read **while the world loads**; after an edit, load the world again or restart the server, because `/reload` does not apply to it.
