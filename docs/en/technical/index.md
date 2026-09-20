---
title: Technical Details
description: Source-level explanations of how a subsystem is built — the classes behind the damage system and foe identification, the path one call takes through them, why it is written that way, and what it costs.
---

# Technical Details

This category holds **source-level explanations**: which classes make up a subsystem, how one call travels through them, why it is written the way it is, and where its boundaries and costs are.

It answers a different question from the other two categories:

| What you want to know | Where to look |
| --- | --- |
| What a JSON field means and how to write it | [Datapack](../datapack/overview.md) |
| Which class or service you can call | [Java API](../java/index.md) |
| **Why** it is built this way inside | Here |

## Articles

| Article | Contents |
| --- | --- |
| [Damage System](./damage.md) | The full path from a strike being dealt to a target losing health: why outgoing and incoming damage have to be settled in two different places, how element relations take part, which damage-dealing paths were folded into the pipeline, and the real order of operations behind a combat number. |
| [Foe Identification](./identification.md) | How "does this entity count as mine" is answered: where the lists live, how the relation event overrides them, who answers for an offline player, how team mods plug in, and which callers ask the question today. |
| [Aura Calculation](./aura.md) | How the aura value at a position is computed: how the static template is picked, how chunk stock and block emitters are merged, where the 140 µs of one query goes, how large the sub-chunk approximation error is (with two study charts), and why the client only ever sees a snapshot. |

## Source Map

| Subsystem | Entry point | Main source |
| --- | --- | --- |
| Damage system | `DamageCalculationService` | `src/main/java/com/iafenvoy/mxt/runtime/damage/` |
| Foe identification | `FriendService` | `src/main/java/com/iafenvoy/mxt/runtime/friend/` |
| Aura calculation | `AuraService` | `src/main/java/com/iafenvoy/mxt/runtime/world/` |

## Conventions

- Class and method names are written as Java writes them, with the shared package prefix `com.iafenvoy.mxt` shortened and spelled out only on first use (so `runtime.damage.DamageCalculationService#deal` means the `deal` method of `com.iafenvoy.mxt.runtime.damage.DamageCalculationService`).
- Source paths are relative to the repository root.
- These pages describe the **current implementation**. It changes more freely than datapack fields or the public API: field names and interfaces are kept when compatibility is at stake, internal structure is not. So read these pages to understand the code and why a piece of logic is written the way it is — not as a compatibility promise across versions. That is what [Datapack](../datapack/overview.md) and [Java API](../java/index.md) are for.
- Each article tries to say "why not the other way" — that is the part that takes the longest to reconstruct from source and is the easiest to forget by the next change.
