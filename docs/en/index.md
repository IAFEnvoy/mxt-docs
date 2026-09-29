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
| Dependencies | Jupiter and ApricityUI are required; other required dependencies are bundled with the mod |
| Optional | KubeJS (scripted content), JEI (recipe viewer), Jade (block information) |

## Module status

- **✅ Done**: everything is implemented and usable right away; minor changes may still happen later.
- **🚧 In Progress**: only part of the feature set is done, the rest is still being developed.
- **🔲 Planned**: only data structures or assets exist, or there is only a development plan.

The **status** column says how far along a module is (it follows the code, and is kept in step with the mod repository's two READMEs); the **description** column only says what it provides.

| Module | Status | Description |
| --- | :--: | --- |
| Datapack Core | ✅ | Gameplay rules are described by datapacks: conditions, effects, number calculation, item matching and trigger timing can all be freely combined, and a single entry can be kept out of the registry at load time with a condition. |
| Wheel and Character UI | ✅ | Abilities (artifact skills included) and spirit power share one wheel: the main wheel's twelve cells are yours to arrange, the pages behind it follow what you carry and the Beast Taming Bell in hand, and holding `R` uses the cell you point at. |
| Resources | ✅ | Numeric resources such as cultivation progress and spirit power can be defined; they regenerate by rule, are consumed by abilities and cultivation, and are drawn as resource bars on the HUD. |
| Aura | ✅ | The world has different aura concentrations per dimension, biome and block, changing over time and with formations; players can query the concentration at their position and see the result through particles, fog and the HUD. |
| Cultivation and Realms | ✅ | Players meditate to gather cultivation progress, faster where aura is dense, and break through to the next realm once the datapack requirements are met; realms and packs grant lifespan, and running out means death or rebirth as configured. |
| Elements | ✅ | Defines elements and the overcoming and adaptation relations between them, read by spirit roots, aura and other gameplay. |
| Spirit Roots and Physiques | ✅ | Spirit roots and physiques can be granted to players, affecting cultivation, ability strength or passive attributes; exclusions are defined by datapacks, and a held one can be switched off without being given up. |
| Techniques | 🚧 | Learning a cultivation technique grants active moves or passive bonuses, and exclusion tags stop certain techniques from being learned together; a manual is an item with the `mxt:technique` component, and the mod generates a jade slip per technique. |
| Abilities and Curses | ✅ | Abilities can be cast with a cost, cooldown, duration and target selection, and can also fire automatically on attacking, being hurt or killing; curses attach to a character, trigger periodically and can be removed by purification. |
| Formations | ✅ | Players build and activate formations; a formation keeps running by consuming resources, applies effects within its area and temporarily provides buffs/debuffs. |
| Tribulations | ✅ | A tribulation can be triggered on a realm breakthrough: it consumes a timeline of beats (an action, an idle wait, or a wait for a condition), gets harder with the realm and the local aura, and success or failure each run their own outcome. |
| Creature Profiles and Contracts | 🚧 | Creature profiles define a creature's strength, inner core and spawn action, and can declare a progression chain the beast climbs with mastery; players can contract a beast and order it to follow, wander, hold or come back with the Beast Taming Bell, or carry it in a Spirit Beast Bag. |
| Secret Realms | 🚧 | Each entry opens an instance dimension on demand from a secret realm definition, with its own border, generation, structures and landing spot, claimable terrain, member and time limits, and enter/exit conditions. |
| Spirit Crafting Table | ✅ | Crafting with a spirit crafting recipe at the Spirit Crafting Table costs aura in addition to materials, deducted when the result is taken out. |
| Forging | ✅ | At a Forge Table, several materials are hammered into a result following a blueprint; different tools unlock different methods, and the quality of the result depends on the process and the number of steps. |
| Alchemy | 🚧 | Hand-build a 3×3×3 furnace from a core, role bins and walls. When the player starts, it resolves the output from the actual properties and heats with an exotic fire. Pills keep use limits, cooldowns and toxicity. |
| Spirit Herbs | 🚧 | One spirit-herb plot grows one plant. Harvest returns an aged crop plus the original seed; age is stored on the item and read as potency. |
| Item Binding | 🚧 | Brings existing items into gameplay: attach passive behavior and vanilla attribute modifiers to any item, or bind abilities that fire on right-click use and on attack. |
| Talismans | 🚧 | A Talisman Brush inscribes ability definitions onto a carrier (one carrier can hold several); holding right-click until it is full fires them, spends a carrier or the wear a definition declares, and starts the item cooldown. A definition may also declare a price and a tier. |
| Quality | ✅ | Items carry a quality shown in their tooltip; each tier links to the next with `quality` / `next` to form a low-to-high ladder, the entry tier can be climbed, definitions declare a default and a stack component overrides it. |
| Artifacts | 🚧 | Items become artifacts via `artifact`: `items` claims them, `spirit_capacity` sets a per-aura ceiling, and `abilities` names what carrying it grants. An artifact declares itself a flying mount (speed, seats, fuel, looks) that a technique-granted flying skill takes from either hand; storage is another ability type. |
| Economy | ✅ | Items can be defined as currency with a value, supporting exchange and change; players can trade directly with each other, or use trade stations and cheques to settle transactions. |
| Curios Slots | ✅ | Players have Curios slots for a back weapon, a belt item and four artifacts, rendered on the character and swappable with the main hand by keybind. |
| Friend and Foe Identification | ✅ | Every player keeps a list of the players they treat as their own, for the session or saved with the world; other mods or scripts can answer the same question through a TriState event asked by player id. |
## Links

- **[Datapack Visual Editor](https://datapack.mcdev.tech/)**: edit this mod's datapacks in the browser as a form, with field descriptions and registry completion.
