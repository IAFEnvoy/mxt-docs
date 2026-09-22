---
title: Curios Slots
description: "The back_weapon, belt_item and charm Curios slots: sizes, validators, server configuration, rendering and resource-pack offsets."
---

# Curios Slots

MiXianTu provides player Curios slots in the order **back → belt**, plus four charm slots: two `back_weapon` slots, two `belt_item` slots and four `charm` slots. All of them are physical slots — the mod does not create Curios cosmetic slots — and back and belt items are rendered directly from the physical slots. **Items in the charm slots are not rendered on the body.**

| Slot ID | Size | Order | Validators | Accepted items |
|---|---|:---:|---|---|
| `back_weapon` | 2 | 0 | `curios:tag`, `mxt:back_weapon_auto` | Items in the tag, plus what the automatic validator allows. |
| `belt_item` | 2 | 1 | `curios:tag`, `mxt:belt_item_auto` | Items in the tag, plus what the automatic validator allows. |
| `charm` | 4 | 200 | `curios:tag`, `mxt:charm_artifact_auto` | Items in the tag, plus artifacts declaring `curios_equipable: true`. |

The slots are registered for `minecraft:player`. The bundled `curios:tag` tags already list the vanilla swords (and the bow for the belt slot) together with the mod's own `#mxt:back_equipable` and `#mxt:belt_equipable` extension tags. `charm` is Curios' **built-in** slot: the mod only adds the size and its own validator to it, keeps the slot's own name and icon (`curios.identifier.charm`, `curios:slot/empty_charm_slot`), and puts nothing into the `curios:charm` item tag itself.

## Automatic Validators

`back_weapon` and `belt_item` keep the `curios:tag` validator and additionally use an automatic validator registered by the mod; `charm` uses one of its own:

- `mxt:back_weapon_auto`
- `mxt:belt_item_auto`
- `mxt:charm_artifact_auto` — allows artifacts whose definition declares `curios_equipable: true`, and nothing else.

All of them are additional-allow logic: they never override or modify `curios:tag`. Other mods can register their own validators through the Curios API, but datapacks cannot create new validation algorithms.

### The Charm Slots

The four `charm` slots are Curios' **built-in** `charm` slot, widened by this mod: `data/mxt/curios/slots/charm.json` adds the size `4` and the `mxt:charm_artifact_auto` validator to it, and leaves the slot's own order and icon alone. Membership is a property of the item's definition — an artifact opts in by writing `curios_equipable: true` — so there is **no server configuration entry** for these slots. To allow something that is not an artifact, put the item in the `curios:charm` item tag; the `curios:tag` validator stays in place. An artifact in a charm slot works like any other Curios item: the abilities its definition grants are synced and revoked with it.

> Curios slot ids are global strings and definitions with the same id merge, so these four slots are the whole modpack's `charm` slot: other mods' charm items share them.

## Server Configuration

The **Curios Slots** tab of the server configuration controls the automatic validation range, and the server syncs it to clients.

| Setting | Values | Default | Effect |
|---|---|---|---|
| Back Slot | Manual, Weapons Only, All | Manual | The automatic validation range of the back slots. |
| Belt Slot | Manual, Weapons and Artifacts, All | Manual | The automatic validation range of the belt slots. |
| Always Render | on / off | off | Forced rendering of this mod's back and belt slots. |

**Back Slot**:

- **Manual**: the automatic validator allows no extra items, so only items allowed by `curios:tag` can be placed.
- **Weapons Only**: besides the tag items, items matching `weapon_binding` are allowed.
- **All**: besides the tag items, every item is allowed.

**Belt Slot**:

- **Manual**: only `curios:tag` items are allowed.
- **Weapons and Artifacts**: additionally allows weapons matched by `weapon_binding` and artifacts whose definition declares `curios_equipable: true`. The test reads the definition itself, not whether the stack carries artifact state.
- **All**: besides the tag items, every item is allowed.

## Visibility and Rendering

The Curios slot screen buttons control each slot's `getRenders()` state and the slot's overall visible state, and the mod's back and belt rendering honours those states. With **Server Config → Curios Slots → Always Render** on, only this mod's back and belt slots are forced to render; other mods' slots are unaffected. The four charm slots have no renderer at all — an artifact is an arbitrary existing item with no model of its own — so there is nothing to show on the body and no offset file for them.

## Swap Keybind

"Swap Main Hand with Back Weapon Slot" (`key.mxt.swap_back`) swaps the main hand stack with the first `back_weapon` slot. If the main hand stack is not valid for that slot, the swap does nothing. The keybind is unbound by default; see [Keys and HUD](./keys-and-hud.md).

## Resource-Pack Render Offsets

The back and belt render offsets are controlled entirely by the client resource pack:

- `assets/<namespace>/mxt/back_render/*.json` for the back slots.
- `assets/<namespace>/mxt/belt_render/*.json` for the belt slots.

Each file is one rule. The rule whose `item` matcher matches the stack and whose `priority` is highest wins; when no rule matches, items carrying the vanilla `minecraft:weapon` component fall back to the `weapon` preset and all other items fall back to `default`.

| Field | Type | Default | Description |
|---|---|---|---|
| `item` | `ItemMatcher` | **required** | The items or item tags the rule applies to, using the same matching as the binding tables. |
| `priority` | integer | `0` | The rule priority; the highest matching priority wins. |
| `preset` | `default`, `weapon`, `big_weapon` | `default` | The base placement of the item on the body. |
| `back` | transform | identity | An extra transform applied while the item is in a back slot. |
| `belt` | transform | identity | An extra transform applied while the item is in a belt slot. |

| Preset | Base back placement |
|---|---|
| `default` | No extra translation, rotation or scale. |
| `weapon` | Translation `[0, 10, 0]`, rotation `[180, 0, 0]` — a weapon carried leaning on the back. |
| `big_weapon` | Translation `[0, 4.8, 0]`, no extra rotation. |

A preset only changes the back placement; belt slots use the default placement for every preset.

A transform has three optional fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `translation` | 3 floats | `[0, 0, 0]` | The offset in 1/16 block units. |
| `rotation` | 3 floats | `[0, 0, 0]` | The rotation in degrees, applied around X, then Y, then Z. |
| `scale` | 3 floats | `[1, 1, 1]` | The scale on each axis. |

The renderer positions the item on the body first and then applies the matched preset and transform, so a resource pack only has to describe the difference from the default placement. The definitions are loaded and reloaded with the client resource pack.
