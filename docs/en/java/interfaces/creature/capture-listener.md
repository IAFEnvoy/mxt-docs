---
title: CaptureListener
---

# CaptureListener

The interface that wants to be **told when something captures or releases the creature**. Capturing is **not an eligibility** - any creature may be captured, and **how a capture works is decided by the item doing it** (what it may hold, whether it needs a contract, what it costs - the Spirit Beast Bag's own rule is "your own contracted beast, one at a time"). So only two optional hooks are left:

| Member | Description |
| --- | --- |
| `void onCaptured(@Nullable Player captor)` | After the creature is taken, before the entity leaves the world. |
| `void onReleased(@Nullable Player captor)` | After the creature is back in a level. |

Both do nothing by default: **a creature that does not implement this can still be captured**, it simply hears nothing; `captor` is empty when no player did it.

The state of a capture is not part of this interface - a captured beast is recorded in the item's own component, and the interface only has to tell the creature. Eligibility to be contracted is a different interface, see [Contractable](./contractable.md).
