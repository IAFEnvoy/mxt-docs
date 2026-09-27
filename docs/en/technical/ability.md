---
title: Ability Casting
description: Which gates one cast passes through, how a press differs from a direct cast, and how ability state — cooldown, charges, toggle, timer, target lock — is stored, written and read.
---

# Ability Casting

A datapack only writes fields; this page is about **when those fields are read**, where the state an ability leaves behind at runtime lives, and which parts of it content can touch.

## The gate order of one cast

Whichever road a cast comes in on, it passes the same gates in the same order:

| Order | Gate | When it fails |
| --- | --- | --- |
| 1 | Grant | `NOT_GRANTED` |
| 2 | Cooldown | cooling down, payment refused |
| 3 | `condition` | the condition does not hold, payment refused |
| 4 | `element_affinity` | no matching spirit root, `ELEMENT_AFFINITY` |
| 5 | Charges | fewer than 1 left, `NO_CHARGES` |
| 6 | `costs` | cannot be paid, the whole array is refused and what was already written is rolled back |
| 7 | Run the action fields | — |
| 8 | Booking: write the cooldown, spend one charge | — |

With `cast_time > 0`, the action fields do not run right after step 6: a due tick is booked instead, and step 7 runs on that tick.

The condition, cost, cooldown and charge gates only exist on **the types that pay**. `mxt:interval`, `mxt:modifier`, `mxt:mount`, `mxt:upkeep` and `mxt:empty` pay nothing, and have neither a cooldown nor charges.

## Two roads

**A press**: one cell on the wheel, fired with its key. Only five types ever go into the wheel: `mxt:active`, `mxt:channelled`, `mxt:targeted`, `mxt:storage`, `mxt:flight_control`. Two of them, `mxt:storage` and `mxt:flight_control`, take the **short path** — they only check the cooldown, the condition and the costs, spend no charge and run no action field (they have none to begin with).

**A direct cast**: the `/mxt ability cast` command, KubeJS, an item-carried ability. All of them cast **any type** directly, without asking whether it is pressable, and this road passes the full set of gates as usual.

An already saved wheel cell is on the second road too: the layout is written to disk and may name an ability that is not pressable, and the server still honours it.

## Where state lives

State lives in **the ability's own attachment**, one per ability. The attachment hangs off an entity, so it is saved with the world and synced to clients as well.

Each record inside it is addressed by two dimensions: **the ability's own id** plus **the state kind**. Two different ability ids never affect each other, and neither do two entities holding the same ability.

On the datapack side an address is written as two fields: `family` is the registry the host lives in (today only `mxt:ability`), and `id` is the host itself.

One address holds exactly one record, and a write replaces it whole: write the same ability id and the same kind twice and the second replaces the first.

## The six state kinds content can use

| Kind | Declaration fields | State fields |
| --- | --- | --- |
| `mxt:toggle` | none | `default` (what it reads as when never written, `false` when absent), `state` |
| `mxt:timer` | `duration` | `ends_at` |
| `mxt:resource` | none | `resource`, `amount` |
| `mxt:target_lock` | `range` | `target` (a UUID string) |
| `mxt:charges` | `maximum`, `recharge_ticks` | `remaining`, `last_change` |
| `mxt:cooldown` | none | `duration`, `started_at` |

**Declaration fields** belong to the definition side, and are given along with the value's own `type` when content writes it; **state fields** are filled in at runtime.

Content **can** write these six kinds, but only into a host that declared them. Which kinds a host declares is decided by the ability's `type`, see [Ability Types](/en/datapack/types/other/ability).

The default `mxt:active_state` is not one of the six: it records the result of the last `condition` evaluation and is what the runtime compares to catch the edge where an ability starts or stops counting as in effect, so content cannot reach it. To read a switch, use `mxt:toggle`.

`mxt:container` is not one of the six either: it lives in the item component `mxt:storage`, belongs to the `mxt:storage` ability type alone, and only the runtime maintains it.

## Cooldown

The cooldown length comes only from the ability's own `cooldown` field, and is written into the `mxt:cooldown` state. `mxt:cooldown` has no length field of its own.

Content writing it has to be careful: a `duration` written through `mxt:modify_storage` **really does gate the cast**, and the start is counted from the moment of that write. A stored value without a `duration` reads as a zero-length cooldown, that is, as not cooling down.

`mxt:interval`, `mxt:modifier`, `mxt:mount`, `mxt:upkeep` and `mxt:empty` write one only when they are force-cast.

## Charges

`charges` is the only state parameter on an ability definition: `{"maximum": ..., "recharge_ticks": ...}`, both required.

**Only a payment that goes through the full gates spends one**: fewer than 1 left refuses with `NO_CHARGES`, and one is taken once the payment is booked. The two presses on the short path (`mxt:storage` / `mxt:flight_control`) spend no charge.

Charges refill on their own: when there is a `remaining`, it has not reached `maximum`, and `recharge_ticks` evaluates finite and above `0`, then once more than `recharge_ticks` (a minimum of 1 tick) have passed since `last_change`, it gains 1. Each refill adds at most one, and it stops at `maximum`. A `recharge_ticks` that does not evaluate to something usable refills nothing — it does not degrade into topping the pool up every tick.

## Revoking and re-granting

Revoking an ability's last grant source clears every piece of state under it. An ability granted back does not come back with the charges or the cooldown it had before.

## Writing state

Use the `mxt:modify_storage` entity action:

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:iron_palm",
  "value": {"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 2}
}
```

`value` is a complete storage object written as a whole, parsed by its own `type` dispatch. A `family` naming a registry that has no storage, or a kind the host never declared, refuses the write and logs one warning for each.

The three cursors `mxt:cast_deadline`, `mxt:channel_pulse` and `mxt:aura_pulse` share this addressing with ability state, but no type declares them, so they cannot be written. A tribulation's `mxt:entry_began`, `mxt:idle_countdown` and `mxt:wait_countdown` live in the tribulation's own single slot, and do not go through this id-addressed store either.

## Reading state

State is read with six entity conditions, addressed exactly like `mxt:modify_storage`:

| Condition | Fields | Description |
| --- | --- | --- |
| `mxt:storage_toggle` | `expected` (default `true`) | Reads `state`, and a value that was never written reads as `default` |
| `mxt:storage_timer` | `remaining` (a `{min?, max?}` window), `ended` | A timer without `ends_at` is not running, so `remaining` counts as `0` and `ended` is true |
| `mxt:storage_resource` | `amount` (a window) | Without a window it only asks whether anything was ever stored |
| `mxt:storage_target` | `locked` (default `true`), `max_distance` | `max_distance` additionally requires that UUID to still be found in the actor's dimension and within range |
| `mxt:storage_charges` | `remaining` (a window) | Never having spent one reads as full, that is the declared `maximum` |
| `mxt:storage_cooldown` | `remaining` (a window), `ready` | The length comes from `duration` and the start from `started_at`; never having written one means not cooling down, so `remaining` is `0` and `ready` is true |

Apart from `mxt:storage_cooldown`, the other five only see kinds the host **declared**, and a write follows the same rule. `mxt:storage_cooldown` does not require the host to declare `mxt:cooldown`: every payment writes that value, so any ability that goes through the payment gate can be read by it.

`mxt:container` on an item host is outside what those six conditions address.

## Costs and limits

- **The attachment is synced**, so ability state follows the entity to the client. Conditions are evaluated on the client too (an item tooltip, for instance), where there is no server registry and everything reads as false.
- **Clearing state is all-or-nothing**: revoking the last grant source wipes the charges and the cooldown together; there is no "keep the state, grant it back" road.
- **`mxt:cooldown` is the only gate content can write straight into**: writing a `duration` is locking that ability, and the writer decides for how long.
