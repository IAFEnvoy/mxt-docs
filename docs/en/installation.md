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

## Dependencies

Jupiter and ApricityUI are required dependencies and are **not** bundled inside the mod jar, so they have to be installed separately next to MiXianTu. Every other required dependency is packaged inside the MiXianTu jar through Jar-in-Jar and needs no manual download.

| Dependency | Download |
|---|---|
| Jupiter | <https://www.curseforge.com/minecraft/mc-mods/jupiter> |
| ApricityUI | <https://www.curseforge.com/minecraft/mc-mods/apricityui> |

## Optional Integrations

| Mod | Purpose |
|---|---|
| KubeJS | Only needed if you want to register content from scripts. See [KubeJS](./kubejs/index.md) |
| JEI | Recipe viewer integration: shows Spirit Shaped and Spirit Shapeless crafting and their aura cost |
| Jade | Block information integration: block aura, the Spirit Crafting Table's aura, the Display Stand's stored spirit power, a spirit herb's age and maturity, and a heat block's maximum furnace temperature and heating rate |

## Configuration

Every setting lives in the **in-game config screen**: open **Mods → MiXianTu → Config**.

::: warning

Nothing under `config/` needs a hand edit, and hand-editing it is not recommended.

:::

| Part | Permission | Tabs |
|---|---|---|
| Client Settings | none (this machine only) | Wheel Menu, Resource Bars, Information Panel, Techniques, Rifts, Tooltips |
| Server Config | **operator** | Curios Slots, Cultivation, Lifespan, Reincarnation, Talisman, Aura, Formations, Command Aliases, Compatibility |

These docs name a setting as **Server Config → Tab → Entry** or **Client Settings → Tab → Entry**, which is what you look up in the screen.
