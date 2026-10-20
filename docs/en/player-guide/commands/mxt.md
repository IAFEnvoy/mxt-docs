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
| `/mxt secret_realm list` | Lists every secret realm: dimension key, index, definition, members and their cap, owner, whether the terrain is prepared and whether the dimension is loaded right now. |
| `/mxt secret_realm info <dimension>` | Shows the same line for one instance. |
| `/mxt secret_realm enter <definition>` | Opens or joins a secret realm with you as the entrant (needs the `gamemaster` permission). This is the operator's way in without a token, and it runs the very same path as the token: conditions, member count, instance cap and generation. |
| `/mxt secret_realm exit` | Sends you back to the position you entered from (the definition's `exit_condition` applies to this command too). |
| `/mxt secret_realm destroy <dimension>` | Force-ends one instance: everybody inside is returned, then the dimension is unloaded and its terrain data is cleared. **A claimed secret realm is deleted too** (needs the `gamemaster` permission). |
| `/mxt soul reclaim` | Reclaims a reclaimable soul. |
| `/mxt trigger list [<entity>]` | Lists an entity's runtime trigger subscriptions: module, identity, signal and state. Subscriptions are never saved, so this is the only way to see what a running server has armed; without an entity it uses you. |
| `/mxt trigger rules <signal>` | Lists the datapack rules that react to one signal, in the order they run, with each rule's action type. |
| `/mxt trigger publish <signal> [<entity>]` | Publishes a signal by hand (needs the `gamemaster` permission), so a reaction can be checked without waiting for the real event; it says so when nothing subscribes to the signal and no rule reacts to it. |
| `/mxt rift …` | The operator's entry point to rifts (needs the `gamemaster` permission): inspect or rewrite one rift's destination and colour, see how many links and triangles it has, or place one directly. For the full behaviour and usage see [Rifts](/en/player-guide/rift). |

## `/mxt debug`

The whole command tree and GUI data reception require operator level 3 (`admin`). These commands have no top-level alias.

For a walkthrough of recording and using the charts, see the [Development Mode tutorial](../../tutorial/dev-mode.md).

Profiling is off by default in normal mode; run `/mxt debug on` to start recording. In developer mode, recording starts automatically when the server starts. Developer launches and the server setting “Debug → Debug Mode” both activate developer mode. After `/mxt debug off`, recording stays off until you enable it again or restart the server, when developer mode determines the initial state again.

Run `/mxt debug gui` to open the list. Each row shows a localized module name and min / avg / max in milliseconds, with a bar chart of the last 240 ticks on the right. Sort by module name, minimum, average or maximum duration, in either direction. Charts stay 240 px wide, with the upper Y-axis value labeled at the top left of each chart. The panel is compact and centered; narrow windows place names and statistics above their charts.

Scroll with the mouse wheel, click the right-hand track or drag its thumb; the buttons above the list stay fixed, and rows have no hover tooltips. Parent durations include nested calls, so the rows must not be added together. The footer recommends the spark mod for more accurate analysis.

In singleplayer, local snapshots update on each server tick while the GUI is open. The screen reads the latest data directly each frame, without the 5-tick packet interval. In multiplayer, including a world opened to LAN, data arrives every 5 ticks only while the GUI is open. Closing it, disconnecting or losing permission stops the subscription. Opening the GUI does not enable recording.

`/mxt debug status` calculates min, avg, max, 50%, 95%, 99%, call count and valid tick count over the last 240 ticks on demand. Specify multiple Sources separated by spaces, with completion support, for example `/mxt debug status server/cost server/economy/change`; omit them to query all Sources. Incomplete ticks are excluded; complete idle ticks count as zero.

## `/mxt secret_realm`

A secret realm definition (`mxt:secret_realm`) is a template rather than one fixed dimension: every entry can open a **new instance dimension**, keyed `<definition namespace>:secret_realm/<definition path>/<index>` counting from `0` (a definition that can only open one instance still carries the index). This subtree is the operator's window onto it, and **the whole subtree needs the `gamemaster` permission** — `list`, `info` and `exit` included, since they exist to inspect state.

| Subcommand | Behaviour |
| --- | --- |
| `list` | Lists every instance. `loaded=false` means the instance is dormant — usually because it was claimed and everybody left, so its terrain stays in the save until its owner returns. |
| `info <dimension>` | Looks at one instance; the argument is the dimension key, for example `mxt:secret_realm/trial_realm/0`. |
| `enter <definition>` | Enters yourself. The full path runs: the existence check, the entry condition, joining an instance that is not full or opening a new one (bounded by `max_instances`), generating the dimension and its structures, and landing at the entry point. |
| `exit` | Returns you to the position you entered from. The definition's `exit_condition` applies to this command too, exactly as it does to leaving with a token. |
| `destroy <dimension>` | Ends one instance and **deletes its terrain**. Players locked inside are sent home; an `mxt:existing` secret realm only clears its members and leaves that real dimension alone. |

## `/mxt rift`

A rift (`mxt:rift`) is not a datapack definition but a block laid down at runtime: every rift draws a point at its block centre, it links to every rift next to it within its 3×3×3 neighbourhood (whichever way either of them faces), and two links that are neighbours of each other close a triangle that is filled. This subtree is the operator's window onto it, and **the whole subtree needs the `gamemaster` permission**: `info`, `target`, `color`, `place` and `bind` inspect and rewrite where one rift leads and what colour it is (`info` also reports whether it is **isolated**, that is, whether there is a second rift anywhere in the surrounding 3×3×3), place one directly, or write the held Rift Anchor to a destination. Normal play uses the Rift Anchor (the `mxt:rift` item) to place and re-aim rifts instead.

The mechanic itself and every subcommand are on the [Rifts](/en/player-guide/rift) page.
