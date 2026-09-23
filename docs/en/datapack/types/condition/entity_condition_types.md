---
title: Entity Condition Types
description: Every built-in entity condition type registered by the mod, with the JSON fields that each type accepts.
---

# Entity Condition Types

An **entity condition** checks the state of a single entity and returns `true` or `false`. The entity being tested is supplied by whatever data table declares the condition, so the condition itself only describes what to check.

Entity conditions are a Java (built-in) registry, so their `type` ids are fixed and a data pack cannot add new ones. `type` selects the built-in type and its value is one of the ids tabulated on this page, written with the `mxt` namespace. A data pack never adds or removes entries in this registry. Only Java code or the KubeJS bridge can introduce custom condition types — see the [KubeJS API](../../../kubejs/api-reference.md).

In the table below, a field name followed by `?` is optional; every other listed field must be present. The `Fields` column lists the JSON keys taken directly from the type's codec.

## Common Structure

A condition is a JSON object whose `type` field names the built-in type. All remaining keys are the fields declared by that type.

```json
{
  "type": "mxt:health",
  "comparison": "<",
  "compare_to": 10
}
```

Because conditions are used as values inside other data tables, the same structure usually appears nested under a field such as `condition`:

```json
"condition": {
  "type": "mxt:has_spirit_root",
  "spirit_root": "example:azure_root"
}
```

Anywhere an entity condition is expected, an array of conditions is also accepted. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"condition": [
  { "type": "mxt:sneaking" },
  { "type": "mxt:on_block", "condition": {"type": "mxt:block_tag", "tag": "minecraft:logs"} }
]
```

::: info Comparison Fields
Several types compare a value against a number. When a type lists `comparison` and `compare_to` as separate keys, they sit directly on the condition object, as in the example above. A few types instead name a single `comparison` key whose value is one nested comparison object holding `comparison` and `compare_to`; those types say so in their description. The comparison operators are `==`, `!=`, `<`, `<=`, `>` and `>=`, and `compare_to` itself is always a plain number.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) shows the field list of every type interactively, which is handy for checking a field name without reading the table here.
:::

## Condition Types

| Type | Fields | Description |
|------|--------|-------------|
| `mxt:always_true` | — | Always passes. |
| `mxt:js` | `id`, `params?` | Calls an entity condition handler that was registered through the KubeJS bridge. |
| `mxt:never` | — | Always fails. |
| `mxt:and` | `conditions` | Passes only when every nested entity condition passes. |
| `mxt:not` | `condition` | Negates a nested entity condition. |
| `mxt:or` | `conditions` | Passes when at least one nested entity condition passes. |
| `mxt:chance` | `chance` | Passes randomly with the given probability between `0` and `1`. |
| `mxt:constant` | `value` | Always returns the given boolean value. |
| `mxt:sneaking` | — | Checks whether the entity is sneaking. |
| `mxt:has_ability` | `ability` | Checks whether the entity currently holds the given [ability](../../json/ability.md). |
| `mxt:has_curse` | `curse?`, `tags?`, `stacks?`, `remaining_ticks?` | Checks whether the entity holds one [curse](../../json/curse.md) that satisfies **every** filter given: a definition, all of the listed tags, a stack range and a remaining-tick range. The ranges are `{min?, max?}` windows; a curse that never expires counts as infinite, so it answers a `min` but never a `max`. With no filter at all it asks whether any curse is held. |
| `mxt:has_spirit_root` | `spirit_root` | Checks whether the entity currently holds the given [spirit root](../../json/spirit_root.md). The field accepts an entry, a `#` tag or an array of them, so "any fire root" is one tag. A disabled root does not count as held. |
| `mxt:has_physique` | `physique` | Checks whether the entity currently holds the given [physique](../../json/physique.md). |
| `mxt:realm` | `realm`, `comparison?` | Compares the entity's [realm](../../json/realm_stage.md) stage against `realm`, using `exact` (the default), `at_least` or `at_most`. |
| `mxt:has_realm` | `aura` | Passes for entities that have entered a realm chain for the given [aura](../../json/aura.md). |
| `mxt:aura_range` | `aura` | Tests the server-resolved aura concentration at the entity's position against per-aura requirements. `aura` maps an aura ID to an object with a required `max` and an optional `min` (default `0`); both accept a [number provider](../number_provider_types.md). |
| `mxt:has_element` | `elements` | Passes when any element the entity's enabled spirit roots name is one of the listed ones. `elements` is a `HolderOrTag<element>[]`, so "a fire cultivator" is one `#` tag and stays right when a later data pack adds another way to be one; a disabled element does not count. Every element condition needs at least one element: an empty table or array is refused at load instead of turning into a condition that always passes or never does. |
| `mxt:aura_element` | `elements` | Tests the aura at the entity's position by **element** rather than by named aura. `elements` maps an element to an object with a required `max` and an optional `min` (default `0`), both accepting a [number provider](../number_provider_types.md); every live aura carrying that element at the position is summed first and every entry has to pass (a disabled element takes no part). Adding another aura of that element to a zone is enough on its own, without editing the query. |
| `mxt:element_attachment` | `elements` | Reads how much of an element has accumulated on the entity, from the `mxt:element_attachment` attachment (see [Element Reaction](../../json/element_reaction.md)). `elements` maps an element to the same `{min?, max}` window and every entry has to pass. It is the read-only side of the accumulation system: an effect can depend on how much fire a body carries without any reaction firing. A disabled element answers `false` however much is left on the body, because the accumulation of an element a pack took out of play is not a fact about that element any more; an empty table is refused at load rather than passing everywhere. |
| `mxt:in_secret_realm` | `definition?`, `role?` | Checks whether the entity is inside a [secret realm](../../json/secret_realm.md). `definition` accepts one `mxt:secret_realm` entry or a `#` tag, and any definition counts when it is omitted; `role` is `any` (the default — merely being inside), `owner` (the entity claimed the instance) or `guest` (inside but not the owner). Outside every instance it is `false`, so `owner` and `guest` both imply being inside. |
| `mxt:resource_compare` | `resource`, `min` | Checks that the entity's value for a resource is at least `min`. |
| `mxt:entity_tag` | `tag` | Matches the entity against an entity type tag. |
| `mxt:formation_member` | — | Passes when the entity owns any registered [formation](../../json/formation.md) in the current level. |
| `mxt:formation_owner` | — | Passes when the entity owns the formation currently being evaluated; outside a formation context it is `false`. |
| `mxt:formation_ally` | — | Passes when the owner of the formation currently being evaluated treats the entity as an ally. |
| `mxt:air` | `comparison`, `compare_to` | Compares the entity's remaining air. |
| `mxt:dimension` | `dimension`, `inverted?` | Checks the entity's dimension, or the opposite when `inverted` is `true`. |
| `mxt:entity_type` | `entity_type` | Checks the entity's type. |
| `mxt:fall_distance` | `comparison`, `compare_to` | Compares the entity's fall distance. |
| `mxt:glowing` | — | Checks whether the entity is glowing. |
| `mxt:health` | `comparison`, `compare_to` | Compares the entity's current health. |
| `mxt:exposed_to_sky` | — | Checks whether the entity's position can see the sky. |
| `mxt:food_level` | `comparison`, `compare_to` | Compares a player's food level. |
| `mxt:mob_effect` | `effect` | Checks whether the entity has the given status effect. |
| `mxt:on_block` | `condition` | Tests a [block condition](block_condition_types.md) against the block the entity stands on. |
| `mxt:time_of_day` | `comparison`, `compare_to` | Compares the overworld clock time, in ticks within a 24000 tick day. |
| `mxt:using_item` | — | Checks whether the entity is currently using an item. |
| `mxt:brightness` | `comparison`, `compare_to` | Compares the brightness at the entity's eyes as a value between `0` and `1`. |
| `mxt:exposed_to_sun` | — | Checks whether the entity is exposed to sunlight. |
| `mxt:experience_level` | `comparison`, `compare_to` | Compares a player's experience level. |
| `mxt:experience_points` | `comparison`, `compare_to` | Compares a player's total experience points. |
| `mxt:relative_health` | `comparison`, `compare_to` | Compares the entity's health divided by its maximum health. |
| `mxt:saturation_level` | `comparison`, `compare_to` | Compares a player's saturation level. |
| `mxt:team` | `team?` | Checks whether the entity is on a scoreboard team, or on the named team when `team` is present. |
| `mxt:attribute` | `attribute`, `comparison`, `compare_to` | Compares one of the entity's attribute values. |
| `mxt:block_collision` | `offset_x?`, `offset_y?`, `offset_z?` | Checks for a block collision at an offset from the entity. |
| `mxt:can_have_effect` | `effect` | Checks whether the entity can be affected by the given status effect. |
| `mxt:gamemode` | `gamemode` | Checks a player's game mode. |
| `mxt:passenger` | `bientity_condition?`, `comparison`, `compare_to` | Compares the number of the entity's direct passengers that satisfy a [bi-entity condition](bientity_condition_types.md). |
| `mxt:attack_cooldown` | `comparison`, `compare_to` | Compares a player's current attack cooldown progress. |
| `mxt:equipped_item` | `equipment_slot`, `item_condition?` | Checks the item in one equipment slot against an [item condition](item_condition_types.md). |
| `mxt:in_block` | `block_condition` | Tests a [block condition](block_condition_types.md) against the single block at the entity's block position. |
| `mxt:in_block_anywhere` | `block_condition`, `comparison` | Compares the number of matching blocks inside the entity's bounding box, with `comparison` as a nested comparison object. |
| `mxt:scoreboard` | `name?`, `objective`, `comparison`, `compare_to` | Compares a scoreboard score, defaulting the score holder to the entity's scoreboard name. |
| `mxt:riding` | `bientity_condition?` | Checks the entity's vehicle against a [bi-entity condition](bientity_condition_types.md). |
| `mxt:riding_recursive` | `bientity_condition?`, `comparison`, `compare_to` | Compares the number of vehicles in the whole riding chain that satisfy a bi-entity condition. |
| `mxt:passenger_recursive` | `bientity_condition?`, `comparison`, `compare_to` | Compares the number of nested passengers that satisfy a bi-entity condition. |
| `mxt:riding_root` | `bientity_condition?` | Tests a bi-entity condition against the vehicle at the root of the entity's riding chain. |
| `mxt:storage_toggle` | `family`, `id`, `expected?` | Reads a [`mxt:toggle`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `family` names the data pack registry the host lives in, `id` the host; the host must declare that kind or the test is `false`. True when the stored `state` equals `expected` (default `true`), falling back to the declaration's `default` while nothing was ever written. |
| `mxt:storage_timer` | `family`, `id`, `remaining?`, `ended?` | Reads a [`mxt:timer`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `remaining` is a `{min?, max?}` window over the ticks left (never negative), `ended` asks whether `ends_at` has passed. A timer with no `ends_at` is not running, so it has nothing left and counts as ended. |
| `mxt:storage_resource` | `family`, `id`, `amount?` | Reads a [`mxt:resource`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `amount` is a `{min?, max?}` window; a stored record without an amount counts as `0`, and omitting `amount` only asks whether a value of that kind is stored at all. |
| `mxt:storage_target` | `family`, `id`, `locked?`, `max_distance?` | Reads a [`mxt:target_lock`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `locked` (default `true`) asks whether a target UUID is stored; `max_distance` additionally requires that UUID to parse and resolve to an entity in the actor's level within that distance. A malformed UUID, a missing entity or a negative distance is `false`. |
| `mxt:storage_charges` | `family`, `id`, `remaining?` | Reads a [`mxt:charges`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `remaining` is a `{min?, max?}` window over the uses left; a pool that was never spent keeps no count and reads as the declaration's `maximum`. Omitting `remaining` only asks whether the host declares a charge pool at all. |
| `mxt:storage_cooldown` | `family`, `id`, `remaining?`, `ready?` | Reads a [`mxt:cooldown`](/en/datapack/types/other/ability-and-curse#data-storage-type) value. `remaining` is a `{min?, max?}` window over the ticks left and `ready` asks whether the cooldown has finished. The length is the one the last use actually got, or the declaration's own `ticks` for a value content wrote without a `duration`; the countdown starts at the tick the value was written, the same anchor the runtime reads. A host that never wrote one is not cooling down at all, so it answers `remaining` 0 and `ready` true. |
| `mxt:has_equipped_item` | `item_condition?`, `slots?` | Passes when the entity wears or holds a stack satisfying an [item condition](item_condition_types.md) — the natural way to gate a passive `mxt:modifier` on gear, for example `{"type": "mxt:item_tag", "tag": "#example:swords"}`. `slots` names vanilla equipment slots (`mainhand`, `offhand`, `head`, `chest`, `legs`, `feet`, `body`) or Curios slots with a `curios:` prefix (`curios:back_weapon`); leaving it out asks every vanilla slot and every Curios slot. A name that matches nothing simply never passes. |

::: info Type References
`ability`, `curse`, `spirit_root`, `physique`, `realm`, `aura`, `element` and `resource` accept the ids of the matching data pack registries, so they can point at content added by any data pack, not only at entries shipped with the mod.
:::
