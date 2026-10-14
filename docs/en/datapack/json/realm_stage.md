---
title: Realm Stage (realm_stage)
description: "Defines one stage of a realm chain: its aura, breakthrough conditions and costs, minor stages, and the lifespan reaching it grants."
aside: false
---

# Realm Stage (realm_stage) {#realm_stage}

File location: `data/<namespace>/mxt/realm_stage/<path>.json`

A `realm_stage` is one stage of a realm chain. `aura` decides which chain the stage sits on, `next_realm` links it to the next one, and a run of stages forms a linear chain that only moves forward and never back.

Everything it takes to **break through from the previous realm into the current one** is written on that **current** stage itself: the progress threshold and cap, the breakthrough conditions, the automatic flag, the breakthrough costs, the minor stages, and the lifespan reaching it grants. Standing on the stage below, the body reads this one; a mortal reads the first realm of the chain.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura ID | **required** | The realm chain this stage belongs to. |
| `aura_share_weight` | `NumberProvider` | `1` | Weight in the same-chunk aura split while `aura_zone.distribution` is `realm_weighted`. |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | Environment conditions under which this realm may cultivate. |
| `next_realm` | Realm ID | none | The next stage on the chain; at most one. |
| `breakthrough_exp` | `NumberProvider` | `0` | Minimum progress count needed to **break through from the stage below to this one**. |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | Largest progress count that may be held before breaking through to this stage. |
| `minor_stages` | Integer | `0` | How many minor stages this realm has, `0..1024`; the names are always generated from this stage's name key. |
| `breakthrough` | Condition group object | empty object | The conditions for **breaking through from the stage below to this one** (checked once this stage's minimum progress is reached). |
| `auto_breakthrough` | `Boolean` | `false` | Whether cultivation mode attempts that breakthrough **from the stage below to this one** on its own. |
| `passive_modifiers` | Attribute modifier entry array | `[]` | Vanilla attribute modifiers this stage grants. |
| `lifespan` | `NumberProvider` | none | Lifespan in ticks added to the body when this stage is reached. |
| `costs` | `Cost` array | `[]` | Costs of **breaking through from the stage below to this one**, paid by the entity that breaks through. |
| `ability_requirements` | Ability ID or `#tag` array | `[]` | Abilities that must be owned before **breaking through from the stage below to this one**. |
| `minor_stage_abilities` | `{stage, ability}` array | `[]` | Abilities unlocked by minor stage. |
| `tribulation` | Tribulation ID | none | Optional tribulation. |
| `breakthrough_particle` | `ParticleEffect` | none | Optional breakthrough particle; nothing is sent when it is omitted. |
| `success_action` | `EntityAction` | `mxt:no_op` | Behaviour on a successful breakthrough. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Behaviour on a failed breakthrough. |

`aura` names an `aura` definition, not the stored value: a stage points at one definition, the definition is what points at the value, and the chain itself is never keyed by a value.

`cultivate_condition` says what environment this realm allows cultivation in — `mxt:aura_range`, for example, demands a minimum concentration.

`max_experience` must not be smaller than `breakthrough_exp`; once progress reaches `max_experience` it accepts no further increase. Both numbers are read from **this** stage — the one the breakthrough arrives at — so how large one stage writes them decides the whole distance from the stage below to it.

`auto_breakthrough` governs that one step **from the stage below into this one**: with it off, a breakthrough can only be triggered on purpose, through a command, KubeJS or another server-side call. It is read from **this** stage: writing `false` here only says this stage does not accept an automatic breakthrough into itself, and says nothing about how this stage itself climbs higher.

An entry of `passive_modifiers` writes `attribute` and the vanilla modifier's `id/amount/operation`, plus an optional `value` formula.

`costs` is **all or nothing** as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

`lifespan` is added only by the breakthrough that successfully reaches this stage, and only once. It is an **increment**: a later stage written smaller merely adds less, and it never takes back life the body already earned. A literal constant must be finite and non-negative, or loading is refused outright; a formula is judged at the moment of the breakthrough instead, and a result that is not finite or is negative logs one warning and adds nothing. Writing `0` (or a formula that evaluates to `0`) means this stage grants no extra life — it does **not** mark the body as "out of lifespan". See [Lifespan](/en/player-guide/lifespan).

`minor_stages` is a **count** only: whatever number you write is how many minor stages this realm has, `0` by default and `0..1024` in range. The name of each stage has **no way to be written**, and is always generated from this stage's name key: `realm_stage.mxt.<definition namespace>.<path>.minor_stage.<index>`, the index starting at `0` (declare `9` for `qi_refining` and you get `.minor_stage.0` through `.minor_stage.8`). Translate those keys to give them words. This stage's own name key is `realm_stage.mxt.<definition namespace>.<path>`, and its description key is that plus `.description`; the definition has no writable text field. Minor stage names are read in three places: the information panel prints the current one after the realm name, the `minor_stage` formula variable, and the threshold index of `minor_stage_abilities`.

`breakthrough` is a condition group, not a single condition, and what it writes is the condition for the one step **from the stage below into this one**. It reads three keys: `conditions` (condition array, empty by default, all of which must pass), `triggers` (trigger array, empty by default) and `action` (optional entity action). `conditions` is evaluated immediately once the breakthrough stage is reached; `triggers` only register as runtime subscriptions after that, and a matching event then attempts the breakthrough. Subscriptions are never written to the save: they are rebuilt from the cultivation state after a save or the registries are loaded.

An entry of `minor_stage_abilities` looks like `{ "stage": 2, "ability": ["example:qi_sense"] }`: `stage` is the **0-based index** into `minor_stages` (the same numbering the `minor_stage` formula variable uses), and `ability` is a list of ability IDs / `#tags`; omit it and that layer unlocks nothing. The check is **cumulative**: a layer ≥ `stage` is in effect; **an unlock is permanent** and breaking through out of this realm or resetting progress to zero never takes it back. Load-time validation: `stage` must be non-negative, must be below this realm's `minor_stages`, and the same `stage` must not be written twice.

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

That file declares nine minor stages with the integer form, so the names are generated as `mxt.realm_stage.example.foundation.minor_stage.0` through `…minor_stage.8`; add them to your own language file and the information panel prints the current one after the realm name.

Minor stages change no threshold by themselves; they only answer "which layer is this now": the **count comes from the stage the body stands on** (its `minor_stages`), while the segment width comes from the `breakthrough_exp` of the stage **being climbed towards** — that is the number the current progress is heading for — evaluated and cut evenly into that many segments, and the progress falls into one of them (`0` is the first — with nine minor stages and a target `breakthrough_exp` of `900`, `0`–`100` is the first and `minor_stage` is `0`). Progress may exceed `breakthrough_exp` (whose cap is the target stage's `max_experience`), and past it the body stays on the last layer.

The `minor_stage` formula variable reads `NaN` in five cases: this stage writes no `minor_stages` (or writes `0`), `breakthrough_exp` evaluates to `0`, a negative number or a non-finite one, the player has no realm at all (a mortal still reads `realm` as `0`, so the two do not agree), the progress read is non-finite or negative, and the chain has run out (this stage has no `next_realm`, so there is no segment ahead to cut). The segment width moves with the target stage's `breakthrough_exp` formula, so a formula only settles the width at runtime.

**Unlocking by minor stage** (`minor_stage_abilities`) and the **conditional gate** (`min_minor_stage` on the `mxt:realm` entity condition) read the same record: **the highest layer the body has ever reached in each realm**, kept in the `minor_stages` attachment and **only ever growing**. That record is what carries "an unlock is permanent", and it is why `min_minor_stage` still holds after the realm has been left. It is refreshed every time cultivation progress lands and after a successful breakthrough (`/realm set` refreshes it too), so it never lags behind the layers actually reached; a realm that was never entered reads as "no record", and no `min_minor_stage` is satisfied by it.

```json
{
  "type": "mxt:realm",
  "realm": "example:qi_refining",
  "comparison": ">=",
  "min_minor_stage": 5
}
```

`mxt:realm` splits the work three ways: `realm` plus `comparison` decide the realm itself (the values are `==` / `!=` / `<` / `<=` / `>` / `>=`, compared by the **in-chain index** and only within that one chain), and the optional `min_minor_stage` (`0`-based) requires the highest layer reached **in that realm** to be at least that. So `{"realm": "example:qi_refining", "min_minor_stage": 500}` reads as "has reached layer 500 of qi refining" (monotonic — still true after breaking through), while `comparison: "=="` with `min_minor_stage` reads as "is in that realm and at that layer or beyond right now". Field details are on [Entity Condition Types](../types/condition/entity_condition_types.md).

Careful: `breakthrough` conditions are written on the stage you are **going to**, but they are evaluated while the body still **stands on the stage below** (a mortal stands on the pending "target first realm" instead). `mxt:realm` compares exactly the realm the entity **currently** stands in, so:

- Writing `{"realm": "<the target stage itself>", "comparison": ">="}` inside that stage's own `breakthrough` **can never pass** (the mortal step is the one exception: their standing realm is the target first realm, so it holds there). To say "must have reached some stage", name the **stage below**, or check a value instead.
- Conversely, `"comparison": ">="` naming the realm currently stood on is the usual way to write "this stage or later".

A mortal who has no realm yet reads the **target first realm** the same way: the breakthrough threshold and cap come from its `breakthrough_exp` / `max_experience`, the conditions come from its `breakthrough`, and `first_realm` only names the target. A mortal has no "stage below", so no stage carries their current threshold — the `aura` definition holds no breakthrough threshold field at all, and `start_cultivate_conditions` is only used to start cultivating.

A stage recognises exactly one `aura`, and the chain only advances one way through `next_realm`; the chain identity is the record rather than the value itself: the `cultivation` attachment keeps the current realm and the progress per `aura`, so reading the state never has to resolve the value again. The chain order is derived at load time: the stage `first_realm` names becomes the first one, and the rest are numbered along `next_realm`, which is what lets any two stages be compared — and **the stage above and the stage below are both read straight out of that order**, so the two directions are symmetric. A chain has to be a straight line, so **two stages naming the same `next_realm`** (a fork, naming the stage and both stages it follows) is reported and, exactly like **a cycle or a stage whose `aura` does not match the chain**, it keeps **every line running into the fork point** out of the index whole: it refuses rather than leaving a partially ordered chain. **A stage that never joins the chain at `first_realm`** (nothing can reach it) is reported on its own. **A link to a realm that does not exist never reaches that check**: `next_realm` is a registry reference, so naming a realm the pack does not provide fails the whole data pack load.
