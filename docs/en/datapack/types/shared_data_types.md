---
title: Shared Data Types
description: Complex data types reused by many MiXianTu definitions, including costs and gains, attribute entries, holder and tag selectors, and item matchers.
---

# Shared Data Types

These are complex values that are referenced by many definitions, actions and conditions across the mod. They have no `type` field of their own unless stated, and they are written inline wherever a field table names them.

---

## Icon Reference

Every icon field in the mod takes the same value: **either** a GUI texture **or** an item. Definitions that carry one are [ability](../json/ability.md), [resource](../json/resource.md), [forging method](../json/forging_method.md) and [technique](../json/technique.md).

| Form | Type | Description |
|------|------|-------------|
| A JSON string | Identifier | A 16x16 GUI texture, for example `example:textures/gui/icon/sword.png` |
| A JSON object | `ItemStackTemplate` | An item stack template such as `{"id": "minecraft:iron_ingot"}`, optionally with `count` and `components` |

The texture branch is tried first, and it is a plain `Identifier`, so **any bare string is a texture**. An item therefore always has to be written as an object with an `id`, because a bare item ID would be read as the path of a texture instead.

```json
"icon": "example:textures/gui/icon/sword.png"
```

```json
"icon": {"id": "minecraft:iron_ingot"}
```

An item icon is stored as a template rather than a ready-made stack, because a datapack registry is parsed before item components are bound. The client materialises it when it draws, so an icon that needs components still shows them.

---

## Cost

Every field that **consumes** something takes the same array, and each entry is one `Cost` (this type used to be called `ResourceCost`; **no JSON key was renamed** — what changed is that it also accepts aura, item and script entries), written in one of five shapes:

| Shape | Description |
|-------|-------------|
| `{"id": "example:qi", "amount": 5}` | The shorthand, identical to `mxt:resource`; the definition id lives in `id`. |
| `{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}` | Spends a value; the definition id lives in `resource`. |
| `{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}` | Spends an aura; the aura id lives in `aura`. What is charged depends on the channel: the value that aura is measured in when the payer pays, and that aura itself when a shared aura pool or a block's own store pays. |
| `{"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}` | Spends items; `items` is an item/tag matcher list (a bare item id, a `#tag`, or the typed matcher entries, see [`ItemMatcher`](#itemmatcher)). |
| `{"type": "mxt:js", "id": "my_cost", "params": {}}` | Delegates to a server script; `id` is the callback registered with `MxtCosts.register` and `params` is optional. |

`amount` is always a `NumberProvider` and has to evaluate to a finite positive number at use time, or that entry cannot be paid. `mxt:resource` and `mxt:aura` ask two different questions: the first names a **value**, the second names an **aura identity**. When the payer pays, it comes out of the **value account** — it takes the value that aura is measured in, the same account a `mxt:resource` entry would use (a payer holds values, not auras); when a shared aura pool or a block's own store pays, it takes that aura itself.

```json
"costs": [
  {"id": "example:qi", "amount": 5},
  {"type": "mxt:resource", "resource": "example:stamina", "amount": "5 + level"},
  {"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2},
  {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}
]
```

Rules:

- **A whole array is paid all-or-nothing.** If any single entry cannot be paid, nothing at all is taken — not even the entries that could be paid.
- **Two entries in the same array that name the same store are a load error** (the same value id twice, or the same aura twice). Two entries that merely reach the same value by different routes are **not** an error: a `mxt:resource` entry and an `mxt:aura` entry whose aura is measured in that same value have their amounts **added together**, because that is the only answer which does not depend on the order they were written in.
- The payer is a **living entity** (a player, a mob, a summoned creature), not necessarily a player. Whether an entry can be paid depends on which channels the place offers:

| Shape | Where it is taken from |
|-------|------------------------|
| `mxt:resource` | The payer's own value account. |
| `mxt:aura` | That aura's measured value: out of the payer's value account when the payer pays; out of the **shared aura pool** when the ground pays (`cultivate_action.aura_costs`), scaled first by the pool's allocation for the chunk and then charged all-or-nothing; and that aura itself, in whole units rounded up, out of a **block entity's own store** when the Spirit Crafting Table pays (a recipe's `aura`). |
| `mxt:item` | Needs a player's inventory. A non-player payer (or a formation with no owner) simply cannot pay it — that is a refusal, not an error. |
| `mxt:js` | Needs a player, and runs **last**, after every other channel has been paid. A script cost is not staged, so scripts have to be idempotent about it. |

The from-the-ground (shared aura pool) channel and the from-a-block-entity's-store channel both have real users now: `cultivate_action.aura_costs` is paid from the shared aura pool at the cultivator's position (first scaled by the pool's allocation when several players cultivate in the same chunk, then charged all-or-nothing), and the `aura` of a spirit crafting recipe (`mxt:spirit_shaped` / `mxt:spirit_shapeless`) is paid from the Spirit Crafting Table's own store in whole units (rounded up).

A missing channel is reported as "cannot pay", never as a broken definition. An entry that cannot be decoded now **fails the load** of the definition instead of being logged and dropped.

The **10** fields that take this array are `ability.costs` (**shared by every ability type**, which is why the per-tick fuel of `mxt:mount` and the per-period price of `mxt:upkeep` are written here too), the `upkeep_costs` of `mxt:channelled`, `realm_stage.costs`, `cultivate_action.costs` and `cultivate_action.aura_costs`, `formation.activation_costs` and `formation.maintenance_costs`, `forging_method.costs`, `contract_type.costs` (the price of signing a contract, paid by the owner), and the `aura` of a spirit crafting recipe (`mxt:spirit_shaped` / `mxt:spirit_shapeless`). Those last two accept **only `mxt:aura` entries** (any other type is a load error), and their older `{"<aura id>": NumberProvider}` map form is still read for compatibility, while serialization always emits the array form.

**These deliberately are not `Cost`, so do not "fix" them**: `talisman.aura_cost` is still a `{"<aura id>": NumberProvider}` map, and it is the **requirement** "how much of this aura the carrier has to be filled with before it fires" (it is also the pour capacity), not a payment; `alchemy`'s `minimum_aura` and `creature_profile.minimum_aura` are requirements that are never consumed. The currency system has nothing to do with this shape: `currency`'s `exchanges[].cost` is an integer price (`1..99`) saying how many currency items an exchange takes, and `quality.value_multiplier` is a value modifier; neither is a `Cost`.

---

## Aura Gain

An aura gain names one aura and the amount of it to hand over, and it is the shape the `aura_gains` field of a [cultivate action](../json/cultivate_action.md) uses. Gains are less strict than costs: `0` is allowed, but a negative result is rejected.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Holder<aura>` | The aura registry entry |
| `amount` | `NumberProvider` | The gain; it must evaluate to a finite, non-negative number |

```json
"aura_gains": [
  {"id": "example:qi", "amount": 10},
  {"id": "example:insight", "amount": "level * 0.5"}
]
```

A plain counter is raised with the `mxt:add_resource` entity action instead, which takes a `resource` and an `amount` and needs no aura definition behind the value.

::: tip
A cost of `0` or less is invalid, so a cost entry can never be used to grant anything. Use a gain for that.
:::

---

## AttributeEntry

Vanilla attribute modifiers use the vanilla attribute holders such as `minecraft:attack_damage`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `attribute` | `Holder<Attribute>` | **required** | Vanilla attribute ID |
| `id` | `Identifier` | **required** | Unique ID of the vanilla `AttributeModifier` |
| `amount` | `Double` | **required** | Base value used when there is no dynamic `value` |
| `operation` | Enum | **required** | `add_value`, `add_multiplied_base` or `add_multiplied_total` |
| `value` | `NumberProvider` | none | When present, the value is recomputed every tick on the server and replaces `amount` |

```json
{
  "attribute": "minecraft:max_health",
  "id": "example:body_tempering",
  "amount": 4,
  "operation": "add_value",
  "value": "2 + caster_minecraft_max_health * 0.1"
}
```

A dynamic `value` is evaluated with the entity alone, without a resource context, so it can read the `caster_` family but not `realm_rank` or `absorbed_aura`.

---

## Holders, Tags and Mixed Arrays

Fields that cross registries are resolved into holders during datapack load instead of being looked up at runtime.

### Single Value and Tag

A single entry is written as an ID, and a tag reference keeps its required `#` prefix:

```json
{
  "aura": "example:qi",
  "ability_requirements": "#example:fire_abilities"
}
```

### Mixed Arrays

Fields that accept both IDs and tags can be written as an array:

```json
{
  "ability_requirements": [
    "example:fireball",
    "#example:basic_fire_abilities"
  ]
}
```

Every array entry stays a `Holder` or a `TagKey`; duplicate values do not change the meaning. `AutoIgnoreListCodec` allows invalid optional entries in a list to be ignored, and each field table states whether that codec is used.

---

## ItemMatcher

The `items` field of `item_binding`, `weapon_binding`, `pill_binding`, `technique_binding`, `spirit_herb`, `item_aura` and `currency` accepts three forms. The matcher type IDs behind them are listed in [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type).

A single item ID:

```json
"items": "minecraft:apple"
```

A single item tag:

```json
"items": "#minecraft:logs"
```

A mixed array:

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

Array entries may also be typed objects, which is how a wildcard, a regular expression, a spirit herb tag (`mxt:herb_tag`) or the capability matcher `mxt:spirit_storage` is written. See [Other Type Families](/en/datapack/types/other/formation-and-matcher#item-matcher-entry-type) for the registered entry types and their fields.

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:spirit_storage"}
]
```

A matcher only references items that are already registered; it never creates items. When several definitions match, they are selected by `priority` from low to high, and for the current data classes that priority is fixed at `0`.

---

## Weighted Entry

Every weighted list in the mod uses the same entry shape: `value` is the entry itself, and `weight` is an optional relative weight (`1` when omitted).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | any | **required** | The entry that can be picked |
| `weight` | Integer | `1` | Relative weight; larger weights are picked more often, a weight of `0` or less is never picked, and a list whose weights are all `0` is picked from uniformly |

| Used by | Field |
|---------|-------|
| `mxt:choice` (entity, item, block, bi-entity) | `actions` |
| `mxt:weighted_list` | `distribution` |

`secret_realm`'s `entry` array is the one exception: there the `weight` sits directly on the landing object, because that object also carries `pos`, a random radius and so on. Its weight is also validated at load, so a negative weight is a load error rather than a `0`, while `0` still means the entry is never picked.

```json
{
  "type": "mxt:choice",
  "actions": [
    {"value": {"type": "mxt:no_op"}, "weight": 3},
    {"value": {"type": "mxt:spawn_lightning", "damage": 4}, "weight": 1}
  ]
}
```
