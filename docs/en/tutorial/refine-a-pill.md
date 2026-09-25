---
title: Refine a Pill
description: "The alchemy tutorial is not written yet: this page first lays out which parts of the system exist, which of them already work, and which are not wired up."
---

# Refine a Pill

::: warning This page is a placeholder

The alchemy **data format** is settled, but the **workbench is not wired up**: nothing in the mod currently reads an `mxt:alchemy` recipe. So there is no step-by-step walkthrough here yet — only a list of the parts that exist, the ones that already work, and the entry points that are missing, so you do not spend an evening building against the field table and then find there is nowhere to light the furnace.

:::

## What Exists Today

| Part | Where | State |
| --- | --- | --- |
| Alchemy recipe | `data/<namespace>/recipe/<path>.json` with `"type": "mxt:alchemy"` | The format is settled; the fields are in [alchemy_recipe](../datapack/json/alchemy_recipe.md). |
| Session and settlement | `AlchemySession`, `AlchemyWorkstationState`, `AlchemyWorkstationService` under `runtime/alchemy` | Complete logic: lock the materials, advance per tick, produce the success or failure outputs, run the entity and block actions. |
| Workbench interface | `AlchemyWorkstation` | **An interface only**: no class in the repository implements it, and nothing calls `startAlchemy` / `tickAlchemy`. The implementation is what supplies the temperature and the furnace tier. |
| Spirit Crafting Table | The block `mxt:spirit_crafting_table` | Runs [spirit crafting](../datapack/json/spirit_crafting.md) only (`mxt:spirit_shaped` / `mxt:spirit_shapeless`). There is **no code path between it and alchemy**. |
| Pills and pill toxicity | [pill_binding](../datapack/json/pill_binding.md) | Fully working: as soon as the produced item matches, it has toxicity gain, a threshold and an overdose action. |
| Spirit herbs | [spirit_herb](../datapack/json/spirit_herb.md) | Fully working: it attaches metadata (quality, growth, drops) to **existing** items and registers none of its own. |
| The alchemy modifier of a quality | `alchemy_modifier` in [quality](../datapack/json/quality.md) | Fully working: it only changes the brewing duration, and reads the **lowest** tier among the batch's own materials. |

## What You Can and Cannot Do Today

**What you can do** is everything on the data side: recipes, pill bindings, spirit herbs and quality modifiers all decode, and `/mxt registries validate` will confirm it.

**What you cannot do** is brew a batch in game. There is no way to start one — no block, no block entity, no screen, no command — so a recipe registers normally (it is an ordinary recipe) but nothing ever matches and starts it, and neither `minimum_furnace_tier` nor `target_temperature` has any source that could satisfy it.

::: tip If you want to push alchemy forward now

What is missing is a block entity implementing `AlchemyWorkstation`: a block that holds the inputs, calls `tickAlchemy` once per tick, and answers `furnaceTier()` and `temperature()`. All three live in the mod's Java side; a data pack cannot provide them.

:::

## Three Traps Worth Knowing

Before writing a recipe, keep these three in mind (all from the existing decoding and runtime):

- **The temperature tolerance must not be negative.** It defaults to `0`, a negative value decodes fine, and the batch is then immediately treated as spoiled.
- **A key in `minimum_aura` that does not resolve is silently dropped**, leaving one log line — a misspelt aura name reads like "this aura is not required".
- **A wrong item id in the outputs does not fail at load time.** It fails when the batch ends and the items are actually handed out, which wastes the whole batch. The `items` lists of spirit herbs and pill bindings are tolerant in the same way: a broken entry disappears with one log line.

## The Reference Pages That Already Exist

- [alchemy_recipe](../datapack/json/alchemy_recipe.md) — materials, temperature and tolerance, furnace tier, duration, minimum aura, success and failure outputs, and the four action fields.
- [pill_binding](../datapack/json/pill_binding.md) — toxicity gain, threshold, the residue left after an overdose, and the overdose action.
- [spirit_herb](../datapack/json/spirit_herb.md) — the herb metadata, its quality, and the herb-tag matcher.
- [quality](../datapack/json/quality.md) — `alchemy_modifier` and the order qualities are resolved in.

## What the Tutorial Will Cover

Once the workbench exists, this page becomes a walkthrough shaped like [Forge a Treasure](./forge-a-treasure.md): write a recipe, match the materials as a multiset, hold the temperature inside its tolerance, wire up a minimum aura, shorten the duration with a quality modifier, attach the toxicity rules to the output, and verify both the success and the failure path of a batch in game.

## Next

- [Forge a Treasure](./forge-a-treasure.md) — the same "station + recipe + quality" shape, and that one runs today.
- [Spirit Crafting](../datapack/json/spirit_crafting.md) — the only recipe family the spirit crafting table currently serves.
