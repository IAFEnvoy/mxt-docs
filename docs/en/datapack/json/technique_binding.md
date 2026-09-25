---
title: Technique Binding (technique_binding)
description: "Describes how one cultivation technique is read — hold length, pose, sound, quality chain and conditions — and which item the mod generates as its carrier. What a stack teaches comes from its mxt:technique data component."
aside: false
---

# Technique Binding (technique_binding)

Technique binding JSON files go in `data/<namespace>/mxt/technique_binding/` within your data pack.

**Purpose**: it describes how one technique is **read** — the length, pose and sound of the gesture, the quality chain, the conditions that gate an attempt, and the item the mod generates as that technique's carrier. **Whether a stack is a manual at all, and which technique it teaches, is decided by the stack's own `mxt:technique` data component, not by this table.**

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `technique` | `Holder<technique>` | **required** | The technique this definition describes. Declarations are matched by technique id, no longer by item |
| `carrier_item` | Item ID | `mxt:cultivation_jade_slip` | The item the mod uses when it generates a carrier for this technique. A single item ID — item tags, wildcards and arrays are not accepted |
| `quality_chain` | `Holder<quality_chain>` | none | The quality chain this item belongs to. The chain answers membership (a resolved tier must be on it), the default tier (the chain's `default`) and the upgrade path |
| `conditions` | `EntityCondition[]` | `[]` | The conditions checked before learning; supports inline conditions or described condition objects |
| `learn_time` | Integer | `0` | The ticks the item has to be held down; range `0..72000`. `0` learns on the first right-click |
| `hold_animation` | String | `block` | The pose played while holding. It only means anything together with `learn_time`; see the allowed values below |
| `hold_sound` | `Holder<sound_event>` | `minecraft:item.book.page_turn` | The sound played while holding. It only means anything together with `learn_time`, and every nearby player hears it |

::: warning The old `items` field is gone
Earlier versions used an `items` matcher (a single item, a tag or a mixed array) to bind a physical item to a technique. That field **no longer exists**. The codec does not recognise unknown fields, so an `items` field in a new file is **silently ignored**: the pack loads without an error and the rule simply never applies. Use `carrier_item` instead, and put the `mxt:technique` component on the stack as shown below.
:::

## What Makes a Stack a Manual {#manual}

**A stack carrying the `mxt:technique` component is a manual for that technique.** The component holds a technique definition id (a `Holder<technique>`):

```mcfunction
give @s mxt:cultivation_jade_slip[mxt:technique="example:azure_breath"]
```

The same item *without* that component — a `mxt:cultivation_jade_slip` taken straight out of the creative inventory, for instance — **teaches nothing and shows no technique in its tooltip**. That is the behaviour this version fixes: previously any stack of jade slips counted as a manual for some technique.

The component is **stack data**, so items that generate naturally in the world never carry it by themselves. Every route that can write onto a stack works equally well:

- the `components` of a recipe result;
- a loot function;
- the item component syntax of `/give`, as above.

## The Carrier the Mod Generates {#carrier}

The mod walks the `mxt:technique` registry and **generates one carrier per technique**: it appears in the creative inventory and in the `/picker mxt:technique` category of the item picker. The generated stack uses the item named by `carrier_item` in that technique's declaration, and **absent means the jade slip** `mxt:cultivation_jade_slip`.

To use an item of your own as the manual, write `carrier_item: "namespace:item"` and take the generated carrier from either entry point — the stack you get already carries the `mxt:technique` component.

**A technique does not need a declaration at all.** Declarations are matched by technique id, and a technique with no `technique_binding` file is still read, with the defaults: it is learned on the first right-click, with the default pose and sound, no quality chain, no conditions and the jade slip as its carrier.

## Reading: Hold Length and Authority

A `learn_time` greater than `0` turns the item into a **hold** read: the item only teaches once the use cycle has run for that many ticks, and releasing early cancels the attempt. The progress bar, the arm pose and the release cancellation all come from the vanilla use cycle, so no extra screen is involved.

The two forms do not interfere: leaving `learn_time` out (or writing `0`) keeps the plain right-click learn, and a positive number turns it into a hold.

**The item needs no special class.** As soon as the stack carries the `mxt:technique` component it gains the hold behaviour its declaration asks for, whether it is a vanilla item, a modded item or a KubeJS item — the component lives on the stack, so the item does not have to belong to any particular class, and it does not even have to be the declared `carrier_item`.

The component that drives the cycle is written onto the held stack when the click starts and is taken off again by the server immediately after, so **a completed read does not consume the item**, not even when the item is also food. The judgement itself runs server-side, so `learn_time` is the number of server ticks the read has to run; the arm pose follows the client's own counter, which is why a badly lagging server can drop the pose a tick or two before the technique arrives.

`hold_animation` and `hold_sound` only do something together with a `learn_time`; declaring either on a declaration that asks for no hold is rejected at load. `hold_animation` reuses the vanilla `ItemUseAnimation`, but only the side-effect-free values are accepted:

| Value | Pose |
|-------|------|
| `block` (default) | Held up in front |
| `brush` | The vanilla brush pose |
| `bundle` | The vanilla bundle pose |
| `toot_horn` | The vanilla goat horn pose |
| `none` | No pose, only the progress bar |

The other vanilla poses are refused at load: `spyglass` because vanilla ties that pose to scoping and hand hiding, `eat`, `drink` and `spear` because they declare a custom arm transform, and `bow`, `trident` and `crossbow` because they scale the pose by how far the item is charged.

While the read runs, everyone nearby hears it: the reader hears the sound played by the component on their own client, and other players hear a server-side broadcast at range (the reader is left out of it, so nobody hears it twice). The default is a page turn, and the interval follows the vanilla rule — about every fourth tick after the first fifth of the read.

The item cooldown a completed read pays is server config rather than data pack content: **Server Config → Cultivation → Learn Cooldown** is measured in ticks, defaults to `60`, and accepts `0` (off) up to `72000`. Every completed read pays it, whether the technique was learned or refused; releasing the item early is not a read and pays nothing.

## Example

A technique that uses an item of the content pack as its carrier:

```json
// data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "quality_chain": "example:manual",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}]
}
```

The same technique, held for three seconds with a brush pose:

```json
{
  "technique": "mxt_test:azure_water_manual",
  "carrier_item": "mxt_test:azure_water_manual",
  "learn_time": 60,
  "hold_animation": "brush",
  "conditions": [{"type": "mxt:always_true"}]
}
```

Either way the manual itself still has to come from a stack that **carries the component**: use the item component syntax of `/give`, or let a recipe result carry `{"mxt:technique": "mxt_test:azure_water_manual"}`.

The condition ids used inside `conditions` come from the [Entity Condition Types](../types/condition/entity_condition_types.md) list. See [Cultivation Technique](./technique.md) for the technique definition itself.
