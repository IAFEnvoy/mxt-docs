---
title: KubeJS Items and Bindings
description: Register real items in a KubeJS startup script, then attach MiXianTu rules to them with the item, weapon, pill, tool, blueprint and technique binding tables.
---

# KubeJS Items and Bindings

MiXianTu never registers an item. KubeJS registers the item itself in a startup script, and MiXianTu attaches behaviour, conditions, aura, currency and tooltips to its real item ID through the binding tables. Do not create a `mxt:item` or `mxt:weapon` file: those registries do not exist. `mxt:pill` is three different things — a built-in carrier item, an item component and a registry — and all three only describe **what a dose does**, see [Pill](../datapack/json/pill.md); none of them registers the item itself.

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

MiXianTu owns behaviour, conditions, aura, currency and tooltips; the binding tables connect a registered item to those rules. Each file lives under `kubejs/data/<namespace>/mxt/<registry>/`, and all six tables only reference items that KubeJS, vanilla or another mod has already registered:

| Table | Directory | Attaches |
| --- | --- | --- |
| Item binding | `mxt/item_binding/` | Ordered entity actions and tooltip conditions for any item. |
| Weapon binding | `mxt/weapon_binding/` | Vanilla attribute modifiers (attack damage and speed go here too), weapon actions. |
| Pill binding | `mxt/pill_binding/` | Claims this family of registered items as one pill and gives it a use cap and cooldown; what a dose does is in [Pill](../datapack/json/pill.md). |
| Tool binding | `mxt/tool_binding/` | Claims tool items and lists the forging methods they unlock. |
| Blueprint binding | `mxt/blueprint_binding/` | Claims blueprint items and lists the forging blueprints they offer. |
| Technique binding | `mxt/technique_binding/` | How one technique is read: hold length, pose, sound, quality chain and conditions, plus the item the mod generates as its carrier. A manual's identity is the stack's `mxt:technique` component; `items` is the optional second route. |

Bind a pill that grants a spirit root:

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "actions": [
    {
      "type": "mxt:grant_spirit_root",
      "spirit_root": "example:fire_root"
    }
  ]
}
```

Bind a weapon's attribute modifiers (attack damage and attack speed go here too):

```json
// kubejs/data/example/mxt/weapon_binding/firebound_sword.json
{
  "items": ["kubejs:firebound_sword", "#example:fire_weapons"],
  "attributes": [
    {"attribute": "minecraft:attack_damage", "id": "example:firebound_sword/damage", "amount": 8, "operation": "add_value"},
    {"attribute": "minecraft:attack_speed", "id": "example:firebound_sword/speed", "amount": -2.4, "operation": "add_value"}
  ]
}
```

Write what a pill does, then claim it on that item:

```json
// kubejs/data/example/mxt/pill/returning_pill.json
{
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

```json
// kubejs/data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "pill": "example:returning_pill",
  "max_uses": 3,
  "cooldown": 40
}
```

Bind a cultivation technique to its carrier item:

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual"
}
```

The first five tables match the item themselves: `items` accepts an item ID, an item tag or a mixed array, so one file can cover a whole family of items (the same holds for `tool_binding` / `blueprint_binding`, which just hand out forging methods and blueprints instead). A `technique_binding` declaration is matched by technique id, and its `items` is the optional second route: what makes a stack a manual is its own `mxt:technique` component, and only without one does the `items` of a declaration decide — so the item above can either be handed out as the generated carrier from `/picker mxt:technique`, or its id can be written into the declaration's `items` directly. A binding table **declares no quality ladder**: the ladder's name is written on the `quality` entry itself (that tier's `quality`), so an item sits on whichever ladder its resolved tier belongs to, see [quality](../datapack/json/quality). When a binding names an item ID that does not exist, the data pack fails to load, so no unresolvable item rule is created. The full field list of each table is in [Item Binding](../datapack/json/item_binding.md), [Weapon Binding](../datapack/json/weapon_binding.md), [Pill](../datapack/json/pill.md), [Pill Binding](../datapack/json/pill_binding.md), [Tool Binding](../datapack/json/tool_binding.md), [Blueprint Binding](../datapack/json/blueprint_binding.md) and [Technique Binding](../datapack/json/technique_binding.md).

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
- [Create Items and Bind Actions with KubeJS](../tutorial/create-items-with-kubejs.md) — the same material as a step-by-step walkthrough.
