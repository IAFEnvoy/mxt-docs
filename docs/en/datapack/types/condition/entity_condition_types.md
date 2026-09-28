---
title: Entity Condition Types
description: Every built-in entity condition type registered by the mod, with the JSON fields that each type accepts.
---

# Entity Condition Types

An **entity condition** checks the state of a single entity and returns `true` or `false`. The entity under test comes from whichever data table declares the condition; the condition itself only describes what to check.

Entity conditions are a Java (built-in) registry with fixed `type` ids, so a data pack can neither add nor remove entries. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

`type` picks one of the built-in types listed on this page, written with the `mxt` namespace. A field name followed by `?` is optional; every other listed field must be present. The Field column lists the JSON keys taken straight from that type's codec.

## Meta Conditions

`type` sits on the same level as every other key:

```json
{
  "type": "mxt:health",
  "comparison": "<",
  "compare_to": 10
}
```

A condition is used as a value inside other data tables, so it usually lands under a field such as `condition`:

```json
"condition": {
  "type": "mxt:has_spirit_root",
  "spirit_root": "example:azure_root"
}
```

Anywhere an entity condition is accepted, an array of conditions is accepted too. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"condition": [
  { "type": "mxt:sneaking" },
  { "type": "mxt:on_block", "condition": {"type": "mxt:block_tag", "tag": "minecraft:logs"} }
]
```

| Type | Fields | Description |
| --- | --- | --- |
| `mxt:always` | — | Always passes. |
| `mxt:never` | — | Always fails. |
| `mxt:and` | `conditions` | Passes only when every nested entity condition passes. |
| `mxt:or` | `conditions` | Passes when at least one nested entity condition passes. |
| `mxt:not` | `condition` | Negates the nested entity condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability, between `0` and `1`. |
| `mxt:js` | `id`, `params?` | Calls an entity condition handler registered through the KubeJS bridge. |

The `id` of `mxt:js` is the callback registered with `MxtConditions.entity(...)`; a missing callback counts as `false`.

::: info Comparison Fields
Several types compare a value against a number. When a type lists `comparison` and `compare_to` as two separate keys they sit directly on the condition object, as in the example above. A few types name a single `comparison` key instead, whose value is one nested comparison object holding `comparison` and `compare_to`; those types say so in their own description. The operators are `==`, `!=`, `<`, `<=`, `>` and `>=`, and `compare_to` itself is always a plain number.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists each type's fields interactively, handy for confirming a field name without digging through the tables here.
:::

## State, Identity and Cultivation

### `mxt:sneaking`

Checks whether the entity is sneaking.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:has_ability`

Checks whether the entity currently holds the given [ability](../../json/ability.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ability` | Ability id | **required** | The ability to ask about. |

### `mxt:has_curse`

Checks whether the entity holds one [curse](../../json/curse.md) that satisfies **every** filter given.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse?` | Curse id or `#` tag | Any | Has to be this definition. |
| `tags?` | `#` tag or array | Any | The held instance has to carry every listed tag at once. |
| `stacks?` | `{min?, max?}` | Any | Stack range. |
| `remaining_ticks?` | `{min?, max?}` | Any | Remaining-tick range. |

```json
{"type": "mxt:has_curse", "stacks": {"min": 2}, "remaining_ticks": {"min": 1}}
```

`stacks` and `remaining_ticks` are both closed `{min?, max?}` windows. A curse that never expires counts as infinite, so it answers a `min` but never a `max`. With no filter written at all, the question is whether any curse is held.

### `mxt:has_spirit_root`

Checks whether the entity currently holds the given [spirit root](../../json/spirit_root.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `spirit_root` | Entry, `#` tag or array | **required** | The spirit root to ask about. |

```json
{"type": "mxt:has_spirit_root", "spirit_root": "#example:fire_roots"}
```

`spirit_root` takes an entry, a `#` tag or an array of them, so "any fire root" is one tag. It reads the ledger the body holds; whether one is in effect is the [spirit root and physique switch](../../json/spirit_root.md).

### `mxt:has_physique`

Checks whether the entity currently holds the given [physique](../../json/physique.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `physique` | Physique id | **required** | The physique to ask about. |

### `mxt:realm`

Compares the entity's [realm stage](../../json/realm_stage.md) against `realm`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `realm` | Realm stage | **required** | The realm to compare against. |
| `comparison?` | `exact` / `at_least` / `at_most` | `exact` | How to compare. |
| `min_minor_stage?` | Integer | Any | Requires the highest minor stage reached in that realm to be at least this, `0`-based. |

```json
{"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"}
```

`min_minor_stage` uses the same numbering as the `minor_stage` formula variable. It reads the **minor-stage record that only ever grows**, so a gate such as "has reached minor stage 500 of qi refining" still holds after breaking through; pair it with `comparison: "exact"` to mean "is currently inside that minor stage".

### `mxt:has_realm`

Passes for entities that have entered a realm chain for the given [aura](../../json/aura.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura id | **required** | The aura whose realm chain is asked about. |

### `mxt:technique`

Checks which [techniques](../../json/technique.md) the entity has **learned**.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `techniques?` | Entry, `#` tag or array | Empty list | The techniques to ask about. |
| `match?` | `any` / `all` | `any` | `any` is satisfied by one hit; `all` requires every written entry. |

```json
{"type": "mxt:technique", "techniques": ["example:azure_sword"], "match": "all"}
```

An empty list means "has learned any technique at all". An empty list with `all` is refused at load rather than quietly becoming a condition that always passes. It reads what was learned, not what is in effect, since techniques have no enable switch (only spirit roots and physiques do); write `mxt:not` around one for "has no technique".

### `mxt:cultivating`

Checks whether the entity is **cultivating**, optionally inside one named [method](../../json/cultivation.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action?` | Method id | Any | Names one `cultivation`; only a body running that one passes. |

```json
{"type": "mxt:cultivating"}
{"type": "mxt:cultivating", "action": "example:azure_meditation"}
```

The state is written the moment cultivation starts, so the answer is the same for the whole run rather than becoming true only after a settlement. It naturally belongs to "should the session carry on" (`tick_condition`) — **before starting it is necessarily false**, so never use it to ask "can this body cultivate right now"; to ask whether a partner can share in the results, ask what that partner **holds** through `mxt:partner`.

### `mxt:partner`

Checks whether there is a **matching partner nearby**: living entities within `range` blocks of the asker, the asker never among them, each candidate passing a bi-entity condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `range?` | Decimal, `0.5..32` | `5.0` | Spherical radius in blocks. |
| `count?` | `{min?, max?}` | `{"min": 1}` | Closed window on the number of hits; with no `max` it is "at least `min`". |
| `bientity_condition?` | Bi-entity condition | Unconditional | **actor is the asker, target is the candidate**. |

```json
{"type": "mxt:partner", "range": 5.0, "count": {"min": 1, "max": 1},
 "bientity_condition": {"type": "and", "conditions": [
   {"type": "friend"},
   {"type": "target_condition", "condition": {
     "type": "mxt:main_hand_item",
     "item_condition": {"type": "mxt:has_component", "component": "mxt:technique"}}}
 ]}}
```

The fields have the same shape as `mxt:riding`, so `mxt:friend`, `mxt:distance`, `mxt:relation` and `mxt:same_team` all work directly; to ask about the candidate **itself** (what it holds, what state it is in) wrap the entity condition in `mxt:target_condition`. The writing above is the dual cultivation test: "there is a friend within 5 blocks holding a technique manual" — it holds **before either body has sat down**, so whichever of the two presses the cultivation key first gets in (to pin it to one specific manual, swap the inner condition for an item condition naming that carrier). It only answers "is there such a body nearby" and never creates a lasting relationship.

It is asked every tick, and both the radius cap and the per-candidate bi-entity condition exist to keep that scan bounded: write it only in the method that really needs it.

### `mxt:skill_stage`

Checks how far a learned technique has climbed.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `stage` | Skill stage | **required** | Names one level. |
| `comparison?` | `exact` / `at_least` / `at_most` | `exact` | How to compare, by the in-chain index the server cached. |
| `technique?` | Technique entry, `#` tag or array | Every learned technique | Narrows the question to certain techniques. |

```json
{"type": "mxt:skill_stage", "stage": "example:stage_three", "comparison": "at_least", "technique": "example:azure_sword"}
```

Without `technique` every learned technique is asked and one hit is enough. It reads **the level the body reached**, which is the technique's `default_stage` while it never advanced; a technique without a `default_stage`, or one whose chain the cache could not index, never answers true.

### `mxt:has_element`

Passes when one of the elements named by the entity's **enabled** spirit roots is listed in `elements`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | Element entry, `#` tag or array | **required** | The elements to ask about. |

```json
{"type": "mxt:has_element", "elements": "#example:fire"}
```

"Any fire root" is one `#` tag, and later spirit roots of the same kind need no edit here. The `elements` of an element condition always takes at least one entry: an empty list or array is refused at load instead of turning into a condition that always passes or always fails.

### `mxt:in_secret_realm`

Answers whether the entity is inside one [secret realm instance](../../json/secret_realm.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `definition?` | One `mxt:secret_realm` definition or `#` tag | Any | Restricts which definition counts. |
| `role?` | `any` / `owner` / `guest` | `any` | What standing to count as. |

`any` means merely being inside, `owner` means being the owner, and `guest` means being inside without being the owner. Outside every instance it is always `false`, so both `owner` and `guest` imply being inside.

### `mxt:resource_compare`

Checks that one value of the entity is at least `min`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | Resource id | **required** | The resource to ask about. |
| `min` | [Number provider](../number_provider_types.md) | **required** | The threshold. |

### `mxt:element_attachment`

Reads how much of an element has accumulated on the entity (the `mxt:element_attachment` attachment, see [element_reaction](../../json/element_reaction.md)).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | Map of element id to window | **required** | Every entry is one element id to a `max`／`min` window, and every entry has to pass. |
| `elements.<id>.max` | Double | **required** | Upper bound on that element's accumulation. |
| `elements.<id>.min` | Double | Any | Lower bound on that element's accumulation. |

```json
{"type": "mxt:element_attachment", "elements": {"#example:fire": {"min": 20, "max": 100}}}
```

An empty map is refused at load rather than passing everywhere. This is the read-only side of the accumulation system: an effect can depend on how much fire a body carries without any reaction firing.

## Environment and Position

### `mxt:aura_range`

Compares the aura concentration at the server-resolved entity position against per-aura requirements.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Map of aura id to requirement | **required** | Every entry is one aura id to a `max`／`min` requirement. |
| `aura.<id>.max` | [Number provider](../number_provider_types.md) | **required** | Upper bound on that aura's concentration. |
| `aura.<id>.min` | [Number provider](../number_provider_types.md) | `0` | Lower bound on that aura's concentration. |

```json
{"type": "mxt:aura_range", "aura": {"example:fire_qi": {"min": 10, "max": 100}}}
```

Each written aura is compared against the concentration at the entity's position, and all of them have to hold.

### `mxt:aura_element`

Tests the aura at the entity's position by **element** rather than by named aura.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | Map of element id to requirement | **required** | Every entry is one element id to a `max`／`min` requirement, and every entry has to pass. |
| `elements.<id>.max` | [Number provider](../number_provider_types.md) | **required** | Upper bound on that element's concentration. |
| `elements.<id>.min` | [Number provider](../number_provider_types.md) | `0` | Lower bound on that element's concentration. |

Every **live** aura at the position that carries that element is summed first and then compared, and every entry has to pass. Adding another aura of the same element to a zone satisfies the requirement without touching the query.

### `mxt:dimension`

Checks the entity's dimension.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `dimension` | Dimension id | **required** | The dimension to ask about. |
| `inverted?` | Boolean | `false` | `true` gives the opposite result. |

### `mxt:exposed_to_sky`

Checks whether the entity's position can see the sky.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:exposed_to_sun`

Checks whether the entity is exposed to sunlight.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:brightness`

Compares the brightness at the entity's eyes, between `0` and `1`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:time_of_day`

Compares the overworld clock time, in ticks within a 24000 tick day.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:on_block`

Tests a [block condition](block_condition_types.md) against the block the entity stands on.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | [Block condition](block_condition_types.md) | **required** | The condition to test against the block underfoot. |

### `mxt:in_block`

Tests a [block condition](block_condition_types.md) against the single block at the entity's block position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_condition` | [Block condition](block_condition_types.md) | **required** | The condition to test. |

### `mxt:in_block_anywhere`

Compares the number of matching blocks inside the entity's bounding box.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_condition` | [Block condition](block_condition_types.md) | **required** | The condition to match. |
| `comparison` | Nested comparison object | **required** | Holds `comparison` and `compare_to`. |

### `mxt:block_collision`

Checks for a block collision at an offset from the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `offset_x?` | Double | `0` | Offset. |
| `offset_y?` | Double | `0` | Offset. |
| `offset_z?` | Double | `0` | Offset. |

### `mxt:formation_member`

Passes when the entity owns any registered [formation](../../json/formation.md) in the current dimension (being anywhere on the **ownership list** counts).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:formation_owner`

Passes when the entity is **one of** the owners of the formation currently being evaluated (ownership is a set of UUIDs, and any of them counts).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

Outside a formation context it is always `false`.

### `mxt:formation_ally`

Passes when **any** owner of the formation currently being evaluated treats the entity as an ally.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:entity_tag`

Matches the entity against an entity type tag.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | `#` tag | **required** | The entity type tag. |

### `mxt:entity_type`

Checks the entity's type.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity_type` | Entity type id | **required** | The type to ask about. |

## Health, State and Values

### `mxt:air`

Compares the entity's remaining air.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:health`

Compares the entity's current health.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:relative_health`

Compares the entity's health divided by its maximum health.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:pill_toxicity`

Compares the pill toxicity accumulated on the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

```json
{"type": "mxt:pill_toxicity", "comparison": ">=", "compare_to": 100}
```

Same shape as `mxt:health`. An entity that has never taken a pill reads `0` and does not gain an empty record for it. What raises toxicity, where the threshold sits and what is left after an overdose are on [pill_binding](../../json/pill_binding.md); to write the number directly, use `mxt:modify_pill_toxicity`.

### `mxt:fall_distance`

Compares the entity's fall distance.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:glowing`

Checks whether the entity is glowing.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:mob_effect`

Checks whether the entity has the given status effect.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | Status effect id | **required** | The effect to ask about. |

### `mxt:can_have_effect`

Checks whether the entity can be affected by the given status effect.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | Status effect id | **required** | The effect to ask about. |

### `mxt:attribute`

Compares one of the entity's attribute values.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `attribute` | Attribute id | **required** | The attribute to ask about. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:using_item`

Checks whether the entity is currently using an item.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

### `mxt:equipped_item`

Checks the item in one equipment slot against an [item condition](item_condition_types.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `equipment_slot` | Vanilla equipment slot name | **required** | The slot to check. |
| `item_condition?` | [Item condition](item_condition_types.md) | No condition | The condition to test against that stack. |

### `mxt:has_equipped_item`

Passes when a stack the entity wears or holds satisfies an [item condition](item_condition_types.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `item_condition?` | [Item condition](item_condition_types.md) | No condition | The condition to test against every stack. |
| `slots?` | Slot name or array | Every vanilla slot and every Curios slot | Restricts which slots are checked. |

```json
{"type": "mxt:has_equipped_item", "item_condition": {"type": "mxt:item_tag", "tag": "#example:swords"}}
```

This is the natural way to bind a passive `mxt:modifier` to gear. `slots` takes vanilla equipment slot names (`mainhand`, `offhand`, `head`, `chest`, `legs`, `feet`, `body`) or Curios slots with a `curios:` prefix (`curios:back_weapon`); leave it out and every vanilla slot and every Curios slot is asked. A name that matches nothing simply never passes.

### `mxt:main_hand_item`

Checks the stack in the **main hand** against an [item condition](item_condition_types.md); an empty main hand does not pass.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `item_condition?` | [Item condition](item_condition_types.md) | No condition | The condition to test against the main-hand stack. |

```json
{"type": "mxt:main_hand_item", "item_condition": {"type": "mxt:item_quality", "quality": ["example:fine"]}}
```

One field shorter than `mxt:equipped_item` (which needs `"mainhand"` to say the same thing), and unlike `mxt:has_equipped_item` it never asks the Curios slots.

## Players and Scoreboard

### `mxt:food_level`

Compares a player's food level.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:saturation_level`

Compares a player's saturation.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:experience_level`

Compares a player's experience level.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:experience_points`

Compares a player's total experience points.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:gamemode`

Checks a player's game mode.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `gamemode` | Game mode name | **required** | The game mode to ask about. |

### `mxt:attack_cooldown`

Compares a player's current attack cooldown progress.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:team`

Checks whether the entity is on a scoreboard team, or on the named team when `team` is written.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `team?` | Team name | Any team | Names the team. |

### `mxt:scoreboard`

Compares a scoreboard score, with the entity's scoreboard name as the default score holder.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name?` | Score holder name | The entity's scoreboard name | Uses another score holder. |
| `objective` | Objective name | **required** | The objective to read. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

## Riding and Passengers

### `mxt:passenger`

Compares the number of the entity's direct passengers that satisfy a [bi-entity condition](bientity_condition_types.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `bientity_condition?` | [Bi-entity condition](bientity_condition_types.md) | No condition | The condition to test against every passenger. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:passenger_recursive`

Compares the number of nested passengers that satisfy a bi-entity condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `bientity_condition?` | [Bi-entity condition](bientity_condition_types.md) | No condition | The condition to test against every passenger. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:riding`

Checks the entity's vehicle against a [bi-entity condition](bientity_condition_types.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `bientity_condition?` | [Bi-entity condition](bientity_condition_types.md) | No condition | The condition to test against the vehicle. |

### `mxt:riding_recursive`

Compares the number of vehicles in the whole riding chain that satisfy a bi-entity condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `bientity_condition?` | [Bi-entity condition](bientity_condition_types.md) | No condition | The condition to test against every vehicle. |
| `comparison` | Comparison operator | **required** | `==`, `!=`, `<`, `<=`, `>` or `>=`. |
| `compare_to` | Double | **required** | The number to compare against. |

### `mxt:riding_root`

Tests a bi-entity condition against the vehicle at the root of the entity's riding chain.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `bientity_condition?` | [Bi-entity condition](bientity_condition_types.md) | No condition | The condition to test against the root vehicle. |

## Storage

The six `mxt:storage_*` conditions read a state value the host declares, addressed as `family` plus `id`. `family` names the data pack registry the host lives in and `id` is the host; apart from `mxt:storage_cooldown` they all require the host to have **declared** that kind, and a host that did not is `false`. What each kind may store is on [Ability Casting](/en/technical/ability).

### `mxt:storage_toggle`

Reads an [`mxt:toggle`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `expected?` | Boolean | `true` | The switch state expected. |

True when the stored `state` equals `expected`; a state that was never written reads as that kind's `default` (`false` unless declared otherwise).

### `mxt:storage_timer`

Reads an [`mxt:timer`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `remaining?` | `{min?, max?}` | None | Window over the ticks left, never negative. |
| `ended?` | Boolean | None | Asks whether `ends_at` has passed. |

A timer with no `ends_at` is not running, so it has nothing left and counts as ended.

### `mxt:storage_resource`

Reads an [`mxt:resource`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `amount?` | `{min?, max?}` | None | Window over the amount. |

A stored record without an `amount` counts as `0`, and omitting `amount` only asks whether a value of that kind is stored.

### `mxt:storage_target`

Reads an [`mxt:target_lock`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `locked?` | Boolean | `true` | Asks whether a target UUID is stored. |
| `max_distance?` | Double | None | An extra maximum distance requirement. |

`max_distance` additionally requires the UUID to parse and to resolve to an entity in the actor's dimension within that distance. A malformed UUID, a missing entity or a negative distance is `false`.

### `mxt:storage_charges`

Reads an [`mxt:charges`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `remaining?` | `{min?, max?}` | None | Window over the uses left. |

A charge pool that was never spent keeps no count and reads as the declaration's `maximum`.

### `mxt:storage_cooldown`

Reads an [`mxt:cooldown`](/en/technical/ability) value.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry name | **required** | The data pack registry the host lives in. |
| `id` | Host id | **required** | The host. |
| `remaining?` | `{min?, max?}` | None | Window over the ticks left. |
| `ready?` | Boolean | None | Asks whether the cooldown has finished. |

The length is read from `duration` and the start from `started_at` (**the kind carries its own clock**); a value content wrote without a `duration` counts as `0` (that is, as not cooling down). A host that never wrote one is not cooling down at all, so `remaining` answers `0` and `ready` answers `true`. **This one does not require the host to declare `mxt:cooldown`**: every payment writes that value, so any ability that goes through the payment gate can be read by it.

::: info Type References
`ability`, `curse`, `spirit_root`, `physique`, `realm`, `aura`, `element` and `resource` accept the ids of the matching data pack registries, so they can point at content added by any data pack, not only at entries shipped with the mod.
:::
