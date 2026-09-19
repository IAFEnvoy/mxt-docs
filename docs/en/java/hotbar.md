---
title: Hotbar Entries
description: How the client hotbar is managed centrally and how to add your own HotbarEntry implementation.
---

# Hotbar Entries

The hotbar is managed centrally by `HotbarController`, and both the ability entries and the aura entries implement `HotbarEntry`. To add a new entry type, create a `HotbarEntry` implementation class directly and avoid stacking static factories and anonymous behaviour.

```java
public final class ExampleEntry implements HotbarEntry {
    @Override public Component name() { return Component.literal("Example"); }
    @Override public void onPress(Player player) { }
    @Override public void onPressTick(Player player) { }
    @Override public void onRelease(Player player) { }
}
```

## Members

| Member | Description |
|--------|-------------|
| `Component name()` | The entry's display name; required. |
| `Identifier id()` | A stable option ID used by configurable hotbar layouts; may be `null`. |
| `Optional<IconReference> icon()` | An optional icon, either an item or a texture. When it is empty the name is drawn instead. |
| `int accentColor()` | The accent colour drawn along the top of the slot. |
| `float cooldown(Player player)` | The remaining cooldown fraction, matching vanilla item cooldown rendering: `0` means ready and `1` means the cooldown has just started. |
| `boolean canPress(Player player)` | Prevents an entry that is still on cooldown from becoming visually pressed or sending a use request. |
| `void onPress(Player player)` | Called when the entry is pressed with its number key. |
| `void onPressTick(Player player)` | Called every client tick while the entry is held down. |
| `void onRelease(Player player)` | Called when the number key is released. |
| `void render(...)` | Draws the entry, including its background, key label, icon or name and the server-authoritative cooldown. Override it to change the visuals without changing the shared overlay. |

## Modes

An entry becomes visible through a hotbar mode. `HotbarModeRegistry` owns the registered modes and the entry list each one provides — `mxt:ability` and `mxt:spirit` are built in — and its `register(...)` overloads add another one, optionally with its own key mapping, close callback and configuration provider.
