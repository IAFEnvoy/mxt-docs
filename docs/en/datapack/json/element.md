---
title: Element (element)
description: Defines an element together with its overcoming and adapted relations, what each relation is worth, and the colour used for aura cost text.
---

# Element (element)

An `element` defines an element and the relations between elements: which elements it overcomes, which it is adapted to, what each of those relations is worth in damage, which damage types it claims, how it accumulates on a body, and the colour used to show it. The `mxt:element` registry holds **elements only** — an aura names one through its own `aura_type`, and spirit roots bind to one through their `element` field.

## File Location

Element files go in `data/<namespace>/mxt/element/` within your datapack.

**Purpose**: Element relations (`overcomes`/`adapted_to`), what each relation is worth in damage, the damage types the element claims (`damage_types`), its accumulation numbers, and its display colour; an aura points at one through its `aura_type`.

The filename corresponds to its ID. For example, `data/example/mxt/element/fire.json` has the ID `example:fire`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `overcomes` | `ElementRelation[]` | `[]` | The elements this element overcomes, and what each of those edges is worth on the attacking side. |
| `adapted_to` | `ElementRelation[]` | `[]` | The elements this element is adapted to, and what each of those edges is worth on the defending side. |
| `damage_types` | `HolderOrTag<damage_type>[]` | `[]` | The damage types this element claims: a claimed damage type **means** this element. |
| `attachment_decay` | Double | `0` | How much of this element's accumulation on a body decays per tick (`0` means it never decays). |
| `damage_attachment` | Double | `0` | How much accumulation one strike made of this element leaves on the target (`0` means it leaves none). |
| `color` | `RGBColor` | `#FFFFFF` | Colour used when the element is shown, such as in aura cost text. Accepts `#RRGGBB` or an integer. |

`ElementRelation` is one edge: who it points at, and what that edge is worth.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `elements` | `HolderOrTag<element>`, or an array of them | **required** | The elements this edge points at. As everywhere else, one id and an array are both accepted, and entries and `#` tags may be mixed. |
| `multiplier` | Double | **required** | The damage multiplier of this edge. It must be a finite, non-negative number; anything else is refused while the data pack loads (the registry fails to load and the server does not start) rather than clamped at runtime. |

## How the Two Relations Are Read

Both relations are read by the [damage system](../../technical/damage.md), in opposite directions:

- **Attacking side.** When an attacker's spirit-root element lists the target's element in its `overcomes`, the damage that hit deals is multiplied by that edge's `multiplier` — "I overcome it, so I hit harder".
- **Defending side.** When the target's spirit-root element lists the attacking element in its `adapted_to`, the damage it takes is multiplied by that edge's `multiplier`. A value below `1` reduces, one above `1` makes the target softer, and exactly `1.0` means "the relation exists but changes nothing" — which is what content that only needs the pairing writes, because the `mxt:element_overcomes` condition asks whether a relation exists rather than what it is worth.

A holder with several spirit roots multiplies every edge that matches: two roots that both overcome the target take both bonuses, and the numbers you wrote are the whole of the result.

::: info Relations and Colours
Element relations may contain cycles, so do not rely on tag value order. Element relations are data-driven and tags classify elements but do not encode precedence. A spirit root binds exactly one element through its `element` field, and an aura names one through `aura_type`. Either side having no spirit root at all reads as "no relation applies", so an ordinary mob takes damage unchanged.
:::

## Reading the Element of a Strike

What element a strike is **made of** is read from its damage type rather than inferred from the attacker's spirit roots. An element claims damage types through `damage_types` (entries or `#` tags), and the fixed priority is:

| Situation | The element of the strike |
|-----------|---------------------------|
| The `damage_type` is claimed by one or more elements | Every claimant — as with spirit roots, several matches **multiply** |
| Nobody claims it, and there is an attacker | The enabled elements of the attacker's spirit roots — the old behaviour, and what an element with no `damage_types` leaves in place |
| Nobody claims it and there is no attacker | Empty = no relation applies |

This channel is the **only** basis of the reduction layer: the defending side receives nothing but a `DamageSource`, so the element has to be readable from the damage type. The payoff is that **environmental damage becomes elemental without touching vanilla code**: claim `minecraft:lava`, `minecraft:in_fire` and `minecraft:lightning_bolt` for an element and a lava bath, a lightning strike and a blast all settle as that element; `mxt:explode` uses `minecraft:explosion`, so claiming it makes explosions elemental. Several elements claiming one damage type is legal (they multiply) but warns once, the first time such a strike is actually used.

A damage type is a declaration by the element, so **the declared element and the damage type have to agree**: writing `element` on `mxt:damage` / `mxt:damage_target` lets the `damage_type` be omitted (the pipeline takes the first type the element claims); when both are written, the first strike that actually uses them checks that the element really claims that type and logs one line per distinct mismatch. It is deliberately **not** a load-time check: the value behind a declared element is not necessarily bound yet while another datapack registry page is being decoded, so the same pack would pass or fail depending on which page finished first. That is what makes "a fire-root cultivator casting a water art" expressible while the reduction layer still reads back the same answer.

```json
// data/example/mxt/element/fire.json
{
  "overcomes": [{ "elements": ["example:water"], "multiplier": 1.5 }],
  "adapted_to": [{ "elements": ["example:fire"], "multiplier": 0.5 }],
  "damage_types": ["minecraft:in_fire", "minecraft:on_fire", "minecraft:lava", "#example:fire_like"],
  "color": "#FF6600"
}
```

The damage condition `mxt:element` (see the condition tables) reads the **same** resolution, so the element a condition names and the element the pipeline actually multiplies can never disagree.

## Element Accumulation

The two numbers describe how an element builds up on a body: `damage_attachment` is what one strike made of that element leaves on the target (default `0`, so nothing accumulates by default), and `attachment_decay` is how much leaves per tick on its own (default `0`, so nothing wears off by default). What happens once enough has built up is defined by [Element Reaction](./element_reaction.md), so "an element is a relation" and "an element accumulates" are two things a pack turns on separately. The entity action `mxt:attach_element` adds to or subtracts from one element's accumulation directly, and the entity condition `mxt:element_attachment` reads the current amount.

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

