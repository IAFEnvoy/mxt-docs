---
title: Item Bindings and Components
---

# Item Bindings and Components

MiXianTu does not create logical datapack items. Physical items must be registered by Minecraft, a content mod or KubeJS; datapacks only attach MiXianTu gameplay rules to those existing item IDs. This page covers the two roads: the binding tables, and the per-stack data components.

## Item Bindings

| Table | Purpose |
|---|---|
| `item_binding` | Attaches behaviour, conditions, spirit roots or generic display to an existing item. |
| `weapon_binding` | Adds vanilla attribute modifiers (a weapon's own attack damage and speed go here too) plus attack, use and tick behaviour. |
| `pill` | What one pill does: the dose action, its toxicity gain, the overdose threshold and what an overdose leaves behind. |
| `pill_binding` | Claims a family of existing items as one pill, with its use cap and cooldown. |
| `tool_binding` | Claims tool items and lists the forging methods they unlock. |
| `blueprint_binding` | Claims blueprint items and lists the forging blueprints they offer. |
| `technique_binding` | Describes **which items are one technique's manual**, the item the mod generates as its carrier, and the conditions that gate learning. Whether a stack is a manual, and which technique it teaches, follows the stack's own `mxt:technique` data component first and a declaration's `items` second. |

`item_binding`, `weapon_binding`, `tool_binding` and `blueprint_binding` are registries, just like `pill`, `pill_binding` and `technique_binding`: one file per definition, living at `data/<namespace>/mxt/<table>/<entry>.json`, where the entry claims items with `items` (`pill` claims no items — `pill_binding` is what claims them).

`items` on the claiming tables accepts a single item, a vanilla item tag, wildcards, regular expressions and mixed arrays; `carrier_item` is the exception, taking one item ID only. `blocks` on `block_aura` and `heat_source` takes a block ID or a `#`-prefixed block tag, expanded at load time. A `technique_binding` declaration is matched by technique id, and its `items` is the optional route.

**Per-stack additions are data components**: `mxt:quality` (single value — a whole quality object, changing both the tier and the ladder this stack reads), `mxt:element` (a list — unioned with the definition), `mxt:pill` (an optional `pill` naming a pill definition, plus `on_consume` / `toxicity_gain` / `toxicity_threshold` / `on_overdose` / `toxicity_after_overdose` overlaid field by field), `mxt:technique_reading` (field-by-field override of the reading parameters), `mxt:forging_methods` and `mxt:forging_blueprints` (lists — unioned with the definition). They are written for one stack only. `conditions` and a weapon's numbers and actions have **no** component: a per-stack change means adding a definition that claims that item in the matching item-keyed registry, and per-stack weapon numbers go through vanilla `minecraft:attribute_modifiers`. See [Item Binding](../datapack/json/item_binding.md) for the shared matching, condition and quality rules, and [Weapon Binding](../datapack/json/weapon_binding.md), [Pill Binding](../datapack/json/pill_binding.md) and [Technique Binding](../datapack/json/technique_binding.md) for the fields of each binding type.

## Data Component Examples

Component values can be written directly with the item component syntax or from KubeJS, and the referenced datapack registry IDs are parsed by the vanilla registry codec:

```mcfunction
give @s mxt:contract_scroll[mxt:contract_scroll={contract_type:"mxt_test:master_servant"}]
give @s mxt:formation_plate[mxt:formation_plate={formation:"mxt_test:spirit_gathering"}]
give @s mxt:secret_realm_token[mxt:secret_realm_token={realm:"mxt_test:trial_realm"}]
give @s mxt:reward_box[mxt:reward_box="mxt_test:reward_box/spirit_stones"]
give @s mxt:rift_anchor[mxt:rift={recorded:{type:"position",dimension:"minecraft:overworld",pos:[0.5d,65.0d,0.5d]}}]
give @s mxt:spirit_vessel[mxt:resource_capacity={"mxt_test:qi":1000.0},mxt:resource_container={"mxt_test:qi":25.0}]
give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:flame_sigil"}]
give @s mxt:physique[mxt:physique="mxt_test:sword_bone"]
give @s mxt:spirit_root[mxt:spirit_root="mxt_test:fire_root"]
give @s mxt:technique_book[mxt:technique="mxt_test:azure_water_manual"]
```

The last line is how a **manual** is made: a stack teaches a technique only while it carries the `mxt:technique` component, and a technique book with neither that component nor any declaration's `items` claiming it teaches nothing and shows no technique in its tooltip. The binding (`technique_binding`) only decides **which items are the manual and what has to hold before learning**, plus which item `/picker mxt:technique` generates as its carrier (**the creative tab does not generate carriers**); how long a read takes and in what pose is written on the [technique](../datapack/json/technique.md) itself. Writing the item into the binding's `items` also makes a stack a manual with no component at all. See [Technique Binding](../datapack/json/technique_binding.md).

The second and third lines from the bottom are how a **spirit root item** and a **physique item** are made: the component names the definition ID, and right-clicking grants it (a spirit root is refused over "already held / element conflict", a physique over "already held / unmet condition / exclusive-tag conflict"), spending one item on success and **none in creative mode**. See [spirit_root](../datapack/json/spirit_root.md#holding) and [physique](../datapack/json/physique.md#holding).

Note that the values of `mxt:resource_container` and `mxt:resource_capacity` are **bare maps** whose keys are resource IDs, with **no** `values` wrapper; a wrongly wrapped value is silently read as an unreadable key (only a warning is logged) and the map stays empty. A spirit vessel **stores nothing until a capacity is written down**, because a value has no natural maximum.

An inscribed talisman can also carry part of its charge (`mxt:spirit_storage`, shared with spirit stones, counted per aura, absent meaning nothing poured in):

```mcfunction
give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:common_sigil"},mxt:spirit_storage={amounts:{"mxt:common":3}}]
```

A formation plate can also be bound in game: hold the plate and run `/mxt formation bind <formation>` (needs the `gamemaster` permission). A binding is no longer what makes a plate usable — **an unbound plate identifies the formation under your feet by itself** (see [an unbound plate identifies its own formation](../datapack/json/formation.md)) — so the command and the component syntax are now what **restricts** which formation a plate may raise. The component syntax needs the registry ID and the NBT shape up front; the command gets tab completion from the server and refuses an ID that does not exist.

A Contract Scroll, Formation Plate, Secret Realm Token or Reward Box with no binding fails safely and shows a message; a Spirit Beast Bag, Spirit Vessel or token keeps its state in ItemStack data components, where the server is the only authority.
