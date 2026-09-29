---
title: Technique (technique)
description: "Defines a learnable cultivation technique: its grade, learning condition, cultivation multiplier, the levels of the progression chain it enters, and the passive attributes and abilities it grants."
aside: false
---

# Technique (technique) {#technique}

File location: `data/<namespace>/mxt/technique/<path>.json`

A technique is something that can be learned. Once learned it stays in effect: `granted_abilities` hands out abilities right away and `passive_modifiers` keeps feeding attributes, while the climbing part runs on a ledger of its own — a technique points at the entry of a progression chain, the holder advances along that chain level by level, and every level unlocks its own abilities. All learned techniques are active at the same time.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `technique.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `technique.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is only stored and read, nothing draws it yet. |
| `quality` | Quality ID | none | This technique's own grade, one [quality](./quality.md) entry. |
| `icon` | Icon reference | none | The icon the technique shows in interfaces such as the technique panel. |
| `learn_condition` | `EntityCondition` | `mxt:always` | Learning condition. |
| `exclusive_tags` | Identifier array | `[]` | Mutual exclusion tags for this technique. |
| `cultivation_modifier` | `NumberProvider` | `1` | Cultivation multiplier. |
| `passive_modifiers` | Array of attribute modifier entries | `[]` | Passive attributes. |
| `granted_abilities` | Array of ability IDs or `#tags` | `[]` | Abilities granted on learning; always active. |
| `default_level` | Progression level ID | none | The entry level of this technique's progression chain. |
| `mastery_resource` | Value ID | none | The stored value that measures this technique's mastery. |
| `configuration` | Map of progression level ID to entry object | `{}` | This technique's own annotation of each level on the shared chain; entry fields are in the table below. |

Each `configuration` entry describes one level:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **required** | The condition for **reaching** that level. Write `mxt:always` when a level needs nothing; an array means all of them have to hold. |
| `ability` | Ability ID, `#tag`, or an array of either | `[]` | The abilities that level grants. They are a **minimum**: they stay active on later levels, so abilities accumulate. One ability, a `#` tag, or an array of either. |
| `action` | `EntityAction` | `mxt:no_op` | The action run once **on entering** that level. |

These three fields are shared by techniques and creature profiles; there is no entry field only a spirit beast has. `action` runs once on entering that level: a natural promotion and an administrative level write both count as entering, and it runs **first** while the `mxt:progression_level` signal is published **after**, so whatever reacts sees a body that has already changed; an array of actions runs in order.

`quality` does two jobs: a technique panel row starts with "technique name + level", the name is tinted with the grade's `color`, and the row tooltip's "Grade" line reads its name and colour; it is also the **default tier of the technique's carrier item**, and a `mxt:quality` component on the stack wins over it. Omit `quality` and no grade is shown and the carrier gets no default tier.

`passive_modifiers` uses vanilla AttributeModifiers; `value` is an optional dynamic formula.

A technique that defines no mastery may omit `default_level`.

Without `mastery_resource` a technique never advances.

The levels themselves belong to the chain, so one chain can be shared by several techniques while each technique decides what its levels grant and what they ask for. The entry level (`default_level`) is where a holder starts, so it **needs** no entry; write one anyway and its `ability` still counts at that level while its `condition` is only decoded and never gates anything, because nothing ever advances *into* the entry level. Every level after the entry level **must** be configured, and a configured level the technique can never reach from its `default_level` is rejected while the chain is rebuilt — a chain cannot be climbed through a step that nothing describes.

`granted_abilities` and `configuration` are independent: the first list is active as soon as the technique is learned, the second accumulates as the holder's level advances. `configuration` needs `default_level` to name the chain it belongs to, so writing it without `default_level` errors while the datapack is parsed; a missing intermediate level or an unreachable key is rejected while the chain is rebuilt.

Advancement is driven by data rather than by the technique file alone: `mastery_resource` decides **what** measures mastery, the level's own `mastery` decides **how much** is needed, the level's `condition` decides **what else** has to hold, and whatever content lives outside the technique decides how the value grows (a trigger rule, a cultivation profile, or a script).

A learned technique advances level by level on the server's periodic check, at most one level per check, and only while all of these hold:

- `mastery_resource` is set;
- the holder's stored value for that resource is at least the next level's `mastery`;
- the next level's `condition` passes.

Advancing recalculates ability grants from the new level: `granted_abilities` plus the `ability` of every level reached so far, since `ability` is a minimum requirement. Advancing publishes the `mxt:progression_level` signal for other content to react to — it carries the rank just reached as the formula variable `level`, plus `owner` as an extension value. Because the levels live on the chain and the mastery value lives on a resource, a content pack decides for itself how mastery grows:

```json
// data/example/mxt/trigger/mastery_from_combat.json
{
  "trigger": { "type": "mxt:kill" },
  "action": { "type": "mxt:add_resource", "resource": "example:sword_mastery", "amount": 1 }
}
```

A technique with `configuration` but no `mastery_resource` never advances on its own; the other way round, `mastery_resource` without `default_level` is rejected while parsing, because there would be no chain to climb.

**Reading technique state.** The entity condition `mxt:technique` asks which techniques a body has **learned**: `techniques` takes an entry, a `#` tag or an array, an empty list meaning "learned any technique at all", and `match` is `any` (the default, where one hit is enough) or `all` (every written entry has to hold, and an empty list is rejected at load time rather than quietly turning into "always true"); `mxt:progression` then asks how far they have climbed. What it reads is **learned**, not "currently active" — techniques have no on/off switch, spirit roots and physiques do; to say "no technique", wrap one in `mxt:not`. A loot table uses the same `mxt:technique` name with an extra `entity` target field and the same shape otherwise (see [Loot and Advancement Criteria](../loot-and-criteria.md)). It asks the grant ledger a body carries, so a technique the current pack no longer provides still answers. See [Entity Condition Types](../types/condition/entity_condition_types.md) for the field details.

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_guard"],
  "default_level": "example:azure_breath_1",
  "configuration": {
    "example:azure_breath_1": {
      "condition": { "type": "mxt:has_realm", "aura": "example:qi" },
      "ability": "example:azure_bolt"
    },
    "example:azure_breath_2": {
      "condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
      "ability": ["example:azure_bolt", "#example:azure_mastery"]
    },
    "example:azure_breath_3": {
      "condition": [
        { "type": "mxt:realm", "realm": "example:core_formation", "comparison": "at_least" },
        { "type": "mxt:health", "comparison": ">=", "compare_to": 20 }
      ]
    }
  }
}
```
