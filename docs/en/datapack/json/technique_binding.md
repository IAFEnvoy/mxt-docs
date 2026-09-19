---
title: Technique Binding (technique_binding)
description: "Binds an existing book, jade slip or other item to a cultivation technique through the mxt:technique_binding datapack registry."
---

# Technique Binding (technique_binding)

A technique binding maps an existing book, jade slip, or other item to one technique from the `mxt:technique` registry. Like every other binding it only matches already registered items, so the physical item must come from Minecraft, a content mod, or KubeJS. Right-clicking the bound item attempts to learn the technique; every learned technique remains enabled and contributes its passive effects.

## File Location

Technique binding JSON files go in `data/<namespace>/mxt/technique_binding/` within your data pack.

**Purpose**: Bindings from existing items to cultivation technique learning.

The filename corresponds to its ID. For example, `data/example/mxt/technique_binding/fire_manual.json` has the ID `example:fire_manual`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Matches existing books, jade slips and similar items |
| `technique` | `Holder<technique>` | **required** | The technique that right-clicking attempts to learn |
| `quality_group` | `Tag<item_quality>` | none | The allowed quality group |
| `conditions` | `EntityCondition[]` | `[]` | The conditions checked before learning; supports inline conditions or described condition objects |
| `learn_time` | Integer | `0` | The ticks the item has to be held down; range `0..72000`. `0` learns on the first right-click |
| `hold_animation` | String | `block` | The pose played while holding. It only means anything together with `learn_time`; see the allowed values below |
| `hold_sound` | `Holder<sound_event>` | `minecraft:item.book.page_turn` | The sound played while holding. It only means anything together with `learn_time`, and every nearby player hears it |

### `items`

The `items` matcher accepts one item ID, one item tag (such as `"#example:manuals"`), or a mixed array of both; one binding can therefore cover many physical items. Any array entry may also be written as a typed object dispatched by the built-in `item_matcher_entry_type` registry (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:herb_tag` and the `mxt:spirit_storage` capability matcher); see [Shared Data Types](../types/shared_data_types.md) for the entry types. When multiple bindings match an item, the matcher selects the definition with the lowest `priority` first, and all four binding types currently use priority `0`.

### `quality_group`

`quality_group` must be a native item-quality tag reference prefixed with `#`. Its `values` order defines the group's quality order. When no explicit `mxt:item_quality` component or forge result exists, the last member not disabled by the `mxt:disabled` tag becomes the default quality.

The item cannot be used when its current quality is outside the group, the group has no usable member, a binding condition fails, or the quality's own `condition` fails. See [Item Quality](./item_quality.md).

### `conditions`

`conditions` is optional. Each entry may be an inline `EntityCondition`, or an object with `condition` and an optional translation-key `description`. Described entries are shown in the item tooltip with a green `✓` when true or a red `✗` when false. The check runs before learning.

### `technique`

`technique` is a required holder reference to the `mxt:technique` registry, so a binding writes a technique ID such as `example:fire_manual`. Its own `learn_condition`, already-learned check, exclusive-tag conflict check, and event cancellation remain authoritative. A matching technique binding claims the item interaction even when learning fails, so the item's normal right-click behavior cannot bypass these checks. See [Cultivation Technique](./technique.md).

A refusal is not silent: the action bar names the technique and the reason, whether the item gate refused (the binding conditions, the quality's condition, or the quality group) or the learning transaction did. The item gate is answered first, so an item that cannot be used at all reports that instead of the learning outcome.

### `learn_time`

A `learn_time` greater than `0` turns the item into a **hold** read: the item only teaches once the use cycle has run for that many ticks, and releasing early cancels the attempt. The progress bar, the arm pose and the release cancellation all come from the vanilla use cycle, so no extra screen is involved, and the item needs no special class — a vanilla item, a modded item and a KubeJS item all work.

The component that drives the cycle is written onto the held stack when the click starts and is taken off again by the server immediately after, so **a completed read does not consume the item**, not even when the item is also food. The judgement itself runs server-side, so `learn_time` is the number of server ticks the read has to run.

`hold_animation` and `hold_sound` only do something together with a `learn_time`; declaring either on a binding that asks for no hold is rejected at load. `hold_animation` reuses the vanilla `ItemUseAnimation`, but only the side-effect-free values are accepted:

| Value | Pose |
|-------|------|
| `block` (default) | Held up in front |
| `brush` | The vanilla brush pose |
| `bundle` | The vanilla bundle pose |
| `toot_horn` | The vanilla goat horn pose |
| `none` | No pose, only the progress bar |

The other vanilla poses are refused at load: `spyglass` because vanilla ties that pose to scoping and hand hiding, `eat`, `drink` and `spear` because they declare a custom arm transform, and `bow`, `trident` and `crossbow` because they scale the pose by how far the item is charged. See [Cultivation Technique](./technique.md) for the technique definition itself.

## Example

```json
// data/example/mxt/technique_binding/fire_manual.json
{
  "items": "kubejs:fire_manual",
  "technique": "example:fire_manual",
  "quality_group": "#example:group/manual",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}]
}
```

The item cooldown a completed read pays is server config rather than datapack content: **Server Config → Cultivation → Learn Cooldown** is measured in ticks, defaults to `60`, and accepts `0` (off) up to `72000`. Every completed read pays it, whether the technique was learned or refused; releasing the item early is not a read and pays nothing.

A manual that has to be held for three seconds, with a brush pose:

```json
{
  "items": "mxt_test:azure_water_manual",
  "technique": "mxt_test:azure_water_manual",
  "learn_time": 60,
  "hold_animation": "brush",
  "conditions": [{"type": "mxt:always_true"}]
}
```

The condition ids used inside `conditions` come from the [Entity Condition Types](../types/condition/entity_condition_types.md) list.

