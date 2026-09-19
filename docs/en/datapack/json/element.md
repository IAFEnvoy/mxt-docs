---
title: Element (element)
description: Defines an element together with its overcoming and adapted relations, what each relation is worth, and the colour used for aura cost text.
---

# Element (element)

An `element` defines an element and the relations between elements: which elements it overcomes, which it is adapted to, what each of those relations is worth in damage, and the colour used to show it. The `mxt:element` registry holds **elements only** — an aura names one through its own `aura_type`, and spirit roots bind to one through their `element` field.

## File Location

Element files go in `data/<namespace>/mxt/element/` within your datapack.

**Purpose**: Element relations (`overcomes`/`adapted_to`), what each relation is worth in damage, and their display colour; an aura points at one through its `aura_type`.

The filename corresponds to its ID. For example, `data/example/mxt/element/fire.json` has the ID `example:fire`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `overcomes` | `ElementRelation[]` | `[]` | The elements this element overcomes, and what each of those edges is worth on the attacking side. |
| `adapted_to` | `ElementRelation[]` | `[]` | The elements this element is adapted to, and what each of those edges is worth on the defending side. |
| `color` | `RGBColor` | `#FFFFFF` | Colour used when the element is shown, such as in aura cost text. Accepts `#RRGGBB` or an integer. |

`ElementRelation` is one edge: who it points at, and what that edge is worth.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `elements` | `HolderOrTag<element>`, or an array of them | **required** | The elements this edge points at. As everywhere else, one id and an array are both accepted, and entries and `#` tags may be mixed. |
| `multiplier` | Double | **required** | The damage multiplier of this edge. It must be a finite, non-negative number; anything else is refused while the data pack loads (the registry fails to load and the server does not start) rather than clamped at runtime. |

## How the Two Relations Are Read

Both relations are read by the [damage pipeline](../damage.md), in opposite directions:

- **Attacking side.** When an attacker's spirit-root element lists the target's element in its `overcomes`, the damage that hit deals is multiplied by that edge's `multiplier` — "I overcome it, so I hit harder".
- **Defending side.** When the target's spirit-root element lists the attacking element in its `adapted_to`, the damage it takes is multiplied by that edge's `multiplier`. A value below `1` reduces, one above `1` makes the target softer, and exactly `1.0` means "the relation exists but changes nothing" — which is what content that only needs the pairing writes, because the `mxt:element_overcomes` condition asks whether a relation exists rather than what it is worth.

A holder with several spirit roots multiplies every edge that matches: two roots that both overcome the target take both bonuses, and the numbers you wrote are the whole of the result.

::: info Relations and Colours
Element relations may contain cycles, so do not rely on tag value order. Element relations are data-driven and tags classify elements but do not encode precedence. A spirit root binds exactly one element through its `element` field, and an aura names one through `aura_type`. Either side having no spirit root at all reads as "no relation applies", so an ordinary mob takes damage unchanged.
:::

## Example

```json
{
  "overcomes": [
    { "elements": ["example:metal"], "multiplier": 1.25 },
    { "elements": ["#example:wood"], "multiplier": 1.1 }
  ],
  "adapted_to": [
    { "elements": ["example:fire"], "multiplier": 0.5 }
  ],
  "color": "#FF6600"
}
```

