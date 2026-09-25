---
title: Forge a Treasure
description: Build a forge-table production line out of striking methods, tool bindings and a blueprint — the meter, the target range, the finish pattern, the quality ladder and the failure settlement.
---

# Forge a Treasure

The Forge Table does not craft an item, it **hammers** one: you feed it materials, it hands the player a target from a blueprint, and the player pushes a numeric meter into a range with one method at a time. The quality of the piece is then decided by **how many spare strikes** it took. The same blueprint can produce a plain item or a flawless one, and the only difference is the process.

The data splits into four places: `forging_method` is a single strike, `tool_binding` decides which methods a tool unlocks, `forging_blueprint` says *what materials* and *what shape the meter has to end in*, and `blueprint_binding` attaches a blueprint to a real item. The first three are data tables; the fourth only works through an **item component** — which is what makes this tutorial different from the earlier ones.

This tutorial adds an iron-sword line to the example pack: four methods, one smith's hammer, one blueprint item and three quality tiers.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/forging_method/light_strike.json` | Light strike: meter `-1`. |
| `data/example/mxt/forging_method/heavy_strike.json` | Heavy strike: meter `+2`, with a cost, a condition, a cooldown and a sound. |
| `data/example/mxt/forging_method/quench.json` | Quench: meter `-1`, no cost. |
| `data/example/mxt/forging_method/temper.json` | Temper: meter `+2`, no cost. |
| `data/example/mxt/tool_binding/smith_hammer.json` | Which four methods the hammer unlocks. |
| `data/example/mxt/forging_blueprint/spirit_sword.json` | Materials, allowed methods, meter, finish pattern, quality ladder, failure settlement. |
| `data/example/mxt/blueprint_binding/sword_manual.json` | Which blueprint the blueprint item offers. |
| `data/example/mxt/quality/flawless.json` | The top tier of the quality ladder. |

## Step 1 — What One Strike Is

A method is "what pressing the button does": which way the meter moves, what it costs, when it is allowed, and what it sounds like.

```json
// data/example/mxt/forging_method/light_strike.json
{
  "value_delta": -1,
  "icon": { "id": "minecraft:feather" }
}
```

```json
// data/example/mxt/forging_method/heavy_strike.json
{
  "value_delta": 2,
  "costs": [{ "id": "example:qi", "amount": 1 }],
  "condition": { "type": "mxt:health", "comparison": ">=", "compare_to": 10 },
  "icon": { "id": "minecraft:iron_ingot" },
  "cooldown": 10,
  "sound": "minecraft:block.anvil.land"
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `value_delta` | Integer | **required** | The meter shift. It must not be `0`. |
| `costs` | `List<Cost>` | `[]` | What one strike costs, paid by the player who strikes, all or nothing as one array; the five shapes are on [Shared Data Types · `Cost`](../datapack/types/shared_data_types.md#cost) and the types on [Trigger and Cost Types](../datapack/types/other/trigger-and-cost.md#cost-type). |
| `condition` | `EntityCondition` | `mxt:always_true` | When the method may be used. It is tested against the **player** (see [Entity Conditions](../datapack/types/condition/entity_condition_types.md)). |
| `icon` | icon reference | none | What the list draws, and **what the method is called in that list**. |
| `cooldown` | Integer | `0` | Cooldown in ticks, range `0..72000`. |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | Played at the table, to everyone nearby, **after** a strike that actually happened. |

Three things that are easy to get wrong:

- **`icon` is not decoration.** The method's name in the selector list is its icon item's own name; with no `icon`, or with a texture icon, the list shows the registry id instead. Give it an icon if you want the list to be readable.
- **An out-of-bounds strike is simply refused.** Before every strike the game checks whether the value would still be inside the meter afterwards; if not, the strike does not happen. A heavy strike can never be used to shove the value back into the range from outside.
- **The cooldown is recorded before the cost and the condition are checked.** A strike refused for lack of aura or for a failed condition still burns that cooldown.

The sound is resolved by name at load time, so a typo rejects **the whole method entry** instead of playing nothing; write `minecraft:intentionally_empty` to be deliberately silent.

## Step 2 — The Tool and the Blueprint Item

Both bindings are just "one item → a set of definitions" lists; the list itself names no item.

```json
// data/example/mxt/tool_binding/smith_hammer.json
{
  "methods": [
    "example:heavy_strike", "example:light_strike",
    "example:quench", "example:temper"
  ]
}
```

```json
// data/example/mxt/blueprint_binding/sword_manual.json
{
  "blueprints": ["example:spirit_sword"]
}
```

Items point at them through the `mxt:tool_binding` and `mxt:blueprint_binding` components. The component stores a Holder, so the item does not copy the definition: you can rewrite a binding table without touching the item.

**Usable methods = the blueprint's `allowed_methods` ∩ the union of every placed tool's `methods`.** When the blueprint declares no `allowed_methods` its side restricts nothing, and the list is the tools' union.

### Attaching the component

This is the one place in this tutorial where the item side has to cooperate. Two routes:

**For testing, the `/give` component syntax** (no code, and you can change the data tables and retry straight away):

```text
/give @s minecraft:iron_ingot[mxt:tool_binding="example:smith_hammer"]
/give @s minecraft:paper[mxt:blueprint_binding="example:sword_manual"]
```

**A real pack should set it when the item is registered.** The mod's own test items do exactly that: the binding is named after the item's own id and written into the item's properties as a delayed holder component, so every hammer a player crafts carries its binding without a command or a hand-edited component.

::: tip The component's value is a data-table id, not inline content

The `example:smith_hammer` in `mxt:tool_binding="example:smith_hammer"` is an entry of the `tool_binding` registry. Point it at an id that does not exist and the item carries a component nothing can resolve — the list stays empty.

:::

## Step 3 — The Blueprint: Materials, Meter and Target

```json
// data/example/mxt/forging_blueprint/spirit_sword.json
{
  "input": [
    { "id": "minecraft:iron_ingot", "count": 2 },
    { "id": "minecraft:stick", "count": 1 }
  ],
  "allowed_methods": [
    "example:light_strike", "example:heavy_strike",
    "example:quench", "example:temper"
  ],
  "meter_min": -8,
  "meter_max": 8,
  "target_min": 2,
  "target_max": 4,
  "result": "minecraft:iron_sword"
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `input` | `List<ForgingMaterial>` | **required** | The material requirement: `id` plus `count` (`count` in `1..64`, default `1`). |
| `allowed_methods` | `HolderSet<forging_method>` | empty | A list of ids, a single `"#namespace:tag"`, or omitted entirely. **Omitted or empty means no restriction.** |
| `meter_min` / `meter_max` | Integer | **required** | The two ends of the meter. They must **cross zero** (one negative, one positive). |
| `target_min` / `target_max` | Integer | **required** | The target range, inside the meter bounds. |
| `result` | Identifier | **required** | What a success produces. |

`input` is **order-independent**: the twelve input slots only have to hold at least the declared amount of every entry, and which slot it comes from changes nothing. It is also a **strict** list — an empty list, more than 15 entries, the same item twice, or an item id that does not resolve all make the whole definition fail to load. Cost lists decode just as strictly now: a malformed cost entry fails the load instead of being dropped silently.

Materials are matched by **item** (`stack.is(item)`) and not by their components. A stack carrying a quality component is therefore indistinguishable from a plain one here. To care about quality, you want the quality read at settlement (Step 4), not `input`.

::: warning The meter and target constraints work both ways

`meter_min` must be negative and `meter_max` positive, with `target_min`/`target_max` sandwiched between them. On top of that, **starting a session** runs a breadth-first search: can this blueprint's allowed methods reach the target range without leaving the meter and while satisfying the finish pattern? If not, the "use blueprint" press is refused.

:::

## Step 4 — Finish Pattern, Extra Steps and Quality

Add the finish pattern and the quality ladder to the same blueprint:

```json
"finish_pattern": {
  "steps": [
    "example:light_strike", "example:heavy_strike", "example:light_strike",
    "example:heavy_strike", "example:light_strike", "example:heavy_strike"
  ],
  "required_suffix_steps": 2
},
"max_steps": 24,
"quality_by_extra_steps": [
  { "max_extra_steps": 0, "quality": "example:flawless" },
  { "max_extra_steps": 4, "quality": "example:refined" },
  { "max_extra_steps": 2147483647, "quality": "example:common" }
]
```

```json
// data/example/mxt/quality/flawless.json
{
  "name": "quality.mxt.example.flawless",
  "color": "#FFAA00"
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `finish_pattern.steps` | six methods | `[]` | The finish pattern. When it is checked it must hold **exactly six** entries. |
| `finish_pattern.required_suffix_steps` | Integer | `0` | How many trailing entries are checked, `0..6`. |
| `max_steps` | Integer | none | The step limit. **Omitted, the blueprint can never fail on step count.** |
| `quality_by_extra_steps` | `List<QualityThreshold>` | **required** | Extra steps to quality, ascending. **The last entry must be `2147483647`.** |

`required_suffix_steps` checks only the **last N** entries of the pattern: on screen only those N cells of the "target" row carry an icon, and the earlier ones are drawn as barriers — neither shown nor checked. The blueprint above asks for the last two strikes to be light-then-heavy.

**Extra steps = actual steps − the shortest solution.** The shortest solution is computed when the session starts (that same search from Step 3), and it is *not* "how far past the target you went". The blueprint above has a three-strike optimum (heavy → light → heavy, landing on 3), so zero extra steps is a flawless piece.

- The quality is the first entry with `extra steps ≤ max_extra_steps`, so the list must be **ascending** and must end with `2147483647`.
- A tier's colour is written on the **quality definition's** own `color` (optional): with one, the item name in a tooltip, the quality line in that tooltip, the entry names in the picker's quality category and the tier table in a blueprint's tooltip are all tinted; without one they keep their usual styling (it is not a default white). That tier table is visible in the Forge Table's blueprint tooltip, and once a piece is finished the readout shows the tier it came out as.
- **A material's quality divides those extra steps.** When `forging_modifier` on an `quality` is above `1`, the same extra steps are read as fewer and buy a better tier. Among several materials the **lowest** tier wins (a piece is only as good as its worst material), materials that resolve no quality are skipped, and a missing or unusable modifier behaves as `1`.
- What is read is the **blueprint's declared `id` and `count`** — a plain stack rebuilt at settlement — not the stack that was taken. A quality that exists **only as an `mxt:item_quality` component on that particular stack is therefore invisible** to forging. To have quality participate, either declare the material as a spirit herb, or point its binding at a `quality_chain` (the chain's `default` is the tier used when no override component is written).

::: tip Completion is automatic

After every strike the server checks the session again: value inside the target range and the finish pattern matched, and it **settles at once**, writing the result into the output slot. There is no "finish" button in the interface (the protocol has a `FINISH` request, but the screen never sends it).

The flip side: a blueprint whose target range contains `0` and which requires no finish pattern completes the instant you press "use blueprint".

:::

`max_steps` is the **only** failure source: writing 24 means "the 25th strike fails it". The check runs before that strike, so the click that triggers the failure is not itself counted — it only settles the session as a failure.

## Step 5 — Settling Success and Failure

```json
"result": "minecraft:iron_sword",
"complete_action": { "type": "mxt:add_resource", "resource": "example:qi", "amount": 5 },
"fail_action": {
  "type": "mxt:apply_effect",
  "effect": "minecraft:weakness",
  "duration_ticks": 100
},
"failure_settlement": {
  "result": "minecraft:iron_nugget",
  "input_return_ratio": 0.25,
  "material_loss_ratio": 0.75
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `complete_action` | `EntityAction` | `mxt:no_op` | Run against the **player** on success. |
| `fail_action` | `EntityAction` | `mxt:no_op` | Run against the player on failure. |
| `failure_settlement.result` | Identifier | none | The scrap item a failure may produce. |
| `failure_settlement.input_return_ratio` | Double | `0` | Chance the whole material list comes back, `0..1`. |
| `failure_settlement.material_loss_ratio` | Double | `1` | The loss ratio; its complement, `1 −` it, is the chance of producing the scrap item. |

A failure settlement is **two independent rolls**: first `input_return_ratio` decides whether the locked materials go back into the input slots (whatever does not fit is dropped to the player), then `1 − material_loss_ratio` decides whether a scrap item is handed over as well. "Materials returned *and* scrap produced" is therefore a real outcome. Omitting `failure_settlement` entirely gives the default `destroy_input()`: nothing comes back.

The **cancel** button does **not** go through this settlement. It goes through a cancellation policy (by default the session's locked materials go back into the input slots), but `fail_action` still runs — cancelling counts as having produced nothing. That policy is a Java-side seam, so a data pack cannot change it.

## Step 6 — Verify

```text
/give @s mxt:forging_table
/give @s minecraft:iron_ingot[mxt:tool_binding="example:smith_hammer"]
/give @s minecraft:paper[mxt:blueprint_binding="example:sword_manual"]
/mxt registries validate
/mxt registries list
```

1. Place the Forge Table and open it. Three slots on the left take blueprints, three on the right take tools, the 4×3 block in the middle is the material input, and the result goes in the output slot on the right.
2. Put two iron ingots and a stick into the input slots. The left list now shows the result item's icon — a blueprint is **named after what it produces** in that list. Hover it: the material list appears, with a green `✔` and a have/need count for everything you hold, a red `✖` otherwise, and the step limit underneath.
3. Pick the blueprint and press "use blueprint". The materials are taken and the session starts: the meter gains a green target band, a grey zero mark and a red current value.
4. Pick a method in the right list (the icon is its `icon`; hovering shows "value change: +2") and press "use method". The value moves and the "current" row underneath records the last six strikes; with a method picked, a yellow predicted mark also appears on the meter.
5. Push the value into the green band with the last two strikes being light-then-heavy. The session settles itself, the piece lands in the output slot, and its tooltip gains a quality line — the text it shows is whatever `name` in `flawless.json` points at; omit `name` and it is generated from the entry id as `quality.mxt.example.flawless` (if you write a translation key, remember to give it an entry in your own language file).
6. Forge a second one, deliberately taking a few extra strikes, and compare the two qualities. Press "cancel" in the middle of a session to see the materials come back through the cancellation policy.
7. `/mxt registries validate` should report no errors, and `/mxt registries list` should show the entry counts of `mxt:forging_method`, `mxt:forging_blueprint`, `mxt:tool_binding` and `mxt:blueprint_binding`.

::: tip Automation, and where refusals go

Hoppers may fill the input slots; the result can only be pulled out by a hopper **below** the table. A running session locks the inputs and the blueprint slots, but never the tool slots — so dropping in a second hammer widens the method list immediately.

One reality you have to know: **a refused request never shows a message.** The reason a "use blueprint" or "use method" press failed (materials short, output occupied, out of bounds, cooling down, blueprint unreachable) only goes into the server log, on the `forging SELECT/STRIKE … outcome=` line. All the player sees is "nothing happened", and the reason is in the log.

:::

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The left list is empty | No item carrying an `mxt:blueprint_binding` component is in the blueprint slots. **There is no "list the whole registry" fallback**: three empty slots mean no blueprints. |
| A method is missing from the right list | The intersection is empty: the blueprint's `allowed_methods` does not contain it, or no placed tool unlocks it. |
| The blueprint fails to load | `input` empty, over 15 entries, the same item twice, an unresolvable id; `meter_min`/`meter_max` that do not cross zero; a quality ladder that is not ascending or does not end at `2147483647`; a `finish_pattern` that is checked but is not six entries long. |
| The "use blueprint" button is greyed out | Materials short (hover the blueprint to see which line is `✖`), something in the output slot, or a session is already running. |
| "use blueprint" does nothing | The server refused. Besides materials and the output slot, the usual cause is an **unreachable target range**: no solution exists with this blueprint's methods and finish pattern. |
| It never completes | The finish pattern names a method no tool unlocks, or the value never enters the range — remember that an out-of-bounds strike is refused outright. |
| The step limit is reached with no result | `max_steps` was hit while the piece was still incomplete: the **next** strike fails the session and the `failure_settlement` runs. |
| Every piece has the same quality | You always take the shortest solution (so extra steps stay at zero), or the materials resolve no quality — a quality marked only with an `mxt:item_quality` component does not count, see Step 4. |
| A method suddenly stops being usable | The usable set is recomputed on every strike and tool slots are never locked: removing a hammer removes its methods. |
| Pressing during the cooldown does nothing | `cooldown` is tracked per (player, table) and is checked **before** the condition and the cost, so a refused strike still spends it. |
| Materials did not come back | The input slots were full, and the remainder was dropped at the player's feet. |

## Next

- [forging_blueprint](../datapack/json/forging_blueprint.md) — the full field table and validation rules.
- [forging_method](../datapack/json/forging_method.md) and [tool_binding](../datapack/json/tool_binding.md) — the methods and the tools that unlock them.
- [blueprint_binding](../datapack/json/blueprint_binding.md) — how the component ties an item to a blueprint.
- [quality](../datapack/json/quality.md) and [quality_chain](../datapack/json/quality_chain.md) — `forging_modifier`, the chain's order and default tier, and the order qualities are resolved in.
- [MxtEvents: Events](../kubejs/api/events.md) — read or rewrite a strike's cost, or veto a phase from a script.
