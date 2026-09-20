---
title: MiXianTu
description: "Documentation for MiXianTu, a NeoForge cultivation mod framework: installation, player content, datapack format, KubeJS API and Java API."
---

# MiXianTu

MiXianTu is a **cultivation mod framework** for NeoForge. It provides the **generic rules and runtime** that cultivation gameplay needs — cultivation, aura environment, realms and resources, abilities, formations, tribulations, forging, alchemy and economy — without prescribing any particular setting or numbers.

The actual items, blocks and recipes are provided by datapacks, KubeJS or other content mods, and MiXianTu's data tables and binding tables give them gameplay.

- **Players**: installing the mod on its own only gives you framework items, Curios slots, HUD and commands; what you can actually play depends on the datapack or content pack you use.
- **Content and mod authors**: define your own cultivation rules, aura distribution, abilities, formations, crafts and item bindings with datapacks, KubeJS or the Java API, without changing the mod itself.

::: warning Work in progress

The project is still in development. Datapack formats and other interfaces are not final, and updates may no longer be compatible with old saves or old datapacks. Changes that can cause crashes or data loss will be called out explicitly in the changelog.

:::

## Where to start

| Goal | Documentation |
|---|---|
| Install the mod and check requirements | [Installation](./installation.md) |
| Build your first content step by step | [Tutorials](./tutorial/index.md) |
| Learn the keybinds, HUD, items and commands | [Player Guide](./player-guide/keys-and-hud.md) |
| Write your first datapack | [Datapack overview](./datapack/overview.md) |
| Look up every field of a data table | [JSON Data Formats](./datapack/json/index.md) |
| Browse the built-in action and condition types | [Types Reference](./datapack/types/index.md) |
| Extend the framework from a script | [KubeJS](./kubejs/index.md) |
| Build an addon in Java | [Java API](./java/index.md) |
| Read how a subsystem is implemented inside | [Technical Details](./technical/index.md) |
| Common questions | [FAQ](./faq.md) |

## Requirements

| Item | Requirement |
|---|---|
| Minecraft | `26.1.2` |
| NeoForge | `26.1.2.99` |
| Dependencies | Jupiter is required; other required dependencies are bundled with the mod |
| Optional | KubeJS (scripted content), JEI (recipe viewer), Jade (block information) |

## Module status

- **✅ Done**: everything is implemented and usable right away; minor changes may still happen later.
- **🚧 In Progress**: only part of the feature set is done, the rest is still being developed.
- **🔲 Planned**: only data structures or assets exist, or there is only a development plan.

| Module | Status | Description |
|----|:------:|----|
| Datapack Core |   ✅    | Gameplay rules are described by datapacks: conditions, effects, number calculation, item matching and trigger timing can all be freely combined, and a single entry can be disabled at any time. |
| Hotbar and Character UI |   ✅    | Players can open the ability and spirit power hotbars with a key and cast directly from them, open the character information panel to check their own state, and choose which entries appear on the hotbar. |
| Resources |   ✅    | Numeric resources such as cultivation progress and spirit power can be defined; they regenerate by rule, are consumed by abilities and cultivation, and are drawn as resource bars on the HUD. |
| Aura |   ✅    | The world has different aura concentrations per dimension, biome and block, changing over time and with formations; players can query the concentration at their position and see the result through particles, fog and the HUD. |
| Cultivation and Realms          |   ✅    | Players can meditate to accumulate cultivation progress, faster where aura is dense; once the requirements are met they can break through to the next realm, with those requirements defined by datapacks. |
| Elements |   🚧   | Defines elements and the overcoming and adaptation relations between them, read by spirit roots, aura and other gameplay. |
| Spirit Roots and Physiques      |   ✅   | Spirit roots and physiques can be granted to players, affecting cultivation and ability strength or directly providing passive attributes and damage multipliers; how they are obtained and which ones exclude each other is defined by datapacks, and a held root or physique can also be switched off without being given up. |
| Techniques |   🚧   | Players can learn cultivation techniques to gain active moves or passive bonuses, and exclusion tags can stop certain techniques from being learned together; a technique can be bound to any existing item as its carrier. |
| Abilities and Curses            |   🚧   | Abilities can be cast from the hotbar with a cost, cooldown, duration and target selection, and can also fire automatically on attacking, being hurt, killing and other timing; curses attach to a character, trigger periodically and can be removed by purification. |
| Formations |   ✅    | Players can build and activate formations; a formation keeps running by consuming resources, applies effects within its area and temporarily provides buffs/debuffs. |
| Tribulations |   🔲   | A tribulation can be triggered on a realm breakthrough: it consumes a timeline of entries, gets harder with the environment, and success or failure each run their own outcome. |
| Creature Profiles and Contracts |   🔲   | Creature profiles define a creature's strength, inner core and drops; players can also sign a contract with a creature, letting the spirit beast follow and fight, be stored in a Spirit Beast Bag or recalled with a Beast Taming Bell. |
| Secret Realms |   ✅    | A realm definition is a template: every entry opens an instance dimension of its own, with a border, structures and landing points, plus caps on instances, members and time; a realm can be claimed by its first visitor, and a claimed realm is unloaded but keeps its terrain for the next visit. |
| Spirit Crafting Table |   ✅    | Crafting with a spirit crafting recipe at the Spirit Crafting Table costs aura in addition to materials, deducted when the result is taken out. |
| Forging |   ✅    | At a Forge Table, several materials are hammered into a result following a blueprint; different tools unlock different methods, and the quality of the result depends on the process and the number of steps. |
| Alchemy |   🚧   | Recipes and the batch state machine are ready (materials, aura, temperature, furnace tier, success and failure outputs), but **the alchemy workstation itself has not been started**, so there is no way to begin a batch yet; taking a pill applies its effect, and taking too many accumulates toxicity. |
| Spirit Herbs |   🔲   | Defines binding and quality for spirit herb items, which serve as materials for alchemy and gathering gameplay. |
| Item Binding |   🚧   | Brings existing items into gameplay: attach passive behavior, weapon damage and attack speed to any item, or bind abilities that fire on right-click use and on attack. |
| Talismans |   🚧   | A Talisman Brush inscribes ability definitions onto a carrier (one carrier can hold several), and its capacity is the aura those definitions bill; holding right-click until it is full fires every inscribed ability and spends one carrier. Being filled on a Display Stand does the same - a carrier there is in nobody's hand, so it **fires whatever filled it, always spends a carrier and never enters the use cooldown**, while a right-click spends one carrier per invocation (none in creative) and starts the configured item cooldown. |
| Item Quality |   🚧   | Items can carry a quality shown in their tooltip, can be grouped and sorted by quality, and a quality group can also be read as a condition by other gameplay. |
| Artifacts |   🚧   | Artifacts can store spirit power, carry the player in flight or provide abilities, and come with a refining gameplay. |
| Economy |   ✅    | Items can be defined as currency with a value, supporting exchange and change; players can trade directly with each other, or use trade stations and cheques to settle transactions. |
| Curios Slots |   ✅    | Players have four Curios slots — Back Weapon and Belt Item — rendered on the character, and swappable with the main hand by keybind. |
| Friend and Foe Identification   |   ✅    | Every player can keep a list of the players they treat as their own, for the session or saved with the world, and other mods or scripts can answer the same question through a TriState event; it is asked by **player id**, so with FTB Teams installed it can answer for somebody who is offline.                                                                                                                                                                                                                                                 |


## Links

- **[Datapack Visual Editor](https://datapack.mcdev.tech/)**: edit this mod's datapacks in the browser as a form, with field descriptions and registry completion.
