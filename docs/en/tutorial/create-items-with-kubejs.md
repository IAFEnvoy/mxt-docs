---
title: Create Items with KubeJS and Bind Them
description: Register real items in a KubeJS startup script, then attach MiXianTu gameplay to them with the item, pill, weapon and technique binding tables.
---

# Create Items with KubeJS and Bind Them

MiXianTu does not create items. It creates **rules for items**, and those rules always point at a real, registered item ID, whether that item comes from vanilla, another mod or a KubeJS script.

That split is deliberate: an item has to exist before a data pack can refer to it, and the two are registered at different times. Both end up in the same place, though — an item registered by a script is only visible to the game after a restart, and the binding tables are data pack registries that are read when the world loads:

```text
kubejs/startup_scripts/          the item itself      (game restart)
        ↓  real item ID: kubejs:qi_pill
data/example/mxt/item_binding/   the rules            (world reload)
        ↓
actions, conditions, quality, aura, tooltips
```

::: warning

Do not invent a `mxt:item`, `mxt:pill` or `mxt:weapon` file. Those registries do not exist. Every binding table matches items that are already registered. A single unknown item id fails the load; an unknown id written inside an array is dropped with a log line instead, and the rest of the file still loads — so a typo in an array loses the match silently.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | Four items: a qi pill, a spirit root pellet, a sword and a manual. |
| `kubejs/server_scripts/mxt_recipes.js` | Recipes for them. |
| `data/example/mxt/item_quality/common.json`, `refined.json` | Two quality tiers. |
| `data/example/tags/mxt/item_quality/group/pill.json` | The quality group the pills belong to. |
| `data/example/mxt/element/fire.json` | Element used by the spirit root. |
| `data/example/mxt/spirit_root/fire_root.json` | What the pellet grants. |
| `data/example/mxt/technique/azure_breath.json` | What the manual teaches. |
| `data/example/mxt/item_binding/qi_pill.json`, `root_pellet.json` | Consumption behaviour. |
| `data/example/mxt/pill_binding/qi_pill.json` | Pill toxicity. |
| `data/example/mxt/weapon_binding/spirit_sword.json` | Weapon damage, speed and combat actions. |
| `data/example/mxt/technique_binding/azure_manual.json` | The manual's technique. |

## Step 1 — Register the Items

Items are registered once, at startup, so this script belongs in `kubejs/startup_scripts/`:

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('qi_pill')
    .displayName('Qi Gathering Pill')
    .food(food => food.hunger(2).saturation(0.2))

  event.create('root_pellet')
    .displayName('Fire Root Pellet')
    .food(food => food.hunger(1).saturation(0.1))

  event.create('spirit_sword', 'sword')
    .displayName('Spirit Sword')
    .tier('diamond')

  event.create('azure_manual')
    .displayName('Azure Breath Manual')
})
```

- Items registered without a namespace live in `kubejs`, so `event.create('qi_pill')` produces `kubejs:qi_pill`. That is the ID every binding must use.
- `.food(...)` is required for a pill: `pill_binding` only matches edible items.
- Editing this file needs a **game restart**: startup scripts run before the game registers items, and `/reload` never re-runs them.

Recipes are not a registry, so those do reload with `/reload` — the script below registers them from a server script:

```js
// kubejs/server_scripts/mxt_recipes.js
ServerEvents.recipes(event => {
  event.shaped('kubejs:qi_pill', [' A ', 'ABA', ' A '], {
    A: 'minecraft:glowstone_dust',
    B: 'minecraft:bowl'
  })

  event.shaped('kubejs:root_pellet', [' A ', 'ABA', ' A '], {
    A: 'minecraft:blaze_powder',
    B: 'kubejs:qi_pill'
  })
})
```

## Step 2 — Quality Tiers

An `item_quality` is a tier an item can carry. Quality order and grouping are decided by vanilla tags, not by a field inside the definition:

```json
// data/example/mxt/item_quality/common.json
{
  "display_name": "quality.example.common"
}
```

```json
// data/example/mxt/item_quality/refined.json
{
  "display_name": "quality.example.refined",
  "value_multiplier": {
    "description": "quality.example.refined.value",
    "modifier": 1.25
  },
  "alchemy_modifier": {
    "description": "quality.example.refined.alchemy",
    "modifier": 1.1
  }
}
```

```json
// data/example/tags/mxt/item_quality/group/pill.json
{
  "replace": false,
  "values": [
    "example:refined",
    "example:common"
  ]
}
```

- The group is referenced from a binding as `#example:group/pill`. The `#` is part of the reference and a binding without it fails to load.
- The order of `values` is the group's quality order, and the last usable member is the **default** for an item with no explicit quality — so this file lists `refined` first and `common` last, which makes `common` the default.
- `display_name` is a text component, so a translation key works; `description` on a modifier is added to the item tooltip automatically, while `modifier` is the value used at runtime: `value_multiplier` scales the item's currency unit value, `forging_modifier` divides the extra steps the forging quality is read from, and `alchemy_modifier` divides the brewing duration. Each reads the quality of the stack it settles — for forging and alchemy the **lowest** quality among the session's own materials — and a missing or unusable modifier behaves as `1`.
- An item whose current quality is outside its group cannot be used at all, so keep one group per kind of item rather than one group for everything.

```json
// data/example/tags/mxt/item_quality/group/weapon.json
{
  "replace": false,
  "values": [
    "example:common",
    "example:refined"
  ]
}
```

## Step 3 — Generic Bindings

`item_binding` is the general-purpose table: match some items, list some actions.

```json
// data/example/mxt/item_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "quality_group": "#example:group/pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
      "description": "condition.example.needs_qi_chain"
    }
  ],
  "actions": [
    {"type": "mxt:add_resource", "resource": "example:qi", "amount": 25}
  ]
}
```

- `items` accepts one ID, one tag (`"#example:pills"`) or a mixed array, so a single file can cover a whole family of items.
- `conditions` gate the use. An entry written as a plain condition is silent; an entry written as `{condition, description}` is shown in the tooltip with a green `✓` or a red `✗`, which is the cheapest way to tell a player why an item refuses to work.
- `actions` run in order when the item is consumed or the binding event fires. Any [entity action](../datapack/types/action/entity_action_types.md) works here.

A pellet that hands out a spirit root:

```json
// data/example/mxt/element/fire.json
{
  "color": "#FF6600"
}
```

```json
// data/example/mxt/spirit_root/fire_root.json
{
  "element": "example:fire",
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "rarity": "rare"
}
```

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": "kubejs:root_pellet",
  "quality_group": "#example:group/pill",
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ]
}
```

The spirit root is what makes the fire element matter: it changes the cultivation multiplier, and its `element_ability_modifier` scales abilities whose `element_affinity` includes fire — that damage side is applied automatically by the [damage pipeline](../technical/damage.md), so a skill definition only has to write its base number.

## Step 4 — Pill Bindings

A pill binding adds the fields that only pills have. It is a separate table because none of its fields are shared with the other bindings.

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "on_consume": {"type": "mxt:no_op"},
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25,
  "on_overdose": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:poison",
    "duration_ticks": 100
  }
}
```

- `toxicity_gain` accumulates on the player; when it passes `toxicity_threshold`, `on_overdose` runs and toxicity is reset to `toxicity_after_overdose` instead of `0`, so repeated overdosing keeps hurting.
- The default threshold is `Double.MAX_VALUE`, which means "never overdoses". Set it deliberately.
- `on_consume` runs after the normal consumption finishes, independently of the `item_binding` actions.

Both tables can be used on the same item; they carry different fields and neither overrides the other.

## Step 5 — Weapon Bindings

```json
// data/example/mxt/weapon_binding/spirit_sword.json
{
  "items": "kubejs:spirit_sword",
  "attack_damage": 8,
  "attack_speed": -2.4,
  "quality_group": "#example:group/weapon",
  "use_action": {"type": "mxt:no_op"},
  "attack_action": {
    "type": "mxt:target_action",
    "action": {"type": "mxt:damage", "amount": 3}
  },
  "tick_action": {"type": "mxt:no_op"}
}
```

- `attack_damage` and `attack_speed` are added to the item, on top of whatever its tier already gives.
- `use_action` is an entity action run on right click; `attack_action` is a bi-entity action run on a successful hit, so `mxt:target_action` here applies an extra 3 damage to the target.
- `tick_action` runs every tick while the weapon is held, which is the place for upkeep, particles or aura drain.
- `attributes` adds further vanilla attribute modifiers; an entry with a `value` formula is recalculated every tick.

The `#example:group/weapon` tag from Step 2 defines which qualities this weapon may carry.

## Step 6 — Technique Bindings

A technique is the logic; a technique binding is the book that teaches it.

```json
// data/example/mxt/technique/azure_breath.json
{
  "grade": "earth",
  "learn_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "cultivation_modifier": 1.25,
  "passive_modifiers": [
    {
      "attribute": "minecraft:max_health",
      "id": "example:technique/azure_breath",
      "amount": 2,
      "operation": "add_value"
    }
  ]
}
```

```json
// data/example/mxt/technique_binding/azure_manual.json
{
  "items": "kubejs:azure_manual",
  "technique": "example:azure_breath",
  "conditions": [{"type": "mxt:has_realm", "aura": "example:qi"}]
}
```

Right-clicking the manual attempts to learn `example:azure_breath`. Every learned technique stays active at the same time, and a matching binding claims the interaction even when learning fails, so a player cannot bypass the technique's own `learn_condition`, exclusivity tags or the learning event.

## Step 7 — Load and Verify

```text
(restart the game)                     → the four items now exist
(load the world again)                 → the bindings load
/mxt registries validate               → no codec errors
/mxt registries list                   → mxt:item_binding=2, mxt:pill_binding=1, mxt:weapon_binding=1, mxt:technique_binding=1, mxt:item_quality=2, …
```

Both halves need their own restart: KubeJS registers items at startup, and the binding tables are data pack registries that Minecraft reads while the world loads. `/reload` does neither — it only refreshes recipes, loot tables, advancements, functions and the KubeJS server scripts.

Then in game:

1. `/give @s kubejs:qi_pill`. The tooltip shows a quality line and, when the condition is described, a coloured `✓` or `✗`. With `mxt:has_realm` unmet, the pill is refused.
2. Cultivate until you have entered the chain, then eat a pill: qi rises by `25`, and pill toxicity rises by `10`. `/mxt attachment status` shows the accumulated toxicity.
3. Eat ten of them and the overdose line runs.
4. Eat a `kubejs:root_pellet`: the fire spirit root is granted, and `/mxt attachment status` lists it. The `+25%` cultivation multiplier applies from the next cultivation tick.
5. Right-click `kubejs:azure_manual` and check that the technique is learned and its `+2 max health` appears.
6. Hold `kubejs:spirit_sword` and check the attack damage and speed in its tooltip, then hit something to see the extra damage from `attack_action`.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The world refuses to load with an unknown item | A binding names an item id that is not registered. As a single id this fails the load; inside an array the unreadable element is dropped with a log line instead. |
| The rule silently never matches | `example:qi_pill` was written while the script produced `kubejs:qi_pill` (or any other typo) inside an `items` array, so that element was dropped and the file loaded without it. Use the real registered ID. |
| The item has no behaviour at all | The rule was put in a binding table that does not match the item, or the item is not in the `quality_group` it declares. |
| `quality_group` is rejected | It must be a `#`-prefixed tag reference, and the tag must exist. |
| A pill cannot be eaten | `pill_binding` only matches edible items, so the item needs `.food(...)`. |
| New items do not appear after `/reload` | Item registration happens at startup; restart the game. |
| Edited bindings do not change anything | `/reload` does not re-read data pack registries; load the world again. |
| The manual has no effect but also no error | The technique binding was claimed but learning failed — check `learn_condition`, an already-learned duplicate or an exclusivity conflict. |

## Next

- [Add an Ability](./add-an-ability.md) — give these items something to do with the aura they store.
- [Item Binding](../datapack/json/item_binding.md), [Pill Binding](../datapack/json/pill_binding.md), [Weapon Binding](../datapack/json/weapon_binding.md) and [Technique Binding](../datapack/json/technique_binding.md) — the full field lists.
- [KubeJS API Reference](../kubejs/api-reference.md) — the script objects, if you want the rules themselves in a script.
