---
title: Launch a Sword Aura
description: "Build a keyed ability out of the entity action mxt:spawn_sword_aura: launch position and velocity, the two ARGB colours and five geometry fields plus scale, lifetime, and what it does on impact."
---

# Launch a Sword Aura

`mxt:spawn_sword_aura` is an entity action: it spawns a flying sword aura at the **launch position of this activation**, with the tip following the acting entity's look direction. It is both a projectile action and something you can style — the blade and the flames have separate colours, and the sword's shape comes from five geometry fields and `scale`.

This page builds exactly one thing: a `mxt:active` ability that launches the aura when pressed, plus what it does when it hits a block. **The flame's looks and the renderer internals are not on this page**: the colour fields only decide how this one aura is drawn, and how it is drawn at all is handled on the client.

**Prerequisite:** [Define an Ability](./add-an-ability.md) is done. This page reuses the `mxt:active` shape that page established, the pack's existing `data/example/mxt/technique/azure_breath.json`, and the `example:qi` value.

## What You Are Building

| File | Job |
| --- | --- |
| `data/example/mxt/ability/sword_aura.json` | A `mxt:active` ability whose `entity_action` is `mxt:spawn_sword_aura`. |
| `data/example/mxt/technique/azure_breath.json` | *(edit)* Add the ability to `granted_abilities` so learning the technique hands it out. |

## Step 1 — A Keyed Ability That Launches the Aura

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5
  }
}
```

- `mxt:active` reads the four action fields, and the one that runs **against the caster** is `entity_action`; the aura belongs to the caster, so it goes here. Putting it in `bi_entity_action` is a different thing — that runs once per selected target and will not conjure a sword in front of anybody.
- The spawn point is the **launch position of this activation** and the direction is the acting entity's **look direction**. A wheel, command or script activation has no place of its own, so the spawn point is the caster's eye height; a talisman or a display stand does have one, and the aura leaves from there instead.
- `speed` is the velocity along the look direction, `1` by default, and must evaluate to a **finite positive number**; when it is not positive or not a finite number **nothing is spawned** and nothing is reported. Looking straight up or down still has a velocity, so firing at the sky is allowed.
- The aura is spawned on the server only: the client does nothing, and the entity it sees was synchronized to it.

Everything [Define an Ability](./add-an-ability.md) taught still applies: this ability can also carry `icon`, `cast_time`, `condition` and `charges`. The JSON above writes only the minimum.

## Step 2 — Looks: Two Colours and Five Sizes

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "blade_color": "#C778D9FF",
    "aura_color": "#CC78D9FF",
    "radial_flame": false,
    "length": 2.2,
    "blade_width": 0.3,
    "thickness": 0.08,
    "handle_length": 0.44,
    "guard_width": 0.52,
    "scale": 1.2
  }
}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `blade_color` | `#C778D9FF` | The **inner blade** colour. |
| `aura_color` | `#CC78D9FF` | The **outer aura** colour. |
| `radial_flame` | `false` | With `true` the flames flow outward from the blade instead of upward. |
| `length` | `1.65` | Blade length. |
| `blade_width` | `0.26` | Blade width. |
| `thickness` | `0.08` | Blade thickness. |
| `handle_length` | `0.44` | Handle length. |
| `guard_width` | `0.52` | Guard width. |
| `scale` | `1` | Overall scale. |

- **Both colours are ARGB**, the highest byte being the alpha, so the eight-digit form is `#AARRGGBB`: `#C778D9FF` is an alpha of `C7` plus the blade's `78D9FF`. There is **no** separate opacity field — write a smaller high byte for a more translucent sword.
- The five geometry fields and `scale` all take `0.01`–`32`, and **a value outside that range is refused at load time** — the whole definition fails to decode rather than being clamped.
- `scale` scales the whole sword while each geometry field scales its own part, and the two multiply. Whether to make the aura look longer with `length` (a longer blade alone) or with `scale` (handle and guard grow too) depends on the effect you want.

## Step 3 — Lifetime

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "lifetime": 40
  }
}
```

- `lifetime` is in ticks, `80` (four seconds) by default, range `1`–`72000`.
- When it runs out the aura **simply disappears**: no explosion, no trace, no action runs. It is just gone.
- The aura **has no gravity**, and the velocity it was spawned with is all the velocity it ever has: unless something else accelerates it, it flies in a straight line.
- With no `collide_action`, `lifetime` is the aura's only ending — it passes through blocks until the time runs out.

## Step 4 — What It Does on Impact

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "lifetime": 40,
    "collide_action": {
      "type": "mxt:explode",
      "power": 3.0,
      "create_fire": false
    }
  }
}
```

- **Only with `collide_action` does the aura disappear when it hits a solid block**; without it the aura passes straight through. The check runs every step, and what it hits is the solid block the aura is about to enter.
- The action runs **at the impact point**, and the acting entity is **the one that launched the aura** — so `caster_*` in a formula reads him, and actions that land on the acting entity such as `mxt:damage` apply to him. The position is the impact point, so sounds, particles, explosions and block actions all happen where it hit rather than at the caster's feet.
- When **the caster is no longer there** (logged off, chunks unloaded) the action does not run, and the aura disappears all the same.
- The collision looks at **solid blocks only**: it probes neither entities nor fluids. So the aura **passes straight through creatures**. To make it hit somebody, the impact action has to cover an area by itself — an `mxt:explode` explosion counts the entities nearby.
- `mxt:explode`'s own fields: `power` is **required** (a non-finite or negative value does nothing at all), `interaction` defaults to `mob` (with `none` it is a purely visual explosion that touches neither blocks nor entities), `indestructible` protects blocks matched by that condition, and `create_fire` defaults to `false`. The caster is recorded as the explosion's cause.
- `collide_action` is **one** entity action; to do several things, wrap it in an outer action or write an action array.

## Step 5 — Grant It So the Player Can Press It

Defining an ability does nothing by itself: some entity has to hold it. This page takes the technique route and adds the ability to the technique the pack already has:

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:qi_bolt", "example:qi_recovery", "example:sword_aura"]
}
```

This file rather than a new granting route, because in [Define an Ability](./add-an-ability.md) `azure_breath` is already this example's source of keyed abilities, and its `granted_abilities` has been the "live as soon as it is learned" list since that page. **Note that it is permanent**: whoever learns the technique holds this ability for good, with no level to climb first. To make the aura appear only after a certain level, put it in that level's `ability` under `configuration` instead.

`mxt:active` is one of the five **keyed** types, so it **enters the wheel pool automatically** and shows up there once the technique is learned (hold the wheel key, `R` by default, to find it); which of the player's twelve cells it sits in is their own layout, and the ability definition has no `slot` field.

## Verify

```text
(reopen the world)
/mxt registries validate                    → no codec errors
/mxt ability list                           → the entity holds this ability, sourced from the technique
/mxt ability cast example:sword_aura        → cast it by force (needs gamemaster)
```

1. Learn the technique first: `/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]` and right-click it, then `/mxt ability list` should show `example:sword_aura`.
2. Put the ability in one of the wheel's main cells, hold `R` to point at it and press `V` (the wheel use key by default): `8` `example:qi` is spent and the aura flies along your look direction. Fired into open air it should vanish on its own after 40 ticks, leaving nothing behind.
3. Fire it at a wall: the aura runs `mxt:explode` on the block it hits, an explosion appears there, and the aura disappears at the same moment. Add `"interaction": "none"` and try again — the explosion becomes looks only, touching neither blocks nor entities.
4. Delete the whole `collide_action` block, reopen the world and fire at the wall again: the aura passes through and flies until its `lifetime` runs out. That is what "no `collide_action` means no collision" looks like.
5. Change `blade_color` to `#40C778D9`, reopen the world and look again: the blade is now translucent. `blade_color` and `aura_color` change the inner and outer layers separately, and `radial_flame` set to `true` turns the flames outward instead of upward.
6. Write `speed` as `0` and reopen the world: it is not a finite positive number, so that cast spawns nothing at all (the command still reports a successful cast — do not read that as "an aura was spawned").

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Pressing it does nothing | `speed` is not a finite positive number, or the ability is of a type that does not run actions at all (`mxt:modifier` / `mxt:mount` / `mxt:storage` and friends do not read `entity_action`). |
| The aura flies through a block it should have hit | There is no `collide_action`. Without one it passes through everything until `lifetime` runs out. |
| The aura flies through a creature | The collision checks solid blocks only, not entities and not fluids. To hit somebody, give the impact action an area of its own. |
| The aura vanished at the wall and nothing happened | A `collide_action` is written but that action does nothing (an `mxt:no_op`, say), or the caster is no longer there (logged off, chunks unloaded) — the latter skips the action while the aura still disappears. |
| The explosion hurts you | The impact action's acting entity is the one who launched the aura and its position is the impact point, so firing into a wall at arm's length puts him inside the blast. If you do not want that, use an impact action that cannot hurt the caster back. |
| A geometry change did nothing, or the world refuses to load | The five geometry fields and `scale` all accept `0.01`–`32`, and anything outside is refused at **load time**, failing the whole definition rather than clamping. |
| A colour change did nothing | Both colours are **ARGB**, written as eight hexadecimal digits; six digits is not the form this field takes. |
| The aura disappears before it arrives | `lifetime` is too short (the default is `80` ticks, four seconds); raise it, up to `72000`. |
| The ability is not in the wheel after learning the technique | It was never granted (`granted_abilities` was not edited), or it is not a keyed type — the wheel pool only takes `mxt:active` / `mxt:channelled` / `mxt:targeted` / `mxt:storage` / `mxt:flight_control`. |
| The JSON edit changed nothing | Abilities are a data pack registry, read while the world loads; `/reload` does not re-read them. |

## Next

- [Action Types](../datapack/types/action/entity_action_types.md) — the full field tables for `mxt:spawn_sword_aura` and `mxt:explode`, and the other actions that can go into `collide_action`.
- [Define an Ability](./add-an-ability.md) — the main entry point for ability types, common fields, costs and granting routes.
- [Built-in Items and Components](../player-guide/items.md) — how artifacts, carriers and components hand a player an ability to press.
- [Number Providers](../datapack/types/number_provider_types.md) — fields like `speed` take a formula as well as a number.
