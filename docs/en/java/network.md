---
title: Network Protocol and Server Authority
description: "The mod's C2S and S2C payloads, the server-side re-resolution rule they follow, and the one exception that carries item contents."
---

# Network Protocol and Server Authority

The client sends intentions only; the server re-resolves the IDs, re-checks the attachments and the conditions, and then settles. The main C2S payloads are:

| Payload | Purpose |
|---------|---------|
| `AbilityActionC2SPayload` | Using or cancelling an ability. |
| `SpiritBurstC2SPayload` | Starting or stopping the release of one aura. |
| `BackSlotSwapC2SPayload` | Swapping the main hand and the back slot. |
| `ForgingActionC2SPayload` | Forging start, strike, finish and cancel. |
| `ChequeActionC2SPayload` | Depositing into and withdrawing from a cheque table. |
| `StationTradeC2SPayload` | Settling a trade station. |
| `PlayerTradeActionC2SPayload` | Changing the requesting side's own state in an open one-to-one trade. |
| `CultivationToggleC2SPayload` | Requesting a toggle of the cultivation mode. |
| `FlightToggleC2SPayload` | Requesting a toggle of one flight state; the server still validates the requested `archetype`. |
| `HotbarLayoutC2SPayload` | Sending the complete hotbar layout back to the server when the configuration screen closes. |

The server synchronises the dynamic registries, the resource/aura state it needs (`AuraStateS2CPayload`) and the attachments to the client, and pushes `HotbarConfigurationS2CPayload` (asking the client to open the hotbar configuration screen of one mode) and `ItemPickerS2CPayload` (opening the item picker, carrying only the title and the category ids, never items) when it needs to. Never treat a value that came from the client as a trusted result; a payload should carry IDs, choices and action intentions only.

**An S2C payload's type is registered on both sides, but its handler only on the client.** The server is the side that encodes it, so it has to know the codec; it never handles one, and a handler such as `ClientNetworkHandler` touches client-only classes like `Screen`. A dedicated server's class loader refuses to load those at all, so merely constructing the handler while registering is enough to make the server crash during mod loading with `NoClassDefFoundError: net/minecraft/client/gui/screens/Screen`. `NetworkManager` therefore branches on `FMLEnvironment.getDist()`: the client registers with the `playToClient` overload that takes a handler, and the server uses the one that does not, registering the type alone.

**The one exception is the item picker.** It borrows the vanilla `ServerboundSetCreativeModeSlotPacket`, so the item contents really do come from the client and travel through no mod payload at all. That channel is guarded by the server's own capability switch: the packet is stopped at the **decode layer** by `GameProtocols.HAS_INFINITE_MATERIALS` (if the server does not consider the player to be in creative mode, the whole packet is dropped without a disconnect), and `handleSetCreativeModeSlot` checks `hasInfiniteMaterials()` a second time and validates the item's features and its stack limit. Do **not** imitate it when adding a mod payload — anything that cannot get the same gate must go through "the client reports IDs only, the server resolves them itself". See [Client Screens](./screens.md) for the full analysis.
