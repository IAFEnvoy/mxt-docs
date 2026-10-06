---
title: Progression (progression)
description: "One level of a progression chain: the mastery it asks for and the damage multiplier it grants."
aside: false
---

# Progression (progression) {#progression}

File location: `data/<namespace>/mxt/progression/<path>.json`

A `progression` is one level of a progression chain. The chain has **no identity field**: it is the line its `next_level` links draw, so the level no other level points at is its entry. One chain can be shared by several owners - the owners are **techniques** ([technique](./technique.md)) and **creature profiles** ([creature_profile](./creature_profile.md)) - and each owner names the level it enters at with `default_level` in its own definition; the mastery a level asks for and the damage multiplier it grants are both written on the level itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `progression.mxt.<namespace>.<path>` | Display name; omitted, it is the default key in the previous column. |
| `description` | Text Component | `progression.mxt.<namespace>.<path>.description` | Description; omitted, it is the default key in the previous column. It is stored and read, but no screen draws it. |
| `next_level` | Next level ID | none | The next level on the chain; the highest level omits it. |
| `mastery` | `NumberProvider` | `0` | The mastery needed to reach this level. |
| `damage_multiplier` | Double | `1.0` | The damage multiplier this level grants. |

`mastery` belongs to the level rather than to an owner: everyone sharing a chain faces the same climb. It may be a formula, but a chain in which a level asks for less than the one before it is refused. Reaching a level takes both of two things: the owner's `mastery_resource` is at least this value, and the `condition` the owner configures for that level holds. Writing `0` means the level asks for no mastery.

Advancement needs nothing to drive it: every 20 ticks the main loop asks each loaded creature once about every owner it holds, and once both gates pass the holder walks up the chain (never skipping a level), after which what it grants is rebuilt and one `mxt:progression_level` signal is published (carrying `owner` and `level`). Techniques and spirit beasts go through that same check.

`damage_multiplier` must be a finite, non-negative number and is **the same for every owner**: casting an ability takes the multiplier of the level the holder currently stands on in a chain that grants it and writes that into the cast's formula context as the formula variable `damage_multiplier` (when several owners grant the same ability, the highest wins); the first layer of the damage pipeline reads and multiplies it when it settles the attacker's side. An ability triggered on a creature goes through the same cast path, so damage a spirit beast deals with an ability it was granted scales the same way. It therefore only scales **damage dealt by the abilities this chain grants** (an ability's backlash onto its own caster included), and it does not buff everything the holder deals; damage produced by non-cast paths such as curses, timelines or item bindings has no such value in its context and is untouched.

The shape is the same as `realm_stage`: a one-way `next` pointer drawing a chain. The difference is that the chain is derived from the links themselves rather than named by a separate field, so several owners can share one chain.

`next_level`, like `next_realm`, is only an entry reference, and the chain order is derived at runtime from the chain itself: when the server starts or a datapack is reloaded, the level no other level points at becomes the first level of its chain, and the rest are numbered along `next_level` (the first level is `0`), which is what lets any two levels be compared. A cycle or a `next_level` written as the successor in two places (a fork) makes the rebuild fail, and as with realm chains a failed rebuild refuses the chain rather than keeping one that is not fully ordered. **A pointer to an entry that does not exist never gets that far**: `next_level` is a registry reference, so naming a level the pack does not provide fails the whole data pack load rather than being refused at runtime. The rebuild also refuses a chain whose `mastery` decreases: advancement only ever compares against the next level, so a later level must not ask for less than the one before it. Parsing can only reject problems inside the entry itself, such as an illegal `damage_multiplier`.

After a pack changes an owner's entry level, a record the holder can no longer reach is dropped **when an entity joins the world**, when a player logs in and when the datapack is reloaded (a reload sweeps every loaded entity, since a creature has no login of its own), and the owner falls back to its own entry level; that check does not run on every read, and every dropped record logs a `WARN` naming the owner and the level.

**Reading the current level** uses the entity condition `mxt:progression` (see [Entity Condition Types](../types/condition/entity_condition_types.md)): `level` names one level, `comparison` takes `exact` (the default), `at_least` or `at_most` (the same set of values as `mxt:realm`, compared by the in-chain index), and the optional `owner` narrows the question to certain owners — it names owner definition IDs, one or an array, and leaving it out asks every kind of progression the body holds, one hit being enough. It reads **the level the holder has reached** (the owner's `default_level` while it never advanced), so an `at_least` that held once does not become false again through later changes; an owner without a `default_level`, or one whose chain order could not be rebuilt, always answers no.

```json
// data/example/mxt/progression/sword_art_1.json
{
  "next_level": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```
