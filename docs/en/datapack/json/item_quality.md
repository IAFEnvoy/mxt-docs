---
title: Item Quality (item_quality)
description: An item quality names a quality tier and carries the value, forging and alchemy modifiers attached to it.
aside: false
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
| `name` | Text Component | `quality.mxt.<namespace>.<path>` | The quality's name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `quality.mxt.<namespace>.<path>.description` | The quality's description, drawn below the quality name. When omitted it is the default key in the previous column. |
| `value_multiplier` | `Modifier` | `1` | The currency value modifier. |
| `forging_modifier` | `Modifier` | `1` | The forging modifier. |
| `alchemy_modifier` | `Modifier` | `1` | The alchemy modifier. |
| `condition` | `EntityCondition` | `mxt:always_true` | The condition for using this quality. |

`name` and `description` may both be omitted: omitting one means the key generated from the id above, while writing it uses the text you give (a bare string is a translation key, an object is a full component). `name` is drawn on the quality line of an item tooltip, and `description` on the grey line below it.

## Modifiers

All three modifier fields are optional objects, and both fields inside such an object may be omitted as well: an omitted `modifier` is `1`, and an omitted `description` **draws no line at all** — the modifier still settles, but its wording is entirely up to the data pack and is never generated for you. Omitting a whole modifier object means "no modifier".

All three are `NumberProvider`s evaluated with the formula context of the settlement they take part in, and all three are settled rather than only displayed:

- `value_multiplier` scales the item's currency unit value. The product is rounded to a whole unit, and the number the tooltip shows is the number a settlement pays. A product that falls below `1`, reaches past a `long` or stops being finite leaves the declared value alone instead of clamping.
- `forging_modifier` divides the extra steps the blueprint's quality ladder is read with at the end of a forging session, rounded to whole steps. A modifier above `1` therefore reaches a better tier from the same work, and one below `1` reaches a worse one. The quality that supplies the modifier is the **lowest** among the materials the session locked in — a piece is only as good as its worst material — and a material that resolves no quality is skipped, so a batch that mixes graded and ungraded ingredients reads as its graded one alone.
- `alchemy_modifier` divides the brewing duration of an alchemy session, so a modifier above `1` brews faster. The quality is the **lowest** among the input stacks at the moment the session starts, and a stack that resolves no quality is skipped.

A modifier of exactly `1` changes nothing. A field that is missing, a stack that resolves no quality and a provider that yields a non-finite or non-positive number all behave as `1.0`, because a broken formula has to leave the amount it settles alone rather than cancel it.

## Example

```json
{
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value_multiplier",
    "modifier": 1.25
  },
  "forging_modifier": {
    "modifier": "1 + level * 0.01"
  }
}
```

That file omits `name`, `description` and `forging_modifier.description`.

## Order and Groups

Quality order and grouping are decided by vanilla tags:

```text
data/mxt/tags/mxt/item_quality/tooltip_order.json
data/<namespace>/tags/mxt/item_quality/group/<name>.json
```

The order of `values` in `tooltip_order` is preserved by `ItemQualityService.ordered`, and group tags may overlap. The `quality_group` in a binding table must be a `#` tag, and an explicit quality component or a forging quality must belong to that group.

## Translation

`item_quality` is the one registry whose category is not its own path. The category here is `quality`, while the **registry namespace is still `mxt`**, so `example:refined` is looked up as `quality.mxt.example.refined`, and its description as `quality.mxt.example.refined.description`.

Among the registries that carry `name` and `description`, this is also the only one that **already** draws the description (the line under the quality name); the others store and read both fields but have nothing that renders them yet. There is no `translation_key` JSON field; a path containing `/` keeps it in the key, exactly as it does in every other registry.

## Related Formats

Quality entries are referenced by the quality ladder of [Forging Blueprint](./forging_blueprint.md) and by [Spirit Herb](./spirit_herb.md). An item's quality is resolved in a fixed order: an explicit `mxt:item_quality` component, then the quality of a forge result, then the last enabled member of the matching binding's `quality_group`, then the default quality declared by a matching spirit herb.

