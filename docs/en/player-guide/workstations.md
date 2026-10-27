---
title: Workstations, Display Stands and Slots
---

# Workstations, Display Stands and Slots

The interactive faces that are neither items nor commands: the Spirit Crafting Table, the Display Stand, the Curios slots, and `/display` for showing an equipped item in chat.

## Spirit Crafting Table

The Spirit Crafting Table (`mxt:spirit_crafting_table`) reuses the vanilla crafting layout but only accepts `spirit_shaped` and `spirit_shapeless` recipes. Items placed in the grid stay in the menu, and aura is only accepted when a matching recipe is present; it is deducted when the result is taken out of the output slot. JEI lists the spirit recipes together with their aura cost, and Jade shows how much aura the table currently holds.

## Display Stand

A Display Stand (`mxt:oak_display_stand` and the five other wood variants) holds a single item:

- Using an item on an empty stand places one of that item on the stand.
- Using the stand again returns the displayed item, which drops above the centre of the block. Breaking the stand also drops it.
- If the displayed item implements the aura access interface the ray can fill it. The stand tries to charge a displayed spirit stone whenever it receives spirit power. A spirit vessel is filled by that ray too (see [Storage and Spirit Vessels](../tutorial/storage-and-spirit-vessels.md)), and firing spirit power with one in the main hand likewise charges it instead of launching a ray.

## Curios Slots

The mod provides the `back_weapon` and `belt_item` slots. The back and belt slots are controlled by **Server Config → Curios Slots → Back Slot / Belt Slot**, and a keybind swaps the main hand with the first item in the back slot. The slot screen and its rendering are on [Curios Slots](./curios-slots.md).

## /display Command

`/display` shows an equipped item of yours in chat as a hoverable item link:

| Usage | Result |
|---|---|
| `/display` | Broadcasts your main hand item to the whole server. |
| `/display <slot>` | Broadcasts your item in that slot. |
| `/display <player>` | Sends your main hand item to that player only. |
| `/display <player> <slot>` | Sends your item in that slot to that player only. |

Available slots: `mainhand`, `offhand`, `head`, `chest`, `legs`, `feet`. It reads vanilla equipment slots, so Curios slots are not accepted; it requires a player and no operator permission. Each form is described on [`/display`](./commands/display).
