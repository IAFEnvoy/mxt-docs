---
title: Item Archetype (item_archetype)
description: An item archetype gives a cultivation artifact its spirit power capacity, storage, flight and granted abilities.
---

# Item Archetype (item_archetype)

An item archetype describes the static rules of a cultivation artifact: how much spirit power it stores, how it flies and which abilities it grants.

## File Location

Item archetype JSON files go in `data/<namespace>/mxt/item_archetype/` within your data pack.

**Purpose**: Artifact archetypes and abilities.

The filename corresponds to its ID. For example, `data/example/mxt/item_archetype/bound_sword.json` has the ID `example:bound_sword`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `item_type` | String | **required** | The artifact classification identifier. It has no consumer: nothing in the mod reads it, so it is a declared classification only. |
| `spirit_capacity` | `NumberProvider` | `0` | The artifact's spirit energy capacity. This is the source of the capacity an artifact is charged against; the `capacity` of the [`mxt:charge_artifact`](../types/action/item_action_types.md) action is only the fallback. |
| `storage_slots` | `NumberProvider` | `0` | The number of storage slots. |
| `flight_speed` | `NumberProvider` | `0` | The flight speed. A value of `0` means the artifact provides no flight. |
| `flight_costs` | `List<ResourceCost>` | `[]` | The flight cost. |
| `granted_abilities` | `Holder<ability>[]` | `[]` | The abilities the artifact grants. |
| `refine_action` | ItemAction | `mxt:no_op` | The action run on the holder and on the item when the artifact is refined. |

## Spirit Capacity

`spirit_capacity` is what a charge of spirit energy is measured against, so the number a data pack writes here is what decides how much an artifact holds. The `capacity` an `mxt:charge_artifact` action declares is the **fallback**, used only when the stack has no archetype, when the archetype it names no longer exists — a data pack reload can remove an entry a save still points at — or when the declared value is not a positive finite number. An unreadable fallback resolves to `0`, and a store that cannot say how much it holds refuses the energy rather than throwing.

Charging an artifact also feeds it: `ArtifactStateComponent.nourishment` rises by `accepted / capacity`, clamped to `0..1`, and only ever rises, so an artifact that was fed keeps what it was fed after the energy it took in has been spent again. The capacity a write is measured against is `spirit_capacity × (1 + 0.5 × nourishment)`, which means a fully fed artifact holds up to `1.5 ×` its declared capacity. A data pack can read a stack's nourishment through the generic [`mxt:component`](../types/condition/item_condition_types.md) item condition.

## Refine Action

`refine_action` uses the existing `ItemAction` dispatch, so a single action or an array of actions may be inlined directly.

## Example

```json
{
  "item_type": "artifact",
  "spirit_capacity": 100,
  "storage_slots": 0,
  "flight_speed": 0,
  "flight_costs": [],
  "granted_abilities": ["mxt_test:artifact_guard"]
}
```

`granted_abilities` refers to entries of the ability registry described in [Ability](./ability.md).

