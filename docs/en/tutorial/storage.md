---
title: Storage
description: "Hang a storage ability on an item: how the slot count settles, where the box lives, how to pre-fill it, and how to check it in game."
---

# Storage

This page follows on from [Storage and Spirit Vessels](./storage-and-spirit-vessels.md) and is one of its two sub-tutorials (the other is [Flying Mounts](./flying-mount.md)). It covers the **storage ability**: the one that hangs on an item and opens a box on a press.

Neither the spirit vessel nor flight is here: the first is on the parent page, the second in that other sub-tutorial.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/ability/blade_storage.json` | The storage ability: how many slots, and the cooldown. |
| `data/example/mxt/artifact/blade_sheath.json` | The artifact definition: claims the item, hangs this ability on it, allows it into a Curios slot. |

Both are ordinary data pack definitions. The item itself needs no changes.

## Step 1 — A Storage Ability

A storage ability is an ordinary ability with `mxt:storage` as its `type`:

```json
// data/example/mxt/ability/blade_storage.json
{
  "type": "mxt:storage",
  "name": "Sheath Storage",
  "slots": 27,
  "cooldown": 20
}
```

It reads two fields of its own:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `slots` | A number or a formula string | **required** | The declared slot count. |
| `cooldown` | A number or a formula string | `0` | The cooldown after a press, in ticks. |

The shared fields (`name`, `condition`, `icon` and so on) work as usual; see [Ability (ability)](../datapack/json/ability.md).

`slots` always settles in this order:

1. Floor the evaluated value.
2. A negative counts as `0`.
3. Round up to whole rows of nine.
4. At most six rows.

So the capacity is always a multiple of nine and never more than 54 slots: `27` gives 27 slots, `60` gives **54**, and `0` or a negative means a press is refused.

## Step 2 — Hanging It on an Item

An ability definition does nothing on its own. An artifact definition has to claim the item and reference it:

```json
// data/example/mxt/artifact/blade_sheath.json
{
  "items": "minecraft:diamond_sword",
  "abilities": ["example:blade_storage"],
  "require_owner": false,
  "curios_equipable": true
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | An item ID, a `#` tag, or an array | **required** | Which items this definition claims. |
| `abilities` | An array of ability IDs or a `#` tag | `[]` | What it gives the holder. |
| `require_owner` | bool | `false` | When true, only the owner may open it. |
| `curios_equipable` | bool | `false` | Whether these artifacts may sit in a Curios slot. |

An ability is granted in exactly two situations: the item is **in the main hand or the off hand**, or it is **in a Curios slot**. Not granted means the press does nothing.

`curios_equipable` also decides more than "may it go into a slot" — it decides **whether the player can reach it from the wheel**:

- The main wheel's editor takes two things: the abilities the body has learned, and the abilities the artifacts in Curios slots declare.
- An ability declared only by a **main-hand or off-hand** item is **not in the main pool**. It lives only on the "main hand item" / "off hand item" page of the derived wheel — a hand is a thing you swap at any moment.

To make storage reliably reachable, write `curios_equipable` as `true` and keep the item in a Curios slot. The four `charm` slots take the items in the `curios:charm` tag plus artifacts that declare `curios_equipable: true`, which is the easiest place to put it.

For how the wheel selects and spends, see [Wheel, Resource Bars and Aura HUD](../player-guide/keys-and-hud.md).

## Step 3 — What a Press Does

A press on that storage ability opens a **vanilla chest window** on the server. There is no custom window; it is the ordinary chest.

Three things are checked before it opens:

- You are the owner; or `require_owner` is `false` and the artifact is unowned.
- A carrying item is in hand (or in a Curios slot).
- The slot count is greater than 0.

Any one of them failing refuses the press.

The contents live in the item's `mxt:storage` component. The item tooltip reports a "used / total slots" line that follows what is inside.

## Step 4 — Pre-filling the Contents

The value of the `mxt:storage` component is an **array**, and each record is one box:

```json
[
  {
    "id": "example:blade_storage",
    "value": {
      "type": "mxt:container",
      "contents": [
        {"id": "minecraft:stone", "count": 3}
      ]
    }
  }
]
```

- `id` **must be the registry ID of that storage ability itself**. Two storage abilities on one item are two records and two boxes that never touch; changing the `id` is changing the box.
- `contents` is a list of item stacks, an empty array by default. An empty stack is allowed in that list and means the cell is empty — it is the only correct way to write "empty". `minecraft:air` is not: it makes the whole packet fail to encode.
- The list length does not have to match the capacity: reading past the end gives nothing, and closing the window pads or truncates to the capacity.

The only way a data pack can pre-fill a box is the vanilla component syntax:

```text
/give @s minecraft:diamond_sword[mxt:storage=[{"id":"example:blade_storage","value":{"type":"mxt:container","contents":[{"id":"minecraft:stone","count":3}]}}]]
```

Recipe outputs and loot functions can write it the same way. **No data pack action or condition can read that box back**: putting in and taking out happen only by clicking in the open window. That is the split this system is built on — the data pack pre-fills, the player moves things in the window.

## Verify

Abilities and artifacts are definitions in data pack registries, so load the world again before testing.

1. Give yourself an item the definition claims (`minecraft:diamond_sword`) and put it in a `charm` slot.
2. Open the wheel editor and look at the pool on the right for this storage ability — it should sit with the learned abilities.
3. Put it in a wheel cell and press the use key: the box opens. Put a few things in, close it, press again, and they are still there.
4. Take the item out of the Curios slot and press again: the ability is no longer on the roster, so this press is refused.
5. Now hold the item in your main hand only and open the wheel editor again: it is not in the pool, and lives only on the "main hand item" page of the derived wheel. That is `curios_equipable` and the item's position deciding together.
6. Watch the item tooltip: the "used / total slots" line follows the contents.
7. Change `slots` to `60`, give yourself another one and put it in a Curios slot: what opens is six rows, 54 slots.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The ability is not on the roster and the press is refused, with a `NOT_GRANTED`-style message | The item has no usable purpose of its own and nothing grants the ability. It is granted only while the carrier is in a hand or a Curios slot. |
| The press is refused, and the tooltip does not even show a "used / total slots" line | `slots` evaluated to `0` or less. The value is floored first, and a negative counts as `0`. |
| `"slots": 60` only produces 54 slots | Expected. Rows are capped at six, so the capacity is capped at 54 slots. **No error.** |
| The `mxt:storage` component is refused at decode time | Two records inside it carry the same `id` and the same type. One `id` is one box; writing it twice is not "the last one wins". |
| Storing anything makes the whole packet fail to encode | A `contents` entry is `minecraft:air`. An empty cell is an empty stack, nothing else. |
| `mxt:modify_storage` with `{"type":"mxt:container"}` puts nothing into the box | That action writes state on the entity, while the window reads the component on the item stack. There is no bridge between the two. **No error, no effect.** |
| Keys such as `storage_slots` or `components` on a storage ability do nothing | There are no such keys; an unknown key is silently ignored. **No error.** |

## Next

- [Storage and Spirit Vessels](./storage-and-spirit-vessels.md) — back to the parent page: the spirit vessel.
- [Flying Mounts](./flying-mount.md) — the other sub-tutorial: another declaration for the same item.
- [Ability Types](../datapack/types/other/ability.md) — the fields `mxt:storage` reads and its failure reasons on a press.
- [Artifact (artifact)](../datapack/json/artifact.md) — the full field list for `items` / `abilities` / `require_owner` / `curios_equipable`, plus the tooltip rules.
- [Curios Slots](../player-guide/curios-slots.md) — which slots take artifacts that declare `curios_equipable`.
- [Wheel, Resource Bars and Aura HUD](../player-guide/keys-and-hud.md) — how the main wheel and the derived pages read what your gear gives you.
- [Entity Action Types](../datapack/types/action/entity_action_types.md) — which store `mxt:modify_storage` writes to.
