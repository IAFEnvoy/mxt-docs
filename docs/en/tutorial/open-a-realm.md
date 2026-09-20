---
title: Open a Realm Instance
description: Write a realm instance template — how the dimension is generated, where its border is, where players land, who may enter and claim it, when it is deleted, and what aura, formations and rifts do inside.
---

# Open a Realm Instance

A realm instance is a pocket world that is either throwaway or claimable: **the definition is only a template**, and every instance of it is a real, separate runtime dimension. Players can leave and come back to the same terrain — for as long as somebody claims it.

::: warning Two different commands

`/mxt realm` only manages the **linear realm chain** (`/mxt realm set <realm>`). Realm *instances* are managed by **`/mxt realm_instance …`**. This tutorial is about the latter.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/realm_instance/trial_realm.json` | A template: generation, border, landing points, lifetime. |

## Step 1 — Making the World

```json
// data/example/mxt/realm_instance/trial_realm.json
{
  "generation": {
    "type": "mxt:flat",
    "preset": "1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"
  }
}
```

`generation` is the **only required** field, and `type` decides the rest:

| `type` | Parameters | Effect |
| --- | --- | --- |
| `mxt:flat` | `preset` (required), `dimension_type` (`minecraft:overworld`), `structures` (`true`) | A superflat world; the part after `;` in the preset is the biome. The least fuss for tutorials and tests. |
| `mxt:void` | `biome` (`minecraft:the_void`), `dimension_type`, `structures` (`false`) | An empty world: **no ground at all**, so landing points drop into the void unless a structure catches them. |
| `mxt:stem` | `stem` (a `LevelStem` id) | Build a brand-new dimension from an existing dimension type, biome source and noise settings. |
| `mxt:template` | `template`, `stem` | Copy finished terrain from a template directory on the server. |
| `mxt:existing` | `dimension` | Build nothing and use a real dimension; such an instance is never unloaded or deleted. |

A realm's dimension id is derived from the definition and an index: `<definition namespace>:realm/<definition path>/<index>`, counting from 0 — so one template can open many worlds that never touch each other.

## Step 2 — Drawing the Border

```json
"border": {
  "center": [0, 0],
  "size": 256,
  "warning_blocks": 5,
  "warning_time": 15,
  "damage_per_block": 0.4,
  "safe_zone": 3.0
}
```

| Field | Default | Effect |
| --- | --- | --- |
| `center` | `[0.0, 0.0]` | Border centre, written as `[x, z]` (exactly two numbers). |
| `size` | `29999984.0` | The **diameter**; must be positive and finite. |
| `warning_blocks` / `warning_time` | `5` / `15` | How far out the warning starts, and how many seconds it lasts. |
| `damage_per_block` / `safe_zone` | `0.2` / `5.0` | Damage per block once past the safe zone. |

What gets written is the vanilla world border, so the warning, the tint and the damage are all vanilla behaviour; the mod adds no logic of its own on top. **A missing `border` still writes vanilla's defaults explicitly** — deliberately, so a fresh dimension cannot inherit a shrunken border from the overworld.

## Step 3 — Where Players Land

With no `entry` the landing point is random (radius 40% of the border diameter, centred on the border, `y` from the surface). To control it, write a list:

```json
"entry": [
  {
    "pos": [0, 80, 0],
    "yaw": 0, "pitch": 0,
    "enter_condition": {"type": "mxt:always_true"},
    "enter_denied_message": {"text": "You are not ready to set foot here"}
  },
  {
    "random_center": [64, 64], "random_radius": 12, "spread": 4.0, "weight": 3,
    "enter_action": {"type": "mxt:play_sound", "sound": "minecraft:block.beacon.activate"}
  }
]
```

| Field | Default | Effect |
| --- | --- | --- |
| `pos` | none | An exact landing point; when present it is used as written and **`y` is not rewritten**. |
| `yaw` / `pitch` | the entrant's own angles | Facing on arrival. |
| `random_center` / `random_radius` | border centre / `size × 0.4` | With no `pos`, a random point in this circle; `y` is taken from the surface after structures are placed. |
| `spread` | `3.0` | How far a group spreads out (the **largest** value across all entry points wins). |
| `weight` | `1` | Relative weight between several entry points. |
| `enter_condition` / `exit_condition` | always true | The gate for entering and for leaving; `exit_condition` only constrains a **voluntary** exit. |
| `enter_denied_message` / `exit_denied_message` | none (the failure code is shown) | What the player is told when a gate refuses them. |
| `enter_action` / `exit_action` | `mxt:no_op` | Run after landing / before being sent back. |

The first person in lands on the **anchor** (the chosen entry point is persisted); everyone after that spreads out on a hexagon so a group does not pile up.

## Step 4 — Who May Enter, Who Claims It, When It Dies

| Field | Default | Effect |
| --- | --- | --- |
| `owned` | `false` | When true, **the first entrant becomes the owner** and the instance keeps its terrain (unloaded, not deleted). When false, the last member leaving deletes the whole instance and its terrain. |
| `max_instances` | `1` (`1..256`) | How many instances **this definition in total** may have (dormant claimed ones included); over the limit reports `NO_FREE_INSTANCE`. |
| `max_members` | unlimited | How many players **one instance** may hold at a time. |
| `duration_ticks` | `0` (never expires) | Instance lifetime; on expiry the online members are sent out and the instance is retired. |

The difference between the two kinds is worth stating plainly:

- `owned: true`: when the owner logs off and everyone leaves, the world merely **goes dormant** — terrain, blocks, builds and contents stay, and the next visit reopens it under the same seed. It survives a server restart, but the member table is cleared by one (`loaded=false` in `/mxt realm_instance list` is exactly that).
- `owned: false`: the last member leaving **deletes the whole instance directory** (including that dimension's aura zones and formations). Right for a trial you run once and walk away from.

Expiry is scanned on the overworld clock only (every 20 ticks); on expiry every online member leaves — **`exit_condition` is not consulted** — and offline members are simply dropped from the table. For a claimed instance, expiry only pauses the timer and unloads it; the next visit starts the clock again.

## Step 5 — Putting Structures Inside (Optional)

```json
"structures": [
  {
    "nbt": "example:trial_platform",
    "pos": [0, 64, 0],
    "rotation": "clockwise_90",
    "integrity": 1.0,
    "chance": 1.0,
    "relative_to_entry": false,
    "ignore_entities": false,
    "keep_liquids": true
  }
]
```

Structure files are vanilla structures: `data/<namespace>/structure/<path>.nbt`. `pos` is the structure origin; `rotation` and `mirror` set the orientation; `integrity` is how complete it is (`0..1`); `chance` is rolled once per instance; `relative_to_entry` measures the position from the landing point instead. **With a `border`, absolute structure positions must fall inside it** (only x/z is checked), or the whole definition fails to load.

A missing structure is not a load error: it returns `MISSING_STRUCTURE` on the way **in**, so after editing structures, actually walk in once.

## Step 6 — Aura, Formations and Rifts Inside

- **Aura**: an instance dimension is a runtime dimension with no `LevelStem` entry of its own, so `aura_zone.dimensions` can name the instance dimension id, the **definition id**, or the **stem id** — one entry then covers every instance that template opens.
- **Biome-bound aura zones do not follow you in**: an `mxt:void` realm is `minecraft:the_void`, so a zone bound to `#minecraft:is_overworld` does not match. With no zone matching, the position falls back to the empty zone — a realm has **no aura by default**, and you have to bind one deliberately.
- **Formations and aura stock** live in that dimension's own `data/`, so deleting an `owned: false` instance takes them with it.
- **Rifts** (`mxt:rift`) can target a realm dimension: when the target is **not loaded** (a dormant claimed instance, a deleted one) the rift does not teleport — a deliberate safety valve, so a teleport never drags a world back open.

## Step 7 — Verify

```text
/mxt registries validate
/mxt realm_instance enter example:trial_realm
/mxt realm_instance list
/mxt realm_instance info example:realm/trial_realm/0
/mxt realm_instance exit
/mxt realm_instance destroy example:realm/trial_realm/0
```

1. Reopen the world (registries are read while the **world loads**, so `/reload` is not enough) and check `/mxt registries validate` reports no codec errors.
2. `enter` reports success, or the entry-failure message ending in a failure code when refused.
3. `list` prints one line per instance with its dimension key, index, definition, member count, limit, owner, prepared and loaded flags — `loaded=false` is a dormant claimed instance.
4. Walk around, `exit`, then inspect it with `/mxt realm_instance info <dimension>`; enter an `owned: true` instance again and you should be back in the same terrain.
5. `destroy` really does delete the terrain (claimed instances included), so destroy before editing the definition away — otherwise the record can no longer be read and the terrain is treated as orphaned data.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Entry is refused with `NO_FREE_INSTANCE` | `max_instances` is full (dormant claimed instances count); destroy the ones you do not need, or raise the limit. |
| Entry is refused with `MISSING_STRUCTURE` | A `structures[].nbt` points at a structure file that does not exist, or the path is wrong. |
| Entry is refused with `CONDITION_NOT_MET` | The chosen entry point's `enter_condition` does not pass; an `enter_denied_message` is shown instead of the code. |
| Entry is refused with `DISABLED` | The definition is switched off by `#mxt:disabled`, or the id is not in the registry at all. |
| Entry is refused with `ALREADY_TRAVELLING` | That player is already inside an enter/exit sequence. |
| You fall straight down | `mxt:void` with no structures: an empty column's surface height is the bottom of the world. |
| The terrain disappeared | The instance is `owned: false`, so the last member leaving deleted it; write `true` to keep it. |
| After a restart a claimed realm is `loaded=false` and players cannot return | That is dormancy, not loss: the next visitor reopens it under the same seed. The member table is cleared by the restart, so players it considers orphaned are sent back to where they entered from when they log in. |
| Offline players still occupy slots | The member table is authoritative: offline members still count as present, and they also keep the instance from going dormant. |
| After editing the definition nothing loads | A realm definition is a registry entry, so a decode error **stops the world from loading**; read the last codec error in the log. |
| Structures did not appear | A `chance` below 1 rolls the dice once per instance, and an `integrity` below 1 leaves random holes. |

## Next

- [realm_instance](../datapack/json/realm_instance.md) — the full field list and every generation type.
- [aura_zone](../datapack/json/aura_zone.md) — binding aura to a realm dimension.
- [formation](../datapack/json/formation.md) — raising an array inside a realm.
- [Rifts](../player-guide/rift.md) — connecting a realm to the overworld.
