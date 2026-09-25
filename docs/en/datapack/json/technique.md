---
title: Technique (technique)
description: Defines a cultivation technique that modifies cultivation speed and grants passive attributes and abilities.
aside: false
---

# Technique (technique)

A `technique` defines a learnable cultivation technique: its grade, learning condition, cultivation multiplier, passive attributes and granted abilities.

## File Location

Cultivation technique files go in `data/<namespace>/mxt/technique/` within your datapack. The registry is `mxt:technique`; earlier versions called it `cultivation_technique`.

**Purpose**: Cultivation technique definitions: learnable, granting abilities and cultivation modifiers by level.

The filename corresponds to its ID. For example, `data/example/mxt/technique/vital_breath.json` has the ID `example:vital_breath`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `technique.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `technique.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `quality` | `Holder<quality>` | none | The technique's own **grade**, as one [quality](./quality.md) entry. It does two jobs: the technique panel reads it — a row starts with "technique name + level", the name is tinted with the grade's `color`, and the row tooltip's "Grade" line reads its name and colour — and it is the **default tier of the technique's carrier item** (an `mxt:item_quality` override component on the stack wins). Omitted, no grade is shown and the carrier gets no default tier. |
| `learn_condition` | `EntityCondition` | `mxt:always_true` | Learning condition. |
| `exclusive_tags` | `Identifier[]` | `[]` | Mutual exclusion tags of the technique. |
| `cultivation_modifier` | `NumberProvider` | `1` | Cultivation multiplier. |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | Passive attributes; uses vanilla `AttributeModifier`s, `value` is an optional dynamic formula. |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | Abilities granted after learning; always active. |
| `default_stage` | `Holder<skill_stage>` | none | The entry level of this technique's mastery chain; a technique that defines no mastery omits it. |
| `mastery_resource` | `Holder<resource>` | none | The stored value that measures this technique's mastery. With it, the technique advances on its own as that value grows; without it, the technique never advances. |
| `configuration` | `Map<Holder<skill_stage>, StageConfiguration>` | `{}` | What each level of the shared chain means to this technique. See the entry fields below. |

A `configuration` entry is this technique's own annotation of one level of the chain:

| Entry field | Type | Default | Description |
|-------|------|---------|-------------|
| `condition` | `EntityCondition` | **required** | The requirement to **reach** that level. A level that needs nothing writes `mxt:always_true`; an array requires all of them. |
| `ability` | `HolderOrTag<ability> or array` | `[]` | The abilities that level grants. They are a **minimum** requirement: they stay active on later levels, so levels add to each other instead of replacing each other. One ability, a `#` tag, or an array of either. |

The levels themselves belong to the chain, so one chain can be shared by several techniques while each technique decides what the levels grant and what they cost. The entry level is where a holder starts, so it needs no entry at all; if one is written anyway, its `ability` still counts at that level while its `condition` is decoded but never gates anything, because nothing advances *into* the entry level. Every level after the entry level **must** be configured, and a configured level the technique can never reach from its `default_stage` is rejected - a chain cannot be climbed through a level that nothing describes.

`granted_abilities` and `configuration` are independent: the first list is active as soon as the technique is learned, the second grows as the holder's level in the chain advances. `configuration` needs `default_stage` to name the chain it belongs to, so writing it without `default_stage` is rejected while the datapack loads; an unconfigured step or an unreachable key is rejected when the server cache is built.

## Advancement

Advancement is driven by data, not by the technique file alone. `mastery_resource` says *what* measures mastery; the level's own `mastery` (see [`skill_stage`](./skill_stage.md)) says *how much* is needed; the level's `condition` says what else must hold; and something outside the technique decides how the value grows.

A learned technique advances one level at a time, at most once per level per check, while all of these hold:

- `mastery_resource` is set,
- the holder's stored value for that resource is at least the next level's `mastery`, and
- the next level's `condition` passes.

Abilities are then recalculated from the new level: `granted_abilities` plus every `ability` of the levels reached so far, since `ability` is a minimum requirement. Advancing publishes [`mxt:technique_stage`](./trigger.md) so other content can react. Because the levels live on the chain and the mastery value lives on a resource, a content pack can grow mastery however it likes — a [trigger rule](./trigger.md) that adds to the resource, an [aura definition](./aura.md), or a script:

```json
// data/example/mxt/trigger/mastery_from_combat.json
{
  "trigger": {"type": "mxt:kill"},
  "action": {"type": "mxt:add_resource", "resource": "example:sword_mastery", "amount": 1}
}
```

A technique with `configuration` but no `mastery_resource` never advances on its own; `mastery_resource` without `default_stage` is rejected, because there would be no chain to climb.

::: info Multiple Techniques
Every learned cultivation technique is active at the same time.
:::

## Example

```json
{
  "quality": "example:earth",
  "learn_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "exclusive_tags": ["example:fire_technique"],
  "cultivation_modifier": 1.5,
  "passive_modifiers": [
    {"attribute": "minecraft:max_health", "id": "example:technique/vital_breath", "amount": 2, "operation": "add_value"}
  ],
  "granted_abilities": ["example:vital_breath_active"],
  "default_stage": "example:vital_breath_1",
  "configuration": {
    "example:vital_breath_1": {
      "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
      "ability": "example:vital_breath_bolt"
    },
    "example:vital_breath_2": {
      "condition": {"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"},
      "ability": ["example:vital_breath_bolt", "#example:vital_breath_mastery"]
    },
    "example:vital_breath_3": {
      "condition": [
        {"type": "mxt:realm", "realm": "example:core_formation", "comparison": "at_least"},
        {"type": "mxt:health", "comparison": ">=", "compare_to": 20}
      ]
    }
  }
}
```

