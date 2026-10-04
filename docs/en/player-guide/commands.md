---
title: Commands
description: Every command MiXianTu adds, with its effect, its permission requirement and how registry IDs are completed.
---

# Commands

Every command MiXianTu adds hangs under the `/mxt` root: its own registries, resources, cultivation, world state and operator tooling. The player-facing subtrees are also registered as top-level aliases, so `/aura` and `/mxt aura` are the same tree, `/formation` and `/mxt formation`, and so on. Commands are diagnostic and administrative helpers for the framework; the gameplay itself is driven by datapacks.

Each alias can be switched off on its own, which removes only its top-level spelling; the `/mxt` entries stay complete, so a configuration mistake can never make a command unreachable. See [Server Configuration](./config.md#command-aliases). There are nineteen aliases in all: `ability`, `aura`, `contract`, `curse`, `display`, `flight`, `formation`, `friend`, `lifespan`, `lightning`, `physique`, `picker`, `quality`, `realm`, `spirit_root`, `talisman`, `technique`, `trade` and `tribulation`.

**Two commands live outside `/mxt`: `/hud` and `/wheel`**. They are registered with the client's own dispatcher, so they only work when typed into chat by hand, they need no permission, and nothing is sent to the server.

| Command | Effect |
| --- | --- |
| `/hud` | Lists every movable HUD element: layout key, the anchor it is bound to, position, size and whether it currently has anything to draw. When the HUD layout editor shows nothing, this is what tells "nothing is registered" apart from "it is registered but has no content right now". |
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
- [/lifespan](/en/player-guide/commands/lifespan)
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

Commands that need administrator rights validate the `gamemaster` permission in the command tree: `/mxt resource <id> set`, `/mxt breakthrough`, the whole `/mxt secret_realm` subtree (`list`, `info`, `enter`, `exit`, `destroy`), the whole `/mxt rift` subtree (`info`, `target`, `color`, `place`, `bind`), `/mxt soul reclaim`, `/mxt trigger publish`, `/realm set`, `/lifespan get <targets>` / `set` / `add` / `reincarnate`, `/aura cache clear`, `/ability cast` / `grant` / `revoke`, `/contract bind` / `break` / `recall` / `behavior`, `/curse apply` / `remove` / `cleanse`, `/flight` (the whole subtree, which holds only `fill` today), `/formation bind` and `/formation owners add|remove`, `grant` / `remove` / `enable` / `disable` on `/spirit_root` and `/physique`, `/quality get <target>` / `set` / `clear` / `upgrade`, `/technique repair` (with its `dry-run`) / `drop`, and every node of `/lightning`, `/talisman` and `/tribulation`. `/picker` additionally requires the `gamemaster` permission, an executing player and creative mode.

The remaining commands have no permission requirement — the read-only nodes such as `/mxt curse list`, `/ability list` and `/mxt trigger list` are among them — but several of them require an executing player right in the command tree (`/friend`'s whole subtree does), and those that default to the caller need one as well: run from the console they are refused outright, or simply return no result.

## Tab Completion

Registry IDs in commands use the vanilla `ResourceArgument`: parsing, tab completion and the "no such entry" error all come from it, and completions are taken from the registries the server currently has loaded, so they always name IDs the loaded datapacks actually define. **A completion is an entry you can use**: an entry a `neoforge:conditions` block keeps out never enters the registry (see [Disabling a Definition](../datapack/overview.md#disabling-a-definition)), so there is no "it was offered and then refused" state.

A few arguments deliberately do not work that way, because their whole job is naming a reference the **current data pack no longer provides**: `/technique drop`, `/spirit_root remove|enable|disable`, `/physique remove|enable|disable`, `/curse remove` and `/ability revoke`. Those complete from the entries the registry currently holds, and what they really rescue is a reference **a body still stores while the current pack no longer provides it**: whether the entry was blocked by `neoforge:conditions` or its file was deleted outright, that `Holder` is still in the attachment **for the rest of the session** (attachments are decoded while the world loads and not on `/reload`; a reference whose definition cannot be found at that moment is dropped by the tolerant list codec, so entering the world again clears it), so `remove`, `enable` and `disable` all look the reference up among the ones the body holds rather than in the registry.

Dimension IDs (`/mxt secret_realm info|destroy`, `/mxt rift target|place|bind`), trigger signals (`/mxt trigger rules|publish`) and the picker's category ID (`/picker mxt:aura`) are not registry entries either, and complete from the level list, the signal table and the picker's own categories respectively. A category may be a registry or a data map.

## Server Configuration

Configuration entries are not commands: the talisman, alchemy and command alias entries are on [Server Configuration](./config.md).
