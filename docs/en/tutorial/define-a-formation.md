---
title: Define a Formation
description: Start from a structure, a radius and its costs, add a buff module and an aura zone, then activate it with a plate, see where the upkeep comes from, and learn what happens when the structure breaks.
---

# Define a Formation

A formation is something the player **builds**: they lay out the blocks you described, touch it with a formation plate, and from then on it pays upkeep every 20 ticks and does its work inside a radius. **The structure is blocks, the behaviour is modules, the lifetime is costs** — all three live in one JSON file.

This tutorial adds two formations to the example pack: a spirit-gathering array (an aura zone plus a buff for the people inside) and a ward (protection that keeps outsiders from breaking in).

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/formation/spirit_gathering_array.json` | The array: structure, radius, upkeep, buff module. |
| `data/example/mxt/formation/ward_array.json` | The ward: a protection module reacting to block events. |

## Step 1 — Structure and Radius

```json
// data/example/mxt/formation/spirit_gathering_array.json
{
  "structure": [
    {"offset": [0, 0, 0], "state": "minecraft:gold_block"},
    {"offset": [1, 0, 0], "state": "minecraft:iron_block"},
    {"offset": [-1, 0, 0], "state": "minecraft:iron_block"},
    {"offset": [0, 0, 1], "state": "minecraft:iron_block"},
    {"offset": [0, 0, -1], "state": "minecraft:iron_block"}
  ],
  "radius": 12
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `structure` | `List<RequiredBlock>` | `[]` | An inline structure: each entry is an `offset` (integer triple, relative to the controller) plus a `state`. |
| `structure_template` | `Identifier` | none | Use a structure template instead of an inline structure. **Exactly one of the two** must be present: both or neither fails to load. |
| `radius` | `NumberProvider` | **required** | Working radius in blocks. The radius is a **sphere**, not a block selection. |

The structure check is **exact per block**: `state` is a block id, or the vanilla `{"Name": "…", "Properties": {…}}` form when properties matter. `offset [0,0,0]` is the controller — **it does not require a block there**, so leaving it as air is a perfectly good design (many arrays are a ring around empty space).

The controller has a 3×3×3 tolerance: clicking one block off is not a failure, because the nearest position whose structure matches wins, and the clicked position itself always wins when it works.

## Step 2 — Adding a Buff Module

```json
"actions": [
  {
    "type": "mxt:buff",
    "abilities": ["example:body_tempering"],
    "target": "allies",
    "aura_zone": "example:misty_valley",
    "max_bonus": {"example:qi": 40}
  },
  {
    "type": "mxt:range_display",
    "particle": {"type": "minecraft:end_rod"},
    "shape": "ring",
    "points": 32
  }
]
```

`mxt:buff` is the module most arrays want:

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `abilities` | `HolderOrTag<ability>[]` | `[]` | Abilities granted to the targets inside, written as anywhere else. |
| `target` | `all\|allies\|owner` | `all` | Who benefits. `allies` consults the foe identification system (below). |
| `aura_zone` | `Holder<aura_zone>` | none | Treat the array as an aura zone: the aura inside becomes this zone's. |
| `max_bonus` | `Map<Holder<aura>, NumberProvider>` | `{}` | A bonus to the **ceiling** of that zone's aura, applied only to auras the zone already has. |

`mxt:range_display` only makes the array **visible**: `particle` is required, `shape` defaults to `"ring"`, `points` (`1..512`) to `32`, and `interval_periods` (`1..1200`) to `1`.

There are five module types in total: `mxt:none` (a placeholder), `mxt:attack`, `mxt:buff`, `mxt:protection` and `mxt:range_display`. **There is no separate "aura zone module"** — the aura zone is a field of `mxt:buff`.

::: tip `target: allies` and foe identification

`allies` goes through `FriendService`: only entities the owner counts as their own get the buff, and an entity **nobody can identify (`DEFAULT`) does not** — handing a stranger the owner's bonus is the failure this avoids. Config adds a second layer: `spare_friends` and **Server Config → Formations → Friend or Foe**. See [Foe Identification](../technical/identification.md).

:::

## Step 3 — Attack and Protection Modules

```json
// data/example/mxt/formation/ward_array.json
{
  "structure_template": "example:ward",
  "radius": 16,
  "spare_friends": true,
  "actions": [
    {
      "type": "mxt:protection",
      "block_break": true,
      "block_place": true,
      "explosions": true,
      "attack_entity": false,
      "spare_friends": true
    },
    {
      "type": "mxt:attack",
      "damage": 4,
      "damage_type": "minecraft:magic",
      "attribute_to_owner": true,
      "target_condition": {"type": "mxt:not", "condition": {"type": "mxt:formation_ally"}}
    }
  ]
}
```

**`mxt:attack`** says how hard it hits, never whom — that is what per-entity conditions are for:

| Field | Default | Effect |
| --- | --- | --- |
| `damage` | `0` | Damage per settlement. |
| `damage_type` | none | The damage type of the strike; without it the vanilla player/mob attack source is used. |
| `attribute_to_owner` | `true` | Whether the owner is credited (kill credit and aggro follow them). |
| `target_condition` | always true | A per-entity condition; **the condition runs first, the damage second**. |
| `effects` | `[]` | Effects applied alongside; they still fire when `damage` is 0. |

**`mxt:protection`** answers block and entity events: `block_break`, `block_place`, `block_interact`, `explosions`, `mob_griefing`, `entity_interact`, `attack_entity` and `item_use` all default to `true` (turn the rest off to guard breaking only), and `delegate_to_claims` defaults to `false` (hand the decision to a claim plugin).

At the top level there is also **`spare_friends`** (default `false`): when true, the runtime lets the owner and their friends through. Note that it is a different field from the same-named one inside the module — the top-level one decides whether the whole array skips friends, the module one decides whether protection stops them. Identification itself is also gated by **Server Config → Formations → Friend or Foe**: with that off, the top-level switch does nothing (and `DEFAULT` still stands the array down).

## Step 4 — Costs, Storage and Activation

```json
"activation_costs": [{"id": "example:qi", "amount": 200}],
"maintenance_costs": [{"id": "example:qi", "amount": 2}],
"storage": {"capacity": {"example:qi": 600}}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `activation_costs` | `List<ResourceCost>` | `[]` | Paid once on activation, out of the **activator's** own resources; a failure anywhere consumes nothing. |
| `maintenance_costs` | `List<ResourceCost>` | `[]` | Paid once per period; this is what decides how long the array lasts. |
| `storage` | object | none (off) | If present it must carry `capacity`: `Map<aura, NumberProvider>`. |

::: warning The cost lists swallow mistakes silently

Both lists use a tolerant list decoder: **a malformed entry is logged once and dropped** rather than failing the load. So a typo like `{"id": "example:qi", "amont": 200}` results in a **free formation** — it still activates, it just never pays.

`structure` and `actions`, by contrast, are strict lists: a mistake there fails the load outright. **Check the log after editing a formation**, not just whether it activates.

:::

Activation runs: occupancy → structure → claims → radius → event → pay the activation cost → write the index → mark the chunk's aura dirty → `activate_action`. Every period (20 ticks) it then looks for money in this order: **vein absorption → storage → the owner**. So an array can feed itself from the ley line under it; when that is not enough it eats into storage, then charges the owner, and if nothing can pay, a cancellable "upkeep failed" event fires and the array is dismantled unless somebody stops it.

`storage` exists so an array can keep running while its owner is away; capacity is tracked per aura, and whatever is left in it **dissipates** when the array comes down.

Activation and dismantling need no commands:

1. Get a formation plate (`mxt:formation_plate`).
2. `/mxt formation bind example:spirit_gathering_array` writes the formation into the plate in your main hand (gamemaster permission).
3. Right-click the controller while holding the bound plate. **An unbound plate identifies the formation under your feet by itself** (it compares every structure its allow list admits and the nearest wins; on by default, switchable with **Server Config → Formations → Plate Auto-Detect**).
4. Use the plate on an active controller again to dismantle it. You must be the owner or an operator; with **Server Config → Formations → Teammates Can Dismantle** on, the owner's friends may do it too.

## Step 5 — Letting the Array React to People

To make an array do something to the owner's own side, use the top-level `entity_enter_action`, `entity_tick_action`, `entity_exit_action` (per entity) and `activate_action`, `tick_action`, `deactivate_action` (for the array itself). They are ordinary entity and block actions, so a formation is exactly as expressive as the action types are.

A useful opener: a sound on the way in and on the way out.

```json
"entity_enter_action": {
  "type": "mxt:play_sound",
  "sound": "minecraft:block.beacon.activate",
  "volume": 0.6,
  "pitch": 1.4
},
"entity_exit_action": {
  "type": "mxt:play_sound",
  "sound": "minecraft:block.beacon.deactivate",
  "volume": 0.4,
  "pitch": 0.8
}
```

Per-entity actions fire only for entities **actually inside the sphere** and only for loaded entities; an unloaded chunk produces a spurious leave-and-enter pair, so enter actions should be **idempotent** — replaying a sound is fine, handing out a reward again is not.

## Step 6 — Verify

```text
/mxt registries validate
/mxt formation bind example:spirit_gathering_array
/mxt formation list
/mxt formation info
```

1. Lay out the structure and run `/mxt formation bind …` to write it into the plate.
2. Right-click the controller to activate. `/mxt formation list` then lists the id, controller position, radius, owner and the **number of upkeep periods already paid**.
3. Stand inside: `/mxt formation info` reports the arrays covering you (all of them when they overlap).
4. Watch the aura: if `aura_zone` points at a zone, query the aura inside the array and outside it and compare.
5. Break one block of the structure: nothing is announced, but once the next period's check fails the array is **dismantled silently** — it disappears from `list` and `info` stops reporting it.
6. To finish by hand, use the plate on the active controller once more.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The definition fails to load with a `structure_template` / `structure` error | Both were written, or neither; it must be **exactly one**. |
| Right-clicking the controller reports a structure mismatch | Blocks are compared exactly, so a differing block state (stair facing, open trapdoor) is not a match. |
| Activation reports an invalid radius | `radius` is not finite, or is ≤ 0. |
| The array activates but never pays | An entry of `activation_costs` / `maintenance_costs` has a misspelled **field name** — the tolerant decoder logs it and drops it. |
| It vanishes right after activating | The structure was broken after activation: it is checked every 20 ticks and dismantled silently on failure. |
| Protection lets one outsider through | Identification judged that entity `TRUE` (a friend); the top-level `spare_friends` together with **Server Config → Formations → Friend or Foe** decides this. |
| Nobody inside gets the buff | `target` is `allies` and nobody can be identified as one (`DEFAULT` grants nothing). |
| The aura zone has no effect | `aura_zone` takes a zone id, not an aura id; a zone that does not exist fails to parse. |
| `bind` says the plate cannot activate that formation | The formation is not in the plate's allow list (and with `empty_plate_allows_all` off, an empty list admits nothing). |

## Next

- [formation](../datapack/json/formation.md) — the full field list, structure templates, aura overrides and diagnostics.
- [Foe Identification](../technical/identification.md) — the judgement behind `spare_friends` and `target: allies`.
- [Aura Calculation](../technical/aura.md) — how aura zones and a formation drawing the environment actually work.
- [Commands](../player-guide/commands/formation.md) — every `/formation` subcommand and the plate's behaviour.
