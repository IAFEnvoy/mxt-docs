---
title: cultivation (Cultivation Method)
aside: false
---

# cultivation (Cultivation Method) {#cultivation}

File location: `data/<namespace>/mxt/cultivation/<path>.json`

A `cultivation` is one method of cultivation: which ambient aura it takes in, how often it settles, what it does on every tick and on a tick that settles, what it charges, what it gives back, and how long the cooldown is after you stop. This registry decides which method a player is currently using.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `cultivation.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `cultivation.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is only stored and read, nothing draws it. |
| `priority` | Int | `0` | The order among several methods: the higher number wins, and an equal one falls back to registry order. It only orders the methods that **apply right now**. |
| `start_condition` | `EntityCondition` | `mxt:always` | Condition for starting a session (can this body sit down). |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | **Whether this tick yields anything**; while it fails the session carries on and **nothing happens** (nothing paid, nothing gained, no settlement) — the moment it holds again the body settles straight away. **Almost only used for dual cultivation.** |
| `cultivate_action` | EntityAction | `mxt:no_op` | Runs on a **tick that actually settles**: `cultivate_condition` holds, `tick_interval` has elapsed and the costs are paid. |
| `tick_condition` | `EntityCondition` | `mxt:always` | Whether the session carries on; failing it **stops** the session. |
| `tick_interval` | Integer | `20` | Absorption settlement interval. |
| `costs` | `Cost` array | `[]` | Paid on each session tick, out of the cultivating entity's own accounts. |
| `absorb_amount` | `NumberProvider` | `1` | Multiplier for the natural recovery of the current realm's resource while cultivating. |
| `aura_costs` | `Cost` array holding only `mxt:aura` entries | `[]` | Paid on each session tick out of the **shared aura pool** where the cultivator stands. |
| `aura_gains` | `{id, amount}` array | `[]` | Extra aura gained. |
| `cooldown` | Integer | `0` | Cooldown in ticks after stopping. |
| `tick_action` | EntityAction | `mxt:no_op` | Runs on **every** tick (once `tick_condition` has passed), whether or not that tick yields anything. |
| `abort_reason` | Text Component | none | Names the abort caused by a failing `tick_condition`: when written it replaces the generic "Cultivation conditions are not met". Other aborts — environment, aura, invalid configuration — are not affected. |

**How one is picked when several methods exist**: first the methods that **apply right now** are filtered out of the whole table — both `start_condition` and `cultivate_condition` have to hold, on top of the aura-side gate (each `aura` that has a first realm carries its own `start_cultivate_conditions`) — and then the one with the highest `priority` among those is taken, an equal one falling back to registry order. When none applies, the answer is "no method can be practised right now".

So **applicability is the filter and `priority` is only the order**: `priority` decides which one wins when both could run, while "which one can run for this body" is answered by the conditions themselves. `tick_condition` takes **no** part in that step: it answers "should a body that is already cultivating carry on", which cannot hold before the body has sat down.

**Naming one method skips `priority`**: a manual pick such as `/mxt cultivate select <action>` starts that method straight away (stopping the one already running), but it passes through the same filter, so a pick that does not apply is refused and the running session is left alone. It covers this one start only and never changes what the next press of the key picks.

`start_condition` only decides whether a body can sit down; `tick_condition` is asked on **every** tick and failing it **aborts** the session (the actionbar reports "Cultivation cannot continue: Cultivation conditions are not met", or your own words when `abort_reason` is written); `cultivate_condition` is asked before every settlement, and while it fails that settlement is **skipped** (nothing paid, nothing gained, no settlement) **without stopping** the session. The action fields follow their own conditions: `tick_action` runs on every tick, `cultivate_action` only on a tick that actually settles.

All three can read the environment and the bodies around: `mxt:aura_range` asks for a window of one aura's concentration, `mxt:dimension` for a dimension, block / biome conditions for the ground underfoot, and `mxt:partner` for a matching body nearby (wrap `mxt:target_condition` around a condition to ask what that body holds). "My partner is cultivating too" (`mxt:cultivating`) only belongs in `tick_condition` — before starting it is necessarily false.

`cultivate_condition` has a very narrow use: it is **almost only there for dual cultivation** — "there has to be somebody beside me, and that somebody has to be holding the thing, for this tick to yield anything". A requirement one body can satisfy alone belongs in the other two: what stops a body practising at all (aura concentration, dimension, technique, place) is a `start_condition`, while what should end a session halfway is a `tick_condition`; only "the body may keep sitting there, but this tick should give nothing" calls for `cultivate_condition`.

`tick_interval` ranges over `1..72000`, `cooldown` over `0..72000`.

The whole `costs` array is **all or nothing**, paid out of the cultivator's own accounts; how to write it is in [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

`absorb_amount` fills the resource bar first, and the overflow goes into cultivation progress.

Each `aura_gains` entry is `{id, amount}`, where `id` is one aura.

`tick_action` runs on **every** tick (once `tick_condition` has passed); `cultivate_action` runs only on a **tick that actually settles** — `cultivate_condition` holds, `tick_interval` has elapsed and the costs are paid.

`aura_costs` accepts only `mxt:aura` entries — any other type is a load error; `amount` has to evaluate to a finite positive number, or that entry cannot be paid. How to write it is in [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

How `aura_costs` is paid is the most involved part of this field set. When several players cultivate in the same chunk, each entry is first scaled on its own by the share the pool can give it (what that entry can get ÷ what it asks for, clamped to `0..1`), and this settlement's multiplier is the average of those shares; the scaled amount is what actually gets submitted to the pool, and the pool then charges it **all or nothing**. So an entry that comes up short only drags down its own contribution and the overall multiplier — it does not refuse payment by itself; the session only aborts for lack of aura when nothing can be paid at all (or the scaled multiplier is `0` and the server config demands usable aura). A formula that evaluates to a non-finite number aborts the session with `INVALID_FORMULA`.

There is no separate "environment kind" field: where a session can run is expressed entirely by the three conditions, and all of them can read the environment — `mxt:aura_range` demands a concentration range of some aura, `mxt:dimension` demands a dimension, and block or biome conditions demand the place underfoot. Note that this is another side from `aura_zone.cultivate_condition` and `realm_stage.cultivate_condition`: those have the environment or the realm declare "cultivation is allowed here" and "this chain's regeneration counts", while these three have the method declare what it needs.

```json
// data/example/mxt/cultivation/seated.json
{
  "priority": 1,
  "start_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 10, "max": 200 } } },
  "tick_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 5, "max": 200 } } },
  "tick_interval": 20,
  "absorb_amount": 1.5,
  "aura_costs": [{ "type": "mxt:aura", "aura": "example:qi", "amount": 0.5 }],
  "aura_gains": [{ "id": "example:qi", "amount": 1 }],
  "cooldown": 100,
  "tick_action": { "type": "mxt:no_op" },
  "cultivate_action": { "type": "mxt:no_op" }
}
```

## Division of Labour Between Aura Definitions and Cultivate Actions {#aura-and-cultivate-action}

Every value's aura identity and cultivation behaviour are described by an `aura` definition (one to one, referencing one `resource`): the realm entry `first_realm`, the mortal threshold `start_exp`, the conditions for starting to cultivate `start_cultivate_conditions`, natural recovery `regen`, the aura marker `aura_type`, the spirit power ray `burst_amount`, both conversion directions between progress and value, `use_condition` and `show_cultivation_info` all live here; the `resource` itself only stores the number and the resource bars. Field by field, see [aura](./aura.md).

The realm chain belongs to the `aura` definition: every `realm_stage` points at the definition through its `aura` field, the definition points at the first stage of the chain through `first_realm`, and `next_realm` strings the stages into a linear chain that only goes forward; one chain per definition, and a player can hold several chains at once. A stage's `breakthrough_exp`, `max_experience` and `breakthrough` describe the limit on going from that stage to the next, and the optional `auto_breakthrough` controls whether a session tries to break through automatically (off by default). A mortal uses the definition's `start_exp` as both the first breakthrough threshold and the cap, and `first_realm` only picks the target of that first breakthrough; `start_cultivate_conditions` are checked both before a session starts and before the first breakthrough. `use_condition` only gates the resource bars and deliberate spending — it never blocks cultivation, environmental absorption, natural recovery or breakthroughs. Techniques have no enable switch, so every learned technique is in effect at once.

`regen` is the natural recovery per tick while no cultivate action has taken over; cultivation absorption restores only the value of the **current realm** by default, and that realm's `cultivate_condition` can restrict "can I cultivate here" once more, the other side of the method's own `start_condition` / `tick_condition`.

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "start_exp": 100,
  "start_cultivate_conditions": { "conditions": [] },
  "use_condition": {
    "type": "mxt:has_realm",
    "aura": "example:qi"
  }
}
```

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "cultivate_condition": {"type": "mxt:always"},
  "aura_share_weight": 1.0,
  "breakthrough_exp": 100,
  "max_experience": 250,
  "auto_breakthrough": false,
  "breakthrough": { "conditions": [] }
}
```

Spirit roots and physiques are holding sources that stack, and the behaviour decides how they are granted; this framework does not dictate any particular spirit root names or numbers. Holding a spirit root or a physique is a datapack primitive: the condition side offers `mxt:has_spirit_root` and `mxt:has_physique`, the behaviour side offers `mxt:grant_spirit_root`, `mxt:remove_spirit_root`, `mxt:grant_physique` and `mxt:remove_physique`. A physique can use `holder_condition` to require a given spirit root or another physique:

```json
{
  "attribute_modifiers": [{"attribute": "minecraft:max_health", "id": "example:physique/blazing_body", "amount": 2, "operation": "add_value"}],
  "granted_abilities": [],
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
}
```

See [spirit_root](./spirit_root.md) and [physique](./physique.md).
