---
title: Medicinal Property (medicinal_property)
description: A medicinal identity carrying a name and a description for one medicinal effect, with no reuse of element, aura or resource ids.
aside: false
---

# Medicinal Property (medicinal_property) {#medicinal_property}

A `medicinal_property` is the **identity of one medicinal effect**: it answers "which property is this", not "how strong is it". The definition holds a name and a description and nothing else — no number, no item binding, no element. Potency is written wherever the property is used.

The ids come from your content pack. Do not reuse the id of an [element](./element.md), an aura or a `resource`: each is its own identity, and nothing converts between a property and an element.

## File Location

Medicinal property files go in `data/<namespace>/mxt/medicinal_property/` within your data pack.

**Purpose**: Medicinal identities.

The filename corresponds to its ID. For example, `data/example/mxt/medicinal_property/blood_moving.json` has the ID `example:blood_moving`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `medicinal_property.mxt.<namespace>.<path>` | The property's display name. |
| `description` | Text Component | the same key plus `.description` | The property's description. |

Both fields may be omitted: omitting one uses the key generated from the entry id in the table above, writing one uses your own text (a bare string is a translation key, an object is a full component). So an empty object is enough in `data/example/mxt/medicinal_property/blood_moving.json`:

```json
{}
```

## Where It Is Used

| Where It Is Used | Field | Meaning |
| --- | --- | --- |
| Alchemy recipes (recipe type `mxt:alchemy`) | `main_requirements` / `auxiliary_requirements` | A map from properties to potency thresholds: which main and auxiliary properties this recipe asks for, and how much of each. |
| Spirit herbs (`spirit_herb`) | `main_effects` / `auxiliary_effects` | How much of that property each item contributes in the main or auxiliary role. |

One property can carry different thresholds in different recipes, and one herb can give different potency in its main and auxiliary roles: the property only says *which* effect it is, and every number lives at the place that references it. How recipes compare potency and how herbs declare it is on [alchemy_recipe](./alchemy_recipe.md) and [spirit_herb](./spirit_herb.md).
