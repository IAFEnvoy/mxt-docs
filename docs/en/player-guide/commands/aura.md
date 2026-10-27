---
title: /aura
---

# `/aura`

Queries the aura at your position, its element and the spirit stone vein, and clears the sub-chunk cache. Every node also exists as `/mxt aura …`.

<div class="cmd-tree">

- `/aura ...`

  - `... query [type]`

    Queries the aura at your current position. `type` is an aura ID from the `mxt:aura` registry; when it is omitted every aura at that position is listed, each followed by the element its `aura_type` names.

  - `... query element <element>`

    Queries by **element**: lists the total of every aura at your position whose element marker is that element. Suggestions come from the `mxt:element` registry.

  - `... vein`

    Queries the spirit stone vein grade at your current position.

  - `... cache clear [radius]`

    Clears and immediately rebuilds the subsection aura caches of the nearby loaded chunks; the radius is counted in chunks, defaults to 3 and accepts 0–32.

</div>

On its own `/aura` does nothing; every query sits under `query` or `vein`.
