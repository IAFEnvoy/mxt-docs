---
title: Item Quality (item_quality)
description: An item quality names a quality tier and carries the value, forging and alchemy modifiers attached to it.
---

# Item Quality (item_quality)

An item quality defines one quality tier that items can carry, together with the modifiers that tier applies to currency value, forging and alchemy.

## File Location

Item quality JSON files go in `data/<namespace>/mxt/item_quality/` within your data pack.

**Purpose**: Shared quality and quality conditions.

The filename corresponds to its ID. For example, `data/example/mxt/item_quality/refined.json` has the ID `example:refined`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `display_name` | Text Component | **required** | The quality name or translation key. |
| `value_multiplier` | `Modifier` | empty description, `1` | The currency value modifier. The object contains `description` and `modifier`. Once configured it is automatically added to the item quality summary; the modifier scales the item's currency unit value. |
| `forging_modifier` | `Modifier` | empty description, `1` | The forging modifier. The object contains `description` and `modifier`. Once configured it is automatically added to the item quality summary; the modifier divides the extra steps the quality tier is chosen from at the end of a forging session. |
| `alchemy_modifier` | `Modifier` | empty description, `1` | The alchemy modifier. The object contains `description` and `modifier`. Once configured it is automatically added to the item quality summary; the modifier divides the brewing duration of an alchemy session. |
| `condition` | `EntityCondition` | `mxt:always_true` | The condition for using this quality. |

## Modifiers

All three modifier fields are optional objects. The object's `description` is appended to the item quality tooltip automatically — a modifier whose `description` renders empty is skipped — while `modifier` is the number provider actually used at runtime, defaulting to `1`.

All three are `NumberProvider`s evaluated with the formula context of the settlement they take part in, and all three are settled rather than only displayed:

- `value_multiplier` scales the item's currency unit value. The product is rounded to a whole unit, and the number the tooltip shows is the number a settlement pays. A product that falls below `1`, reaches past a `long` or stops being finite leaves the declared value alone instead of clamping.
- `forging_modifier` divides the extra steps the blueprint's quality ladder is read with at the end of a forging session, rounded to whole steps. A modifier above `1` therefore reaches a better tier from the same work, and one below `1` reaches a worse one. The quality that supplies the modifier is the **lowest** among the materials the session locked in — a piece is only as good as its worst material — and a material that resolves no quality is skipped, so a batch that mixes graded and ungraded ingredients reads as its graded one alone.
- `alchemy_modifier` divides the brewing duration of an alchemy session, so a modifier above `1` brews faster. The quality is the **lowest** among the input stacks at the moment the session starts, and a stack that resolves no quality is skipped.

A modifier of exactly `1` changes nothing. A field that is missing, a stack that resolves no quality and a provider that yields a non-finite or non-positive number all behave as `1.0`, because a broken formula has to leave the amount it settles alone rather than cancel it.

## Example

```json
{
  "display_name": "quality.example.refined",
  "value_multiplier": {
    "description": "quality.example.refined.value",
    "modifier": 1.25
  },
  "forging_modifier": {
    "description": "quality.example.refined.forging",
    "modifier": "1 + level * 0.01"
  }
}
```

## Order and Groups

Quality order and grouping are decided by vanilla tags:

```text
data/mxt/tags/mxt/item_quality/tooltip_order.json
data/<namespace>/tags/mxt/item_quality/group/<name>.json
```

The order of `values` in `tooltip_order` is preserved by `ItemQualityService.ordered`, and group tags may overlap. The `quality_group` in a binding table must be a `#` tag, and an explicit quality component or a forging quality must belong to that group.

## Translation

`item_quality` is the one registry translated under a category other than its own path. A definition's display name comes from `<category>.<namespace>.<path>`, and here the category is `quality`, so `example:refined` is looked up as `quality.example.refined`. There is no `translation_key` JSON field; a path containing `/` keeps it in the key, exactly as it does in every other registry.

## Related Formats

Quality entries are referenced by the quality ladder of [Forging Blueprint](./forging_blueprint.md) and by [Spirit Herb](./spirit_herb.md). An item's quality is resolved in a fixed order: an explicit `mxt:item_quality` component, then the quality of a forge result, then the last enabled member of the matching binding's `quality_group`, then the default quality declared by a matching spirit herb.

