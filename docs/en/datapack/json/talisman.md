---
title: Talisman (talisman)
description: "Defines one inscribed talisman: the abilities invoking it grants and the aura bill the carrier has to be filled with."
---

# Talisman (talisman)

A `talisman` defines one inscription that can be written onto a carrier: the abilities that invoking it grants, and the aura bill that invoking it pays. The bill is also what the carrier has to be filled with before it can fire, so a talisman definition is both the effect and the price.

## File Location

Talisman files go in `data/<namespace>/mxt/talisman/` within your datapack.

**Purpose**: Talisman definitions: the abilities one inscribed talisman carries.

The filename corresponds to its ID. For example, `data/example/mxt/talisman/flame_sigil.json` has the ID `example:flame_sigil`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `abilities` | `HolderOrTag<ability>[]` | `[]` | The abilities this talisman grants when it is invoked, written the same way as a technique's `granted_abilities`: a single ID, a list of IDs, or a `#tag`. |
| `aura_cost` | `Map<Holder<aura>, NumberProvider>` | `{}` | The aura bill one invocation of this talisman pays, keyed by concrete aura. Each entry may be a constant or a formula. An absent or empty map means this talisman costs no aura. |

`abilities` is the only effect field: every skill-like effect in the mod already lands on an `ability`, so a talisman needs no effect vocabulary of its own.

`aura_cost` accepts concrete aura IDs only, **not** `#tags` — the opposite of `abilities`. Aura pools are keyed by concrete aura, so a tag has no pool to name. The amounts are written like any other aura cost (such as `cultivate_action.aura_costs` or `formation.storage.capacity`), so `"12"` and `"realm_rank * 4"` are both valid JSON.

### Display name

Like every other definition, a talisman has no display-name field. Its name is resolved from its ID as `<category>.<namespace>.<path>`, where the category is the registry's own path, so `example:flame_sigil` in `mxt:talisman` is looked up as `talisman.example.flame_sigil`.

## The `mxt:talisman` component

Which talismans are written onto one carrier, and how that carrier behaves, live in the item component `mxt:talisman` on the stack rather than in the definition.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `talismans` | `List<Holder<talisman>>` | `[]` | The inscribed definitions, in the order they were appended. An empty list is the blank carrier a fresh talisman item starts as. |
| `mode` | `fire` / `store` | `fire` | Whether this carrier fires the moment it is filled. |

The component holds concrete entries, so it cannot name a tag. Writing a talisman appends its definition instead of replacing what is there, so one carrier may hold several — and the same talisman twice.

```mcfunction
give @s mxt:talisman[mxt:talisman={talismans:["example:flame_sigil"]}]
```

`mode` belongs to the stack rather than to any definition: the same inscriptions can be written onto one carrier that fires on its own and another that waits to be told. **Sneaking while using** switches the mode and shows an action-bar message; the tooltip also reports the current mode. One special case: a `store` carrier that is **already full** does not switch on a sneaking use — it fires instead, because a stored charge exists to be spent. When it fires that way the stack is switched to `fire` first, so the carriers left in a stack continue in the firing mode.

Pouring progress is kept separately in `mxt:spirit_storage`, the same component a spirit stone stores its charge in. It is keyed by aura and records the units poured so far; a missing component means nothing has been poured.

```mcfunction
give @s mxt:talisman[mxt:talisman={talismans:["example:common_sigil"]},mxt:spirit_storage={amounts:{"mxt:common":3}}]
```

## The `/talisman` command

Writing an inscription is a component, so the `/talisman` subtree exists for operators who would rather name definitions than write component syntax. Every node asks for the gamemaster permission.

| Command | Description |
|---------|-------------|
| `/talisman` or `/talisman blank [count]` | Hands out blank carriers. |
| `/talisman give <talismans>` | Hands out carriers inscribed with a comma-separated list of talisman IDs, in the `fire` mode. |
| `/talisman give <talismans> count <1..64>` | The same, for a stack. |
| `/talisman give <talismans> count <1..64> charged` | The same, with the carriers already poured full. |
| `/talisman give <talismans> stored [count <1..64>]` | The same, in the `store` mode. A stored carrier is poured by hand, so `charged` is not offered with it. |

The definition argument is completed from the loaded `talisman` registry.

## Filling and firing

`aura_cost` is also the carrier's pour capacity: the bill is the capacity, so filling the bill is what "full" means.

- **Auras are counted separately.** The carrier stores one pool per aura the bill names, and one pour fills only the **first entry that is not full**, in the order the entries are written. Holding on after that entry fills continues with the next one. The carrier is full only when every entry is full.
- **The bill is priced with an empty formula context.** The pour's length is capacity divided by the units moved per tick, and the client has to compute the same number for the gesture, so `aura_cost` is evaluated against `FormulaContext.EMPTY`. A constant or an expression that does not depend on a holder therefore works; an expression that is only meaningful with a holder (such as `"realm_rank * 4"`) resolves to `0`, which is treated as "this entry takes no part in the pour" rather than as an error. A carrier left with no entries at all is billed nothing.
- **An empty bill fires on a click.** A talisman that costs no aura has nothing to pour, so holding right-click never starts a pour — but it is **always full**, so a plain right-click invokes it.
- **How it is filled.** Hold right-click with the carrier in hand. This is the same gesture a spirit stone uses to charge: the `BLOCK` pose, a prompt sound every 4 ticks, and an action bar showing the amount stored against the capacity. One tick moves one unit and takes one unit of the holder's own aura, so the bill is both the price and the pouring time. Pouring itself spends no item; only firing does.
- **How it fires.** A plain right-click and "being filled" go through the same entry point, and the **carrier's mode** decides which of them fires. Under `fire` (the default) filling it fires it immediately; under `store` it only accumulates and waits to be told. A right-click can fire a carrier in either mode — the only way for a `store` carrier, and also the way for a carrier whose bill is empty. A carrier that is not full turns a right-click into a pour rather than an invocation.
- **It does not have to be in a hand.** A carrier reports being filled from wherever it stands, so a carrier on a display stand fires when something fills it there (`store` carriers excepted). The **actor** is still whoever filled it — they pay, are credited, and answer for their abilities — while the **position** is the stand's.
- **Where the position goes.** The position enters the ability's formula context as `block_x`, `block_y` and `block_z`, and it is handed to the invocation as its origin: `mxt:area` centres its radius on it, and behaviours such as `spawn_projectile`, `spawn_particles`, `spawn_effect_cloud`, `spawn_lightning`, `explode`, `play_sound` and `block_action` use it. Projectiles still travel along the **actor's** facing. Position-reading conditions and aura lookups still use the actor's own position.
- **The use cooldown only gates a hand.** It comes from **Server Config → Talisman → Use Cooldown** (default `20` ticks, range `0..72000`, `0` disables it). One **attempt** starts it, so a click an ability refused still counts, while a blank or uncharged carrier never became an attempt and costs nothing. Inside the window a pour does not fire and the aura for that tick is **not** poured in either, because it would buy an invocation the window is going to refuse. A carrier on a display stand neither reads nor records the window.
- **Spending depends on where it is.** A hand spends one carrier per invocation, except in creative mode, where nothing is spent. A placed carrier is **always** spent, regardless of the filler's game mode.
- **Only instant abilities can be carried.** An ability with `cast_time > 0` or a `mxt:channelled` type is refused, because a cast is finished and a channel is re-checked against the abilities the actor *holds*, and a carrier grants nothing. A refused invocation leaves the carrier unspent and its aura unpoured.

An invocation is an ordinary ability use with one thing changed: the carrier itself is what answers for the grant. Every other gate still applies — the ability's condition, word, cooldown, charges and costs, plus both use events — so a talisman is not a way around them. A carrier that names the same ability twice fires it once.

## Example

```json
// data/example/mxt/talisman/flame_sigil.json
{
  "abilities": ["example:qingxiao_firebolt"],
  "aura_cost": {"example:qi": 12}
}
```

The abilities it names are defined by [Ability](./ability.md). The item's own behaviour is documented with the other items; the aura the bill is counted in belongs to an [Aura](./aura.md) definition.

