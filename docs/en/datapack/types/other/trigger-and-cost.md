---
title: Trigger and Cost Types
---

# Trigger and Cost Types

## `trigger_type`

Trigger matchers decide which runtime events an ability or a breakthrough condition reacts to. Each built-in trigger is a fieldless matcher; the registry entry itself supplies the signal identifier it compares against.

| `type` | Description |
|--------|-------------|
| `mxt:tick` | A periodic entity tick |
| `mxt:attack` | The entity attacked another entity |
| `mxt:hurt` | The entity took damage |
| `mxt:kill` | The entity killed another entity |
| `mxt:block_break` | The entity broke a block |
| `mxt:block_use` | The entity used a block |
| `mxt:item_use` | The entity finished using an item |
| `mxt:equip` | The entity's equipment changed |
| `mxt:death` | The entity died |
| `mxt:breakthrough` | The entity completed a breakthrough |
| `mxt:technique_stage` | A learned cultivation technique reached a new level |
| `mxt:js` | A matcher a server script decides |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:item_use"}]}
```

None of the built-in triggers has additional fields.

`mxt:js`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `signal` | Identifier | **required** | The signal this matcher listens to; subscriptions are indexed by it |
| `id` | String | **required** | Callback ID registered with `MxtTriggers.matcher(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill"}]}
```

This is the only way a data pack can react to a **custom** signal id: raise it from a server script with `MxtTriggers.publish`, and either subscribe a script to it or declare this trigger on an ability or on a resource's breakthrough conditions. The callback only decides whether the signal that reached the subscription fires, so a missing callback never matches. See the [KubeJS API Reference](../../../kubejs/api-reference.md).

---

## `cost_type`

A cost is checked first and then paid in one go. The five shapes, the channel rules and the all-or-nothing semantics are on [Shared Data Types · `Cost`](../shared_data_types.md#cost).

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:resource` | `resource`, `amount` | Spends a datapack value out of the payer's own value account |
| `mxt:aura` | `aura`, `amount` | Spends an aura by identity: charges the value that aura is measured in when the payer pays, and that aura itself when a shared aura pool or a block's store pays |
| `mxt:item` | `items`, `amount` | Spends matching items out of a player's inventory |
| `mxt:js` | `id`, `params?` | Checked and paid by a server script callback; needs a player, and runs last after every other channel |

`mxt:resource`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `resource` | `Holder<resource>` | **required** | The value to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number |

`mxt:aura`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `aura` | `Holder<aura>` | **required** | The aura identity to spend |
| `amount` | `NumberProvider` | **required** | Amount to spend; must evaluate to a finite positive number. The payer's value account is charged the value that aura is measured in; a shared aura pool or a block's store is charged that aura itself (see the channel table under Shared Data Types) |

`mxt:item`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Which items may be spent; see [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **required** | Number of matching items to spend, rounded up; a non-positive or non-finite result means the cost cannot be paid |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

`mxt:js`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | **required** | Callback ID registered with `MxtCosts.register(...)` |
| `params` | Object | `{}` | Arbitrary JSON passed to the callback |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

A script cost is checked and then paid on the server, and it needs a player. The callback receives the payer and the params, not the ability's formula context, because a `Cost` is evaluated with the payer alone.

The payer is a **living entity** (a player, a mob, a summoned creature), not necessarily a player: `mxt:item` needs a player's inventory, so a non-player payer (or a formation with no owner) simply cannot pay it — a refusal, not an error; and `mxt:js` needs a player and runs **last, after every other channel has been paid**. A script cost is not staged, so scripts have to be idempotent about it.

A whole array is **all or nothing**: if any one entry cannot be paid, nothing is taken. Two entries in the same array that name the same store (the same value twice, or the same aura twice) make the definition **fail to load**, while a `mxt:resource` entry and a `mxt:aura` entry whose aura is measured in that value have their amounts added together and are not an error. A malformed entry is **no longer dropped silently** either — it fails the load.

A `costs` array also accepts the plain `{"id": ..., "amount": ...}` shorthand, which is read as `mxt:resource`. The shorthand is kept for compatibility; new entries should write the type explicitly.

---
