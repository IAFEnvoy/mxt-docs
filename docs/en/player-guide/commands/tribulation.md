---
title: /tribulation
---

# `/tribulation`

| Command | Effect |
|---|---|
| `/mxt tribulation start <id> [<target>]` (= `/tribulation start …`) | Starts a tribulation by hand, without waiting for a breakthrough; needs the `gamemaster` permission. Without a target it runs on the caller. `status` reports how far the run has got and what the current entry is keeping; `stop` clears it. |

## `/mxt tribulation`

Runs a tribulation by hand. It goes through the **same path a breakthrough uses** — the start gate, the per-entry validation before the run begins, and one entry consumed per tick afterwards are all unchanged; only the decision to start one is replaced. That is what makes the command both a trigger and an observer.

```
/mxt tribulation start mxt_test:probe_timeline
/mxt tribulation start mxt_test:probe_timeline @e[type=minecraft:armor_stand,limit=1]
/mxt tribulation status
/mxt tribulation stop
```

| Subcommand | Description |
|---|---|
| `start <id> [<target>]` | Starts a tribulation. `id` is `data/<namespace>/mxt/tribulation/<path>.json`, and tab completion lists everything the loaded datapacks register. A refusal says why: a run is already under way, the timeline is empty, the start gate does not hold, an entry cannot run right now, or an event cancelled it. |
| `status [<target>]` | Reports the run, how far it has got (`entry 2, 5 left`) and **what the current entry is keeping**. The state is printed in the spelling the save would use, so `{"remaining":37,"type":"mxt:idle_countdown"}` means this beat has 37 ticks left, and `not begun (empty)` means the entry has just come up and has not written anything yet. A definition with a wind-up reports `still winding up, %s ticks left` instead, because the timeline has not started consuming yet and an entry number would be a lie. |
| `stop [<target>]` | Clears the run, leaving exactly the state a finished one leaves. |

The target must be a **living entity**: a tribulation lives in an entity attachment and is advanced by that entity's tick. A summoned subject therefore works without a player logged in — give the selector a position with `execute positioned` and keep it single with `limit=1`:

```
/execute positioned 0 100 0 run mxt tribulation start mxt_test:probe_timeline @e[tag=probe,limit=1]
/execute positioned 0 100 0 run mxt tribulation status @e[tag=probe,limit=1]
```

| Argument | Default | Description |
|---|---|---|
| `id` | required | The tribulation definition id. |
| `target` | the executor | Which living entity the run belongs to. |
