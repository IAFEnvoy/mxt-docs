---
title: Define Aura and Realms
description: "Build the core cultivation loop from JSON: an aura, an element, a linear realm chain, a cultivation action, a minimal aura zone, and how to verify each step in game."
---

# Define Aura and Realms

This tutorial builds the smallest cultivation loop MiXianTu can run: a stored **resource** the player fills, an **aura** definition that turns that number into an aura with a realm chain, a **cultivation action** that moves aura into it, and a tiny **aura zone** so the world actually contains aura. When you are done, a player can press the cultivate key, watch a bar fill, and break through to their first realm.

Nothing here is specific to a setting: the numbers below are placeholders you are expected to replace.

::: info Before you start

Read [Datapack Overview](../datapack/overview.md) first if you have not yet. It explains where files go, how definition IDs work, why a missing holder reference fails the whole load, and when your edits take effect.

:::

## The Shape of the Loop

```text
aura_zone / block_aura        the world supplies aura per chunk
        ↓
cultivate_action              the player absorbs it while cultivating
        ↓
aura  example:qi              the definition that turns the stored number into an aura
        ↓
resource  example:qi          the bar fills; the overflow becomes progress
        ↓
realm_stage chain             progress + conditions + costs → next realm
```

A player who has not entered a chain yet is **Mortal**. The Mortal state has no definition of its own: it is described by the aura definition, through `start_exp` (the progress needed, and the hard cap) and `first_realm` (the stage that the first breakthrough targets).

## What You Are Building

| File | Registry | Purpose |
| --- | --- | --- |
| `element/common.json` | `element` | The element the qi aura names, with its relations and colour. |
| `resource/qi.json` | `resource` | The stored number, its bounds and its HUD bar. |
| `aura/qi.json` | `aura` | The aura definition laid on that value: element marker, regeneration, realm entry. |
| `realm_stage/qi_condensation.json` | `realm_stage` | First realm, and the requirements for the second. |
| `realm_stage/foundation.json` | `realm_stage` | Second realm. |
| `realm_stage/core_formation.json` | `realm_stage` | Third realm, the end of the chain. |
| `cultivate_action/meditation.json` | `cultivate_action` | What the player does while cultivating. |
| `aura_zone/common_land.json` | `aura_zone` | A plains-level supply of aura in the Overworld. |
| `assets/example/lang/en_us.json` | — | Names for the IDs above. |

## Step 1 — The Element

A definition's aura is a separate `aura` entry, and the `element` registry is what it points at through `aura_type`. An `element` holds only relations and a colour: which elements it `overcomes`, which it is `adapted_to`, what each of those edges is worth in damage, and the colour used by aura-cost text. Start with a minimal one.

```json
// data/example/mxt/element/common.json
{
  "color": "#66CCFF"
}
```

`overcomes` and `adapted_to` are optional relations to other elements. Each entry names the elements it points at (`elements`, one id, an array, or `#` tags) together with what the edge is worth (`multiplier`, a finite non-negative number), and the [damage system](../technical/damage.md) reads them on the attacking and defending side of a hit respectively; leave them out until you have more than one element. The full field list is in [Element](../datapack/json/element.md).

## Step 2 — The Aura and Its Value

A `resource` is only a stored number with bounds and a bar; an `aura` gives that number its aura identity and cultivation behaviour and points back at it, one to one. Write both files first, then read the tables.

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "50 + realm_rank * 50 + absorbed_aura * 0.2",
  "particle_color": "#66CCFF",
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "order": 0,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1},
      "value_display": "current_and_maximum"
    }
  ]
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": "0.05 + realm_rank * 0.05",
  "aura_type": "example:common",
  "first_realm": "example:qi_condensation",
  "start_exp": 100
}
```

| Resource field | What it does here |
| --- | --- |
| `default_value` | A new player starts empty. Required. |
| `max` | The bar's upper bound. A formula, because `max` is evaluated in this value's aura context, where `realm_rank` and `absorbed_aura` exist. Required. |
| `particle_color` | Colour of the spirit power rays this value fires. |
| `bars` | One self-HUD bar in the left column; `renderer` is required, and every bar needs an `anchor`. |

| Aura field | What it does here |
| --- | --- |
| `resource` | Which stored value this aura describes. Required, and a value may have at most one aura. |
| `regen` | A slow trickle so the pool refills outside meditation. |
| `aura_type` | The element this aura names; the environment and aura fuel use it for type checks, and it is shown next to the name by `/mxt aura query`. |
| `first_realm` | Where the first breakthrough goes. Without it, a Mortal can never leave the Mortal state. |
| `start_exp` | The cultivation progress a Mortal needs, and the cap they cannot pass until they break through. |

The aura fields used elsewhere in this tutorial are `cultivation_to_resource` and `resource_to_cultivation` (conversions between progress and the stored number), `burst_amount` (the value of one spirit burst ray), `start_cultivate_conditions` (checked before cultivation may start) and `show_cultivation_info` (whether the character panel shows the realm and progress). The full list is in [Aura](../datapack/json/aura.md).

`min` defaults to `0`, and `use_condition` defaults to always true, so a Mortal can see the bar. If you would rather hide the bar until the player has entered the chain, add it to the aura:

```json
"use_condition": {"type": "mxt:has_realm", "aura": "example:qi"}
```

`use_condition` only controls the display and the player's manual consumption. It never blocks cultivation, absorption or a breakthrough. The full field list is in [Aura](../datapack/json/aura.md).

::: tip Formulas

Any numeric field accepts a plain number, a formula string, or a typed provider object. Formulas are evaluated with exp4j and can use `round`, `clamp`, `min`, `max`, `pi` and `e` on top of the context variables. See [Formula Variables](../datapack/types/formula_variables.md).

:::

## Step 3 — The Realm Chain

Each `realm_stage` file is one stage. A stage names exactly one aura, and `next_realm` points at a single stage, so a chain is a straight line: an aura has one chain, and it only moves forward. The value the aura stores is what actually fills up.

```json
// data/example/mxt/realm_stage/qi_condensation.json
{
  "aura": "example:qi",
  "next_realm": "example:foundation",
  "breakthrough_exp": 800,
  "max_experience": 1600,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:realm/qi_condensation",
      "amount": 2,
      "operation": "add_value"
    }
  ],
  "costs": [{"id": "example:qi", "amount": 50}],
  "auto_breakthrough": false
}
```

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "next_realm": "example:core_formation",
  "breakthrough_exp": 2000,
  "max_experience": 4000,
  "breakthrough": {
    "conditions": [
      {"type": "mxt:resource_compare", "resource": "example:qi", "min": 200}
    ]
  },
  "costs": [{"id": "example:qi", "amount": 200}],
  "auto_breakthrough": false
}
```

```json
// data/example/mxt/realm_stage/core_formation.json
{
  "aura": "example:qi",
  "max_experience": 8000,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:realm/core_formation",
      "amount": 6,
      "operation": "add_value"
    }
  ]
}
```

Reading the three files together:

- `breakthrough_exp` is the progress required to **leave** this stage, and `max_experience` is the progress cap while you are in it. They must not cross: a constant `breakthrough_exp` greater than a constant `max_experience` is rejected at load time.
- The optional `minor_stages` holds the sub-stages: an array is the names themselves (a bare string is a translation key, an object is a full component), while an integer N means "N layers" — the names are then generated from the entry id as `realm_stage.mxt.<namespace>.<path>.minor_stage.<index>`, counting from `0`. It only affects display and formulas: the information panel prints the current one after the realm name, and formulas gain a 0-based `minor_stage`. The cut is an even split of this stage's `breakthrough_exp`, and it changes no threshold, cost or settlement.
- `costs` are paid on a successful breakthrough; `breakthrough.conditions` are checked alongside the progress. Both belong to the stage you are leaving — except for the very first step, where the threshold comes from the aura's `start_exp` and the conditions come from the target's `breakthrough`.
- `auto_breakthrough` defaults to `false`: the player reaches the threshold and waits. Set it to `true` if you want cultivation mode to attempt the breakthrough on its own.
- `passive_modifiers` are vanilla attribute modifiers granted while the stage is held. `value` is an optional formula, and an entry that declares it is recalculated every tick.
- The last stage simply has no `next_realm`, so the chain ends there.

::: warning Realm conditions are not `caster_level`

Inside a resource, realm or breakthrough formula, `level`, `realm` and `realm_rank` are all the rank in the chain. Inside an *entity* formula such as an ability amount, `caster_level` is the vanilla experience level and there is no realm rank at all. Use `realm_rank` in resource and realm fields to keep the intent obvious.

:::

## Step 4 — A Cultivation Action

A `cultivate_action` is a named activity. The player selects one, and it settles on a fixed interval.

```json
// data/example/mxt/cultivate_action/meditation.json
{
  "default": true,
  "tick_interval": 20,
  "absorb_amount": 1.5,
  "aura_costs": [{"type": "mxt:aura", "aura": "example:qi", "amount": 1}],
  "cooldown": 100
}
```

| Field | Effect |
| --- | --- |
| `default` | Used when the player has not selected another behaviour. Without any default, the first registered behaviour is used. Defaults to `false`. |
| `tick_interval` | Settlement interval in ticks, `1..72000`; `20` means once per second. Defaults to `20`. |
| `absorb_amount` | Multiplier for the natural recovery of the current realm's value; the bar fills first and the overflow becomes cultivation progress. Defaults to `1`. |
| `aura_costs` | The aura spent each tick, paid from the **shared aura pool** at the cultivator's position, and written with `mxt:aura` entries only (`[{"type": "mxt:aura", "aura": "example:qi", "amount": 1}]`). When several players cultivate in the same chunk each one's amount is scaled by the pool's allocation first, and the pool is then charged **all or nothing**. |
| `cooldown` | Ticks before cultivation can start again after it stops. Defaults to `0`. |

`start_condition` and `condition` decide whether cultivation may start and continue; both default to always true, and both can read the environment. There is no "aura kind" field: an action that should only run in the right place asks for that place directly, for example with `mxt:aura_range` (a concentration range for one aura, where `max` is required on every entry) or `mxt:dimension`. `costs` (paid by the cultivating entity each tick, one `Cost` array and all or nothing), `aura_gains` (extra aura added per tick) and `tick_action` (an entity action run each tick) are the remaining fields.

## Step 5 — A Minimal Aura Zone

Without an aura zone the world contains no aura, so there is nothing for the meditation action to absorb.

```json
// data/example/mxt/aura_zone/common_land.json
{
  "aura": {
    "example:qi": {
      "amount": 200,
      "max": {"type": "mxt:initial_multiplier", "multiplier": 2},
      "regen_per_tick": 0.05,
      "color": "#66CCFF"
    }
  },
  "distribution": "equal",
  "biomes": ["#minecraft:is_overworld"]
}
```

- `aura` is the per-aura environment inventory, stored per chunk and shared by everyone in that chunk. Its key set is the whole vocabulary of the zone: an environment has exactly the auras it lists. The element each of them belongs to comes from that aura's own `aura_type`, so there is nothing extra to declare here.
- `amount` is the *base* aura of the template, not the number the HUD shows: with no noise configured the initial concentration is `max(0, amount / 10 - 5)`, so `200` starts around `15`, and `max` resolves from that initial value — here `initial_multiplier: 2`, so the chunk can hold up to about `30`.
- `regen_per_tick` refills the chunk inventory over time.
- `distribution` decides how several players split an insufficient inventory: `random`, `equal` or `realm_weighted`.
- `biomes` and `dimensions` decide where the template applies; `#minecraft:is_overworld` covers every Overworld biome. A dimension-level binding beats a biome-level one, and both sit below manual areas and formations.
- `cultivate_condition` is the condition the environment itself puts on cultivation; it defaults to always true, and a zone that wants to require a concentration writes `mxt:aura_range` here. The action's own `start_condition`/`condition` are the other side of the same test.

The aura environment has enough depth to deserve its own page — that is [Build the Aura Environment](./aura-environment.md), where you will add denser zones, block sources, item fuel and the client-side fog and HUD.

## Step 6 — Names

Display names are generated from the definition ID by default, so you do not have to write a translation key into the JSON — unless you want your own text: the definitions of 18 registries, including `resource`, `aura`, `realm_stage`, `element` and `cultivate_action`, may carry an optional `name` / `description`, both filled in from the id when omitted. Add the keys to your own language file:

```json
// assets/example/lang/en_us.json
{
  "resource.mxt.example.qi": "Spirit Qi",
  "aura.mxt.example.qi": "Spirit Qi",
  "realm_stage.mxt.example.qi_condensation": "Qi Condensation",
  "realm_stage.mxt.example.foundation": "Foundation Establishment",
  "realm_stage.mxt.example.core_formation": "Core Formation",
  "element.mxt.example.common": "Common Aura",
  "cultivate_action.mxt.example.meditation": "Meditation"
}
```

The pattern is always `<category>.<registry namespace>.<namespace>.<path>`, where the category is the registry's own path and the **registry namespace is always `mxt`**, so `example:qi` in `resource` is `resource.mxt.example.qi` and the same id in `aura` is `aura.mxt.example.qi`. A path containing `/` keeps the slash: `example:realm/qi` is `realm_stage.mxt.example.realm/qi`. A definition without a key still works; the game simply shows the raw key.

A definition whose text field is omitted uses the **same key**: `item_quality`'s `name` / `description` read as `quality.mxt.<namespace>.<path>` (the description adds `.description`, so `mxt_test:poor` is `quality.mxt.mxt_test.poor`), and a `realm_stage` counting its layers in an integer reads `realm_stage.mxt.<namespace>.<path>.minor_stage.<index>`. Apart from `item_quality`'s `description` (the line under the quality name), those fields are stored and read today but nothing draws them yet.

## Step 7 — Load and Verify

Data pack registries are read while the world loads, so `/reload` is not enough: leave to the title screen and open the world again (or restart the server) and watch the log for codec errors. A file that cannot be decoded stops the world from loading, so if the world refuses to open, read the last error in the log and fix that file first.

```text
(load the world again)
/mxt registries validate          → registries loaded, no errors
/mxt registries list              → mxt:resource=1, mxt:aura=1, mxt:realm_stage=3, mxt:element=1, mxt:cultivate_action=1, mxt:aura_zone=1, … (every registry the mod registers is listed, most of them empty)
/mxt resource example:qi          → 0
/mxt aura query example:qi        → the aura inventory of your chunk
/mxt cultivate status             → the selected behaviour and the progress per aura
```

Then, in game:

1. Press the cultivate key (`C` by default) somewhere in the Overworld. The bar appears in the left column and starts filling.
2. Keep cultivating until the bar is full; from then on the overflow becomes cultivation progress. `/mxt cultivate status` and `/mxt attachment status` show the current progress.
3. At `100` progress — the aura's `start_exp` — the Mortal stage is capped and a breakthrough becomes possible. Because `auto_breakthrough` is `false`, trigger it yourself with `/mxt breakthrough example:qi` (it needs the `gamemaster` permission), or set `auto_breakthrough: true` and let cultivation do it.
4. On success you are in Qi Condensation: `/mxt attachment status` shows the new realm, the `50 + realm_rank * 50` maximum is larger, and the `+2 max health` modifier is applied.
5. Climb to Foundation Establishment the same way. You will need `200` qi in the pool at the same time, because that stage's `breakthrough.conditions` ask for it, and `200` qi will be spent by `costs`.

::: tip Faster testing

`/mxt resource example:qi set 500` (also `gamemaster`) fills the pool instantly so you can check the cost and condition gates without waiting. `/mxt realm set example:foundation` jumps the chain to a stage directly, which is useful when you are tuning later stages.

:::

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Nobody can ever leave Mortal | `first_realm` is missing on the aura, so there is no stage to break through to. |
| Cultivation never starts | The action's `start_condition` or `condition` is not satisfied — write a `mxt:aura_range` or a biome condition for the place you want, because there is no aura-kind vocabulary to match against. |
| The bar never grows | The shared aura pool cannot pay `aura_costs` (it does not hold enough, or other cultivators in the chunk take their share), or `use_condition` is false. |
| The world refuses to load | A definition failed to decode: a required holder points at an ID that does not exist, or a field has the wrong shape. The whole load fails, not just the file. |
| `breakthrough_exp` greater than `max_experience` | The stage cannot be left; the codec rejects this at load time when both are constants. |
| The realm condition never passes | `mxt:realm` compares against the *current* stage; use `"comparison": "at_least"` when you meant "this or later". |

## Next

- [Build the Aura Environment](./aura-environment.md) — make the concentration vary by place, block and time, and put it on the HUD.
- [Resource](../datapack/json/resource.md) and [Realm Stage](../datapack/json/realm_stage.md) — every remaining field, including resource bars, conversions and tribulations.
