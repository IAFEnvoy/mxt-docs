---
title: Realm Stage (realm_stage)
description: Defines one stage of a linear realm chain, including its breakthrough requirements and passive attributes.
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
| `aura` | `Holder<aura>` | **required** | The aura chain this stage belongs to. A stage only ever names one aura, and the aura is what names the stored value, so the chain is never keyed by the value itself. |
| `aura_share_weight` | `NumberProvider` | `1` | Weight used when sharing aura in the same chunk while `aura_zone.distribution` is `realm_weighted`. |
| `cultivate_condition` | `EntityCondition` | `mxt:always_true` | Environment conditions that allow cultivation at this realm; for example `mxt:aura_range` can require a minimum concentration. |
| `next_realm` | `Holder<realm_stage>` | none | The next realm of the linear chain; at most one. |
| `breakthrough_exp` | `NumberProvider` | `0` | The minimum cultivation progress count needed to break through from the current realm to the next one. |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | The maximum cultivation progress count that may be held in the current realm before advancing to the next one; once reached, no further cultivation progress is accepted. It must not be smaller than `breakthrough_exp`. |
| `breakthrough` | `CultivateConditions` | empty object | The breakthrough conditions checked after the minimum cultivation progress is reached. |
| `auto_breakthrough` | `Boolean` | `false` | Whether a breakthrough is attempted automatically while cultivation mode is running; when disabled, a breakthrough can only be triggered through a command, KubeJS or another server-side call. |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | Vanilla attribute modifiers granted by the current realm; an entry contains `attribute`, the vanilla modifier `id`/`amount`/`operation` and an optional `value` formula. |
| `costs` | `List<ResourceCost>` | `[]` | Breakthrough costs; each entry is an `id` and an `amount`. |
| `ability_requirements` | `HolderOrTag<ability>[]` | `[]` | Abilities that must be owned before breaking through. |
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

::: info Realm chains
A realm stage names exactly one aura and forms a linear chain through `next_realm`, so a chain is keyed by the aura definition rather than by the stored value; an aura has one chain and it only moves forward. The attachment stores the current realm and the cultivation progress under that aura, so nothing has to be resolved again to read a chain's state, and the server cache keeps the realm-to-aura mapping and the rank of every realm in its chain. An aura whose `first_realm` is missing has no chain at all.
:::

::: tip Conditions on the current stage
`mxt:realm` compares the entity's **current** stage against the given one. With the default `exact` comparison, naming the target stage inside the target stage's own `breakthrough` conditions can never pass; use `"comparison": "at_least"` to mean "this stage or later", or check a resource value instead.
:::

::: info First Breakthrough
The mortal stage uses the `start_exp` of the value's [aura definition](./aura.md) as both the first breakthrough threshold and its cap, while `first_realm` only determines the target of the first breakthrough. The first breakthrough uses the `breakthrough` conditions of the target first realm, and `start_cultivate_conditions` is only used for starting cultivation.
:::

