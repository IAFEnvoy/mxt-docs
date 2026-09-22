---
title: /ability
---

# `/ability`

| Command | Effect |
|---|---|
| `/ability` (= `/mxt ability`) | Does nothing on its own. It used to open the wheel editor, which is now the **client command** [`/wheel`](../commands.md). |
| `/ability cast <id>` (= `/mxt ability cast <id>`) | Forces an ability to be cast. |
| `/ability list [<target>]` (= `/mxt ability list …`) | Lists what a holder carries: the ability's name and the **sources still keeping it granted**. It reads the attachment rather than the registry, so an ability whose definition was disabled or deleted is still listed — it is still held, and revoking it by name is still what takes it off. Without a target it looks at you, and it needs no permission. |
| `/ability grant <targets> <ability>` (= `/mxt ability grant …`) | Grants the ability under the command's own source `mxt:command` (needs the `gamemaster` permission). Each target is reported separately, and a target already holding it from that source is a failure. |
| `/ability revoke <targets> <ability>` (= `/mxt ability revoke …`) | Drops only the `mxt:command` source (needs the `gamemaster` permission); nothing happens while another source still holds it, and that target is reported as a failure. |
