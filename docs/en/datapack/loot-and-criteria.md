---
title: Loot and Advancement Criteria
description: The loot functions, loot conditions and advancement criteria MiXianTu provides, with their fields and JSON examples.
---

# Loot and Advancement Criteria

Besides datapack registries, MiXianTu registers a small set of vanilla types so that content packs can read and change a player's cultivation state from ordinary loot tables, loot modifiers and advancements. They are written as `"type": "mxt:..."` inside normal vanilla JSON — there is no special file layout.

## File Locations

| Kind | Where it is used |
|------|------------------|
| Advancement criteria | `data/<namespace>/advancement/<path>.json`, in the `criteria` section |
| Loot functions and loot conditions | `data/<namespace>/loot_table/<path>.json`, or any other JSON that accepts vanilla loot functions and conditions, such as block or entity loot tables and loot modifiers |

## Advancement Criteria

All four criteria share one shape: an optional `definition` filter plus the standard vanilla player predicate.

| Criterion | Fires when | `definition` holds |
|-----------|------------|--------------------|
| `mxt:breakthrough` | A breakthrough succeeds | The realm stage that was reached |
| `mxt:ability` | An ability is used, including every ability executed as part of a composite cast | The ability |
| `mxt:alchemy` | An alchemy batch completes | The recipe |
| `mxt:tribulation` | A tribulation completes successfully | The tribulation |

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `player` | `ContextAwarePredicate` | none | Standard vanilla predicate on the player who earns the advancement |
| `definition` | Identifier | none | Only fires for this definition; when it is omitted, any definition fires the criterion |

```json
{
  "criteria": {
    "foundation": {
      "trigger": "mxt:breakthrough",
      "conditions": {
        "definition": "example:foundation"
      }
    }
  },
  "requirements": [["foundation"]]
}
```

## Loot Conditions

A loot condition uses the vanilla `"condition"` dispatch key: `{"condition": "mxt:has_ability", ...}`.

| Condition | True when | Required field |
|-----------|-----------|----------------|
| `mxt:has_ability` | The entity has been granted the ability | `ability` |
| `mxt:has_curse` | The entity carries a curse the query accepts (`curse?`, `tags?`, `stacks?`, `remaining_ticks?`, all optional and all required to hold for the same instance) | — |
| `mxt:realm` | The entity is in that realm, in any resource chain | `realm` |
| `mxt:has_spirit_root` | The entity has that spirit root | `spirit_root` |
| `mxt:has_element` | Any element the entity's **enabled** spirit roots name is listed in `elements` | `elements` |
| `mxt:has_physique` | The entity has that physique | `physique` |
| `mxt:js` | A server script callback returns `true` | `id` |

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `entity` | `EntityTarget` | `this` | Which entity of the loot context is checked: `this`, `attacker`, `direct_attacker`, `attacking_player`, `target_entity` or `interacting_entity` |

When the selected entity is not present in the loot context, the condition is false.

The `spirit_root` field of `mxt:has_spirit_root` accepts an entry, a `#` tag or an array of them, so "any fire root" is one tag. `mxt:has_element` asks the coarser question — "is this a fire cultivator" — with `elements` as a `HolderOrTag<element>[]`, so a later data pack that adds another way to be one needs no edit to the loot table; a disabled element takes no part, and `elements` needs at least one entry (an empty array is refused at load).

```json
{
  "conditions": [
    {"condition": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
    {"condition": "mxt:realm", "realm": "example:foundation"}
  ]
}
```

`mxt:js` takes an `id` registered with `MxtLoot.condition(...)` and an optional `params` object. Unlike the built-in conditions it has no `entity` field: the callback receives the whole vanilla `LootContext` and chooses which entity to read.

```json
{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}
```

## Loot Functions

A loot function uses the vanilla `"function"` dispatch key: `{"function": "mxt:grant_ability", ...}`. Every function also accepts the vanilla `conditions` field.

| Function | Effect |
|----------|--------|
| `mxt:grant_ability` | Grants a persistent ability source to an entity and refreshes its trigger subscriptions |
| `mxt:set_artifact_owner` | Assigns the dropped artifact to an entity, then runs the archetype's `refine_action` |
| `mxt:apply_curse` | Applies a curse to an entity, with `loot` as the application source |
| `mxt:js` | Replaces the generated stack with whatever a server script returns |

### `mxt:grant_ability`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ability` | Identifier | **required** | The ability to grant |
| `entity` | `EntityTarget` | `this` | The entity that receives the ability |
| `source` | Identifier | `mxt:loot` | Source id recorded with the grant, so the ability can be revoked per source |

```json
{
  "function": "mxt:grant_ability",
  "ability": "example:fire_manual",
  "source": "example:fire_temple"
}
```

### `mxt:set_artifact_owner`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `entity` | `EntityTarget` | `this` | The entity that becomes the artifact's owner |

If the stack already belongs to another owner, nothing happens: the drop is left untouched and the refine action is not run.

```json
{
  "function": "mxt:set_artifact_owner"
}
```

### `mxt:apply_curse`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `curse` | Identifier | **required** | The curse to apply |
| `stacks` | Integer `1..256` | `1` | How many stacks of the curse to apply |
| `entity` | `EntityTarget` | `this` | The entity that receives the curse |

```json
{
  "function": "mxt:apply_curse",
  "curse": "example:blood_oath",
  "stacks": 2
}
```

### `mxt:js`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | **required** | Callback ID registered with `MxtLoot.function(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{
  "function": "mxt:js",
  "id": "example:bless",
  "params": {"multiplier": 3}
}
```

The callback receives the generated stack and the `LootContext`, and returns the stack to keep: return the argument unchanged to leave the drop alone, return a new stack to replace it, or return `null` to keep the original. A missing or failing callback leaves the stack untouched and logs a warning.

## Putting It Together

A chest that only drops a manual for a player who already has the matching spirit root:

```json
{
  "type": "minecraft:chest",
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {"type": "minecraft:item", "name": "minecraft:book"}
      ],
      "conditions": [
        {"condition": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
      ],
      "functions": [
        {"function": "mxt:grant_ability", "ability": "example:fire_manual"}
      ]
    }
  ]
}
```
