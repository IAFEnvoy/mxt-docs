---
title: Costs (cost_type)
description: Every built-in entry, field, default and decision rule of the mxt:cost_type costs.
---

# Costs (cost_type)

Every field that consumes something is an array, and each entry writes one `Cost`. The four shapes that write a `type` are dispatched by the built-in `mxt:cost_type` registry: `mxt:resource`, `mxt:aura`, `mxt:item` and `mxt:js`; the other is the shorthand that writes no `type` and only `id` and `amount`, read as `mxt:resource`. The whole family is registered by the mod, so a data pack picks an entry but cannot add one. The all-or-nothing semantics of the whole array, the channel rules and the shared evaluation rules are on [Shared Data Types · `Cost`](../shared_data_types.md#cost).

This family is referenced all over the pack: in abilities, artifacts, techniques, talismans, cultivation, formations, pills and more, every "what does it take" field is written as one array of `Cost`, so it has no definition page of its own and stands as a type page by itself. Which definitions carry a `costs` field is written on those definition pages.

### `mxt:resource`

Spends a data pack value out of the payer's own value account.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | Value ID | **required** | The value to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}
```

### `mxt:aura`

Spends by aura identity.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura ID | **required** | The aura identity to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number |

```json
{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}
```

What gets charged depends on the payment channel: when the payer pays, the **value that aura is measured in** is charged (what a payer carries is a value, not an aura); when a shared aura pool or a block's store pays, that aura itself is charged, rounded up to whole units. The difference between the two channels is on [Shared Data Types · `Cost`](../shared_data_types.md#cost).

### `mxt:item`

Spends matching items out of a player's inventory.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **required** | Which items may be spent; see [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **required** | Number of matching items to spend, rounded up; a non-positive or non-finite result means this `Cost` cannot be paid |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

### `mxt:js`

Both the check and the payment go to a server script callback.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | Callback id registered with `MxtCosts.register` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

A script `Cost` is checked and then paid on the server, and it needs a player. The callback receives the payer and `params`, not the ability's formula context, because a `Cost` is evaluated with the payer alone.

**The shorthand without `type`.** An entry in the array may also write only `id` and `amount`, and it is read as `mxt:resource`:

```json
{"id": "example:qi", "amount": 5}
```

That entry is equivalent to `{"type": "mxt:resource", "resource": "example:qi", "amount": 5}`.

The payer is a **living entity** (a player, a mob and a summoned creature all count), not necessarily a player. `mxt:item` needs a player's inventory, so a payer that is not a player (or a formation with no owner) simply **cannot pay** — that is a refusal, not a broken definition; `mxt:js` needs a player and runs **last, after every other channel has finished paying** — a script cost is not staged, so the script has to stay idempotent about it.

A whole array is **all or nothing**: if any one entry cannot be paid, nothing is deducted. Two entries in the same array that point at the same store (the same value written twice, or the same aura written twice) make the definition **fail to load**; a `mxt:resource` entry together with a `mxt:aura` entry measured in that value has the amounts added together, and that is not an error. An entry that cannot be decoded also fails the load; it is never dropped silently.
