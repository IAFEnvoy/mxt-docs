---
title: Cultivate Action (cultivate_action)
description: Defines a named cultivation activity with its environment requirements, costs and per-tick settlement.
aside: false
---

# Cultivate Action (cultivate_action)

A `cultivate_action` defines a named cultivation activity: when cultivation may start and continue, how often absorption is settled, and which aura is consumed or gained.

::: warning Marked for possible removal

`CultivateAction` carries a `//TODO::May be removed`. It is the datapack-shaped spelling of "what an entity does while cultivating"; if that whole process is ever folded back into the state attachment (progress, realm and fuel all live there), this registry would go away together with `CultivationModeService`, `CultivationActionService`, `AuraDistributionService`, the `cultivate_*` fields on the `mxt:cultivation` attachment and the `/mxt cultivate` toggle. **Declaring one is fully supported today** — just do not treat it as a foundation that cannot move.

:::

## File Location

Cultivate action files go in `data/<namespace>/mxt/cultivate_action/` within your datapack.

**Purpose**: The cultivation process and its environment requirements. **Marked as possibly removable.**

The filename corresponds to its ID. For example, `data/example/mxt/cultivate_action/meditate.json` has the ID `example:meditate`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `cultivate_action.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `cultivate_action.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `default` | Boolean | `false` | Whether this is the default behaviour when no cultivation behaviour has been selected; when nothing is marked, the first behaviour in the registry is used. |
| `start_condition` | `EntityCondition` | `mxt:always_true` | Condition for starting cultivation, checked once when cultivation starts. |
| `condition` | `EntityCondition` | `mxt:always_true` | Condition for continuing cultivation, checked before every settlement; cultivation is aborted while the condition is false. |
| `tick_interval` | Integer | `20` | Absorption settlement interval, range `1..72000`. |
| `costs` | `List<Cost>` | `[]` | Paid by the cultivating entity on each cultivation tick, all or nothing as one array; see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `absorb_amount` | `NumberProvider` | `1` | Multiplier for the natural recovery of the current realm resource during cultivation; the resource bar is filled first and the overflow enters cultivation progress. |
| `aura_costs` | `List<Cost>`, limited to `mxt:aura` entries | `[]` | Paid each cultivation tick from the **shared aura pool** at the cultivator's position; when several players cultivate in the same chunk the amount is scaled first by the pool's allocation and the pool is then charged **all or nothing**. Only `mxt:aura` entries are accepted (any other type is a load error); the older `{"<aura id>": NumberProvider}` map form is still read for compatibility, but the array form is what gets written. An `amount` of `0` is no longer ignored: like every other cost it has to evaluate to a finite positive number, or the entry cannot be paid. See [Shared Data Types · `Cost`](../types/shared_data_types.md#cost). |
| `aura_gains` | `List<AuraGain>` | `[]` | Additional aura gained. Each entry is `{id, amount}`, whose `id` is a `Holder<aura>`. |
| `cooldown` | Integer | `0` | Cooldown in ticks after stopping, range `0..72000`. |
| `tick_action` | `EntityAction` | `mxt:no_op` | Behaviour executed on every cultivation tick. |

There is no separate "environment kind" field: where a technique may be practised is expressed entirely by `start_condition` (checked once at the start) and `condition` (checked before every settlement), both of which can read the environment — `mxt:aura_range` requires a concentration range of some aura, `mxt:dimension` requires a dimension, and block or biome conditions require the place underfoot. This is the other side of `aura_zone.cultivate_condition`: that one is the environment declaring whether cultivation is allowed here, these two are the technique declaring what it needs.

Its numeric fields are evaluated with the resource and cultivation variables of the value being cultivated (`realm_rank`, `absorbed_aura`, …) in addition to the entity variables; see [Formula Variables](../types/formula_variables.md).

## Example

```json
{
  "default": true,
  "start_condition": {"type": "mxt:always_true"},
  "condition": {"type": "mxt:always_true"},
  "tick_interval": 20,
  "costs": [{"id": "example:stamina", "amount": 1}],
  "absorb_amount": 1.5,
  "aura_costs": [{"type": "mxt:aura", "aura": "mxt:common", "amount": 2}],
  "aura_gains": [{"id": "mxt:common", "amount": "1 + realm_rank * 0.1"}],
  "cooldown": 100,
  "tick_action": {"type": "mxt:no_op"}
}
```

::: info Realm Restrictions
Cultivation absorption by default only restores the resource that belongs to the current realm, and the realm stage a resource belongs to can additionally restrict cultivation through its `cultivate_condition`.
:::

