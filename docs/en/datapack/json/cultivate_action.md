---
title: cultivate_action (Cultivate Action)
aside: false
---

# cultivate_action (Cultivate Action) {#cultivate_action}

File location: `data/<namespace>/mxt/cultivate_action/<path>.json`

A `cultivate_action` is one method of cultivation: which ambient aura it takes in, how often it settles, what it does every tick, what it charges, what it gives back, and how long the cooldown is after you stop. This registry decides which method a player is currently using.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `cultivate_action.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `cultivate_action.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is only stored and read, nothing draws it. |
| `default` | Boolean | `false` | Whether this is the behaviour used when no cultivation behaviour has been selected. |
| `start_condition` | `EntityCondition` | `mxt:always` | Condition for starting a session. |
| `condition` | `EntityCondition` | `mxt:always` | Condition for continuing a session. |
| `tick_interval` | Integer | `20` | Absorption settlement interval. |
| `costs` | `Cost` array | `[]` | Paid on each session tick, out of the cultivating entity's own accounts. |
| `absorb_amount` | `NumberProvider` | `1` | Multiplier for the natural recovery of the current realm's resource while cultivating. |
| `aura_costs` | `Cost` array holding only `mxt:aura` entries | `[]` | Paid on each session tick out of the **shared aura pool** where the cultivator stands. |
| `aura_gains` | `{id, amount}` array | `[]` | Extra aura gained. |
| `cooldown` | Integer | `0` | Cooldown in ticks after stopping. |
| `tick_action` | EntityAction | `mxt:no_op` | Action run on every cultivation tick. |

When nothing is marked `default`, the first behaviour in the registry is the default one.

`condition` only decides whether a session keeps going: once it fails, the session is **aborted** (the actionbar reports "Cultivation cannot continue: Cultivation conditions are not met"), while a `start_condition` that fails means it never starts in the first place.

`tick_interval` ranges over `1..72000`, `cooldown` over `0..72000`.

The whole `costs` array is **all or nothing**, paid out of the cultivator's own accounts; how to write it is in [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

`absorb_amount` fills the resource bar first, and the overflow goes into cultivation progress.

Each `aura_gains` entry is `{id, amount}`, where `id` is one aura.

`tick_action` only runs on the tick that actually settles, not every tick.

`aura_costs` accepts only `mxt:aura` entries — any other type is a load error; `amount` has to evaluate to a finite positive number, or that entry cannot be paid. How to write it is in [Shared Data Types · `Cost`](../types/shared_data_types.md#cost).

How `aura_costs` is paid is the most involved part of this field set. When several players cultivate in the same chunk, each entry is first scaled on its own by the share the pool can give it (what that entry can get ÷ what it asks for, clamped to `0..1`), and this settlement's multiplier is the average of those shares; the scaled amount is what actually gets submitted to the pool, and the pool then charges it **all or nothing**. So an entry that comes up short only drags down its own contribution and the overall multiplier — it does not refuse payment by itself; the session only aborts for lack of aura when nothing can be paid at all (or the scaled multiplier is `0` and the server config demands usable aura). A formula that evaluates to a non-finite number aborts the session with `INVALID_FORMULA`.

There is no separate "environment kind" field: where a session can run is expressed entirely by `start_condition` (checked once at the start) and `condition` (checked before every settlement), and both can read the environment — `mxt:aura_range` demands a concentration range of some aura, `mxt:dimension` demands a dimension, and block or biome conditions demand the place underfoot. Note that this is the other side of `aura_zone.cultivate_condition`: that one is the environment declaring "cultivation is allowed here", these two are the method declaring "this is what I need".

```json
// data/example/mxt/cultivate_action/seated.json
{
  "default": true,
  "start_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 10, "max": 200 } } },
  "condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 5, "max": 200 } } },
  "tick_interval": 20,
  "absorb_amount": 1.5,
  "aura_costs": [{ "type": "mxt:aura", "aura": "example:qi", "amount": 0.5 }],
  "aura_gains": [{ "id": "example:qi", "amount": 1 }],
  "cooldown": 100,
  "tick_action": { "type": "mxt:no_op" }
}
```

## Division of Labour Between Aura Definitions and Cultivate Actions {#aura-and-cultivate-action}

Every value's aura identity and cultivation behaviour are described by an `aura` definition (one to one, referencing one `resource`): the realm entry `first_realm`, the mortal threshold `start_exp`, the conditions for starting to cultivate `start_cultivate_conditions`, natural recovery `regen`, the aura marker `aura_type`, the spirit power ray `burst_amount`, both conversion directions between progress and value, `use_condition` and `show_cultivation_info` all live here; the `resource` itself only stores the number and the resource bars. Field by field, see [aura](./aura.md).

The realm chain belongs to the `aura` definition: every `realm_stage` points at the definition through its `aura` field, the definition points at the first stage of the chain through `first_realm`, and `next_realm` strings the stages into a linear chain that only goes forward; one chain per definition, and a player can hold several chains at once. A stage's `breakthrough_exp`, `max_experience` and `breakthrough` describe the limit on going from that stage to the next, and the optional `auto_breakthrough` controls whether a session tries to break through automatically (off by default). A mortal uses the definition's `start_exp` as both the first breakthrough threshold and the cap, and `first_realm` only picks the target of that first breakthrough; `start_cultivate_conditions` are checked both before a session starts and before the first breakthrough. `use_condition` only gates the resource bars and deliberate spending — it never blocks cultivation, environmental absorption, natural recovery or breakthroughs. Techniques have no enable switch, so every learned technique is in effect at once.

`regen` is the natural recovery per tick while no cultivate action has taken over; cultivation absorption restores only the value of the **current realm** by default, and that realm's `cultivate_condition` can restrict "can I cultivate here" once more, the other side of the method's own `start_condition` / `condition`.

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
