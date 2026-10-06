---
title: Spirit Root (spirit_root)
description: "Defines a spirit root: the elements it binds and their shares, the cultivation multiplier, the element affinity multiplier and its conflicting elements."
aside: false
---

# Spirit Root (spirit_root) {#spirit_root}

File location: `data/<namespace>/mxt/spirit_root/<path>.json`

A spirit root ties a body to one or more elements. It hands out a cultivation multiplier, an element affinity multiplier and abilities, and it declares which elements may not share the body with it. True root, false root and waste root play is nothing more than "write a few elements and their shares".

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `spirit_root.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `spirit_root.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is stored and read, but no screen draws it. |
| `elements` | Element and weight array | **required and non-empty** | The elements this root is bound to; several may be written. |
| `cultivation_multiplier` | `NumberProvider` | `1` | Cultivation multiplier. |
| `element_ability_modifier` | `NumberProvider` | `1` | Element affinity ability multiplier. |
| `quality` | Quality id | none | Optional. This root's own grade: the spirit-root stone carrying this definition reads at it, and it is also the tier named beside the root in the info panel and `/mxt spirit_root list`. |
| `granted_abilities` | Array of ability ids or `#tags` | `[]` | Granted abilities. |
| `conflicting_elements` | Array of element ids or `#tags` | `[]` | The elements it **cannot share a body with**. |

An entry of `elements` may be a bare element id (which takes the whole share of that root), or `{"element": "…", "weight": 0.7}`. `weight` is a share, not a multiplier: it is normalised against the sum when read, so `[1, 1]` and `[0.5, 0.5]` mean the same thing and the number on a single-element root changes nothing. `weight` defaults to `1` and must be finite and positive. An empty array, or the same element written twice, is a load error.

`cultivation_multiplier` and `element_ability_modifier` are both validated as finite and non-negative at load time when they are written as numbers.

How `element_ability_modifier` is measured: when an ability whose `element_affinity` names **any** element of this root is cast, it is a factor of layer one of [damage settlement](/en/technical/damage) (**one root contributes once**, however many of its elements matched; several matching roots are averaged or best-picked by `element_affinity_mode`), and formulas can read it as `element_modifier` too. It and the element relations are two independent paths: the relations (`overcomes` / `adapted_to`) say who overcomes whom, and both sides' spirit roots take part in that; this multiplier says what this body is worth when it casts the element it is attuned to, and it is decided only by the casting side and by **this one cast**. So the same fire technique lands different numbers off a fire root at 1.1 and one at 1.3, while the half that sits on the opponent is decided by the opponent's element alone.

`quality` names a tier in `mxt:quality` and may be left out. The info panel's spirit root row reads "definition name · quality name" in its tooltip, and with no `quality` that part is left out entirely (it never shows `-`); `/mxt spirit_root list` shows `-` when there is no tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) registry.

Spirit root grouping, compatibility and filtering use vanilla tags (`data/<namespace>/tags/mxt/spirit_root/<name>.json`). The `spirit_root` field of both the entity condition and the loot condition takes an entry, a tag or an array of them, so "any fire spirit root" is one tag.

`conflicting_elements` and the element relations are two different things: two opposed elements can still be held at once, and whether that is forbidden is up to this field; granting a further root that lists an element of a held one (or the other way round) is rejected, **either side matching is enough**, and a switched-off root takes no part in that check. It is also read once in damage settlement: when an element of the attacker's main-hand item is listed as conflicting by an active root, that element's `conflict_multiplier` multiplies everything the attacker deals — once per element in hand, and several conflicting roots at the same time still do not multiply it twice. See [element](./element.md), "Conflicting With The Holder's Spirit Root".

**How a root bound to several elements is read** (the place content writers guess wrong, so it is spelled out one by one): (1) **which elements are held** is the union and **has nothing to do with the weights** — `mxt:has_element`, loot conditions, element relations and "what element is this strike" all read that set; (2) **cultivation affinity** is the **weighted average** (`1 + Σ(weight × that element's concentration) / Σweight`), so the larger share is the one that pays; (3) **the element conflict penalty** is the same weighted average, multiplied by `aura_zone.element_conflict_penalty`, so a mostly-fire dual root is punished harder in water than a mostly-water one, and both less than a pure fire root; (4) **the ability modifier** is counted once and **ignores the weights** (see the table above); (5) **exclusion** is decided over the element sets, both ways, and **ignores the weights**. `aura_zone.element_fit_bonus` only asks whether any of its own auras is present here, so it ignores the weights too.

```json
{
  "elements": [
    { "element": "example:fire", "weight": 0.7 },
    { "element": "example:water", "weight": 0.3 }
  ],
  "cultivation_multiplier": 1.25
}
```

## Holding and Switching Off {#holding}

Granting and removing both go through entity actions: `mxt:grant_spirit_root` and `mxt:remove_spirit_root` (the physique side is `mxt:grant_physique` and `mxt:remove_physique`).

The mod also ships a **spirit root item**, `mxt:spirit_root`: the `mxt:spirit_root` component on the stack names the root it grants, and right-clicking grants it — through the same decision the action and the command use, so "already held" and "element conflict" are refused as usual. A successful grant spends one item and **creative mode spends none**; a refused use keeps the item in hand and says why, and a bare item with no component only reports that it names no root. Hand one out with `/give @s mxt:spirit_root[mxt:spirit_root="example:fire_root"]`, or use `/picker mxt:spirit_root`, where every spirit root definition gets a row of this item **already carrying the component**. This is the item's use path; it is a different thing from the switching below.

Every spirit root and physique a body already holds can be **switched off** on its own without being lost: once it is off, its elements, cultivation multiplier, granted abilities, passive attributes, damage multipliers and the `conflicting_elements` it declares all stop applying, yet it is still "held" (`mxt:has_spirit_root` / `mxt:has_physique` still answer true, and it can still be removed normally). That state is the `disabled_spirit_roots` / `disabled_physiques` in the `spirit_identity` attachment, and it is saved and synchronised along with the entity.

This module has **no player-facing entry point** (no keybind and no screen): the operation is the script-side `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`, or the administrator command `/mxt spirit_root enable|disable` / `/mxt physique enable|disable`, and how it is wired up is still left to content packs or modpacks. That is a different question from taking the definition out of the data pack: the switch only governs the one entry that was switched off, and that entry is still held, while removing a definition means the whole definition is gone (write `neoforge:conditions`, see [Disabling a Definition](../overview.md#disabling-a-definition)).
