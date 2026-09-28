---
title: Define Spirit Roots and Physiques
description: "Define spirit roots and physiques in JSON: elements and their shares, cultivation and affinity multipliers, granted abilities, holder conditions, exclusive tags, two damage multipliers, and the difference between held and in effect."
---

# Define Spirit Roots and Physiques

A **spirit root** (`spirit_root`) and a **physique** (`physique`) are two different things. A spirit root ties a body to one or more elements and hands out a cultivation multiplier, an element affinity multiplier, abilities and the elements it conflicts with; a physique hands out the half that has nothing to do with elements: vanilla attributes, abilities, exclusive tags and two damage multipliers. They are two registries (`mxt:spirit_root` and `mxt:physique`), with files at `data/<namespace>/mxt/spirit_root/<path>.json` and `data/<namespace>/mxt/physique/<path>.json`.

This tutorial writes one of each, and then spells out **held** versus **in effect**: the state a body carries is two separate records, and every effect reads only the one that is in effect.

## What You Are Building

| File | Registry | Purpose |
| --- | --- | --- |
| `data/example/mxt/spirit_root/fire_common_root.json` | `spirit_root` | A two-element root: fire at seven tenths and a common element at three tenths, with a cultivation multiplier, an affinity multiplier and one granted ability. |
| `data/example/mxt/physique/sword_bone.json` | `physique` | A physique granted only while a fire root is held: attributes, an ability, an exclusive tag and both damage multipliers. |

A spirit root can also be referred to by tags, with the tag file at `data/<namespace>/tags/mxt/spirit_root/<name>.json`. A physique has no tag path: its `exclusive_tags` are free identifiers written on the physique itself, not registry references.

## Step 1 — Spirit Roots: Elements and Shares

`data/example/mxt/spirit_root/fire_common_root.json`:

```json
{
  "elements": [
    {"element": "example:fire", "weight": 0.7},
    {"element": "example:common", "weight": 0.3}
  ],
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "rarity": "uncommon",
  "granted_abilities": ["example:spark"]
}
```

`elements` is the only required field, and it has to be a **non-empty array**. An entry is either a bare element id (which takes the root's whole share) or `{"element": <element id>, "weight": <share>}`. Elements point at the `mxt:element` registry, and a `#tag` works too. `weight` defaults to `1` and must be a finite positive number.

A share is not a multiplier, and it matters in one place only. Which elements an **in-effect** root holds is the union, and that **ignores the weights**: `example:fire_common_root` holds both fire and the common element, and `0.7` with `0.3` reads exactly like `1` with `1`. The weights only enter the weighted average of cultivation affinity and of the conflict penalty, normalised against their sum. The ability modifier counts a root once, and ignores the weights as well.

The remaining fields are optional:

| Field | Default | Effect |
| --- | --- | --- |
| `cultivation_multiplier` | `1` | Cultivation multiplier, a number or a formula string, finite and non-negative. |
| `element_ability_modifier` | `1` | Scales abilities whose element matches this root, a number or a formula string, finite and non-negative. |
| `rarity` | `common` | Free text, not a reference. The display looks for the `mxt.rarity.<value>` translation first and falls back to the raw text. |
| `granted_abilities` | `[]` | Array of ability ids or `#ability tags`. |
| `conflicting_elements` | `[]` | Array of element ids or `#element tags`; tested element by element, both ways, against the other roots **in effect**, and a conflict refuses the grant. |

`conflicting_elements` is tested against the record that is **in effect on the body**, so a root that has been switched off takes no part in it — which is what Step 3 comes back to.

## Step 2 — Physiques: Conditions, Attributes and Exclusion

`data/example/mxt/physique/sword_bone.json`:

```json
{
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
  "attribute_modifiers": [
    {"attribute": "minecraft:max_health", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value"}
  ],
  "granted_abilities": ["example:qi_recovery"],
  "exclusive_tags": ["example:body"],
  "allow_stacking": false,
  "rarity": "uncommon",
  "damage_dealt_multiplier": 1.2,
  "damage_taken_multiplier": 1.0
}
```

| Field | Default | Effect |
| --- | --- | --- |
| `attribute_modifiers` | `[]` | Array of vanilla attribute modifiers: `attribute` is required on every entry, plus `id` / `amount` / `operation`, and an optional `value` formula. |
| `granted_abilities` | `[]` | Array of ability ids or `#ability tags`. |
| `holder_condition` | `mxt:always` | An entity condition. **Checked once before granting and never again**: if it stops holding later, the physique that was already handed out stays. |
| `exclusive_tags` | `[]` | A free identifier array, not registry references. On a grant it is intersected with the same tags of the physiques **already held, switched-off ones included**; a non-empty result refuses the grant. |
| `allow_stacking` | `false` | While false, the same physique cannot be granted twice. |
| `rarity` | `common` | Free text, exactly as on a spirit root. |
| `damage_dealt_multiplier` | `1` | The damage multiplier on the **attacker's** side, a number or a formula string. |
| `damage_taken_multiplier` | `1` | The damage multiplier on the **target's** side, a number or a formula string. |

The example pack already ships `example:fire_root`, so `sword_bone` is only granted on a body that holds it; `holder_condition` may also write `mxt:has_physique` to chain a prerequisite physique.

How the two damage multipliers are read: several **in-effect** physiques **multiply**; one whose evaluation throws, or returns a non-finite or negative number, is skipped while the rest still count; `0` is a legal value (immunity, or hitting for nothing).

## Step 3 — Held and In Effect

A body carries two records: **held** (what it has been given) and **switched off** (temporarily disabled). They are read in different places.

- **Every effect reads only the "in effect" record**: elements, cultivation affinity, passive attributes and damage multipliers all look at that one.
- **Only "held" is read by**: the entity conditions `mxt:has_spirit_root` / `mxt:has_physique`, the matching loot conditions, the list commands, and the "has / list" calls in scripts.

So switching a spirit root off only disables it: it is still on the body, it can still be removed, and everything that reads only "held" still sees it.

::: warning The two registries disagree on what they test against

A spirit root's conflict test looks only at the roots **in effect**, a physique's exclusion test looks at **everything held** (switched-off ones included), and the switching entry point **does not re-test exclusion**. Following "switch A off → grant B → switch A back on" therefore leaves two roots in effect at once even though their `conflicting_elements` should keep them apart: with A off the test cannot see it and B goes through, and nothing checks again when A is switched back on.

Physiques do not have that seam: a switched-off physique still takes part in the exclusion test.

:::

## Step 4 — Three Entry Points

Granting, removing and switching are exactly three routes, and this module has **no player keybind and no screen**.

The commands all need administrator permission:

| Command | Effect |
| --- | --- |
| `/mxt spirit_root grant` / `remove` / `enable` / `disable` `<target>` `<root>` | Grant, remove, enable or disable one spirit root. |
| `/mxt physique grant` / `remove` / `enable` / `disable` `<target>` `<physique>` | The same on the physique side. |

The top-level aliases `/spirit_root` and `/physique` can be switched off in the server configuration, and the `/mxt` forms stay usable when they are.

Data pack actions: `mxt:grant_spirit_root` / `mxt:remove_spirit_root` read the `spirit_root` field, `mxt:grant_physique` / `mxt:remove_physique` read `physique`. **Those fields take a concrete id only, never a `#tag`**. Granting a physique evaluates `holder_condition` right there, and refuses the grant when it does not hold.

The script side is the two globals `MxtSpiritRoots` and `MxtPhysiques`, each with `grant` / `remove` / `setEnabled`; a grant or a switch answers with `changed` and `failure`, and a refusal puts its reason in `failure`.

## Step 5 — Names and Loading

`name` and `description` may both be omitted. When they are, the keys are generated as `spirit_root.mxt.<namespace>.<path>` and `physique.mxt.<namespace>.<path>`, with `.description` appended for the description, and a `/` in the path is kept as it is.

Like every other data pack registry, these two are read and validated while the **world loads**, so `/reload` does not re-read them: load the world again after an edit, or restart the server. A definition that fails to decode keeps the world from loading — it is not "one entry short and otherwise fine".

## Verify

```text
(load the world again)
/mxt registries list          → the entry count of each of the two tables
/mxt spirit_root list         → name, rarity, elements and whether each is in effect
/mxt physique list            → name, rarity and whether each is in effect
/mxt attachment status        → how many are held
```

- `/mxt registries validate` **does not check** these two tables. It covers realm chains, trigger rules, ability chains, quality ladders and artifact ownership, so do not use it as a validator for spirit roots or physiques; use `/mxt registries list` for the counts.
- `/mxt spirit_root list` and `/mxt physique list` read the records on the body, so a switched-off entry is still listed — the "in effect" column is what tells them apart.

Then walk it through in game:

1. `/mxt spirit_root grant @s example:fire_common_root` grants one to yourself. `list` then shows both elements it is bound to.
2. `/mxt physique grant @s example:sword_bone` grants the physique. Without `example:fire_root` on the body it is refused by `holder_condition`, and the reason is reported.
3. Switch the root you just got off: `list` still shows it but marks it as not in effect, and its elements, cultivation multiplier and ability all stop.
4. Remove it, and it is gone from `list`.

The test pack ships a probe, `/mxt_test identity`, which asserts held / in effect / switched off / removed, that rarity is treated as free text, that unknown fields are ignored and that a negative multiplier is refused.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The world will not load and a table is one entry short | `elements` is not an array, is missing, is empty, names an element that does not exist, carries a weight at or below `0`, or lists the same element twice — **the whole definition fails to decode**, and a broken definition blocks world loading. |
| A load-time "must be a finite non-negative number" | The value of `name` / `description` / a numeric multiplier field is illegal, for example a negative multiplier. |
| Element fields on a physique do nothing at all | A physique has only the keys in its field table. `element`, `cultivation_multiplier`, `damage_types` and the like are **silently ignored — no error, and almost nothing in the log**. A mistyped field name is never caught; that one entry simply has no effect. |
| One ability or element vanished from an array | A bad entry inside an array such as `granted_abilities` / `conflicting_elements` is dropped with one `Ignoring invalid list element` line and the rest of the file loads normally; a **single bad id** (not an array) fails the whole definition instead. |
| One action fails to parse | The `spirit_root` / `physique` field of the action names an id the current pack does not provide. After a definition is deleted, commands and scripts **can still remove it by the reference recorded on the body**, because the body stores the reference itself. |
| `/mxt registries validate` reports nothing | It does not check these two tables (it covers realm chains, trigger rules, ability chains, quality ladders and artifact ownership). |
| The file is there but the definition is not in game | An entry blocked by `neoforge:conditions` never enters the table, and the log holds only a DEBUG line. |
| A switched-off root seems to be "lost" | Switching off only disables it: it is still on the body, can still be removed, and is still listed by everything that reads only "held". |

## Next

- [Define Aura and Realms](./define-aura-and-realms.md) — the aura and the realm chain have to exist before a cultivation multiplier has anything to speed up.
- [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) — hang a spirit root or a physique off an item action and ship it as a pill.
- [Spirit Root](../datapack/json/spirit_root.md) and [Physique](../datapack/json/physique.md) — the full field lists and their edges.
