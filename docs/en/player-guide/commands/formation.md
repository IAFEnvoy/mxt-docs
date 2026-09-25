---
title: /formation
---

# `/formation`

| Command | Effect |
|---|---|
| `/mxt formation list` (= `/formation list`) | Lists every active formation in the current dimension: its ID, its controller position, its radius, its ownership list, the upkeep payments it has already paid, and its stored aura when it has any. |
| `/mxt formation info` (= `/formation info`) | Lists the formations covering your position; overlapping ones are all listed rather than one being picked. |
| `/mxt formation upkeep` (= `/formation upkeep`) | Lists, for every formation covering your position, **what the next upkeep period still asks of the payer** once the ground supply and the array's own stock are counted, as `amount resource-id`. It is the advance notice of the maintenance bill and goes through the **same plan** the charge itself uses (`FormationService.MaintainRule.remaining`), so the number shown is the number that will be taken; `owed=-` means the period is already covered. |
| `/mxt formation owners <pos>` (= `/formation owners`) | Prints the **ownership list** recorded on that controller (a set of UUIDs). |
| `/mxt formation owners <pos> add\|remove <player>` | Adds or removes one owner (needs the `gamemaster` permission). Ownership is a set of UUIDs: everyone on the list counts as an owner, so `mxt:formation_owner`, the dismantle permission and the per-entity actions' "owner" and "allies" targets all read that whole set; the friend system likewise asks **every** owner, and a friend of any one of them counts. Adding somebody already on the list, or removing somebody who is not, answers honestly and changes nothing. |
| `/mxt formation bind <formation>` (= `/formation bind <formation>`) | Writes the named formation into the formation plate in your **main hand** (needs the `gamemaster` permission). The plate is the only item that can carry a formation into the world and its binding lives in an item component, so this command is the way to obtain a usable plate in survival. Tab completion offers every formation in the registry (no longer only the ones this plate allows), but **the allow list still gates the write**: one outside it is refused without touching the plate; rebinding overwrites the previous value, and a mistyped ID never even parses, so the plate keeps whatever it had. |

## Formation Plates

The plate's dismantling entry point is not a command: using a plate on an already active controller dismantles that formation. You have to be the formation's owner or an operator; once the server option **Server Config → Formations → Teammates Can Dismantle** is on, the owner's friends — which includes teammates and allies when FTB Teams is installed — may dismantle it too.

Activation uses the plate as well: right-click the controller while holding a bound plate. **An unbound plate identifies the formation under your feet by itself** (it compares every structure its allow list admits and the one nearest the click wins; on by default, and switchable with **Server Config → Formations → Plate Auto-Detect**). **Clicking one block off is not a failure** — the nearest centre satisfying the structure within the 3×3×3 around the click is taken, so the centre block does not have to be hit exactly, and a clicked position that works itself always wins. Dismantling runs through the same lookup, so right-clicking the block next to an active formation takes it down just as well.
