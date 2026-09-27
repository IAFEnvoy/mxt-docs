---
title: WheelMenuEntry
---

# WheelMenuEntry

One thing the wheel can choose, client-side only: its name, its icon and what choosing it does. A cell's identity is the id of the definition it stands for; which sector it lands in and which page it belongs to are not its business.

| Member | Description |
| --- | --- |
| `WheelEntryKind kind()` | Which kind the entry is (see [WheelEntryKind](./wheel-entry-kind.md)): the tooltip's first line, the editor pool it appears in, and which side of the server dispatch triggers it. |
| `Identifier id()` | Stable identity: the saved layout addresses the entry by it, and it looks the definition back up. |
| `Component title()` | The name drawn in the middle of the wheel while this sector is under the pointer. |
| `Optional<IconReference> icon()` | The icon drawn inside the sector, an item or a texture; nothing by default. |
| `int accentColor()` | The colour marking this entry's kind in the editor's slot row. |
| `List<Component> tooltip(Player player)` | The lines shown when the player asks what this is; rebuilt on demand, so it may read the player. |
| `long cooldownTicks(Player player)` | Ticks of cooldown left, `0` meaning ready. |
| `long cooldownLength(Player player)` | How long that cooldown is **in total**, or `0` when the entry does not know. A display draws the vanilla item-cooldown sheet over the remaining fraction of the icon, so an entry that cannot answer still says "on cooldown" - it just cannot say how far along. |
| `boolean usable(Player player)` | Whether choosing it would do anything. It only dims the sector and writes "on cooldown"; the trigger is still sent. |
| `void onSelected(WheelSelection selection)` | Called on the client once the entry was used; the wheel stays open. `WheelSelection(source, number, entry, method)` carries the source it was read from, the cell's number and how this use came about. |

What one source contributes is answered by `WheelMenuProvider`, and **it is registered per source id** (`WheelMenuContent.register(source, provider)`, with `WheelContent` registering one shared instance for all five built-in pages, so a content mod adds a page of its own). Its answer **may be longer than one page**, which `WheelMenuContent` turns into pages of twelve cells. The page itself is [WheelSource](./wheel-source.md); a complete implementation example is in [Wheel Entries](../../wheel.md).
