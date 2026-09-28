---
title: Refine a Pill
description: Hand-build a 3x3x3 furnace, write a recipe that settles on the actual medicinal properties, heat it into the target range with an exotic fire, and wire the result up to a pill and its toxicity.
---

# Refine a Pill

Alchemy is not "place one block and start brewing". A furnace is a **fixed 3x3x3 you build by hand**: a core, an input store on each side, an output store on top, and 22 casing blocks. A recipe does not match a list of item IDs either — the server settles the result on the **actual medicinal properties** in the slots at the moment the player presses Start on the core.

This page adds one minimal production line to the example pack: two medicinal properties, three herbs (all bound to existing items), one furnace spec, one wall material, one recipe and one pill with toxicity.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/medicinal_property/nourish.json` | The main-ingredient property. |
| `data/example/mxt/medicinal_property/calm.json` | The auxiliary property. |
| `data/example/mxt/quality/common.json` | The tier the herbs and the furnace use; keep the one you already have when the example pack has it. |
| `data/example/mxt/spirit_herb/herb_a.json` | Main herb: 3 `nourish` power per item, hot. |
| `data/example/mxt/spirit_herb/herb_c.json` | Auxiliary herb: 3 `calm` power per item, cold. |
| `data/example/mxt/spirit_herb/herb_d.json` | Catalyst: 1 harmonising power per item, neutral. |
| `data/example/mxt/alchemy_furnace/basic.json` | The furnace spec: slots, capacity and cooling. |
| `data/example/mxt/alchemy_wall_material/basic_wall.json` | The temperature the wall material withstands. |
| `data/example/recipe/warming.json` | The recipe: property thresholds, thermal tolerance, target heat and tolerance, duration and outputs. |
| `data/example/mxt/pill_binding/warming_pill.json` | The pill binding: effect, uses, cooldown and toxicity. |

## Step 1 — Write the Properties First

A medicinal property is a table with nothing but a name, and a recipe refers to it by ID. It is **not an element**: do not reuse an element, aura or resource ID, and do not look for a bundled list of properties such as "blood-quickening" or "qi-gathering".

```json
// data/example/mxt/medicinal_property/nourish.json
{
  "name": "property.example.nourish"
}
```

Write a second file, `calm.json`, the same way. `name` can be omitted, in which case the key `medicinal_property.mxt.example.<path>` is generated from the entry id.

## Step 2 — Bind Existing Items as Herbs

A spirit herb registers no new item; it attaches metadata to an **existing item**: a quality, an age, a thermal bias, and how much power it provides in each of the three roles.

```json
// data/example/mxt/quality/common.json
{
  "name": "quality.example.common"
}
```

```json
// data/example/mxt/spirit_herb/herb_a.json
{
  "items": ["minecraft:red_mushroom"],
  "quality": "example:common",
  "main_effects": { "example:nourish": "3 + herb_age / 50" },
  "thermal_bias": 1.0
}
```

```json
// data/example/mxt/spirit_herb/herb_c.json
{
  "items": ["minecraft:brown_mushroom"],
  "quality": "example:common",
  "auxiliary_effects": { "example:calm": 3 },
  "thermal_bias": -1.0
}
```

```json
// data/example/mxt/spirit_herb/herb_d.json
{
  "items": ["minecraft:sugar"],
  "quality": "example:common",
  "catalyst_power": "1 + herb_age / 100"
}
```

Three things to remember:

- **The role comes from the store you put the herb in, not from the definition.** Main herbs read `main_effects`, auxiliary herbs read `auxiliary_effects`, and the catalyst reads `catalyst_power`. A main herb dropped into the auxiliary store has no power at all in that batch.
- **`thermal_bias` is hot and cold, not an element.** Negative is cold, positive is hot, and the value sits in `-1..1`; it has nothing to do with the fire or water elements.
- **`herb_age` is a local variable inside the potency formulas.** It reads the stack's `mxt:herb_age` component, falling back to that herb's `default_age` when the component is absent. Age raises the power itself and the pipeline never multiplies age in a second time; what a year of age is worth is whatever the formula says - the formula on this page folds it in as `3 + herb_age / 50` (5 at age 100), and only with something like `3 * (1 + herb_age / 100)` is one century-old A worth two fresh ones. The thermal weighting moves with age too, which makes an exactly balanced recipe sensitive to it.

To make a herb plantable, give the definition a `growth` object (the required seeds, `mature_age` / `max_age`, `growth_rate`, texture and harvest; `condition` and `costs` are optional). All three herbs here are for the furnace only, so they omit `growth`.

## Step 3 — The Furnace Spec and the Wall Material

A furnace spec is a **specification**, not a block in the world: the core item carries it as a component, and without a spec — or with one that is not in the registry — the furnace cannot run.

```json
// data/example/mxt/alchemy_furnace/basic.json
{
  "quality": "example:common",
  "main_slots": 2,
  "auxiliary_slots": 2,
  "capacity": 64,
  "cooling_per_tick": 0.5
}
```

```json
// data/example/mxt/alchemy_wall_material/basic_wall.json
{
  "max_temperature": 200
}
```

- `main_slots` takes `1..2` and `auxiliary_slots` takes `0..2`. The catalyst always occupies the third slot of the auxiliary store and needs no declaration, while a slot the spec does not use accepts nothing.
- `capacity` caps how many material items one batch may hold, and the item's own stack size still applies.
- `cooling_per_tick` is how much the heat falls back per tick once it is above the set point or the fire is gone. With no fire at all the heat cools to `0`.
- **The furnace withstands the coldest wall in it.** When all 22 casings are valid the furnace takes the lowest of their values and then the lower of that and the fire's own ceiling; mixing in a heat-resistant casing does not average the weak spot away. The set temperature must land between `0` and that ceiling.
- Quality only decides the display name and the use condition. It never derives slots, capacity, cooling or the temperature ceiling.

## Step 4 — Build the Furnace, Load the Fire, Load the Herbs

The shape is fixed and a data pack cannot change it. Place the core facing north and lay the rest out like this:

```text
Facing the front. Left column x=2, right column x=0. Middle layer y=1, bottom row nearest you:

            back z=2
left  x=2   wall 17 | wall 16 | wall 15    right x=0
            main 14 | air  13 | aux  12
front z=0   wall 11 | core 10 | wall  9
```

1. Put the core on the front face of the middle layer at `(1,1,0)`, where `index = x + 3 * z + 9 * y` equals `10`. It faces north by default; standing north of it and facing south, your left is local `x = 2`.
2. Put the main input store at `(2,1,1)` (index 14) on the left, the auxiliary input store at `(0,1,1)` (index 12) on the right, and the output store at `(1,2,1)` (index 22) on top. The two input stores are different block IDs, and rotating them never changes their role.
3. Leave the centre `(1,1,1)` empty; nothing may occupy that cell.
4. Fill the other 22 cells with `mxt:alchemy_furnace_casing`, each carrying the wall material.
5. Put the exotic fire in the core, the main herbs in the left store, and the auxiliary herbs and catalyst in the right store.

```mcfunction
give @s mxt:alchemy_furnace[mxt:alchemy_furnace="example:basic"]
give @s mxt:alchemy_main_input
give @s mxt:alchemy_auxiliary_input
give @s mxt:alchemy_output
give @s mxt:alchemy_furnace_casing[mxt:alchemy_wall_material="example:basic_wall"]
```

You need 22 casing blocks (taking them straight from the creative inventory is the quickest way). A shell with a missing cell, an invalid wall material or a cell claimed by another furnace does not form, and the screen lists in words what is missing.

::: warning There is no built-in heat source

The item that heats the core has to come from a mod; a data pack cannot create one. Without it the heat never rises and starting a batch is refused over temperature, so first make sure your environment has a usable exotic fire.

:::

## Step 5 — The Recipe

A recipe uses the vanilla recipe type `mxt:alchemy` and lives at `data/<namespace>/recipe/<path>.json`; it is **not** a datapack registry. It judges by medicinal property, and the fields below are all of them.

```json
// data/example/recipe/warming.json
{
  "type": "mxt:alchemy",
  "main_requirements": { "example:nourish": 6 },
  "auxiliary_requirements": { "example:calm": 6 },
  "catalyst_requirement": 1,
  "balance_tolerance": 0,
  "target_temperature": 100,
  "temperature_tolerance": 5,
  "duration": 200,
  "max_bad_ticks": 2,
  "minimum_aura": { "example:qi": 10 },
  "success_outputs": [
    {
      "id": "mxt:pill",
      "count": 1,
      "components": { "mxt:pill": { "binding": "example:warming_pill" } }
    }
  ],
  "failure_outputs": [{ "id": "mxt:alchemy_dregs" }]
}
```

- The thresholds are per role and only compare **property keys and amounts**. Splitting or merging stacks inside one role changes nothing: two `herb_a` in two main slots are equivalent to a single stack of two.
- A non-zero main or auxiliary property the recipe does not ask for makes the recipe fail to match, and no material is consumed. That is why each of the three herbs provides exactly one property.
- `balance_tolerance: 0` demands a perfect balance, judged as the absolute value of `Σ(amount × power per item × thermal bias) / Σ(amount × power per item)` staying inside the tolerance. For this recipe `2 × herb_a + 2 × herb_c + 1 × herb_d` at age zero lands exactly on `0`.
- When several recipes match at once, only the one that **uniquely dominates** every other survives: same set of property keys, every entry no smaller, and at least one entry strictly larger. The player never picks a recipe, and no unique result means a recipe conflict that consumes nothing either.
- `target_temperature` and `temperature_tolerance` are the heat window. **The set temperature of the first batch must fall inside it**, so this recipe asks you to set the heat to `95..105`.
- `minimum_aura` checks the **environment aura**; it is neither a cost nor heat. Name an aura your world actually has, or let the zone override the requirement with `alchemy_env_bonus` (that flag only replaces the threshold, it never provides heat).
- `duration` is shortened by the brewing modifier of the materials: take the lowest tier among them, then `effective duration = max(1, round(declared duration ÷ modifier))`. It is computed once when the batch starts and frozen into that batch.
- The failure outputs are declared by the recipe; the server never stuffs dregs in on its own, and leaving `failure_outputs` out means a failed batch produces nothing.
- `guide` is optional example metadata. The furnace neither reads nor shows it, so drop it if you do not want to maintain it.

Loading materials never starts a batch. The player checks on the core's page whether the mixture has matched, then presses Start.

## Step 6 — The Pill and Its Toxicity

A pill binding does not have to claim any item: the output of the recipe above already writes the `binding` of `mxt:pill` into the component.

```json
// data/example/mxt/pill_binding/warming_pill.json
{
  "name": "pill_binding.example.warming_pill",
  "max_uses": 2,
  "cooldown": 20,
  "toxicity_gain": 25,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 20,
  "on_consume": { "type": "mxt:heal", "amount": 4 }
}
```

With no finished pill at hand you can hand one out directly:

```mcfunction
give @s mxt:pill[mxt:pill={binding:"example:warming_pill"}]
```

- The use cap counts per **binding**, not per item ID, so carrying the effect on another item does not get around it. Uses and cooldown are recorded on the body: death, a dimension change and logging back in all leave them alone.
- Toxicity is a per-body ledger too: `toxicity_gain` is added by each dose, `on_overdose` only fires once the total reaches `toxicity_threshold`, and `toxicity_after_overdose` is what is left afterwards. The threshold means "reaching it fires", not "no more pills allowed".
- Clear toxicity with a negative `add` on the entity action `mxt:modify_pill_toxicity`, which does not touch the use count; read it with the entity condition `mxt:pill_toxicity` or the formula variable `pill_toxicity`.
- Toxicity does not fade on its own by default. With **Server Config → Alchemy → Natural toxicity decay per second** set to a positive number, an active entity that already has toxicity loses some once every 20 ticks, nothing happens offline, and an entity that has never taken a pill does not gain an empty ledger.

## Verify

```text
(load the world again)
/mxt registries validate
/mxt registries list
```

1. Once the shell is laid out, every cell draws the geometry of the whole cauldron at that cell. When that does not line up, a cell is missing, a wall material is invalid, the centre cell is not empty, or another furnace has claimed a cell.
2. Right-click the core, the main store, the auxiliary store and the output store to open one page each: the core's page is the heat readout with Set / Start / Abort, and the other three are their own slots. All four read the state of the same furnace rather than keeping a second inventory inside the block.
3. Put the exotic fire in the core, the main herbs in the left store, and the auxiliary herbs and the catalyst in the right store. Loading materials does not start a batch.
4. Set the heat to `100` on the core's page, submit it, and press Start: the batch begins, the state walks from idle through warming to running, the heat closes in on the set point, and the progress and remaining ticks follow.
5. Take the result out of the output store once it appears. That store is take-only; when it cannot fit the result the batch waits at "waiting for output space", and freeing a slot lets it in without brewing again.

::: warning This page does not promise that a batch brews correctly

How a batch **settles once it has started** has not been checked item by item in game yet, so this page promises no particular result for a recipe. Points 4 and 5 above list what you can watch with your own eyes — the structure forming, the four screens opening, the batch starting, the heat moving and the result entering the store. The verdict itself is what the core's page reports as its state and failure reason.

:::

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The structure never forms | The centre `(1,1,1)` is occupied, a cell is missing, a casing carries no valid wall material, or another furnace claimed a cell. |
| The heat never rises | There is no exotic fire in the core, or the fire and the coldest wall have pushed the ceiling below the set point. |
| The first batch is refused | The set temperature must fall inside the recipe's tolerance, and when the ceiling is too low the temperature cannot even be set. |
| The materials seem to do nothing | The role comes from the **store**: main herbs read `main_effects`, auxiliary herbs read `auxiliary_effects` and the catalyst reads `catalyst_power`. The wrong store means no power. |
| Enough power, but a recipe conflict | A non-zero main or auxiliary property the recipe does not ask for, several matching recipes with no unique dominator, or a thermal deviation outside `balance_tolerance`. |
| Home-grown herbs break the balance | A harvested herb carries the age it was picked at, so its power and thermal weighting move. Use age-zero herbs, or widen `balance_tolerance`. |
| The output store is full | The batch waits at "waiting for output space" and the core keeps the result that was generated but not stored yet; free a slot and it goes in. |
| A wall or a store was removed mid-batch | That batch settles as a failure once and does not return the materials already loaded; removing a store only drops that store's own contents. |
| A hopper will not pull the result | The output store can only be pulled from its bottom face, and once the furnace is formed that face looks onto the centre air cell. |

## Next

- [alchemy_recipe](../datapack/json/alchemy_recipe.md) — the full field list, plus how matching, duration and outputs behave.
- [alchemy_furnace](../datapack/json/alchemy_furnace.md) and [alchemy_wall_material](../datapack/json/alchemy_wall_material.md) — slots, capacity, cooling and the temperature ceiling.
- [medicinal_property](../datapack/json/medicinal_property.md) and [spirit_herb](../datapack/json/spirit_herb.md) — properties, power, thermal bias, age and planting.
- [pill_binding](../datapack/json/pill_binding.md) — use caps, cooldown, toxicity and what is left after an overdose.
- [quality](../datapack/json/quality.md) — how `alchemy_modifier` shortens a batch.
- [Items and Blocks](../player-guide/items.md) — how the furnace parts, the plot and the pill carrier behave in game.
