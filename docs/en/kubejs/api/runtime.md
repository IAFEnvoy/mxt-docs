---
title: Runtime Domain APIs
---

# Runtime Domain APIs

## `MxtAbilities`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `use(entity, ability)` | `Entity`, ability ID | `AbilityService.UseResult` | Casts an ability the entity already holds; server only. |
| `selector(id, callback)` | Callback ID, `(actor, context, params) => Entity[]` | `void` | Registers the datapack type `mxt:js` ability target selector. |
| `grant(entity, ability, source)` | `Entity`, ability ID, source ID (`namespace:path`) | `boolean` | Grants the ability under that source; `true` when the source was not holding it yet. An unknown ability answers `false` (not an error), and nothing is changed on a client. |
| `revoke(entity, ability, source)` | `Entity`, ability ID, source ID | `boolean` | Drops that one source, and `true` when it was really holding it. **The ability itself only leaves once the last source lets go**, which is also when its cooldowns and its stored state go. |
| `has(entity, ability)` | `Entity`, ability ID | `boolean` | Whether it is held; read from the attachment, so a disabled or deleted definition still answers honestly. |
| `list(entity)` | `Entity` | `List<String>` | Every ability the entity holds right now, sorted by ID. |
| `sources(entity, ability)` | `Entity`, ability ID | `List<String>` | Which sources are keeping it granted right now, sorted; empty when it is not held. |

Abilities and curses are granted through the same source ledger: **it exists while at least one source holds it**, and the last source letting go is what removes it. A source must be a namespaced identifier such as `example:quest_reward`, and anything else throws. Granting, revoking and querying all only take effect on the server, where a client call answers `false` or an empty list and changes nothing. The result record of `use`: `committed()` means it completed immediately, `casting()` means the cast has started, `failure()` is the failure enum, `failedResource()` is the ID of the insufficient resource, and `amounts()` are the resources actually paid.

```js
const result = MxtAbilities.use(player, 'example:fireball')
if (result.failure() !== null) console.warn(String(result.failure()))
```

`selector` registers the ability target selector with the datapack type `mxt:js`. Return the entities to affect as an array; `null` entries are dropped:

```js
MxtAbilities.selector('example:nearest_three', (actor, context, params) => {
  const range = params.range || 8
  const found = []
  actor.level().getEntities(actor, actor.getBoundingBox().inflate(range))
    .forEach(entity => found.push(entity))
  found.sort((a, b) => a.distanceToSqr(actor) - b.distanceToSqr(actor))
  return found.slice(0, 3)
})
```

```json
{
  "target_selector": {"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}},
  "bi_entity_action": {"type": "mxt:heal", "amount": 4}
}
```

## `MxtCultivation`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `add(entity, resource, amount)` | `LivingEntity`, resource ID, finite non-negative number | `boolean` | Adds to the cultivation progress of that resource. On the client, with an unknown resource, a negative number or a non-finite number it returns `false`. |
| `tryBreakthrough(entity, resource)` | `LivingEntity`, resource ID | `CultivationService.BreakthroughResult` | Attempts a breakthrough along the realm chain of that resource. |

The accessors of the breakthrough record are `advanced()`, `failure()`, `failedResource()` and `costs()`. It fires the normal `cultivationBreak` flow, breakthrough actions, particles, tribulations and associated abilities.

## `MxtCurses`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `apply(entity, curse, stacks, source)` | `Entity`, curse ID, positive integer stack count, source ID (`namespace:path`) | `CurseService.ApplyResult` | Goes through the complete conditions and merging logic; the source joins the ledger. |
| `applyFor(entity, curse, stacks, source, durationTicks)` | As above plus a duration in ticks | `CurseService.ApplyResult` | The duration can only **tighten** the definition: a longer one is capped by the length the definition declares. |
| `remove(entity, curse)` | `Entity`, curse ID | `boolean` | Removes it with the `EXPLICIT` reason, **every source at once**; fires the removal event. This is the only way off for a disabled or deleted definition. |
| `release(entity, curse, source)` | `Entity`, curse ID, source ID | `boolean` | Drops that one source. It answers `true` only when that release is what removed the curse; `false` means the curse is still there — either another source still holds it or this source was never on the ledger, so `sources` is what to read when the two need telling apart. |
| `has(entity, curse)` | `Entity`, curse ID | `boolean` | Whether it is held; read from the attachment, so a disabled or deleted definition still answers honestly. |
| `stacks(entity, curse)` | `Entity`, curse ID | `int` | Its stack count, `0` when it is not held. |
| `remainingTicks(entity, curse)` | `Entity`, curse ID | `long` | Ticks left, `-1` when it never expires, `0` when it is not held. |
| `sources(entity, curse)` | `Entity`, curse ID | `List<String>` | Which sources are keeping that curse alive right now, sorted. |

Curses and ability grants share one source ledger: **it exists while at least one source holds it**, and the last source letting go is what removes it. `ApplyResult` exposes `applied()`, `cancelled()`, `failure()` and `instance()`; besides `CONDITION`, `CANCELLED` and `SERVER_ONLY`, `failure()` can be `DISABLED` (the definition carries `#mxt:disabled`), `UNKNOWN` (the definition is gone from the registry), `REENTRANT` (that curse is already in a transaction on the same entity, so a self-reference is refused) or `INVALID_DURATION` (the length cannot be met, so nothing was written). For `source` it is recommended to write a stable source such as `example:quest_reward`, so that data and events can be traced.

## `MxtAura`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `get(level, pos)` | `Level`, `BlockPos` | `AuraResult` | Reads the fully resolved multi-resource aura at that position. Read-only, and the client can query its locally available state. |
| `addBox(level, zone, minX, minY, minZ, maxX, maxY, maxZ, priority)` | Server `Level`, a loaded aura zone ID, two block coordinates, integer priority | `string` | Adds a persistent cuboid area and returns the generated area ID. |
| `remove(level, area)` | Server `Level`, the area ID returned by `addBox` | `boolean` | Removes the matching persistent area. |

`addBox` only accepts a `ServerLevel`, and `zone` must be a loaded `aura_zone` data pack ID; otherwise it throws an exception. The commonly used read-only methods of `AuraResult` are `aura()`, `concentration()`, `maximum()`, `regenPerTick()`, `cultivationSpeed()`, `source()`, `sourceKind()` and `suppressCultivate()`.

## `MxtElements`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | The element IDs the entity's **currently active** spirit roots name, sorted. Disabled elements and switched-off roots contribute nothing; an entity with no roots answers an empty list. |
| `has(entity, element)` | `Entity`, element ID | `boolean` | Whether the entity's spirit roots name that element. |
| `amount(entity, element)` | `Entity`, element ID | `double` | How much of that element has built up on the entity; `0` when none has, and `0` for a disabled or unknown element. A client reads its synchronised copy. |
| `attach(entity, element, amount)` | `Entity`, element ID, finite number | `double` | Builds that element up on the entity (a negative amount wears it off) through the **same** pipeline a strike uses, and returns the new total. A qualifying [`element_reaction`](/en/datapack/json/element_reaction) fires as usual. |

Elements and accumulation are two different things: `list`/`has` read the spirit roots (what the body *is*), while `amount`/`attach` read and write a per-element accumulation table (how much it has *built up*). `attach` is equivalent to the entity action `mxt:attach_element`, so a lava bath, a pill or a curse written from a script behaves the same way, and a negative amount cleanses. The three readers work on either side — the accumulation is a synchronised attachment, so a client script reads its local copy, which is exactly what an item tooltip does — and only `attach` is a server operation: on a client, or with an unknown or disabled element, a non-finite value or `0`, it returns `0` and changes nothing.

```js
// kubejs/server_scripts/mxt_element.js
PlayerEvents.tick(event => {
  const player = event.player
  if (player.level().isClientSide()) return
  // "has a water root and has built up 8 fire" — visible before any reaction fires.
  if (MxtElements.has(player, 'mxt_test:water') && MxtElements.amount(player, 'mxt_test:fire') >= 8) {
    console.info(`water cultivator carrying ${MxtElements.list(player)}`)
  }
})

// Let a custom event build fire up on a target; the element_reaction in the data pack settles it.
MxtElements.attach(target, 'mxt_test:fire', 4)
```

## `MxtSpiritRoots`

A spirit root is the **element half** of a body's cultivation identity: holding one binds that body to an element, changes the cultivation speed of that element's aura, and scales the abilities attuned to that element.

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | Every spirit root the entity **holds**, sorted by ID. A switched-off root, or one whose definition is disabled or deleted, is still listed — it really is still held. |
| `active(entity)` | `Entity` | `List<String>` | The roots that are **in effect** right now: switched-off ones, and ones whose bound element is disabled, do not count. |
| `has(entity, root)` | `Entity`, root ID | `boolean` | Whether it is held (the same meaning as `mxt:has_spirit_root`: a switched-off root still counts). |
| `enabled(entity, root)` | `Entity`, root ID | `boolean` | Whether that root is currently switched on; `false` when it is not held. |
| `grant(entity, root)` | `LivingEntity`, root ID | `{changed, failure}` | Goes through the authoritative service, so [`conflicting_elements`](/en/datapack/json/spirit_root) and the granted abilities are handled as usual. |
| `remove(entity, root)` | `LivingEntity`, root ID | `boolean` | Gives up that root together with its element and everything it granted; `false` when it was not held. |
| `setEnabled(entity, root, enabled)` | `LivingEntity`, root ID, `boolean` | `{changed, failure}` | "Switch off without losing": `changed: true` only when the state really changed and the grants were recomputed, and `failure: "NOT_HELD"` when it is not held. |

## `MxtPhysiques`

A physique is the **element-independent half** of the same identity: it grants vanilla attributes and abilities, scales the damage its holder deals and takes, and excludes other physiques through its mutual-exclusion tags.

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | Every physique the entity **holds**, sorted by ID (with `allow_stacking` the same ID can appear more than once). |
| `active(entity)` | `Entity` | `List<String>` | The physiques that are **in effect** right now. |
| `has(entity, physique)` | `Entity`, physique ID | `boolean` | Whether it is held. |
| `enabled(entity, physique)` | `Entity`, physique ID | `boolean` | Whether that physique is currently switched on; `false` when it is not held. |
| `grant(entity, physique)` | `LivingEntity`, physique ID | `{changed, failure}` | Goes through the authoritative service; [`holder_condition`](/en/datapack/json/physique) and `exclusive_tags` are judged against the **current** entity. |
| `remove(entity, physique)` | `LivingEntity`, physique ID | `boolean` | Removes that physique together with its attributes, abilities and damage multipliers; `false` when it was not held. |
| `setEnabled(entity, physique, enabled)` | `LivingEntity`, physique ID, `boolean` | `{changed, failure}` | The same switch as a spirit root. |

Both share one `failure` vocabulary: `DISABLED` (the definition does not exist, or is disabled by `mxt:disabled`), `ALREADY_HELD`, `CONDITIONS` (the physique's `holder_condition` is not met), `EXCLUSIVE_CONFLICT`, `ELEMENT_CONFLICT` (the root's `conflicting_elements`), `NOT_HELD` and `SERVER_ONLY` (called on a client). The four readers work on either side — the `spirit_identity` attachment is synchronised, and an item tooltip asking "are you a fire root?" is exactly that use — while the state-changing methods are server operations.

```js
// kubejs/server_scripts/mxt_identity.js
// Reshaping: swap one spirit root for another and switch the new physique on along the way.
const result = MxtSpiritRoots.grant(player, 'mxt_test:qingxiao_fire_root')
if (result.changed) {
  MxtSpiritRoots.remove(player, 'mxt_test:water_root')
  MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', true)
} else {
  console.warn(`grant refused: ${result.failure}`)
}
// "Is he on a fire root right now?" — a switched-off root is still held, so ask active rather than has.
const active = MxtSpiritRoots.active(player)
```

## `MxtSouls`

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `reclaim(entity)` | `Entity` | `boolean` | Uses the authoritative soul reclaim flow. It only applies to transferable souls, and it fires the reclaim pre/post events of `soul`. |

## `MxtTriggers`

A trigger signal is the notification a data pack ability waits for, for example when its carrier lands a hit. `MxtTriggers` publishes the same signal from a script and lets a script wait for it, both through the runtime `TriggerDispatcher`, so script subscriptions and ability triggers observe the same dispatch. Datapack [trigger rules](../../datapack/json/trigger.md) observe that same dispatch too, so a script-published signal can drive a rule and a rule's action can publish a signal a script waits for.

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `matcher(id, callback)` | Callback ID, `(signal, params, context) => boolean` | `void` | Registers a datapack trigger matcher (`mxt:js`). |
| `publish(entity, signal, values)` | `Entity`, namespaced signal ID, `object` or `null` | `boolean` | Publishes a server-authoritative signal for that entity; `false` when the entity is on the client. |
| `subscribe(entity, signal, key, callback)` | `Entity`, signal ID, a stable key, `(signal: TriggerSignal) => void` | `boolean` | Registers a runtime subscription for that entity. |
| `subscribeOnce(entity, signal, key, callback)` | Same | `boolean` | Registers a subscription that removes itself after the first matching signal. |
| `unsubscribe(entity, key)` | `Entity`, the key used at registration | `boolean` | Removes one script subscription. |
| `has(entity, key)` | `Entity`, the key used at registration | `boolean` | Whether that subscription exists right now. |
| `subscriptions(entity)` | `Entity` | `number` | How many script subscriptions the entity currently has. |

`matcher` is the data pack side of the same mechanism: a `mxt:js` trigger declares the signal it listens to and lets a callback decide whether it fires. It is how an ability or a breakthrough condition waits for a custom signal id, which the built-in `mxt:tick`-style matchers cannot express:

```js
MxtTriggers.matcher('example:on_pill', (signal, params, context) => {
  return context.explicit('toxicity') >= (params.minimum || 0)
})
```

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill", "params": {"minimum": 10}}]
}
```

The callback receives the `TriggerSignal` and the signal's formula context, so it reads the payload values a script published with `MxtTriggers.publish`. A matcher never matches when its callback is missing or throws.

```js
// kubejs/server_scripts/mxt_triggers.js
const KEY = 'example:toxicity_watch'

function onPillTaken(signal) {
  const toxicity = signal.context().formula().explicit('toxicity')
  if (!Number.isNaN(toxicity)) console.info(`${signal.type()} with toxicity ${toxicity}`)
}

function watch(entity) {
  // Re-registering the same key replaces the previous subscription, so this guard only keeps
  // the per-tick pass cheap.
  if (!MxtTriggers.has(entity, KEY)) {
    MxtTriggers.subscribe(entity, 'example:pill_taken', KEY, onPillTaken)
  }
}

EntityEvents.spawned(event => watch(event.entity))

// /reload re-evaluates this script, which drops its subscriptions; this re-arms the players
// who are still online. Publishing works whether or not anything is subscribed.
ServerEvents.tick(event => event.server.players.forEach(watch))

// Publish from your own logic: a command handler, a quest hook, or an item use.
function publishPillTaken(player, toxicity) {
  MxtTriggers.publish(player, 'example:pill_taken', { pill: 'example:returning_pill', toxicity })
}
```

`values` is copied into the trigger context as extension data, and every finite numeric value is also added to the trigger's formula context. A script callback therefore reads `toxicity` above through `signal.context().formula().explicit('toxicity')`, exactly like a data pack signal that carries `damage`.

A key identifies one subscription per entity, so give each signal its own key: subscribing the same key again replaces the previous subscription, whichever signal it watched.

The callback receives a `TriggerSignal`, whose accessors are `type()` (the signal ID), `gameTime()` and `context()`. The context exposes `actor()`, `target()`, `level()`, `position()`, `item()`, `block()`, `damageSource()` and `formula()`, plus `get(key)` (an `Optional`) and `data()` (the raw extension map) for the published values. Treat the context as read-only: it is shared with the other subscribers of the same signal.

Trigger subscriptions are runtime-only and are never saved. They are dropped when the entity leaves the world, and also by a server stop, a data pack reload or a server script reload — a reload replaces the callback objects a subscription refers to. Keep a stable key and re-register from a runtime hook, as the example above does. A one-shot subscription removes itself after its first matching signal, which is enough for a quest step that must not repeat. A key is scoped to one entity, so the same key on another entity is a different subscription; `/mxt trigger list [<entity>]` shows what a running server actually has armed.

## `MxtLoot`

MiXianTu adds a few types to the vanilla loot tables; `MxtLoot` lets a script provide two of them, so an ordinary loot table can call into a server script without an item or a block being involved.

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `condition(id, callback)` | Callback ID, `(lootContext, params) => boolean` | `void` | Registers the vanilla loot condition type `mxt:js`. |
| `function(id, callback)` | Callback ID, `(stack, lootContext, params) => ItemStack` | `void` | Registers the vanilla loot function type `mxt:js`. |

```js
// KubeJS does not bind the vanilla loot parameter keys as a global, so load the class once.
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')

MxtLoot.condition('example:first_clear', (loot, params) => {
  const player = loot.getParam(LootParams.THIS_ENTITY)
  return player != null && player.tags.contains(`cleared_${params.dungeon}`)
})

MxtLoot.function('example:bless', (stack, loot, params) => {
  stack.grow((params.multiplier || 1) - 1)
  return stack
})
```

```json
{
  "conditions": [{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}],
  "functions": [{"function": "mxt:js", "id": "example:bless", "params": {"multiplier": 3}}]
}
```

Both callbacks run on the server while loot is generated, and neither receives a `FormulaContext`: read the vanilla `LootContext` instead, for example with `loot.getParam(LootParams.THIS_ENTITY)`. A loot function returns the stack to keep — return its argument unchanged to leave the drop alone, return a new stack to replace it, or return `null` to keep the original. A missing callback makes a condition false and leaves a function's stack untouched, with a warning in the log.
