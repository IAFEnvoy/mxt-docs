---
title: Formation Module Types
description: Every built-in module of mxt:formation_action_type, with its fields, defaults and decision rules.
---

# Formation Module Types

## `formation_action_type`

The `actions` array of a [formation](../../json/formation.md) holds these function modules. Each entry picks a module by writing its ID in `type` and carries only the fields it needs — structure, radius, costs and lifecycle hooks stay at the top level of the formation. A datapack only picks an existing module and never adds one; an unknown `type` fails the load rather than degrading into doing nothing.

The same module may appear more than once, and the list is not merged: two attack modules with different parameters are two strikes.

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
  ]
}
```

### `mxt:none`

An empty module that does nothing. It is also the default entry of this dispatch table.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:none"}
```

### `mxt:attack`

Attacks entities inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `0` | Damage applied per hit |
| `damage_type` | Damage type ID | none | Damage type used for the hit |
| `attribute_to_owner` | Boolean | `true` | Whether the formation owner is credited as the attacker |
| `effects` | Array | `[]` | Status effects applied on each hit; each entry writes `effect` / `duration_ticks` / `amplifier` |
| `target_condition` | `EntityCondition` | always true | An extra filter on the target entity, evaluated after the friend-or-foe decision |

```json
{"type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt"}
```

This module only says **what** to hit, not **who** to hit: it hits every entity the formation covers, and whether the owner and friends are spared is up to the top-level `spare_friends`. Without `damage_type` the vanilla "the owner hit it" reading applies.

Every hit goes through the shared damage pipeline: the owner (when `attribute_to_owner` is true) takes part as the attacker in element overcoming, and the entity hit gets reduction from its own element adaptation. When the damage resolves to a non-finite value or one ≤ 0 the hit is not struck, but `effects` are applied as usual — the default `damage: 0` is a formation that only applies status effects and deals no damage.

### `mxt:buff`

Grants abilities to entities inside the radius, overrides the aura zone of the area and raises aura capacity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | List of ability IDs | `[]` | Abilities granted to matching entities |
| `target` | Enum | `all` | Which entities the module applies to: `all`, `allies` or `owner` |
| `aura_zone` | Aura zone ID | none | Covers the ambient aura of this ground with that zone |
| `max_bonus` | Map from aura ID to `NumberProvider` | `{}` | Extra aura capacity per aura |

```json
{"type": "mxt:buff", "abilities": ["example:blessing"], "target": "allies"}
```

The three `target` settings are one rule at three widths: `all` filters nothing; `allies` requires the friend check to answer `true` and gives nothing when it cannot identify; `owner` only reads the formation's ownership list. A granted ability is revoked automatically when the entity leaves the radius, when the formation is dismantled, or when it is no longer selected.

`max_bonus` is only applied together with the `aura_zone` override: with no `aura_zone` there is nowhere to add it, and an aura the zone does not provide cannot be raised either (it does not conjure aura out of nothing). When several bonuses land on the same aura, the highest wins.

Attribute bonuses do not look for a field here: granting an `mxt:modifier` ability is the same as granting its attribute modifiers.

### `mxt:protection`

Denies each listed kind of interference inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_break` | Boolean | `true` | Deny block breaking |
| `block_place` | Boolean | `true` | Deny block placing |
| `block_interact` | Boolean | `true` | Deny block interaction |
| `explosions` | Boolean | `true` | Deny explosions |
| `mob_griefing` | Boolean | `true` | Deny mob griefing |
| `entity_interact` | Boolean | `true` | Deny entity interaction |
| `attack_entity` | Boolean | `true` | Deny attacking entities |
| `item_use` | Boolean | `true` | Deny item use |
| `spare_friends` | Boolean | `true` | Exempt the owner's friends |
| `delegate_to_claims` | Boolean | `false` | Hand protection over to a claim plugin |

```json
{"type": "mxt:protection", "spare_friends": true}
```

All nine switches default to `true`: declaring this module is that whole sentence, and you write `false` explicitly for the one thing you want to open up.

The decision looks at both ends of the action: if the actor, or the block / entity being acted on, is inside the radius, the switch applies. `item_use` has no target, so only the actor is looked at; explosions and mob griefing have no actor and only look at the position, so the owner's own explosion is blocked too.

The owner (any name on the ownership list) is always exempt. The friend exemption needs `spare_friends` to be true **and** the server setting "Formations → Friend or Foe" to be on; when it cannot tell friend from foe it protects as usual.

When `delegate_to_claims` is true and a claim protection really is in force, not one of the nine switches above is enforced and what actually stops people is the claim plugin's rules; the cost is that only claimed places are protected then, and the formation's own `radius` no longer takes part in the decision. What happens with no claim protection in force is decided by the server setting "Compat → Delegation Needs Claim Protection". `attack_entity` blocks melee swings, so an arrow shot from inside the formation does not count as the attacker attacking when it lands and is not blocked.

### `mxt:range_display`

Draws the radius outline with particles.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `particle` | Particle options | **required** | Particle drawn along the outline |
| `interval_periods` | Integer `1..1200` | `1` | Maintenance periods between two redraws |
| `points` | Integer `1..512` | `32` | Number of points on the outline |
| `shape` | Enum | `ring` | Outline shape: `ring` or `sphere` |

```json
{"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
```

This module only acts on the formation itself, touches no entity, and runs before the formation's `tick_action`. `interval_periods` counts maintenance periods rather than ticks, because dispatch only ever lands on period boundaries anyway; `ring` is a circle at the controller's own height, and `sphere` spreads the same number of points over the whole sphere.
