---
title: KubeJS Items and Bindings
description: Register real items in a KubeJS startup script, then attach MiXianTu rules to them with the item, weapon, pill and technique binding tables.
---

# KubeJS Items and Bindings

MiXianTu never registers an item. KubeJS registers the item itself in a startup script, and MiXianTu attaches behaviour, conditions, aura, currency and tooltips to its real item ID through the binding tables. Do not create a `mxt:item`, `mxt:pill` or `mxt:weapon` file: those registries do not exist.

## Registering the Item

The item is registered by KubeJS in a startup script:

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

An item created without a namespace lives in `kubejs`, so `event.create('jade_token')` produces `kubejs:jade_token`. That is the ID every binding must use.

Editing a startup script needs a **game restart**: startup scripts run before the game registers items, and `/reload` never re-runs them.

## Attaching Rules with Binding Tables

MiXianTu owns behaviour, conditions, aura, currency and tooltips; the binding tables connect a registered item to those rules. Each file lives under `kubejs/data/<namespace>/mxt/<registry>/`, and all four tables only reference items that KubeJS, vanilla or another mod has already registered:

| Table | Directory | Attaches |
| --- | --- | --- |
| Item binding | `mxt/item_binding/` | Ordered entity actions and tooltip conditions for any item. |
| Weapon binding | `mxt/weapon_binding/` | Attack damage and speed, weapon actions and attribute modifiers. |
| Pill binding | `mxt/pill_binding/` | Consumption behaviour and toxicity for an edible item. |
| Technique binding | `mxt/technique_binding/` | How one technique is read: hold length, pose, sound, quality group and conditions, plus the item the mod generates as its carrier. |

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

Bind a cultivation technique to its carrier item:

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "quality_group": "#example:group/manual"
}
```

The first three tables match the item themselves: `items` accepts an item ID, an item tag or a mixed array, so one file can cover a whole family of items. `technique_binding` does not — it is matched by technique id, and `carrier_item` is a single item ID. What makes a stack a manual is its own `mxt:technique` component, so the item above still has to be handed out as a stack that carries it (the mod's creative tab and `/picker mxt:technique` offer exactly that generated stack). `quality_group` is an optional `#`-prefixed tag reference into the `item_quality` registry. When a binding names an item ID that does not exist, the data pack fails to load, so no unresolvable item rule is created. The full field list of each table is in [Item Binding](../datapack/json/item_binding.md), [Weapon Binding](../datapack/json/weapon_binding.md), [Pill Binding](../datapack/json/pill_binding.md) and [Technique Binding](../datapack/json/technique_binding.md).

## Reloading

Registering an item happens at startup and needs a game restart. The MiXianTu binding tables are data pack registries, which Minecraft reads while the world loads, so editing them needs the world to be loaded again rather than `/reload`. What `/reload` does refresh is the KubeJS server scripts, because KubeJS clears every callback and re-runs them:

```js
// kubejs/server_scripts/mxt_reload_notice.js
ServerEvents.loaded(event => {
  console.log('MiXianTu data pack loaded, use /mxt registries validate to check the registries')
})
```

## See Also

- [KubeJS](./index.md) — how the integration fits together.
- [KubeJS API Reference](./api-reference.md) — the script objects, their methods and the events.
- [KubeJS Examples](./examples.md) — complete scripts.
- [Create Items with KubeJS and Bind Them](../tutorial/create-items-with-kubejs.md) — the same material as a step-by-step walkthrough.
