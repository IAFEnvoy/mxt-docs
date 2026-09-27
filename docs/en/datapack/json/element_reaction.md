---
title: Element Reaction (element_reaction)
description: "The reaction that fires once element attachment has met its demand: how much it asks for, how much it consumes, and the action it runs."
aside: false
---

# Element Reaction (element_reaction) {#element_reaction}

An element reaction declares what happens once some element has accumulated enough on a body. How much has accumulated lives in the entity attachment `mxt:element_attachment`: [element](./element.md)'s `damage_attachment` and the entity action `mxt:attach_element` add to it, the element's own `attachment_decay` takes away from it. This definition only covers the moment after the demand has been met.

## File Location

Element reaction files go in `data/<namespace>/mxt/element_reaction/` within your data pack.

**Purpose**: triggering a reaction once element attachment reaches its demand.

The filename is its ID. For example, `data/example/mxt/element_reaction/fire_burst.json` has the ID `example:fire_burst`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `amounts` | map of element id to `NumberProvider` | **required** | How much each listed element has to accumulate for the reaction to hold. Every entry written has to be met at once; an empty map is rejected at load time. |
| `consume` | map of element id to `NumberProvider` | same as `amounts` | How much is taken away when it fires. **Omitting** the field takes away the same amounts as the demand, while an explicit empty object `{}` takes nothing at all — a reaction that answers without settling the bill. Write only some of the keys and only those elements are consumed, every other element keeps its accumulation as it is. A key written here must also appear in `amounts`; naming an element nothing demanded is a load error. |
| `condition` | `EntityCondition` | `mxt:always` | Extra condition, for situational limits such as "only blows up while it rains" or "only reacts while standing in water". |
| `action` | `EntityAction` | none | The action run on the **holder itself** when it fires. |
| `priority` | Int | `0` | Higher is tried first; equal values are ordered by registry id. |

`amounts` is a **demand**, not a quantity. A reaction is "once there is enough, answer": the element builds up, the pipeline walks the definitions in priority order, takes the **first** one whose every demand is met and whose `condition` passes, runs its `action`, subtracts its `consume`, and then **keeps looking** — so one reaction can lead to another.

The chain is capped at `8` reactions per application, because "consume yourself and apply yourself again" is a legal thing to write. The cap is on the **whole chain**, not one per level: when a reaction's action applies the element again (or deals typed damage that builds attachment up where it lands), that application does not open a second chain — it just adds the amount, which the chain already running reads and settles on its next pass. "Fire that keeps burning until somebody puts it out" is therefore writable, and it still cannot feed itself forever. Natural decay never triggers a reaction: decay only lowers a total, and a demand that was out of reach stays out of reach.

```json
// data/example/mxt/element_reaction/fire_burst.json
{
  "amounts": { "example:fire": 8 },
  "action": { "type": "mxt:damage", "amount": "4 + 2 * realm_rank" },
  "priority": 10
}
```

## Where the Accumulation Lives

The amount itself lives in the entity attachment `mxt:element_attachment`: keyed per element, saved and synchronised with the entity, and dropped as soon as it reaches zero. That keeps "how much has built up" and "what happens once enough has built up" as two separate things. Two routes add to it — `element.damage_attachment` when the body is hit, and the entity action `mxt:attach_element` for everything else (sitting in lava, taking a pill, a curse). Clearing it uses the same action with a negative number, or lets the element's own `attachment_decay` subtract every tick. The entity condition `mxt:element_attachment` reads the current amount on its own, with the same `{min?, max}` window, so "the more it has built up, the worse it gets" needs no reaction to fire at all; an empty map there is rejected at load time rather than read as "always true".

Reactions have **no event callback of their own** — to observe one, write an action. There is no player-facing entry point either: accumulation and reactions are driven entirely by content (damage type claiming and actions), and the mod provides no command, keybind or screen to add accumulation or fire a reaction by hand. The element side — `damage_types`, `damage_attachment` and `attachment_decay` — is on [element](./element.md).
