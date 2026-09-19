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

A cost can be checked and then consumed from a player.

| `type` | Fields | Description |
|--------|--------|-------------|
| `mxt:resource` | `resource`, `amount` | Consumes a datapack resource from the player's resource attachment |
| `mxt:item` | `items`, `amount` | Consumes matching items from the player's inventory |
| `mxt:js` | `id`, `params?` | Checked and paid by a server script callback |

`mxt:resource`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `resource` | `Holder<resource>` | **required** | The resource to consume |
| `amount` | `NumberProvider` | **required** | Amount to consume; must evaluate to a finite positive number |

`mxt:item`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `ItemMatcher` | **required** | Which items may be consumed; see [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **required** | Number of matching items to consume, rounded up; a non-positive or non-finite result means the cost cannot be paid |

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

A script cost is checked and then paid on the server, and it needs a player: a cost that is not a `resource` cost makes the whole ability require one. The callback receives the payer and the params, not the ability's formula context, because `Cost` is evaluated with a player alone.

A `costs` array also accepts the plain `{"id": ..., "amount": ...}` shorthand, which is read as `mxt:resource`. The shorthand is kept for compatibility; new entries should write the type explicitly.

---
