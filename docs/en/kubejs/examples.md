---
title: KubeJS Examples
description: "Complete KubeJS scripts for MiXianTu: registering items and recipes, binding them into the framework, and reacting to server events."
---

# KubeJS Examples

These scripts show a complete setup: a startup script registers the content items, and server scripts attach rules and react to events. See the [API Reference](./api-reference.md) for every method used here.

## Registering Items and Recipes

```js
StartupEvents.registry('item', event => {
  event.create('spirit_manual').displayName('Nameless Cultivation Manual')
  event.create('spirit_stone').displayName('Spirit Stone')
})

ServerEvents.recipes(event => {
  event.shaped('example:spirit_manual', ['ABA', ' C ', 'ABA'], {
    A: 'minecraft:paper',
    B: 'minecraft:lapis_lazuli',
    C: 'minecraft:book'
  })
})
```

The item is registered by KubeJS, so the rest of the mod sees it as a normal item and can bind rules to its real item ID.

## Reacting to Events

```js
// kubejs/server_scripts/mxt_events.js
MxtEvents.abilityUse(event => {
  if (event.isPre() && event.getAbility() === 'example:forbidden') event.cancel()
})

MxtEvents.resourceConsume(event => {
  if (event.isPre()) event.setAmount('example:spirit_power', event.getAmounts()['example:spirit_power'] || 0)
})

MxtEvents.cultivationBreak(event => {
  if (event.getPhase() === 'Pre') {
    // event.getEvent() is the native CultivationBreakEvent.Pre.
    event.getEvent().setCost('example:spirit_power', 20)
  }
})
```

The matching data pack can bind `example:spirit_manual` to a technique and hook `example:spirit_stone` into `item_aura` or `currency`. That way the script only registers content, while the rules stay data-driven and are synchronised to every client.

## Defining a Script Action

Register the callback under a namespaced ID in a server script:

```js
MxtActions.entity('example:heal', (entity, params) => {
  entity.heal(params.amount || 1)
})
```

Any matching data pack field can then use it through the pre-registered `mxt:js` type:

```json
{
  "type": "mxt:js",
  "id": "example:heal",
  "params": { "amount": 4 }
}
```

The callback may take a third argument: the formula context of the dispatch, which carries the values only the triggering event knows. This one scales its effect by the damage that caused it:

```js
MxtActions.entity('example:knockback_on_hit', (entity, params, context) => {
  const damage = context.explicit('damage')
  if (Number.isNaN(damage)) return
  entity.push(0, params.strength * damage, 0)
})
```

## Defining a Script Cost

A cost is checked and then paid, so it registers both halves at once. The id is what a data pack puts in a `costs` array:

```js
MxtCosts.register('example:quest_token',
  (player, params, context) => player.persistentData.getInt('tokens') >= (params.count || 1),
  (player, params, context) => {
    player.persistentData.putInt('tokens', player.persistentData.getInt('tokens') - (params.count || 1))
  }
)
```

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

A script cost needs a player, and its context is built from that player alone, so read player state (or the explicit values of that context) rather than an event payload.

## Running a Built-in Action from a Script

```js
MxtActions.executeEntity(player, {
  type: 'mxt:heal',
  amount: 4
})
```

The `definition` object has the same shape as a single action inside a data pack, so any built-in action type works here.

## Testing a Built-in Condition

```js
const enoughQi = MxtConditions.testEntity(player, {
  type: 'mxt:resource_compare',
  resource: 'mxt:spirit_power',
  min: 10
})
```

## Evaluating Number Providers

```js
const levelScaled = MxtValues.evaluateNumber(player, {
  type: 'mxt:expression',
  expression: 'level * 2 + 1'
})
const actualAura = MxtValues.evaluateResource(player, 'mxt:spirit_power', {
  type: 'mxt:actual_concentration'
})
```

## Paying Several Costs Atomically

```js
const result = MxtResources.consume(player, [
  { id: 'mxt:spirit_power', amount: 10 },
  { type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 'level + 2' }
])

if (result.committed()) {
  console.info(`Deducted: ${result.amounts()}`)
} else {
  console.warn(`Could not pay: ${result.failedResource()}`)
}
```

When any one of the entries cannot be paid, none of them is deducted. `MxtResources.consume` and the single `Cost` API take the **same unified array**, so all five shapes are accepted in both, and an entry that cannot be decoded fails the call instead of being dropped:

```js
// Spend a value. The id shorthand of mxt:resource; it works in both APIs.
{ id: 'mxt:spirit_power', amount: 10 }

// Spend a value, typed form.
{ type: 'mxt:resource', resource: 'mxt:spirit_power', amount: 10 }

// Spend an aura. It charges the value that aura is measured in.
{ type: 'mxt:aura', aura: 'mxt:fire_aura', amount: 2 }

// Spend items. items accepts an item ID, an item tag, or an ItemMatcher object.
{ type: 'mxt:item', items: ['minecraft:emerald', '#c:mystic_gems'], amount: 2 }
```

## Casting an Ability

```js
const result = MxtAbilities.use(player, 'example:fireball')
if (result.failure() !== null) console.warn(String(result.failure()))
```

Only an ability the entity already holds can be cast this way, and the call only takes effect on the server.

## Publishing and Waiting for a Trigger Signal

A script can raise the same signal a data pack ability raises, and another script can wait for it. Subscriptions are runtime-only, so arm them from a runtime hook and re-arm them after a reload:

```js
// kubejs/server_scripts/mxt_triggers.js
const KEY = 'example:toxicity_watch'

function onPillTaken(signal) {
  const toxicity = signal.context().formula().explicit('toxicity')
  if (!Number.isNaN(toxicity)) console.info(`${signal.type()} with toxicity ${toxicity}`)
}

function watch(entity) {
  // Re-registering the same key replaces the previous subscription.
  if (!MxtTriggers.has(entity, KEY)) {
    MxtTriggers.subscribe(entity, 'example:pill_taken', KEY, onPillTaken)
  }
}

EntityEvents.spawned(event => watch(event.entity))

// /reload re-evaluates this script and drops its subscriptions; this re-arms the players
// who are still online.
ServerEvents.tick(event => event.server.players.forEach(watch))

// Publish from your own logic: a command handler, a quest hook, or an item use.
function publishPillTaken(player, toxicity) {
  MxtTriggers.publish(player, 'example:pill_taken', {
    pill: 'example:returning_pill',
    toxicity
  })
}

// A quest step that must fire once removes itself after the first matching signal.
function watchFirstPill(player) {
  MxtTriggers.subscribeOnce(player, 'example:pill_taken', 'example:first_pill', signal => {
    console.info(`first pill taken at ${signal.gameTime()}`)
  })
}
```
