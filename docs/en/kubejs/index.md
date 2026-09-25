---
title: KubeJS
description: "How to use the optional KubeJS integration of MiXianTu: register content items in a startup script, attach them to the framework with binding tables, and script rules and events."
---

# KubeJS

KubeJS is well suited to registering concrete items, blocks, recipes and content objects; MiXianTu reads those objects and gives them rules through binding tables. Do not modify server attachments directly in a script, and do not bypass cost validation.

## What the Integration Gives You

The KubeJS bridge is optional. It exposes **one global object per domain** instead of a single `Mxt` root object:

| Global | Responsibility |
| --- | --- |
| `MxtActions` | Register `mxt:js` action callbacks, or run a built-in action. |
| `MxtConditions` | Register `mxt:js` condition callbacks, or test a built-in condition. |
| `MxtValues` | Register or evaluate number providers and resource value providers. |
| `MxtCosts` | Check or pay a single complete cost. |
| `MxtResources` | Pay a whole `Cost` array atomically. |
| `MxtAbilities` | Cast, grant, revoke and query the abilities an entity holds. |
| `MxtCultivation` | Add cultivation progress and attempt a realm breakthrough. |
| `MxtCurses` | Apply (with an optional duration), release, remove and query curses. |
| `MxtAura` | Query, add and remove server-side aura areas. |
| `MxtElements` | Read the elements and element accumulation on an entity, and apply accumulation. |
| `MxtSpiritRoots` | Query, grant, remove and switch spirit roots on and off. |
| `MxtPhysiques` | Query, grant, remove and switch physiques on and off. |
| `MxtQuality` | Read the quality a stack resolves to and its chain, write the override component, or climb one tier. |
| `MxtSouls` | Reclaim the transferable soul of an entity. |
| `MxtTriggers` | Publish custom trigger signals and subscribe scripts to them. |
| `MxtLoot` | Register script loot conditions and loot functions. |
| `MxtEvents` | Every MiXianTu server lifecycle event. |

Every object has its own page; the full method tables, the common data rules (number providers, `mxt:js` callbacks) and the error model are in the [KubeJS API Reference](./api-reference.md).

Every API that changes game state must be called from `kubejs/server_scripts/`, and it goes through the mod's existing server transactions and event flow; a client script should only read.

## When You Need KubeJS

The mod is a framework, not a content pack:

- A data pack can define rules, but it cannot create a new item, block or recipe.
- If everything you need to bind already exists — vanilla items, items from another mod, or items the mod ships with — plain data pack JSON is enough, and KubeJS stays optional.
- Register content with KubeJS when you want your own items, food, tools or recipes, then bind those real item IDs to the framework.
- Scripted callbacks are optional too: conditions, actions and number providers can also be written entirely as data pack JSON with the built-in types.

## The Shortest Path

**One.** Register the item in a startup script:

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('fire_root_pellet')
    .displayName('Fire Root Pellet')
    .food(food => food.hunger(2).saturation(0.2))
})
```

**Two.** Attach rules to its real ID with a binding table:

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "actions": [
    { "type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root" }
  ]
}
```

The four binding tables (item, weapon, pill and technique) are documented with examples in [Items and Bindings](./items.md).

**Three.** (Optional) provide a callback from a server script, then name it from a data pack field:

```js
MxtActions.entity('example:heal', (entity, params, context) => {
  entity.heal(params.amount || 1)
})
```

```json
{ "type": "mxt:js", "id": "example:heal", "params": { "amount": 4 } }
```

**Four.** Use the table below to make the change take effect.

## Reloading and Restarting

| What changed | How it takes effect |
| --- | --- |
| Startup scripts (items, blocks, recipes) | **Restart the game**; `/reload` never re-runs startup scripts. |
| Binding tables and other data pack definitions | **Reload the world**; they are registries, read while the world loads. |
| Server scripts (callbacks, event subscriptions) | `/reload` clears every callback and re-runs the scripts, so callbacks register again; runtime subscriptions a script armed are its own to re-arm. |

## Next

- [Items and Bindings](./items.md) — the fields and examples of the four binding tables.
- [KubeJS API Reference](./api-reference.md) — 17 global objects, one page each.
- [Examples](./examples.md) — complete scripts that combine several objects.
- [Create Items with KubeJS](../tutorial/create-items-with-kubejs.md) — the step-by-step walkthrough.
- [Items](../player-guide/items.md) — the items the mod itself provides.
