---
title: WheelSource
---

# WheelSource

Where one wheel **page** comes from, and therefore which page it is: the page the player arranged reads a saved layout, while every other page is derived from what the player carries right now. A content mod implements this and registers it from its mod setup with `WheelSourceTypes#register`, and the page then takes part in numbering and page turning like a built-in one. **The first registration of an id wins**, and page order is registration order, which is cell-numbering order. The five built-ins are the player's own layout, the main hand, the off hand, artifacts in Curios slots, and the contract beast.

| Member | Description |
| --- | --- |
| `Identifier id()` | What the client and the server name the page by; the two sides only have to agree on the registration, never on an order. |
| `Component displayName()` | The page's name. A built-in returns its own translation key; a content mod may return whatever component it likes. |
| `boolean configured()` | Whether this page is the player's saved layout rather than a reading of what they carry. A configured page is always shown, even while it holds nothing - it is the page the player arranges. |
| `List<Identifier> grantSources(LivingEntity entity)` | The grant sources this page is made of, or an empty list for a page that is not read from the grant ledger. These are the ids an equipped item recorded its grants under, which is what makes the page follow the item. |
| `List<ItemStack> equipment(LivingEntity entity)` | The stacks this page reads carriers from, in the order a press should prefer them. |
| `boolean offers(LivingEntity entity, WheelEntryKind kind, Identifier id)` | Whether an entry of that kind, by that id, is reachable through this page right now. **Answering yes authorises nothing**: the pipeline behind the entry re-checks grant, cost and cooldown on its own. |

Paging, numbering and the main wheel / derived pages in full are in [Wheel Entries](../../wheel.md); the entry contract is [WheelMenuEntry](./wheel-menu-entry.md).
