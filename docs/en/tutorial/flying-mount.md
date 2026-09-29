---
title: Flying Mounts
description: "Turn an item into a flying mount: the mount definition, the flying skill, the two aura fuel bills, and a full take-off, flight and landing check."
---

# Flying Mounts

This page is also a sub-tutorial of [Storage and Spirit Vessels](./storage-and-spirit-vessels.md), but it has nothing to do with storage or with the spirit vessel: **flight is another declaration for the same item**, and the three each mind their own business.

- The **artifact** (`artifact`) declares "I can fly" — it references a mount ability.
- The **mount** (`mxt:mount`) says what flying looks like, how fast it goes, how many ride it, and what it burns.
- The **flying skill** (`mxt:flight_control`) is **the press itself**, granted by a standing source such as a technique, and **never written on the artifact** (the reason is in Step 3).

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/ability/azure_sword_mount.json` | The mount: speed, seats, per-tick fuel, appearance. |
| `data/example/mxt/ability/azure_sword_flight.json` | The flying skill: which hand to take it from, the speed multiplier, the price of one take-off. |
| `data/example/mxt/artifact/azure_sword.json` | The artifact definition: claims the item, hangs the mount on it, declares how much aura it can store. |

Granting the skill needs no new file: one command or one technique is enough (see Step 4).

## Step 1 — The Mount (`mxt:mount`)

```json
// data/example/mxt/ability/azure_sword_mount.json
{
  "type": "mxt:mount",
  "speed": 0.12,
  "seats": 2,
  "costs": [{ "id": "example:qi", "amount": 0.1 }],
  "mount_action": {
    "on_mount": { "type": "mxt:play_sound", "sound": "minecraft:item.trident.riptide_1" },
    "on_dismount": { "type": "mxt:play_sound", "sound": "minecraft:item.trident.riptide_3" }
  },
  "trail": {
    "particle": { "type": "minecraft:end_rod" },
    "count": 2,
    "moving_only": true
  }
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `speed` | A number or a formula string | **required** | How many blocks it flies per tick, clamped to `0.01`–`1.0` after evaluation. |
| `seats` | An integer | `1` | Total seats including the driver, from 1 to 4. |
| `sit` | bool | `false` | One pose for the whole vehicle; `false` is standing. |
| `render` | A renderer | `mxt:item` | Which renderer draws it. |
| `entity_type` | An entity type id | `mxt:flying_sword` | Which entity flies it. |
| `display` | `{translation, rotation, scale}` | That renderer's own default pose | How the model sits relative to the mount's origin. |
| `width` / `height` | A number | `0.35` / `0.12` | Collision box width and height. |
| `step_height` | A number | `0` | Step height. |
| `seat_offsets` | A list of vectors | `0.8` behind per seat, the first at `0.65` high | Where each seat lands, in blocks. |
| `mount_action` | `{on_mount, on_dismount, tick}` | All three are `mxt:no_op` | Three behaviours, all of them run on the driver. |
| `trail` | An object | Not writing it means no trail | Trail particles the mount emits itself. |

Four rules are worth remembering first:

- **It is never activated**, so it takes no cell on the wheel: the thing that is really pressed is the flying skill (Step 2).
- The top-level `costs` is the **fuel of every tick**: the aura stored in the artifact itself is spent first, and only the remainder falls to the driver; if neither side can pay, the flight lands.
- The top-level `condition` is **re-checked every tick**, and failing it lands.
- Hitting a block or the ground lands: the mount really moves every tick, and the landing test is the collision flag it leaves behind.

## Step 2 — The Flying Skill (`mxt:flight_control`)

```json
// data/example/mxt/ability/azure_sword_flight.json
{
  "type": "mxt:flight_control",
  "name": "Flying Art",
  "hand": "either",
  "speed_multiplier": 1.0,
  "costs": [{ "id": "example:qi", "amount": 5 }]
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `hand` | `main` / `off` / `either` | `either` | Which hand the mount is looked for in, the main hand first. |
| `speed_multiplier` | A number or a formula string | `1` | Multiplied into the mount's `speed`. |
| `costs` | A `Cost` array | `[]` | The price of one take-off, paid by whoever presses. |
| `cooldown` | A number or a formula string | `0` | The take-off cooldown. |
| `condition` | A condition | Always true | The gate before the press. |

It is **a switch**: one press turns it on, a second turns it off. It **needs no carrier** — what is pressed is you, and the mount is looked for in your hands.

## Step 3 — Hanging It on the Artifact

```json
// data/example/mxt/artifact/azure_sword.json
{
  "items": "minecraft:diamond_sword",
  "abilities": ["example:azure_sword_mount"],
  "spirit_capacity": { "example:qi": 60 },
  "require_owner": false
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | An item ID, a `#` tag, or an array | **required** | Which items this definition claims. |
| `abilities` | An array of ability IDs or a `#` tag | `[]` | Here it is **the mount only**. |
| `spirit_capacity` | A map of aura IDs to caps | `{}` | Which auras this artifact can store, and how much of each. |
| `require_owner` | bool | `false` | When true, an unclaimed artifact refuses flight and storage alike. |

**Why the flying skill is not written here.** At the moment of take-off the artifact is taken into the mount and leaves your hand, and its grant is a "only while carried" one — with the skill in this artifact's `abilities`, that cell vanishes on the spot once you are airborne and you can never press "land" again (all that is left is vanilla's sneak-dismount). So **the mount goes on the artifact and the skill goes to a standing source**.

`spirit_capacity` decides how much aura this artifact **itself** can store, which is where the first bill of every tick comes from: a long right click (20 ticks by default) pours aura in, up to the number written here. The nourishment bonus is multiplied in by the pipeline, so do not multiply it again in a formula. It flies without it too: the whole bill then falls on the driver.

`require_owner` decides whether it has to be claimed first: with `false` (the default) an unclaimed artifact is usable by anyone, and once it has an owner only the owner may use it; with `true` an unclaimed artifact refuses outright. Claiming is a long right click, and its price is written in `claim_action` (4 health by default; free means explicitly writing `{"type": "mxt:no_op"}`).

## Step 4 — Granting the Skill

The skill needs a source. The proper way is to write it into a technique's (or a spirit root's, or a physique's) `granted_abilities` (only the lines to add are shown), see [Define a Technique and Its Levels](./define-a-technique.md):

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_sword_flight"]
}
```

Testing can just use a command too (gamemaster permission needed):

```text
/mxt ability grant @s example:azure_sword_flight
/mxt ability list
```

`/mxt ability list` lists this skill together with **the sources still maintaining it**. Once granted it shows up in the **ability pool on the right of the wheel editor** — pin it to a cell of the main wheel and that cell becomes the take-off / landing switch.

## Step 5 — Take-off, Flight and Landing

**Take-off**: hold that artifact **in a hand** (the main hand first, then the off hand; in the inventory or a Curios slot does not count) and press that cell. The artifact is taken into the mount and you climb on.

`seats` is **the total head count, the driver included**, and the driver has to be you (the movement comes from your input); every other seat is open to anyone — right-click the mount to board, and they are all dropped with you when you land.

While flying:

| Action | Key |
| --- | --- |
| Climb | Jump |
| Sink | The descend key (`X` by default, rebindable) |
| Accelerate | Sprint (horizontal speed ×1.5) |
| Forward, back, left, right | Along the look direction by default (**Server Config → Flight → Fly Where You Look**) |
| Land | Press that cell again, or vanilla sneak (`Shift`) |

**The two bills are paid separately**: one take-off equals the skill's `costs`, paid by whoever presses, through the shared gate (granted → cooldown → condition → costs); every tick equals the mount's `costs`, the artifact's own store first and only the remainder falling to the driver. Leave the skill's `costs` empty to make take-off free, and the mount's `costs` empty to make every tick free.

**How the trip ends**: hitting a block or the ground, the `condition` failing, neither side able to pay the fuel, or the driver themselves logging out / dying / being pushed out of seat 0. The first three are a landing and the last is the mount vanishing on the spot — **the artifact comes back to you either way** (or lands where the mount vanished if you are offline), every rider is dropped with it, and a passenger never takes over.

Seat offsets are tuned by eye: `/mxt flight fill` (gamemaster permission needed) fills every free seat with no-AI zombies as references, and they vanish when the trip ends.

## Step 6 — Appearance and What Actually Flies

`render` has three tracks:

- `mxt:item` (the default): draws the item model of the carried item, the item frame context.
- `mxt:geckolib`: a GeckoLib model and its animations, which needs GeckoLib on the client; without it the client falls back to the item model and logs one warning.
- A type a content mod registered: see [MountRenderer](../java/interfaces/mount/renderer.md).

`display` is optional; leave it out and that track's own default pose is used. The seat positions are not part of it — those are `seat_offsets`.

`entity_type` decides **which entity flies**: leave it out and the framework's own `mxt:flying_sword` is used. Writing another entity type means that type has to implement the [mount contract](../java/interfaces/mount/vehicle.md) — movement, seats, boarding and drawing all belong to it, while the framework only writes the speed to it, pays the fuel and tests for landing. That is how "boat / palanquin / airship" mounts are built.

## Verify

Data pack definitions are read while the world loads, so leave to the title screen and open the world again after editing them.

1. Give yourself an item the definition claims (`minecraft:diamond_sword`) and hold it in your main hand.
2. Grant the skill with a command, or learn that technique, then `/mxt ability list`: the skill is on the roster, and its source is the command or that technique.
3. Open the wheel editor: it appears in the ability pool on the right, so pin it to a cell of the main wheel.
4. Press that cell: the artifact leaves your hand (it went into the mount), you are riding it, and the cell turns green (it is on).
5. Try it in the air: Jump climbs, the descend key sinks, Sprint accelerates, and looking up while moving forward climbs (turn off **Server Config → Flight → Fly Where You Look** and all four directions stay level).
6. Press vanilla sneak to land: the mount vanishes and the artifact is back in your inventory.
7. Fuel: long right-click the artifact to pour a little aura in first, then fly again — the per-tick cost comes out of the artifact first; delete `spirit_capacity`, burn the artifact empty and carry none of that aura yourself, and it lands at some point for want of fuel.
8. Hit a wall: fly at a block and it lands.
9. Seats: write `seats` as `2`, use `/mxt flight fill` to see where both seats land, then change `seat_offsets` to line them up.
10. `/mxt registries validate` to re-check the registries, or look in the log for refused definitions.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| That cell is not in the wheel pool at all | The skill was never granted. The artifact does not grant it — the skill needs a standing source (a technique / a spirit root / a physique / a command). |
| The press reports "nothing in hand can fly" | The item in hand is not claimed by any artifact definition, or that mount was not written into this definition's `abilities`. |
| The press reports "that artifact does not answer to you" | This definition's `require_owner` is `true` and the artifact has not been claimed yet. |
| The press is refused with "its numbers are misconfigured" | `speed` does not evaluate to a finite positive number (it does not work out, it is `≤ 0`, or the skill's multiplier cancels it). |
| It lands the moment it takes off | The `condition` fails its per-tick re-check, or neither side can pay the fuel. |
| That cell vanished after take-off and it will not come down | You wrote the skill into the artifact's own `abilities`. Its grant stops working once the artifact is taken into the mount (Step 3). |
| The artifact is in a Curios slot and the press finds no mount | Take-off only looks at the two hands, the main hand first and then the off hand. |
| It still looks like an item model | `render` says `mxt:geckolib` and this client has no GeckoLib: it falls back to the item model and logs one warning, which is not an error. |
| The seat positions do not line up | `seat_offsets` has to be tuned by eye, using `/mxt flight fill` to build references; it takes four entries at most. |
| `entity_type` names an entity type that does not work as a mount | That type does not implement the mount contract: take-off is refused (the action bar says "it cannot be ridden right now"), and the log names the type, once per type. Leaving `entity_type` out uses the framework's own `mxt:flying_sword`. |

## Next

- [Storage and Spirit Vessels](./storage-and-spirit-vessels.md) — back to the parent page: the spirit vessel.
- [Storage](./storage.md) — the other sub-tutorial: hanging a storage ability on the same item.
- [Ability Types](../datapack/types/other/ability.md) — the full field tables for `mxt:mount` and `mxt:flight_control`.
- [Artifact (artifact)](../datapack/json/artifact.md) — `abilities` / `spirit_capacity` / `require_owner` and claiming with a long press.
- [Define a Technique and Its Levels](./define-a-technique.md) — writing the skill into `granted_abilities` so learning the technique is what lets you fly.
- [MountRenderer](../java/interfaces/mount/renderer.md) / [MountVehicle](../java/interfaces/mount/vehicle.md) — draw an appearance of your own, or ship a mount body of your own.
- [Wheel, Resource Bars and Aura HUD](../player-guide/keys-and-hud.md) — how the take-off cell is pinned and how the switch is shown.
- [/flight](../player-guide/commands/flight.md) — the full write-up of `/flight fill`.
