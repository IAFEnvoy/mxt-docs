---
title: KubeJS
description: "How to use the optional KubeJS integration of MiXianTu: register content items in a startup script, attach them to the framework with binding tables, and script rules and events."
---

# KubeJS

KubeJS is well suited to registering concrete items, blocks, recipes and content objects; MiXianTu reads those objects and gives them rules through binding tables. Do not modify server attachments directly in a script, and do not bypass cost validation.

- **[KubeJS Items and Bindings](./items.md)** — register an item in a startup script and attach rules to it with the binding tables.
- **[KubeJS API Reference](./api-reference.md)** — the script objects, their methods and the events.
- **[KubeJS Examples](./examples.md)** — complete scripts.
- **[Create Items with KubeJS and Bind Them](../tutorial/create-items-with-kubejs.md)** — the same material as a step-by-step walkthrough.
- **[Items](../player-guide/items.md)** — the items the mod itself provides.

## What the Integration Gives You

The KubeJS bridge is optional. It exposes one global object per domain instead of a single `Mxt` root object:

| Global | Responsibility |
| --- | --- |
| `MxtActions` | Register `mxt:js` action callbacks, or run a built-in action. |
| `MxtConditions` | Register `mxt:js` condition callbacks, or test a built-in condition. |
| `MxtValues` | Register or evaluate number providers and resource value providers. |
| `MxtCosts` | Check or pay a single complete cost. |
| `MxtResources` | Pay several resource costs atomically. |
| `MxtAbilities` | Cast, grant, revoke and query the abilities an entity holds. |
| `MxtCultivation` | Add cultivation progress and attempt a realm breakthrough. |
| `MxtCurses` | Apply (with an optional duration), release, remove and query curses. |
| `MxtAura` | Query, add and remove server-side aura areas. |
| `MxtSouls` | Reclaim the transferable soul of an entity. |
| `MxtTriggers` | Publish custom trigger signals and subscribe scripts to them. |
| `MxtLoot` | Register script loot conditions and loot functions. |
| `MxtEvents` | Every MiXianTu server lifecycle event. |

Every API that changes game state must be called from `kubejs/server_scripts/`, and it goes through the mod's existing server transactions and event flow. See the [API Reference](./api-reference.md) for the method signatures.

## When You Need KubeJS

The mod is a framework, not a content pack:

- A data pack can define rules, but it cannot create a new item, block or recipe.
- If everything you need to bind already exists — vanilla items, items from another mod, or items the mod ships with — plain data pack JSON is enough, and KubeJS stays optional.
- Register content with KubeJS when you want your own items, food, tools or recipes, then bind those real item IDs to the framework.
- Scripted callbacks are optional too: conditions, actions and number providers can also be written entirely as data pack JSON with the built-in types.

## Registering Content Items

The item itself is registered by KubeJS in a startup script:

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('jade_token').displayName('Jade Token')
})
```

A larger script can register food and tools in the same pass:

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('fire_root_pellet')
    .displayName('Fire Root Pellet')
    .food(food => food.hunger(2).saturation(0.2))

  event.create('returning_pill')
    .displayName('Returning Pill')
    .food(food => food.hunger(1).saturation(0.1))

  event.create('firebound_sword', 'sword')
    .displayName('Firebound Sword')
    .tier('diamond')
})
```

::: warning

Register the item itself and bind it by its real item ID. Do not create `mxt:item`, `mxt:pill` or `mxt:weapon` files for it.

:::

## Attaching Items with Binding Tables

MiXianTu is responsible for behaviour, conditions, aura, currency and tooltips; the binding tables in your data pack connect a registered item to those rules. Each of the following files lives under `kubejs/data/<namespace>/mxt/<registry>/`.

Bind a pill that grants a spirit root:

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "quality_group": "#example:group/pellet",
  "actions": [
    {
      "type": "mxt:grant_spirit_root",
      "spirit_root": "example:fire_root"
    }
  ]
}
```

Bind a weapon's damage and attack speed:

```json
// kubejs/data/example/mxt/weapon_binding/firebound_sword.json
{
  "items": ["kubejs:firebound_sword", "#example:fire_weapons"],
  "attack_damage": 8,
  "attack_speed": -2.4,
  "quality_group": "#example:group/firebound_weapon"
}
```

Bind a pill's toxicity:

```json
// kubejs/data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "quality_group": "#example:group/pill",
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

Bind a cultivation technique to its carrier item:

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "items": "kubejs:fire_manual",
  "technique": "example:fire_manual",
  "quality_group": "#example:group/manual"
}
```

All four binding tables only reference items that KubeJS, vanilla or another mod has already registered, and `quality_group` is an optional vanilla `item_quality` tag reference. When the bound item ID does not exist, data pack loading fails, so that no unresolvable item rule is created.

## Reloading

Registering an item or a block happens at startup and needs a game restart. The MiXianTu binding tables are data pack registries, which Minecraft reads while the world loads, so editing them needs the world to be loaded again rather than `/reload`. What `/reload` does refresh is the KubeJS server scripts, because KubeJS clears every callback and re-runs them:

```js
// kubejs/server_scripts/mxt_reload_notice.js
ServerEvents.loaded(event => {
  console.log('MiXianTu data pack loaded, use /mxt registries validate to check the registries')
})
```

## Rules and Events from Scripts

A script can also provide the rule implementation itself. Register a callback under a namespaced ID, then reference that ID from any matching data pack field:

```js
MxtActions.entity('example:heal', (entity, params) => {
  entity.heal(params.amount || 1)
})
```

```json
{
  "type": "mxt:js",
  "id": "example:heal",
  "params": { "amount": 4 }
}
```

Actions, conditions, number providers, resource value providers, trigger matchers, costs, ability target selectors, loot conditions and loot functions each have a pre-registered `mxt:js` type for this. The `id` is unique **within the same callback category**, and KubeJS clears every callback before reloading server scripts and re-runs the scripts, so keep registrations in server scripts rather than in a client script that only runs once. Action and condition callbacks also receive the formula context of the dispatch as their last argument, which is how a script reads an event payload such as `damage`.

All server lifecycle events are subscribed through `MxtEvents`:

```js
MxtEvents.abilityUse(event => {
  if (event.isPre() && event.getAbility() === 'example:forbidden') {
    event.cancel()
  }
})
```
