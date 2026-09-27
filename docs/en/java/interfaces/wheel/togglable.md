---
title: Togglable
---

# Togglable

A **skill that needs a key**: an ability type that implements this is saying "put me on the wheel". The rule is one sentence - everything a player has to press for counts as a skill and goes on the wheel - so it covers one-shots (one press and it is done) as well as switches (both turning on and turning off are presses). The interface has three methods; the state belongs to the implementation.

| Member | Description |
| --- | --- |
| `Optional<Boolean> state(ToggleContext context)` | Which side the switch is on. **Empty means a one-shot** with no state to report (storage). |
| `boolean gated(ToggleContext context)` | Whether the press goes through the shared "conditions + cooldown + costs" gate first. `true` by default; a cast type pays inside its own transaction and a switch being turned **off** pays nothing, so both answer `false`. |
| `Togglable.Result activate(ToggleContext context)` | The press happened, **server-side only**. Returns `Result(changed, failure, failedResource)`. |

`ToggleContext(holder, carrier, ability)` is what one press is asked about: who is pressing, which ability it is, and the stack it came from when that is how the ability is held (`carrier` is empty for a granted ability).

A `Result` is built with `activated()` or `refused(failure)` / `refused(failure, failedResource)`. The eighteen `Failure` values **share their names and meanings with `AbilityService.Failure`**, and the wheel looks each one up in a single table, `actionbar.mxt.ability.failure.*`, for the action-bar line and the log: conditions unmet, roots do not match its element, not enough of a resource, no charges left, still on cooldown, misconfigured numbers, no carrier, nothing in hand can fly, no target matches, the ability it names cannot act on a target, cannot mount, and so on; `failedResource` names the resource when one ran short. `UNAVAILABLE` is only the last resort.

A press has exactly one server-side entry point, `AbilityActivationService.activate(holder, ability, carrier)`: an ability whose type implements `Togglable` goes through it (when `gated` is true the shared `AbilityService.gate` runs first, and only then `activate`), while a type that does not implement it falls back to one `AbilityService.use` on press - the saved wheel cell may name an ability that has no key of its own. The wheel's candidate pool filters on this interface too.

Five ability types implement it today: `mxt:active` (a press casts it), `mxt:channelled` (a press starts a channel that then pays its upkeep every `tick_interval`), `mxt:targeted` (a press runs one payload ability on every entity a selector picks), `mxt:flight_control` (a switch: on takes off, off lands) and `mxt:storage` (a one-shot that opens the storage box). Adding a skill that needs a key means adding an `mxt:ability_type` that implements this; the wheel does not change. The fields themselves are in [ability](/en/datapack/json/ability), and the player-facing side is in [Wheel Entries](../../wheel.md).
