---
title: Interfaces
description: "The interfaces a Java addon implements or calls: aura storage, creature contracts, wheel entries, definition names and costs."
---

# Interfaces

These interfaces are the seams between the framework and your content: a Java addon **implements** them (a creature, an item, a block entity, a wheel entry) or **calls** them (reading state, driving one action). Anything a datapack can express does not need them.

Four groups by purpose, one page per interface:

| Group | Interfaces | Where |
| --- | --- | --- |
| Aura storage | [AuraAccess](./aura/aura-access.md), [ItemAuraAccess](./aura/item-aura-access.md), [UseItemAuraAccess](./aura/use-item-aura-access.md) | `com.iafenvoy.mxt.api` |
| Creature contracts | [Contractable](./creature/contractable.md), [ContractOperations](./creature/contract-operations.md), [CaptureListener](./creature/capture-listener.md), [Perchable](./creature/perchable.md) | `com.iafenvoy.mxt.api` |
| Wheel and keys | [WheelMenuEntry](./wheel/wheel-menu-entry.md), [WheelSource](./wheel/wheel-source.md), [WheelEntryKind](./wheel/wheel-entry-kind.md), [Togglable](./wheel/togglable.md) | the first three in `api`, `Togglable` in `data/ability` |
| Definitions and costs | [NamedDefinition](./definition/named-definition.md), [Cost](./definition/cost.md), [TooltipAppender](./definition/tooltip-appender.md) | `api`, `data/cost`, NeoForge |

`com.iafenvoy.mxt.api` **holds nothing but interfaces and a package note**: implementations stay in their own modules, and gathering the contracts in one package is what keeps depending on the framework's extension points from meaning depending on its internals. Where a package sits says nothing about whether you may use it: `Cost` is in `data/cost` and `Togglable` in `data/ability`, and both are shapes a content mod implements.

Three rules that hold everywhere here:

- **The server is authoritative**: state changes, payment and settlement happen server-side. Only a wheel entry (`WheelMenuEntry`) is purely client-side.
- **A refusal is a value, not an exception**: `Result(changed, failure)` and `Togglable.Result` carry a `Failure` enum, and a client-side call always gets "nothing happened".
- **One side answers, nobody recomputes it**: every interface here is shaped as "the entity or the item answers for itself", and the framework has exactly one lookup point for each (`Contracts`, `PerchService`, the ability pipeline).

The runtime services (`AuraService`, `AbilityService`, `DamageCalculationService`, …) are not here - see [Public API](../api.md).
