---
title: Tutorials
description: "Step-by-step walkthroughs that build a small MiXianTu content pack: aura and realms, the aura environment, KubeJS items and bindings, and abilities."
---

# Tutorials

The reference pages on this site describe one file, one field or one API at a time. These tutorials do the opposite: each one starts from an empty data pack and ends with something you can watch working in game, so you can see how the tables fit together before you look up every field.

## The Example Pack

Every tutorial extends the same small content pack in the `example` namespace. The first four form one chain, each assuming the pages before it are done; the rest stand on their own and only use definitions the pack already has. By the end of the series it looks like this:

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
│   ├── cultivate_action/meditation.json     What the player does to absorb aura
│   ├── aura_zone/common_land.json           Where the aura is
│   ├── aura_zone/misty_valley.json          A denser zone (aura environment tutorial)
│   ├── block_aura/spirit_stone_ore.json     Blocks that emit aura
│   ├── item_aura/spirit_stone.json          Items that act as cultivation fuel
│   ├── spirit_root/fire_root.json           Granted by a pill
│   ├── technique/azure_breath.json
│   ├── ability/qi_bolt.json                 An active ability
│   ├── ability/qi_recovery.json             A triggered ability
│   ├── ability/spark.json                   An ability a talisman inscribes
│   ├── talisman/flame_sigil.json            The talisman: abilities + aura bill
│   ├── formation/spirit_gathering_array.json Structure, upkeep, buff module
│   ├── formation/ward_array.json            Protection + attack modules
│   ├── realm_instance/trial_realm.json      A pocket world template
│   ├── tribulation/heavenly_gate.json       The trial a breakthrough starts
│   ├── forging_method/light_strike.json     One strike: meter shift, cost, cooldown
│   ├── forging_method/heavy_strike.json
│   ├── tool_binding/smith_hammer.json       Which methods a placed tool unlocks
│   ├── forging_blueprint/spirit_sword.json  Materials, target band, quality ladder
│   ├── blueprint_binding/sword_manual.json  Which blueprint the item offers
│   ├── item_quality/common.json             Quality tiers
│   ├── item_quality/refined.json
│   ├── item_quality/flawless.json
│   ├── item_binding/qi_pill.json            Bindings attach rules to real items
│   ├── item_binding/root_pellet.json
│   ├── pill_binding/qi_pill.json
│   ├── weapon_binding/spirit_sword.json
│   └── technique_binding/azure_manual.json
├── tags/mxt/item_quality/group/pill.json    Quality groups
├── tags/mxt/item_quality/group/weapon.json
└── (kubejs/startup_scripts/mxt_items.js)    The items themselves, registered by KubeJS
```

## The Tutorials

| Tutorial | You build | Read it when |
| --- | --- | --- |
| [Define Aura and Realms](./define-aura-and-realms.md) | An element, an aura resource, a linear realm chain, a cultivation action and a minimal aura zone — the core cultivation loop. | You want a player to be able to cultivate and break through. |
| [Build the Aura Environment](./aura-environment.md) | Layered aura zones, block aura, item fuel, noise, fluctuation, fog and HUD bars. | The basic loop works and you want the world to matter. |
| [Create Items with KubeJS and Bind Them](./create-items-with-kubejs.md) | Real items registered by a script, plus the four binding tables, quality tiers and recipes that give them gameplay. | You need pills, weapons or manuals of your own. |
| [Add an Ability](./add-an-ability.md) | An active ability, a triggered ability, and the ways to grant them. | You want something for the player to spend aura on. |
| [Define a Formation](./define-a-formation.md) | An array that activates on a structure and pays upkeep every period: buff, aura-zone, attack and protection modules, plus the plate. | You want the player to build something that keeps running. |
| [Open a Realm Instance](./open-a-realm.md) | A pocket-world template that opens separate instance dimensions: generation, border, landing points, claiming and lifetime. | You want a throwaway or claimable little world. |
| [Inscribe a Talisman](./inscribe-a-talisman.md) | Carrying abilities on an item, pouring aura into it, firing it, and the two rule sets for the hand and a display stand. | You want magic the player can carry around. |
| [Bring Down a Tribulation](./bring-down-a-tribulation.md) | A tribulation timeline a breakthrough starts: wind-up, beats, coloured lightning, and what success and failure do. | You want a breakthrough to be dangerous. |
| [Forge a Treasure](./forge-a-treasure.md) | A forge-table line that runs end to end: methods, tool bindings, a blueprint item, plus the meter, target range, finish pattern, quality ladder and failure settlement. | You want the player to *hammer* an item out rather than craft it. |
| [Refine a Pill](./refine-a-pill.md) | A placeholder: the alchemy data format is settled but the workbench is not wired up, so this page lists the parts that exist and the entry points that are missing. | You want pills, and want to know how far you can get today. |

## Conventions

- **Namespace.** All examples use `example`. Rename it to your own modpack or content pack id, and keep the ids of the files and the references between them in sync.
- **File locations.** Data pack files go under `data/<namespace>/mxt/<registry>/<path>.json`; tags go under `data/<namespace>/tags/...`. The full list is in [JSON Data Formats](../datapack/json/index.md).
- **Applying changes.** MiXianTu data tables are native data pack registries, which Minecraft reads **while the world loads**, so `/reload` does not re-read them. After editing a data pack file, leave to the title screen and open the world again (or restart the server). `/reload` only refreshes recipes, loot tables, advancements, functions and the KubeJS server scripts. Registering new items or blocks with KubeJS also needs a game restart.
- **Broken files block the world.** There is no previous snapshot to fall back on: if a definition fails to decode, the world will not load until the file is fixed. The log names the file and the codec error, so keep the last working copy of a file you are editing.
- **Verifying.** `/mxt registries validate` reports the registry count, the total entry count and whether validation passed, and `/mxt registries list` prints each registry id with its entry count. The other commands are listed in [Commands](../player-guide/commands.md).
- **Version.** These pages follow the mod's **current development version** (no version number is pinned in the documentation — the jar you installed is the authority). The mod is still in development and its data pack format is not frozen; when a field changes, the reference page changes with it.

## Where to Go Next

- [Datapack Overview](../datapack/overview.md) — file locations, IDs, holder references, the disabled tag and error reporting, if you have not read it yet.
- [Datapack Examples](../datapack/examples.md) — the same shapes as short, isolated snippets.
- [KubeJS API Reference](../kubejs/api-reference.md) — the script objects used in the third tutorial.
