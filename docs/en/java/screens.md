---
title: Client Screens
description: "Where the mod's client screens live, and how the item picker ItemPickerScreen clones the vanilla creative search tab without becoming a way around creative mode."
---

# Client Screens

The mod's client screens all live under `com.iafenvoy.mxt.screen`: container **menus** in `screen.menu`, their **screens** in `screen.gui`, purely client-side information screens in `screen.information`, the item picker in `screen.picker`, directional selection (the twelve-sector wheel) in `screen.wheel`, and the HUD elements in `screen.hud` (the framework), `screen.resourcebar` (resource bars) and `screen.wheel` (the wheel grid). A new screen should reuse the existing `Screen` base classes and vanilla components first rather than writing its own scrolling and text input.

## The Draggable HUD Framework `screen.hud`

A HUD element that a module draws itself becomes movable and persistent by plugging into this framework. The framework does four things: it **keeps a register of elements**, **draws them every frame**, **gives the editor hit testing and placeholders**, and **writes positions into the client config**.

**An element neither computes screen coordinates nor decides where it is drawn.** The sub-area (the two resource-bar columns, say) only *supplies objects*: it describes what it currently has to show as a list of `RenderBlock`s (a size plus a way to draw each one), and the framework's single renderer `HudRenderer` stacks them inside the element's rectangle - the vertical position has exactly one implementation, so a container's size and its contents can never disagree; ask for a gap with `RenderBlock.spacer` rather than adding it to a block's height. An element that has to draw itself as one piece takes the other door: `renderBlocks()` returns an empty list and the framework calls `render()` instead.

```java
public final class MyBar extends AbstractHudEntry {
    public MyBar() {
        // The layout key is both the storage key in the config and the duplicate-registration check:
        // one per element, and never renamed across versions.
        super("my_bar", WIDTH, HEIGHT);
    }

    @Override public String displayName() { return Component.translatable("hud.mxt.my_bar").getString(); }
    @Override public int layoutWidth() { return WIDTH; }
    @Override public int layoutHeight() { return HEIGHT; }
    @Override public int defaultX() { return 4; }
    @Override public int defaultY() { return 4; }

    // Description only: a backdrop and a value. Where they land is the framework's business.
    @Override
    public List<RenderBlock> renderBlocks() {
        return List.of(
                RenderBlock.fill(WIDTH, 6, 0xFF10131D),
                RenderBlock.label(Component.literal("42 / 100"), 0xFFFFFFFF));
    }
}

// Register once from client setup (FMLClientSetupEvent); the instance comes back for keeping a reference.
MyBar bar = HudManager.register(new MyBar());
```

Worth knowing:

- **A position is stored as a ratio of the window, not as pixels**, with the origin at the **top-left corner** of the window. Each entry under `hud.layout_v2` in `config/mxt/mxt-hud.json` is `x,y,visible` with `x`/`y` in `0..1`, meaning the top-left corner of the element's rectangle, so a layout does not drift when the resolution or the GUI scale changes. The pixel value lives in memory only and is clamped into the window on every read, so an element can never be dragged out of sight. The `_v2` in the key is left over from a change in what a stored position means: the old key is simply no longer read and those layouts fall back to their defaults.
- **The HUD layout is a config file of its own** (`config/mxt/mxt-hud.json`), not part of the client settings; the rest of the config lives under `config/mxt/` too (`mxt-client.json`, `mxt-server.json`).
- **The anchor (`HudAnchor`)** says which point of the rectangle `defaultX()` / `defaultY()` describe, and which point stays still when the element resizes. The default is the top-left corner; something that grows upward (a resource-bar column) uses `CENTER_BOTTOM`, so its bottom edge stays put as it gets taller.
- **A change is saved immediately.** Dragging, arrow-key nudging and toggling visibility all write the config at once. Nothing is flushed when a screen closes, so a crash cannot lose a layout - and equally, editing the JSON by hand needs a client restart, because an element reads its position once, when it is constructed.
- **A position has exactly one source**: if the config holds this layout key, that ratio is used (and re-derived only when the window changes size); if it does not, the element's own default position is used, re-read every frame so it follows the window. `resetToDefault()` **deletes the key from the config** - a reset that only lasted until the next launch would read as "the layout was not saved". (An earlier version kept a second boolean meaning "the position in use is the stored one"; it started out `false` and only a drag ever set it, so the value in the file was never applied and every restart fell back to the default. One fact, one field.)
- **Only elements that answer `visible() && moveable()`** count as movable. An element that computes its own position and should not be dragged (a centred hotbar, say) overrides `moveable() { return false; }` and is still drawn by the framework; if such an element also sizes itself from world state, it must override `refreshPlacement()` and call the base `placeAtDefault()` so the default position is actually applied - **computing a size without placing anything leaves the anchor at `(0,0)`** and draws the element in the top-left corner of the window.
- **The element owns its size**: one whose width follows its content calls `setSize(w, h)` when that changes. An element with nothing to draw still needs a non-zero size, or the player cannot see it in the editor and therefore cannot place it.
- **Register from client setup**, not from the first rendered frame: the framework's GUI layer only draws inside a world, so an editor opened from the main menu would otherwise show an empty register.
- **The editor** is opened by `HudManager.openEditor()` (the `key.mxt.hud_layout` keybind, right `Shift` by default, or the client command `/hud open`). Drag with the left button, nudge with the arrow keys by one pixel (`Shift`: ten), `Escape` drops the selection, and clicking empty space clears it. **There is no scaling yet**: this port only moves elements, so KronHUD's corner-drag resizing and snapping guides are not part of it.
- Elements **keep drawing for real** while the editor is open; the editor only adds a translucent rectangle and a name label, so what is being dragged is the actual element.
- The client command `/hud` prints each element's layout key, position, size, block count and visible/movable flags. "Nothing is registered" and "registered but it has nothing to draw this frame" look identical on screen, and this is the only thing that tells them apart.

**Five elements are registered today**: four resource bars - the two movables (`resource_bars.left` / `resource_bars.right`) and two fixed rows (`resource_bars.target` / `resource_bars.boss`) - plus the wheel's grid (`wheel.selection`, `screen/wheel/WheelSelectionEntry`, which returns no blocks and draws its own **four-column grid, one row per three cells of a page**, growing downward: 94 wide, as tall as its contents, cell numbers in reading order, the cell the chosen number stands for drawn with the gold selected frame. It is the first example of the "draws itself" branch, and also the first whose **size follows its contents** (`layoutWidth` / `layoutHeight` are computed per frame and `refreshPlacement` reports the change with `setSize`, so a block that grew past the window is pulled back in); its default place is against the left edge of the window, halfway down; it draws **the whole wheel** - every cell of every page - and writes no label of its own). The resource bars are a good template — `ResourceBarOverlay.column(anchor)` / `row(target, layout)` answer only "which bars, in what order", and an entry turns them into blocks with `ResourceBarEntry.blocksWithGaps(...)`, which also inserts a `spacer` between bars. **No position field exists on the data-pack side**: `anchor` in `resource.bars` only chooses which column a bar belongs to, and where those columns sit is the player's own setting in the client config; the two fixed rows are pinned to the entity under the crosshair, computed every frame and never stored. The resource bars' own `mxt:resource_bars` GUI layer has been deleted - everything goes through the framework's layer. The framework's own trade-offs are recorded in the repo's `research/26_可拖动HUD框架设计.md`, and the changes to the wheel grid in `research/27_轮盘选择系统设计.md` §8 and `research/31_多轮盘与轮盘来源设计.md` §10.4.

## The Wheel Menu `screen.wheel`

Hold the bound key (`key.mxt.wheel`, `R` by default) and a **twelve-sector** wheel appears: the **direction** the pointer is in picks the sector, the pointed-at sector turns gold and grows a little, and **that sector's name and tooltip are drawn in the middle of the wheel**. It is the **only** way an ability or a spirit power is triggered - the two hotbars and their separate editors are gone (`research/28_技能与灵气归一化设计.md`).

**The wheel is a main wheel plus pages read from what is carried, strung together by one continuous cell numbering** (new on 2026-09-22, redone to the player's own wording - see `research/31_多轮盘与轮盘来源设计.md` §10): the main wheel is the twelve cells the player arranges (numbers `0..11`), and the pages behind it (main hand / off hand / artifacts) are generated from the gear and **never stored**, numbered from `12` on. **A page is twelve cells**, so a source takes `ceil(entries / 12)` pages and none at all while it holds nothing - "one is not enough, open another". Turning pages is two keys (`key.mxt.wheel_previous` / `key.mxt.wheel_next`, numpad `4` / `6` by default, wrapping at both ends), and `R` **always opens the main wheel (the first page)**. **A page is a view and the number is the choice**: the ring draws the current page, the HUD grid draws the whole wheel, the twelve slot keys act on the current page, and the use key while the wheel is down acts on whatever cell the number stands for now (a number past the pages that exist falls back to the last cell holding anything, and is never rewritten).

The framework (geometry, ring rendering, open/close state machine, selection semantics) is `screen.wheel`; the contents (how an ability or an aura becomes an entry, what each source contributes) are `screen.wheel/content`, and the editor is `WheelConfigurationScreen`. The contract, the stored layout, the numbering and paging, and the trigger dispatch are on the [Wheel Entries](./wheel.md) page; what belongs here is the framework's own rules:

- **The framework does not decide what is on the wheel.** `WheelMenuProvider` (its only implementation is `WheelContent`, registered from client setup) answers "what does this source contribute right now" (given the player and a `WheelSource`; the answer may be longer than a page, and `WheelMenuContent` pages it), and the entry contract is `WheelMenuEntry` (`kind` / `id` / `title` / `icon` / `tooltip` / `cooldown` / `usable` / `onSelected`). This replaced the framework's first design, a static registry of twelve slots: the contents are the player's own layout now, and a second way in would only compete with it for cells.
- **The layout lives on the server**: the `wheel_layout` player attachment holds one `WheelLayout` of twelve `WheelSlot`s (a kind plus an id, with an `EMPTY` sentinel for an empty cell, **the main wheel only**) plus an `armed` field holding the chosen **cell number** (`Optional<Integer>`). Closing the editor sends a `WheelLayoutC2SPayload`, and `WheelService.sanitize` forces the size to twelve and checks each id against the registry its kind names before storing it. The number travels on `WheelSelectionC2SPayload`, restored at login and sent when it changes by `screen/wheel/content/WheelSelectionSync` - see [Wheel Entries](./wheel.md#keeping-the-selection) for the details.
- **One fact, one place: the pointer-direction-to-sector mapping lives only in `WheelGeometry`** (`sectorStart` / `sectorCentre` / `sectorAt` are derived from the same constants, so `sectorAt(sectorCentre(k)) == k` always holds). Drawing, hit testing and icon placement all ask it. MineMenu recomputed that mapping in three places, and one of the three used a different angle convention from the other two.
- **Direction decides, distance never does.** A pointer still inside the inner hole counts, which is what lets the middle of the wheel name the pointed-at sector the whole time.
- **The sector count is `WheelLayout.SLOTS` (twelve) and the geometry takes it from there**, so there is no way to end up with twelve sectors of geometry and ten slots of content.
- **Empty cells are drawn as faint placeholders** that never react to the pointer and never put text in the middle; with **the whole wheel** empty the key says "Nothing is on the wheel yet" instead of opening.
- **Choosing and using are two keys**: `key.mxt.wheel` (`R` by default) only **chooses** - hold to open, the pointer picks the cell, and letting go (`mode = HOLD`) or pressing again (`TOGGLE`) **only closes, triggering nothing**; `key.mxt.wheel_use` (`V` by default) does the **using** - while the wheel is up it spends the pointed cell and leaves the wheel standing, and while it is down it spends **the cell the number stands for now** (client-side `WheelSelectionState`, which holds `page` plus `number`; `LoggingIn` clears it and the `armed` number the server stored is then put back, see [Keeping the selection](./wheel.md#keeping-the-selection)). A left click is the same. `WheelSelection.Method` is `KEY` / `CLICK` and only says whether the request came from the keyboard or the mouse. The client settings are down to `mode` (hold / toggle): `release_to_select` was deleted with this revision.
- **Using does not close the wheel**, so one hold can spend several cells; what takes the wheel down is the wheel key alone.
- **The keys cannot be read through `KeyMapping#isDown()`**: `Minecraft#setScreen` calls `KeyMapping.releaseAll()` as soon as a screen opens, so the release that closes the wheel would be seen on the very frame it appeared. There is a second reason, about the use key: releasing the wheel key while still holding `V` makes `MouseHandler#grabMouse()` call `KeyMapping.setAll()`, which sets `V` down again from the physical key and would report one press twice. The controller therefore reads the wheel key, the use key and both switch keys raw through `InputConstants`/GLFW, with one edge detector per key, and the `KeyMapping`s exist so the keys show up in the controls screen. The cost is one client tick of resolution.
- **It is a `Screen`, not a GUI layer**: opening a screen is what makes vanilla release the mouse (so the pointer can pick a direction, and the angle is scale invariant), and closing it is what grabs the cursor back. It is not a pause screen, and it draws no background - the default background blurs every stratum extracted before it, which is the whole HUD.
- **Colours, radii and the opening animation are still constants** in `WheelMenuScreen` / `WheelGeometry`; the highlight reuses the HUD editor's gold and the ring shrinks to fit a small window.
- **Holding the wheel stops you walking**: vanilla calls `KeyMapping.releaseAll()` for any `Screen`, so the movement keys are released as well (letting go calls `setScreen(null)` → `grabMouse()`, which syncs the physical key state back, so nothing has to be pressed again). Opening a wheel while running would mean a GUI layer that handles the pointer itself.

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

A category is the registry itself, and `/picker <category id>` can list just one (`/picker mxt:aura`, `/picker mxt:artifact`, `/picker mxt:currency`, `/picker mxt:item_binding`); leaving it out offers every registered category.

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
