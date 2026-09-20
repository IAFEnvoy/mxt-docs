---
title: /aura
---

# `/aura`

| Command | Effect |
|---|---|
| `/aura` (= `/mxt aura`) | Opens the spirit power hotbar configuration screen. |
| `/aura query [type]` (= `/mxt aura query [type]`) | Queries the aura at your current position; `type` is an aura ID from the `mxt:aura` registry, and when it is omitted every aura at that position is shown. Each line is followed by the element its `aura_type` names. |
| `/aura query element <element>` (= `/mxt aura query element …`) | Queries by **element**: lists the total of every aura at your position whose element marker is that element (a disabled element takes no part). Suggestions come from the `mxt:element` registry. |
| `/aura vein` (= `/mxt aura vein`) | Queries the spirit stone vein grade at your current position. |
| `/aura cache clear [radius]` (= `/mxt aura cache clear [radius]`) | Clears and immediately rebuilds the subsection aura caches of the nearby loaded chunks; the radius is counted in chunks, defaults to 3 and accepts 0–32. |
