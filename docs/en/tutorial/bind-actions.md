---
title: Bind Actions with KubeJS
description: "The hooks each of the four binding tables offers, when they run, what limits them, and how conditions and their order work."
---

# Bind Actions with KubeJS

[Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) covered how an item gets registered and which table claims it. This page picks up from there and answers one question only: **when does the action inside a hook actually run?**

Each of the four binding tables hangs on a moment of its own, and none of them waits for another: the item table runs after the item is used up, the weapon's three hooks sit on right click, on a hit and on every tick respectively, and the pill's actions pick up after the pill has been eaten (they live on the pill definition, not on a binding). One wrong line raises no error — it simply never executes.

## What You Are Building

This page keeps using the four items from the main page, and the changes land in the binding files they already have:

| File | What this page adds |
| --- | --- |
| `data/mxt/data_maps/item/item_binding.json` | Two entity actions with an order between them. |
| `data/mxt/data_maps/item/item_binding.json` | One condition with a description that draws a check mark in the tooltip. |
| `data/mxt/data_maps/item/weapon_binding.json` | One action for each of the three hooks: right click, hit, every tick. |
| `data/example/mxt/pill/qi_pill.json` | The action on the overdose line. |

## Step 1 — Which Hooks Each Table Has

| Table | Hook | Type | Optional |
| --- | --- | --- | --- |
| `item_binding` | `actions` (**array**) | Entity action | Yes, empty by default |
| `weapon_binding` | `use_action` | Entity action | Yes |
| `weapon_binding` | `attack_action` | Bi-entity action | Yes |
| `weapon_binding` | `tick_action` | Entity action | Yes |
| `pill` | `on_consume` | Entity action | Yes |
| `pill` | `on_overdose` | Entity action | Yes |
| `technique_binding` | —— | No action hooks at all | —— |

Three things to remember first:

- **Leaving a hook out is not "writing nothing" — it writes a no-op action.** A no-op does nothing and reports no error, so "I never wrote it" and "I wrote it but it never fires" look exactly the same in the log.
- **A single action versus an array of actions**: every hook except `item_binding.actions` accepts both forms; `actions` **only accepts an array**, and a single object there makes that file fail to decode.
- **A hook written into the wrong table is dropped silently.** When a table does not declare a key, that key is simply unknown and is ignored at load — writing `use_action` in `item_binding`, or `on_consume` in `pill_binding`, neither reports an error nor has any effect.

## Step 2 — The Generic Binding's Actions

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:qi_pill": {
      "conditions": [
        {
          "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
          "description": "condition.example.needs_qi_chain"
        }
      ],
      "actions": [
        {"type": "mxt:add_resource", "resource": "example:qi", "amount": 25},
        {"type": "mxt:apply_effect", "effect": "minecraft:regeneration", "duration_ticks": 60}
      ]
    }
  }
}
```

`actions` runs in array order **at the end of one full use cycle**, which for a pill means "after it is eaten". Two things follow:

- The item needs a use cycle. Food and items carrying a `minecraft:consumable` component have one; a plain item that is nothing but a name does not, and its `actions` never run.
- By the time the actions run, the item **has already been consumed**. "Consuming" and "using" are not two gates but two moments of one thing: the conditions are judged when use starts, the actions run when it ends.

Conditions are checked once, at the "start using" gate. **They are not re-checked when the actions run** — however the conditions change after use begins, this settlement stands and no second one is queued.

## Step 3 — The Weapon's Three Hooks

```json
// data/mxt/data_maps/item/weapon_binding.json
{
  "values": {
    "kubejs:spirit_sword": {
      "attributes": [
        {"attribute": "minecraft:attack_damage", "id": "example:spirit_sword/damage", "amount": 8, "operation": "add_value"}
      ],
      "use_action": {
        "type": "mxt:apply_effect",
        "effect": "minecraft:speed",
        "duration_ticks": 100
      },
      "attack_action": {
        "type": "mxt:target_action",
        "action": {"type": "mxt:damage", "amount": 3}
      },
      "tick_action": {"type": "mxt:no_op"}
    }
  }
}
```

| Hook | When it runs | Limits |
| --- | --- | --- |
| `use_action` | Right click to "use item" | **Main hand** only; aiming at a block or a creature means that right click is not "using the item" and does not fire it |
| `attack_action` | A player hits an entity | **Main hand** only; a creature swinging does not count, only players do |
| `tick_action` | Once per tick (20 times per second at full speed) | **Main hand** only; runs on the server |

`attributes` is not like those three hooks: attribute modifiers are **applied on both sides**, so a weapon in the off hand still gets its attack damage and attack speed.

## Step 4 — The Pill Hooks

The pill's two action hooks live on the **pill definition** ([pill](../datapack/json/pill.md)), not on the binding: `on_consume` runs after the normal consumption flow has finished, while `on_overdose` only runs when accumulated toxicity crosses the line. Both are independent of the `item_binding` actions: when one pill hangs on both tables **both of them run** — the `item_binding` actions first, `on_consume` after them, and `on_overdose` once toxicity has crossed the line. Which item family is that pill, and how often it may be taken, come from [pill_binding](../datapack/json/pill_binding.md).

## Step 5 — The Two Faces of a Condition

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:root_pellet": {
      "conditions": [
        {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
        {
          "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
          "description": "condition.example.needs_qi_chain"
        }
      ],
      "actions": [
        {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
      ]
    }
  }
}
```

The two forms can be mixed inside one `conditions` array:

- **A plain condition** takes part in the test but is not drawn.
- **`{condition, description}`** takes part in the test too, and adds one more line to the tooltip: a green `✔` or a red `✖`, followed by the text `description` points at. `description` is a **language key**, not free text.

Two easy traps:

- The **quality** an item resolves to **carries conditions of its own**, and they go through the same gate. A `✖` in the tooltip may come from the quality rather than from the binding.
- Binding conditions are evaluated **in the entity's own context** and can see nothing from the attack event. "The target's health" or "is the target a creature" exist only in the context of `attack_action` itself, so writing them into a weapon's `conditions` reads nothing (an unreadable value counts as 0, and the condition then almost never holds).

## Step 6 — Ordering

- **Within one table: conditions first, actions second.** If a condition does not hold, none of it runs.
- **Within one use cycle:** the `item_binding` actions → `pill.on_consume` → toxicity accumulates → `pill.on_overdose` only once the line is crossed.
- **There is no shared order across tables.** Each table hangs on its own event, and that event decides who goes first, so do not rely on an order such as "does the technique get learned before the item's actions run".

## Verify

```text
(load the world again)     → the binding changes load
```

1. Take a `kubejs:qi_pill` and look at the tooltip: the condition with a `description` should draw a line with a coloured check mark or cross.
2. Right-click it while the condition is unmet: the item is refused and the action bar tells you why; once it holds, eat it and check whether aura rises by the amount written in `actions`.
3. Take the `kubejs:spirit_sword` and right-click **air** to see `use_action`'s effect; then right-click a **block** and confirm it does not fire that time.
4. Hit a target with the sword and confirm the extra damage from `attack_action`.
5. Eat ten pills and confirm the overdose line runs.
6. Temporarily swap `tick_action` for something you can see (a very short positive effect on yourself, for instance), stand still and watch whether it refreshes every tick, then put the no-op back.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| An action never runs and there is no error | The hook was written into a table that does not declare it, or the item has no use cycle (the `item_binding` actions need one full use cycle). |
| Right-clicking the weapon does nothing | You are aiming at a block or a creature — that right click does not take the "use item" route. |
| A weapon in the off hand has no actions | All three hooks are main hand only. `attributes` is not affected by that. |
| The condition clearly holds and the item still cannot be used | The same gate also carries the quality's own conditions, the remaining use count and the cooldown. |
| A condition written into `weapon_binding.conditions` never holds | Target information from the attack event cannot be read there; only the entity's own state can. |
| `actions` was written as a single object | `item_binding.actions` only accepts an array. |
| Two actions want the same hook | One hook takes one action; to do several things in a row write an array (or put a sequence inside the array). |
| Editing a binding changes nothing | `/reload` re-reads neither data pack registries nor data maps; load the world again. |

## Next

- [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) — how items are registered and what each of the four tables claims.
- [Define an Ability](./add-an-ability.md) — where the abilities inside those actions come from.
- [Entity Actions](../datapack/types/action/entity_action_types.md), [Bi-entity Actions](../datapack/types/action/bientity_action_types.md), [Entity Conditions](../datapack/types/condition/entity_condition_types.md) — every type you can put into a hook.
- [KubeJS API Reference](../kubejs/api-reference.md) — if you want to write the actions themselves in a script.
