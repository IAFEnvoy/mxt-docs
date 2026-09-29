---
title: Shared Data Types
description: "Complex values shared by many registries: Cost, AuraGain, AttributeEntry, icon references, holders and tags, and ItemMatcher."
---

# Shared Data Types

These values belong to no single registry; many fields take them. Check the shape here before you write a field.

## Basic Types

| Type | JSON Shape | Description |
| --- | --- | --- |
| `String` | `"fire"` | A plain string. |
| `Boolean` | `true` | A boolean. |
| `Integer` | `20` | An integer; the field table states the range. |
| `Long` | `100000` | A long integer; the field table states the range. |
| `Double` | `1.5` | A double; `NaN` and infinity are rejected at load. |
| `Identifier` | `"example:fire"` | A namespaced resource ID. |
| Registry Entry Reference | `"example:resource"` | Points at one registry entry; write the entry's own id. |
| Tag Reference | `"#example:fire"` | A vanilla tag; the `#` is required. |
| Entry or Tag | A string or an array of strings | One id, one `#tag`, or both mixed in one array. |
| `ItemMatcher` | An ID, a tag or a mixed array | The `items` field of the item binding tables; it matches existing items and never creates one. |
| `Text Component` | A string or a text object | Accepts translation key strings and vanilla text components. |
| `RGBColor` | `"#RRGGBB"` | A colour, written the vanilla way: `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too). **The value is RGB with no alpha**, so a written colour is always opaque — a field that needs transparency declares a key of its own (the bolt's `alpha` is glow strength, not colour transparency). |
| `ItemStackTemplate` | `{"id":"minecraft:stone"}` or `"minecraft:stone"` | An item stack template: write either a bare item ID or an object (`id` is required, `count` and `components` are optional). Datapack registries are parsed **before item components are bound**, so every item stack inside a datapack definition uses this. |
| `ItemStack` | `{"id":"minecraft:amethyst_shard"}` | A vanilla item stack, **always written as an object** (`id` is required, `count` and `components` are optional); a bare item ID string is not accepted. It requires item components to be bound, so it is only used for attachments and save state — use `ItemStackTemplate` in datapack definitions. |
| `NumberProvider` | A number, a string or an object | A constant, an exp4j expression or a built-in number provider; see [Number Provider Types](./number_provider_types). |
| `EntityAction` | An object or an array of objects | Runs an action on an entity; an array runs in order. |
| `BiEntityAction` | An object or an array of objects | Runs an action on a source entity and a target entity. |
| `BlockAction` | An object or an array of objects | Runs an action on a block position. |
| `ItemAction` | An object or an array of objects | Runs an action on an item stack. |
| `EntityCondition` | An object or an array of objects | An array means every condition has to pass. |
| `Weighted` | `{"value": …, "weight": 3}` | One entry of a weighted list; the whole mod has only this one shape: `value` is required, `weight` is optional (default `1`). An entry whose weight is `≤0` counts as `0` (it is never picked). When every weight in a table is `0`, behaviour splits by use: `mxt:choice`'s `actions` picks one entry **uniformly** and a table written wrong still runs; `mxt:weighted_list`'s `distribution` picks nothing and evaluates to `0` after one warning (a weight sum that overflows the integer range does the same). Used by `mxt:choice`'s `actions` and `mxt:weighted_list`'s `distribution`. `secret_realm`'s `entry` array is the one exception: there the `weight` sits directly on the landing object (which also carries `pos`, a random radius and so on), and **a negative weight is rejected at load** rather than counted as `0`; `0` still means the entry is never picked. |

## `Cost`

Every field that **consumes** something takes the same array, and each entry is one of the five shapes below, dispatched on `type`:

| Shape | Fields | Description |
| --- | --- | --- |
| `{"id": "example:qi", "amount": 5}` | `id`, `amount` | The shorthand, equivalent to `mxt:resource`; the definition id goes in `id`. |
| `{"type": "mxt:resource", ...}` | `resource`, `amount` | Spends a value; the value definition id goes in `resource`. |
| `{"type": "mxt:aura", ...}` | `aura`, `amount` | Spends an aura; the aura id goes in `aura`. What is charged depends on the channel: the payer pays **the value that aura is measured in**, while a shared aura pool or a block's own store pays that aura itself. |
| `{"type": "mxt:item", ...}` | `items`, `amount` | Spends items; `items` is an item/tag matcher list (an item id, a `#tag`, or a typed matcher entry, see [`ItemMatcher`](#itemmatcher) below). |
| `{"type": "mxt:js", ...}` | `id`, `params` | Hands the cost to a server script; `id` is the callback id registered with `MxtCosts.register`, and `params` may be omitted. |

`amount` is always a number provider and has to evaluate to a **finite positive number** at use time, or that entry cannot be paid. `mxt:resource` and `mxt:aura` ask two different questions: the first names a **value**, the second names an **aura identity**.

```json
"costs": [
  {"id": "example:qi", "amount": 5},
  {"type": "mxt:resource", "resource": "example:stamina", "amount": "5 + level"},
  {"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2},
  {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}
]
```

Rules:

- **A whole array is all or nothing**: if any one entry cannot be paid, nothing is taken — not even the entries that could have been paid.
- **Two entries in the same array that point at the same store are a load error** (the same value id written twice, or the same aura written twice). Two entries that merely reach the same value by different routes are **not** an error: a `mxt:resource` entry and a `mxt:aura` entry measured in that value have their amounts **added**, because that is the only answer that does not depend on the order they were written in.
- The payer is a **living entity** (a player, a mob and a summoned creature all count), not necessarily a player. Whether an entry can be paid depends on which channels the place offers:

| Shape | Where it is taken from |
| --- | --- |
| `mxt:resource` | The payer's own value account. |
| `mxt:aura` | The value that aura is measured in: out of the payer's own value account when the payer pays; when the ground pays from a **shared aura pool** (`cultivation.aura_costs`), the amount is first scaled by the pool's allocation for several players cultivating in the same chunk and then charged from the pool all or nothing; when a **block entity's own store** pays (a spirit crafting recipe's `aura`), that aura itself is taken in whole units, rounded up. |
| `mxt:item` | Needs a player's inventory. A payer that is not a player (or a formation with no owner) simply **cannot pay** — that is not a broken definition. |
| `mxt:js` | Needs a player, and runs **last**, after every other channel has finished paying. A script cost is not staged, so the script itself has to stay idempotent about it. |

A missing channel is only ever reported as "cannot pay", never as a broken definition. **An entry that cannot be decoded fails the load of the whole definition** (an unknown `type` and a missing required field both do): the `costs` array does not use the lenient list rule, so there is no "log a warning and drop this entry".

**12** fields take this array: `ability.costs` (**shared by every ability type**, which is why the per-tick fuel of `mxt:mount` and the per-period cost of `mxt:upkeep` are written here too), the `upkeep_costs` of `mxt:channelled`, `realm_stage.costs`, `cultivation.costs` and `cultivation.aura_costs`, `formation.activation_costs` and `formation.maintenance_costs`, `forging_method.costs`, `contract_type.costs` (the price of signing a contract, paid by the owner), `talisman.costs` (an `mxt:aura` entry comes out of the carrier's own store, every other entry is charged to the holder), `quality.upgrade_costs`, and the `aura` of a spirit crafting recipe (`mxt:spirit_shaped` / `mxt:spirit_shapeless`). `cultivation.aura_costs` and a spirit crafting recipe's `aura` accept **only `mxt:aura` entries** (any other type is a load error), and both fields also accept the `{"<aura id>": NumberProvider}` map form.

**These deliberately are not `Cost`, so do not "fix" them**: `talisman.capacity` is a **multiplier** (a double `≥ 1`) saying how many invocations' worth of aura the carrier holds, rather than what is taken — the aura side of that capacity comes from the aura entries in the same talisman's `costs`; `alchemy`'s `minimum_aura` and `creature_profile.minimum_aura` are requirements that are never consumed. The currency system has nothing to do with this shape: `currency`'s `exchanges[].cost` is an integer price (`1..99`) saying how many currency items one exchange takes, and `quality.value_multiplier` is a value modifier; neither is a `Cost`.

## `AuraGain`

`cultivation.aura_gains` uses `AuraGain`: the field names are the same, `id` and `amount`, but `id` points at an aura and `amount` allows `0` (finite and non-negative is enough). It is a different type, unrelated to `Cost`, and it never enters the cost transaction.

This list is **lenient**: an entry that cannot be decoded is dropped with an `Ignoring invalid list element` warning, and the remaining entries still apply.

To add to any value, use the **`mxt:add_resource` action** rather than this array; it takes `resource` and `amount`, and `amount` may be negative:

```json
{"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
```

## `AttributeEntry`

An attribute modifier entry. Attribute IDs are vanilla ones such as `minecraft:attack_damage`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `attribute` | Identifier | **required** | The vanilla attribute ID to modify. |
| `id` | Identifier | **required** | Unique ID of this attribute modifier. |
| `amount` | Double | **required** | Base value used when there is no dynamic `value`. |
| `operation` | Enum | **required** | `add_value`, `add_multiplied_base` or `add_multiplied_total`. |
| `value` | Number Provider | none | When written, it is recomputed every tick on the server with the entity context and replaces `amount`. |

## Icon Reference

Every icon field in the mod takes the same value, written **inline**: a texture is a string and an item is an object. The definitions that carry this field are `ability`, `resource`, `forging_method` and `technique`.

| Form | Type | Description |
| --- | --- | --- |
| String | Identifier | A 16x16 GUI texture, for example `example:textures/gui/icon/sword.png`. |
| Object | `ItemStackTemplate` | An item: write the full item stack template `{"id": ...}`, optionally with `count` and `components`. |

The two forms are told apart by **parse order**: the texture is tried first, then the item. Because both accept a **string**, a bare string is taken by the texture branch, so **an item always has to be written as an object** `{"id": ...}` — a bare string only ever gives you a texture of that path, not an item.

```json
"icon": "example:textures/gui/icon/sword.png"
```

```json
"icon": { "id": "minecraft:iron_ingot" }
```

```json
"icon": { "id": "minecraft:diamond_sword", "count": 1, "components": { "minecraft:custom_name": "Azure Sky" } }
```

An item icon stores a **template** rather than a ready-made stack, because datapack registries are parsed before item components are bound; the client materialises it when it draws, so an icon that needs components still shows correctly.

### SpriteIcon

**A resource bar's artwork is a different icon** (`SpriteIcon`): `mxt:boss_bar`'s `sprite_location` and `mxt:textured_bar`'s `background_sprite` / `fill_sprite` take it, because a whole resource bar cannot be drawn out of a single 16x16. It is **not** the icon reference above (`ability.icon` / `resource.icon` is one 16x16 texture or one item, drawn in a single cell, with no `region` / `width` / `height` and no `{"sprite": ...}`), and it cannot be written as an item either. The two names look alike but mean different things, so do not mix them up. Two forms:

| Form | Type | Description |
| --- | --- | --- |
| String | Identifier | Keeps the field's original meaning: `sprite_location` is a **texture path** (default `mxt:textures/gui/resource_bar.png`, a 25-cell sheet) and `background_sprite` / `fill_sprite` are **GUI atlas sprites**. |
| Object | A texture or a sprite | `{"sprite": ...}` is a GUI atlas sprite; `{"texture": ...}` is a texture and may carry a `region` (`u` / `v` / `texture_width` / `texture_height`, defaulting to origin `0,0` and a whole `256×256` image). Both may carry `width` / `height`, the **target** size it is drawn at, which has to be written as a pair (omitted means the bar's own width and height). |

`mxt:boss_bar`'s `sprite_location` accepts **textures only** (it cuts the sheet into a background, a fill and an icon cell, and a sprite has no concept of that), while both fields of `mxt:textured_bar` accept either form. A sprite cannot declare a `region` — the atlas already knows where it is. `width` / `height` is the **target size it is drawn at**, not a crop, and only the background side reads it: `background_sprite` and `mxt:boss_bar`'s sheet texture may carry it, while **a size written on `fill_sprite` is never read** — the fill is cut by the bar's own progress, so a fixed size has no meaning there; those two keys are only decoded and take no part in drawing.

These are **load-time errors** and are refused outright: a sprite in `mxt:boss_bar`'s `sprite_location`, a `region` on a sprite, and a `width` / `height` written without its partner.

## Holders, Tags and Matchers

Fields that cross registries are all resolved into entry references during datapack load; the registry is not queried again at runtime.

### Single Values and Tags

```json
{
  "aura": "example:qi",
  "ability_requirements": "#example:fire_abilities"
}
```

### Mixed Arrays

A field that accepts both IDs and tags can be written as an array directly:

```json
{
  "ability_requirements": [
    "example:fireball",
    "#example:basic_fire_abilities"
  ]
}
```

Every entry in the array stays an entry reference or a tag; duplicate values do not change the meaning on their own. **Lists are lenient**: a bad entry in a lenient list is dropped with an `Ignoring invalid list element` warning and the rest of the same list still applies; each field table states whether a field follows that rule.

### `ItemMatcher`

The `items` field of `artifact`, `item_binding`, `weapon_binding`, `pill_binding`, `tool_binding`, `blueprint_binding`, `spirit_herb`, `item_aura` and `currency` accepts the three forms below (`technique_binding`'s `items` is the optional second route, see [Technique Binding](../json/technique_binding.md)):

```json
"items": "minecraft:apple"
```

```json
"items": "#minecraft:logs"
```

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

A matcher only references items that are already registered. When several definitions match the same item, the one with the **highest** declared `priority` is picked (the field defaults to `0`; ten tables accept it: `artifact`, the six `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` bindings, `spirit_herb`, `item_aura` and `currency`); only two definitions with the **same** `priority` fall back to registry order, so which one wins is fixed by the data pack itself and has nothing to do with file names (the same direction as `priority` on `aura_zone` and `element_reaction`). **This is independent of which kind of matcher entry matched**: any definition that hits joins the ranking with the number it declares, and naming an item does not move it up.

Every entry in the array may also be written as an object with a `type`, dispatched by the built-in `item_matcher_entry_type` registry; the fields, defaults and matching rules of every `type` are in [Item Matcher Types](/en/datapack/types/other/item-matcher).
