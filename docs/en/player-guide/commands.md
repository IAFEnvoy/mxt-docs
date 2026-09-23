---
title: Commands
description: Every command MiXianTu adds, with its effect, its permission requirement and how registry IDs are completed.
---

# Commands

Every command MiXianTu adds hangs under the `/mxt` root: its own registries, resources, cultivation, world state and operator tooling. The player-facing subtrees are also registered as top-level aliases, so `/aura` and `/mxt aura` are the same tree, `/formation` and `/mxt formation`, and so on. Commands are diagnostic and administrative helpers for the framework; the gameplay itself is driven by datapacks.

Each alias is toggled on its own in the **Command Aliases** tab of the server configuration — the entry shows the command itself, and all of them default to on. Disabling `aura` removes only the top-level `/aura` spelling; the `/mxt` entries stay complete, so a configuration mistake can never make a command unreachable. There are thirteen aliases in all: `ability`, `aura`, `curse`, `display`, `formation`, `friend`, `identity`, `lightning`, `picker`, `talisman`, `technique`, `trade` and `tribulation`.

**Two commands live outside `/mxt`: `/hud` and `/wheel`**. They are registered with the client's own dispatcher, so they only work when typed into chat by hand, they need no permission, and nothing is sent to the server.

| Command | Effect |
| --- | --- |
| `/hud` | Lists every movable HUD element: layout key, position, size and whether it currently has anything to draw. When the HUD layout editor shows nothing, this is what tells "nothing is registered" apart from "it is registered but has no content right now". |
| `/hud open` | Opens the HUD layout editor, the same as the `key.mxt.hud_layout` keybind (right `Shift` by default). |
| `/hud <layout key> reset` | Puts one element back in its default position; the layout key is in the `/hud` output, such as `resource_bars.left`. The reset also **deletes the saved value for that element** from `config/mxt/mxt-hud.json`, so it is still in its default place after a restart (with nothing saved, the element follows the window again until you move it once more). |
| `/wheel` | Opens the **wheel editor**, the same as the `key.mxt.wheel_configuration` keybind (**unbound by default** - set one in the controls screen if you want it). Six columns of spirit power on the left, six columns of abilities on the right, and the **main wheel**'s twelve cells in one shared row underneath; `Escape` saves and closes. The pages behind it are not edited here: they are read from what you carry. |

## Sub-pages

- [/mxt (and subcommands)](/en/player-guide/commands/mxt)
- [/ability](/en/player-guide/commands/ability)
- [/aura](/en/player-guide/commands/aura)
- [/curse](/en/player-guide/commands/curse)
- [/display](/en/player-guide/commands/display)
- [/formation](/en/player-guide/commands/formation)
- [/friend](/en/player-guide/commands/friend)
- [/identity](/en/player-guide/commands/identity)
- [/lightning](/en/player-guide/commands/lightning)
- [/picker](/en/player-guide/commands/picker)
- [/talisman](/en/player-guide/commands/talisman)
- [/technique](/en/player-guide/commands/technique)
- [/trade](/en/player-guide/commands/trade)
- [/tribulation](/en/player-guide/commands/tribulation)

## Permissions

Commands that need administrator rights validate the `gamemaster` permission in the command tree: `/mxt resource <id> set`, `/mxt breakthrough`, `/mxt realm set`, `/mxt secret_realm enter`, `/mxt secret_realm destroy`, `/mxt soul reclaim`, `/aura cache clear`, `/ability cast`, `/ability grant`, `/ability revoke`, `/curse apply`, `/curse remove`, `/curse cleanse`, `/formation bind`, `/technique repair`, `/technique drop`, and every node of `/lightning`, `/talisman` and `/tribulation`. `/picker` additionally requires the `gamemaster` permission, an executing player and creative mode.

The remaining commands have no permission requirement — the read-only nodes such as `/mxt curse list`, `/ability list` and `/mxt trigger list` are among them — but several of them need an executing player and either report that requirement or return no result when they are run from the console.

## Tab Completion

Registry IDs in commands use the vanilla `IdentifierArgument`, and tab completion is generated from the server's current registries, so it always suggests the IDs that the loaded datapacks actually define. A few subtrees complete from somewhere more specific: `/formation bind` offers the allow list of the plate in your main hand, `/aura query` completes its `type` from the `mxt:aura` registry, and `/aura query element` completes its element argument from the `mxt:element` registry.
