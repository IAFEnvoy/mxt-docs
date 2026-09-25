---
title: /physique
---

# `/physique`

The management entry point for physiques. The definitions themselves are a data pack's job, while granting, removing and switching are state on an entity: this page is where those three things are operated, and it is the physique half of the administrator-side entry point of the "switch off without losing" module (the module has no player interface).

| Command | Effect |
|---|---|
| `/physique list [<target>]` (= `/mxt physique list`) | Lists the physiques held: name, rarity and whether each is in effect (with stacking, the same name is listed once). Without a target it looks at you, and the query needs no permission. |
| `/physique grant <targets> <physique>` | Grants a physique (gamemaster). When its `holder_condition` is not met, when its exclusive tags clash with a physique already held or when the definition does not exist, the reason is reported per target. |
| `/physique remove <targets> <physique>` | Removes that physique, together with the attributes and everything else it granted. |
| `/physique enable` / `disable <targets> <physique>` | The same switch as a spirit root: switching one off leaves the attribute modifiers, the granted abilities and the two damage multipliers inactive, while the physique stays held. |

Granting and removing go through the **same services** as the data pack actions `mxt:grant_physique` / `mxt:remove_physique` and the rest, so the holder conditions, the exclusive tags and the source cleanup are exactly the same, and the command bypasses none of those checks. Failures are reported per target, with the reason printed after the failure.

The `<physique>` completions only list definitions that are still loaded. An entry a body still holds while its definition has been **disabled by `mxt:disabled`** can be removed or switched off by typing the ID by hand: `remove` / `enable` / `disable` all look the reference up among the ones the body holds rather than in the registry, so a disabled entry does not stop them. A **deleted** definition never gets that far — the attachment stores the definitions themselves, and such an entry is dropped when it is decoded.

A physique has no bound element, so the listing simply has no column for one.

The top-level alias `/physique` is controlled by the **Command Aliases** tab of the server configuration (the entry is named `physique`, and it defaults to on); switching it off leaves `/mxt physique` fully usable.
