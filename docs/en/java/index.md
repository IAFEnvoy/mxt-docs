---
title: Java API
description: "How a Java addon extends MiXianTu: the public runtime services and the extension surfaces they build on."
---

# Java API

Java extensions should reuse the existing data definitions, actions, conditions, costs and runtime services first. When adding gameplay, decide on the server-side settlement entry point first, and only then add the client display and the network payload.

- [Public API](./api.md)
- [Interfaces](./interfaces.md)
- [Registries and Data Tables](./registries.md)
- [Network Protocol and Server Authority](./network.md)
- [Wheel Entries](./wheel.md)
- [Client Screens](./screens.md)

## Extension Surfaces

| Surface | What an addon can do |
|---------|----------------------|
| **Datapack registries** | Add or override data table entries under `data/<namespace>/mxt/`; see [JSON Data Formats](../datapack/json/index.md). |
| **Attachments** | Store per-entity, per-level and per-chunk state in NeoForge attachment types; the mod registers its own in `MxtAttachments`, for example `CULTIVATION`, `SPIRIT_IDENTITY` and `RESOURCE_HOLDER`, and they are read with `entity.getData(...)`. |
| **Actions and conditions** | Reuse the built-in entity, bi-entity, block, item and damage action and condition types, or register new built-in types; see [Types Reference](../datapack/types/index.md). |
| **Number providers** | Supply any numeric field from a constant, an expression or a registered provider type; see [Number Provider Types](../datapack/types/number_provider_types.md). |
| **Formation modules** | Add a formation module by writing one `FormationActionType` record and registering it; see [Public API](./api.md). |
| **Information panel** | Add your own lines to the character information panel with `InformationManager`; see [Information Panel](./information-panel.md). |
| **Wheel entries** | Add a client-side wheel entry by implementing `WheelMenuEntry`; see [Wheel Entries](./wheel.md). |

## Next Steps

- [Public API](./api.md) — the runtime services an addon calls into, from `AuraService` to `DefinitionText`.
- [Interfaces](./interfaces.md) — `AuraAccess`, `ItemAuraAccess`, `UseItemAuraAccess`, `TooltipAppender`, `Cost` and `WheelMenuEntry`.
- [Registries and Data Tables](./registries.md) — built-in type registries, the datapack registry list and the codec naming convention.
- [Network Protocol and Server Authority](./network.md) — every C2S and S2C payload, and the one channel that carries item contents.
- [Information Panel](./information-panel.md) — register your own lines in the character information panel.
- [Wheel Entries](./wheel.md) — how to add an entry to the client wheel.
- [Client Screens](./screens.md) — where the screens live, and how the item picker clones the vanilla creative search tab.
- [Types Reference](../datapack/types/index.md) — every built-in action and condition type.
- [JSON Data Formats](../datapack/json/index.md) — every field of every data table.
- [Datapack Overview](../datapack/overview.md) — the datapack directory layout and when changes take effect.
- [KubeJS API](../kubejs/index.md) — the scripted alternative for content that does not need Java.
