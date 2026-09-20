---
title: Formation, Timeline and Matcher Types
---

# Formation, Timeline and Matcher Types

## `formation_action_type`

The `actions` array of a [formation](../../json/formation.md) holds these functional modules. A datapack never adds one; it picks an existing module by writing its id in the module's `type`.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:none` | none | No module behaviour. |
| `mxt:attack` | `damage?`, `damage_type?`, `attribute_to_owner?`, `effects?` | Attacks entities inside the radius. |
| `mxt:buff` | `abilities?`, `target?`, `aura_zone?`, `max_bonus?` | Grants abilities, overrides the local aura template and raises aura capacities. |
| `mxt:protection` | `block_break?`, `block_place?`, `block_interact?`, `explosions?`, `mob_griefing?`, `entity_interact?`, `attack_entity?`, `item_use?`, `spare_friends?`, `delegate_to_claims?` | Denies the listed kinds of interference inside the radius. |
| `mxt:range_display` | `particle`, `interval_periods?`, `points?`, `shape?` | Draws the radius outline with particles. |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:attack` | `damage` | `NumberProvider` | `0` | Damage per application |
| `mxt:attack` | `damage_type` | `Holder<damage_type>` | none | Damage type used for the hit |
| `mxt:attack` | `attribute_to_owner` | Boolean | `true` | Whether the formation owner is credited as the attacker |
| `mxt:attack` | `effects` | List of effect actions | `[]` | Status effects applied on each hit |
| `mxt:buff` | `abilities` | List of `Holder<ability>` | `[]` | Abilities granted to matching entities |
| `mxt:buff` | `target` | Enum | `all` | Which entities the module applies to: `all`, `allies` or `owner` |
| `mxt:buff` | `aura_zone` | `AuraZone` | none | Inline aura template applied inside the radius |
| `mxt:buff` | `max_bonus` | Map of aura to `NumberProvider` | `{}` | Extra aura capacity per aura |
| `mxt:protection` | `block_break` | Boolean | `true` | Deny block breaking |
| `mxt:protection` | `block_place` | Boolean | `true` | Deny block placing |
| `mxt:protection` | `block_interact` | Boolean | `true` | Deny block interaction |
| `mxt:protection` | `explosions` | Boolean | `true` | Deny explosions |
| `mxt:protection` | `mob_griefing` | Boolean | `true` | Deny mob griefing |
| `mxt:protection` | `entity_interact` | Boolean | `true` | Deny entity interaction |
| `mxt:protection` | `attack_entity` | Boolean | `true` | Deny attacking entities |
| `mxt:protection` | `item_use` | Boolean | `true` | Deny item use |
| `mxt:protection` | `spare_friends` | Boolean | `true` | Exempt the owner's friends |
| `mxt:protection` | `delegate_to_claims` | Boolean | `false` | Hand protection over to a land-claim mod |
| `mxt:range_display` | `particle` | Particle options | **required** | Particle drawn along the outline |
| `mxt:range_display` | `interval_periods` | Integer `1..1200` | `1` | Maintenance periods between redraws |
| `mxt:range_display` | `points` | Integer `1..512` | `32` | Number of points on the outline |
| `mxt:range_display` | `shape` | Enum | `ring` | Outline shape: `ring` or `sphere` |

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
  ]
}
```

---

## `timeline_entry_type`

The `timeline` array of a [tribulation](../../json/tribulation.md) holds these entries. A datapack never adds one; it picks an existing kind of beat by writing its id in the entry's `type`. The built-in ones are registered in `MxtTimelineEntries`.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:action` | `action` (**required**) | Runs one entity action and finishes on the same tick. |
| `mxt:idle` | `duration` (**required**) | Waits that many ticks doing nothing. |
| `mxt:wait_for` | `condition` (**required**) | Evaluated every tick; finishes once the condition holds. |

`action` is an [Entity Action](../action/entity_action_types.md), so any behaviour can be a beat. `duration` is a `NumberProvider`, resolved as `duration × difficulty_scale × max(0, 1 + aura_tribulation_modifier)` and re-resolved every tick. `condition` is an [Entity Condition](../condition/entity_condition_types.md), and it accepts a list as an implicit AND, exactly like the condition fields elsewhere.

`mxt:wait_for` has no timeout, so a condition that never holds parks the run on that entry. Each entry is asked once before the run starts whether it can run at all, which is why an `mxt:idle` with an unresolvable duration refuses the start instead of failing halfway.

---

## `item_matcher_entry_type`

These entries make up an [ItemMatcher](../shared_data_types.md#itemmatcher). An item ID and an item tag also have shorthand forms that omit `type`.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:item` | `item` | Matches one exact item |
| `mxt:tag` | `tag` | Matches every item in an item tag |
| `mxt:wildcard` | `pattern` | Matches item IDs with `*` and `?` wildcards |
| `mxt:regex` | `pattern` | Matches item IDs with a regular expression |
| `mxt:spirit_storage` | none | Matches every item that stores aura, that is, every item implementing `ItemAuraAccess` |
| `mxt:herb_tag` | `element?`, `material?` | Matches an item that is a spirit herb whose `element_tags` / `material_tags` intersect the query (`element` expands both sides to element sets) |

| `type` | Field | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `mxt:item` | `item` | Identifier | **required** | Item registry ID; the shorthand form is the bare ID string |
| `mxt:tag` | `tag` | Item tag ID | **required** | Tag reference; the shorthand form is the `#`-prefixed string |
| `mxt:wildcard` | `pattern` | String | **required** | `*` matches any run of characters and `?` matches one character; must not be empty |
| `mxt:regex` | `pattern` | String | **required** | A full regular expression matched against the item ID; must not be empty |
| `mxt:spirit_storage` | — | — | — | Fieldless; `{"type": "mxt:spirit_storage"}` is the whole entry |
| `mxt:herb_tag` | `element` | `HolderOrTag<element>` | none | The element alignment of the matching spirit herb. Both sides are written against the element registry (entries or `#` tags) and are expanded to element sets before they are intersected, so it does not matter which side the tag sits on |
| `mxt:herb_tag` | `material` | Identifier | none | Material id the matching spirit herb has to list in its `material_tags`; at least one of `element` and `material` must be given |

Wildcard and regex entries are matched against the item ID, such as `minecraft:apple`, not against display names. `mxt:spirit_storage` is the one entry that matches by capability rather than by ID, so an item added later that implements `ItemAuraAccess` is covered without editing the file that declared the matcher.

```json
"items": [
  "minecraft:apple",
  {"type": "mxt:wildcard", "pattern": "minecraft:*_sword"},
  {"type": "mxt:regex", "pattern": "othermod:(ruby|jade)_gem"}
]
```

`mxt:herb_tag` is the entry that reads the `mxt:spirit_herb` data pack registry rather than only vanilla's item registry: it matches an item that is a [spirit herb](../../json/spirit_herb.md) — a `mxt:spirit_herb` definition whose own matcher accepts the stack — and then asks about that definition's alignment. `element` queries `element_tags` and `material` queries `material_tags`; giving both means both have to be satisfied, while giving neither is rejected when the data pack loads. `element` and `element_tags` are both written against the element registry (entries or `#` tags) and are expanded to element sets on **both** sides before they are intersected, so a herb aligned with `#example:fire_like` matches a query for `example:fire` and vice versa, and it does not matter which side the tag is written on; disabled elements take no part. `material` stays a plain identifier. The tags are a property of the herb rather than of the item, so content can say "any fire-aligned spirit herb" without knowing which items a later pack binds to that herb. The herb registry only exists while a server runs, so on the client the entry simply reports no match.

```json
{
  "type": "mxt:has_equipped_item",
  "item_condition": {
    "type": "mxt:item_matcher",
    "items": [
      {"type": "mxt:item", "item": "minecraft:blaze_powder"},
      {"type": "mxt:herb_tag", "element": "example:fire"},
      {"type": "mxt:herb_tag", "material": "example:herb"}
    ]
  }
}
```
