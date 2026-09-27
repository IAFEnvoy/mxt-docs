---
title: WheelEntryKind
---

# WheelEntryKind

What kind of thing one wheel **sector** holds: the kind says which registry, list or code-side table an id has to resolve in, which is what lets one twelve-cell wheel mix abilities, auras and anything a content mod adds. A content mod implements it and registers it from its mod setup with `WheelEntryKinds#register`; the kind then takes part in saved layouts and in the pool the editor offers, and it decides what pressing one of its cells does. **The first registration of an id wins.** The four built-ins are `mxt:empty`, `mxt:ability`, `mxt:aura` and `mxt:behavior`.

| Member | Description |
| --- | --- |
| `Identifier id()` | What this kind is called in layouts and network requests. |
| `Component displayName()` | The kind's name in the editor. |
| `boolean holdsEntry()` | Whether a cell of this kind holds an entry at all. `mxt:empty` is the one that answers no, and it is how an empty cell is spelled, so a saved layout is always twelve cells. |
| `boolean exists(RegistryAccess access, Identifier id)` | Whether an id still names something a cell may keep. Each side passes its own registry access, and a definition that no longer resolves is what takes its cells off every wheel. |
| `boolean trigger(ServerPlayer player, WheelSource source, Identifier id)` | **What pressing a cell of this kind does**, server-side only. The page the request named has already been re-read; answering `false` is how a refusal is reported, and the message is the implementation's own. |
| `boolean directed(ServerPlayer player, WheelSource source, Identifier id, boolean wanted)` | The directed form of the same request: a screen or a script naming the state it wants instead of letting the server read the current one. Only a stateful entry has a state to ask for, so the default refuses. |

The server first requires that this source still holds the entry (the source's own `offers`), then hands the press to `kind.trigger`; a request carrying `enabled` goes through `directed` instead, which addresses the entry by id and has no cell. Pages are [WheelSource](./wheel-source.md), entries are [WheelMenuEntry](./wheel-menu-entry.md), and how the three built-in kinds are implemented is in [Wheel Entries](../../wheel.md).
