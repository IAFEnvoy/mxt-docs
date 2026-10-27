---
title: Built-in Items
description: The framework materials, functional carriers and blocks that MiXianTu registers on its own.
---

# Built-in Items

MiXianTu does not preset numbers for any gameplay system, but it does provide a small set of generic carrier items and components. Data-driven item gameplay usually attaches to existing items through the binding tables or the item-keyed registries instead (see [Item Bindings and Components](./item-bindings.md)).

## Generic Materials

| Item | ID | Default currency value | Framework role |
|---|---|---:|---|
| Lesser Spirit Stone | `mxt:spirit_stone` | 1 | The basic aura medium and trading unit. |
| Medium Spirit Stone | `mxt:medium_spirit_stone` | 10 | A compressed basic spirit stone. |
| Greater Spirit Stone | `mxt:high_spirit_stone` | 100 | The default medium for high-tier trades and high-consumption systems. |
| Supreme Spirit Stone | `mxt:supreme_spirit_stone` | 1000 | A rare, high-value medium. |
| Cheque | `mxt:cheque` | Set by its item component | A signable value carrier for the existing trade system. Its tooltip shows its value and, when it is not blank, the name of its issuer (`item.mxt.cheque.issuer`). |

The four spirit stones share the `SpiritStoneItem` base class and implement spirit power charge and drain. Capacity is not defined in code: it is taken from the `aura` the `item_aura` registry gives that item, and after the world is loaded again the first real access truncates old values above the new maximum. A spirit stone without the `mxt:spirit_storage` component is treated as fully charged, while an empty `amounts` map — or one that does not list that aura — means empty. The stash the stone holds is written under the aura key (`{amounts:{"mxt:common":100}}`), so a datapack changing the definition's `type` afterwards never rewrites a stone already in the world. The Display Stand tries to charge the spirit stone it displays when it receives spirit power, and when cultivation fuel runs out the same stone is drained and returned.

The bundled `currency` datapack only defines a 10:1 two-way exchange and the values above. Content packs can overwrite these values directly, or reference any of the four spirit stones from an `item_binding`, formation, artifact, cultivation or trade definition. The mod also registers Copper Coin, Iron Coin, Gold Coin, Diamond Coin, Emerald Coin and Netherite Coin (`mxt:copper_coin`, `mxt:iron_coin`, `mxt:gold_coin`, `mxt:diamond_coin`, `mxt:emerald_coin`, `mxt:netherite_coin`), which have no item behaviour of their own: their values and exchanges come from the same `currency` registry and its bundled entries.

The remaining materials carry no behaviour of their own; their use is decided by binding tables, item-keyed registries, components, datapacks and KubeJS.

| Material | ID |
|---|---|
| Spirit Iron Ingot | `mxt:spirit_iron_ingot` |
| Spirit Iron Nugget | `mxt:spirit_iron_nugget` |
| Spirit Wood | `mxt:spirit_wood` |
| Spirit Wood Core | `mxt:spirit_wood_core` |
| Cinnabar | `mxt:cinnabar` |
| Alchemy Dregs | `mxt:alchemy_dregs` |
| Impurity | `mxt:impurity` |

Blank carriers, identity items and fixed props are ordinary items as well. Blocks and the four spirit stones are not repeated here.

| Category | Item | ID |
|---|---|---|
| Blank carrier | Spirit Ring | `mxt:spirit_ring` |
| Blank carrier | Spirit Stone Bag | `mxt:spirit_stone_bag` |
| Identity and record | Blank Talisman | `mxt:blank_talisman` |
| Fixed prop | Recall Talisman | `mxt:recall_talisman` |

## Generic Functional Items

The items below are backed by a unified server-side implementation shipped with the mod. Each item only stores a datapack holder or persistent state; it does not copy the rules of the corresponding module, and the actual contract, formation, secret realm and resource values still come from datapacks. How to write these components by hand is on [Item Bindings and Components](./item-bindings.md#data-component-examples).

| Item | ID | Persistent component | Unified behaviour |
|---|---|---|---|
| Contract Scroll | `mxt:contract_scroll` | `mxt:contract_scroll` | Stores a `contract_type`. Using it on a creature lets `ContractService` validate and sign the contract. |
| Beast Taming Bell | `mxt:beast_taming_bell` | `mxt:contract_bell` | Stores the beast it is tuned to (UUID, display name and the orders that beast takes). Right-click a spirit beast to tune it, right-click with nothing in front to open the wheel on the "contract beast" page, then pick a cell to order follow / wander / stay / recall. |
| Spirit Beast Bag | `mxt:spirit_beast_bag` | `mxt:spirit_beast` | Stores the complete persistent entity data of one contracted creature (its contract and profile attachments included), plus its type, its name at the time, the contract type and the owner - which is what lets the tooltip say what is inside without loading it. Use it on a spirit beast to store it, and right-click a block to release it on top of that block. |
| Formation Plate | `mxt:formation_plate` | `mxt:formation_plate` | Stores `allowed` (which formations may be run, `#tags` included) and the selected `formation`. Using it on a block calls `FormationWorldService`; a plate with no bound formation identifies the structure built in front of it. |
| Secret Realm Token | `mxt:secret_realm_token` | `mxt:secret_realm_token` | Right-click summons an entrance or a return portal inside a realm. Contact performs travel under entry/exit conditions and capacity rules. |
| Reward Box | `mxt:reward_box` | `mxt:reward_box` | Stores the id of a loot table; right-click rolls that table once and puts what it rolls straight into the inventory. The roll happens where the player stands, with the player as its context and luck included, so conditions reading either work as they do for any other gift. One box is one roll, and **creative mode keeps the box**. A box with no table bound, or one naming a table the loaded packs do not provide, refuses with a message instead of eating the box. |
| Rift Editor | `mxt:rift` | `mxt:rift` | Shares the planar portal editor with the Rift Anchor; requires operator level 2. See [Rifts](./rift.md). |
| Spirit Vessel | `mxt:spirit_vessel` | `mxt:resource_capacity`, `mxt:resource_container` | Stores any `resource`, with a capacity of its own per resource (a resource the cap map does not name cannot be stored at all). **Hold right-click** to pour it into the holder's account, one unit of each resource a tick; there is **no mode** and no storing click. Filling it takes a display stand's spirit-power ray, or **firing spirit power with it in the main hand** — that firing is charged into the vessel instead of launching a ray. |
| Technique Book | `mxt:technique_book` | `mxt:technique` | Stores a `technique` definition; **its tooltip prints the technique's name and, when the pack translated one, its description**, and **right-click reads the book into the chat log** — first the pages written on the book (`minecraft:writable_book_content`), then the same name and description. A technique with its own `learn_time` still only teaches at the end of the hold, and the blank book in the creative tab carries no component and says it names no technique. |
| Jade Slip | `mxt:jade_slip` | `mxt:stored_text`, `mxt:jade_slip_reading` | Holds one piece of text (a component, so a bare string may be a translation key). **The text only lands in the chat log once the hold has run out** — 40 ticks (two seconds) unless the stack's `mxt:jade_slip_reading` says otherwise, and `0` or a sneaking right-click reads it on the click. The arm takes the reading pose while it runs; a slip with nothing written reads as a one-line notice. |
| Wooden Token / Stone Token | `mxt:wooden_token`, `mxt:stone_token` | `mxt:token` | Carry `kind`, `value` and `owner` together for the secret realm and trade permission systems. **Renaming one in an anvil claims it**: `owner` becomes the UUID of the player who renamed it, overwriting whoever it named before, and `owner` never reaches the tooltip (which prints `kind` and `value` only). |
| Identification Mirror | `mxt:identification_mirror` | consumes `mxt:identification` | Resolves items that carry an identification component in a unified way; the items to identify come from content packs or other mods. |
| Spirit Root | `mxt:spirit_root` | `mxt:spirit_root` | Stores a `spirit_root` definition; right-click to gain that root ("already held" and element conflicts are refused as usual, see [spirit_root](/en/datapack/json/spirit_root#holding)), spending one item on success and **none in creative mode**. |
| Physique | `mxt:physique` | `mxt:physique` | Stores a `physique` definition; right-click to gain that physique ("already held", an unmet `holder_condition` and exclusive-tag conflicts are refused as usual, see [physique](/en/datapack/json/physique#holding)), spending one item on success and **none in creative mode**. |
| Talisman Brush | `mxt:talisman_brush` | `mxt:brush_pigment` | A brush holds a pigment store of its own, refilled with the same click the vanilla bundle uses (point at pigment with the brush on the cursor). Pigment is whatever sits in the `#mxt:brush_pigment` item tag, which in the base pack is cinnabar `mxt:cinnabar` alone; what one portion is worth comes from the server config (see [Alchemy and the Brush](./alchemy-and-brush.md#brushes-and-pigment)). |
| Talisman | `mxt:talisman` | `mxt:talisman`, `mxt:spirit_storage` | Holds the one `talisman` definition inscribed on it, plus a `mode` (`fire` by default, or `store`); inscribing another replaces it. Holding right-click pours spirit power in (capacity = one invocation's aura entries times the inscriptions' `capacity` multiplier, itself capped by what the carrier has left, counted per aura); a full carrier fires everything inscribed on it, and once the store covers one invocation's aura entries a plain right-click fires it too — declare a `durability` / `consume` and a larger multiplier to fire several times from a single pour. A sneak-use switches the mode. An inscribed definition may declare a durability (`durability` / `consume`): the cap is written into the vanilla components (`max_damage` plus `max_stack_size: 1` and `damage: 0`), so the item shows a durability bar, and firing spends wear instead of whole carriers until the carrier breaks. |

The values of both `mxt:resource_container` and `mxt:resource_capacity` are bare maps whose keys are resource IDs; there is no `values` wrapper, and a wrongly wrapped value is silently read as one unreadable key — the map stays empty and only a warning is logged. A spirit vessel with no capacity written down stores nothing at all: a value has no natural maximum, so the number has to come from `mxt:resource_capacity`.

When a Contract Scroll, Formation Plate, Secret Realm Token or Reward Box has no binding definition, it fails safely and shows a message. The state of Spirit Beast Bags, Spirit Vessels and tokens is kept in ItemStack data components, and the server is the only authority.

A Technique Book's pages use vanilla's writable-book page component, `minecraft:writable_book_content`. Its `pages` is a list of **plain strings** and cannot hold a `translate` component, so the body text a page prints exists in exactly the **one language the pack wrote it in**; `custom_name` is unaffected and still follows the language setting. The mod only reads the pages back out and prints them into the chat log verbatim, never translating them. **Lifting this limit takes a change in the mod itself** — no datapack can work around it.

A Jade Slip does not go through that component: it stores one text component (`mxt:stored_text`) and a bare string there is a translation key, so a slip's body does follow the language.

## Blocks and Workstations

| Block | ID | Function |
|---|---|---|
| Spirit Crafting Table | `mxt:spirit_crafting_table` | Reuses the vanilla crafting layout but only accepts `spirit_shaped` and `spirit_shapeless` recipes. Input items stay in the menu; aura is only accepted when a matching recipe exists, and it is deducted when the result is taken out. |
| Forge Table | `mxt:forging_table` | The forging station: several materials are hammered into a result following a blueprint, and the quality of the result depends on the process and the number of steps. |
| Exchange Station | `mxt:exchange_station` | A stonecutter-style menu that offers the entries listed in that currency item's `exchanges` array, each costing a number of the input item. |
| Trade Station | `mxt:trade_station` | A station owned by the player who placed it, which players trade with directly. |
| System Trade Station | `mxt:system_station` | The system-owned variant of the trade station: unbreakable and it drops nothing. |
| Cheque Table | `mxt:cheque_table` | Converts configured currency items to and from cheques. |
| Oak / Birch / Spruce / Jungle / Acacia / Dark Oak Display Stand | `mxt:oak_display_stand`, `mxt:birch_display_stand`, `mxt:spruce_display_stand`, `mxt:jungle_display_stand`, `mxt:acacia_display_stand`, `mxt:dark_oak_display_stand` | Holds a single item and drops it above the centre of the block when it is taken out. If the item implements the aura access interface, Jade shows the item and its spirit power percentage. |
| Spirit Stone Ore | `mxt:spirit_stone_ore` | The mod's spirit stone ore block; it drops experience when mined. Aura contributions are defined by datapacks. |
| Spirit Stone Block | `mxt:spirit_stone_block` | The storage block; the bundled `block_aura` entry makes it an aura source. |

## Item Aura

An `item_aura` registry entry gives an existing item a releasable aura capacity, a consumption speed, a completion behaviour and an optional `result_stack`.

During cultivation the whole matching stack is taken out of the inventory, and capacity, consumption speed and release speed all scale with the stack count, so the total consumption time does not change. The remaining aura is kept in the item's `mxt:item_aura` component, while the capacity is always computed dynamically from the datapack.

See [Item Aura](../datapack/json/item_aura.md) for the full runtime behaviour and the field list.

## See Also

- The rift editor and the Rift Anchor are documented on the [Rifts](./rift.md) page.
- The commands that manage a single rift are in [Commands](./commands/mxt.md).
