---
title: Technique (technique)
description: "Defines a learnable cultivation technique: learning conditions, hold length, the levels of the progression chain it enters, and the passive attributes and abilities it grants."
aside: false
---

# Technique (technique) {#technique}

File location: `data/<namespace>/mxt/technique/<path>.json`

A technique is something that can be learned. Once learned it stays in effect: `granted_abilities` hands out abilities right away and `passive_modifiers` keeps feeding attributes, while the climbing part runs on a ledger of its own — a technique points at the entry of a progression chain, the holder advances along that chain level by level, and every level unlocks its own abilities. All learned techniques are active at the same time.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `quality` | Quality id | none | Optional. This technique's own grade: the manual carrying this definition reads at it. |
| `icon` | Icon reference | none | The icon the technique shows in interfaces such as the technique panel. |
| `primary_color` | `RGBColor` | `#0E54A0` | The colour of the **built-in technique book** `mxt:technique_book`'s first texture layer (the book body), written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too, always opaque). |
| `secondary_color` | `RGBColor` | `#E4E8EB` | The colour of the same book's second texture layer (the mark on its cover), written the same way. |
| `learn_condition` | `EntityCondition` | `mxt:always` | Learning condition. |
| `learn_time` | [`NumberProvider`](../types/number_provider_types) | `0` | How long a read of this technique has to be **held**, in ticks. It is evaluated **against the reader** (once as the hold starts and again on every tick of it) and the result is floored; anything below `1` counts as `0`, which is a plain right-click learn. There is no ceiling (a result past int's range reads as `2147483647`). |
| `hold_animation` | String | `eat` | The pose played while holding. Only meaningful when `learn_time` is greater than `0`; values are in the [table below](#holding). |
| `hold_sound` | sound event ID (`sound_event` registry) | `minecraft:item.book.page_turn` | The sound played while holding. Only meaningful when `learn_time` is greater than `0`; **every player nearby hears it**. |
| `exclusive_tags` | Identifier array | `[]` | Mutual exclusion tags for this technique. |
| `cultivation_modifier` | `NumberProvider` | `1` | Cultivation multiplier. |
| `passive_modifiers` | Array of attribute modifier entries | `[]` | Passive attributes. |
| `granted_abilities` | Array of ability IDs or `#tags` | `[]` | Abilities granted on learning; always active. |
| `default_level` | Progression level ID | none | The entry level of this technique's progression chain. |
| `mastery_resource` | Value ID | none | The stored value that measures this technique's mastery. |
| `configuration` | Map of progression level ID to entry object | `{}` | This technique's own annotation of each level on the shared chain; entry fields are in the table below. |

Each `configuration` entry describes one level:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **required** | The condition for **reaching** that level. Write `mxt:always` when a level needs nothing; an array means all of them have to hold. |
| `ability` | Ability ID, `#tag`, or an array of either | `[]` | The abilities that level grants. They are a **minimum**: they stay active on later levels, so abilities accumulate. One ability, a `#` tag, or an array of either. |
| `action` | `EntityAction` | `mxt:no_op` | The action run once **on entering** that level. |

These three fields are shared by techniques and creature profiles; there is no entry field only a spirit beast has. `action` runs once on entering that level: a natural promotion and an administrative level write both count as entering, and it runs **first** while the `mxt:progression_level` signal is published **after**, so whatever reacts sees a body that has already changed; an array of actions runs in order.

`quality` names a tier in `mxt:quality` and may be left out. Every technique shares one carrier item, `mxt:technique_book`, so the item itself cannot say which tier it is — only the definition the stack carries can: a manual carrying this definition reads at that tier. An `mxt:quality` component on the stack wins; with no `quality` here this layer answers nothing and resolution continues to the [default_quality](./default_quality.md) registry.

`primary_color` and `secondary_color` tint the **mod's own technique book** only: that book's model has two texture layers, the first painted with `primary_color` and the second with `secondary_color`, so writing two colours is all a pack needs to change how it looks. A stack with no `mxt:technique` component (the blank book in the creative tab), or one naming a technique the loaded packs no longer provide, keeps the two defaults above; an item a binding claims keeps its own texture.

The two pages of an opened book take their texture from **the technique's own id**: `assets/<technique namespace>/textures/item/technique/<technique path>_left.png` and `..._right.png`. A page with no art of its own falls back to `assets/<technique namespace>/textures/item/technique_book_page.png`, and keeps the texture the model declares when neither exists. Which model texture slot each page lands in belongs to the book's item model (`assets/mxt/items/technique_book.json`) and its `pages`: **when both pages name one slot, the slot goes to the page that drew art — `_left` first, `_right` only when the left page has none**. Two separate pages take two separate slots in the model, each named in `pages`; naming a slot the model does not declare logs an error and leaves that page alone. A technique definition writes no texture at all. Draw the art inside the UV region that slot uses; the UVs do not change.

**A manual's tooltip prints this technique's name and its description** — the description comes from the generated `<technique key>.description` and is skipped when the pack translated none, so the tooltip never shows a raw key. **Right-clicking a manual reads it**: the mod prints any text written on the book and then the same name and description. A technique with a `learn_time` still only teaches at the end of the hold; the click itself just reads the book out. The rules of that hold are under [Holding and Judgement](#holding).

`passive_modifiers` uses vanilla AttributeModifiers; `value` is an optional dynamic formula.

A technique that defines no mastery may omit `default_level`.

Without `mastery_resource` a technique never advances.

The levels themselves belong to the chain, so one chain can be shared by several techniques while each technique decides what its levels grant and what they ask for. The entry level (`default_level`) is where a holder starts, so it **needs** no entry; write one anyway and its `ability` still counts at that level while its `condition` is only decoded and never gates anything, because nothing ever advances *into* the entry level. Every level after the entry level **must** be configured, and a configured level the technique can never reach from its `default_level` is rejected while the chain is rebuilt — a chain cannot be climbed through a step that nothing describes.

`granted_abilities` and `configuration` are independent: the first list is active as soon as the technique is learned, the second accumulates as the holder's level advances. `configuration` needs `default_level` to name the chain it belongs to, so writing it without `default_level` errors while the datapack is parsed; a missing intermediate level or an unreachable key is rejected while the chain is rebuilt.

Advancement is driven by data rather than by the technique file alone: `mastery_resource` decides **what** measures mastery, the level's own `mastery` decides **how much** is needed, the level's `condition` decides **what else** has to hold, and whatever content lives outside the technique decides how the value grows (a trigger rule, a cultivation profile, or a script).

A learned technique advances level by level on the server's periodic check, at most one level per check, and only while all of these hold:

- `mastery_resource` is set;
- the holder's stored value for that resource is at least the next level's `mastery`;
- the next level's `condition` passes.

Advancing recalculates ability grants from the new level: `granted_abilities` plus the `ability` of every level reached so far, since `ability` is a minimum requirement. Advancing publishes the `mxt:progression_level` signal for other content to react to — it carries the rank just reached as the formula variable `level`, plus `owner` as an extension value. Because the levels live on the chain and the mastery value lives on a resource, a content pack decides for itself how mastery grows:

```json
// data/example/mxt/trigger/mastery_from_combat.json
{
  "trigger": { "type": "mxt:kill" },
  "action": { "type": "mxt:add_resource", "resource": "example:sword_mastery", "amount": 1 }
}
```

A technique with `configuration` but no `mastery_resource` never advances on its own; the other way round, `mastery_resource` without `default_level` is rejected while parsing, because there would be no chain to climb.

**Reading technique state.** The entity condition `mxt:technique` asks which techniques a body has **learned**: `techniques` takes an entry, a `#` tag or an array, an empty list meaning "learned any technique at all", and `match` is `any` (the default, where one hit is enough) or `all` (every written entry has to hold, and an empty list is rejected at load time rather than quietly turning into "always true"); `mxt:progression` then asks how far they have climbed. What it reads is **learned**, not "currently active" — techniques have no on/off switch, spirit roots and physiques do; to say "no technique", wrap one in `mxt:not`. A loot table uses the same `mxt:technique` name with an extra `entity` target field and the same shape otherwise (see [Loot and Advancement Criteria](../loot-and-criteria.md)). It asks the grant ledger a body carries, so a technique the current pack does not provide still answers. See [Entity Condition Types](../types/condition/entity_condition_types.md) for the field details.

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_guard"],
  "default_level": "example:azure_breath_1",
  "configuration": {
    "example:azure_breath_1": {
      "condition": { "type": "mxt:has_realm", "aura": "example:qi" },
      "ability": "example:azure_bolt"
    },
    "example:azure_breath_2": {
      "condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": ">=" },
      "ability": ["example:azure_bolt", "#example:azure_mastery"]
    },
    "example:azure_breath_3": {
      "condition": [
        { "type": "mxt:realm", "realm": "example:core_formation", "comparison": ">=" },
        { "type": "mxt:health", "comparison": ">=", "compare_to": 20 }
      ]
    }
  }
}
```

## Holding and Judgement {#holding}

With `learn_time` greater than `0` the technique becomes a **hold**: hold right-click to charge, and it is learned only once the progress runs out; releasing early counts as a cancel and nothing happens. The arm pose and the release cancellation come from the vanilla use cycle; the progress bar is **one line of action-bar text** (`#--------- 12%`) that stays up from the click until the read finishes or is let go, and a longer read moves its notch more slowly.

The two forms do not interfere: leaving `learn_time` out (or writing `0`) keeps the plain right-click learn, and a positive number makes it a hold. `learn_time` may be a formula (see [Number Provider Types](../types/number_provider_types)): it is evaluated **against the reader** — the value at the click is written into the use component and counted down by vanilla, while the progress bar and the sound are recomputed every tick, so a number that follows the body makes the bar jump; write a constant for a steady count.

**The item needs no special handling.** As soon as the stack **resolves to a manual** (it carries the `mxt:technique` component, or some [technique binding](./technique_binding.md)'s `items` claims it), the item gains the hold behaviour this technique asks for — whether it is a vanilla item, an item from another mod, or a KubeJS item. The carrier is the **stack**, so the item does not have to belong to any particular class, and it does not even have to be the `carrier_item` the binding writes.

How it works: the vanilla use cycle asks the **item stack** for two things — how long the action lasts, and which pose to play — and both questions read the vanilla `minecraft:consumable` component on the stack. The mod writes that component onto the held stack at the moment of the right-click, so the hold and the pose are driven by vanilla, without taking over any behaviour of the item itself. The write runs **independently on client and server**: both sides compute the same duration from the same synced stack and technique, so they show the same hold; the server strips the component again as soon as the hold starts, so it never reaches the save file.

`learn_time` / `hold_animation` / `hold_sound` are this module's field names; other modules have the same hold with different field names and the same behaviour. When a few stacks of one technique should read differently, they write the `mxt:technique_reading` component (same field names, all optional, overriding the technique **field by field**).

**The judgement runs on the server; the pose does not.** One vanilla use cycle has a separate counter on the client and on the server, and the server does not always hold 20 TPS — its 60 ticks then take longer in real time than the client's 60. The mod puts the **judgement** (is the read done, is the technique learned, the progress bar) on the server, so `learn_time` is "the number of ticks the server has to run", and it stretches accordingly when the server drops frames. That is the correct behaviour. **The arm pose follows the client's own counter**, so when the server drops frames or lags badly the pose can end a little before the judgement does: that tail is usually a tick or two and is invisible on a healthy server — only a server that clearly cannot keep up shows "the animation cuts off, then the technique arrives". This is not logged anywhere, so when it happens you can only judge by feel.

**A hold makes a sound, and everyone nearby hears it.** The reader hears theirs played on **their own client**, in step with the pose that client is drawing; everyone nearby hears a second one the **server** broadcasts by distance. The two are deliberately split — the server broadcast leaves the reader out, otherwise the reader would hear it twice. The default is a page turn, because the sound vanilla picks by default for "something you can use" is **chewing**, which sounds wrong while reading. The interval is **fixed**: the first sound lands 4 ticks in and then one every 4 ticks, whatever the length — vanilla's own rule waits out 1/5 of the duration, so a `learn_time` of days would stay silent for days; a `learn_time` of 4 ticks or less never makes one. Turn the sound volume down rather than editing this.

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
| `eat` (default) | Raised to the mouth, as if reading off the page (vanilla's eating motion). First person shows the item lift and jiggle; third person is the plain hold |
| `drink` | The same motion as `eat` |
| `block` | Held up in front, as if reading it |
| `brush` | The vanilla brush pose |
| `bundle` | The vanilla bundle pose |
| `toot_horn` | The vanilla goat horn pose |
| `none` | No pose, only the progress bar |

These values are refused with a load-time error:

- `spyglass`: vanilla equates that pose with scoping, and that check **forces the field of view to 0.1** and switches to low mouse sensitivity — both in code we cannot change. Vanilla also skips rendering the whole hand (item included) while scoping, so a "pose only, side effects suppressed" version would show nothing.
- `spear`: it brings its own arm transform, so vanilla skips the step that would raise the item, and these items have no matching arm model.
- `bow`, `trident`, `crossbow`: these scale the pose by how far the item is charged, and a reading has no charge to show, so it would look like drawing a bow that is not there; `crossbow` has a second problem on top of that — the first-person renderer has **no case for it at all**, so first person shows no motion whatsoever.

**The built-in technique book `mxt:technique_book` has its pose pinned**: it always reads with the default `eat`, and nothing a technique writes changes that — the pose belongs to that shared item, not to a technique. `hold_animation` only shows on a manual that **brings an item of its own** (a [technique binding](./technique_binding.md) that replaced it through `carrier_item`, or claimed an item through its `items`, which normally brings its own model); an `mxt:technique_reading` component cannot change the built-in book's pose either.
