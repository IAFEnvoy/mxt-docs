---
title: Installation
description: Requirements, dependencies and optional integrations for running MiXianTu on a NeoForge client and server.
---

# Installation

MiXianTu is a NeoForge mod, so it installs like any other mod: set up a matching NeoForge installation for the required Minecraft version, then put the MiXianTu jar and its required dependency in the `mods` folder of both the client and the server.

## Requirements

| Item | Requirement |
|---|---|
| Minecraft | `26.1.2` |
| NeoForge | `26.1.2.99` or newer |
| Side | Client and server (`BOTH`) |
| Mod ID | `mxt` |
| Version | `1.0-alpha.2` |
| License | `All Rights Reserved` |

## Dependencies

Jupiter is a required dependency and is **not** bundled inside the mod jar, so it has to be installed separately next to MiXianTu. Every other required dependency is packaged inside the MiXianTu jar through Jar-in-Jar and needs no manual download.

| Dependency | Status |
|---|---|
| Jupiter | Required, install separately |
| Curios API `15.0.0+26.1.2` | Required, bundled with the mod |
| Other required libraries | Bundled with the mod |

## Optional Integrations

These mods are optional compatibility. The game works fine without them.

| Mod | Purpose |
|---|---|
| KubeJS `26.1.2-8.0.4` | Only needed if you want to register content from scripts. See [KubeJS](./kubejs/index.md) |
| JEI | Recipe viewer integration: shows Spirit Shaped and Spirit Shapeless crafting and their aura cost |
| Jade | Block information integration: block aura, the Spirit Crafting Table's aura and the Display Stand's stored spirit power |

::: info KubeJS is not a hard dependency

KubeJS is only needed for content that is registered from scripts. A purely datapack-based setup does not need it.

:::

## Configuration

Every setting lives in the **in-game config screen**: open **Mods → MiXianTu → Config**, and switch between "Client Settings" and "MiXianTu Server Config" at the top. There is no need to hand-edit anything under `config/`.

| Part | Permission | Tabs |
|---|---|---|
| Client Settings | none (this machine only) | Ability Hotbar, Resource Bars, Information Panel, Techniques, Rifts |
| MiXianTu Server Config | **operator** | Curios Slots, Cultivation, Talisman, Aura, Formations, Command Aliases, Compatibility |

Server settings are synced to connected clients after a change. These docs name a setting as **Server Config → Tab → Entry** or **Client Settings → Tab → Entry**, which is what you look up in the screen.

## Development Status

::: warning Work in progress

The project is still in development. Datapack formats and other interfaces are not final, and updates may no longer be compatible with old saves or old datapacks. Changes that can cause crashes or data loss will be called out explicitly in the changelog.

:::

## Where the Gameplay Comes From

MiXianTu provides the generic rules and runtime — cultivation, aura environment, realms and resources, abilities, formations, tribulations, forging, alchemy and economy — without prescribing any particular setting or numbers. The actual items, blocks and recipes are provided by datapacks, KubeJS or other content mods, and MiXianTu's data tables and binding tables give them gameplay.

Installing the mod on its own only gives you framework items, Curios slots, the HUD and commands; it contains no realm values, abilities or recipes, so nothing changes in game until you add content.

- To write that content as a datapack, start with the [Datapack overview](./datapack/overview.md) and look up individual fields in [JSON Data Formats](./datapack/json/index.md).
- To build content packs on this framework and distribute them, see the [FAQ](./faq.md) for the licensing note.
