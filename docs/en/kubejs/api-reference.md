---
title: KubeJS API Reference
description: "Complete method reference for the MiXianTu KubeJS bridge: MxtActions, MxtConditions, MxtValues, MxtCosts, MxtResources, the runtime domain APIs, MxtTriggers and MxtEvents."
---

# KubeJS API Reference

The MiXianTu KubeJS bridge provides a separate object per domain; it does not provide a `Mxt` root object carrying every method. All APIs that change game state must be called from `kubejs/server_scripts/`, and they enter the mod's existing server transactions and event flow.

The identifiers below — `id`, `resource`, `ability`, `curse`, `zone` and so on — are all namespaced strings, for example `mxt:spirit_power` or `example:fireball`. Passing an invalid identifier, or JSON that cannot be decoded by the matching codec, throws a script error directly, so that data problems can be located.

## Sub-pages

- [MxtActions: Script Actions](/en/kubejs/api/actions)
- [MxtConditions: Script Conditions](/en/kubejs/api/conditions)
- [MxtValues: Script Providers](/en/kubejs/api/values)
- [MxtCosts and MxtResources](/en/kubejs/api/costs)
- [Runtime Domain APIs](/en/kubejs/api/runtime)
- [MxtEvents: Events](/en/kubejs/api/events)

## Overview

| Global | Responsibility |
| --- | --- |
| `MxtActions` | Register `mxt:js` action callbacks, or run a built-in action. |
| `MxtConditions` | Register `mxt:js` condition callbacks, or test a built-in condition. |
| `MxtValues` | Register or evaluate number providers and resource value providers. |
| `MxtCosts` | Check or pay a single complete `Cost`. |
| `MxtResources` | Pay several resource costs atomically. |
| `MxtAbilities` | Cast, grant, revoke and query the abilities an entity holds. |
| `MxtCultivation` | Add cultivation progress and attempt a realm breakthrough. |
| `MxtCurses` | Apply (with an optional duration), release, remove and query curses. |
| `MxtAura` | Query, add and remove server-side aura areas. |
| `MxtElements` | Read the elements and element accumulation on an entity, and apply accumulation. |
| `MxtSpiritRoots` | Query, grant, remove and switch spirit roots on and off. |
| `MxtPhysiques` | Query, grant, remove and switch physiques on and off. |
| `MxtSouls` | Reclaim the transferable soul of an entity. |
| `MxtTriggers` | Publish custom trigger signals and subscribe scripts to them. |
| `MxtLoot` | Register script loot conditions and loot functions. |
| `MxtEvents` | Every MiXianTu server lifecycle event. |

`Entity`, `LivingEntity`, `Player`, `Level`, `BlockPos`, `ItemStack` and `DamageSource` are all vanilla Java objects exposed by KubeJS. A `JsonObject`/`JsonElement` parameter accepts a plain JavaScript object or array.

## Common Data Rules

### Number Provider

Every parameter that is a number provider, such as `amount` or `value`, accepts the following forms:

```js
10                                      // constant
'level * 2 + 1'                         // formula
{ type: 'mxt:uniform', min: 1, max: 3 } // built-in typed object
```

The formula context is created automatically by the called API from the entity or the level. The result computed by a script callback or a provider must be a finite number; `NaN`, `Infinity`, an exception or a callback that is not registered is logged and treated as `0`.

### `mxt:js` Callback Definitions

Actions, conditions, number providers, resource value providers, trigger matchers, costs, ability target selectors, loot conditions and loot functions all have a pre-registered `mxt:js` type. First register the callback in a server script:

```js
MxtActions.entity('example:heal', (entity, params) => {
  entity.heal(params.amount || 1)
})
```

Then use it in any matching data pack field:

```json
{
  "type": "mxt:js",
  "id": "example:heal",
  "params": { "amount": 4 }
}
```

An `id` is unique **within the same callback category**. KubeJS clears every callback before reloading server scripts and then re-runs the scripts, which register them again; do not put a registration in a client script that only runs once. When no callback is found, an action does not run, a condition returns `false`, a value returns `0`, and a warning is logged.

## Return Values and Errors

Java records returned by the service APIs always use Java accessors, for example `result.committed()`, rather than assuming that JavaScript fields exist. A failure usually does not throw: check the return values such as `failure()`, `committed()`, `advanced()` and `applied()`. An exception is only thrown when an API parameter is invalid, an identifier is invalid, JSON cannot be decoded by the matching codec, or a mutable setter is called on the wrong event phase.

An operation that only makes sense on the server refuses to run from a client script, so a script cannot desync a client: `MxtCosts.consume` and the state-changing methods of `MxtAbilities`, `MxtCultivation`, `MxtCurses`, `MxtAura`, `MxtSouls`, `MxtElements`, `MxtSpiritRoots`, `MxtPhysiques` and `MxtTriggers` return their failure result unchanged — for `MxtSpiritRoots` and `MxtPhysiques` that is a result whose `failure` is `SERVER_ONLY` (`MxtElements.attach` answers `0`) — and `MxtCosts.consume`, `MxtTriggers.subscribe` and `MxtTriggers.subscribeOnce` also write a single warning to the log instead of throwing. `MxtAura.addBox` is the exception: it needs a `ServerLevel` and throws otherwise.

`MxtActions.execute*` is deliberately not guarded, because the built-in actions decide their own side: an action whose JSON opts into client execution, such as a velocity action with its `client` flag, is meant to run where it is called.

See [KubeJS Examples](./examples.md) for complete combinations.
