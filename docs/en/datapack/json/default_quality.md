---
title: Default Quality (default_quality)
description: Gives an existing item a fallback quality tier, as the third and last layer of quality resolution.
aside: false
---

# Default Quality (default_quality) {#default_quality}

`default_quality` gives an **existing item** a fallback quality tier: it comes last in the resolution of which tier a stack is, read only when the `mxt:quality` component on the stack and the definition the stack carries both answer nothing.

## File Location

`default_quality` is a **datapack registry**, and one file is one definition:

```text
data/<namespace>/mxt/default_quality/<entry>.json
```

The entry id is `<namespace>:<path>` — `data/example/mxt/default_quality/common_materials.json` is `example:common_materials`. The mod ships no entry for this table; a content pack uses its own namespace instead of `mxt`.

The fields of the table below go at the top level. There is **no `values` wrapper** and **no "the value is just a tier id" shorthand**: which tier it is goes in the required `quality` field. To override the same item from another pack you sort it out with `priority`, not with a `replace` switch. A **file-level** `neoforge:conditions` works: when it does not hold, the definition never enters the registry at all.

Like every other datapack registry it is read **while the world loads**, and `/reload` does not read it again. `/mxt registries list` and `/mxt registries validate` both cover it, and `/picker mxt:default_quality` lists the items these definitions claim.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Item entries | **required** | Which items this definition claims: a single item id, a `#`-prefixed item tag, or an array of either; the array may also hold `type`-carrying matcher entries, written as on the [`ItemMatcher`](../types/shared_data_types.md#itemmatcher) page. |
| `quality` | Quality entry id | **required** | Which tier this stack falls back to, pointing at one `mxt:quality` definition. |
| `priority` | Int | `0` | Order between several definitions hitting one item: the larger number wins, and **a tie falls back to registry order**. |

When several definitions hit one item, the one with the highest `priority` wins (the field defaults to `0`); only two definitions with the same `priority` fall back to registry order. **Whether `items` names an item or a tag is irrelevant**: any definition that hits is ranked by the number it declares, and naming the item by id does not move it up.

## Example

`data/example/mxt/default_quality/common_materials.json`:

```json
{
  "items": ["minecraft:cobblestone", "#example:quality_probe"],
  "quality": "example:poor"
}
```

## It Is the Third and Last Layer

Which tier a stack ends up as is taken through a fixed **three layers**, first hit wins:

1. the `mxt:quality` **component** on the stack (what a Forge Table settlement and a talisman inscription write, and what [`/quality set`](/en/player-guide/commands/quality) and a successful `upgrade` write too);
2. the `quality` declared by **the definition the stack carries** — several definitions of one type share a single built-in item, so the item itself cannot say which tier applies and only the definition on the stack can, read through a carrier component registered for that definition type;
3. this registry.

**It is the answer exactly when the stack has no definition to ask**: a bare creative or `/give` item, and the definitions claimed by item (`artifact` and `spirit_herb` are in force as soon as an item matches, and neither writes an identity component onto the stack). As long as the stack carries a definition that declares `quality`, the answer stops at layer 2; it only reaches here when the current pack no longer provides that definition (deleted, or the reference unbound). It is the easy way to give a whole family of **plain materials with no definitions** a default tier.

After `/quality clear` removes the component the item falls back to the tier of **the definition it carries**, and only then to here. The full order and how it relates to ladders is under [quality](./quality.md#resolution).

## Validation and Loading

- `quality` must point at a quality entry that **exists** in the current pack: an id the pack does not provide leaves the reference unbound, and the **whole datapack fails to load** rather than this one definition being skipped.
- The registry is **synchronized to the client with the pack**: the item tooltip, `/picker` and the information panel all read quality on the client.
- A datapack registry is read **while the world loads**; after an edit, load the world again or restart the server, because `/reload` does not apply to it.
