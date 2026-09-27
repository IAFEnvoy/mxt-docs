---
title: /spirit_root
---

# `/spirit_root`

The management entry point for spirit roots. The definitions themselves are a data pack's job, while granting, removing and switching are state on an entity: this page is where those three things are operated, and it is the spirit-root half of the administrator-side entry point of the "switch off without losing" module (the module has no player interface).

| Command | Effect |
|---|---|
| `/spirit_root list [<target>]` (= `/mxt spirit_root list`) | Lists the roots held: name, rarity, bound element and whether each is in effect. Without a target it looks at you, and the query needs no permission. |
| `/spirit_root grant <targets> <root>` | Grants a root (gamemaster). When `conflicting_elements` blocks it, when it is already held or when the definition does not exist, the reason is reported per target. |
| `/spirit_root remove <targets> <root>` | Removes that root, together with its element and everything it granted. |
| `/spirit_root enable` / `disable <targets> <root>` | "Switch off without losing": a switched-off root is still held and simply provides nothing any more. |

Granting and removing go through the **same services** as the data pack actions `mxt:grant_spirit_root` / `mxt:remove_spirit_root` and the rest, so the conflict rules, the holder conditions and the source cleanup are exactly the same, and the command bypasses none of those checks. Failures are reported per target, because the failures worth knowing about are per target — one target already holds it, another target's element is opposed to it — and the reason printed after the failure is exactly what makes the command worth running again.

The `<root>` completions only list definitions the registry currently holds. An entry a body still holds while the **current pack no longer provides it** (its file was deleted, or a `neoforge:conditions` block keeps it out of the registry) has to be named by hand: `remove` / `enable` / `disable` all look the reference up among the ones the body holds rather than in the registry, so that reference can still be rescued. What the attachment stores is the `Holder` itself, and it does not disappear on its own **between two world loads** — attachments are decoded while the world loads and not on `/reload`, and a reference whose definition cannot be found at that moment is dropped by the tolerant list codec, so the entry is gone once the world is entered again.

The top-level alias `/spirit_root` is controlled by the **Command Aliases** tab of the server configuration (the entry is named `spirit_root`, and it defaults to on); switching it off leaves `/mxt spirit_root` fully usable.
