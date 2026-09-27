---
title: Perchable
---

# Perchable

The contract that lets a creature **be perched on another body** (the shoulder-beast kind). **Implementing it is the whole of it** - the seat point, the record, the capacity and every admission check stay in the framework (`PerchService`), so an addon ships the creature and its answer rather than a seat of its own.

| Member | Description |
| --- | --- |
| `Optional<Vec3> perchOffset(Entity vehicle, List<Vec3> claimed)` | Where this creature wants to sit on that vehicle; empty **refuses that vehicle** (the framework then writes nothing and reports a refusal). |
| `void onPerched(Entity vehicle)` | The moment after the record is written; does nothing by default. |
| `void onPerchReleased(Entity vehicle)` | The moment after the record is cleared and the ride has ended; does nothing by default. |

The offset is in the **vehicle's own frame**: `x` is the vehicle's left, `z` is the way it faces, and `y` counts **down from the vehicle's current top** - so a sneaking or smaller-pose vehicle carries the perched passenger along without either side knowing a pose. The offset is scaled by whatever `scale` the platform hands the seat hook, the way vanilla seats (`AbstractHorse`, `Camel`) are.

`claimed` holds the offsets the vehicle's **other** perched passengers have already declared, so a creature with more than one seat to offer can pick a free one; refusing because every seat is taken is a legitimate answer. The framework computes it and hands it in, so no public query is needed for it.

The two hooks are **moments, not state**: `onPerched` is called only when the creature goes from unperched to perched (a move to another seat of the same vehicle is **not** a second boarding), and `onPerchReleased` runs once the record is cleared and the ride has ended, however it ended - the creature stepped off, the server's policy dropped it, or the record was noticed as stale. A record whose vehicle is already gone has no vehicle left to hand over, so that hook does not fire; when state has to be exact, ask `PerchService.perchOffset(creature)`, since the record is the only truth.

**The framework ships no entity for this**: a creature is an addon's business, and the framework provides only the act of perching and the two questions it asks. The entry point is `PerchService` - an addon calls `PerchService.perch(creature, vehicle)` at whatever moment it likes (a right-click, a taming, a finished quest) and the framework asks the creature's `perchOffset`; `PerchService.release(creature)` is the one way down, and `PerchService.perchOffset(creature)` is the read-only query.

Datapacks and scripts cannot reach it yet: there is no action, no command and no script method for perching, which is a gameplay-entry decision separate from this contract.
