---
title: Create Items and Bind Actions with KubeJS
description: "Register real items in a KubeJS startup script, then hang MiXianTu's rules and behaviour on them with four binding tables."
---

# Create Items and Bind Actions with KubeJS

MiXianTu does not create items. What it creates is **rules for items**, and those rules always point at a real, registered item ID — whether that item comes from vanilla, another mod or a KubeJS script.

That split is deliberate: before a data pack can refer to an item, the item has to exist, and the two are registered at different moments. They do meet in the same place in the end, though — an item registered by a script only becomes visible to the game after a restart, while all four binding tables are data pack registries, read when the world loads:

```text
kubejs/startup_scripts/          the item itself      (game restart)
        ↓  real item ID: kubejs:qi_pill
data/example/mxt/                the rules            (world reload)
        ↓
actions, conditions, quality, aura, tooltips
```

::: warning

Do not invent `mxt:item` or `mxt:weapon` files out of thin air. Those registries do not exist. Every binding table matches items that are already registered. A single unknown item ID fails the load; an unknown ID written inside an array only logs one line and is then dropped, with the rest of the file loading as usual — so a typo inside an array loses that match silently.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `kubejs/startup_scripts/mxt_items.js` | Four items: a qi gathering pill, a spirit root pellet, a sword and a technique manual. |
| `kubejs/server_scripts/mxt_recipes.js` | Their recipes. |
| `data/example/mxt/element/fire.json` | The element the spirit root uses. |
| `data/example/mxt/spirit_root/fire_root.json` | What the pellet grants. |
| `data/example/mxt/technique/azure_breath.json` | What the manual teaches. |
| `data/example/mxt/item_binding/qi_pill.json` | Generic bindings: what using this item does. |
| `data/example/mxt/pill/qi_pill.json` | What the pill does: dose action, toxicity and overdose. |
| `data/example/mxt/pill_binding/qi_pill.json` | Which pill this item family is, plus its cap and cooldown. |
| `data/example/mxt/weapon_binding/spirit_sword.json` | Weapon attribute modifiers and combat behaviour. |
| `data/example/mxt/technique_binding/azure_manual.json` | How that technique is read, and which item the mod generates as its carrier. |

Quality tiers are not on this page: they have a chain and upgrade rules of their own, see [Define a Quality Chain](./define-a-quality-chain.md). The four items here use the three tiers built there.

## Step 1 — Register the Items

Items are registered only once, at startup, so this script belongs in `kubejs/startup_scripts/`:

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

- Items registered without a namespace live under `kubejs`, so `event.create('qi_pill')` produces `kubejs:qi_pill`. Every binding has to use that ID.
- A pill does **not** have to have `.food(...)`. An item a binding claims that carries a `minecraft:consumable` of its own (a food, a drink, anything made with `.food(...)`) is eaten with that item's own cycle and hunger rules; an item that carries none has a use cycle written for it on the click and taken back when the gesture ends, so a pill bound to a plain item can be taken and the item is left untouched. The effect still runs on the closing tick of **one full use cycle** — writing `.food(...)` only makes that cycle come from the item itself.
- Editing this file needs a **game restart**: startup scripts run before the game registers items, and `/reload` never re-runs them.

Recipes are not a registry, so they do reload with `/reload` — the script below registers them from a server script:

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

## Step 2 — What Each of the Four Binding Tables Covers

The four tables do different jobs and their fields barely overlap. All four are data pack registries, and each declares which items it covers through `items`:

| Table | What it covers | Main fields |
| --- | --- | --- |
| `item_binding` | The generic "what happens when this item is used up" | `items`, `conditions`, `actions`, `element`, `priority` |
| `pill_binding` | Which pill this item family is, plus its use cap and cooldown | `items`, `pill`, `max_uses`, `cooldown`, `priority` |
| `weapon_binding` | Attributes and actions while it is used as a weapon | `items`, `attributes`, `use_action`, `attack_action`, `tick_action`, `conditions`, `element`, `priority` |
| `technique_binding` | How the technique is read, and which item is its carrier | `items`, `technique`, `carrier_item`, `learn_time`, `hold_animation`, `hold_sound` |

Three rules they share:

- `items` accepts a single ID, an item tag or an array of them, so one definition can cover a whole family of items (tags expand at load time).
- Every table decides who wins by `priority`, and **only one definition per item per table ever runs** (highest wins, a tie falls back to registry order) — it is not "all of them stacked". Two definitions can both be written correctly and still not both execute.
- A single unknown item ID in `items` **fails the data pack load**; an unknown ID written inside an array only logs one line and drops that element, with the rest of the file loading as usual — so a typo inside an array loses that match silently.

When the hooks run, and how conditions are written and ordered, get a page of their own: [Bind Actions with KubeJS](./bind-actions.md).

## Step 3 — Generic Bindings

`item_binding` is the general-purpose one: the definition claims items through `items`, and lists some actions below.

```json
// data/example/mxt/item_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
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

- `conditions` decides whether the item can be used. An entry written as a plain condition is silent; an entry written as `{condition, description}` is drawn in the item tooltip as a green `✔` or a red `✖`, and `description` is a **language key** (`condition.example.needs_qi_chain` in the example above). If you want to know why a player cannot use an item, this is the cheapest way to find out.
- `conditions` are checked once, at the "start using" gate. **They are not re-checked when the actions run**, so a condition that changes after the use began neither cancels this settlement nor causes a second one.
- `actions` is an **array** (a single object is not allowed here) and runs in order at the end of one full use cycle. For a pill that means "after it has been eaten". Any entity action can go here.

A pellet that grants a spirit root:

```json
// data/example/mxt/element/fire.json
{
  "color": "#FF6600"
}
```

```json
// data/example/mxt/spirit_root/fire_root.json
{
  "elements": ["example:fire"],
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "quality": "example:refined"
}
```

```json
// data/example/mxt/item_binding/root_pellet.json
{
  "items": "kubejs:root_pellet",
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ]
}
```

The spirit root is what makes the fire element mean anything: it changes the cultivation multiplier, and its `element_ability_modifier` scales any ability whose `element_affinity` includes fire — the damage side is multiplied in automatically by the [damage pipeline](/en/technical/damage), so an ability definition only has to write its base number. The full spirit root and physique fields are in [Define Spirit Roots and Physiques](./define-spirit-roots-and-physiques.md).

## Step 4 — Pills

A pill takes two tables: `pill` says what eating it does, and `pill_binding` says which items are it and how often this family may be taken. Neither shares a field with the other bindings.

```json
// data/example/mxt/pill/qi_pill.json
{
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

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "kubejs:qi_pill",
  "pill": "example:qi_pill",
  "max_uses": 3,
  "cooldown": 40
}
```

- `toxicity_gain` accumulates on the player; once the total reaches `toxicity_threshold`, `on_overdose` runs and toxicity is set to `toxicity_after_overdose` rather than to `0`, so repeated overdosing keeps hurting.
- The default threshold is `Double.MAX_VALUE`, which means "never overdoses". Set it on purpose.
- `on_consume` runs after the normal consumption flow has finished, independently of the `item_binding` actions: when one pill hits both tables, both run — the `item_binding` actions first, `on_consume` after them, and `on_overdose` once toxicity has crossed the line.
- **Uses and cooldown follow the binding only.** A stack that writes only effect keys, or one whose item no binding claims, counts no uses and has no cooldown; a binding has exactly one entry, `items`, so the one above has to name `kubejs:qi_pill`.

`item_binding` and these two tables can be used on the same item; they carry different fields, and neither overrides the other.

## Step 5 — Weapon Bindings

```json
// data/example/mxt/weapon_binding/spirit_sword.json
{
  "items": "kubejs:spirit_sword",
  "attributes": [
    {"attribute": "minecraft:attack_damage", "id": "example:spirit_sword/damage", "amount": 8, "operation": "add_value"},
    {"attribute": "minecraft:attack_speed", "id": "example:spirit_sword/speed", "amount": -2.4, "operation": "add_value"}
  ],
  "use_action": {"type": "mxt:no_op"},
  "attack_action": {
    "type": "mxt:target_action",
    "action": {"type": "mxt:damage", "amount": 3}
  },
  "tick_action": {"type": "mxt:no_op"}
}
```

- A weapon's own attack damage and attack speed are written as `attributes` entries too (`minecraft:attack_damage` / `minecraft:attack_speed`), and they are **added on top of** the modifiers the item itself carries; to change the numbers the base item ships with you edit its `minecraft:attribute_modifiers` (a component patch or KubeJS), because this layer does not replace them.
- `use_action` is the entity action run on right click; `attack_action` is the bi-entity action run on a successful hit, so the `mxt:target_action` here deals 3 extra damage to the target; `tick_action` runs every tick while the weapon is held, and is the place for upkeep, particles or aura drain.
- All three hooks are **main hand only**, and `use_action` does not fire while you are aiming at a block or a creature (that right click never takes the "use item" route at all). If you want them to work in the off hand, only `attributes` will apply.
- Entries in `attributes` have the same shape as vanilla attribute modifiers; an entry with a `value` formula is recalculated every tick.

## Step 6 — Techniques and Manuals

A technique is the logic; `technique_binding` describes **how that technique is read** — hold duration, pose, sound, quality chain and conditions — and declares which item the mod generates as its carrier. It has **no action hooks at all**, which is where it differs from the other three tables.

```json
// data/example/mxt/technique/azure_breath.json
{
  "quality": "example:refined",
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
  "technique": "example:azure_breath",
  "carrier_item": "kubejs:azure_manual",
  "conditions": [{"type": "mxt:has_realm", "aura": "example:qi"}]
}
```

**Whether a stack is a manual is decided by the component on the stack first, and by this table only second.** The `carrier_item` above only asks the mod to generate a carrier for this technique (under `/picker mxt:technique`; **the creative inventory does not generate carriers**); what actually teaches the technique is the `mxt:technique` component on the stack, so a manual is handed out with the item component syntax:

```mcfunction
give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]
```

Right-clicking the manual attempts to learn `example:azure_breath`. Every technique already learned stays active at the same time, and a stack carrying the component claims the interaction even when learning fails, so a player cannot get around the technique's own `learn_condition`, its exclusivity tags or the learning event. `items` is the **optional second route**: write it into the declaration (`"items": "kubejs:azure_manual"`) and that item counts as a manual for this technique **even with no component**, while the `mxt:technique` component on the stack still wins.

## Verify

```text
(restart the game)                     → the four items now exist
(load the world again)                 → the bindings load
/mxt registries validate               → no codec errors
/mxt registries list                   → mxt:pill=1, mxt:pill_binding=1, mxt:technique_binding=1, …
```

The two halves each need their own restart: KubeJS registers items at startup, and all four binding tables are data pack registries that Minecraft reads while the world loads. `/reload` does neither — it only refreshes recipes, loot tables, advancements, functions and KubeJS server scripts.

`/mxt registries list` shows the entry counts of `mxt:item_binding`, `mxt:weapon_binding`, `mxt:pill_binding` and `mxt:technique_binding`.

Then in game:

1. `/give @s kubejs:qi_pill`. The tooltip draws a quality line, and a described condition also draws a coloured `✔` or `✖`. While `mxt:has_realm` is unmet, the pill is refused.
2. Cultivate until you have entered the realm chain, then eat one pill: aura goes up by `25` and pill toxicity by `10`. `/mxt attachment status` shows the accumulated toxicity.
3. Eat ten of them and the overdose line runs.
4. Eat a `kubejs:root_pellet`: the fire spirit root is granted, and `/mxt attachment status` lists it. The `+25%` cultivation multiplier applies from the next cultivation tick.
5. `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]`, then right-click it and confirm the technique was learned and its `+2 max health` has appeared. A stack from a plain `/give @s kubejs:azure_manual` (or taken from the creative inventory as `kubejs:azure_manual`) carries **no component**: right-clicking it does nothing and no technique shows up in its tooltip.
6. Hold `kubejs:spirit_sword`, check the attack damage and speed in its tooltip, then hit any target and watch the extra damage `attack_action` deals.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The world refuses to load with an unknown item | A binding registry's `items` names an item ID that is not registered: as a single ID it fails the whole data pack load; inside an array the element that cannot be read is dropped and one line is logged. |
| The rule silently never matches | `example:qi_pill` was written inside an `items` array while the script produces `kubejs:qi_pill` (or any other typo), so that entry was dropped and the file loaded as usual. Use the ID that is really registered. |
| Two definitions of the same table on one item, and only one applies | Every table takes exactly one definition, chosen by `priority`, and a tie falls back to registry order. To run both, merge them into one definition, or write both into one `items` array. |
| The item has no behaviour at all | The rule was put into a binding table that does not match this item, or the quality of that stack cannot be resolved. |
| A pill on a plain item does nothing on right-click | That item answers the click through its own branch of `Item#use` (swappable equipment, a shield, a kinetic weapon), or a hold declaration claims it — both take their own path. Use another item, or remove that declaration. |
| `conditions` is clearly false and the actions still ran | Conditions are checked once, when use starts, and not re-checked after that. |
| Some hooks are written and do nothing | The hook was written into a table that does not declare it (for instance `use_action` in `item_binding`). An undeclared key is ignored silently. |
| The check marks in the tooltip are not what you expected | A quality can carry conditions of its own, so that `✖` may come from the quality rather than from the binding. |
| New items do not appear after `/reload` | Item registration happens at startup; restart the game. |
| Edited bindings change nothing | `/reload` does not re-read data pack registries; load the world again. |
| The manual has no effect and no error | First check whether that stack carries the `mxt:technique` component — a plain item without it teaches nothing. If it does, look at whether learning failed instead: `learn_condition`, a technique already learned, or an exclusivity conflict. |
| The manual's `items` field does nothing | `items` is the **optional** second route, and the `mxt:technique` component on the stack still wins. Every item id written there has to match the id the script really registered (do not drop the `kubejs:` namespace), or it claims nothing. |

## Next

- [Bind Actions with KubeJS](./bind-actions.md) — which hooks each of the four tables has, when they run, and how conditions and their order work.
- [Define a Quality Chain](./define-a-quality-chain.md) — how the three tiers are written, and which tier carries the price of the step up.
- [Define an Ability](./add-an-ability.md) — give these items somewhere to spend the aura they store.
- [Item Binding](../datapack/json/item_binding.md), [Pill](../datapack/json/pill.md), [Pill Binding](../datapack/json/pill_binding.md), [Weapon Binding](../datapack/json/weapon_binding.md) and [Technique Binding](../datapack/json/technique_binding.md) — the full field lists.
- [KubeJS API Reference](../kubejs/api-reference.md) — the script objects, if you want to write the rules themselves in a script.
