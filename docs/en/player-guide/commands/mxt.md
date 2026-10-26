---
title: /mxt
---

# `/mxt`

| Command | Effect |
|---|---|
| `/mxt registries list` | Lists the dynamic registries and their entry counts. |
| `/mxt registries validate` | Validates the datapack definitions and lists **every** problem the last build found at once, each with the file it comes from; with no problems it reports the registry and entry counts. |
| `/mxt attachment status` | Shows your own attachment counts and cultivation data: resources, abilities, cooldowns, curses, spirit roots and physiques. |
| `/mxt debug on`, `/mxt debug off` | Enables or disables module profiling. Off by default in normal mode; enabled at server startup in developer mode. Requires operator level 3. |
| `/mxt debug status [sources...]` | Queries module timings over the last 240 ticks. Requires operator level 3. |
| `/mxt debug gui` | Opens the timing list and charts for the executing player. Requires operator level 3. |
| `/mxt resource`, `/mxt resource <id>`, `/mxt resource <id> bar [index]`, `/mxt resource <id> set <value>` | Resource accounts: list every [resource bar](/en/player-guide/commands/resource) or read one value, inspect its bars, rewrite it. See [`/resource`](/en/player-guide/commands/resource). |
| `/mxt cultivate status`, `/mxt cultivate select <action>` | The cultivation state and a manual pick of one method. See [`/cultivate`](/en/player-guide/commands/cultivate). |
| `/mxt breakthrough <aura>` | Attempts a breakthrough into the realm that the given aura leads to. |
| `/mxt realm set <realm>`, `/mxt realm chain <realm>` | Sets your own linear realm; `chain` prints the whole realm chain that stage is on. See [`/realm`](/en/player-guide/commands/realm). |
| `/mxt lifespan get`, `/mxt lifespan set`, `/mxt lifespan add`, `/mxt lifespan reincarnate` | Reads and rewrites the lifespan ledger and makes a target be reborn on the spot (the write nodes and `reincarnate` need the `gamemaster` permission). See [`/lifespan`](/en/player-guide/commands/lifespan). |
| `/mxt contract list`, `/mxt contract info <target>` | Lists a player's spirit beasts and reads one creature's contract record. See [`/contract`](/en/player-guide/commands/contract). |
| `/mxt contract bind <player> <target> <contract_type>`, `/mxt contract break <target>`, `/mxt contract recall <target>`, `/mxt contract behavior <target> <behavior>` | Bind, release, recall and order (all need the `gamemaster` permission), sharing one flow with the scroll and the bell. See [`/contract`](/en/player-guide/commands/contract). |
| `/mxt secret_realm` | Secret realm definitions, instances, entry/exit, landing checks, entrance adjustment and destruction. See [`/secret_realm`](/en/player-guide/commands/secret_realm). |
| `/mxt soul reclaim` | Reclaims a reclaimable soul. |
| `/mxt trigger list [<entity>]` | Lists an entity's runtime trigger subscriptions: module, identity, signal and state. Subscriptions are never saved, so this is the only way to see what a running server has armed; without an entity it uses you. |
| `/mxt trigger rules <signal>` | Lists the datapack rules that react to one signal, in the order they run, with each rule's action type. |
| `/mxt trigger publish <signal> [<entity>]` | Publishes a signal by hand (needs the `gamemaster` permission), so a reaction can be checked without waiting for the real event; it says so when nothing subscribes to the signal and no rule reacts to it. |
| `/mxt rift …` | Operator level 2 portal creation, editing, destinations, transforms and export; see [Rifts](/en/player-guide/rift). |

## `/mxt debug`

The whole command tree and GUI data reception require operator level 3 (`admin`). These commands have no top-level alias.

For a walkthrough of recording and using the charts, see the [Development Mode tutorial](../../tutorial/dev-mode.md).

Profiling is off by default in normal mode; run `/mxt debug on` to start recording. In developer mode, recording starts automatically when the server starts. Developer launches and the server setting “Debug → Debug Mode” both activate developer mode. After `/mxt debug off`, recording stays off until you enable it again or restart the server, when developer mode determines the initial state again.

Run `/mxt debug gui` to open the list. Each row shows a localized module name and min / avg / max in milliseconds, with a bar chart of the last 240 ticks on the right. Sort by module name, minimum, average or maximum duration, in either direction. Charts stay 240 px wide, with the upper Y-axis value labeled at the top left of each chart. The panel is compact and centered; narrow windows place names and statistics above their charts.

Scroll with the mouse wheel, click the right-hand track or drag its thumb; the buttons above the list stay fixed, and rows have no hover tooltips. Parent durations include nested calls, so the rows must not be added together. The footer recommends the spark mod for more accurate analysis.

In singleplayer, local snapshots update on each server tick while the GUI is open. The screen reads the latest data directly each frame, without the 5-tick packet interval. In multiplayer, including a world opened to LAN, data arrives every 5 ticks only while the GUI is open. Closing it, disconnecting or losing permission stops the subscription. Opening the GUI does not enable recording.

`/mxt debug status` calculates min, avg, max, 50%, 95%, 99%, call count and valid tick count over the last 240 ticks on demand. Specify multiple Sources separated by spaces, with completion support, for example `/mxt debug status server/cost server/economy/change`; omit them to query all Sources. Incomplete ticks are excluded; complete idle ticks count as zero.

## `/mxt secret_realm`

The entire subtree requires operator level 2. `definitions` lists definitions; `list` and `info` inspect instances; `enter` selects by definition and `join` targets one instance; `check` verifies landings and `anchor` adjusts an instance entrance; `exit` returns and `destroy` ends an instance. See [`/secret_realm`](/en/player-guide/commands/secret_realm) for arguments and troubleshooting.

## `/mxt rift`

Rifts are planar polygon portals managed by UUID. The entire subtree requires operator level 2: `spawn`, `edit`, `info`, `target`, `enabled`, `duration`, `copy`, `transform`, `remove` and `export` share portal validation and travel rules.

The mechanic itself and every subcommand are on the [Rifts](/en/player-guide/rift) page.
