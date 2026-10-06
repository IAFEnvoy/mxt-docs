---
title: /trade
---

# `/trade`

| Command | Effect |
|---|---|
| `/trade <player>` (= `/mxt trade <player>`) | Sends a trade request to that player. |

Once the other player accepts, both sides get a trade window: each puts items into their own offer and presses **Accept** to agree to that offer.

**An acceptance is bound to the offer as it stood.** If either side changes their offer after confirming (taking an item out, putting one in, shift-clicking, changing a count), both acceptances are cleared and have to be given again; the trade settles only when both sides have accepted the same offer — so nobody can swap items in after the other side has agreed.

**Closing the window ends the trade**: pressing Esc, having another screen replace it, or the server closing it all return the items in both offers to their owners, and neither side stays stuck "in a trade".
