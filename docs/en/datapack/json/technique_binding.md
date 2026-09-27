---
title: Technique Binding (technique_binding)
description: "How one technique is read — hold length, pose, sound, quality chain and conditions — plus the carrier item the mod generates for it. Whether a stack is a manual, and which technique it teaches, follows the stack's mxt:technique component first; only when there is none does a declaration's items decide."
aside: false
---

# Technique Binding (technique_binding) {#technique_binding}

File location: `data/<namespace>/mxt/technique_binding/<path>.json`

**Purpose**: how one technique is **read** — hold length, pose, sound, quality chain and conditions — plus the carrier item the mod generates for it. **Whether a stack is a manual, and which technique it teaches, follows the stack's `mxt:technique` item component first; only when there is none does a declaration's `items` claim the stack.**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `technique` | `technique` id | **required** | The technique this declaration describes. One declaration per technique is enough. |
| `items` | item ID, `#tag` or a mixed array | `[]` | **Optional**: these items count as a manual for this technique even while carrying no component; see [ItemMatcher](/en/datapack/types/shared_data_types#itemmatcher). When omitted, the declaration can only be reached by technique id. |
| `priority` | Int | `0` | When two declarations both claim one item, the larger number wins. |
| `carrier_item` | item ID | `mxt:cultivation_jade_slip` | The item the mod uses when it **generates** a carrier for this technique (`/picker mxt:technique` uses it). A single item ID — item tags, wildcards and arrays are not accepted. **When the declaration's `items` names concrete items, the picker hands those items out directly and generates no carrier.** |
| `quality_chain` | `quality_chain` id | none | The quality chain this item sits on (see [quality_chain](./quality_chain.md)). The chain answers membership (a resolved tier must be on it, otherwise the item cannot be used), the default tier (the chain's `default`) and the upgrade path. |
| `conditions` | `EntityCondition[]` | `[]` | Conditions checked before learning; inline conditions or described condition objects both work. |
| `learn_time` | Integer | `0` | The **hold** length in ticks, range `0..72000`. `0` learns on the first right-click. |
| `hold_animation` | String | `block` | The pose played while holding. Only meaningful when `learn_time` is written. Values below. |
| `hold_sound` | sound event ID (`sound_event` registry) | `minecraft:item.book.page_turn` | The sound played while holding. Only meaningful when `learn_time` is written; **every player nearby hears it**. |

::: warning `items` means "a manual even without the component"
A declaration's `items` makes that stack a manual for this technique **without any component**, but **identity still follows the stack's `mxt:technique` component first**: when the same item carries the component, what is read is the technique the component names, not the `technique` this declaration writes.
:::

## What Counts as a Manual {#manual}

**Which stack teaches which technique follows the component first.** The order is: **① the `mxt:technique` component on the stack** (its value is a technique definition id) — it is the stack's identity; **② with no component**, whichever `technique_binding` has an `items` that claims the stack, whose `technique` names the technique that stack teaches. With neither, the stack is not a manual and right-clicking it does nothing.

```mcfunction
give @s mxt:cultivation_jade_slip[mxt:technique="example:azure_breath"]
```

An item can therefore be a manual for a technique **without carrying any component** — as long as some declaration's `items` names it; the same item carrying the component still reads the technique the component names. Conversely, the same item with neither a component nor any `items` claiming it — a `mxt:cultivation_jade_slip` taken out of the creative inventory, for instance — **teaches nothing and shows no technique in its tooltip**.

The component is **stack data**, so items that generate naturally in the world never carry it by themselves. Any route that can write onto a stack works just as well:

- the `components` of a recipe result;
- a loot function;
- the item component syntax of `/give`, as above.

## The Carrier the Mod Generates {#carrier}

The mod walks the `mxt:technique` registry and **generates one carrier per technique**; the generated item is the one named by `carrier_item` in that technique's declaration, and **absent means the jade slip** `mxt:cultivation_jade_slip`. The `/picker mxt:technique` category of the item picker is that entry point; **the creative tab generates no carriers**. `carrier_item` is the item this generation uses only while the declaration claims no items of its own: when the declaration's `items` names concrete items, the picker hands those items out directly — **nothing is generated, and no component is written onto them**.

To use an item of your own as a manual, both routes work: write `carrier_item: "namespace:item"` and let the picker generate that stack with the `mxt:technique` component already on it; or, more directly, put the item into the declaration's `items`, and that stack is the manual **without any component**.

How long a read takes, which pose it plays and which sound it makes come from the **declaration**; a stack that should read differently writes the `mxt:technique_reading` component (same keys as the table above, all optional, overriding the declaration **field by field**), and the `mxt:quality_chain` component likewise wins over the chain written in the declaration.

**A technique can have no declaration at all.** Declarations are matched by technique id, and a technique with no `technique_binding` file is still read, with the defaults: learn on the first right-click, default pose and sound, no quality chain, no conditions, the jade slip as carrier. Such a technique can still be learned through the component — it just reads in the plainest possible way.

## Holding and Judgement

With `learn_time` greater than `0` the item becomes a **hold**: hold right-click to charge, and the technique is learned only once the progress runs out; releasing early counts as a cancel and nothing happens. The progress bar, the arm pose and the release cancellation all come from the vanilla use cycle, so no extra screen is involved.

The two forms do not interfere: leaving `learn_time` out (or writing `0`) keeps the plain right-click learn, and a positive number makes it a hold.

**The item needs no special handling.** As soon as the stack **resolves to a manual** (it carries the `mxt:technique` component, or some declaration's `items` claims it), the item gains the hold behaviour its declaration asks for — whether it is a vanilla item, an item from another mod, or a KubeJS item. The carrier is the **stack**, so the item does not have to belong to any particular class, and it does not even have to be the `carrier_item`.

How it works: the vanilla use cycle asks the **item stack** for two things — how long the action lasts, and which pose to play — and both questions read the vanilla `minecraft:consumable` component on the stack. The mod writes that component onto the held stack at the moment of the right-click, so the hold, the pose and the progress are all driven by vanilla, without taking over any behaviour of the item itself. The write runs **independently on client and server**: both sides compute the same duration from the same synced stack and declaration, so they show the same hold; the server strips the component again as soon as the hold starts, so it never reaches the save file.

`learn_time` / `hold_animation` / `hold_sound` are this module's field names; other modules have the same hold with different field names and the same behaviour.

**The judgement runs on the server; the pose does not.** One vanilla use cycle has a separate counter on the client and on the server, and the server does not always hold 20 TPS — its 60 ticks then take longer in real time than the client's 60. The mod puts the **judgement** (is the read done, is the technique learned, the progress bar) on the server, so `learn_time` is "the number of ticks the server has to run", and it stretches accordingly when the server drops frames. That is the correct behaviour. **The arm pose follows the client's own counter**, so when the server drops frames or lags badly the pose can end a little before the judgement does: that tail is usually a tick or two and is invisible on a healthy server — only a server that clearly cannot keep up shows "the animation cuts off, then the technique arrives". This is not logged anywhere, so when it happens you can only judge by feel.

**A hold makes a sound, and everyone nearby hears it.** The reader hears the one played by the component on **their own client** (the same route vanilla uses for eating sounds); everyone nearby hears a second one the **server** broadcasts by distance. The two are deliberately split — the server broadcast leaves the reader out, otherwise the reader would hear it twice. The default is a page turn, because the sound vanilla picks by default for "something you can use" is **chewing**, which sounds wrong while reading. The interval follows the vanilla rule (about every 4 ticks after the first 1/5 of the duration): a longer `learn_time` means more of them, and turning the sound volume down works better than editing this; at `learn_time` 4 or 5 ticks the window never opens at all, and those two holds make no sound.

:::warning
A hold **does not consume** the manual: the component that drives it is stripped the moment the hold starts, so the item is still in hand when the read finishes, and it is not eaten even when it **is** edible (writing the component onto bread, say).

Using `learn_time` on a **food** item still has one corner: before starting to use it, vanilla asks whether the player can eat right now, and a player who is not hungry has that right-click refused outright, so the hold never begins. Use non-food items for manuals.
:::

A successful learn shows **Technique learned:** followed by the technique's name in the action bar (`actionbar.mxt.technique.learned`); a refusal gives its reason there as well.

Item cooldown is controlled by **Server Config → Cultivation → Learn Cooldown**, not by the data pack: ticks, range `0..72000`, default `60` (3 seconds), `0` turns it off. **A read that runs to the end goes on cooldown whether the technique was learned or not** — the cooldown is the price of the attempt, not a punishment for failing: what it has to stop is the same manual being read over and over, and "a refusal costs no cooldown" would hand exactly that route to any technique you cannot learn yet. It rides the vanilla item cooldown, so the hotbar's grey sweep and the `mxt:on_cooldown` item condition both read straight off it.

Releasing the item early is not a read (the count never finished and no learn check ran), so it costs no cooldown.

`hold_animation` accepts **only the side-effect-free values**:

| Value | Pose |
| --- | --- |
| `block` (default) | Held up in front, as if reading it |
| `brush` | The vanilla brush pose |
| `bundle` | The vanilla bundle pose |
| `toot_horn` | The vanilla goat horn pose |
| `none` | No pose, only the progress bar |

These values are refused with a load-time error:

- `spyglass`: vanilla equates that pose with scoping, and that check **forces the field of view to 0.1** and switches to low mouse sensitivity — both in code we cannot change. Vanilla also skips rendering the whole hand (item included) while scoping, so a "pose only, side effects suppressed" version would show nothing.
- `eat`, `drink`, `spear`: these three bring their own arm transform, so vanilla skips the step that would raise the item, and these items have no matching arm model.
- `bow`, `trident`, `crossbow`: these scale the pose by how far the item is charged, which makes reading look like drawing a bow that is not there.

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

The same technique, held for three seconds with a brush pose, using the content pack's own item as a manual **without any component**:

```json
{
  "technique": "mxt_test:azure_water_manual",
  "items": "mxt_test:azure_water_manual",
  "learn_time": 60,
  "hold_animation": "brush",
  "conditions": [{"type": "mxt:always"}]
}
```

Once written, a manual comes from one of two places: the item named by the declaration's `items` (no component needed), or any **stack carrying the component** — via the `give` item component syntax above, or a recipe result carrying `{"mxt:technique": "mxt_test:azure_water_manual"}`.
