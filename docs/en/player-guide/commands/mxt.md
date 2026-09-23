---
title: /mxt
---

# `/mxt`

| Command | Effect |
|---|---|
| `/mxt registries list` | Lists the dynamic registries and their entry counts. |
| `/mxt registries validate` | Validates the datapack definitions and lists **every** problem the last build found at once, each with the file it comes from; with no problems it reports the registry and entry counts. |
| `/mxt attachment status` | Shows your own attachment counts and cultivation data: resources, abilities, cooldowns, curses, spirit roots and physiques. |
| `/mxt resource <id>` | Queries a resource value. |
| `/mxt resource <id> set <value>` | Sets a resource value. |
| `/mxt resourcebar [resource] [index]` | Shows a resource bar's raw current value, minimum, maximum, untruncated percentage, context, anchor and order; without arguments it lists every resource bar. |
| `/mxt cultivate status` | Shows the cultivation state: the active cultivation behaviour, the progress stored per aura and the next cultivation tick. |
| `/mxt breakthrough <aura>` | Attempts a breakthrough into the realm that the given aura leads to. |
| `/mxt realm set <realm>` | Sets a linear realm. |
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

## `/mxt secret_realm`

A secret realm definition (`mxt:secret_realm`) is a template rather than one fixed dimension: every entry can open a **new instance dimension**, keyed `<definition namespace>:secret_realm/<definition path>/<index>` counting from `0` (a definition that can only open one instance still carries the index). This subtree is the operator's window onto it, and **the whole subtree needs the `gamemaster` permission** — `list`, `info` and `exit` included, since they exist to inspect state.

| Subcommand | Behaviour |
| --- | --- |
| `list` | Lists every instance. `loaded=false` means the instance is dormant — usually because it was claimed and everybody left, so its terrain stays in the save until its owner returns. |
| `info <dimension>` | Looks at one instance; the argument is the dimension key, for example `mxt:secret_realm/trial_realm/0`. |
| `enter <definition>` | Enters yourself. The full path runs: the disabled check, the entry condition, joining an instance that is not full or opening a new one (bounded by `max_instances`), generating the dimension and its structures, and landing at the entry point. |
| `exit` | Returns you to the position you entered from. The definition's `exit_condition` applies to this command too, exactly as it does to leaving with a token. |
| `destroy <dimension>` | Ends one instance and **deletes its terrain**. Players locked inside are sent home; an `mxt:existing` secret realm only clears its members and leaves that real dimension alone. |

## `/mxt rift`

A rift (`mxt:rift`) is not a datapack definition but a block laid down at runtime: every rift draws a point at its block centre, it links to every rift next to it within its 3×3×3 neighbourhood (whichever way either of them faces), and two links that are neighbours of each other close a triangle that is filled. This subtree is the operator's window onto it, and **the whole subtree needs the `gamemaster` permission**: `info`, `target`, `color`, `place` and `bind` inspect and rewrite where one rift leads and what colour it is, place one directly, or write the held Rift Anchor to a destination. Normal play uses the Rift Anchor (the `mxt:rift` item) to place and re-aim rifts instead.

The mechanic itself and every subcommand are on the [Rifts](/en/player-guide/rift) page.
