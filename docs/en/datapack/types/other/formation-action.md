---
title: Formation Actions (formation_action_type)
description: Every built-in module of mxt:formation_action_type, with its fields, defaults and decision rules.
---

# Formation Actions (formation_action_type)

## `formation_action_type`

The `actions` array of a [formation](../../json/formation.md) holds these function modules. Each entry picks a module by writing its ID in `type` and carries only the fields it needs — structure, radius, costs and lifecycle hooks stay at the top level of the formation. A datapack only picks an existing module and never adds one; an unknown `type` fails the load rather than degrading into doing nothing.

The same module may appear more than once, and the list is not merged: two attack modules with different parameters are two strikes.

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
  ]
}
```

### `mxt:none`

An empty module that does nothing. It is also the default entry of this dispatch table, and writing it is the same as not writing it.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| — | — | — | No fields. |

```json
{"type": "mxt:none"}
```

### `mxt:attack`

Attacks entities inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `0` | Damage applied to every affected entity each period |
| `damage_type` | Damage type ID | none | The damage type used for the hit; without it the vanilla "the owner hit it" reading applies |
| `attribute_to_owner` | Boolean | `true` | Credits the **first owner** (the head of the list, the one who raised the formation) as the attacker |
| `effects` | Array | `[]` | Status effects applied each period; the fields are exactly those of `mxt:apply_effect`: `effect` / `duration_ticks` / `amplifier` |
| `target_condition` | `EntityCondition` | always true | An extra filter on the **target entity** (undead only, players only, …), evaluated after the friend-or-foe decision |

```json
{"type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt"}
```

This module only says **what** to hit, not **who** to hit: it hits every entity the formation covers, and whether the owner and friends are spared is up to the top-level `spare_friends` — leave it out and the owner is hit along with everyone else. When it cannot tell friend from foe, a formation that declares `spare_friends` holds fire (the reason is under "Friend or foe" on the [formation](../../json/formation.md) page).

`attribute_to_owner` decides kill credit, mob aggro and every condition that reads the attacker; set it to `false` for an unowned, "environmental" hit.

Every hit goes through the shared damage pipeline: the owner (when `attribute_to_owner` is true) takes part as the attacker in the **first** layer of element overcoming, and the entity hit gets the **second** layer of reduction from its own element adaptation — the owner having a fire spirit root and the target a water one makes the hit harder, while a target adapted to fire takes less. Those multipliers are written in the `mxt:element` definitions, not here.

When the damage resolves to a non-finite value or one ≤ 0 the hit is not struck, but `effects` are applied as usual — the default `damage: 0` is a formation that only applies status effects and deals no damage.

### `mxt:buff`

Grants abilities to entities inside the radius, overrides the aura zone of the area and raises aura capacity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | List of ability IDs or `#tags` | `[]` | Abilities granted to matching entities |
| `target` | Enum | `all` | Which entities the module applies to: `all`, `allies` or `owner` |
| `aura_zone` | Aura zone ID | none | A high-priority runtime aura override that replaces the aura resolved at the formation's position |
| `max_bonus` | Map from aura ID to `NumberProvider` | `{}` | Extra aura capacity per aura, for the chunks in range |

```json
{"type": "mxt:buff", "abilities": ["example:blessing"], "target": "allies"}
```

A granted ability is revoked automatically when the entity leaves the radius, when the formation is dismantled, or when it is no longer selected; the `source` is automatically `mxt:formation/<namespace>/<path>`.

The three `target` settings are one rule at three widths: `all` filters nothing; `allies` requires the friend check to answer `true` — the check asks **every** owner on the list, any one of them recognising you is enough, and **an owner counts as a friend of themselves**, so `allies` includes the whole list; when it cannot identify, it gives nothing. `owner` only reads the UUID list and is a narrower way of writing the same thing.

`aura_zone` outranks the biome / dimension / artificial regions, and the override is only in force while the formation is registered; for the full rules see "Aura overrides" on the [formation](../../json/formation.md) page.

`max_bonus` is only applied together with the `aura_zone` override: with no `aura_zone` there is nowhere to add it, and an aura the zone does not provide cannot be raised either (it does not conjure aura out of nothing). When several bonuses land on the same aura, the highest wins.

Attribute bonuses do not look for a field here: passive attributes are the `modifiers` field of the `mxt:modifier` ability itself, so granting an `mxt:modifier` ability is the same as granting its attribute modifiers; there is no second entry point, or the same thing would have two sets of rules — including the easiest part to get wrong, "a modifier outliving the formation that granted it".

### `mxt:protection`

Denies each listed kind of interference inside the radius.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_break` | Boolean | `true` | Deny block breaking |
| `block_place` | Boolean | `true` | Deny block placing |
| `block_interact` | Boolean | `true` | Deny right-clicking blocks (chests, doors, crafting tables, …), and "using an item on a block" as well |
| `explosions` | Boolean | `true` | Deny explosions from changing the terrain; only blocks are removed, entities still take damage |
| `mob_griefing` | Boolean | `true` | Deny mob destruction (an enderman carrying a block, and the like) |
| `entity_interact` | Boolean | `true` | Deny right-clicking entities (villagers, horses, armour stands, …) |
| `attack_entity` | Boolean | `true` | Deny **melee** attacks on entities |
| `item_use` | Boolean | `true` | Deny item use (buckets, potions and drawing a bow on nothing or on yourself, …) |
| `spare_friends` | Boolean | `true` | Exempt the owner's friends |
| `delegate_to_claims` | Boolean | `false` | Hand protection over to a claim plugin (FTB Chunks, say): while a claim protection is in force, the nine switches above are only a declaration and are no longer enforced |

```json
{"type": "mxt:protection", "spare_friends": true}
```

All nine switches default to `true`: declaring this module is that whole sentence, and you write `false` explicitly for the one thing you want to open up. Three of them cost more than the rest and are worth turning off when you do not need them: `block_interact` covers every block with a screen, and `explosions` and `mob_griefing` sweep the registered formations on high-frequency paths (per-block explosion resolution, every mob destruction).

#### The decision: both ends of the action count

There is only one question: **if the actor, or the block / entity being acted on, is inside the radius, the switch applies.**

- Standing **outside** and clicking a chest **inside** → denied (the chest is in the formation).
- Standing **inside** and clicking a chest **outside** → denied (the player is in the formation).
- `item_use` has no target, so only the actor is looked at.
- Explosions and mob griefing have no actor and only look at the position, so **an owner's own explosion is denied too** — write `"explosions": false` if you want a way through.

#### Exemptions and other rules

- **The owner is always exempt**, and no configuration changes that — locking yourself out of your own house is a bug, not a rule.
- **The friend exemption** needs `spare_friends` to be true **and** the server setting "Formations → Friend or Foe" to be on.
- **When it cannot identify, it protects as usual**: a formation that declares `spare_friends` holds fire when it cannot identify an entity, while a protecting formation keeps blocking. A wrong guess should point at the safe side.
- Only **registered formations** are in force, and dismantling ends that at once; an ownerless formation exempts nobody (otherwise an abandoned formation would lock a piece of land forever).
- The base ships no land protection of its own: when you need claims, an external claim mod provides them, and this layer steps aside through `delegate_to_claims` below.

#### Handing it to a claim plugin (`delegate_to_claims`)

When it is true **and a claim protection really is in force**, **not one of the nine switches above is enforced**: what actually stops people is the claim plugin's own rules. With FTB Chunks, for instance, it already protects its claims on its own, so "handing it over" needs no API call — the formation merely stops adding its own layer.

The "is a claim protection in force" test looks at FTB Chunks: **it is installed, and its global `disable_protection` has not been turned off**. It **cannot see team-level** settings — when a team sets all four privacy modes of its claim to public, this still counts as "protected" (recomputing that layer would mean copying the claim plugin's decision a second time, which is exactly what handing it over is meant to avoid).

The server setting "Compat → Delegation Needs Claim Protection" (**on by default**) decides what happens when there is no claim protection:

| Setting | Behaviour |
| --- | --- |
| On (default) | It only hands over when there really is claim protection; otherwise it **falls back to the nine switches above** and logs a warning at activation, from the definition. |
| Off | Read literally: it always hands over, and with no claim protection **nothing is protected at all**. |

Either way the two costs are the setter's:

- After handing over, the formation only protects **claimed** places, and **its own `radius` no longer takes part in the protection decision**;
- in the **fallback branch** the formation protects what is **inside its own radius**, independently of the claim plugin's decision.

#### The relationship with claim plugins: three modes (server setting)

That switch is a **content pack's** declaration for one formation; a separate server setting (on the "Compat" tab) decides how **all** protecting formations get along with a claim plugin — "Compat → Claim Integration":

| Value | Behaviour |
| --- | --- |
| No integration (default) | **No integration**: a formation applies its own switches anywhere, and when both are present it is an "and" — either one refusing counts as a refusal. |
| Claim only | **A protecting formation may only be raised inside a claim**: the chunk the controller sits in has to be claimed already (by any team), or activation fails with a message (`item.mxt.formation_plate.failed.not_claimed`). It only applies to formations **with a protection module**. |
| Claim first | **A formation can be raised anywhere, but inside a claim it switches to that claim's rules**: once the chunk the controller sits in is claimed, the nine switches of this formation are handed over entirely and the claim plugin decides; **outside a claim it still uses its own switches**. |

Three boundaries:

- "Inside a claim" is decided by **the chunk the controller sits in**, not by every affected position — a formation straddling a claim border is either wholly under the claim or wholly outside it.
- "Claim only" does not require **your own** claim: being able to stand there means the landowner allows it (otherwise he would have stopped you long ago), and this option is about "do not raise a warding formation on land that has no owner".
- **With no claim plugin on the server neither mode does anything, rather than stopping formations from being raised**: there is no claim to require and no claim rule to hand over to. That case logs one warning for "Claim only" (once per session), because "the option did nothing" and "the option worked but nobody came" look exactly the same in game.

#### Protecting formations cannot be raised on someone else's claim

Server setting "Compat → Raising Needs Permission" (**on by default**, independent of the enum above):

**When the controller falls inside a chunk claimed by someone else, only three kinds of player may raise a protecting formation.**

1. **Someone with edit permission** — the claim plugin itself is asked "would you let him place this block", rather than rewriting the privacy mode rules here: whether a public claim, a team rank, an ally or a permitted fake player counts is its rule, and a second copy would only be a copy that drifts.
2. **A friend of the landowner** — the same friend system the protecting formation uses (so with FTB Teams installed, **teammates and allies already count as friends** and pass on their own).
3. **Unclaimed land** — a place nobody has claimed has "no landowner", and anyone may raise a formation there.

Everything else is refused, including an **actor that cannot be resolved** (the console, a command source): nobody can agree on the landowner's behalf.

A protecting formation is a claim of jurisdiction, not just a building: being allowed to place blocks on someone's land is not the same as being allowed to raise a law there, and when the structure is already standing (the template matches natural terrain, or something somebody else built), block protection alone cannot stop anyone.

> With no claim plugin this rule is **inert** in the same way (there is no one else's claim to judge), so it changes nothing on a pure Mxt server. The message on refusal is `item.mxt.formation_plate.failed.foreign_claim`, which says more than "the structure does not match" would.

> Also on record elsewhere: FTB Chunks **does not block item use by default** (only `ftbchunks:right_click_blacklist` can) and **does not block attacking entities** either. So once `item_use` and `attack_entity` are handed over, nobody is minding them.

#### Known gaps

**Projectiles.** `attack_entity` blocks melee swings (the event the game fires on the **attacker's** side), so an arrow shot from inside the formation does not count as "the attacker is attacking right now" when it lands, and is not blocked.

### `mxt:range_display`

Draws the radius outline with particles.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `particle` | Particle options | **required** | Particle drawn along the outline |
| `shape` | Enum | `ring` | Outline shape: `ring` is a horizontal circle at the controller's height (a ground line), `sphere` covers the whole sphere |
| `points` | Integer `1..512` | `32` | How many points to draw each period |
| `interval_periods` | Integer `1..1200` | `1` | How often to draw, in formation periods (1 period = 20 ticks) |

```json
{"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
```

A formation's range is a sphere, and nothing in the world says where it ends — the structure only marks the controller. This module draws that line. It only acts on the formation itself: it affects no entity, does not make the formation hostile, and takes no part in the friend-or-foe decision; a formation that does not write this module costs nothing at all.

- It is only sent to **players who can see it**: within the radius **+ 32 blocks**. Vanilla's broadcast call is pinned at 32 blocks, so this sends per player instead — otherwise a formation with a radius above 32 would have a ring of its outline cut off. One particle packet per point, so `points` times the number of players who can see it is the cost per period.
- `ring` is drawn at the **centre height of the controller block**; `sphere` lays points out by the golden angle, so a latitude/longitude grid does not bunch them up at the poles.
- It runs after `TickEffects` and before `tick_action`, so **cancelling the period of `TickEffects` stops the range from being drawn along with it**.
- `interval_periods` counts **formation periods**, not ticks: dispatch only ever lands on period boundaries.
- Several may be written to layer different particles.
