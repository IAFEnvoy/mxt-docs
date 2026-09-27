---
title: Element (element)
description: Defines the relations between elements, what each relation is worth in damage, which damage types it claims, and how it accumulates on a body.
aside: false
---

# Element (element) {#element}

An `element` defines the relations between elements (who overcomes whom, who is adapted to whom, each relation carrying its own damage multiplier), which damage types it claims, its accumulation and decay numbers, and its display colour. An aura points at one through its own `aura_type`; the unified damage pipeline settles overcoming and adapting through the elements of both sides' spirit roots, and once enough attachment has built up [element_reaction](./element_reaction.md) settles it.

## File Location

Element files go in `data/<namespace>/mxt/element/` within your datapack.

**Purpose**: element relations (`overcomes`/`adapted_to`, each relation carrying its own damage multiplier), the damage types it claims (`damage_types`), its accumulation and decay numbers, and its display colour.

The filename is its ID. For example, `data/example/mxt/element/fire.json` has the ID `example:fire`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `element.mxt.<namespace>.<path>` | Display name; when omitted, the generated key in the left column is used, and when written, your text is. |
| `description` | Text Component | `element.mxt.<namespace>.<path>.description` | Definition description; when omitted, the generated key in the left column is used. It is stored and read today, but nothing draws it yet. |
| `overcomes` | Relation array | `[]` | Which elements this element overcomes, and what each overcoming edge is worth in damage. |
| `adapted_to` | Relation array | `[]` | Which elements this element is adapted to (resists), and what each adapting edge multiplies incoming damage by. |
| `damage_types` | Array whose entries are a damage type id, a `#tag`, or an object | `[]` | Which damage types this element claims: a claimed damage type **is** this element. A bare string (or `#tag`) uses the element's own `damage_attachment`, while `{"damage_type": "minecraft:lava", "damage_attachment": 2.0}` gives that kind of hit **its own buildup**. See "A claimed type is a group" below. |
| `attachment_decay` | Double | `0` | How much of this element naturally decays on a body per tick (`0` = never decays). |
| `damage_attachment` | Double | `0` | How much buildup one strike made of this element leaves on its target (`0` = leaves none). |
| `color` | `RGBColor` | `#ffffff` | Display colour, used for text such as aura costs. |
| `conflict_multiplier` | Double | `1.0` | What this element is worth in the hand of a holder whose **spirit root conflicts with it**: when the striker's active spirit root lists it in `conflicting_elements`, the damage that striker deals is multiplied by this number. |

`attachment_decay`, `damage_attachment`, `conflict_multiplier` and every relation's `multiplier` have to be **finite and non-negative** at load time, and a relation's `elements` may not be empty — otherwise the whole definition fails to load and the server does not start, rather than the value being clamped at runtime. `color` accepts `#RRGGBB` or an integer in `0..16777215`.

## Relation Entries

Every entry in `overcomes` and `adapted_to` is a relation plus what that relation is worth:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | An element id, a `#tag`, or an array of those | **required** | The elements this edge points at; a single id and an array, entries and `#` tags are all accepted. |
| `multiplier` | Double | **required** | The damage multiplier of this edge. It must be a finite, non-negative number. |

One element may legally write the same target in two relations inside `overcomes` or `adapted_to`, and every edge that matches is multiplied in; because that is much more often a copy-paste slip, and the symptom (damage scaled by the square of one number) is invisible in game, the loader warns once for it.

```json
// data/example/mxt/element/fire.json
{
  "overcomes": [
    { "elements": ["example:metal"], "multiplier": 1.25 },
    { "elements": ["#example:wood_like"], "multiplier": 1.1 }
  ],
  "adapted_to": [
    { "elements": ["example:fire"], "multiplier": 0.5 }
  ],
  "color": "#ff5522"
}
```

The two relations are read by the **unified damage pipeline**, in opposite directions:

- **The first layer (output) settles on the attacking side.** When the attacker's spirit-root element lists the target's spirit-root element in its `overcomes`, the damage of that hit is multiplied by that edge's `multiplier` — "I overcome it, so I hit harder".
- **The second layer (reduction) settles on the defending side.** When the target's spirit-root element lists the attacking element in its `adapted_to`, the damage it takes is multiplied by that edge's `multiplier`. Writing `< 1` reduces it, writing `> 1` makes the target softer, and writing `1.0` means "the relation holds but changes no number" (which is exactly what the `mxt:element_overcomes` condition needs, since it only asks whether the relation holds).

When an entity has several spirit roots, every edge that holds is **multiplied**: two roots that both overcome the target take the bonus twice, and whatever you wrote as the `multiplier` is what applies. A spirit root binds one or more elements through its `elements` field: relations hold **per element**, so a body with two elements settles both against the target, which is why a root holding both fire and water takes part in both directions.

::: info Relations and Colours

Element relations may contain cycles (metal overcomes wood, wood overcomes earth… or even two elements overcoming each other), so do not rely on tag value order. As long as either side has no spirit root at all, every relation reads as "no relation", and the damage lands unchanged; ordinary mobs and players who have not awakened yet are both that case, and the pipeline neither errors out nor adjusts a number over it.

:::

### An Element Is Recognised From Its Damage Types: `damage_types`

What element a strike **is** is looked up from its damage type rather than inferred from the attacker's spirit roots. An element claims damage types through `damage_types` (bare entries, `#` tags, or objects carrying their own buildup all work), and once recognised the priority is fixed:

| Situation | The element of this strike |
| --- | --- |
| The `damage_type` is claimed by one or more elements | Every claimant (the same as with spirit roots: several matches **multiply**) |
| Nobody claims it, and there is an attacker | The enabled elements of the attacker's spirit roots (the reading an element with no `damage_types` falls back to) |
| Nobody claims it, and there is no attacker | Empty = no relation |

This channel is the **only** basis of the second layer's reduction: the defending side only ever sees the damage source of the strike, so the element has to be readable back from the damage type. The payoff is that **environmental damage becomes elemental without touching vanilla code** — claim `minecraft:lava`, `minecraft:in_fire` and `minecraft:lightning_bolt` for an element and taking a lava bath, being struck by lightning or being caught in a blast all settle as that element; `mxt:explode` uses `minecraft:explosion`, so claiming it makes explosions elemental. Several elements claiming the same damage type is legal (they multiply) but warns once at load time.

A damage type listed in the `mxt:no_bonus` tag is the exception: that strike reads no element, and claiming it changes nothing (by default the tag holds the two void entries `minecraft:out_of_world` and `mxt:lifespan`; see [The damage system](/en/technical/damage)).

All of the above is about **a strike**. What an **item** is is a second reading: the `mxt:element` component on the stack, plus whichever of `weapon_binding` / `item_binding` / `artifact` claims that stack and whether it wrote an `element` (all of them unioned), and only when none of them declares anything does it fall back to the `aura_type` of the aura the item carries. That is what the item condition `mxt:item_element` reads; the full explanation is on [weapon_binding](./weapon_binding.md).

A damage type is a declaration by the element, so **the declared element and the damage type have to agree**: writing `element` on `mxt:damage` / `mxt:damage_target` lets `damage_type` be omitted (the pipeline takes the first type that element claims); when both are written, the first time that strike is actually used checks whether the element really claims that type, and a mismatch logs one line **for each side**. It is deliberately not a load failure: values that cross registries are not necessarily bound yet while the pack loads, so the same pack passes or fails depending on the parallel load order, which is why the check is deferred to first use. That is what makes "a fire-root cultivator casting a water art" expressible while the second layer still reads back the same answer.

```json
// data/example/mxt/element/fire.json
{
  "overcomes": [{ "elements": ["example:water"], "multiplier": 1.5 }],
  "adapted_to": [{ "elements": ["example:fire"], "multiplier": 0.5 }],
  "damage_types": ["minecraft:in_fire", "minecraft:on_fire", "minecraft:lava", "#example:fire_like"],
  "color": "#ff5522"
}
```

The damage condition `mxt:element` reads the **same** resolution (the type tables are on the [Damage Condition](/en/datapack/types/condition/damage_condition_types) page), so the element a condition names and the element the pipeline actually multiplies can never disagree.

### A Claimed Type Is a Group: Giving Each Type Its Own Buildup

An entry of `damage_types` may also be written as an object that gives that kind of hit its own `damage_attachment` — so "a lava bath builds up slower than a fireball" **needs no second element**:

```json
// data/example/mxt/element/fire.json
{
  "damage_types": [
    "minecraft:in_fire",
    "minecraft:on_fire",
    "#example:fire_like",
    { "damage_type": "minecraft:lava", "damage_attachment": 2.0 },
    { "damage_type": "minecraft:campfire", "damage_attachment": 0 }
  ],
  "damage_attachment": 4.0
}
```

- A bare string and a `#tag` mean "use the element's own number": above, `in_fire` / `on_fire` and everything the tag expands to all leave `4.0`.
- `damage_attachment` inside the object may be omitted (that equals the element's default), and an explicit `0` is a proper answer — "**this group leaves nothing at all**", so that type never builds up from a strike.
- Types and tags are accepted in both shapes, and when one element writes two entries for one type, the **first** one is the one that takes effect.
- The buildup amount is resolved **in the very same read that classifies the strike** (that read carries the element, the origin and the amount together), so it can never disagree with "what element this strike is".

### How an Element Accumulates on a Body: `attachment_decay` / `damage_attachment` and `element_reaction`

Two numbers describe how an element piles up on a body: `damage_attachment` is what one strike made of that element leaves on the target (default `0`, meaning nothing accumulates by default), and `attachment_decay` is how much comes off by itself each tick (default `0`, meaning nothing comes off by default). What happens once enough has built up is defined by [element_reaction](./element_reaction.md), so "an element is a relation" and "an element accumulates" are two things you can turn on separately. The entity action `mxt:attach_element` adds to or subtracts from one element's attachment directly, and the entity condition `mxt:element_attachment` reads the current amount. **`damage_attachment` is the default**: a type that should leave a different amount is written as an object with its own number (see "A Claimed Type Is a Group" above).

**Only a declared element accumulates.** A strike's element has two sources: its damage type was **claimed** by some element (an attack that writes `element` / `damage_type`, lava, an explosion, another mod's fireball all count), or nobody claimed it and it **fell back to the attacker's spirit roots**. Both take part in overcoming and adapting, but **only the first leaves `damage_attachment`** — the fire in a body only decides how hard that hit lands, it does not set anyone alight. An attack that should ignite or trigger a reaction therefore has to declare its own element. (This is what keeps "the element of a spirit root" and "the element of a weapon" apart: the root decides damage, the weapon decides attachment.)

**How much is left also depends on which artifacts the victim carries.** The amount is then multiplied by the `attachment_multiplier` the **artifacts the target carries** (both hands and the Curios slots) declare (multiplied together): `0.5` leaves only half, `0` leaves none, which is how "a treasure cancels part of an elemental reaction" is written — it presses down on the speed of the buildup, so the reaction arrives later or not at all; what the reaction itself does is not its business. Only artifacts have this field, see [artifact](./artifact.md).

### Conflicting With The Holder's Spirit Root: `conflict_multiplier`

`conflict_multiplier` (default `1.0`) is what an element is worth "**when I am wielded against my will**": if the holder of this element has it listed in the `conflicting_elements` of an active spirit root, the damage that holder deals is multiplied by this number. The number lives on the **element being held** rather than on the spirit root, the same element is multiplied only once no matter how many roots conflict with it, and it **does not require the strike to be made of that element** — fighting against your own weapon weakens whatever element you strike with. The item side is read the way [weapon_binding](./weapon_binding.md) describes "the element of an item" (the main-hand stack).
