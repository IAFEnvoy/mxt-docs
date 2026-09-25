---
title: Add an Ability
description: Define an active and a triggered ability, give them costs, conditions and targets, grant them from realms or items, and put them on the wheel.
---

# Add an Ability

An `ability` is the unit of gameplay a player spends aura on. It carries its own costs, cooldown, condition, target selection and behaviour, which means a single JSON file can describe a bolt, a buff, a passive bonus or a reaction to being hit.

This tutorial adds two abilities to the example pack: an active bolt cast from the wheel, and a triggered recovery that answers damage.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/ability/qi_bolt.json` | An active ability with a cost, a cooldown and an area target. |
| `data/example/mxt/ability/qi_recovery.json` | A triggered ability that reacts to being hurt. |
| `data/example/mxt/realm_stage/foundation.json` | *(edited)* grants the bolt on breakthrough. |
| `data/example/mxt/item_binding/root_pellet.json` | *(edited)* also grants the recovery ability. |
| `data/example/mxt/technique/azure_breath.json` | *(edited)* grants both once learned. |

## Step 1 — An Active Ability

```json
// data/example/mxt/ability/qi_bolt.json
{
  "type": "mxt:active",
  "icon": "example:textures/gui/ability/qi_bolt.png",
  "costs": [
    {"type": "mxt:resource", "resource": "example:qi", "amount": 10}
  ],
  "cast_time": 10,
  "cooldown": 40,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "target_selector": {"type": "mxt:area", "radius": 6, "include_actor": false},
  "bi_entity_action": {
    "type": "mxt:target_action",
    "action": {"type": "mxt:damage", "amount": "6 + caster_level * 0.5"}
  }
}
```

| Field | What it does |
| --- | --- |
| `type` | Selects the lifecycle from the built-in `ability_type` registry, written **at the top level** (not inside a nested `ability` object): `empty`, `active`, `triggered`, `modifier`, `aura`, `channelled`, `composite`, `word`, `flight`, `storage`, `upkeep`. `mxt:active` is the type that can be put on the wheel. |
| `icon` | Optional. A bare string is a 16x16 GUI texture; an object is an item stack template (`{"id": ...}`, optionally `count` and `components`). Without it the entry is drawn with its name. |
| `costs` | A list of `Cost` objects, paid before the behaviour runs, all or nothing as one array. `mxt:resource` spends a value, `mxt:aura` charges the value that aura is measured in, `mxt:item` spends items, `mxt:js` delegates to a script (which runs last), and the `{"id": ..., "amount": ...}` shorthand means `mxt:resource`. |
| `cast_time` | Cast duration in ticks. |
| `cooldown` | Cooldown in ticks, reported back to the client so the wheel can draw that sector dark and say "On cooldown 4.3s" - the seconds left, always one decimal. |
| `condition` | An entity condition that must pass before the ability can be used. Its only job here is to keep Mortals from throwing bolts. For a passive `mxt:modifier` or `mxt:aura` ability the same field keeps working after the cast: it is re-checked every tick and the passive effect is withdrawn while it fails. |
| `target_selector` | Which entities the bi-entity behaviour applies to. `mxt:self` (the default) selects only the caster; `mxt:area` selects everything within `radius` (capped at 128), and `include_actor` decides whether the caster is part of that set. |
| `bi_entity_action` | Run for each selected target, and a failing one never stops the rest. `mxt:target_action` forwards an entity action to the target — here 6 damage plus half the caster's experience level. |
| `entity_action` | Runs on the caster. It defaults to `mxt:no_op`; use it for a self-buff, a particle burst or an aura change. |

Two extra fields are worth knowing about:

- `components` adds state instead of a plain number: `mxt:charges`, `mxt:cooldown`, `mxt:toggle`, `mxt:timer`, `mxt:resource` and `mxt:target_lock`. Each of them declares a storage slot, and the values live in the ability attachment that owns the grant, addressed by the ability's id; see [Data Storage Types](/en/datapack/types/other/ability-and-curse#data-storage-type) for which of them anything actually reads yet.
- `element_affinity` lists elements (or element tags) the ability belongs to. When it is not empty, the formula variable `element_modifier` becomes available; the **damage** side is handled for you — layer one of the [damage pipeline](/en/technical/damage) multiplies it in itself, so do not write `* element_modifier` by hand when writing a damage number (that would be the same number multiplied twice). Read the variable explicitly only when scaling something that is not damage, such as **costs** or **duration**.

::: warning Where realm ranks come from

An ability formula runs in an *entity* context. It provides `caster_health`, `caster_max_health`, `caster_level` (the vanilla experience level), `caster_<resource>` and `caster_<attribute>` — but not `realm_rank`, which only exists in formulas evaluated for one resource. Use `caster_example_qi` when an ability should scale with the caster's aura.

:::

## Step 2 — A Triggered Ability

A triggered ability fires when the world does something to its owner. The trigger also injects a few variables that describe what happened.

```json
// data/example/mxt/ability/qi_recovery.json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:hurt"}],
  "chance": 1,
  "cooldown": 100,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "costs": [
    {"type": "mxt:resource", "resource": "example:qi", "amount": 5}
  ],
  "entity_action": {"type": "mxt:heal", "amount": "2 + damage * 0.5"}
}
```

- `triggers` is a list of built-in matchers: `tick`, `attack`, `hurt`, `kill`, `block_break`, `block_use`, `item_use`, `equip`, `death`, `breakthrough` and `technique_stage`. None of them takes a field of its own.
- `chance` is a number provider, `1` by default, and it is rolled per matching trigger.
- The `hurt` trigger adds `damage` — the damage actually inflicted — which is why the heal can scale with the hit. The other triggers add their own names: `target_health` and `target_is_living` for `attack`, `block_x/y/z` for block events, `use_duration` for `item_use`, and so on.

The full variable table is in [Formula Variables](../datapack/types/formula_variables.md#trigger-values).

## Step 3 — Granting the Abilities

Defining an ability does nothing on its own: an entity has to hold it. The `mxt:grant_ability` entity action does that, and its `source` field records who granted it.

**From a realm.** Edit the realm the player reaches:

```json
// data/example/mxt/realm_stage/foundation.json
"success_action": {
  "type": "mxt:grant_ability",
  "ability": "example:qi_bolt",
  "source": "example:foundation"
}
```

`success_action` runs on the stage the player just entered, so reaching Foundation Establishment teaches the bolt. `ability_requirements` on a stage is the mirror image: it lists abilities that must already be held before the breakthrough is allowed.

**From an item.** Add the action to any binding table:

```json
// data/example/mxt/item_binding/root_pellet.json
"actions": [
  {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"},
  {"type": "mxt:grant_ability", "ability": "example:qi_recovery", "source": "example:root_pellet"}
]
```

**From a spirit root, physique or technique.** Those definitions have a `granted_abilities` list that is applied while they are held:

```json
// data/example/mxt/technique/azure_breath.json
"granted_abilities": ["example:qi_bolt", "example:qi_recovery"]
```

::: tip Source identities

Keep `source` stable and meaningful — the definition ID that granted the ability is a good choice. Abilities from different sources are tracked separately, and a source is what makes a later removal traceable, so two items can grant the same ability without one of them silently revoking the other.

:::

## Step 4 — Putting the Ability on the Wheel

Active abilities can be put on the twelve-sector wheel that abilities and spirit power share (a main wheel plus pages read from what you carry):

1. Type `/wheel` in chat (the client command, the same as the "Open Wheel Configuration" key, unbound by default) to open the **wheel editor**: six columns of spirit power on the left, six columns of abilities on the right, and one row of twelve shared cells underneath which are the **main wheel**'s twelve cells (`1` is straight up, counting clockwise). Left-click the bolt in the right pool to pick it up, then click a cell to put it there, and press `Escape` to save and close. A cell you deliberately leave empty stays empty, and a saved cell whose definition no longer exists shows a red `?` and is **never replaced by something else**.
2. Hold "Wheel Menu" (`R` by default) and point at that cell - pointing is what changes the **selection**, which is never empty: the wheel opens with the **first cell that holds anything** already selected (that is where the gold frame sits before you move the pointer), and pointing at an empty cell leaves the selection where it was. Letting go of `R` only closes the wheel and casts nothing. Press "Use Wheel Selection" (`V` by default) to cast it, and the wheel stays open so you can move to another cell and press it again; with the wheel closed `V` spends **the cell the number you chose stands for right now** (a number addressing a page that is gone falls back to the last cell holding anything, and is never rewritten), and a left click is the same as `V`. The "Wheel Grid" on the left of the screen is a four-column view of the whole wheel, one row per three cells of a page, and the cell outlined in gold is what `V` would spend.
3. Everything is server-authoritative: the client only sends which kind and which id was used, and the server decides the grant, the conditions, the costs, the cooldown, the duration and the effects.

## Step 5 — Verify

Abilities are a data pack registry, so load the world again rather than running `/reload`:

```text
(load the world again)
/mxt registries validate              → no codec errors
/mxt attachment status                → lists the abilities the entity holds
/mxt ability cast example:qi_bolt     → forces the cast (gamemaster permission)
```

1. Before entering the chain, `/mxt ability cast example:qi_bolt` fails: the `condition` rejects it.
2. Break through to Foundation Establishment and check `/mxt attachment status`. The bolt is now held, and `source` shows it came from the realm.
3. Cast it from the wheel (hold `R`, point at the sector you put it in, then press `V`). `10` qi is deducted, the cooldown starts, and nearby entities take damage. Compare the value shown by `/mxt resource example:qi` before and after.
4. Set the pool too low with `/mxt resource example:qi set 5` and cast again: the cast is refused because the costs cannot be paid, and nothing is deducted.
5. Take a hit with `qi_recovery` granted: the heal amount scales with the damage taken, `5` qi is spent, and the 100-tick cooldown prevents it from firing again immediately.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The ability never appears in the wheel's pool | The pool lists the **skills that need a key**; triggered and passive abilities have no wheel entry of their own. |
| A channelled ability cannot be released from the wheel | `mxt:active` and `mxt:channelled` are mutually exclusive types. Wrap the channelled ability as the child of an `mxt:composite` ability and make the composite the top-level definition. |
| Costs are never paid | An entry needs a `type` together with its own fields, such as `{"type": "mxt:resource", "resource": ..., "amount": ...}`, or the `{"id": ..., "amount": ...}` shorthand — not `{"resource": ...}` without a `type`. |
| An ability formula is always `0` | It used a variable its context does not provide, such as `realm_rank` in an entity formula. The name is reported at evaluation time: a development environment logs the whole error, production logs one warning line per distinct message, and both continue with `0`. |
| `mxt:word` does nothing | It is a terminal, code-whitelisted effect (`self_heal`, `purge_self_curses`) and requires an operator by default. It is not a way to run commands. |
| Everyone has the ability immediately | It was granted by a `granted_abilities` list on a spirit root, physique or technique that everybody satisfies — those lists apply while the definition is held. |

## Next

- [Ability](../datapack/json/ability.md) — the full field list, including components and channelled upkeep.
- [Action Types](../datapack/types/action/entity_action_types.md) and [Condition Types](../datapack/types/condition/entity_condition_types.md) — everything an ability can do and check.
- [Loot and Advancement Criteria](../datapack/loot-and-criteria.md) — rewards and advancements that react to breakthroughs and ability use.
