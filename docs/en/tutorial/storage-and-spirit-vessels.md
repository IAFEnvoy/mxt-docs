---
title: Storage and Spirit Vessels
description: "The shape and the limits of the spirit vessel; storage and flying mounts each have a sub-tutorial of their own."
---

# Storage and Spirit Vessels

MiXianTu has three things that all look like a "container", or all hang on an item, and none of them has anything to do with the others:

- A **storage ability** (`mxt:storage`) hangs on an item and opens a box on a press. The contents live in a component on the item stack, and the player moves things in and out by clicking in the window that opens. → [Sub-tutorial: Storage](./storage.md)
- A **spirit vessel** is the item `mxt:spirit_vessel`: it carries a portable copy of some value, and a right click moves that amount into or out of your own account. No window, no menu, no ability. → **This page**
- A **flying mount** is another declaration for the same item: the artifact declares "I can fly", and a skill granted by a standing source such as a technique is what you press. → [Sub-tutorial: Flying Mounts](./flying-mount.md)

This page covers the **spirit vessel** only — it needs no data pack definition at all.

## What You Are Building

The spirit vessel is a framework item with no definition file: giving yourself one with a command is enough. The other two each have a definition to write, so go to their two sub-tutorials.

## Step 1 — The Spirit Vessel

The item `mxt:spirit_vessel` carries a portable copy of a fractional value:

- A right click moves that amount into **your own value account**.
- A sneak right click moves it back out of the account.
- No window, no menu, no ability.

Its component is `mxt:resource_container`, and its value is a **bare map** — there is no `values` wrapper:

```json
{
  "example:qi": 25.0
}
```

- The key is the ID of a `resource` definition, and the value is the amount.
- Writing `0` deletes that key.
- A bad entry logs one line and is then dropped: a misspelt ID does not error, you simply get an empty container.
- The capacity of each value is fixed in code at **1000**. A data pack cannot change it.

Give yourself a spirit vessel with something already inside:

```text
/give @s mxt:spirit_vessel[mxt:resource_container={"example:qi":25.0}]
```

The `resource` definitions themselves are in [Resource (resource)](../datapack/json/resource.md), and `mxt:spirit_vessel` with the other shared carriers is in [Items and Blocks](../player-guide/items.md).

## Verify

Give yourself a `mxt:spirit_vessel` carrying `mxt:resource_container`: right-click to move the amount into your account, sneak right-click to move it back. There is no window at any point, and no ability is spent.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| `mxt:resource_container` written as `{ "values": { … } }` leaves the container empty | The wrapper is wrong. No entry decodes, one log line is written, and you get an empty container. **No error.** |
| A misspelt `resource` ID inside the container | The bad entry is dropped with one log line, and the other keys are read as usual. **No error.** |

## Next

- [Storage](./storage.md) — the sub-tutorial: a storage ability hung on an item, how the slot count settles, where the box lives and how to pre-fill it.
- [Flying Mounts](./flying-mount.md) — the sub-tutorial: an item that flies, its mount, its skill and the two fuel bills.
- [Items and Blocks](../player-guide/items.md) — the component syntax for `mxt:spirit_vessel` and `mxt:resource_container`.
- [Resource (resource)](../datapack/json/resource.md) — which registry the keys inside a spirit vessel point at.
- [Artifact (artifact)](../datapack/json/artifact.md) — the definition both sub-tutorials need.
- [Wheel, Resource Bars and Aura HUD](../player-guide/keys-and-hud.md) — what a press does, and the cells on the wheel.
