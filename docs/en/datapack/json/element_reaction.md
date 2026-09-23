---
title: Element Reaction (element_reaction)
description: "Defines what happens once enough of an element has accumulated on a body: the demand, what it consumes, and the action it runs."
aside: false
---

# Element Reaction (element_reaction)

An `element_reaction` is what happens once enough of an element has built up on a body. The accumulation itself is [Element](./element.md) data — how much a strike of that element leaves behind and how fast it wears off — while the demand and the answer live here, so a pack can add a reaction without touching an element and can write a two-element one by listing two.

## File Location

Element reaction files go in `data/<namespace>/mxt/element_reaction/` within your datapack.

**Purpose**: What happens when element accumulation on a body reaches its demand.

The filename corresponds to its ID. For example, `data/example/mxt/element_reaction/fire_burst.json` has the ID `example:fire_burst`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `amounts` | `Map<Holder<element>, NumberProvider>` | **required** | How much of each listed element has to be accumulated; every entry has to be met. Must not be empty. |
| `consume` | `Map<Holder<element>, NumberProvider>` | same as `amounts` | What the reaction takes away when it fires. **Omitting** the field takes the same amounts as the demand, while an explicit empty object `{}` takes nothing at all — a reaction that keeps the buildup it answered. Every key written here must also appear in `amounts`. |
| `condition` | `EntityCondition` | `mxt:always_true` | An extra condition, for situational reactions such as "only while it is raining" or "only while standing in water". |
| `action` | `EntityAction` | none | Run on the body that accumulated the reaction, when it fires. |
| `priority` | Int | `0` | Higher is tried first; equal priorities are broken by registry id. |

A reaction is a demand rather than an amount: once the accumulation is enough, the pipeline takes the **first** definition, in `priority` order, whose every listed element has reached its number and whose `condition` passes, runs its `action`, subtracts its `consume`, and then **keeps looking** — so one reaction can set off another. The chain is capped at **8 reactions per application**, because a reaction that consumes an element and applies it again is a legal and useful thing to write. The cap covers the **whole chain** rather than one pass of it: when a reaction's action applies an element again (or deals typed damage that builds attachment up on the body it hits), that application does not open a second chain — the amount simply lands, and the chain already running reads it on its next pass. "It keeps burning until something puts it out" is therefore writable and still terminates. Natural decay never triggers a reaction: decay can only lower a total, so a demand that was unmet stays unmet.

```json
// data/example/mxt/element_reaction/fire_burst.json
{
  "amounts": { "example:fire": 8 },
  "action": { "type": "mxt:damage", "amount": "4 + 2 * realm_rank" },
  "priority": 10
}
```

## Where the Accumulation Lives

The amount itself lives in the `mxt:element_attachment` entity attachment: it is keyed per element, is saved and synchronised with the entity, and drops a key as soon as it reaches zero. Two things feed it — `element.damage_attachment` on a hit made of that element, and the entity action `mxt:attach_element` for every other source (a lava bath, a pill, a curse) — and it is worn off by each element's own `element.attachment_decay` every tick. Cleaning is the same action with a negative amount. The entity condition `mxt:element_attachment` reads the current amount with the same `{min?, max}` window shape, so a pack can write "the more it builds, the worse it gets" without any reaction firing.

Accumulation and reactions are entirely content-driven: a reaction has no event callback of its own (write an action to observe it), and the mod provides **no player-facing entry point** — no command, keybind or screen adds accumulation or fires a reaction by hand.

The element a strike is made of, and the `damage_types` an element claims, are documented in [Element](./element.md). The action that feeds accumulation is listed with the other [entity action types](../types/action/entity_action_types.md), and the read-only condition with the [entity condition types](../types/condition/entity_condition_types.md).
