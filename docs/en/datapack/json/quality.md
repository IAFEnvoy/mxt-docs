---
title: Quality (quality)
description: A quality entry names one quality tier and carries the value, forging and alchemy modifiers that tier settles with.
aside: false
---

# Quality (quality) {#quality}

File location: `data/<namespace>/mxt/quality/<path>.json`

One `quality` is one tier. What it is called is for the interface to show; `value_multiplier` / `forging_modifier` / `alchemy_modifier` are what the economy, forging and alchemy settlements read. A quality's **order, default tier, membership and upgrade path are not in this file**: all of them are decided by a [quality_chain](./quality_chain.md), so a single `quality` only describes what this tier is called and what it is worth.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<namespace>.<path>` | The quality's name. |
| `description` | Text Component | `quality.mxt.<namespace>.<path>.description` | The quality's description, drawn below the quality name. |
| `color` | Color | none | The quality's colour, six hex digits `"#RRGGBB"` or an integer. |
| `value_multiplier` | `Modifier` | `1` | The currency value modifier. |
| `forging_modifier` | `Modifier` | `1` | The forging modifier. |
| `alchemy_modifier` | `Modifier` | `1` | The alchemy modifier. |
| `condition` | `EntityCondition` | `mxt:always` | The condition for using this quality. |

`name` and `description` may both be omitted: omitting one means the key generated from the entry id in the table above, writing one uses the text you give (a string is a translation key, an object is a full component).

While `condition` does not hold, an item that resolves to this tier cannot be used: use, attacks, the periodic behaviour of a main-hand weapon and the vanilla attribute modifiers it grants all stop.

`color` follows rules of its own, unlike those two text fields: **writing it wins** (it even overrides a colour carried inside the `name` component), and **leaving it out changes nothing at all**. It is not "default white" - a quality without a colour goes on showing the vanilla rarity colour. Only four places tint: the item name line of an item tooltip, the "Quality: name" line in that tooltip, the entry names of the quality category in `/picker`, and the tier table in a Forge Table blueprint tooltip. The item name line can also be switched off by the player: **Client Settings → Tooltips → Tint Item Name** (on by default), which leaves the other three alone. The quality description line is always grey.

All three `Modifier` fields are optional objects, and `description` and `modifier` inside one may be omitted as well: an omitted `modifier` is `1`, and an omitted `description` **draws no line at all** (the modifier still settles). Its wording is entirely for the data pack to write and is never generated:

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

`value_multiplier` settles by multiplying the item's currency unit value by `modifier` and rounding to a whole number, so **what you can see is what gets paid** (the tooltip shows the settled value too). A `modifier` that is missing, non-finite or ≤0 is treated as 1; a product that is non-finite, below 1 or past `long` falls back to the declared value, and never conjures up a number the data pack never wrote.

`forging_modifier` settles by looking the quality tier up with `effective extra steps = actual extra steps ÷ modifier`, so above `1` the same technique buys a better tier. The value comes from the **materials this session locked in**: with several materials the lowest tier among them wins, and a material that resolves no quality is skipped. A `modifier` of 1 changes nothing at all.

`alchemy_modifier` settles by deciding the brewing duration with `duration = declared duration ÷ modifier` (above `1` brews faster); the value comes from the input stacks in the furnace **at the moment the batch starts**, again the lowest tier and skipping the ones without a quality, and the result is written into the session snapshot.

A quality's **order, default tier, membership and upgrade path are all decided by the chain**: one [quality_chain](./quality_chain.md) sorts several qualities low→high into a chain, and a binding table references it with `quality_chain`. The tier an item resolves to has to be on the chain, or the item cannot be used; which tier it falls to when no override component was written is answered by the chain's `default` as well. Resolution only answers which tier it is - for the full order see [How a Quality Is Resolved](./quality_chain.md#resolution).

Vanilla tags take no part in quality resolution: `group/<name>` tags are not read and nothing reads the `tooltip_order` tag either, and nothing in the interface sorts by quality order, so it is not a sorting input. `color` only affects where a quality name is drawn and takes no part in resolution.

## Naming and Translation {#translation}

The category is the registry's own path: `example:refined` looks up `quality.mxt.example.refined`, and the description appends `.description` (**the registry namespace is still `mxt`**). Among the registries carrying `name` / `description`, quality is the only one that draws `description` (below the quality name); the others only store and read theirs, and no interface draws it. There is no `translation_key` field in the JSON; a `/` in the path stays in the key exactly as it does in every other registry.
