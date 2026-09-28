---
title: Tutorials
description: "Step-by-step walkthroughs that build a small MiXianTu content pack: aura and realms, the aura environment, items and bindings, abilities, formations, secret realms, talismans, tribulations, forging and alchemy."
---

# Tutorials

The reference pages on this site describe one file, one field or one API at a time. These tutorials go the other way: each one starts from an empty data pack and ends with something you can watch in game, so you can see how the tables fit together before you look up every field.

## The Example Pack

Every tutorial extends the same small content pack in the `example` namespace. The first few form one chain, each assuming the pages it depends on are done (the dual cultivation page hangs off the second one and only uses definitions the pack already has); the rest stand on their own and only use definitions the pack already has. By the end of the series it looks like this:

```text
data/example/
├── mxt/
│   ├── element/common.json                  Element named by the qi aura
│   ├── element/fire.json                    Element for the fire spirit root
│   ├── resource/qi.json                     The stored value
│   ├── aura/qi.json                         The aura the value carries, and its realm chain entry
│   ├── realm_stage/qi_condensation.json     Realm chain
│   ├── realm_stage/foundation.json
│   ├── realm_stage/core_formation.json
│   ├── cultivation/meditation.json     What the player does to absorb aura
│   ├── cultivation/dual_meditation.json  Only yields beside a friend holding a manual
│   ├── aura_zone/common_land.json           Where the aura is
│   ├── aura_zone/misty_valley.json          A denser zone (aura environment tutorial)
│   ├── block_aura/spirit_stone_ore.json     Blocks that emit aura
│   ├── item_aura/spirit_stone.json          Items that act as cultivation fuel
│   ├── spirit_root/fire_root.json           Granted by a pill
│   ├── spirit_root/fire_common_root.json    Two elements with shares (spirit root tutorial)
│   ├── physique/sword_bone.json             Attributes, exclusion tags, damage multipliers
│   ├── technique/azure_breath.json
│   ├── ability/qi_bolt.json                 An active ability
│   ├── ability/qi_recovery.json             A triggered ability
│   ├── ability/spark.json                   An ability a talisman inscribes
│   ├── ability/blade_storage.json           A storage ability: slots and cooldown
│   ├── artifact/blade_sheath.json           Claims an item and hangs the storage ability on it
│   ├── curse/qi_backlash.json               A timed curse: on_apply, per-tick, stacking
│   ├── talisman/flame_sigil.json            The talisman: abilities + capacity + costs
│   ├── formation/spirit_gathering_array.json Structure, upkeep, buff module
│   ├── formation/ward_array.json            Protection + attack modules
│   ├── secret_realm/trial_realm.json      A pocket world template
│   ├── tribulation/heavenly_gate.json       The trial a breakthrough starts
│   ├── forging_method/light_strike.json     One strike: meter shift, cost, cooldown
│   ├── forging_method/heavy_strike.json
│   ├── tool_binding/smith_hammer.json       Claims the hammer; lists its methods
│   ├── forging_blueprint/spirit_sword.json  Materials, target band, quality ladder
│   ├── blueprint_binding/sword_manual.json  Claims the manual; lists its blueprint
│   ├── quality/common.json             Quality tiers: chain identity, next tier, step cost
│   ├── quality/refined.json
│   ├── quality/flawless.json
│   ├── item_binding/qi_pill.json            Bindings attach rules to real items
│   ├── item_binding/root_pellet.json
│   ├── pill_binding/qi_pill.json
│   ├── weapon_binding/spirit_sword.json
│   ├── technique_binding/azure_manual.json
│   └── contract_type/spirit_familiar.json   Conditions, costs and caps for one beast
├── tags/entity_type/contract/spirit_familiar.json  Narrows which entities it accepts
└── (kubejs/startup_scripts/mxt_items.js)    The items themselves, registered by KubeJS
```

## The Tutorials

| Tutorial | You build | Read it when |
| --- | --- | --- |
| [Define Aura and Realms](./define-aura-and-realms.md) | An element, an aura resource, a linear realm chain, a cultivation action and a minimal aura zone — the core cultivation loop. | You need a player to be able to cultivate and break through. |
| [Write a Dual Cultivation Method](./dual-cultivation.md) | A cultivation method that only yields while somebody is beside you: how the test is assembled, how both bodies get in, and what happens when one walks away. | The basic loop works and you want "two bodies cultivating together" to be a rule. |
| [Define the Aura Environment](./aura-environment.md) | Layered aura zones, block aura, item fuel, noise, fluctuation, fog and HUD bars. | The basic loop works and you want the world to matter. |
| [Define Spirit Roots and Physiques](./define-spirit-roots-and-physiques.md) | A spirit root with element shares, a physique that only lands on a body holding one, and the difference between held and in effect. | You want the body itself to decide cultivation and damage multipliers. |
| [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) | Real items registered by a script, plus the four binding tables and recipes that give them gameplay. | You need pills, weapons or manuals of your own. |
| [Bind Actions with KubeJS](./bind-actions.md) | The hooks of the four binding tables: when they run, what they refuse, and how conditions and ordering work. | The items already work and you want to control exactly when they do what. |
| [Define a Quality Chain](./define-a-quality-chain.md) | A three-tier quality ladder: where the name goes, where the price goes, and how an item gets a tier. | You want one item to have tiers. |
| [Define an Ability](./add-an-ability.md) | An active ability, a triggered ability, and the ways to grant them. | You want something for the player to spend aura on. |
| [Define a Formation](./define-a-formation.md) | An array that activates on a structure and pays upkeep every period: buff, aura-zone, attack and protection modules, plus the plate. | You want the player to build something that keeps running. |
| [Define a Secret Realm](./open-a-realm.md) | A pocket-world template that opens separate instance dimensions: generation, border, landing points, claiming and lifetime. | You want a throwaway or claimable little world. |
| [Define a Talisman](./inscribe-a-talisman.md) | Carrying abilities on an item, pouring aura into it, firing it, and the two rule sets for the hand and a display stand. | You want magic the player can carry around. |
| [Define a Tribulation](./bring-down-a-tribulation.md) | A tribulation timeline a breakthrough starts: wind-up, beats, coloured lightning, and what success and failure do. | You want a breakthrough to be dangerous. |
| [Define a Curse](./define-a-curse.md) | A curse that fires on a timer or a signal, stacks, and can be cleansed. | You want a state that keeps coming back on the player. |
| [Forge a Treasure](./forge-a-treasure.md) | A forge-table line that runs end to end: methods, tool bindings, a blueprint item, plus the meter, target range, finish pattern, quality ladder and failure settlement. | You want the player to *hammer* an item out rather than craft it. |
| [Refine a Pill](./refine-a-pill.md) | Hand-build a 3×3×3 furnace, write a recipe that settles on the actual medicinal properties, and heat it into the target range with an exotic fire. | You want to make pills, herb plots and heat sources of your own. |
| [Contract a Beast](./contract-a-beast.md) | A contract type: who may sign, what it costs, the two caps, the orders, recall and the bag. | You want to take another mod's beasts as your own. |
| [Storage and Spirit Vessels](./storage-and-spirit-vessels.md) | A storage ability hung on an item, and the shape and limits of the spirit vessel beside it. | You want an item to hold things. |
| [Rifts](./rifts.md) | Rifts raised with a block and commands: target dimension, colour, links and landing. | You want a road of your own between dimensions. |

## Conventions

- **Namespace.** All examples use `example`. Rename it to your own modpack or content pack id, and keep the ids of the files and the references between them in sync.
- **File locations.** Data pack files go under `data/<namespace>/mxt/<registry>/<path>.json`; tags go under `data/<namespace>/tags/...`. Once there is a lot of content, sort the files into subdirectories by category (the directories are part of the ID) — the [Datapack Overview](../datapack/overview.md) spells it out. The full list is in [JSON Data Formats](../datapack/json/index.md).
- **Applying changes.** MiXianTu data tables are native data pack registries, which Minecraft reads **while the world loads**, so `/reload` does not re-read them. After editing a data pack file, leave to the title screen and open the world again (or restart the server). `/reload` only refreshes recipes, loot tables, advancements, functions and the KubeJS server scripts. Registering new items or blocks with KubeJS also needs a game restart.
- **Broken files block the world.** There is no previous snapshot to fall back on: if a definition fails to decode, the world will not load until the file is fixed. The log names the file and the codec error, so keep the last working copy of a file you are editing.
- **Verifying.** `/mxt registries validate` reports the registry count, the total entry count and whether validation passed, and `/mxt registries list` prints each registry id with its entry count. Both cover only some of the registries; each tutorial's Verify section says what applies to it. The other commands are listed in [Commands](../player-guide/commands.md).
- **Version.** These pages follow the mod's **current development version** (no version number is pinned in the documentation — the jar you installed is the authority). The mod is still in development and its data pack format is not frozen; when a field changes, the reference page changes with it.

## Where to Go Next

- [Datapack Overview](../datapack/overview.md) — file locations, IDs, holder references, load-time conditions and error reporting, if you have not read it yet.
- [Datapack Examples](../datapack/examples.md) — the same shapes as short, isolated snippets.
- [KubeJS API Reference](../kubejs/api-reference.md) — the script objects used in the two item tutorials.
