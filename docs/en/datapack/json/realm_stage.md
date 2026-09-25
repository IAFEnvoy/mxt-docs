---
title: Realm Stage (realm_stage)
description: Defines one stage of a linear realm chain, including its breakthrough requirements and passive attributes.
aside: false
---

# Realm Stage (realm_stage)

A `realm_stage` defines one stage of a linear realm chain: which aura it belongs to, what it costs to break through to the next stage, and which passive modifiers it grants.

## File Location

Realm stage files go in `data/<namespace>/mxt/realm_stage/` within your datapack.

**Purpose**: Linear realm chains and breakthrough.

The filename corresponds to its ID. For example, `data/example/mxt/realm_stage/foundation.json` has the ID `example:foundation`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `realm_stage.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `realm_stage.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `aura` | `Holder<aura>` | **required** | The aura chain this stage belongs to. A stage only ever names one aura, and the aura is what names the stored value, so the chain is never keyed by the value itself. |
| `aura_share_weight` | `NumberProvider` | `1` | Weight used when sharing aura in the same chunk while `aura_zone.distribution` is `realm_weighted`. |
| `cultivate_condition` | `EntityCondition` | `mxt:always_true` | Environment conditions that allow cultivation at this realm; for example `mxt:aura_range` can require a minimum concentration. |
| `next_realm` | `Holder<realm_stage>` | none | The next realm of the linear chain; at most one. |
| `breakthrough_exp` | `NumberProvider` | `0` | The minimum cultivation progress count needed to break through from the current realm to the next one. |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | The maximum cultivation progress count that may be held in the current realm before advancing to the next one; once reached, no further cultivation progress is accepted. It must not be smaller than `breakthrough_exp`. |
| `minor_stages` | `List<Component>` or `int` | `[]` | Names of the sub-stages. An array is those names (a bare string is a translation key, an object is a full component); an integer is how many layers there are, and the names are then generated as `realm_stage.mxt.<namespace>.<path>.minor_stage.<index>` (the index starts at `0`, the count is capped at `1024`). They are read in three places: the information panel prints the current one after the realm name, the `minor_stage` formula variable reports its index, and `minor_stage_abilities` uses that index as its threshold. The cut is even — this stage's `breakthrough_exp` is split into as many segments as there are entries, and the progress falls into one of them (the index starts at `0`). |
| `breakthrough` | `CultivateConditions` | empty object | The breakthrough conditions checked after the minimum cultivation progress is reached. |
| `auto_breakthrough` | `Boolean` | `false` | Whether a breakthrough is attempted automatically while cultivation mode is running; when disabled, a breakthrough can only be triggered through a command, KubeJS or another server-side call. |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | Vanilla attribute modifiers granted by the current realm; an entry contains `attribute`, the vanilla modifier `id`/`amount`/`operation` and an optional `value` formula. |
| `costs` | `List<Cost>` | `[]` | Breakthrough costs, paid by the entity that breaks through, all or nothing as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `ability_requirements` | `HolderOrTag<ability>[]` | `[]` | Abilities that must be owned before breaking through. |
| `minor_stage_abilities` | `{stage, ability}[]` | `[]` | **Unlocks abilities by sub-stage**: an entry looks like `{ "stage": 2, "ability": ["example:qi_sense"] }`, where `stage` is the **0-based index** of `minor_stages` (the same numbering the `minor_stage` formula variable uses) and `ability` is a `HolderOrTag<ability>` list (it may be omitted, meaning that layer unlocks nothing). It is **cumulative** (active from `stage` onwards) and **an unlock is permanent**: breaking through to the next realm, or progress resetting to zero, never takes it back. Validated while loading: `stage` must be non-negative, must fall inside this stage's declared `minor_stages`, and one `stage` must not be written twice. |
| `tribulation` | `Holder<tribulation>` | none | Optional tribulation. |
| `breakthrough_particle` | `ParticleEffect` | none | Optional breakthrough particle; nothing is sent when it is omitted. |
| `success_action` | `EntityAction` | `mxt:no_op` | Behaviour on a successful breakthrough. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Behaviour on a failed breakthrough. |

## Example

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "aura_share_weight": 2,
  "cultivate_condition": {"type": "mxt:aura_range", "aura": {"example:qi": {"min": 20, "max": 200}}},
  "next_realm": "example:qi_condensation",
  "breakthrough_exp": "1000 + level * 250",
  "max_experience": "2000 + level * 500",
  "minor_stages": 9,
  "minor_stage_abilities": [
    {"stage": 2, "ability": ["example:qi_sense"]},
    {"stage": 5, "ability": ["example:spirit_flight"]}
  ],
  "auto_breakthrough": false,
  "breakthrough": {
    "conditions": [
      {"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"},
      {"type": "mxt:resource_compare", "resource": "example:qi", "min": 100}
    ]
  },
  "costs": [{"id": "example:qi", "amount": 100}],
  "success_action": {
    "type": "mxt:grant_ability",
    "ability": "example:body_tempering",
    "source": "example:foundation"
  }
}
```

That file declares nine layers as an integer, so the names are generated as `realm_stage.mxt.example.foundation.minor_stage.0` through `…minor_stage.8`. Written as an array, the entries may mix translation keys and full components, for example:

```json
{
  "minor_stages": ["example:layer_1", {"text": "Third Layer", "color": "gold"}]
}
```

::: info Minor stages
Minor stages change no threshold by themselves; they only answer "which layer is this". The stage's `breakthrough_exp` is evaluated and split into as many even segments as there are names, and the progress decides which one it is (`0` is the first: with nine names and a requirement of `900`, `0`–`100` is the first and `minor_stage` reads `0`). Progress past `breakthrough_exp` (whose cap is `max_experience`) stays on the last one, and `minor_stage` reads `NaN` when `breakthrough_exp` evaluates to `0` or less, when the stage names no minor stages, or while the entity has no realm at all — a mortal still reads `realm` as `0`, so the two do not agree. The segment width moves with the `breakthrough_exp` formula, so a formula only settles it at runtime.
:::

::: info Unlocking by minor stage
`minor_stage_abilities` and the condition-side threshold (`min_minor_stage` on the `mxt:realm` entity condition) read the same record: **the highest minor stage the body has ever reached in each realm stage**, kept in the `spirit_identity` attachment and **only ever growing**. That record is what makes an unlock permanent, and it is why `min_minor_stage` still holds after the realm has been left. It is refreshed whenever cultivation progress lands and after a breakthrough commits (`/realm set` refreshes it too), so it never lags behind what was actually reached; a realm the body never entered has no record at all, and no `min_minor_stage` is satisfied by it.

```json
{
  "type": "mxt:realm",
  "realm": "example:qi_refining",
  "comparison": "at_least",
  "min_minor_stage": 5
}
```

`mxt:realm` splits the work three ways: `realm` plus `comparison` decide the realm itself (`exact` / `at_least` / `at_most`), and the optional `min_minor_stage` (`0`-based) requires the highest minor stage reached **in that realm** to be at least that. So `{"realm": "example:qi_refining", "min_minor_stage": 500}` reads as "has reached layer 500 of qi refining" (monotonic — still true after breaking through), while `comparison: "exact"` together with `min_minor_stage` reads as "is in that realm and at that layer or beyond right now".
:::

::: info Realm chains
A realm stage names exactly one aura and forms a linear chain through `next_realm`, so a chain is keyed by the aura definition rather than by the stored value; an aura has one chain and it only moves forward. The attachment stores the current realm and the cultivation progress under that aura, so nothing has to be resolved again to read a chain's state, and the server cache keeps the realm-to-aura mapping and the rank of every realm in its chain. An aura whose `first_realm` is missing has no chain at all.
:::

::: tip Conditions on the current stage
`mxt:realm` compares the entity's **current** stage against the given one. With the default `exact` comparison, naming the target stage inside the target stage's own `breakthrough` conditions can never pass; use `"comparison": "at_least"` to mean "this stage or later", or check a resource value instead.
:::

::: info First Breakthrough
The mortal stage uses the `start_exp` of the value's [aura definition](./aura.md) as both the first breakthrough threshold and its cap, while `first_realm` only determines the target of the first breakthrough. The first breakthrough uses the `breakthrough` conditions of the target first realm, and `start_cultivate_conditions` is only used for starting cultivation.
:::

