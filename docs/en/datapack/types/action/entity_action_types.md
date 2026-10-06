---
title: Entity Actions (entity_action_type)
description: Every built-in entity action type registered by the mod, and the JSON fields each type accepts.
---

# Entity Actions (entity_action_type)

An **entity action** performs one operation on a single entity. Whatever definition declares the action supplies the entity it acts on; the action itself only describes what to do with it. `type` is written on the action object, side by side with its fields, and its value is one of the ids listed on this page, written with the `mxt` namespace.

Entity actions are a Java (built-in) registry: `type` ids are fixed, and a data pack can neither add entries nor remove them. Adding a custom type means writing Java, or going through the KubeJS bridge — see the [KubeJS API](../../../kubejs/api-reference.md).

```json
{
  "type": "mxt:heal",
  "amount": 4
}
```

Actions are values inside other definitions, so they usually appear nested under a field such as `entity_action`:

```json
"entity_action": {
  "type": "mxt:apply_effect",
  "effect": "minecraft:speed",
  "duration_ticks": 200
}
```

Anywhere an entity action is accepted, an array is accepted too. The array is shorthand for `mxt:sequence` and runs its entries in the order they are written:

```json
"entity_action": [
  { "type": "mxt:extinguish" },
  { "type": "mxt:heal", "amount": 2 }
]
```

A key marked **required** in the Default column of the tables below must be written; every other entry is the value used when the key is left out. An optional action field left out defaults to `mxt:no_op`, so a miss such as writing `condition` but forgetting `action` is not reported at load — that entry simply does nothing.

::: info Field Types Are Shared
Many fields accept a [number provider](../number_provider_types.md) instead of a fixed number, and several types reference the shared [data types](../shared_data_types.md). Where a field takes a nested action or condition, that value uses the ids of the matching family.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists a type's fields interactively, which is handy for checking a field name without scrolling through the tables on this page.
:::

## Meta Action Types

Meta actions do not touch an entity themselves. They decide whether another entity action runs, which one runs, and in what order.

### `mxt:no_op`

Does nothing and takes no fields. It is the default value of every optional action field.

```json
{ "type": "mxt:no_op" }
```

### `mxt:js`

Hands the operation to an entity action handler registered through the KubeJS bridge.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The id written when the callback was registered with `MxtActions.entity(...)`. |
| `params` | JSON object | `{}` | Passed to the callback as-is. |

```json
{
  "type": "mxt:js",
  "id": "example:my_entity_action",
  "params": { "amount": 3 }
}
```

The script-side callback receives the entity, `params` and this dispatch's evaluation context. A missing callback, or one that throws, means this action does nothing and logs a line; the server does not crash.

### `mxt:sequence`

Runs a group of entity actions in order.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Entity action array | **required** | The actions, run in order. |

```json
{
  "type": "mxt:sequence",
  "actions": [
    { "type": "mxt:extinguish" },
    { "type": "mxt:heal", "amount": 2 }
  ]
}
```

Whether an earlier entry succeeds never interrupts a later one; the whole list runs through in the order it is written.

### `mxt:chance`

Runs `action` with probability `chance`, otherwise runs `fail_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Entity action | **required** | The action run when the roll succeeds. |
| `chance` | Float | **required** | The probability, `0`–`1`. |
| `fail_action` | Entity action | `mxt:no_op` | The action run when the roll fails. |

```json
{
  "type": "mxt:chance",
  "chance": 0.25,
  "action": { "type": "mxt:heal", "amount": 4 },
  "fail_action": { "type": "mxt:damage", "amount": 2 }
}
```

A `chance` outside `0..1` is refused at load. The roll is "a random number below `chance`", so `1` always succeeds and `0` never does. The dice are thrown once, and exactly one of `action` and `fail_action` runs.

### `mxt:if_else`

Runs `if_action` when the entity condition passes, otherwise runs `else_action`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | Entity condition | **required** | The condition to test. |
| `if_action` | Entity action | **required** | The action run when the condition passes. |
| `else_action` | Entity action | `mxt:no_op` | The action run when the condition fails. |

```json
{
  "type": "mxt:if_else",
  "condition": { "type": "mxt:always" },
  "if_action": { "type": "mxt:extinguish" }
}
```

At most one of the two branches runs. The condition gets the entity this action is acting on.

### `mxt:choice`

Picks one entry from a weighted list and runs it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `actions` | Entry array | **required** | The candidate entries. |

Every entry is:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Entity action | **required** | The action this entry runs when it is picked. |
| `weight` | Integer | `1` | Relative weight; a larger weight is picked more often. |

```json
{
  "type": "mxt:choice",
  "actions": [
    { "weight": 3, "value": { "type": "mxt:heal", "amount": 4 } },
    { "weight": 1, "value": { "type": "mxt:damage", "amount": 2 } }
  ]
}
```

An entry with a weight of `0` or less is never picked; when the whole table adds up to `0` (all `0` or negative, for instance) it falls back to drawing one entry with equal probability, so there is always a result. The picked entry runs once and no other entry runs at all.

## Action Types

### `mxt:dismount`

Makes the entity stop riding its vehicle.

No fields; the whole action is written as `{"type": "mxt:dismount"}`.

### `mxt:extinguish`

Puts out the fire on the entity.

No fields; the whole action is written as `{"type": "mxt:extinguish"}`.

### `mxt:heal`

Heals the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | The healing amount, in points. |

```json
{ "type": "mxt:heal", "amount": 4 }
```

Does nothing when the target is not a living entity, and heals nothing when the evaluated amount is not finite or is `0` or less.

### `mxt:damage`

Applies damage to the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Number provider | **required** | The damage amount, in points. |
| `damage_type` | Damage type id | none | The source this hit is built with. |
| `element` | Element id, or a list of `#tag` entries | `[]` | The element this hit is declared as. |

```json
{ "type": "mxt:damage", "amount": 4, "damage_type": "minecraft:magic" }
```

It is **unowned**, so no spirit-root element relation is settled and no attacker is recorded: the right shape for costs such as recoil, pill toxicity and environmental ticks. When it lands on somebody other than the caster, the caster is recorded as the attacker instead.

`damage_type` builds the source of this hit and `element` declares its element: with only `element` written, the first type that element claims is taken; with both written, the **first use** of this strike checks that the element really claims that type, logging one line for each mismatch. See the [damage system](/en/technical/damage).

Settled on the server only; a non-finite evaluated amount, or one of `0` or less, means nothing happens.

### `mxt:attach_element`

Adds to (or subtracts from) one element's accumulation on the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `element` | Element id | **required** | Which element's accumulation to add to or subtract from. |
| `amount` | Number provider | **required** | How much to add; a negative amount cleanses. |

```json
{ "type": "mxt:attach_element", "element": "example:fire", "amount": -5 }
```

Does nothing when the evaluated amount is not finite or is `0`. A positive amount goes through the **same** reaction pipeline a strike does, and enough of it fires an [element_reaction](../../json/element_reaction.md) — which is why a lava bath, taking a pill or a curse feeding fire over time all use it.

### `mxt:add_resource`

Adds a signed amount to a server-owned entity [resource](../../json/resource.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | Resource id | **required** | Which resource to change. |
| `amount` | Number provider | **required** | How much to add; may be positive or negative. |

```json
{ "type": "mxt:add_resource", "resource": "example:qi", "amount": 10 }
```

Does nothing when the evaluated amount is not finite.

### `mxt:grant_ability`

Grants an [ability](../../json/ability.md) under an explicit persistent source identity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ability` | Ability id | **required** | The ability to grant. |
| `source` | Identifier | **required** | The source name this grant is recorded under. |

```json
{
  "type": "mxt:grant_ability",
  "ability": "example:sword_focus",
  "source": "example:ritual"
}
```

### `mxt:grant_spirit_root`

Grants one [spirit root](../../json/spirit_root.md) to the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `spirit_root` | Spirit root id | **required** | The spirit root to grant. |

```json
{ "type": "mxt:grant_spirit_root", "spirit_root": "example:azure_root" }
```

Does nothing when the target is not a living entity.

### `mxt:grant_physique`

Grants one [physique](../../json/physique.md) once its holder condition, stacking and exclusivity checks all pass.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `physique` | Physique id | **required** | The physique to grant. |

```json
{ "type": "mxt:grant_physique", "physique": "example:flame_body" }
```

Does nothing when the target is not a living entity, and grants nothing when any one check fails.

### `mxt:remove_ability`

Removes only the ability grant that belongs to `source`, keeping grants from other sources.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ability` | Ability id | **required** | The ability to revoke. |
| `source` | Identifier | **required** | The source whose grant is revoked. |

```json
{
  "type": "mxt:remove_ability",
  "ability": "example:sword_focus",
  "source": "example:ritual"
}
```

### `mxt:remove_spirit_root`

Removes a held spirit root together with the abilities it granted.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `spirit_root` | Spirit root id | **required** | The spirit root to remove. |

```json
{ "type": "mxt:remove_spirit_root", "spirit_root": "example:azure_root" }
```

Does nothing when the target is not a living entity.

### `mxt:remove_physique`

Removes a held physique together with the abilities and attribute sources it granted.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `physique` | Physique id | **required** | The physique to remove. |

```json
{ "type": "mxt:remove_physique", "physique": "example:flame_body" }
```

Does nothing when the target is not a living entity.

### `mxt:apply_curse`

Applies a data pack [curse](../../json/curse.md) through the authoritative curse transaction.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse id | **required** | The curse to apply. |
| `stacks` | Number provider | `1` | How many stacks to apply. |
| `duration_ticks` | Number provider | none | How many ticks it lasts; left out, the curse decides for itself. |

```json
{ "type": "mxt:apply_curse", "curse": "example:burning_meridian", "stacks": 2 }
```

Nothing is applied when `stacks` is not finite, is below `1` or is above `256`; `stacks` is rounded to the nearest integer. A `duration_ticks` that is not finite, is negative or exceeds `Long.MAX_VALUE` is treated as if the key were absent.

### `mxt:apply_curses`

Applies several independently configured curses through the standard transaction.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curses` | Curse entry array | **required** | Each entry is applied on its own. |

```json
{
  "type": "mxt:apply_curses",
  "curses": [
    { "curse": "example:burning_meridian", "stacks": 2 },
    { "curse": "example:weak_spirit", "duration_ticks": 600 }
  ]
}
```

::: info Entry Shape and Defaults
Each entry carries **no** `type` key of its own:

| Entry Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse id | **required** | The curse to apply. |
| `stacks` | Number provider | `1` | How many stacks to apply. |
| `duration_ticks` | Number provider | none | How many ticks it lasts; left out, the curse decides for itself. |
:::

Entries do not affect each other: one entry that is not applied never stops the entries after it.

### `mxt:remove_curse`

Removes one named curse under the `cleansed` reason, so its `on_cleanse` runs.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse id | **required** | The curse to remove. |

```json
{ "type": "mxt:remove_curse", "curse": "example:burning_meridian" }
```

### `mxt:remove_curses_by_tag`

The cure side of the cleanse model: removes every held curse carrying **any one** of the given `mxt:curse` tags, under the same `cleansed` reason.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tags` | Tag array | **required** | Written as `"#namespace:path"`. |

```json
{ "type": "mxt:remove_curses_by_tag", "tags": ["#example:minor_curses"] }
```

A curse definition never declares what may cleanse it.

### `mxt:apply_effect`

Applies a vanilla status effect to a living entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | Status effect id | **required** | Which effect to apply. |
| `duration_ticks` | Number provider | **required** | How many ticks it lasts. |
| `amplifier` | Number provider | `0` | The effect amplifier. |

```json
{
  "type": "mxt:apply_effect",
  "effect": "minecraft:speed",
  "duration_ticks": 200
}
```

Does nothing when the target is not a living entity, when the duration or the amplifier is not finite, when the duration is below `1` or above `Integer.MAX_VALUE`, or when the amplifier is negative or above `255`.

### `mxt:teleport`

Moves the entity within the level it is currently in.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | Number provider | **required** | The target X coordinate. |
| `y` | Number provider | **required** | The target Y coordinate. |
| `z` | Number provider | **required** | The target Z coordinate. |

```json
{ "type": "mxt:teleport", "x": 0, "y": 64, "z": 0 }
```

All three coordinates must evaluate to finite values, otherwise the entity is not teleported.

### `mxt:knockback`

Adds a bounded velocity vector; collision and fall handling stay vanilla-owned.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | Number provider | **required** | The push along X. |
| `y` | Number provider | **required** | The push along Y. |
| `z` | Number provider | **required** | The push along Z. |

```json
{ "type": "mxt:knockback", "x": 0, "y": 1, "z": 0 }
```

All three components must evaluate to finite values, otherwise no push is added at all.

### `mxt:modify_storage`

Writes one declared storage kind of one host.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `family` | Registry id | **required** | The data pack registry the host lives in. |
| `id` | Identifier | **required** | The host itself. |
| `value` | Storage object | **required** | A whole storage object. |

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:sword_focus",
  "value": { "type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1 }
}
```

A kind the host does not declare, and the runtime's own cursors, are refused. It writes on the server only; when `family` is not a host family that saves storage, or the host does not declare the kind named in `value`, it logs one warning and writes nothing.

### `mxt:spawn_entity`

Spawns a registered entity at the given absolute coordinates in the acting entity's level, matching its rotation.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity_type` | Entity type id | **required** | Which entity to spawn. |
| `x` | Number provider | **required** | The absolute X coordinate. |
| `y` | Number provider | **required** | The absolute Y coordinate. |
| `z` | Number provider | **required** | The absolute Z coordinate. |

```json
{ "type": "mxt:spawn_entity", "entity_type": "minecraft:zombie", "x": 0, "y": 64, "z": 0 }
```

Spawns on the server only. All three coordinates must evaluate to finite values, otherwise nothing happens.

### `mxt:spawn_projectile`

Creates a projectile entity, assigns the acting entity as its owner, and gives it a formula-driven velocity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entity_type` | Entity type id | **required** | Which projectile to spawn. |
| `velocity_x` | Number provider | **required** | The velocity along X. |
| `velocity_y` | Number provider | **required** | The velocity along Y. |
| `velocity_z` | Number provider | **required** | The velocity along Z. |

```json
{
  "type": "mxt:spawn_projectile",
  "entity_type": "minecraft:arrow",
  "velocity_x": 0,
  "velocity_y": 0.5,
  "velocity_z": 3
}
```

Spawns on the server only. The spawn point is the activation's own place, and the rotation copies the acting entity's. All three velocity components must evaluate to finite values; when `entity_type` does not create a projectile, nothing happens.

### `mxt:spawn_sword_aura`

Spawns a sword aura at the activation's launch position. Its tip follows the acting entity's look direction and its speed comes from `speed`; the blade and the outer flames have separate ARGB colours.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `speed` | Number provider | `1` | Speed along the look direction; it must evaluate to a finite positive number. |
| `blade_color` | ARGB colour | `#C778D9FF` | Inner blade colour; the top byte is opacity. |
| `aura_color` | ARGB colour | `#CC78D9FF` | Outer aura colour; the top byte is opacity. |
| `radial_flame` | Boolean | `false` | When `true`, flames flow outward from the blade; otherwise they flow upward. |
| `length` | Float | `1.65` | Blade length, `0.01`–`32`. |
| `blade_width` | Float | `0.26` | Blade width, `0.01`–`32`. |
| `thickness` | Float | `0.08` | Blade thickness, `0.01`–`32`. |
| `handle_length` | Float | `0.44` | Handle length, `0.01`–`32`. |
| `guard_width` | Float | `0.52` | Guard width, `0.01`–`32`. |
| `scale` | Float | `1` | Overall scale, `0.01`–`32`. |
| `lifetime` | Integer | `80` | Lifetime in ticks, `1`–`72000`. |
| `collide_action` | Entity action | none | The action run when the aura hits a solid block. Writing it is what makes the sword disappear on impact; without it the sword passes through blocks. |

```json
{
  "type": "mxt:spawn_sword_aura",
  "speed": 1.5,
  "blade_color": "#C778D9FF",
  "aura_color": "#CC78D9FF",
  "radial_flame": false,
  "length": 1.65,
  "blade_width": 0.26,
  "thickness": 0.08,
  "handle_length": 0.44,
  "guard_width": 0.52,
  "scale": 1.0,
  "lifetime": 80
}
```

Spawns on the server only. The spawn point is the activation's launch position and the direction is the acting entity's look direction. The colour fields accept ARGB colours and do not read a separate opacity field. A dimension outside its range is refused at load; a `speed` that evaluates to a non-finite or non-positive value spawns nothing.

A sword spawned with `collide_action` checks the solid block it is about to enter every tick: on a hit it runs that action at the impact point and then disappears. The action runs as the entity that fired the sword, so `caster_*` formula variables read it and actions that land on the acting entity, `mxt:damage` among them, hit it as well. Its position is the impact point, which is where sounds, particles, explosions and block actions happen. When that entity can no longer be resolved (disconnected, its chunk unloaded) the action does not run and the sword still disappears. The behaviour is kept on the server only, is never sent to clients and does not change how the sword is drawn.

### `mxt:add_experience`

Adds experience points or levels to a player.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `points` | Integer | none | The experience points to add. |
| `levels` | Integer | none | The experience levels to add. |

```json
{ "type": "mxt:add_experience", "levels": 2 }
```

Players only. Either field may be left out, and whichever is written is added; leaving both out does nothing.

### `mxt:add_velocity`

Adds velocity to the entity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | Float | `0` | The vector's X component. |
| `y` | Float | `0` | The vector's Y component. |
| `z` | Float | `0` | The vector's Z component. |
| `space` | Coordinate space | `world` | The frame of reference the vector is resolved in. |
| `set` | Boolean | `false` | When `true`, sets the velocity outright instead of adding to it. |

```json
{ "type": "mxt:add_velocity", "y": 2 }
```

`space` is one of `world`, `local`, `local_horizontal`, `local_horizontal_normalized`, `velocity`, `velocity_normalized`, `velocity_horizontal` and `velocity_horizontal_normalized`. A name containing `local` uses the entity's view direction as the basis vectors and one containing `velocity` uses its current velocity; `horizontal` flattens the basis vectors onto the horizontal plane, and `normalized` uses the normalized basis vectors, so the result is no longer scaled by their length. `world` skips that conversion altogether and treats the three components as world-space directions.

Note that the vector is cleared to zero when a basis vector's length does not exceed `0.007` — standing still while using a `velocity` frame gives exactly that.

### `mxt:exhaust`

Adds exhaustion to a player.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `amount` | Float | **required** | The exhaustion to add. |

```json
{ "type": "mxt:exhaust", "amount": 0.5 }
```

Players only; an `amount` of `0` or less does nothing.

### `mxt:feed`

Restores food points and saturation.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `food` | Integer | **required** | The food points to restore. |
| `saturation` | Float | **required** | The saturation to restore. |

```json
{ "type": "mxt:feed", "food": 4, "saturation": 2.0 }
```

Players only.

### `mxt:gain_air`

Restores the entity's air.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Integer | **required** | The air to add. |

```json
{ "type": "mxt:gain_air", "value": 100 }
```

### `mxt:give_item`

Gives an item stack to a player: it runs the optional item action on a copy first, and prefers the requested slot when that slot is empty.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `stack` | Item stack template | **required** | The item to give, written as `{"id": ...}`, optionally with `count` and data components. |
| `item_action` | Item action | `mxt:no_op` | An item action run once against the copy. |
| `preferred_slot` | Equipment slot name | none | The slot to try first. |

```json
{ "type": "mxt:give_item", "stack": { "id": "minecraft:apple", "count": 1 } }
```

Players only. When the item action leaves the copy empty, nothing is given. When the slot written in `preferred_slot` is empty the stack goes into that slot, otherwise into the inventory.

### `mxt:play_sound`

Plays a sound event.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sound` | Sound event id | **required** | Which sound to play. |
| `category` | Sound category | none | Left out, the entity's own sound source is used. |
| `volume` | Float | `1` | The volume. |
| `pitch` | Float | `1` | The pitch. |

```json
{ "type": "mxt:play_sound", "sound": "minecraft:entity.player.levelup", "volume": 0.5 }
```

The sound plays at the action's position.

### `mxt:remove_effect`

Removes one status effect.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `effect` | Status effect id | **required** | Which effect to remove. |

```json
{ "type": "mxt:remove_effect", "effect": "minecraft:speed" }
```

Does nothing when the target is not a living entity.

### `mxt:set_fall_distance`

Sets the entity's fall distance.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `distance` | Float | **required** | The fall distance to set. |

```json
{ "type": "mxt:set_fall_distance", "distance": 0 }
```

### `mxt:set_no_gravity`

Sets whether the entity is affected by gravity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `no_gravity` | Boolean | `true` | When `true`, gravity does not affect it. |

```json
{ "type": "mxt:set_no_gravity" }
```

Note that `no_gravity` defaults to `true`, so omitting the field removes gravity from the entity rather than restoring it. Restoring gravity requires writing `"no_gravity": false` explicitly.

### `mxt:set_on_fire`

Sets the entity on fire for the given number of ticks.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ticks` | Integer | **required** | How many ticks it burns for. |

```json
{ "type": "mxt:set_on_fire", "ticks": 100 }
```

### `mxt:swing_hand`

Makes the entity swing one hand.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `hand` | Hand | **required** | `main_hand` or `off_hand`. |

```json
{ "type": "mxt:swing_hand", "hand": "main_hand" }
```

Does nothing when the target is not a living entity.

### `mxt:emit_game_event`

Emits a vanilla game event at the entity's position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `event` | Game event id | **required** | Which event to emit. |

```json
{ "type": "mxt:emit_game_event", "event": "minecraft:step" }
```

### `mxt:passenger_action`

Runs nested actions against matching direct or recursive passengers.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Entity action | `mxt:no_op` | Run against every matching passenger. |
| `bientity_action` | Bi-entity action | `mxt:no_op` | Run with the acting entity as actor and the passenger as target. |
| `bientity_condition` | Bi-entity condition | none | Filters the passengers. |
| `recursive` | Boolean | `false` | When `true`, indirect passengers are included; otherwise only direct passengers are looked at. |

```json
{
  "type": "mxt:passenger_action",
  "action": { "type": "mxt:extinguish" }
}
```

Passengers are handled one at a time: `bientity_condition` is tested first, and only when it passes do `action` and then `bientity_action` run.

### `mxt:block_action`

Runs a [block action](block_action_types.md) at the acting entity's block position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Block action | **required** | The action run at that position. |

```json
{
  "type": "mxt:block_action",
  "action": { "type": "mxt:set_block", "block": "minecraft:air" }
}
```

### `mxt:self_bientity_action`

Applies a [bi-entity action](bientity_action_types.md) with the current entity as both actor and target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Bi-entity action | **required** | The action whose two ends are both this entity. |

```json
{
  "type": "mxt:self_bientity_action",
  "action": { "type": "mxt:heal_target", "amount": 2 }
}
```

### `mxt:equipped_item_action`

Runs an [item action](item_action_types.md) against one equipped stack.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `slot` | Equipment slot name | **required** | Which slot's stack to take. |
| `action` | Item action | **required** | The action run against that stack. |

```json
{
  "type": "mxt:equipped_item_action",
  "slot": "mainhand",
  "action": { "type": "mxt:damage_item", "amount": 1 }
}
```

Does nothing when the target is not a living entity. An empty slot is fine — the action still runs, and what an empty stack means is up to the item action itself.

### `mxt:riding_action`

Runs nested actions against matching vehicles, optionally along the whole riding chain.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action` | Entity action | `mxt:no_op` | Run against every matching vehicle. |
| `bientity_action` | Bi-entity action | `mxt:no_op` | Run with the acting entity as actor and the vehicle as target. |
| `bientity_condition` | Bi-entity condition | none | Filters the vehicles. |
| `recursive` | Boolean | `false` | When `true`, it walks the whole riding chain upwards; otherwise only the direct vehicle is looked at. |

```json
{
  "type": "mxt:riding_action",
  "action": { "type": "mxt:set_on_fire", "ticks": 60 }
}
```

Starting from the direct vehicle, each step up tests `bientity_condition` first, and only when it passes do `action` and `bientity_action` run. With no vehicle, nothing happens.

### `mxt:explode`

Creates an explosion at the entity's position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `power` | Float | **required** | The explosion power. |
| `interaction` | Vanilla explosion interaction type | `mob` | For example `mob` or `none`. |
| `indestructible` | Block condition | none | Matching blocks are protected from the explosion. |
| `create_fire` | Boolean | `false` | Whether the explosion leaves fire behind. |

```json
{ "type": "mxt:explode", "power": 3.0, "create_fire": true }
```

Explodes on the server only. Nothing happens when `power` is not finite or is negative. The caster is recorded as the cause of this explosion.

### `mxt:spawn_particles`

Spawns particles around the entity, optionally shown only to viewers that match a bi-entity condition.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `particle` | Particle type | **required** | Which particle to spawn. |
| `bientity_condition` | Bi-entity condition | none | Filters which viewers receive it. |
| `count` | Integer | **required** | How many to spawn; must not be negative. |
| `speed` | Float | `0` | The particles' initial speed. |
| `force` | Boolean | `false` | When `true`, the distance limit does not apply. |
| `spread` | Three floats | `[0.5, 0.5, 0.5]` | The spread on the three axes. |
| `offset_x` | Float | `0` | The X offset from the action's position. |
| `offset_y` | Float | `0.5` | The Y offset from the action's position. |
| `offset_z` | Float | `0` | The Z offset from the action's position. |

```json
{ "type": "mxt:spawn_particles", "particle": { "type": "minecraft:flame" }, "count": 10 }
```

Sent on the server only. The viewer list is filtered per viewer with `bientity_condition`. `spread` is first scaled by the entity's own width, eye height and width, and then used as the velocity spread.

### `mxt:spawn_effect_cloud`

Creates a vanilla area effect cloud at the acting entity's position.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | Float | `3` | The cloud's radius. |
| `radius_on_use` | Float | `-0.5` | How much the radius changes after each activation. |
| `wait_time` | Integer | `10` | How many ticks to wait after spawning before it starts taking effect. |
| `effects` | Status effect array | `[]` | The effects the cloud carries. |

```json
{ "type": "mxt:spawn_effect_cloud", "radius": 4, "wait_time": 20 }
```

Spawns on the server only.

### `mxt:spawn_lightning`

Strikes a coloured lightning bolt at the acting position plus an offset; what the bolt does afterwards is up to the vanilla bolt's own behaviour — colour aside, it **is the vanilla lightning bolt**: damage, ignition, lightning-rod charging, copper oxidation, thunder, the sky flash, and the villager-to-witch, pig-to-zombified-piglin and charging-creeper conversions all work as usual.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `offset_x` | Number provider | `0` | The X offset from the acting position. |
| `offset_y` | Number provider | `0` | The Y offset from the acting position. |
| `offset_z` | Number provider | `0` | The Z offset from the acting position. |
| `color` | Colour | `0x737380` | The bolt colour, written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too); always treated as opaque. |
| `alpha` | Float | `0.3` | The glow strength, `0`–`1`. |
| `thickness` | Float | `1` | The strand thickness, `0.1`–`4`. |
| `palette` | RGB colour array | `[]` | A gradient of at most `16` entries. |
| `damage` | Number provider | `5` | The lightning damage, matching vanilla. |
| `visual_only` | Boolean | `false` | When `true`, the bolt is decorative only: it strikes but settles no damage and sets nothing on fire. |
| `cause` | Boolean | `true` | Attributes it to the player. |

```json
{ "type": "mxt:spawn_lightning", "color": "#8A2BE2", "damage": 8 }
```

Inside a tribulation timeline those fields go under that beat's `action`:

```json
{
  "timeline": [
    {
      "type": "mxt:action",
      "action": {
        "type": "mxt:spawn_lightning",
        "palette": ["#7A5CFF", "#66CCFF"],
        "alpha": 0.45,
        "thickness": 1.6,
        "damage": 12
      }
    },
    { "type": "mxt:idle", "duration": 20 }
  ]
}
```

It needs no fields at all: the bolt lands on the acting position itself, since the offsets default to `0`.

`cause` attributes the bolt to the player, who then becomes the source of the damage it deals, and it can trigger the vanilla `channeled_lightning` advancement; for `cause` to take effect the acting entity itself has to be a player.

All four number fields (the three offsets and `damage`) must evaluate to finite values, otherwise no bolt is struck. A `damage` that evaluates negative is treated as `0`.

It is an `EntityAction`, so a tribulation timeline, the success and failure behaviours, per-entity formation behaviours, abilities, contracts and secret realms — any `EntityAction` slot — can use it.

To strike a bolt directly without touching a data pack, use `/mxt lightning` (top-level alias `/lightning`); its arguments match the table above one to one (a gradient is written `palette 7A5CFF,66CCFF` in the command, without `#`). See [Commands](/en/player-guide/commands).

::: info Colours and Gradients
`color` accepts the same form as an aura colour (`#RRGGBB`; an integer or an `[r,g,b]` float array is accepted too), and its default is the vanilla cold white (rounded to 8 bits per channel); `alpha` is `0..1`, and `thickness` is `0.1..4`.

`alpha` is **brightness**, not opacity: vanilla lightning uses additive blending, and the vertex colour's `RGB × alpha` is its glow strength, so turning it up gives a harsher bolt and turning it down a dimmer one.

`palette` **replaces** the single `color` with a gradient: it is a group of RGB colours written the same way as `color`, the first at the top of the strand and the last at the ground, at most 16 entries. Rendering takes a colour per segment from the bolt column's nine horizontal seams, interpolating linearly between adjacent entries (one entry = flat colour, two = a gradient between the ends, more = several gradient segments); the four overlay layers and the two forks read the same set of seams, so a fork matches the trunk at the height where it leaves. `alpha` is still one glow value shared by the whole bolt rather than one per colour.

An illegal colour or a list longer than 16 fails at **decode time** instead of being dropped silently: a typo in a gradient should be visible.
:::

### `mxt:modify_lifespan`

Writes a number of your own choosing into the lifespan ledger.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | String | `add` | `add` or `set`. |
| `amount` | Number provider | **required** | The amount, in ticks. |

```json
{ "type": "mxt:modify_lifespan", "amount": -1200 }
```

This is the **only** write in a data pack that puts numbers of your own choosing into the lifespan ledger; reopening the ledger is what `mxt:reincarnate` below is for.

`add` accepts a negative amount, which takes life away (how a curse shortens a lifespan), while a positive one raises both the remaining life and its ceiling. An `add` of `0` does nothing at all and never opens a ledger of `0` for a body that was never accounted for. `set` rewrites both numbers at once, so a hard-coded constant under `set` must be non-negative or loading reports an error.

A non-living target is a silent no-op. A non-finite evaluated amount does nothing.

**The write lands even while the lifespan master switch is off**, because that switch only decides whether time flows. See [Lifespan](/en/player-guide/lifespan).

### `mxt:modify_pill_toxicity`

Rewrites the pill toxicity accumulated on the target.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | String | `add` | `add` or `set`. |
| `amount` | Number provider | **required** | The amount. |

```json
{ "type": "mxt:modify_pill_toxicity", "mode": "add", "amount": -30 }
```

This is the **only** write in a data pack that puts numbers of your own choosing into the toxicity ledger. A negative `add` is how a pack clears toxicity, and the value never goes below `0`; a hard-coded constant under `set` must be non-negative or loading reports an error. A non-living target is a silent no-op, and a non-finite evaluated amount does nothing.

Toxicity is normally accumulated by the consumption rules of [pill](../../json/pill.md); **Server Config → Alchemy → Natural toxicity decay per second** defaults to `0`, which means it never fades on its own.

### `mxt:reincarnate`

Makes the target be **reborn** on the spot.

No fields; the whole action is written as `{"type": "mxt:reincarnate"}`.

It first runs the reset list on the **Server Config → Reincarnation** tab (the very same one **On expiry** set to `reincarnate` runs) and then reopens the ledger from **Server Config → Lifespan → Base lifespan** (with that at `0` the ledger is closed and the body reads as "not accounted for" again).

It is the same entry point the `/mxt lifespan reincarnate` command and KubeJS calls use, so it also runs **while the lifespan master switch is off** — that is a verdict handed down on the spot rather than time passing. A non-living target is a silent no-op, like `mxt:modify_lifespan`.

`LifeSpanRebirthEvent` fires `Pre` before and `Post` after: `Pre` can be cancelled, and cancelling means the whole rebirth does not happen and the body is left exactly as it was; a lifespan running out does **not** fire these two (that path fires `lifespanEnd`), see [MxtEvents](/en/kubejs/api/events). This is exactly what content such as a reincarnation pill, a rebirth tribulation or a foundation-washing curse needs, since otherwise a data pack can only wait for a lifespan to run out.

### `mxt:cultivate`

Makes the target **start cultivating**.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `action?` | Method id | Let the pick decide | Names one [`cultivation`](../../json/cultivation.md); with none written the applicable method of the highest `priority` is picked. |

```json
{ "type": "mxt:cultivate" }
{ "type": "mxt:cultivate", "action": "example:azure_meditation" }
```

This is the **same start path** the player's own cultivation key uses: a named method still has to pass its own `start_condition` and `cultivate_condition` ("does this tick yield anything"; `tick_condition` answers "does the session carry on" and takes no part in the pick), and when nothing applies, nothing happens.

**There is no return value, so every failure is silent**: already cultivating, still on cooldown, or conditions unmet all just mean "it did not start". To say something, branch in the data pack with `mxt:if_else` and [`mxt:cultivating`](../condition/entity_condition_types.md).

Server side only; a non-living target is a silent no-op. Together with the player's key this is the only way to start a body cultivating.

### `mxt:stop_cultivating`

Makes the target **stop the method it is running**, writing that method's own `cooldown`.

No fields; the whole action is written as `{"type": "mxt:stop_cultivating"}`.

It is the same path the player's own key uses to stop (including returning a floating item, clearing breakthrough listeners and lifting the movement restriction). A target that is not cultivating is a silent no-op; server side only, and living entities only.

::: info Nested Values
`mxt:if_else` takes an [entity condition](../condition/entity_condition_types.md); `mxt:passenger_action` and `mxt:riding_action` take an entity action, a [bi-entity action](bientity_action_types.md) and a [bi-entity condition](../condition/bientity_condition_types.md); `mxt:explode` filters protected blocks with a [block condition](../condition/block_condition_types.md).
:::
