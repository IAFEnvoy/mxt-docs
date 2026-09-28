---
title: Define a Talisman
description: Write a talisman definition, hand it to a player, pour aura into it and fire it — capacity and cost as two fields, the two carrier modes, the hand and display-stand rules, and why inscribing is still command-only.
---

# Define a Talisman

A talisman carries abilities on an item: it inscribes a few abilities, you fill the carrier's own store of aura, and it casts them for you. **The definition only says what is inscribed, how much fits and what one invocation costs**; whether it fires the moment it is full or waits for you to act is a **property of the carrier** (on the item stack), not of the definition.

::: warning Inscribing has no in-game entry point yet

The brush `mxt:talisman_brush`, the ink `mxt:talisman_ink` and blank paper `mxt:blank_talisman` are currently **plain items with no behaviour** — "hold the brush and write the ability onto it" is not wired up. Today only three things can write a talisman into a carrier: `/talisman give …`, item component syntax (the `components` of `/give`), and the single-inscription item the creative picker builds.

So this tutorial covers the chain that genuinely runs today: **define → hand out → pour → fire**. When the inscribing service lands, step 3 will gain the manual path.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/aura/qi.json` | *(existing)* A talisman's capacity and aura costs can only reference a **concrete** aura definition. |
| `data/example/mxt/ability/spark.json` | The ability to be inscribed: it runs its own action fields when fired. |
| `data/example/mxt/talisman/flame_sigil.json` | The talisman definition: what it inscribes, how many invocations it holds, what one invocation takes. |

## Step 1 — An Ability a Talisman Can Carry

```json
// data/example/mxt/ability/spark.json
{
  "type": "mxt:active",
  "cooldown": 60,
  "entity_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:fire_resistance",
    "duration_ticks": 120
  }
}
```

The four action fields are written at the ability's own top level (see [Ability · The Four Action Fields](../datapack/json/ability.md#action-fields-by-type)), so "what happens when it fires" is written on `example:spark` itself — **one ability is enough**, with no second `mxt:interval` to split out. The `"effect": "minecraft:fire_resistance"` above is a parameter of the `mxt:apply_effect` action (the status effect it applies) and has nothing to do with the withdrawn ability-reference `effect`.

**Only abilities that take effect at once can be carried.** An ability with a cast time (`cast_time > 0`) or one that is channelled (`mxt:channelled`) is refused, because finishing a cast or a channel walks the list of abilities the actor *holds*, and a carrier never grants anything. A refusal costs neither the carrier nor the stored aura, so you can swap the talisman or the ability and try again.

## Step 2 — The Talisman Definition

```json
// data/example/mxt/talisman/flame_sigil.json
{
  "abilities": ["example:spark"],
  "capacity": 5,
  "costs": [{"type": "mxt:aura", "aura": "example:qi", "amount": 12}],
  "durability": 5,
  "consume": 1
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `abilities` | `HolderOrTag<ability>[]` | `[]` | The abilities it inscribes: one id, an array, or `#tags`, exactly as in `technique.granted_abilities`. |
| `capacity` | double | `1` | The **pour capacity multiplier** (at least 1): the capacity is one invocation's aura entries times it, which is roughly "how many times this carrier can fire in a row". The multiplier that applies is then capped by **what the carrier has left** (worked out from its wear: none means one, and wear means at least one). |
| `durability` | int | `0` | How much wear it gives the carrier, summed over everything written onto one carrier; `0` or omitted means no wear account and the carrier is still burned one per use. |
| `consume` | int | `1` | How much wear one invocation takes off (at least 1); it only means anything with a `durability` above zero. |
| `quality` | `Holder<quality>` | none | The tier of this talisman (talisman paper and talisman treasures are graded this way), resolved through the ordinary quality module. |
| `condition` | Entity condition | `mxt:always` | Whether **this holder may use the talisman right now**, unrelated to its price; tested against the holder and asked **before `costs`**, and when it fails the invocation is refused with nothing moved. |
| `costs` | `Cost[]` | `[]` | What **one invocation** takes: an `mxt:aura` entry comes out of the carrier's own store, every other entry from the **holder**; a price that cannot be paid refuses the invocation. |

Three semantics worth keeping:

- **The multiplier only means anything with wear.** A carrier with no durability is burned whole on its first invocation, so it counts as one and a larger multiplier changes nothing — write `durability` / `consume` alongside it to fire several times.
- **The aura entries are evaluated in an empty formula context**, because the client has to compute the same number to draw the pose. Anything that only has a value when somebody holds the item — `"realm_rank * 4"` — therefore resolves to `0` and is treated as **not counted**; a carrier left with no aura entry at all is a free talisman.
- **Capacity and per-invocation amount are two fields.** The multiplier is how many invocations the carrier holds (reaching it is what "full" means) and the aura entries of `costs` are what one invocation takes. The example's 12 x 5 means **one full pour fires five times**; for "exactly one shot at a time", leave the multiplier out (it defaults to `1`). Write `durability` / `consume` to make it last (see "Durability" in step 4), `costs` to gate it by price and `condition` to gate it by anything else (a realm, the weather, what is in hand), and `quality` for a tier — all four are described in full under [the talisman definition](../../datapack/json/talisman.md).

## Step 3 — Handing the Talisman to a Player

```text
/talisman blank                                 one blank carrier
/talisman give example:flame_sigil              one inscribed, uncharged carrier
/talisman give example:flame_sigil count 3      three of them
/talisman give example:flame_sigil charged      one, already filled — the next click fires it
/talisman give example:flame_sigil stored       inscribed in store mode (accumulate, act yourself)
```

The whole `/talisman` subtree needs gamemaster permission; the top-level alias is controlled by **Server Config → Command Aliases → /talisman** (on by default), and `/mxt talisman` stays complete when it is off. `charged` and `stored` cannot be combined, and `charged` may only follow `count`.

Item component syntax does the same thing — what a carrier stores is a **list of concrete entries plus a mode**:

```mcfunction
give @s mxt:talisman[mxt:talisman={talismans:["example:flame_sigil"],mode:"fire"}]
```

`mode` defaults to `"fire"`, and an empty list is a brand-new blank carrier. Pouring progress lives in `mxt:spirit_storage` (the same component spirit stones use).

## Step 4 — Pouring and Firing

**Pouring**: hold the carrier and **hold right-click** (the same gesture spirit stones use: a `BLOCK` pose, a chime every 4 ticks, "stored / capacity" on the action bar). Each tick pours 1 unit and charges 1 point of your own aura, so a per-invocation amount of `12` takes 12 ticks of holding and a capacity of 60 takes 60; one gesture lasts at most 200 ticks. **Pouring consumes no items** — only firing takes a carrier (or its wear, where the talisman declares a durability) — while the aura is paid as you pour, one for one.

**Firing** is decided by the carrier's mode, and in either case it needs **enough stored aura to cover one invocation's aura entries** (below that, a right-click becomes a pour):

| Mode | Behaviour |
| --- | --- |
| `fire` (default) | Fires **automatically** the moment it is full. |
| `store` | Only accumulates; **right-click** fires it. |

**Sneak + right-click** toggles the mode (with an action-bar line, and the tooltip always shows the current mode). One special case: a `store` talisman that is **already full** does **not** toggle on a sneak-use — it fires and consumes the talisman (stored aura is there to be spent).

When it fires, each inscribed ability goes through the **ordinary ability use path**: its own conditions, cooldown, charges and costs all apply, and the only thing replaced is "you have been granted this ability" — **the talisman itself is the source of the grant**. So carrying one lets you cast magic you never learned, but a talisman is **not a back door** around those gates. Only when **at least one ability really fires** is that invocation's aura taken (and the carrier consumed or its wear taken); if every one is refused, the carrier and its aura survive. When the capacity holds several invocations, **only the one is taken** and the rest stays for the next shot.

**Firing from the hand has a cooldown**, controlled by **Server Config → Talisman → Use Cooldown** (ticks, `0..72000`, `20` by default) rather than by the datapack; lower it or set it to `0` to click several times in a row. Its boundaries are worth knowing:

- **One "attempt" starts the cooldown**: an ability refused for its own cooldown or for an unaffordable cost still counts, because that click really was an attempt.
- **A blank carrier and one short of a single invocation do not count as attempts** and cost no cooldown — those cases only tell the player something and can be retried at once.
- Since every carrier is the same item `mxt:talisman`, the cooldown is recorded **per player, per item**: your other talismans cannot be used inside the same window either.

## Step 5 — The Display Stand: Firing Without Holding

Put a carrier on a display stand (right-click the block while holding it — **placing does not fire it**), then charge it with a spirit burst (default `V`): the moment it is full it fires where it stands.

The stand path follows **different rules** from the hand:

| | In hand | On a stand |
| --- | --- | --- |
| Use cooldown | Read and recorded | **Ignored** entirely, not recorded |
| Carrier consumed | One, **not in creative mode** | **Always**, whoever filled it and whatever their game mode |
| Actor | The holder | **Whoever filled it** (they pay, are recorded and answer for the abilities) |
| Position | The actor | **The display stand's centre** |

A talisman that declares a `durability` turns both paths into **wear** instead (the cap lands in the vanilla components — `minecraft:max_damage` with `minecraft:max_stack_size: 1` and `minecraft:damage: 0`, which is what gives the carrier its bar and keeps vanilla repair working, plus the `mxt:durability` / `mxt:damage_item` building blocks): each invocation takes `consume` off, and the invocation that reaches or passes the cap destroys the carrier (that invocation's aura is **still taken**; only **what it did not spend** goes back to the actor at the pour's own price). The numbers are **summed over everything written onto one carrier** — a 10-point entry costing 1 and a 5-point entry costing 1 written together make 15 points costing 2 — and an entry declaring no durability rides along without paying. The framework writes the cap when it hands a carrier over (`/talisman give`, which then hands out single carriers because a worn carrier cannot be stacked), a carrier a pack builds itself gets it on its first invocation, and a `max_damage` the pack wrote onto the stack wins over the summed definitions — though it only moves the number, so whether anything is spent at all is still up to the definitions. The creative exception still holds (no wear in hand, always wear on a stand).

The position enters the formula context as `block_x`/`block_y`/`block_z` and is handed to position-driven behaviours as this invocation's **origin** (`spawn_projectile`, `spawn_particles`, `explode`, the centre of an `mxt:area` box…); projectiles still travel along the **actor's** facing — the position is where it comes from, the facing is who is aiming. Aura put into a stand **cannot be taken back** (extracting from it is a no-op); to recover the item, right-click it empty-handed or break the block.

## Verify

Datapack registries are read while the **world loads**, so reopen the world first, then:

```text
/mxt registries validate
/talisman give example:flame_sigil charged
```

1. `validate` reports no codec errors.
2. A "Talisman" appears in your hand: the tooltip shows the current mode and the inscription, and the `charged` one also says there is enough aura to fire.
3. Right-click it: one `example:spark` goes off (120 ticks of fire resistance), the carrier loses one point of wear, and that invocation's aura is taken out of the storage component (the example holds 5 x 12 = 60 and takes 12, so four shots are left).
4. Ask for another one without `charged` and **hold right-click** to pour: the action bar shows stored / capacity, a chime plays every 4 ticks, and 60 ticks later it fires on its own (the example holds 5 x 12 = 60 and takes 12 a shot).
5. Try `stored`: filling it only reports that it is stored, and a later right-click fires it; sneak-right-click toggles between the two modes.
6. Try the cooldown: click through two talismans in a row and the second reports the cooldown, and holding right-click inside the window does not pour aura either.
7. Try a display stand: place one, put the talisman in (no firing), then aim at it with `V` and charge it — it fires where it stands.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Right-clicking only reports that nothing is inscribed | The carrier is blank (that is what `/talisman blank` gives); such a click is not an attempt and costs no cooldown. |
| Right-click says there is not enough aura | The store cannot cover one invocation's aura entries; hold right-click to pour, or use `/talisman give … charged`. |
| Right-click says the invocation condition is not met | The inscribed definition's `condition` does not hold for this holder (the realm is too low, the weather is wrong, and so on). It is asked **before `costs`**, so nothing was paid; the same talisman fires as usual once the condition holds. |
| The ability is reported as disabled | The ability definition that was inscribed is not in the current pack (its file was deleted, or a `neoforge:conditions` block keeps it out); a talisman does not bypass that. |
| The element affinity is reported as a mismatch | The ability's `element_affinity` does not match the caster's spirit roots — a talisman does not bypass that either. |
| It says the ability needs a cast or a channel | An ability with `cast_time > 0` or `mxt:channelled` cannot be carried. |
| Pouring never finishes / nothing happens | An aura entry in `costs` resolves to `0` in the empty context (a `realm_rank` formula, say) and takes no part in the pour; or you simply do not have enough aura (reported as such). |
| The component syntax is refused | `talismans` takes concrete ids only; only `abilities` accepts `#tags`. |
| It fired but the aura is gone | That invocation's share was taken; when the capacity only covers one shot the component empties with it, and when it covers several the rest stays. |
| It only fires a couple of times before running dry | No `capacity` was written (it defaults to one invocation), or the carrier has no wear, which counts as one invocation. Write a bigger multiplier and pair it with `durability` / `consume` to fire several times from one pour. |

## Next

- [talisman](../datapack/json/talisman.md) — the full field list and every pouring/firing rule.
- [Items](../player-guide/items.md) — how talismans, brushes and stands behave in game.
- [item_aura](../datapack/json/item_aura.md) — the storage shared with spirit stones.
- [Define an Ability](./add-an-ability.md) — writing the abilities that get inscribed.
