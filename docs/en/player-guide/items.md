---
title: Items and Blocks
description: The framework materials, functional carriers, workstations and binding tables that MiXianTu registers on its own.
---

# Items and Blocks

MiXianTu does not preset numbers for any gameplay system, but it does provide a small set of generic carrier items and components. Data-driven item gameplay usually matches existing items through the binding tables instead.

## Generic Materials

| Item | ID | Default currency value | Framework role |
|---|---|---:|---|
| Lesser Spirit Stone | `mxt:spirit_stone` | 1 | The basic aura medium and trading unit. |
| Medium Spirit Stone | `mxt:medium_spirit_stone` | 10 | A compressed basic spirit stone. |
| Greater Spirit Stone | `mxt:high_spirit_stone` | 100 | The default medium for high-tier trades and high-consumption systems. |
| Supreme Spirit Stone | `mxt:supreme_spirit_stone` | 1000 | A rare, high-value medium. |
| Cheque | `mxt:cheque` | Set by its item component | A signable value carrier for the existing trade system. Its tooltip shows its value and, when it is not blank, the name of its issuer (`item.mxt.cheque.issuer`). |

The four spirit stones share the `SpiritStoneItem` base class and implement spirit power charge and drain. Capacity is not defined in code: it is taken from the `aura` of the matching `item_aura` entry, and after the data tables are loaded again the first real access truncates old values above the new maximum. A spirit stone without the `mxt:spirit_storage` component is treated as fully charged, while an empty `amounts` map — or one that does not list that aura — means empty. The Display Stand tries to charge the spirit stone it displays when it receives spirit power, and when cultivation fuel runs out the same stone is drained and returned.

The bundled `currency` datapack only defines a 10:1 two-way exchange and the values above. Content packs can overwrite these entries directly, or reference any of the four spirit stones from an `item_binding`, formation, artifact, cultivation or trade definition. The mod also registers Copper Coin, Iron Coin, Gold Coin, Diamond Coin, Emerald Coin and Netherite Coin (`mxt:copper_coin`, `mxt:iron_coin`, `mxt:gold_coin`, `mxt:diamond_coin`, `mxt:emerald_coin`, `mxt:netherite_coin`), which have no item behaviour of their own: their values and exchanges come from the same `currency` registry and its bundled entries.

The remaining materials carry no behaviour of their own; their use is decided by binding tables, components, datapacks and KubeJS.

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
| Identity and record | Spirit Root | `mxt:spirit_root` |
| Identity and record | Cultivation Jade Slip | `mxt:cultivation_jade_slip` |
| Identity and record | Blank Talisman | `mxt:blank_talisman` |
| Fixed prop | Recall Talisman | `mxt:recall_talisman` |
| Fixed prop | Secret Realm Reward Box | `mxt:secret_realm_reward_box` |

## Generic Functional Items

The items below are backed by a unified server-side implementation shipped with the mod. Each item only stores a datapack holder or persistent state; it does not copy the rules of the corresponding module, and the actual contract, formation, secret realm and resource values still come from datapacks.

| Item | ID | Persistent component | Unified behaviour |
|---|---|---|---|
| Contract Scroll | `mxt:contract_scroll` | `mxt:contract_scroll` | Stores a `contract_type`. Using it on a creature lets `ContractService` validate and sign the contract. |
| Beast Taming Bell | `mxt:beast_taming_bell` | `mxt:contract_bell` | Stores the beast it is tuned to (UUID, display name and the orders that beast takes). Right-click a spirit beast to tune it, right-click with nothing in front to open the wheel on the "contract beast" page, then pick a cell to order follow / wander / stay / recall. |
| Spirit Beast Bag | `mxt:spirit_beast_bag` | `mxt:spirit_beast` | Stores the complete persistent entity data of one contracted creature (its contract and profile attachments included), plus its type, its name at the time, the contract type and the owner - which is what lets the tooltip say what is inside without loading it. Use it on a spirit beast to store it, and right-click a block to release it on top of that block. |
| Formation Plate | `mxt:formation_plate` | `mxt:formation_plate` | Stores `allowed` (which formations may be run, `#tags` included) and the selected `formation`. Using it on a block calls `FormationWorldService`; a plate with no bound formation identifies the structure built in front of it. |
| Secret Realm Token | `mxt:secret_realm_token` | `mxt:secret_realm_token` | Stores a `secret_realm` definition. Right-click to enter the bound secret realm — the definition's own entry condition, instance cap and member cap all apply — and right-click inside the secret realm to return to the origin position, subject to its exit condition. |
| Rift (block item) | `mxt:rift` | `mxt:rift` | Places rift blocks; a stack carrying the component places a rift with that destination and colour. The whole mechanic is on the [Rifts](./rift.md) page. |
| Spirit Vessel | `mxt:spirit_vessel` | `mxt:resource_container` | Stores any `resource`. Right-click releases it to the holder, sneak-right-click stores from the holder; each resource has a capacity of 1000. |
| Wooden Token / Stone Token | `mxt:wooden_token`, `mxt:stone_token` | `mxt:token` | Carry `kind`, `value` and `owner` together for the secret realm and trade permission systems. |
| Identification Mirror | `mxt:identification_mirror` | consumes `mxt:identification` | Resolves items that carry an identification component in a unified way; the items to identify come from content packs or other mods. |
| Talisman Brush / Talisman Ink | `mxt:talisman_brush`, `mxt:talisman_ink` | none | Generic base inputs for talisman crafting and formation content, used together with Blank Talisman; the recipes come from datapacks or KubeJS. |
| Talisman | `mxt:talisman` | `mxt:talisman`, `mxt:spirit_storage` | Holds the `talisman` definitions inscribed on it, in order, plus a `mode` (`fire` by default, or `store`). Holding right-click pours spirit power in (capacity = one invocation's aura entries times the inscriptions' `capacity` multiplier, itself capped by what the carrier has left, counted per aura); a full carrier fires everything inscribed on it, and once the store covers one invocation's aura entries a plain right-click fires it too — declare a `durability` / `consume` and a larger multiplier to fire several times from a single pour. A sneak-use switches the mode. An inscribed definition may declare a durability (`durability` / `consume`): the cap is written into the vanilla components (`max_damage` plus `max_stack_size: 1` and `damage: 0`), so the item shows a durability bar, and firing spends wear instead of whole carriers until the carrier breaks. |

The value of `mxt:resource_container` is a bare map whose keys are resource IDs; there is no `values` wrapper, and a wrongly wrapped value is silently read as one unreadable key — the container stays empty and only a warning is logged.

When a Contract Scroll, Formation Plate or Secret Realm Token has no binding definition, it fails safely and shows a message. The state of Spirit Beast Bags, Spirit Vessels and tokens is kept in ItemStack data components, and the server is the only authority.

## See Also

- The rift block and the Rift Anchor are documented on the [Rifts](./rift.md) page.
- The commands that manage a single rift are in [Commands](./commands/mxt.md).

## Data Component Examples

Component values can be written directly with the item component syntax or from KubeJS, and the referenced datapack registry IDs are parsed by the vanilla registry codec:

```mcfunction
give @s mxt:contract_scroll[mxt:contract_scroll={contract_type:"mxt_test:master_servant"}]
give @s mxt:formation_plate[mxt:formation_plate={formation:"mxt_test:spirit_gathering"}]
give @s mxt:secret_realm_token[mxt:secret_realm_token={realm:"mxt_test:trial_realm"}]
give @s mxt:rift[mxt:rift={target:"minecraft:the_nether",color:16729156}]
give @s mxt:spirit_vessel[mxt:resource_container={"mxt_test:qi":25.0}]
give @s mxt:talisman[mxt:talisman={talismans:["mxt_test:flame_sigil"]}]
give @s mxt:cultivation_jade_slip[mxt:technique="mxt_test:azure_water_manual"]
```

The last line is how a **manual** is made: a stack teaches a technique only while it carries the `mxt:technique` component, and a jade slip with neither that component nor any declaration's `items` claiming it teaches nothing and shows no technique in its tooltip. The declaration (`technique_binding`) only decides how the technique is **read** and which item `/picker mxt:technique` generates as its carrier (**the creative tab does not generate carriers**); writing the item into the declaration's `items` also makes a stack a manual with no component at all. See [Technique Binding](../datapack/json/technique_binding.md).

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

## Alchemy and Spirit Herbs

A furnace is not one block: it is a fixed 3x3x3 you build by hand. The core carries the furnace spec, the two input stores split main ingredients from auxiliary ingredients and the catalyst, the output store only hands results out, and the other 22 cells are casing.

| Block | ID | Function |
|---|---|---|
| Alchemy Furnace Core | `mxt:alchemy_furnace` | The cell on the front face at the middle layer. The exotic fire goes here, and the heat readout plus the Set / Start / Abort controls sit on the page this cell opens. |
| Main Ingredient Input | `mxt:alchemy_main_input` | On your left when you face the front. Two main-ingredient slots. |
| Auxiliary Ingredient Input | `mxt:alchemy_auxiliary_input` | On your right when you face the front. Two auxiliary slots plus one catalyst slot. |
| Alchemy Output | `mxt:alchemy_output` | Top centre. Four take-only output slots. |
| Alchemy Furnace Casing | `mxt:alchemy_furnace_casing` | The other 22 cells, each carrying its own wall material. Casing opens no screen. |
| Spirit Herb Plot | `mxt:spirit_herb_plot` | One plant per plot: right-click with seeds to plant, right-click a mature plant to harvest, sneak with an empty hand to take the seeds back. |
| Pill | `mxt:pill` | The pill carrier: vanilla eating, a name and a tooltip. What a pill does, how many times it can be taken and how much toxicity it adds all come from its pill binding. |

The hand feel is: **exotic fire in the core, main ingredients in the left store, auxiliary ingredients and the catalyst in the right store, and the result taken from the output store.** Loading materials never starts a batch by itself; a player presses Start on the core's page. The centre cell must stay empty, and a shell with a missing cell, an invalid wall material or a cell claimed by another furnace does not form and cannot run.

**There is no built-in heat source.** The item that heats a furnace has to come from a mod; a data pack cannot create one. The temperature ceiling is the lower of the coldest wall material in the whole furnace and the heat source's own ceiling.

Neither the input stores nor the core's fire slot accept hoppers; the output store can only be pulled from its bottom face, and once the furnace is formed that face looks onto the centre air cell, so no hopper fits there. Removing casing or a store while a batch is running settles that batch as a failure once and does not return the materials already loaded; removing a store only drops that store's own contents.

Eating a pill accumulates toxicity: what a pill does, where the threshold sits and what is left after an overdose are on [pill_binding](../datapack/json/pill_binding.md), and the mod only keeps the ledger. Toxicity does not fade on its own by default; with **Server Config → Alchemy → Natural toxicity decay per second** set to a positive number, an active entity that already has toxicity loses some once every 20 ticks, nothing happens offline, and an entity that has never taken a pill does not gain an empty ledger.

## Item Bindings

MiXianTu does not create logical datapack items. Physical items must be registered by Minecraft, a content mod or KubeJS; datapacks only attach MiXianTu gameplay rules to those existing item IDs.

| Registry | Purpose |
|---|---|
| `item_binding` | Attaches behaviour, conditions, spirit roots or generic display to an existing item. |
| `weapon_binding` | Adds vanilla attribute modifiers (a weapon's own attack damage and speed go here too) plus attack, use and tick behaviour. |
| `pill_binding` | Configures pill consumption and behaviour. |
| `tool_binding` | Claims tool items and lists the forging methods they unlock. |
| `blueprint_binding` | Claims blueprint items and lists the forging blueprints they offer. |
| `technique_binding` | Describes how one technique is **read** — the hold length, pose, sound, quality group and conditions, plus the item the mod generates as its carrier. Whether a stack is a manual, and which technique it teaches, follows the stack's own `mxt:technique` data component first and a declaration's `items` second. |

Item matching accepts a single item, a vanilla item tag, wildcards, regular expressions and mixed arrays. `carrier_item` is the exception: it takes one item ID only. A `technique_binding` declaration is matched by technique id, and its `items` is the optional route.

**Per-stack additions are data components**: `mxt:quality` (single value — a whole quality object, changing both the tier and the ladder this stack reads), `mxt:element` (a list — unioned with the definition), `mxt:pill` (field-by-field override of a pill definition), `mxt:technique_reading` (field-by-field override of the reading parameters), `mxt:forging_methods` and `mxt:forging_blueprints` (lists — unioned with the definition). They are written for one stack only. `conditions` and a weapon's numbers and actions have **no** component: a per-stack change means writing a definition that names that stack through `items`, and per-stack weapon numbers go through vanilla `minecraft:attribute_modifiers`. See [Item Binding](../datapack/json/item_binding.md) for the shared matching, condition and quality rules, and [Weapon Binding](../datapack/json/weapon_binding.md), [Pill Binding](../datapack/json/pill_binding.md) and [Technique Binding](../datapack/json/technique_binding.md) for the fields of each binding type.

## Item Aura

An `item_aura` definition gives an existing item a releasable aura capacity, a consumption speed, a completion behaviour and an optional `result_stack`.

During cultivation the whole matching stack is taken out of the inventory, and capacity, consumption speed and release speed all scale with the stack count, so the total consumption time does not change. The remaining aura is kept in the item's `mxt:item_aura` component, while the capacity is always computed dynamically from the datapack definition.

See [Item Aura](../datapack/json/item_aura.md) for the full runtime behaviour and the field list.
