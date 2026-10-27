---
title: /rift
---

# `/rift`

Rifts are planar polygon portals managed by UUID. The whole subtree needs operator level 2, and every node also exists as `/mxt rift …`.

<div class="cmd-tree">

- `/rift ...`

  - `... spawn <preset> <origin> <facing> (position <dimension> <destination> | secret_realm <definition> | return)`

    Builds a portal on the spot at `origin` from a preset's outline and appearance, facing `facing`, with its destination given up front.

  - `... target <id> (position <dimension> <destination> | secret_realm <definition> | return)`

    Replaces that portal's destination only, without opening the editor.

  - `... edit`

    Opens the editor on a new draft (disabled until it is submitted).

  - `... edit <id>`

    Opens the editor on that portal, the same as using an editor item on its face.

  - `... info`

    Lists every portal in the current dimension.

  - `... info <id>`

    Reads that one portal.

  - `... remove <id>`

    Deletes that portal.

  - `... duration <id> <ticks>`

    Resets how long that portal has left, in ticks; setting it restarts the count, and `0` keeps the portal for good.

  - `... enabled <id> <true|false>`

    Enables or disables that portal.

  - `... copy <id> <origin>`

    Copies that portal to `origin`; the copy gets a new UUID.

  - `... transform <id> move <offset>`

    Moves the whole outline by a vector.

  - `... transform <id> rotate <degrees>`

    Rotates the outline, from `-360` to `360`.

  - `... transform <id> scale <factor>`

    Scales the outline, from `0.001` to `100`.

  - `... transform <id> mirror`

    Mirrors the outline.

  - `... export <id> preset`

    Exports that portal as a `rift` preset JSON and prints it into chat.

  - `... export <id> layout`

    Exports it as a `secret_realm.portals` layout JSON and prints it into chat.

</div>

`<facing>` is one of `north` / `south` / `east` / `west` / `up` / `down`; it sets the normal of the portal surface, so spawning has to name it.

`<id>` completion only lists the portals in the **current dimension that have not expired**; an unknown UUID answers "no such portal".

## Destinations

`<destination>` is one of:

- `position <dimension> <destination>` — a dimension and coordinates, with the usual landing checks and dirt platform;
- `secret_realm <definition>` — one secret realm definition; the instance is bound on the first successful entry;
- `return` — the source recorded when the secret realm was entered, so an entity that is not travelling in one cannot use it.

These are the same three the editor offers, and travel, cooldown, the `nearby` search and the dirt platform are on [Rifts](../rift.md#destinations-and-travel).

## What info prints

One line per portal: UUID, revision, vertex count, destination type, ticks left and whether it is enabled. Without `<id>`, `info` lists every portal in the current dimension.

## Export

`export` only prints the JSON into chat; to land it on disk use the editor's "save file", which writes under the game directory's `exports/mxt/rifts/` and never overwrites a name that exists. The two formats are the [rift definition](../../datapack/json/rift.md) and [secret_realm.portals](../../datapack/json/secret_realm.md) respectively.

## Relation to the editor and the token

The commands cover the things that fit in one line — spawn, retarget, duration, enable, copy, transform, export. Tracing an outline, drawing shapes and the world preview belong to the editor (see [Rifts](../rift.md#creating-and-editing)). The secret realm token is another road entirely: it only summons a portal, and travel happens on contact — see [the token](../rift.md#secret-realm-tokens).
