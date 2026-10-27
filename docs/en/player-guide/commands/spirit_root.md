---
title: /spirit_root
---

# `/spirit_root`

The management entry point for spirit roots. The definitions themselves are a data pack's job, while granting, removing and switching are state on an entity: this page is where those three things are operated, and it is the spirit-root half of the administrator-side entry point of the "switch off without losing" module (the module has no player interface).

<div class="cmd-tree">

- `/spirit_root ...`

  - `... list [<target>]`

    Lists the roots held: name, quality, bound element and whether each is in effect; without a target it looks at you, and the query needs no permission.

  - `... grant <targets> <root>`

    Grants a root (gamemaster).

  - `... remove <targets> <root>`

    Removes that root, together with its element and everything it granted.

  - `... enable <targets> <root>` / `... disable <targets> <root>`

    "Switch off without losing": a switched-off root is still held and simply provides nothing any more.

</div>

The quality column reads the `quality` the definition itself declares; it prints `-` when the definition declares none, or when the current pack does not provide that definition at all. The info panel draws a spirit-root row as "definition name · quality name" and leaves that second half out entirely when no quality is declared.

Granting and removing go through the **same services** as the data pack actions `mxt:grant_spirit_root` / `mxt:remove_spirit_root` and the rest, so the conflict rules, the holder conditions and the source cleanup are exactly the same, and the command bypasses none of those checks. Failures are reported per target, because the failures worth knowing about are per target — one target already holds it, another target's element is opposed to it — and the reason printed after the failure is exactly what makes the command worth running again.

## Definitions the pack no longer provides

The `<root>` completions only list definitions the registry currently holds. An entry a body still holds while the **current pack no longer provides it** (its file was deleted, or a `neoforge:conditions` block keeps it out of the registry) has to be named by hand: these arguments **do not check that the entry exists**, so a hand-typed ID is still accepted, and `remove` / `enable` / `disable` all look the reference up among the ones the body holds rather than in the registry, so that reference can still be rescued. What the attachment stores is the `Holder` itself, and it does not disappear on its own **between two world loads** — attachments are decoded while the world loads and not on `/reload`, and a reference whose definition cannot be found at that moment is dropped by the tolerant list codec, so the entry is gone once the world is entered again.

The top-level alias `/spirit_root` is controlled by the **Command Aliases** tab of the server configuration (the entry is named `spirit_root`, and it defaults to on); switching it off leaves `/mxt spirit_root` fully usable.
