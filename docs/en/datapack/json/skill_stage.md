---
title: Skill Stage (skill_stage)
description: "Defines one level of a skill mastery chain: which skill it belongs to, the next level, and its damage multiplier."
---

# Skill Stage (skill_stage)

A `skill_stage` defines one level of a skill mastery chain — how well a holder has mastered a technique or another skill. It is written like [`realm_stage`](./realm_stage.md): the entry names the chain it belongs to and points at the next level, and a definition enters that chain through the level it declares as its default.

## File Location

Skill stage files go in `data/<namespace>/mxt/skill_stage/` within your datapack.

**Purpose**: One level of a skill mastery chain.

The filename corresponds to its ID. For example, `data/example/mxt/skill_stage/sword_art_1.json` has the ID `example:sword_art_1`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `skill` | `Identifier` | **required** | The mastery chain this level belongs to. Every level of one chain writes the same `skill`; several techniques may share a single chain. |
| `next_stage` | `Holder<skill_stage>` | none | The next level of the chain; the highest level omits it. |
| `mastery` | `NumberProvider` | `0` | How much mastery reaching this level takes. A technique whose `mastery_resource` holds at least this much may advance here, once its own `condition` also holds. `0` means the level asks for no mastery. |
| `damage_multiplier` | Double | `1.0` | The damage multiplier of this level. It must be a finite, non-negative number. |

`mastery` belongs to the level, not to a technique: a chain measures the same climb for everyone who shares it. It is a `NumberProvider`, so it may be a formula, but a decreasing requirement anywhere in a chain is rejected.

::: info Where `damage_multiplier` is read
Casting an ability puts the multiplier of the level the caster stands on, in a chain whose `configuration` grants that ability, onto the cast's formula context as `damage_multiplier`; the [damage system](../../technical/damage.md) then multiplies the damage that cast deals by it. When several techniques grant the same ability, the highest of their levels speaks — they do not stack. The multiplier therefore belongs to the abilities a chain grants rather than to everything the holder does, and it applies to damage such a cast deals to its own caster as well (a stronger technique has a heavier backlash). A chain that grants nothing has nothing to scale.
:::

## Example

```json
// data/example/mxt/skill_stage/sword_art_1.json
{
  "skill": "example:sword_art",
  "next_stage": "example:sword_art_2",
  "mastery": 0,
  "damage_multiplier": 1.1
}
```

```json
// data/example/mxt/skill_stage/sword_art_2.json
{
  "skill": "example:sword_art",
  "mastery": 10,
  "damage_multiplier": 1.25
}
```

::: info Skill chains
`skill` is the chain identity rather than a reference to one owner, so several techniques — or a technique and another system — can share one mastery chain instead of each defining its own. Which level a chain is entered at is decided by the definition that references it: a technique names its entry level in `default_stage` and annotates each level through `configuration`, whose `ability` entries are minimum requirements and whose `condition` is the requirement to reach that level.
:::

::: info Chain order
`next_stage`, like `next_realm`, is only a holder reference, so the order is derived at runtime rather than while an entry is decoded: when the server starts or a datapack is reloaded, the level no other level follows becomes the first level of its chain and the rest are numbered down the links, which is what lets two levels be compared. A skill with more than one first level, a link to a level of another `skill`, a cycle, or a link to a stage that does not exist makes that rebuild fail — as with realm chains, a partially ordered chain is rejected rather than indexed. The rebuild also rejects a chain whose `mastery` drops from one level to the next: a level must never be harder to leave than to reach the one after it, because advancement only ever compares against the next level. Parsing can only reject problems inside the entry itself, such as a non-finite or negative `damage_multiplier`.
:::

::: info Who advances a level
Reaching a level is driven by the technique that owns the climb, not by the chain: a technique with a `mastery_resource` advances its holder to the next level once that resource reaches the level's `mastery` and the level's `condition` holds. An advanced level publishes `mxt:technique_stage`, and the abilities of every level reached so far are granted. See [Cultivation Technique](./technique.md#advancement).
:::

