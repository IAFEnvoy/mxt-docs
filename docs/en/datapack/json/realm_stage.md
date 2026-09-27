---
title: Realm Stage (realm_stage)
description: "Defines one stage of a realm chain: its aura, breakthrough conditions and costs, minor stages, and the lifespan reaching it grants."
aside: false
---

# Realm Stage (realm_stage) {#realm_stage}

File location: `data/<namespace>/mxt/realm_stage/<path>.json`

A `realm_stage` is one stage of a realm chain. `aura` decides which chain the stage sits on, `next_realm` links it to the next one, and a run of stages forms a linear chain that only moves forward and never back. The progress cap, breakthrough conditions, minor stages, breakthrough costs and the lifespan a breakthrough adds are all written on the stage itself.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `realm_stage.mxt.<namespace>.<path>` | Display name; omitted, it is the default key in the previous column. |
| `description` | Text Component | `realm_stage.mxt.<namespace>.<path>.description` | Description; omitted, it is the default key in the previous column. It is stored and read, but no screen draws it. |
| `aura` | Aura ID | **required** | The realm chain this stage belongs to. |
| `aura_share_weight` | `NumberProvider` | `1` | Weight in the same-chunk aura split while `aura_zone.distribution` is `realm_weighted`. |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | Environment conditions under which this realm may cultivate. |
| `next_realm` | Realm ID | none | The next stage on the chain; at most one. |
| `breakthrough_exp` | `NumberProvider` | `0` | Minimum progress count needed to break through to the next stage. |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | Largest progress count that may be held before moving on to the next stage. |
| `minor_stages` | Text Component array or integer | `[]` | Minor stage names, or how many layers there are. |
| `breakthrough` | Condition group object | empty object | Breakthrough conditions checked once the minimum progress is reached. |
| `auto_breakthrough` | `Boolean` | `false` | Whether cultivation mode attempts a breakthrough on its own. |
| `passive_modifiers` | Attribute modifier entry array | `[]` | Vanilla attribute modifiers this stage grants. |
| `lifespan` | `NumberProvider` | none | Lifespan in ticks added to the body when this stage is reached. |
| `costs` | `Cost` array | `[]` | Breakthrough costs, paid by the entity that breaks through. |
| `ability_requirements` | Ability ID or `#tag` array | `[]` | Abilities that must be owned before breaking through. |
| `minor_stage_abilities` | `{stage, ability}` array | `[]` | Abilities unlocked by minor stage. |
| `tribulation` | Tribulation ID | none | Optional tribulation. |
| `breakthrough_particle` | `ParticleEffect` | none | Optional breakthrough particle; nothing is sent when it is omitted. |
| `success_action` | `EntityAction` | `mxt:no_op` | Behaviour on a successful breakthrough. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Behaviour on a failed breakthrough. |

`aura` names an `aura` definition, not the stored value: a stage points at one definition, the definition is what points at the value, and the chain itself is never keyed by a value.

`cultivate_condition` says what environment this realm allows cultivation in — `mxt:aura_range`, for example, demands a minimum concentration.

`max_experience` must not be smaller than `breakthrough_exp`; once progress reaches `max_experience` it accepts no further increase.

With `auto_breakthrough` off, a breakthrough can only be triggered on purpose, through a command, KubeJS or another server-side call.

An entry of `passive_modifiers` writes `attribute` and the vanilla modifier's `id/amount/operation`, plus an optional `value` formula.

`costs` is **all or nothing** as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

`lifespan` is added only by the breakthrough that successfully reaches this stage, and only once. It is an **increment**: a later stage written smaller merely adds less, and it never takes back life the body already earned. A literal constant must be finite and non-negative, or loading is refused outright; a formula is judged at the moment of the breakthrough instead, and a result that is not finite or is negative logs one warning and adds nothing. Writing `0` (or a formula that evaluates to `0`) means this stage grants no extra life — it does **not** mark the body as "out of lifespan". See [Lifespan](/en/player-guide/lifespan).

An array writes those names (a string counts as a translation key, an object as a full component); a single integer writes how many layers there are, and the names are generated as `realm_stage.mxt.<namespace>.<path>.minor_stage.<index>` (the index starts at `0`, capped at `1024`). Minor stage names are read in three places: the information panel prints the current one after the realm name, the `minor_stage` formula variable, and the threshold index of `minor_stage_abilities`.

`breakthrough` is a condition group, not a single condition. It reads three keys: `conditions` (condition array, empty by default, all of which must pass), `triggers` (trigger array, empty by default) and `action` (optional entity action). `conditions` is evaluated immediately once the breakthrough stage is reached; `triggers` only register as runtime subscriptions after that, and a matching event then attempts the breakthrough. Subscriptions are never written to the save: they are rebuilt from the cultivation state after a save or the data tables are loaded.

An entry of `minor_stage_abilities` looks like `{ "stage": 2, "ability": ["example:qi_sense"] }`: `stage` is the **0-based index** into `minor_stages` (the same numbering the `minor_stage` formula variable uses), and `ability` is a list of ability IDs / `#tags`; omit it and that layer unlocks nothing. The check is **cumulative**: a layer ≥ `stage` is in effect; **an unlock is permanent** and breaking through out of this realm or resetting progress to zero never takes it back. Load-time validation: `stage` must be non-negative, must fall inside this realm's `minor_stages`, and the same `stage` must not be written twice.

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
  "lifespan": 2400,
  "success_action": {
    "type": "mxt:grant_ability",
    "ability": "example:body_tempering",
    "source": "example:foundation"
  }
}
```

That file declares nine layers with the integer form, so the names are generated as `realm_stage.mxt.example.foundation.minor_stage.0` through `…minor_stage.8`. Written as an array, translation keys and full components may be mixed, for example:

```json
{
  "minor_stages": ["example:layer_1", {"text": "Third Layer", "color": "gold"}]
}
```

Minor stages change no threshold by themselves; they only answer "which layer is this now": the stage's `breakthrough_exp` is evaluated and cut evenly into as many segments as there are entries, and the progress falls into one of them (`0` is the first — with nine minor stages and a `breakthrough_exp` of `900`, `0`–`100` is the first and `minor_stage` is `0`). Progress may exceed `breakthrough_exp` (whose cap is `max_experience`), and past it the body stays on the last layer. The `minor_stage` formula variable reads `NaN` when `breakthrough_exp` evaluates to `0` or a negative number, when the stage writes no `minor_stages`, and while the player has no realm at all (a mortal still reads `realm` as `0`, so the two do not agree). The segment width moves with the `breakthrough_exp` formula, so a formula only settles the width at runtime.

**Unlocking by minor stage** (`minor_stage_abilities`) and the **conditional gate** (`min_minor_stage` on the `mxt:realm` entity condition) read the same record: **the highest layer the body has ever reached in each realm**, kept in the `spirit_identity` attachment and **only ever growing**. That record is what carries "an unlock is permanent", and it is why `min_minor_stage` still holds after the realm has been left. It is refreshed every time cultivation progress lands and after a successful breakthrough (`/realm set` refreshes it too), so it never lags behind the layers actually reached; a realm that was never entered reads as "no record", and no `min_minor_stage` is satisfied by it.

```json
{
  "type": "mxt:realm",
  "realm": "example:qi_refining",
  "comparison": "at_least",
  "min_minor_stage": 5
}
```

`mxt:realm` splits the work three ways: `realm` plus `comparison` decide the realm itself (`exact` / `at_least` / `at_most`), and the optional `min_minor_stage` (`0`-based) requires the highest layer reached **in that realm** to be at least that. So `{"realm": "example:qi_refining", "min_minor_stage": 500}` reads as "has reached layer 500 of qi refining" (monotonic — still true after breaking through), while `comparison: "exact"` with `min_minor_stage` reads as "is in that realm and at that layer or beyond right now". Field details are on [Entity Condition Types](../types/condition/entity_condition_types.md).

`mxt:realm` compares the realm the entity is **currently** in, so a target realm written with the default `exact` inside that same realm's own `breakthrough` `conditions` can never pass; write `"comparison": "at_least"` there instead, or check a value.

A mortal who has no realm yet walks none of the stages on the chain: the mortal stage's breakthrough threshold and cap come from this aura definition's `start_exp`, `first_realm` only names the target of the first breakthrough, the first breakthrough uses the `breakthrough` conditions of that target first realm, and `start_cultivate_conditions` is only used to start cultivating.

A stage recognises exactly one `aura`, and the chain only advances one way through `next_realm`; the chain identity is the record rather than the value itself: the `spirit_identity` attachment keeps the current realm and the progress per `aura`, so reading the state never has to resolve the value again. The chain order is derived at load time — the stage no other stage points at becomes the first one, and the rest are numbered along `next_realm`, which is what lets any two stages be compared. Two first stages for the same `aura`, a cycle, or a link to a realm that does not exist make that derivation fail: it refuses rather than leaving a partially ordered chain.
