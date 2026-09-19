---
title: Information Panel
description: How a mod registers its own lines in the character information panel through InformationManager.
---

# Information Panel

The character information panel (opened with `Z` by default) is a client screen owned by the mod. The screen is internal, but `InformationManager` is an open registration point: any mod can contribute its own lines to the panel.

## Registering Lines

```java
InformationManager.register(
        Identifier.fromNamespaceAndPath("example", "realm"),
        InformationManager.Side.CULTIVATION,
        collector -> collector.add("info.example.realm", "Azure Realm"));
```

| Method | Description |
|--------|-------------|
| `register(String id, Side side, Consumer<InformationCollector> collector)` | Registers a collector in the mod's own namespace; the id becomes `mxt:<id>` |
| `register(Identifier id, Side side, Consumer<InformationCollector> collector)` | Registers a collector under your own namespace |
| `collectEntries(Player player, Side side)` | Collects the lines of one side; this is what the panel calls |

| `Side` value | Section |
|--------------|---------|
| `BASIC` | Basic information |
| `CULTIVATION` | Cultivation information |

- The registered collectors of a side run in registration order, and each side is shown as its own section.
- Registering the same id twice replaces the earlier collector.
- A collector that throws an exception is logged and skipped; the remaining lines are still collected, so one failing mod cannot break the panel.
- A collector runs whenever the panel is opened, so it should read state and stay cheap instead of mutating anything.

## Writing Lines

A collector receives an `InformationCollector`:

| Member | Description |
|--------|-------------|
| `Player getPlayer()` | The player whose panel is being built |
| `<T> T getData(Supplier<AttachmentType<T>> type)` | Reads one of the player's attachments, for example `MxtAttachments.CULTIVATION` |
| `add(String key, String value)` | Adds a line whose name is the translation key |
| `add(String key, Component value)` | The same, with a component value |
| `add(@Nullable Component name, Component value)` | Adds a line with an explicit name; a `null` name makes it a continuation line |
| `add(@Nullable Component name, Component value, int color, @Nullable Component tooltip)` | The same, with a text colour and an optional tooltip |
| `add(Component value)` | Adds a continuation line without a name |
| `add(InformationEntry entry)` / `addAll(List<InformationEntry>)` | Adds pre-built entries |
| `List<InformationEntry> getEntries()` | The lines collected so far |

An `InformationEntry` holds `name` (nullable), `value`, `color` (default `0xFFE0E4EC`) and an optional `tooltip`. An entry whose name and value are both empty is dropped, which lets a collector build a line conditionally and add it only when it is meaningful.

## Listing Definitions

`InformationHelper` renders a list of holders as their definition names for a registry category:

| Member | Description |
|--------|-------------|
| `lineWithDefinitions(InformationCollector collector, String key, Collection<? extends Holder<?>> values, String category)` | Adds one line that joins every value, preceded by the translated key |
| `joinDefinitions(Collection<? extends Holder<?>> values, String category)` | The joined text on its own, for use inside a larger line |

`category` is the registry the holders belong to, such as `"spirit_root"`, `"physique"` or `"technique"`.
