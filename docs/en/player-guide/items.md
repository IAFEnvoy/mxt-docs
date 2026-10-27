---
title: Built-in Items
description: The framework materials, functional carriers and blocks that MiXianTu registers on its own.
---

# Built-in Items

MiXianTu does not preset numbers for any gameplay system, but it does provide a small set of generic carrier items and components. Data-driven item gameplay usually attaches to existing items through the binding tables or the item-keyed registries instead (see [Item Binding](/en/datapack/json/item_binding)).

## Generic Items

The mod currently ships the spirit stone series, spirit iron ingots, spirit wood, cinnabar, talisman paper, talismans, the contract scroll, the recall talisman, the Beast Taming Bell, tokens, the spirit stone bag, rings, the forging table, furnace parts, pill carriers, alchemy dregs, impurity, the reward box and display stands. The registry names are in `src/main/java/com/iafenvoy/mxt/registry` and the resource files.

## Item Aura

An `item_aura` registry entry gives an item a releasable aura capacity, a consumption speed, a completion behaviour and an optional `result_stack`. During cultivation the whole stack is taken out, and capacity, consumption speed and release speed all scale with the stack count, so the total consumption time does not change. The remaining aura is kept in the `item_aura` component, while the capacity is always computed dynamically from the datapack.

| Item | Default currency value | Framework role |
|---|---|---|
| Lesser Spirit Stone | 1 | The basic aura medium and trading unit |
| Medium Spirit Stone | 10 | A compressed basic spirit stone |
| Greater Spirit Stone | 100 | The default medium for high-tier trades and high-consumption systems |
| Supreme Spirit Stone | 1000 | A rare, high-value medium |
| Cheque | Set by its item component | A signable value carrier for the existing trade system |

::: warning

A spirit stone is only worth anything while it holds aura.

:::

## Blank Carriers and Fixed Materials

These items are ordinary `Item`s as well, with no behaviour of their own; binding tables, item-keyed registries, components, datapacks and KubeJS decide what they do. Blocks and the four spirit stone tiers are not repeated here.

| Category | Items |
| --- | --- |
| Base materials | `mxt:spirit_iron_ingot`, `mxt:spirit_iron_nugget`, `mxt:spirit_wood`, `mxt:spirit_wood_core`, `mxt:cinnabar`, `mxt:alchemy_dregs`, `mxt:impurity` |
| Blank carriers | `mxt:spirit_ring`, `mxt:spirit_stone_bag` |
| Identity and records | `mxt:wooden_token`, `mxt:stone_token`, `mxt:blank_talisman` |
| Fixed props | `mxt:contract_scroll`, `mxt:recall_talisman`, `mxt:beast_taming_bell` |

## Generic Functional Items

The items below are backed by a unified server-side implementation shipped with the mod. Each item only stores a datapack holder or persistent state; it does not copy the rules of the corresponding module, and the actual contract, formation, secret realm and resource values still come from datapacks. How to write their components by hand is on [Data Components](/en/technical/data-components).

| Item | Persistent component | Unified behaviour |
| --- | --- | --- |
| Contract Scroll | `mxt:contract_scroll` | Stores a contract type; using it on a creature validates and signs the contract. |
| Beast Taming Bell | `mxt:contract_bell` | Stores the beast it is tuned to and opens the wheel's "contract beast" page to send it orders. |
| Spirit Beast Bag | `mxt:spirit_beast` | Stores the complete persistent entity data of one contracted creature. Use it on a beast to store it, and right-click a block to release it on top of that block. |
| Formation Plate | `mxt:formation_plate` | Stores which formations may be activated and the selected one; with nothing bound, every formation is allowed. Using it on a block identifies and activates the formation. |
| Secret Realm Token | `mxt:secret_realm_token` | Right-click summons an entrance or a return portal inside a realm; contact performs travel under entry/exit conditions and capacity rules. |
| Reward Box | `mxt:reward_box` | Stores the id of a loot table; right-click rolls that table once and puts what it rolls straight into the inventory. |
| Rift Editor | `mxt:rift` | Shares the planar portal editor with the Rift Anchor; requires operator level 2. See [Rifts](./rift.md). |
| Spirit Vessel | `mxt:resource_capacity` <br> `mxt:resource_container` | Stores any `resource`, with a capacity of its own per resource (a resource the cap map does not name cannot be stored at all). **Hold right-click** to pour it into the holder's account (one unit of each resource a tick); filling it takes a display stand's spirit-power ray, or **firing spirit power with it in the main hand** — that firing is charged into the vessel instead of launching a ray. |
| Technique Book | `mxt:technique` | Stores a `technique` definition; a long hold learns the technique. |
| Jade Slip | `mxt:stored_text` <br> `mxt:jade_slip_reading` | Holds one piece of text; a long hold prints it into the chat log. |
| Wooden / Stone Token | `mxt:token` | Carries `kind`, `value` and `owner` for the secret realm and trade permission systems. **Renaming one in an anvil claims it.** |
| Identification Mirror | `mxt:identification` | Resolves items that carry an identification component in a unified way; the items to identify come from content packs or other mods. |
| Spirit Root | `mxt:spirit_root` | Stores a `spirit_root` definition; right-click to gain that root. |
| Physique | `mxt:physique` | Stores a `physique` definition; right-click to gain that physique. |
| Talisman Brush | `mxt:brush_pigment` | A brush holds a pigment store of its own; click pigment with the brush in the inventory to add pigment (see [Alchemy and the Brush](./alchemy-and-brush.md#brushes-and-pigment)). |
| Talisman | `mxt:talisman` <br> `mxt:spirit_storage` | Holds the inscribed talisman; depending on its kind, a click or a hold uses it. |

## See Also

- The rift editor and the Rift Anchor are documented on the [Rifts](./rift.md) page.
- The commands that manage a single rift are in [Commands](./commands/mxt.md).
