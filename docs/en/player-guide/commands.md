---
title: Commands
description: Every command MiXianTu adds, with its effect, its permission requirement and how registry IDs are completed.
---

# Commands

Every command MiXianTu adds hangs under the `/mxt` root: its own registries, resources, cultivation, world state and operator tooling. The player-facing subtrees are also registered as top-level aliases, so `/aura` and `/mxt aura` are the same tree, `/formation` and `/mxt formation`, and so on. Commands are diagnostic and administrative helpers for the framework; the gameplay itself is driven by datapacks.

Each alias is toggled on its own in the **Command Aliases** tab of the server configuration — the entry shows the command itself, and all of them default to on. Disabling `aura` removes only the top-level `/aura` spelling; the `/mxt` entries stay complete, so a configuration mistake can never make a command unreachable. There are eighteen aliases in all: `ability`, `aura`, `contract`, `curse`, `display`, `flight`, `formation`, `friend`, `lightning`, `physique`, `picker`, `quality`, `realm`, `spirit_root`, `talisman`, `technique`, `trade` and `tribulation`.

**Two commands live outside `/mxt`: `/hud` and `/wheel`**. They are registered with the client's own dispatcher, so they only work when typed into chat by hand, they need no permission, and nothing is sent to the server.

| Command | Effect |
| --- | --- |
| `/hud` | Lists every movable HUD element: layout key, position, size and whether it currently has anything to draw. When the HUD layout editor shows nothing, this is what tells "nothing is registered" apart from "it is registered but has no content right now". |
| `/hud open` | Opens the HUD layout editor, the same as the `key.mxt.hud_layout` keybind (right `Shift` by default). |
| `/hud <layout key> reset` | Puts one element back in its default position; the layout key is in the `/hud` output, such as `resource_bars.left`. The reset also **deletes the saved value for that element** from `config/mxt/mxt-hud.json`, so it is still in its default place after a restart (with nothing saved, the element follows the window again until you move it once more). |
| `/wheel` (= `/wheel configure`) | Opens the **wheel editor**, the same as the `key.mxt.wheel_configuration` keybind (**unbound by default** - set one in the controls screen if you want it). Six columns of spirit power on the left, six columns of abilities on the right, and the **main wheel**'s twelve cells in one shared row underneath; `Escape` saves and closes. Outside a world it only says the editor cannot be opened right now instead of showing an empty screen. The pages behind it are not edited here: they are read from what you carry. |

## Sub-pages

- [/mxt (and subcommands)](/en/player-guide/commands/mxt)
- [/ability](/en/player-guide/commands/ability)
- [/aura](/en/player-guide/commands/aura)
- [/contract](/en/player-guide/commands/contract)
- [/curse](/en/player-guide/commands/curse)
- [/display](/en/player-guide/commands/display)
- [/flight](/en/player-guide/commands/flight)
- [/formation](/en/player-guide/commands/formation)
- [/friend](/en/player-guide/commands/friend)
- [/hud](/en/player-guide/commands/hud)
- [/lightning](/en/player-guide/commands/lightning)
- [/physique](/en/player-guide/commands/physique)
- [/picker](/en/player-guide/commands/picker)
- [/quality](/en/player-guide/commands/quality)
- [/realm](/en/player-guide/commands/realm)
- [/spirit_root](/en/player-guide/commands/spirit_root)
- [/talisman](/en/player-guide/commands/talisman)
- [/technique](/en/player-guide/commands/technique)
- [/trade](/en/player-guide/commands/trade)
- [/tribulation](/en/player-guide/commands/tribulation)
- [/wheel](/en/player-guide/commands/wheel)

## Permissions

Commands that need administrator rights validate the `gamemaster` permission in the command tree: `/mxt resource <id> set`, `/mxt breakthrough`, `/realm set`, `/mxt secret_realm enter`, `/mxt secret_realm destroy`, `/mxt soul reclaim`, `/aura cache clear`, `/ability cast`, `/ability grant`, `/ability revoke`, `/curse apply`, `/curse remove`, `/curse cleanse`, `/formation bind`, `/technique repair`, `/technique drop`, `/quality get`, `/quality set`, `/quality clear`, `/quality upgrade`, `/flight fill`, and every node of `/lightning`, `/talisman` and `/tribulation`. `/picker` additionally requires the `gamemaster` permission, an executing player and creative mode.

The remaining commands have no permission requirement — the read-only nodes such as `/mxt curse list`, `/ability list` and `/mxt trigger list` are among them — but several of them need an executing player and either report that requirement or return no result when they are run from the console.

## Tab Completion

Registry IDs in commands use the vanilla `ResourceArgument`: parsing, tab completion and the "no such entry" error all come from it, and completions are taken from the registries the server currently has loaded, so they always name IDs the loaded datapacks actually define. One thing to know: **disabled definitions show up in completion too** (completion reads the raw registry), and are only refused when the command actually runs.

A few arguments deliberately do not work that way, because their whole job is naming a reference the **current data pack no longer provides**: `/technique drop`, `/spirit_root remove|enable|disable`, `/physique remove|enable|disable`, `/curse remove` and `/ability revoke`. Those complete from the entries that are still **enabled** in the registry. Note which entries they actually rescue: for spirit roots and physiques a **deleted** definition never gets that far — the attachment stores the definitions themselves and drops an entry whose definition is gone — so what these arguments save are the ones **disabled by `mxt:disabled`**, which are still held. `remove`, `enable` and `disable` all look the reference up among the ones the body holds rather than in the registry, which is why a disabled entry does not stop them.

Dimension IDs (`/mxt secret_realm info|destroy`, `/mxt rift target|place|bind`), trigger signals (`/mxt trigger rules|publish`) and the picker's registry ID (`/picker mxt:aura`) are not registry entries either, and complete from the level list, the signal table and the picker's own categories respectively.
