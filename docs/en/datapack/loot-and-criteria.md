---
title: Loot and Advancement Criteria
description: The loot functions, loot conditions and advancement criteria MiXianTu provides, with their fields and JSON examples.
---

# Loot and Advancement Criteria

Besides the datapack registries, MiXianTu registers a small set of vanilla types so that content packs can read and change a player's cultivation state from ordinary loot tables, loot modifiers and advancements. They are written as `"type": "mxt:..."` inside normal vanilla JSON — there is no special file layout.

## File Locations

| Kind | Where it is used |
| --- | --- |
| Advancement criteria | The `criteria` section of `data/<namespace>/advancement/<path>.json` |
| Loot functions and loot conditions | `data/<namespace>/loot_table/<path>.json`, or any JSON that accepts vanilla loot functions and conditions, such as block or entity loot tables and loot modifiers |

## Advancement Criteria

All four criteria share one shape: an optional `definition` filter plus the standard vanilla player predicate. A criterion goes in the `trigger` of a `criteria` entry, and `conditions` is the two fields below.

| Criterion | Fires when | What `definition` holds |
| --- | --- | --- |
| `mxt:breakthrough` | A breakthrough succeeds | The realm stage that was reached |
| `mxt:ability` | An ability is used, including every ability executed as part of one composite cast | That ability |
| `mxt:alchemy` | An alchemy batch completes | That recipe |
| `mxt:tribulation` | A tribulation completes successfully | That tribulation |

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `player` | Vanilla player predicate | none | Applies to the player who earns the advancement |
| `definition` | Identifier | none | Only this definition fires it; when omitted, any definition fires the criterion |

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
| --- | --- | --- |
| `mxt:has_ability` | The entity has been granted this ability | `ability` |
| `mxt:has_curse` | The entity carries a curse the query accepts | — |
| `mxt:realm` | The entity **has reached** that realm, in any resource chain | `realm` |
| `mxt:has_spirit_root` | The entity has that spirit root | `spirit_root` |
| `mxt:has_element` | One of the elements named by the entity's **enabled** spirit roots is listed in `elements` | `elements` |
| `mxt:has_physique` | The entity has that physique | `physique` |
| `mxt:technique` | The entity has learned the listed techniques | — |
| `mxt:js` | A server script callback returns `true` | `id` |

The one field every condition has:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | Entity selection | `this` | Which entity of the loot context is checked: `this`, `attacker`, `direct_attacker`, `attacking_player`, `target_entity` or `interacting_entity` |

When the selected entity is not present in the loot context, the condition is false.

All four filter fields of `mxt:has_curse` are optional, and whatever is written has to hold **for the same curse instance**; writing none of them only asks "is a curse held at all". Several tags in `tags` mean "carries all of these", and for "any of these" wrap the condition in `mxt:or`. `stacks` and `remaining_ticks` are range objects with `min` / `max` (either end may be omitted, closed interval), and `remaining_ticks` treats a curse that never expires as infinite — it can answer a lower bound and never an upper one.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse entry | none | Only this one curse counts |
| `tags` | Tag array | `[]` | Every tag the curse has to carry |
| `stacks` | Range | none | Stack range |
| `remaining_ticks` | Range | none | Remaining duration range, in ticks |

The `spirit_root` field of `mxt:has_spirit_root` takes an entry, a `#` tag or an array of them, so "any fire spirit root" is one tag. `mxt:has_element` asks the coarser question — "is this a fire cultivator": `elements` is a list of element references, each one an element or a `#` tag, so a spirit root of the same kind added later needs no edit to the loot table, and `elements` needs at least one entry (an empty array is refused at load).

The two fields of `mxt:technique` have the same shape as the entity condition of the same name:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `techniques` | Entry or tag array | `[]` | The techniques to ask about; an empty list asks "has learned any at all" |
| `match` | `any` / `all` | `any` | `all` requires every entry in the list to be learned; `all` with an empty list is refused at load |

It reads the grant ledger the body carries, not the definitions in the current pack; a technique has no enable/disable switch, so learned is learned.

```json
{
  "conditions": [
    {"condition": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
    {"condition": "mxt:realm", "realm": "example:foundation"}
  ]
}
```

`mxt:js` takes an `id` registered with `MxtLoot.condition(...)` and an optional `params` object. Unlike the built-in conditions it has no `entity` field: the callback receives the whole vanilla loot context and decides for itself which entity to read. A callback that is missing makes the condition false, and so does one that throws; both log a line.

```json
{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}
```

## Loot Functions

A loot function uses the vanilla `"function"` dispatch key: `{"function": "mxt:grant_ability", ...}`. Every function also accepts the vanilla `conditions` field.

| Function | Effect |
| --- | --- |
| `mxt:grant_ability` | Grants an entity a persistent ability source and refreshes its trigger-rule subscriptions |
| `mxt:set_artifact_owner` | Assigns the dropped artifact to an entity, then runs the artifact's `claim_action` |
| `mxt:apply_curse` | Applies a curse to an entity, with `mxt:loot` as the application source |
| `mxt:js` | Replaces the generated item stack with whatever a server script returns |

### `mxt:grant_ability`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ability` | Identifier | **required** | The ability to grant |
| `entity` | Entity selection | `this` | The entity that receives the ability |
| `source` | Identifier | `mxt:loot` | Source id recorded with the grant, so the ability can be revoked by source |

```json
{
  "function": "mxt:grant_ability",
  "ability": "example:fire_manual",
  "source": "example:fire_temple"
}
```

### `mxt:set_artifact_owner`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | Entity selection | `this` | The entity that becomes the artifact's owner |

If the item stack already belongs to another owner, nothing happens: the drop is left as it is and `claim_action` does not run.

When the ownership is written, `claim_action` runs once — it pays the same price and runs the same effects as claiming by long press (what claiming costs is that action's own default), because both paths go through the same claiming settlement. **This path does not judge `claim_condition`, though**: that condition is the long press gesture's own gate, and the loot table has already named an owner by its own judgement.

```json
{
  "function": "mxt:set_artifact_owner"
}
```

### `mxt:apply_curse`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Identifier | **required** | The curse to apply |
| `stacks` | Integer `1..256` | `1` | How many stacks of that curse to apply |
| `entity` | Entity selection | `this` | The entity that receives the curse |

```json
{
  "function": "mxt:apply_curse",
  "curse": "example:blood_oath",
  "stacks": 2
}
```

### `mxt:js`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback ID registered with `MxtLoot.function(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{
  "function": "mxt:js",
  "id": "example:bless",
  "params": {"multiplier": 3}
}
```

The callback receives the generated item stack and the loot context, and returns the item stack to keep: returning the argument as it came in leaves the drop alone, returning a new item stack replaces it, and returning `null` keeps the original item. When the callback is missing or fails, the item stack stays as it is and a line is logged.

## Putting It Together

A chest that drops a manual only for a player who already has the matching spirit root:

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
