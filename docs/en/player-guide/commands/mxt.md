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
| `/mxt soul reclaim` | Reclaims a reclaimable soul. |
| `/mxt trigger list [<entity>]` | Lists an entity's runtime trigger subscriptions: module, identity, signal and state. Subscriptions are never saved, so this is the only way to see what a running server has armed; without an entity it uses you. |
| `/mxt trigger rules <signal>` | Lists the datapack rules that react to one signal, in the order they run, with each rule's action type. |
| `/mxt trigger publish <signal> [<entity>]` | Publishes a signal by hand (needs the `gamemaster` permission), so a reaction can be checked without waiting for the real event; it says so when nothing subscribes to the signal and no rule reacts to it. |
