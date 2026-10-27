---
title: /technique
---

# `/technique`

Repairs, drops and forgets learned techniques, and diagnoses the technique item in your hand. Every node also exists as `/mxt technique …`.

<div class="cmd-tree">

- `/technique ...`

  - `... repair [dry-run]`

    Removes the stale entries that point at technique definitions the current data pack no longer provides; `dry-run` reports what would be removed and changes nothing.

  - `... drop <id>`

    Removes one learned technique and rebuilds the attributes and abilities it granted.

  - `... forget <id>`

    Forgets one technique: its own stage record goes with it (re-learning starts at the entry stage) and the attributes and abilities it granted are rebuilt.

  - `... diagnose`

    Checks the technique item in your hand gate by gate and reports why it cannot be used.

</div>

`forget` leaves realm, cultivation progress, resources and the method currently running untouched.
