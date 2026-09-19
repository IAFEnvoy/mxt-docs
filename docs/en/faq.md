---
title: FAQ
description: Short answers to the most common questions about installing MiXianTu, its dependencies, disabling content and content packs.
---

# FAQ

## Why Does Nothing Change in Game After Installing the Mod?

The mod only provides the framework, generic items, slots, HUD and commands; it contains no realm values, abilities or recipes. You need a datapack or content pack (including content written with KubeJS) before real gameplay appears. Start with the [Datapack overview](./datapack/overview.md) and look up individual tables in [JSON Data Formats](./datapack/json/index.md).

## What Dependencies Are Required?

Jupiter is a required dependency, and every other required dependency is bundled inside the mod. KubeJS is only needed if you want to register content from scripts. JEI and Jade are optional compatibility mods, and the game works fine without them. See [Installation](./installation.md) for the exact versions.

## How Do I Disable a Piece of Content Temporarily?

Add the entry to the `mxt:disabled` tag; disabled definitions stop taking part in gameplay, and you do not have to delete any datapack files.

Every dynamic registry has its own disabled tag at a fixed path:

```text
data/mxt/tags/mxt/<registry>/disabled.json
```

```json
{
  "replace": false,
  "values": [
    "example:old_definition",
    "othermod:disabled_definition"
  ]
}
```

Replace `<registry>` with the registry name, for example `data/mxt/tags/mxt/item_binding/disabled.json`. Entries in `disabled` are not actively used by the corresponding service, but they stay in the registry, so other definitions can safely keep a Holder to them. The project is still unreleased, so old JSON and old saves are not guaranteed to stay compatible. See the [Datapack overview](./datapack/overview.md) for the rest of the loading rules.

## Why Does `/reload` Not Apply My Edit?

MiXianTu's data tables are native Minecraft data pack registries, and Minecraft reads those **while the world loads**. `/reload` only refreshes recipes, loot tables, advancements, functions and the KubeJS server scripts, so it never re-reads a MiXianTu table.

To apply an edit, load the world again: in single player, leave to the title screen and open the world again; on a server, restart it. A file that cannot be decoded prevents the world from loading until it is fixed, because the registries keep no previous snapshot. See [Loading, Reloading and Syncing](./datapack/overview.md#loading-reloading-and-syncing).

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
