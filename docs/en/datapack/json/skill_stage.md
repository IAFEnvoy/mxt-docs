---
title: Skill Stage (skill_stage)
description: "One level of a skill mastery chain: its chain identity, next level, mastery requirement and damage multiplier."
aside: false
---

# Skill Stage (skill_stage) {#skill_stage}

File location: `data/<namespace>/mxt/skill_stage/<path>.json`

A `skill_stage` is one level of a skill mastery chain. The chain identity is a free identifier (the `skill` field) rather than a registry entry, so several techniques can share one chain; which level a chain is entered at is decided by the definition that references it, and a technique uses `default_stage`. The mastery requirement and the damage multiplier of a level are both written on the level itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `skill_stage.mxt.<namespace>.<path>` | Display name; omitted, it is the default key in the previous column. |
| `description` | Text Component | `skill_stage.mxt.<namespace>.<path>.description` | Description; omitted, it is the default key in the previous column. It is stored and read, but no screen draws it. |
| `skill` | Identifier | **required** | Identifier of the skill chain this level belongs to. |
| `next_stage` | Next level ID | none | The next level on the chain; the highest level omits it. |
| `mastery` | `NumberProvider` | `0` | The mastery needed to reach this level. |
| `damage_multiplier` | Double | `1.0` | The damage multiplier of this level. |

Every level of one chain writes the same `skill`.

`mastery` belongs to the level rather than to a technique: everyone sharing a chain faces the same climb. It may be a formula, but a chain in which a level asks for less than the one before it is refused. Reaching a level takes both of two things: the technique's `mastery_resource` is at least this value, and the `condition` the technique configures for that level holds. Writing `0` means the level asks for no mastery.

`damage_multiplier` must be a finite, non-negative number. Casting an ability takes the multiplier of the level the caster currently stands on in a chain that grants it and writes that into the cast's formula context as the formula variable `damage_multiplier` (when several techniques grant the same ability, the highest wins); the first layer of the damage pipeline reads and multiplies it when it settles the attacker's side. It therefore only scales **damage dealt by the abilities this chain grants** (an ability's backlash onto its own caster included), and it does not buff everything the holder deals; damage produced by non-cast paths such as curses, timelines or item bindings has no such value in its context and is untouched.

The shape is the same as `realm_stage`: a chain identity plus a one-way `next` pointer. The difference is that the chain identity is a free identifier rather than a registry entry, so several techniques can share one chain.

`next_stage`, like `next_realm`, is only an entry reference, and the chain order is derived at runtime from the chain itself: when the server starts or a datapack is reloaded, the level no other level points at becomes the first level of its chain, and the rest are numbered along `next_stage` (the first level is `0`), which is what lets any two levels be compared. Several first levels under one `skill`, a `next_stage` pointing at a level of another `skill`, a cycle, or a pointer to an entry that does not exist — any of these makes the rebuild fail, and as with realm chains a failed rebuild refuses the chain rather than keeping one that is not fully ordered. The rebuild also refuses a chain whose `mastery` decreases: advancement only ever compares against the next level, so a later level must not ask for less than the one before it. Parsing can only reject problems inside the entry itself, such as an illegal `damage_multiplier`.

**Reading the current level** uses the entity condition `mxt:skill_stage` (see [Entity Condition Types](../types/condition/entity_condition_types.md)): `stage` names one level, `comparison` takes `exact` (the default), `at_least` or `at_most` (the same set of values as `mxt:realm`, compared by the in-chain index), and the optional `technique` narrows the question to one technique — leave it out and every learned technique is asked, one hit being enough. It reads **the level the holder has reached** (the technique's `default_stage` while it never advanced), so an `at_least` that held once does not become false again through later changes; a technique without a `default_stage`, or one whose chain order could not be rebuilt, always answers no.

```json
// data/example/mxt/skill_stage/sword_art_1.json
{
  "skill": "example:sword_art",
  "next_stage": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```
