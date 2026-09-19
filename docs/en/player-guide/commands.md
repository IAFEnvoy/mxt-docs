---
title: Commands
description: Every command MiXianTu adds, with its effect, its permission requirement and how registry IDs are completed.
---

# Commands

Every command MiXianTu adds hangs under the `/mxt` root: its own registries, resources, cultivation, world state and operator tooling. The player-facing subtrees are also registered as top-level aliases, so `/aura` and `/mxt aura` are the same tree, `/formation` and `/mxt formation`, and so on. Commands are diagnostic and administrative helpers for the framework; the gameplay itself is driven by datapacks.

Each alias is toggled on its own in the **Command Aliases** tab of the server configuration — the entry shows the command itself, and all of them default to on. Disabling `aura` removes only the top-level `/aura` spelling; the `/mxt` entries stay complete, so a configuration mistake can never make a command unreachable. The alias set is `ability`, `aura`, `curse`, `display`, `formation`, `friend`, `lightning`, `picker`, `talisman`, `technique`, `trade` and `tribulation`.

## Sub-pages

- [/mxt (and subcommands)](/en/player-guide/commands/mxt)
- [/ability](/en/player-guide/commands/ability)
- [/aura](/en/player-guide/commands/aura)
- [/curse](/en/player-guide/commands/curse)
- [/display](/en/player-guide/commands/display)
- [/formation](/en/player-guide/commands/formation)
- [/friend](/en/player-guide/commands/friend)
- [/lightning](/en/player-guide/commands/lightning)
- [/picker](/en/player-guide/commands/picker)
- [/talisman](/en/player-guide/commands/talisman)
- [/technique](/en/player-guide/commands/technique)
- [/trade](/en/player-guide/commands/trade)
- [/tribulation](/en/player-guide/commands/tribulation)

## Permissions

Commands that need administrator rights validate the `gamemaster` permission in the command tree: `/mxt resource <id> set`, `/mxt breakthrough`, `/mxt realm set`, `/mxt soul reclaim`, `/aura cache clear`, `/ability cast`, `/ability grant`, `/ability revoke`, `/curse apply`, `/curse remove`, `/curse cleanse`, `/formation bind`, `/technique repair`, `/technique drop`, and every node of `/lightning`, `/talisman` and `/tribulation`. `/picker` additionally requires the `gamemaster` permission, an executing player and creative mode.

The remaining commands have no permission requirement — the read-only nodes such as `/mxt curse list`, `/ability list` and `/mxt trigger list` are among them — but several of them need an executing player and either report that requirement or return no result when they are run from the console.

## Tab Completion

Registry IDs in commands use the vanilla `IdentifierArgument`, and tab completion is generated from the server's current registries, so it always suggests the IDs that the loaded datapacks actually define. Two subtrees complete from somewhere more specific: `/formation bind` offers the allow list of the plate in your main hand, and `/aura query` completes its `type` from the `mxt:element` registry.
