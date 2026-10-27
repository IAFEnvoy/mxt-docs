---
title: /physique
---

# `/physique`

The management entry point for physiques. The definitions themselves are a data pack's job, while granting, removing and switching are state on an entity: this page is where those three things are operated, and it is the physique half of the administrator-side entry point of the "switch off without losing" module (the module has no player interface).

<div class="cmd-tree">

- `/physique ...`

  - `... list [<target>]`

    Lists the physiques held: name, quality and whether each is in effect (with stacking, the same name is listed once); without a target it looks at you, and the query needs no permission.

  - `... grant <targets> <physique>`

    Grants a physique (gamemaster).

  - `... remove <targets> <physique>`

    Removes that physique, together with the attributes and everything else it granted.

  - `... enable <targets> <physique>` / `... disable <targets> <physique>`

    The same switch as a spirit root: switching one off leaves the attribute modifiers, the granted abilities and the two damage multipliers inactive, while the physique stays held.

</div>

The quality column reads the `quality` the definition itself declares; it prints `-` when the definition declares none, or when the current pack does not provide that definition at all. The info panel draws a physique row as "definition name · quality name" and leaves that second half out entirely when no quality is declared.

Granting and removing go through the **same services** as the data pack actions `mxt:grant_physique` / `mxt:remove_physique` and the rest, so the holder conditions, the exclusive tags and the source cleanup are exactly the same, and the command bypasses none of those checks. Failures are reported per target, with the reason printed after the failure.

## Definitions the pack no longer provides

The `<physique>` completions only list definitions the registry currently holds. An entry a body still holds while the **current pack no longer provides it** (its file was deleted, or a `neoforge:conditions` block keeps it out of the registry) has to be named by hand: these arguments **do not check that the entry exists**, so a hand-typed ID is still accepted, and `remove` / `enable` / `disable` all look the reference up among the ones the body holds rather than in the registry, so that reference can still be rescued. What the attachment stores is the `Holder` itself, and it does not disappear on its own **between two world loads** — attachments are decoded while the world loads and not on `/reload`, and a reference whose definition cannot be found at that moment is dropped by the tolerant list codec, so the entry is gone once the world is entered again.

A physique has no bound element, so the listing simply has no column for one.

The top-level alias `/physique` is controlled by the **Command Aliases** tab of the server configuration (the entry is named `physique`, and it defaults to on); switching it off leaves `/mxt physique` fully usable.
