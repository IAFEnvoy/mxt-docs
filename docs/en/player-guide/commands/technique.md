---
title: /technique
---

# `/technique`

| Command | Effect |
|---|---|
| `/technique repair [dry-run]` (= `/mxt technique repair [dry-run]`) | Removes the stale entries that point at technique definitions the current data pack no longer provides; `dry-run` reports what would be removed and changes nothing. |
| `/technique drop <id>` (= `/mxt technique drop <id>`) | Removes one learned technique and rebuilds the attributes and abilities it granted. |
| `/technique forget <id>` (= `/mxt technique forget <id>`) | Forgets one technique: its own stage record goes with it (re-learning starts at the entry stage) and the attributes and abilities it granted are rebuilt. Realm, cultivation progress, resources and the method currently running are untouched. |
| `/technique diagnose` (= `/mxt technique diagnose`) | Checks the technique item in your hand gate by gate and reports why it cannot be used. |
