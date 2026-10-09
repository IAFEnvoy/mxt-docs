---
title: Storage and Spirit Vessels
description: "The shape and the limits of the spirit vessel; storage and flying mounts each have a sub-tutorial of their own."
---

# Storage and Spirit Vessels

MiXianTu has three things that all look like a "container", or all hang on an item, and none of them has anything to do with the others:

- A **storage ability** (`mxt:storage`) hangs on an item and opens a box on a press. The contents live in a component on the item stack, and the player moves things in and out by clicking in the window that opens. → [Sub-tutorial: Storage](./storage.md)
- A **spirit vessel** is the item `mxt:spirit_vessel`: it carries a portable copy of some value, and **holding right-click** pours that amount into your own account (filling it takes a display stand, or firing spirit power at it). No window, no menu, no ability. → **This page**
- A **flying mount** is another declaration for the same item: the artifact declares "I can fly", and a skill granted by a standing source such as a technique is what you press. → [Sub-tutorial: Flying Mounts](./flying-mount.md)

This page covers the **spirit vessel** only — it needs no data pack definition at all.

## What You Are Building

The spirit vessel is a framework item with no definition file: giving yourself one with a command is enough. The other two each have a definition to write, so go to their two sub-tutorials.

## Step 1 — The Spirit Vessel

The item `mxt:spirit_vessel` carries a portable copy of a fractional value, and **two components** say what it is:

| Component | What it is |
| --- | --- |
| `mxt:resource_capacity` | **The storage cap**: a bare map from a resource to how much of it this container holds. **A resource with no entry has a cap of 0**, which means it cannot be stored. |
| `mxt:resource_container` | **The stored amount**: a bare map from a resource to how much is inside right now. |

- **Hold right-click** to pour it into **your own value account**: one unit of each resource a tick, stopping when you let go or when it runs dry. There is no window, no menu and no ability.
- **There is no mode and nothing to switch**: a sneak right click does nothing, and clicking an empty vessel only tells you it has no usable resource.
- The cap is **one per resource**: a container can hold several resources at once, each with a capacity of its own, and a vessel with no `mxt:resource_capacity` takes nothing at all (a value has no natural maximum, so the number has to be written down).
- There is no option for the cap; only a component (a command, a data pack or a content pack) can give it.

Both maps are **bare maps** — there is no `values` wrapper:

```json
{ "example:qi": 25.0 }
```

- The key is the ID of a `resource` definition, and the value is the amount (in `mxt:resource_capacity`, the cap).
- Writing `0` deletes that key (in the cap map, `0` and an absent entry are the same answer: no room).
- A bad entry logs one line and is then dropped: a misspelt ID does not error, you simply get an empty map.

Give yourself a vessel that holds 1000 and already carries 25:

```text
/give @s mxt:spirit_vessel[mxt:resource_capacity={"example:qi":1000.0},mxt:resource_container={"example:qi":25.0}]
```

The `resource` definitions themselves are in [Resource (resource)](../datapack/json/resource.md), and `mxt:spirit_vessel` with the other shared carriers is in [Items and Blocks](../player-guide/items.md).

## Step 2 — Filling It

A vessel never fills itself; it only pours out. There are two ways in, and both pour **aura** — an aura is counted in a `resource` (the `resource` field of its [aura](../datapack/json/aura.md) definition), so it lands in the container as that resource and stops at that resource's cap:

- **A display stand**: put the vessel on one and let a spirit-power ray (the aura picked on the wheel with a `burst_amount` above 0) hit it.
- **Firing spirit power at it**: with the vessel in your main hand, firing does **not** launch a ray — that firing is charged straight into the vessel for the same price, and the action bar reports `pouring spirit power stored / cap`.

## Verify

Give yourself a vessel with a cap: **hold right-click** and watch it pour one unit of each resource a tick into your account, stopping when the account is full or the vessel is empty. With a cap smaller than the account's own maximum the account fills first and the rest stays inside.

Then fill it: put it on a display stand and let a ray hit it, or fire spirit power with it in your main hand and watch it gain instead of a ray flying off (the action bar reports the progress).

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| `mxt:resource_container` written as `{ "values": { … } }` leaves the container empty | The wrapper is wrong. No entry decodes, one log line is written, and you get an empty container. **No error.** |
| A misspelt `resource` ID inside the container | The bad entry is dropped with one log line, and the other keys are read as usual. **No error.** |
| A hold does nothing and only says the vessel has no usable resource | There is nothing inside to pour. To fill it, see the step above. |
| A display stand or a charged firing does not fill the vessel | No `mxt:resource_capacity`, or that map does not name this resource: its cap is 0. It may also already be full. |

## Next

- [Storage](./storage.md) — the sub-tutorial: a storage ability hung on an item, how the slot count settles, where the box lives and how to pre-fill it.
- [Flying Mounts](./flying-mount.md) — the sub-tutorial: an item that flies, its mount, its skill and the two fuel bills.
- [Items and Blocks](../player-guide/items.md) — the component syntax for `mxt:spirit_vessel` and `mxt:resource_container`.
- [Resource (resource)](../datapack/json/resource.md) — which registry the keys inside a spirit vessel point at.
- [Artifact (artifact)](../datapack/json/artifact.md) — the definition both sub-tutorials need.
- [Wheel, Resource Bars and Aura HUD](../player-guide/keys-and-hud.md) — what a press does, and the cells on the wheel.
