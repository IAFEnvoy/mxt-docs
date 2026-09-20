---
title: /identity
---

# `/identity`

The management entry point for spirit roots and physiques. The definitions themselves are a data pack's job, while granting, removing and switching are state on an entity: this page is where those three things are operated, and it is the administrator-side entry point of the "switch off without losing" module (the module has no player interface).

| Command | Effect |
|---|---|
| `/identity root list [<target>]` (= `/mxt identity root list`) | Lists the roots held: name, rarity, bound element and whether each is in effect. Without a target it looks at you, and the query needs no permission. |
| `/identity root grant <targets> <root>` | Grants a root (gamemaster). When `conflicting_elements` blocks it, when it is already held or when the definition does not exist, the reason is reported per target. |
| `/identity root remove <targets> <root>` | Removes that root, together with its element and everything it granted. |
| `/identity root enable` / `disable <targets> <root>` | "Switch off without losing": a switched-off root is still held and simply provides nothing any more. |
| `/identity physique list [<target>]` | Lists the physiques held: name, rarity and whether each is in effect (with stacking, the same name is listed once). |
| `/identity physique grant` / `remove <targets> <physique>` | Grants (judging `holder_condition` and the exclusive tags against the current entity) or removes a physique. |
| `/identity physique enable` / `disable <targets> <physique>` | The same switch as a spirit root. |

Granting and removing go through the **same services** as the data pack actions `mxt:grant_spirit_root` / `mxt:remove_physique` and the rest, so the conflict rules, the holder conditions and the source cleanup are exactly the same, and the command bypasses none of those checks. Failures are reported per target, because the failures worth knowing about are per target — one target already holds it, another target's element is opposed to it — and the reason printed after the failure is exactly what makes the command worth running again.

The `root` / `physique` completions only list definitions that are still loaded; an entry that a body still holds while its definition has been deleted or disabled can be removed or switched off by typing the ID by hand — which is exactly the case this command exists to handle.

The top-level alias `/identity` is controlled by the **Command Aliases** tab of the server configuration (the entry is named `identity`, and it defaults to on); switching it off leaves `/mxt identity` fully usable.
