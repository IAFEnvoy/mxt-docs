---
title: 'MxtAbilities: Abilities'
description: Cast an ability, and grant, revoke or query the abilities an entity holds together with the source ledger that keeps them alive.
---

# `MxtAbilities`: Abilities

`MxtAbilities` answers "which abilities does this body hold, and who granted them", and casts one in place. Granting, revoking and querying all read the same source ledger, and casting goes through the very same gate a data pack ability does (conditions, costs, cooldown).

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `use(entity, ability)` | `Entity`, ability ID | `AbilityService.UseResult` | Casts an ability the entity already holds; server only. |
| `selector(id, callback)` | Callback ID, `(actor, context, params) => Entity[]` | `void` | Registers the datapack type `mxt:js` ability target selector. |
| `grant(entity, ability, source)` | `Entity`, ability ID, source ID (`namespace:path`) | `boolean` | Grants the ability under that source; `true` when the source was not holding it yet. An unknown ability answers `false` (not an error), and nothing is changed on a client. |
| `revoke(entity, ability, source)` | `Entity`, ability ID, source ID | `boolean` | Drops that one source, and `true` when it was really holding it. **The ability itself only leaves once the last source lets go**, which is also when its cooldowns and its stored state go. |
| `has(entity, ability)` | `Entity`, ability ID | `boolean` | Whether it is held; read from the attachment, so a disabled or deleted definition still answers honestly. |
| `list(entity)` | `Entity` | `List<String>` | Every ability the entity holds right now, sorted by ID. |
| `sources(entity, ability)` | `Entity`, ability ID | `List<String>` | Which sources are keeping it granted right now, sorted; empty when it is not held. |

Abilities and curses are granted through the same source ledger: **it exists while at least one source holds it**, and the last source letting go is what removes it. A source must be a namespaced identifier such as `example:quest_reward`, and anything else throws. Granting, revoking and querying all only take effect on the server, where a client call answers `false` or an empty list and changes nothing.

The result record of `use`: `committed()` means it completed immediately, `casting()` means the cast has started, `failure()` is the failure enum, `failedResource()` is the ID of the insufficient resource, and `amounts()` are the resources actually paid.

```js
const result = MxtAbilities.use(player, 'example:fireball')
if (result.failure() !== null) console.warn(String(result.failure()))
```

## Ability Target Selectors

`selector` registers the ability target selector with the datapack type `mxt:js`. Return the entities to affect as an array; `null` entries are dropped:

```js
MxtAbilities.selector('example:nearest_three', (actor, context, params) => {
  const range = params.range || 8
  const found = []
  actor.level().getEntities(actor, actor.getBoundingBox().inflate(range))
    .forEach(entity => found.push(entity))
  found.sort((a, b) => a.distanceToSqr(actor) - b.distanceToSqr(actor))
  return found.slice(0, 3)
})
```

```json
{
  "target_selector": {"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}},
  "bi_entity_action": {"type": "mxt:heal", "amount": 4}
}
```

## Related

- Data pack side: [`ability`](/en/datapack/json/ability), [`artifact`](/en/datapack/json/artifact) and [`technique`](/en/datapack/json/technique).
- The other user of the same source ledger: [MxtCurses](/en/kubejs/api/curses).
- Callbacks around a cast: `abilityUse` and `abilityTriggered` in [MxtEvents](/en/kubejs/api/events).
- [KubeJS API Reference](/en/kubejs/api-reference).
