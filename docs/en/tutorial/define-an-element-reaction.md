---
title: Define an Element Reaction
description: "Give a second element damage types to claim and write a reaction that fires once enough has built up: how much, how much is taken, under what condition, what runs, and how to watch it happen."
---

# Define an Element Reaction

An element has two abilities you can turn on separately. The first is **claiming damage types**: what element a strike *is* is not read off the attacker's spirit root but looked up from the strike's damage type — an element that lists it in `damage_types` **is** that strike. The second is **attachment**: a claimed strike leaves some of that element on its target, and once enough has built up an `element_reaction` answers.

This tutorial joins the two halves: it adds a second element, gives it damage types to claim, and writes a reaction that fires once enough has built up. **How the relations between elements (`overcomes` / `adapted_to`) change damage belongs to the damage system**; this page mentions them only where the element definition needs them to be complete and loadable, and does not go into them.

## What You Are Building

| File | Registry | Purpose |
| --- | --- | --- |
| `data/example/mxt/element/water.json` | `element` | The second element: it claims two damage types and says how much attachment each claimed strike leaves and how much decays per tick. |
| `data/example/mxt/element_reaction/steam_burst.json` | `element_reaction` | What fires once enough water has built up: how much is demanded, how much is taken, when it may happen, and what it runs. |

The example pack is already set up and [Define Aura and Realms](./define-aura-and-realms.md) is already done: it created the `example:qi` aura, the element that aura points at (`example:common`) and the value behind it. **A reaction needs no aura** — it knows only elements and attachment — but that page is what puts the first element in the pack.

## Step 1 — A Second Element and the Damage Types It Claims

```json
// data/example/mxt/element/water.json
{
  "damage_types": ["minecraft:drown", "minecraft:freeze"],
  "attachment_decay": 0.5,
  "damage_attachment": 4.0,
  "color": "#3388ff"
}
```

| Field | Default | What it does here |
| --- | --- | --- |
| `damage_types` | `[]` | Which damage types this element claims. An entry is a damage type id, a `#tag`, or an object that gives that kind of hit its own attachment. |
| `damage_attachment` | `0` | **How much attachment one strike made of this element leaves on its target.** |
| `attachment_decay` | `0` | How much of this element naturally decays on a body per tick. |
| `color` | `#ffffff` | Display colour, used on text such as aura spending. |

The priority once recognised is fixed: when one or more elements claim the damage type, the strike is **every claimant** (with several of them, multiplied); when nobody claims it but there is an attacker, it falls back to the enabled elements of the attacker's spirit roots; and with no claimant and no attacker it is empty, meaning no relation. **This channel is the only basis for the reduction layer on the defending side** — the target only ever sees the source of the hit, so the element has to be read back from the damage type. The upside is that **environmental damage can carry an element without touching vanilla code**: claim `minecraft:lava` or `minecraft:lightning_bolt` for an element and a lava bath or a lightning strike settles as that element.

Writing an entry of `damage_types` as an object gives that kind of hit its own attachment:

```json
{
  "damage_types": [
    "minecraft:drown",
    {"damage_type": "minecraft:freeze", "damage_attachment": 1.0}
  ],
  "damage_attachment": 4.0
}
```

A bare string or a `#tag` uses the element's own number; the `damage_attachment` inside the object may be omitted (that equals the element's default) and an explicit `0` is a proper answer — "this group leaves nothing at all". So "an ice bath builds up slower than drowning" needs no second element.

**Only the claimed route leaves attachment.** A strike's element has two sources: its damage type was claimed by some element, or nobody claimed it and it fell back to the attacker's spirit roots. Both take part in overcoming and adapting, but **only the first leaves `damage_attachment`** — the water in a body only decides how hard that hit lands, it does not soak anyone. An attack that should build up and fire a reaction therefore has to declare its own element.

How much gets through also depends on the target: the amount is then multiplied by the `attachment_multiplier` the **artifacts the target carries** declare (`0.5` leaves half, `0` leaves none at all).

A damage type listed in the `mxt:no_bonus` tag is the exception: that strike reads no element, and claiming it changes nothing.

To make the definition look complete you can add a relation, but **that belongs to the damage system**:

```json
"overcomes": [{"elements": ["example:common"], "multiplier": 1.5}]
```

`overcomes` is settled on the attacking side and `adapted_to` on the defending one, each relation carrying its own multiplier; writing the same target into two relations of one element is legal (every matching relation multiplies) but logs a warning at load. The full field list is in [Element](../datapack/json/element.md).

## Step 2 — What Attachment Is and Where It Lives

**The attachment itself lives in the entity attachment `mxt:element_attachment`**: keyed by element, carried with the save and with syncing, and a key is dropped the moment it reaches zero. So "how much has built up" and "what happens once enough has" are two separate things — this `element_reaction` definition only handles the second.

| Direction | Which route |
| --- | --- |
| Build up | `element.damage_attachment` (being struck, which is the definition above), and the entity action `mxt:attach_element` (every other source: standing in lava, taking a pill, a curse). |
| Wear off | The same `mxt:attach_element` written with a negative amount, or the element's own `attachment_decay` coming off every tick. |

The entity condition `mxt:element_attachment` reads the current amount without writing anything (a `{min?, max}` window per entry, every entry has to pass, and an empty map is refused at load):

```json
{"type": "mxt:element_attachment", "elements": {"example:water": {"min": 4, "max": 100}}}
```

An empty map is refused rather than passing everywhere. This is the read-only side of the accumulation system: an effect can depend on how much water a body carries without any reaction firing.

A reaction **has no event callback of its own**, and there is no player-facing entry point either — attachment and reactions are driven entirely by content (damage type claims and actions), and the mod ships no command, key or screen to add attachment or fire one by hand. Natural decay **never** fires a reaction: decay can only lower a total, so a demand that was unmet stays unmet.

## Step 3 — The Reaction Entry

```json
// data/example/mxt/element_reaction/steam_burst.json
{
  "amounts": {"example:water": 8},
  "consume": {"example:water": 4},
  "condition": {"type": "mxt:exposed_to_sky"},
  "action": {
    "type": "mxt:sequence",
    "actions": [
      {"type": "mxt:damage", "amount": 4},
      {"type": "mxt:attach_element", "element": "example:common", "amount": 2}
    ]
  },
  "priority": 10
}
```

| Field | Default | What it does |
| --- | --- | --- |
| `amounts` | **required** | How much each listed element has to accumulate for the reaction to hold. Every entry written has to be met **at once**, and an empty map is refused at load. |
| `consume` | same as `amounts` | How much is taken away when it fires. Omitting it takes the demand itself; an empty object `{}` takes nothing at all. |
| `condition` | `mxt:always` | Extra condition, for situational limits such as "only blows up while it rains" or "only reacts while standing in water". |
| `action` | none | The action run on the **holder itself** when it fires. |
| `priority` | `0` | Higher is tried first; equal values are ordered by registry id. |

`amounts` is a **demand**, not an amount: one reaction is "answer as soon as enough has built up" — the pipeline walks in priority order, takes the **first** whose demand and condition both hold, runs its `action`, takes its `consume`, and then **keeps looking**. One reaction can therefore lead into another.

`consume` has three writings with three different meanings:

| Writing | Result |
| --- | --- |
| Omitted | Takes the same amounts as `amounts`. |
| `{}` | **Takes nothing at all** — a reaction that answers without settling the bill, so the same attachment can fire it again and again. |
| Some keys only | Only those elements are taken; every other element keeps its accumulation as it is. |

A key written here must also appear in `amounts` — naming an element nothing demanded is a load error. The file above writes `{"example:water": 4}`, so one firing takes 4 away, 12 built up fires twice in a row, and the third has to build back up from 0 to 8.

`condition` takes an entity condition, so "standing in lava" and "only while it rains" are both writable. This one uses `mxt:exposed_to_sky`, which has no fields: it only reacts while the holder can see the sky. **That is not decoration** — while drowning builds the attachment up, the body is underwater; the sky only appears once it surfaces, which is what separates "enough has built up" from "and you are out of the water".

`action` runs ordinary entity actions, and `mxt:attach_element` lets it feed another element — which is how reactions chain. A chain is capped (at most `8` reactions per application), because "consume yourself and apply yourself again" is a legal writing: the cap is on the **whole chain** rather than one per layer, and an element applied from inside a chain only adds its amount, to be read by the running chain on its next pass. **Natural decay never fires a reaction**, so there is no risk of it feeding itself.

## Step 4 — Watch It Happen in Game

Data pack registries are read **while the world loads**, and `/reload` does not read them again: after editing the files, leave to the title screen and open the world again, or restart the server. A file that fails to decode makes the world unloadable, so when the world will not open, read the last codec error in the log first.

```text
(load the world again)
/mxt registries validate          → nothing reported
/mxt registries list              → mxt:element=2, mxt:element_reaction=1
```

Every step of the reaction can be watched on its own:

1. **Watch the attachment build up.** Go into water and let yourself drown, or get frozen. To see it at once, call `MxtElements.amount(entity, 'example:water')` from a KubeJS server script, or add it directly with `MxtElements.attach(entity, 'example:water', 4)` — that goes through the **same** pipeline a strike does, and the reaction fires as usual once enough has built up.
2. **Watch the reaction fire.** Build up past 8 underwater and then surface: the moment `condition` holds you take a hit (`amount` 4) and gain 2 of `example:common`. Carry water breathing, or just use creative mode, so you do not drown while working out which hit is the reaction's.
3. **Watch how much is taken.** Build up to 12 and let it fire: 4 comes off, so it fires twice in a row — change `consume` to `{}`, open the world again and the same attachment answers forever.
4. **Watch priority.** Add a second reaction over the same element with a lower `priority` (say `0`) and it will not go first: the pipeline takes the highest one. Equal values are ordered by registry id.
5. **Watch the claim.** Delete `minecraft:drown` from `damage_types`, open the world again and drown: the attachment does not move at all — nobody claims that strike, so nobody books it against this element.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The reaction never fires | No element claims those damage types, so the attachment stays at 0: a claim is what books attachment, and a strike that falls back to a spirit root leaves none. |
| It only fires in one place | `condition` does not hold. Any condition other than `mxt:always` has to be genuinely true at that moment. |
| `Element reaction needs at least one element to be about` | `amounts` is an empty map. An empty map is refused at load rather than never holding. |
| `Element reaction consumes an element it never asked for` | `consume` names an element that does not appear in `amounts`. |
| `Element attachment numbers must be finite and non-negative` | The element's `attachment_decay` or `damage_attachment` is not a finite non-negative number. |
| The attachment grows more slowly than expected | An artifact the target carries scaled it down (`attachment_multiplier`), or an object entry in `damage_types` gave that kind of hit a smaller number. |
| The type is claimed but nothing builds up | That damage type is in `mxt:no_bonus`: it takes no part in bonus settlement and leaves no attachment. |
| The reaction fires over and over | `consume` was written as `{}`, or the `action` applies the same element again. The latter is legal and the whole chain is bounded by the cap of `8`. |
| `Ignoring invalid list element` appears | An entry in some tolerant list was broken and dropped. Maps such as `amounts` / `consume` are not tolerant lists — a broken entry fails the definition outright. |
| Editing the files changes nothing | Data pack registries are read when the world loads, and `/reload` does not read them again. |

## Next

- [Element Reaction](../datapack/json/element_reaction.md) — the full field lists for `amounts` / `consume` / `condition` / `action` / `priority`, and where the accumulation lives.
- [Element](../datapack/json/element.md) — the claimed damage types, each kind of hit's own attachment, buildup and decay, and how `overcomes` / `adapted_to` take part in damage.
- [Define Spirit Roots and Physiques](./define-spirit-roots-and-physiques.md) — a body holding elements of its own, and the difference between held and in effect.
- [The Damage System](../technical/damage.md) — the full path from a strike being dealt to a target losing health, and which layer the element relations sit on.
