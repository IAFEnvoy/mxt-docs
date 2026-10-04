---
title: FAQ
description: Short answers to the most common questions about installing MiXianTu, its dependencies, switching content off temporarily and content packs.
---

# FAQ

## Why Does Nothing Change in Game After Installing the Mod?

The mod only provides the framework, generic items, slots, HUD and commands; it contains no realm values, abilities or recipes. You need a datapack or content pack (including content written with KubeJS) before real gameplay appears. Start with the [Datapack overview](./datapack/overview.md) and look up individual tables in [JSON Data Formats](./datapack/json/index.md).

## What Dependencies Are Required?

Jupiter and ApricityUI are required dependencies, and every other required dependency is bundled inside the mod. KubeJS is only needed if you want to register content from scripts. JEI and Jade are optional compatibility mods, and the game works fine without them. See [Installation](./installation.md) for the exact versions.

## How Do I Switch a Piece of Content Off Temporarily?

Write a NeoForge resource condition into **the definition file itself**; an entry whose condition does not hold **never enters the registry**, so nothing reads it and it never shows up in command completion either:

```json
{
  "neoforge:conditions": [
    { "type": "neoforge:never" }
  ]
}
```

`neoforge:never` is always false, which makes it the simplest pack-wide switch; delete the block again and the entry is live as before. The conditions all live in the `neoforge:` namespace: `never` / `always`, `mod_loaded` (`modid`), `registered` (`registry`, defaulting to `minecraft:item`, plus `value`), `and` / `or` (`values`), `not` (`value`) and `feature_flags_enabled` (`flags`). A condition can be written in **any** registry entry file; every datapack registry treats them the same way. Tag-based conditions such as `tag_empty` **cannot** be used here, because tags are not bound yet when a registry entry is decoded; recipes and loot tables can use them. When the condition holds, `neoforge:conditions` is stripped before the definition codec sees the file and every other field is read as usual.

**A condition that does not hold is not a load error.** The loader marks the entry `SKIPPED_ELEMENT_MARKER` and skips it, leaving one DEBUG line, `Skipping loading registry entry … as its conditions were not met`, and the world loads normally. So when "the file is right there and the game ignores it", that DEBUG line is the only clue — and the default log level does not show it.

The price is that "gone" means gone: an entry whose condition fails is the same as a definition that was never written, and a holder reference pointing at it fails to decode along with it. There is no middle state where the definition stays around, stops taking part in gameplay and can still be referenced by others. The project is still unreleased, so old JSON and old saves are not guaranteed to stay compatible. See the [Datapack overview](./datapack/overview.md) for the rest of the loading rules.

## Why Does `/reload` Not Apply My Edit?

MiXianTu's registries are native Minecraft data pack registries and its data maps are read in the same pass, and Minecraft reads them **while the world loads**. `/reload` only refreshes recipes, loot tables, advancements, functions and the KubeJS server scripts, so it never re-reads a MiXianTu registry or data map.

To apply an edit, load the world again: in single player, leave to the title screen and open the world again; on a server, restart it. A file that cannot be decoded prevents the world from loading until it is fixed, because the registries keep no previous snapshot. See [Loading, Syncing and Debugging](./datapack/overview.md#loading-syncing-and-debugging).

## Why Does a Formula Fail Only in My Development Environment?

A formula problem that the codec can already see while the data pack is parsed — a malformed expression, a bad `params` entry, an empty weighted list — is a **decode error**. The loader collects every failing entry and reports them together, and the load fails with its usual aggregated error, so you see *all* broken formulas at once rather than only the first one. That part behaves the same in development and in production.

Problems that only show up when a formula is evaluated — a name no variable provides, a name the current context cannot supply such as `realm_rank` in an ability formula, a variable that produces `NaN` or a variable that throws — are reported at runtime instead, because nothing can know them earlier. A development environment logs the whole error, including the exception and its stack trace when there is one, and keeps evaluating with `0`; production logs one warning line per distinct message and also continues with `0`. So a typo is loud while you write the data pack, is still visible in a server log, and never silently zeroes a value forever. See [Formula Variables](./datapack/types/formula_variables.md).

## Can I Make My Own Content Pack and Distribute It?

You can build content packs on this framework, and distributing them is not restricted in any way.

::: warning License

The mod's code and assets are **All Rights Reserved**, and commercial distribution (such as a paid server) requires extra permission — see LICENSE for details.

:::

## Where Can I Edit Datapacks Without Writing JSON by Hand?

The [Datapack Visual Editor](https://datapack.mcdev.tech/) edits this mod's datapacks in the browser as a form, with field descriptions and registry completion.

## Where Can I Ask Questions?

Join our [Discord](https://discord.gg/NDzz2upqAk) to discuss.
