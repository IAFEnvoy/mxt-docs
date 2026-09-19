---
title: Client Screens
description: "Where the mod's client screens live, and how the item picker ItemPickerScreen clones the vanilla creative search tab without becoming a way around creative mode."
---

# Client Screens

The mod's client screens all live under `com.iafenvoy.mxt.screen`: container **menus** in `screen.menu`, their **screens** in `screen.gui`, purely client-side information screens in `screen.information`, the item picker in `screen.picker`, and the HUD overlays (hotbar, resource bars) in `screen.overlay.hotbar` / `screen.overlay.resourcebar`. A new screen should reuse the existing `Screen` base classes and vanilla components first rather than writing its own scrolling and text input.

## The Item Picker `ItemPickerScreen`

A clone of the vanilla creative search tab, **whose contents alone are this mod's**: the screen extends `AbstractContainerScreen`, and its menu `PickerMenu` has the shape of `CreativeModeInventoryScreen.ItemPickerMenu` — a 5×9 slot grid holding one page of the result list, plus a bottom row of nine **real player hotbar** slots. The items, the counts, the model seed, the hover highlight (`container/slot_highlight_back/front`) and the tooltips are all read out of the slots by the vanilla base class; the screen draws none of them itself.

The background is `minecraft:textures/gui/container/creative_inventory/tab_item_search.png` (195×136). That texture **already draws both the grid slot frames and the hotbar slot frames**: the hotbar row is at `y=111..128`, `x=9..170`, which matches `addInventoryHotbarSlots(inventory, 9, 112)`, so adding the slots is enough for vanilla rendering to draw the items into the frames that are already there. The search box is an `EditBox` with `setBordered(false)`, placed on the well the texture already contains at `(82, 6)` (the well is its own frame and background); the scrollbar uses the tab's own `container/creative_inventory/scroller` (a 6×32 nine-slice, stretched to `12×15`) at the same `leftPos + 175`, `topPos + 18` as vanilla, with a travel of `112 - 15 - 2`. **The panel is never drawn in code**, so it follows any resource pack that redraws that texture.

There are two entry points, differing only in where the contents come from:

```java
// Any list of items: the order is the display order, and empty stacks are dropped
Minecraft.getInstance().setScreen(ItemPickerScreen.over(
        Component.translatable("screen.mxt.example_picker"),
        candidates));                    // List<ItemStack>

// Categories named by the server: the grid is built on the client from the synced registries
// opening returns null before a world exists (the menu needs a player inventory),
// so check for null instead of handing it straight to setScreen
ItemPickerScreen screen = ItemPickerScreen.opening(payload.title(), payload.categories());
if (screen != null) Minecraft.getInstance().setScreen(screen);
```

`over` is a static factory rather than a constructor only because the category path needs the same shape over its own entry type, and two constructors cannot be told apart by the element type of a `List`.

## How an item leaves this screen

The screen itself never sends an item. Clicking the grid **only moves the client-side carried stack**, which is a purely local illusion; the carried stack lives on the player's real `InventoryMenu` (`PickerMenu.getCarried` / `setCarried` proxy to it), and this `PickerMenu` does not exist on the server at all (`super(null, 0)`).

An item becomes real by only two routes, and both are the vanilla creative one:

1. **It lands in the hotbar**: carry the stack onto a hotbar slot, or use 1-9 / the offhand key. In `init()` the screen attaches a `CreativeInventoryListener` (the vanilla class, used directly) to `player.inventoryMenu`, after which the slot diff in `inventoryMenu.broadcastChanges()` forwards the changes it noticed as a `ServerboundSetCreativeModeSlotPacket`; `removed()` detaches it;
2. **It is thrown out of the panel**: the same packet, with slot `-1`.

> `MultiPlayerGameMode.handleCreativeModeItemDrop` refuses to send while "any container screen other than the creative screen" is open, and this screen is exactly such another container screen, so dropping cannot go through it; `ItemPickerScreen.throwCreative` builds the packet itself, with the same guard conditions.

## Gesture reference (identical to the vanilla creative inventory)

| Gesture | Effect |
|---------|--------|
| Left-click a grid slot | Pick up 1 into the carried stack |
| Shift + left-click a grid slot | Pick up the whole stack |
| Middle click (pick block key) | Fill the carried stack to a whole stack |
| Left-click the same kind of grid slot (carried stack not empty) | Carried stack +1; with Shift, fill it up directly |
| Right-click the same kind of grid slot (carried stack not empty) | Carried stack -1 |
| Left-click an empty slot / right-click | Put down the carried stack / remove 1 |
| Hover a grid slot and press 1-9 or the offhand key | A whole stack straight into that hotbar slot / the offhand |
| Q / Ctrl+Q | Throw 1 / a whole stack out of the grid without touching the carried stack |
| Put the carried stack onto a hotbar slot | It lands in the real inventory |
| Click outside the panel | Throw the carried stack (left button the whole stack, right button 1) |
| Shift + left-click a hotbar slot | Empty that slot (vanilla behaviour) |

There is no other way to choose a count. The stack shown in the slot is the amount you get, so the picture and the result cannot disagree.

## Why this does not become a way around creative mode

`ServerboundSetCreativeModeSlotPacket` is stopped at the **protocol codec layer** by the `GameProtocols.HAS_INFINITE_MATERIALS` codec modifier: at decode time, if the server does not consider the player to be in creative mode it throws `SkipPacketDecoderException` and the packet is silently dropped (no disconnect, just one debug log line); `handleSetCreativeModeSlot` then checks `hasInfiniteMaterials()` again and validates `isItemEnabled`, the slot range 1..45 (slot 0, the crafting result slot, is excluded) and the count limit. A non-creative client therefore cannot send it and cannot profit from it. The full analysis is in `research/20_原版创造模式的信任模型.md`.

`/picker` still requires gamemaster permission and requires `player.hasInfiniteMaterials()` — the latter is not extra caution but alignment with the condition that packet is checked under: opening a panel the server would refuse every action of is worse than not opening it.

`ItemPickerManager` only owns the "registry → selectable entry" mapping, and is now only the **source of the screen's contents**; the server no longer needs it. Each entry it produces is a `PickerItem(stack, names)`: **the stack to draw**, plus **the names that row can be found by**. The stack itself is left alone and **nothing is written onto the item** (no custom name, no suffix) — when the same stand-in item represents several definitions they are told apart by search, not by a marker in the name. The names are supplied by the catalogue itself:

- entries of the item/block registries are items themselves, and the stack already says what it is called, so the names are "the name it displays + its registry id";
- a data-driven definition has no item of its own and nothing on the stack shows who it stands for, so its names come from the translation key `DefinitionText` builds out of its `Holder` / `ResourceKey` — `mxt:fire` in `mxt:aura` looks up `aura.mxt.fire` — plus its id. A definition with a name of its own (quality, whose name is written in the datapack) uses that name;
- for rows expanded out of a tag match, the names include both the item's own name and the names and ids of the definitions it belongs to.

A list rather than a single name, because a row can have several things it is called. The screen no longer has to infer anything back from a "registry key + entry id"; only the `over(...)` path has no catalogue to ask, and there the screen supplies "display name + item id" itself.

How a translation key is spelled is decided in one place, `com.iafenvoy.mxt.util.DefinitionText`: the category defaults to the registry's own path, and the few that do not (`mxt:item_quality` has always been translated as `quality`) are declared once in its internal `CATEGORIES`. With a `Holder` / `ResourceKey` already in hand, call `DefinitionText.name(holder)` directly; only when all you have is a bare `Identifier` do you pass the category in as an argument (`DefinitionText.name(id, "resource")`).

A category is the registry itself, and `/picker <category id>` can list just one (`/picker mxt:aura`, `/picker mxt:currency`, `/picker mxt:item_binding`); leaving it out offers every registered category.

## Screen details

- `over` filters out stacks that are `isEmpty()` and keeps the components already on the stacks it is handed (quality, aura and so on); it never rebuilds the items.
- The screen does not close itself: several items can be taken in a row, and the player closes it.
- The search box is written the way the vanilla creative search field is: an `EditBox` with no border, `setCanLoseFocus(false)`, focused from the start, with `charTyped` / `keyPressed` / `preeditUpdated` all forwarded to it first, and only Escape falling through to the superclass to close the screen.
- Filtering: the query is split on whitespace and every token has to hit; an ordinary token matches a substring of the **names the row declared**, while a token starting with `@` matches the item namespace only (such as `@minecraft diamond`). A row that declared no name at all falls back to its own display name, so "what you can see, you can type" holds for every row.
- A category whose candidate list is empty shows no placeholder text; the grid is simply empty.
- The screen size is fixed at the vanilla tab's 195×136 and is centred by `AbstractContainerScreen`, with no window clipping — as in vanilla, the panel overflows the picture when the window is too small.
- The title is drawn in the texture's top-left `(8, 6)`, on the same line as the search box — the vanilla search tab's line has only the search box and no room for a title; the title is drawn after the widgets, so the search box does not cover it.
- The search box is not put into the widget draw queue (`addWidget` rather than `addRenderableWidget`) and is painted by hand in `extractBackground` instead, which keeps it in the background stratum, always under the items, exactly as in vanilla.
- In `containerTick`, as soon as the player no longer has infinite materials the screen switches back to `InventoryScreen` — the vanilla creative screen does the same, so a panel that would have every action refused by the server is not left open after being dropped back into survival.
- The grid slots are `GridSlot`, whose `mayPickup` refuses items behind a disabled feature flag and items marked with `CREATIVE_SLOT_LOCK`, the same as vanilla's `CustomCreativeSlot`.

Two things to keep in mind when adding a screen: a window resize goes through `Screen.resize` → `rebuildWidgets` → `init`, so any screen state (a search term, a scroll position) has to be kept in the screen's own fields; and a container screen hands "the panel background plus the widgets" to `extractBackground` and "the slots, the hover highlight and the tooltips" to `extractContents`, in an order vanilla has already fixed — if you want vanilla's render layering, do not take it apart and redraw it yourself.
