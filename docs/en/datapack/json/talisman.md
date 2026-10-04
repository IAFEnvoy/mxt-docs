---
title: Talisman (talisman)
description: "Defines one inscribed talisman: the abilities invoking it grants, how much aura its carrier holds, and what one invocation takes."
aside: false
---

# Talisman (talisman) {#talisman}

File location: `data/<namespace>/mxt/talisman/<path>.json`

**Purpose**: talisman definitions: the abilities one inscribed talisman carries.

A talisman definition says what happens once it is inscribed onto a carrier: which abilities invoking it grants, how much aura the carrier can hold, and what every invocation pays. **A carrier can also be drawn at the talisman workstation**: a drawing recipe's top-level `talisman` field names one of these definitions by id, and that is what comes out, see [`mxt:talisman_drawing`](./talisman_drawing.md).

**`abilities` is the only effect field.** Every skill-like effect in this mod lands on an ability, so a talisman needs no effect vocabulary of its own. The other five optional fields each answer one thing: `capacity` is the carrier's pour capacity multiplier (see [Pouring and Firing](#pouring-and-firing)), `durability` / `consume` are its wear (see [Wear](#wear)), `costs` is what every invocation pays (see [Cost](#cost)), and `condition` is whether this holder may use the talisman right now (see [Condition](#condition)). **The definition has no `quality` field** (the component on a carrier holds a list of inscriptions, so there is no single definition on the stack to ask); the tier is described under [Tier](#tier).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `talisman.mxt.<namespace>.<path>` | Optional display name. When omitted it uses the default key in the left column. |
| `description` | Text Component | `talisman.mxt.<namespace>.<path>.description` | Optional description. When omitted it uses the default key in the left column; it is stored and read today, but nothing draws it yet. |
| `abilities` | Ability id, `#tag`, or an array of either | `[]` | The abilities this talisman grants, written the same way as `technique.granted_abilities`: a single id, an array of ids, or a `#tag`. |
| `capacity` | double | `1` | The carrier's **pour capacity multiplier**: the capacity is one invocation's aura amount × this multiplier, counted per aura and rounded up to whole units. It has to be at least 1; anything below is refused at load. |
| `durability` | int | `0` | How much wear this talisman gives a carrier once it is written on, with entries on one carrier **adding up**. `0` or omitted means this talisman keeps no wear account, and the carrier is still spent as one whole item per invocation. It cannot be negative. |
| `consume` | int | `1` | How much wear one invocation takes off, at least 1. It only means anything while `durability > 0`. |
| `condition` | [Entity condition](../types/condition/entity_condition_types.md) | `mxt:always` | Whether this holder **may use the talisman**, unrelated to its price. It is tested against the **holder** and comes **before `costs`**: when it fails, the invocation is refused with nothing moved at all — the carrier is not spent, no wear is taken, the store is not drawn on and the holder's account is untouched. **Every inscription on one carrier has to pass**, so one of them saying "not now" refuses the whole carrier. It can also be written as an array of conditions (an implicit AND). |
| `costs` | Array, entries as in [`Cost`](../types/shared_data_types.md#cost) | `[]` | What **one invocation** pays, with the entries on one carrier adding up. Anything that cannot be paid refuses that invocation; "when it may not be used at all" goes in `condition`. |

`capacity` is roughly how many times in a row the carrier can fire: the capacity is one invocation's aura amount × the multiplier that really applies, and that multiplier is `min(the written value, the uses the carrier has left)`. The uses left come out of wear (see [Wear](#wear)): a carrier declaring no wear counts as exactly 1, and one with wear counts as at least 1, so the multiplier only means anything on a talisman with wear, and writing it too large never wastes a pour. The default `1` is "exactly one invocation".

It is a **multiplier, not an aura table**: the capacity comes out of `costs` itself — over several inscriptions on one carrier, each inscription's amounts and multiplier are multiplied and then added up — so a pack never writes it aura by aura. A carrier's capacity may be written as `5` or `2.5` (≥ 1). `capacity` and the aura entries of `costs` are the two halves of "how much is poured in" and "what one invocation spends", and neither depends on the holder.

`consume` only means anything while `durability > 0`: with `durability` at 0 that number is never read, so writing it is **silently ignored**, the same rule as an unknown key.

**The definition has no `quality` field**: the `mxt:talisman` component on a carrier holds a list of inscriptions, so there is no single definition on the stack to ask. A talisman's tier comes either from the `grades[].quality` a drawing recipe hits by completion, which is written into the carrier's `mxt:quality` component when it is inscribed, or from the fallback tier the [default_quality](./default_quality.md) data map gives the carrier item under its id or a `#`-prefixed tag. Once that component is written the ordinary quality rules apply (the tooltip's tier line, a quality's own `condition`, upgrading along the ladder, `value_multiplier`).

An `mxt:aura` entry in `costs` comes out of the **store poured into the carrier itself**, and short of it means "not charged", which refuses the invocation; `mxt:resource` / `mxt:item` / `mxt:js` entries are charged to the **holder** when it fires. Anything that cannot be paid **refuses the invocation**. A threshold that has nothing to do with the price — a realm, the weather, an item in hand, a chance — belongs in `condition`, which is asked before `costs`; see [Condition](#condition).

A definition has **no** switch of that kind for "does it answer an invocation": whether a carrier fires the moment it is full or banks the charge until you act is a **mode on the carrier itself (on the stack)**, not a property of the definition. The same inscriptions can go onto one talisman that fires when full and onto another that sits and waits. The modes are under [Carrier Mode](#carrier-mode) below and on [Items](/en/player-guide/items).

## The `/talisman` Command

Inscribing writes an item component, so the `/talisman` subtree is for operators who would rather name a definition than write component syntax. Every node in the subtree needs the `gamemaster` permission.

| Command | Description |
| --- | --- |
| `/talisman` or `/talisman blank [count]` | Hands out blank carriers. |
| `/talisman give <talisman>` | Hands out a carrier inscribed with that one talisman definition, in the `fire` mode; when the definition declares a `durability`, its cap is written into the item component on the spot, so the carrier has a durability bar the moment you get it. |
| `/talisman give <talisman> count <1..64>` | The same, for a whole stack — except that a carrier with wear does not stack, so this hands out that many **single** carriers (see [Wear](#wear)). |
| `/talisman give <talisman> count <1..64> charged` | The same, already poured full. |
| `/talisman give <talisman> stored [count <1..64>]` | The same, in the `store` mode. A storing carrier is poured by hand, so this branch offers no `charged`. |

`give` takes **one** talisman id at a time: a carrier is inscribed with a single definition. To write several onto one carrier, write the `talismans` list of the item component directly, for example `give @s mxt:talisman[mxt:talisman={talismans:["mypack:flame_sigil","mypack:common_sigil"]}]`. The definition argument is completed from the loaded `talisman` registry.

## Pouring and Firing

A carrier has **a store of aura of its own**: the capacity is one invocation's aura amount × `capacity`; a pour moves 1 unit a tick and charges 1 point of the holder's own aura per unit; and every invocation draws, for each aura `costs` names, that aura's one-invocation amount out of it.

### Pouring

- **A big multiplier fires several times in a row**: with 12 a shot in `costs` and `capacity` at 5, the capacity is 60 and one full pour fires 5 times with no pouring in between. A talisman with wear (`durability` / `consume`) exists for exactly this: one pour lasts its whole wear. With the default multiplier of `1` the capacity is one invocation's worth, and every invocation has to be poured for again.
- **The multiplier is capped by "how many more times it can fire"**: the multiplier that really applies is `min(the written value, the uses left)`, and the uses left are `(wear cap − current damage) / consume`. A carrier written as 5 with only 3 uses left is therefore poured for 3, and filling it costs no extra aura. Conversely, **wear ground off from outside** (`mxt:damage_item`, anything other than a vanilla repair) shrinks the capacity with it, while what has already been poured in does not vanish — it comes back, as the part that was never spent, when the carrier is finally destroyed (see [Wear](#wear)).
- **Each aura is counted separately**: the carrier stores one pool per aura `costs` names, and one pour only fills the **first entry that is not full**, in the order the inscriptions' `costs` are written; holding on after one entry is full continues with the next.
- **Both the capacity and the per-invocation amount have to be priced without a holder**: the length of a pour comes from "capacity ÷ the units moved per tick", and the client has to work out the same number to draw the pose, so the aura entries of `costs` are evaluated against an **empty formula context** (the same rule `item_aura.aura` uses for capacity), while the multiplier itself is a constant. An aura entry therefore only takes a constant or an expression that does not depend on the holder; an expression that only has a value with somebody there, such as `"realm_rank * 4"`, resolves to 0 and is treated as "this entry does not count". An aura entry that resolves to 0 is simply an aura this invocation does not want.
- **No aura entries**: a talisman whose `costs` names no aura entry has nothing to pour, so holding right-click never enters a pour — but it is **"ready" at any moment**, so **a right-click invokes it**, and only when `costs` holds other entries is the holder charged on the spot.
- **How to pour**: hold the carrier and hold right-click, the same gesture a spirit stone uses to charge (`BLOCK` pose, a prompt sound every 4 ticks, the action bar showing `stored / capacity`). Pouring spends no item; only an invocation takes its price — a carrier with no wear spends one whole item, and one with wear loses wear.

### Firing

- **Firing is judged by "can it afford one invocation", not by "is it full"**: once the store covers one pass of the aura entries in `costs`, a right-click is an invocation; below that it is a pour. The moment it is poured **full** (reaching the capacity), a `fire`-mode carrier fires on its own, and that is the only time it does so automatically. That is what the tooltip line says: "Enough spirit power - right-click to invoke" / "Hold right-click to pour spirit power in". A carrier that cannot afford one invocation turns a right-click into a pour rather than an invocation, so the gesture splits in two by "can it afford one invocation".
- **A bare-handed right-click and "being poured full" go through the same entry point**, and the [carrier mode](#carrier-mode) decides which of them fires and when. Under either mode a **right-click** can fire it: if it did not fire on its own, because of an ability cooldown or anything else, a right-click is the only route left — and for a talisman that is "ready" at any time it is the only route there is.
- **It does not have to be in a hand**: a carrier is reported by **whoever filled it**, not by the holder — a talisman sitting on a display stand fires all the same when a player or a spirit burst fills it (`store` mode excepted, it only accumulates). The **actor** is still whoever filled it: paying, being recorded and answering for its abilities all land on them, while the **position** is the display stand the carrier sits on.

### Carrier Mode

The mode lives in the `mxt:talisman` component on the stack, **not** in a definition field, so the same inscriptions can behave differently on different carriers.

| Mode | Behaviour |
| --- | --- |
| `fire` (default, what you get when it is left out) | Fires on its own the moment it is full. |
| `store` | Only accumulates, and waits for you to act. |

**Sneak + right-click** switches the mode, with one action bar line to say so; the tooltip reports the current mode too. One special case: while `store` and **already full**, a sneak-use does **not** switch it — it fires directly (stored aura is there to be spent, and "a mode that wants to fire" is the clearest possible "spend it now"), so that talisman is consumed.

### Where the Position Goes

The position enters the ability's formula context as `block_x`/`block_y`/`block_z` (the same way a trigger such as `block_break` gives a position), and it is handed to everything that "happens somewhere" as this invocation's **origin**: `spawn_projectile`, `spawn_particles`, `spawn_effect_cloud`, `spawn_lightning`, `explode`, `play_sound` and `block_action` all use the origin as their position; the **box** of the `mxt:area` target selector (side `2 × radius`, not a sphere) is centred on it, and `mxt:ray` and `mxt:cone` count from it as well (the caster's eye position is used only when there is no origin); a bi-entity action such as `mxt:teleport` that "moves the target to the actor" moves it to the origin as well. The origin defaults to the actor itself, so ordinary casting is unaffected. Projectiles still fire along the **actor's** facing — the position is "where it comes from" and the facing is "who is aiming". The boundary: the `condition` family (aura environment, light level, exposure to the sky, the block underfoot and so on) and anything that reads the environment's aura by position still go by the **actor's** own position.

### Hand-Use Cooldown

Controlled by **Server Config → Talisman → Use Cooldown**, not by the data pack. It is in ticks, range `0..72000`, default `20` (1 second); `0` turns it off.

- **One "attempt" starts it**: a click an ability refused because of its own cooldown or an unpayable cost, or one the talisman's own `condition` refused, still counts, since that click really was an attempt to invoke; a blank carrier and one whose store cannot cover a single invocation **never became an attempt** and cost no cooldown — those cases only give the player a line of explanation and can be retried at once.
- **It only gates the "hand" path**: a pour that fills the carrier and fires it automatically is limited by it just the same. Filling it inside the window does not fire it, and that tick's aura is **not poured in at all** (pouring it in would be paying for an attempt that is bound to be refused), so what you see inside the window is a talisman that does not move, and once the window passes the same pour fires normally.
- **The display stand path ignores it entirely**: a talisman on a stand is in nobody's hand, and fires the moment it is full — it is neither refused because the filler is inside a window, nor does it record a window for anybody.
- The cooldown rides vanilla's item cooldown, so the hotbar's grey sweep and the `mxt:on_cooldown` item condition both read it directly. And because every carrier in this mod is the same item `mxt:talisman`, this cooldown is recorded **per player** and per item: the other talismans in hand cannot be pressed inside the window either, which is exactly the "clicking through a stack of talismans within one second" it is there to block.
- The window is recorded in vanilla's cooldown group, whose name is just an id. A carrier in this mod has no `use_cooldown` component, so the group is the item registry name `mxt:talisman`; to put one family of talismans in a group of its own, add `minecraft:use_cooldown` (with a `cooldown_group`) to the item — the code side needs no change. What actually blocks the click in game is vanilla itself, which looks at the cooldown before it ever asks the item, so inside the window what you see is the hotbar's grey sweep and nothing happening.
- **Spending splits by "where it is"**: a hand spends one whole item per invocation, but **creative mode spends nothing**; one placed on a display stand is **always spent**, whether or not the filler is in creative mode. **A talisman that declares wear turns both paths into taking wear**, and the creative exception holds there as well (a hand takes no wear, a stand takes it just the same).

### Wear

`durability` is how many points of wear this talisman gives a carrier and `consume` is how many one invocation takes off, and both **add up over the entries inscribed on one carrier**: one declaring 10 points at 1 per invocation and another declaring 5 points at 1 per invocation written together make 15 points at 2 per invocation. An entry that declares no wear fires along with the rest but is not booked.

- The cap lands on the **vanilla components**, so the durability bar, vanilla repair and enchanting, and the whole set of the `mxt:durability` / `mxt:relative_durability` item conditions and the `mxt:damage_item` item action all work as they are; this mod keeps no second durability system.
- What the framework writes is **vanilla's own set**: `minecraft:max_damage` + `minecraft:max_stack_size: 1` + `minecraft:damage: 0`. All three are needed: without `damage` the stack does not count as damageable (so no durability bar), and a `max_stack_size` above 1 is refused by vanilla as "both damageable and stackable", so a content pack patching its own components has to write all three as well.
- The moment it is written is **when the carrier is handed over**: a carrier from `/talisman give` has a durability bar the moment you get it. A carrier a pack builds itself (a recipe with a component patch) gets it on its **first invocation**. **A `max_damage` the pack has already written onto the stack wins over the summed definition value**, so one definition can produce a batch of 3-point carriers and a batch of 10-point ones; it only moves the cap, and whether anything is taken off is still decided by the definition.
- **Wear belongs to a single carrier**: a carrier with wear does not stack (`/talisman give count` hands out that many single carriers), and a stack of several keeps no wear and is still spent as one whole item per invocation.
- **The uses left are worked out from the wear**: `(cap − current damage) / consume`, rounded down (a partial point of damage does not buy an invocation). **A carrier declaring no wear counts as 1**, and one with wear counts as **at least 1** — one that the wear has not destroyed yet can always fire once more, and that one is the invocation that destroys it. This number is the real cap on the `capacity` multiplier, and the answer to "how much more can still be poured in".
- **The invocation that takes the wear to or past the cap destroys that carrier**: the aura this invocation owes is **still taken** (it really did fire), and afterwards **the part that was never spent** in the store is returned to that invocation's actor at the price it was poured in for, 1 unit of aura = 1 point of the resource it is counted in. Whatever cannot be taken is lost with the talisman paper and does not fail the invocation. A carrier declaring no wear is still spent as one whole item per invocation and returns the unspent part the same way; its store is **shared by the whole stack**, so in that case it only comes back once the whole stack is used up.
- The tooltip has a line of its own, "Durability: left / cap", and it can read the summed value from the definitions even before the components are written.

### Condition

`condition` asks whether **this holder may use the talisman right now**, unrelated to its price, and is written exactly like every other condition field (see [entity condition types](../types/condition/entity_condition_types.md); an array of conditions means all of them have to pass). It is tested against the **holder** (for a talisman on a display stand, whoever filled it), it can read the `block_x` / `block_y` / `block_z` position values, and it comes **before `costs`**: when it fails the invocation is refused with the action bar saying "its invocation condition is not met", and **nothing has moved** — the carrier is not spent, no wear is taken, the store is not drawn on and the holder's account is untouched, so a condition can never make anybody pay for nothing.

**Every condition on one carrier has to pass**: one of them saying "not now" refuses the whole carrier rather than firing only the inscriptions that allow it. It and an ability's own `condition` are two gates: the talisman's is asked first, the ability's is still asked as each ability fires, and that one only affects the ability it belongs to.

It gates **firing** alone: pouring and storing are unaffected, so a carrier whose condition fails can still be poured full and used once it is met.

### Cost

`costs` is what **one invocation** pays, in the same shape as an ability's own `costs` (`mxt:resource` / `mxt:aura` / `mxt:item` / `mxt:js`) and settled by the same transaction — there is no second payment path. It splits into two routes: **aura entries come out of the carrier's own store** (the container `capacity` sizes, bought in while pouring at 1 point of the holder's own aura per unit), while **every other entry is charged to the holder when it fires**.

The latter is planned **before** the invocation: anything that cannot be paid **refuses that invocation**, with the action bar saying whether it is "not enough spirit power" or "the required items are missing", and the carrier, its wear and its store all stay untouched. This is a threshold such as "not enough spirit power to use this" **set by the definition**, while "when it may not be used at all" goes in `condition`, which is asked ahead of it. The plan is read-only, and the real deduction happens **after at least one ability has really fired**; one invocation may write several entries at once, and the `costs` of several inscriptions on one carrier add up. Aura entries are taken **at the amount written**, fractions included — it is the capacity side that rounds up, because one pour only moves whole units.

### Tier

**The definition has no `quality`**: the component on a carrier holds a list of inscriptions, so there is no single definition on the stack to ask. A carrier's tier has two sources: the `grades[].quality` a drawing recipe hits by completion, which is written into the carrier's `mxt:quality` component when it is inscribed; and the tier the [default_quality](./default_quality.md) data map gives the carrier item under its id or a `#`-prefixed tag, which is the **fallback** — the last layer of resolution, and one the framework itself never writes onto the stack. Once the component is written, the whole ordinary quality module applies: the tooltip's tier line, a quality's own `condition`, upgrading along the quality ladder, and a quality's `value_multiplier`.

### How an Invocation Resolves

The inscribed abilities each go through the ordinary ability use path: the ability's own condition, word, charges, cooldown and costs, plus both use events, all apply as usual, and the only thing replaced is "this ability has been granted to you" — **the talisman itself is the source of the grant**, which is why carrying one talisman lets you cast magic you do not know. Cooldown, charges and costs are therefore shared between the talisman and the spell, and a talisman is not a back door around them.

**It can only carry abilities that take effect at once**: an ability that needs a cast (`cast_time > 0`) or a standing channel (`mxt:channelled`) is refused — finishing a cast or a channel has to be advanced off the list of abilities the **holder has been granted**, and a carrier never grants anything. On a refusal the carrier is not spent and the aura is not cleared, so you can swap in another talisman or another ability.

**An invocation happens where the talisman is.** That place is both the centre the targets are picked around / the ray's origin (a talisman on a stand goes by the stand) and the default landing place for anything that "puts something out": a bolt, an explosion, particles, a sound or a block action lands at the talisman's feet (or where you stand while holding it), which is especially easy to run into with `mxt:targeted`. To land them **at the target's own position**, wrap that entity action in `mxt:target_action` with `"use_target_position": true` (see [bi-entity action types](../types/action/bientity_action_types.md)); plain damage needs none of this, since `mxt:damage_target` and `mxt:damage` read the entity, not the position.

## Naming and the Item Component

The display name can be written as the optional `name` field; omit it and the translation key is generated from the identifier, `talisman.mxt.<definition namespace>.<path>`: `mxt_test:flame_sigil` → `talisman.mxt.mxt_test.flame_sigil`. The optional `description` is the same, and when it is omitted it is the generated key with `.description` appended.

Example:

```json
// data/example/mxt/talisman/flame_sigil.json
{
  "abilities": ["example:qingxiao_firebolt"],
  "capacity": 10,
  "condition": {"type": "mxt:resource_compare", "resource": "example:true_essence", "min": 2},
  "costs": [
    {"type": "mxt:aura", "aura": "example:qi", "amount": 12},
    {"id": "example:true_essence", "amount": 2}
  ],
  "durability": 10,
  "consume": 1
}
```

This talisman takes 12 `example:qi` per invocation and charges the holder another 2 `example:true_essence`; its capacity multiplier is 10 (= 120 units, good for 10 invocations) and its wear is 10 points at 1 per invocation — one full pour uses up exactly its wear. Writing 20 would change nothing: only 10 uses are left, so the multiplier that applies is stuck at 10. Its `condition` asks for 2 `example:true_essence` in the holder's hands (exactly the sum one invocation charges): short of it the condition refuses first and the account does not move at all, and only once it is met does `costs` settle.

Which talismans are already inscribed is kept in the item component `mxt:talisman`: a list of `talisman` entries in the order they were appended, plus a `mode` field (`"fire"` (the default) or `"store"`), and an empty list is the blank carrier a freshly made one is. The component stores **concrete entries**, so it cannot name a tag. Pouring progress is kept separately in `mxt:spirit_storage`, the storage component shared with spirit stones, recording the units poured so far by **aura**; when it is absent, nothing has been poured. The component and the carrier are described under [Items](/en/player-guide/items).

The pigment a brush draws with is that brush's own store, in another item component, `mxt:brush_pigment`: a **non-negative integer** where one unit is one pixel of stroke length, and omitting it is the same thing as `0` (an empty brush either way). A brush does not stack; drawing takes the store down by the length of each stroke. Refilling is the vanilla bundle's click: with the brush on the cursor, **click a stack of pigment** (either mouse button) and it takes one portion per click; what one portion is worth is **Server Config → Talisman → Pigment Per Portion**.
