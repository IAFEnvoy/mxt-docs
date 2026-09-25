---
title: Inscribe a Talisman
description: Write a talisman definition, hand it to a player, pour aura into it and fire it — the bill is the capacity, the two carrier modes, the hand and display-stand rules, and why inscribing is still command-only.
---

# Inscribe a Talisman

A talisman carries abilities on an item: it inscribes a few abilities, you fill its aura bill, and it casts them for you. **The definition only says what is inscribed and what it costs**; whether it fires the moment it is full or waits for you to act is a **property of the carrier** (on the item stack), not of the definition.

::: warning Inscribing has no in-game entry point yet

The brush `mxt:talisman_brush`, the ink `mxt:talisman_ink` and blank paper `mxt:blank_talisman` are currently **plain items with no behaviour** — "hold the brush and write the ability onto it" is not wired up. Today only three things can write a talisman into a carrier: `/talisman give …`, item component syntax (the `components` of `/give`), and the single-inscription item the creative picker builds.

So this tutorial covers the chain that genuinely runs today: **define → hand out → pour → fire**. When the inscribing service lands, step 3 will gain the manual path.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/aura/qi.json` | *(existing)* A talisman's bill can only reference a **concrete** aura definition. |
| `data/example/mxt/ability/spark.json` | The ability to be inscribed. |
| `data/example/mxt/talisman/flame_sigil.json` | The talisman definition: what it inscribes, what it costs. |

## Step 1 — An Ability a Talisman Can Carry

```json
// data/example/mxt/ability/spark.json
{
  "type": "mxt:active",
  "slot": "primary",
  "cooldown": 60,
  "entity_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:fire_resistance",
    "duration_ticks": 120
  }
}
```

**Only abilities that take effect at once can be carried.** An ability with a cast time (`cast_time > 0`) or one that is channelled (`mxt:channelled`) is refused, because finishing a cast or a channel walks the list of abilities the actor *holds*, and a carrier never grants anything. A refusal costs neither the carrier nor the stored aura, so you can swap the talisman or the ability and try again.

## Step 2 — The Talisman Definition

```json
// data/example/mxt/talisman/flame_sigil.json
{
  "abilities": ["example:spark"],
  "aura_cost": {"example:qi": 12}
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `abilities` | `HolderOrTag<ability>[]` | `[]` | The abilities it inscribes: one id, an array, or `#tags`, exactly as in `technique.granted_abilities`. |
| `aura_cost` | `Map<Holder<aura>, NumberProvider>` | `{}` | The bill to fire it, which is **also the carrier's capacity**; keyed by concrete aura, values may be constants or formulas. |

Three semantics worth keeping:

- **`aura_cost` takes concrete ids only, never `#tags`**: aura pools are already keyed by concrete aura, so a tag has no pool to point at.
- **The bill is evaluated in an empty formula context**, because the client has to compute the same number to draw the pose. Anything that only has a value when somebody holds the item — `"realm_rank * 4"` — therefore resolves to `0` and is treated as **not part of the pour**; a carrier whose every entry falls away behaves like a free talisman.
- **The bill is the capacity; there is no separate capacity field.** Filling it is what makes the talisman "full", and at that moment it fires and consumes one carrier (a single use burns the carrier).

## Step 3 — Handing It to a Player

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

**Pouring**: hold the carrier and **hold right-click** (the same gesture spirit stones use: a `BLOCK` pose, a chime every 4 ticks, "stored / capacity" on the action bar). Each tick pours 1 unit and charges 1 point of your own aura, so a bill of `12` takes 12 ticks of holding; one gesture lasts at most 200 ticks. **Pouring consumes no items** — only firing consumes one carrier — while the aura is paid as you pour, one for one.

**Firing** is decided by the carrier's mode:

| Mode | Behaviour |
| --- | --- |
| `fire` (default) | Fires **automatically** the moment it is full. |
| `store` | Only accumulates; **right-click** fires it. |

**Sneak + right-click** toggles the mode (with an action-bar line, and the tooltip always shows the current mode). One special case: a `store` talisman that is **already full** does **not** toggle on a sneak-use — it fires and consumes the talisman (stored aura is there to be spent).

When it fires, each inscribed ability goes through the **ordinary ability use path**: its own conditions, cooldown, charges and costs all apply, and the only thing replaced is "you have been granted this ability" — **the talisman itself is the source of the grant**. So carrying one lets you cast magic you never learned, but a talisman is **not a back door** around those gates. Only when **at least one ability really fires** is the carrier consumed and its stored aura cleared; if every one is refused, the carrier and its aura survive.

**Firing from the hand has a cooldown**, controlled by **Server Config → Talisman → Use Cooldown** (ticks, `0..72000`, `20` by default) rather than by the datapack. Its boundaries are worth knowing:

- **One "attempt" starts the cooldown**: an ability refused for its own cooldown or for an unaffordable cost still counts, because that click really was an attempt.
- **A blank carrier and a not-full carrier do not count as attempts** and cost no cooldown — those cases only tell the player something and can be retried at once.
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

The position enters the formula context as `block_x`/`block_y`/`block_z` and is handed to position-driven behaviours as this invocation's **origin** (`spawn_projectile`, `spawn_particles`, `explode`, the centre of an `mxt:area`…); projectiles still travel along the **actor's** facing — the position is where it comes from, the facing is who is aiming. Aura put into a stand **cannot be taken back** (extracting from it is a no-op); to recover the item, right-click it empty-handed or break the block.

## Step 6 — Verify

Datapack registries are read while the **world loads**, so reopen the world first, then:

```text
/mxt registries validate
/talisman give example:flame_sigil charged
```

1. `validate` reports no codec errors.
2. A "Talisman" appears in your hand: the tooltip shows the current mode and the inscription, and the `charged` one also says the aura is full.
3. Right-click it: one `example:spark` goes off (120 ticks of fire resistance), one carrier is consumed, and the aura storage component is cleared.
4. Ask for another one without `charged` and **hold right-click** to pour: the action bar shows stored / capacity, a chime plays every 4 ticks, and 12 ticks later it fires on its own.
5. Try `stored`: filling it only reports that it is stored, and a later right-click fires it; sneak-right-click toggles between the two modes.
6. Try the cooldown: click through two talismans in a row and the second reports the cooldown, and holding right-click inside the window does not pour aura either.
7. Try a display stand: place one, put the talisman in (no firing), then aim at it with `V` and charge it — it fires where it stands.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Right-clicking only reports that nothing is inscribed | The carrier is blank (that is what `/talisman blank` gives); such a click is not an attempt and costs no cooldown. |
| Right-click says the aura is not full yet | The bill has not been filled; hold right-click to pour, or use `/talisman give … charged`. |
| The ability is reported as disabled | It is switched off by `mxt:disabled`; a talisman does not bypass that. |
| The element affinity is reported as a mismatch | The ability's `element_affinity` does not match the caster's spirit roots — a talisman does not bypass that either. |
| It says the ability needs a cast or a channel | An ability with `cast_time > 0` or `mxt:channelled` cannot be carried. |
| Pouring never finishes / nothing happens | An entry of the bill resolves to `0` in the empty context (a `realm_rank` formula, say) and takes no part in the pour; or you simply do not have enough aura (reported as such). |
| The component syntax is refused | Both `aura_cost` and `talismans` take concrete ids; only `abilities` accepts `#tags`. |
| It fired but the aura is still there | The aura component is removed wholesale on success, so **the rest of the stack is empty** and does not inherit that pour. |

## Next

- [talisman](../datapack/json/talisman.md) — the full field list and every pouring/firing rule.
- [Items](../player-guide/items.md) — how talismans, brushes and stands behave in game.
- [item_aura](../datapack/json/item_aura.md) — the storage shared with spirit stones.
- [Add an Ability](./add-an-ability.md) — writing the abilities that get inscribed.
