---
title: Formula Variables
description: Every variable a MiXianTu formula can read, which context provides it, and how an unknown name is reported.
---

# Formula Variables

A formula variable is a **built-in name** that pulls a number out of the objects the formula is evaluated against. `mxt:formula_variable` is a code registry like the action, condition and number provider families: a data pack cannot add entries or configure existing ones, and there is no JSON file behind it.

Variables are read **on demand**. Nothing is computed when a context is created, so an expression only pays for the names it actually mentions. Values that are not a property of an object — the `damage` of a hit, the coordinates of a broken block, a flag such as `breakthrough` — are not variables; they are explicit values that the caller puts into the context.

## Lookup Order

Reading a name resolves in this order:

1. **The explicit value**, if the context carries one. This covers event payloads, values the mod adds for one evaluation, and the `params` of the expression itself.
2. **The variable registry**, which resolves the name from the context objects.
3. **Nothing**, which is a content bug and is reported as described below.

`params` is the highest priority and only affects the one expression that declares it. See [Structured Expressions](./number_provider_types.md#structured-expressions).

## Unknown Names and Failures

A misspelled name, a name that the context cannot provide, or a variable that fails is reported at runtime, because nothing can decide it while the data pack is parsed:

| Situation | Development environment | Production |
|-----------|------------------------|------------|
| The name is unknown, or the context cannot provide it (for example `caster_health` in a context that has no caster) | Full `ERROR` log with the failing name | One warning line per distinct message, the expression continues with `0` |
| A variable produces `NaN` or infinity | Full `ERROR` log | One warning line, `0` |
| A variable throws while reading an object | Full `ERROR` log, including the exception and its stack trace | One warning line, `0` |

None of them stops the evaluation: the expression continues with `0`, so a bad name cannot abort the ability or the tick that used it.

A formula that is broken in a way the codec *can* see is a decode error instead, and it is handled in both environments the same way:

| Situation | Both environments |
|-----------|-------------------|
| The expression is empty, malformed, or its `params` are invalid | The entry fails to decode. The loader collects every failing entry of the load and reports them together, then fails the load |
| A weighted list has no entries, or a context variable has a blank name | Same: one decode error, collected with the others |

::: warning Unknown names are not silent
A name that no variable provides never quietly becomes `0`. A development environment prints the whole error at the first evaluation, and production keeps one warning line per distinct message, so a typo can still be found in a server log.
:::

Reading a name that only *some* contexts provide is not an error by itself. `realm_rank` is perfectly valid in a resource formula and unavailable in an ability formula; using it in the ability formula is what gets reported.

## Registry Variables

These two names work in every context, including a context with no objects at all:

| Variable | Description |
|----------|-------------|
| `zero` | Always `0`, for switching a term off without editing the expression |
| `random` | A new random double between `0` and `1`, drawn from the authoritative `RandomSource` of the context |

`random` is authoritative because the context carries the random source of the entity or the level it was built from. Never re-roll a value on the client to decide a game result.

## Entity Variables

A context built from an entity provides two families, one for the acting entity (`caster_`) and, in a bi-entity formula, one for the second entity (`target_`):

| Variable | Description |
|----------|-------------|
| `caster_health` / `target_health` | Current health, only when the entity is a living entity |
| `caster_max_health` / `target_max_health` | Maximum health, only when the entity is a living entity |
| `caster_level` / `target_level` | Vanilla experience level when the entity is a player, otherwise `0` |
| `caster_<resource>` / `target_<resource>` | Current amount of that resource; `0` when the entity does not hold it |
| `caster_<attribute>` / `target_<attribute>` | Current value of that attribute |

`<resource>` and `<attribute>` are the registry ID with the namespace and the path joined by `_`; `/`, `.` and `-` inside the path also become `_`:

| Registry ID | Variable |
|-------------|----------|
| `mxt:common` | `caster_mxt_common` |
| `example:fire/qi` | `caster_example_fire_qi` |
| `minecraft:max_health` | `caster_minecraft_max_health` |
| `minecraft:attack_damage` | `caster_minecraft_attack_damage` |

Every resource and attribute of the loaded registries can be named this way, whether or not the entity currently uses it. Because two different IDs can flatten to the same name (`example:fire_qi` and `example_fire:qi` both become `example_fire_qi`), a collision is reported instead of being resolved silently.

On the client only the attributes that the client receives are readable; an attribute the client does not track reads `0`, so a client-side preview never invents a value the server has not synchronized.

::: warning `caster_level` is not the realm
`caster_level` is the vanilla experience level. The realm rank is the separate `level` / `realm_rank` variable described below, and it only exists in a resource context.
:::

## Resource Variables

Formulas evaluated for one value — `resource.max`, `resource.bars`, and the fields of its [aura definition](../json/aura.md) such as `regen`, the conversions and `start_exp`, plus resource costs, realm stages and breakthrough thresholds — carry the cultivation state of that value as well:

| Variable | Description |
|----------|-------------|
| `realm` | Rank of the current realm in this resource's chain; `0` when the chain does not match |
| `realm_rank` | Same value as `realm` |
| `level` | Same value as `realm`, kept as a shorthand for realm formulas |
| `absorbed_aura` | Accumulated cultivation progress of this resource; `0` when the chain does not match |
| `cultivation_progress` | Same value as `absorbed_aura` |

A value's `max` and its aura definition's `regen` can therefore write:

```json
// data/example/mxt/resource/qi.json
{
  "max": "100 + realm_rank * 50 + absorbed_aura * 0.5"
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": "0.25 + realm_rank * 0.1"
}
```

## Values That Are Not Variables

These names are provided as explicit context values by the system that starts the evaluation, so they are only readable where that system runs.

### Ability Values

| Variable | Available when | Description |
|----------|----------------|-------------|
| `element_modifier` | The ability declares a non-empty `element_affinity` | The element affinity multiplier computed for the caster |
| `damage_multiplier` | The cast belongs to a mastery chain that grants the ability | The `damage_multiplier` of the level the caster stands on, which the [damage pipeline](../damage.md) also applies to the damage this cast deals |
| `aura_radius` | An `aura` ability evaluates its target action | The radius resolved for this pulse |
| `distance` | An `aura` ability evaluates its target action | Distance in blocks between the caster and the current target |

### Trigger Values

An ability with a `triggered` ability type is evaluated when its trigger fires, and the trigger adds these names:

| Trigger | Variables added | Description |
|---------|-----------------|-------------|
| `tick` | — | Entity context only |
| `attack` | `target_is_living`, `target_health` | `target_is_living` is `1` when the attacked entity is a living entity |
| `hurt` | `damage` | Damage that was actually inflicted on the caster |
| `kill` | `target_health` | Health of the killed entity at the moment of death |
| `death` | `victim_health` | Health of the dying entity, floored at `0` |
| `block_break`, `block_use` | `block_x`, `block_y`, `block_z` | Coordinates of the block involved |
| `item_use` | `use_duration` | Ticks the used item took to finish |
| `equip` | `equipment_slot` | Ordinal of the changed equipment slot |
| `breakthrough` | `breakthrough` | Always `1`, so it can be used as a flag |
| `technique_stage` | `stage` | Zero-based rank of the level that was just reached; the signal also carries the `technique` ID as an extension value for scripted matchers |

### Values From Other Systems

| Variable | Provided by | Description |
|----------|-------------|-------------|
| `damage` | Contract combat actions | Damage the contracted spirit beast just dealt |
| `formation_radius` | Formation `entity_tick_action` | Radius of the active formation |
| `distance` | Formation `entity_tick_action` | Distance in blocks between the formation centre and the entity |
| `aura_tribulation_modifier` | Tribulation timeline | Local aura influence, taken from the `tribulation_modify` rule of the aura zone and sampled once when each timeline entry begins |

## Where Each Variable Is Available

Which variables a formula can read is decided by the objects the caller puts into the context. The table below lists the main evaluation sites.

| Formula | Context objects | Variables available |
|---------|-----------------|---------------------|
| Ability cast time, cooldown, charges, channel interval, conditions, target selection | caster | Entity family; `element_modifier` when the ability declares `element_affinity`; `damage_multiplier` when a mastery chain granting the ability is known; the payload of the trigger that started the ability |
| Ability `target_condition`, `bi_entity_action` | caster + target | Entity and target families; the same payload |
| `aura` ability interval and radius | caster | Entity family |
| Ability resource cost (`ResourceCost.amount`) | caster + the spent resource | Entity family + resource family of that resource |
| Ability item cost | caster | Entity family |
| Resource `default_value`, `min`, `max`, `regen`, use condition, burst amount | caster, plus the resource where the definition is evaluated for one resource | Entity family; resource family where a resource is bound |
| Resource conversions, realm-stage thresholds, breakthrough threshold | caster + the resource | Entity family + resource family |
| Cultivate action conditions and amounts | caster, plus a resource context for the per-resource fields | Entity family; resource family where a resource is bound |
| Realm-stage and technique passive attribute modifiers | caster | Entity family |
| Curse duration, tick interval, conditions, actions | caster (or the context of whatever applied the curse) | Entity family, plus the payload of the ability that applied it |
| Item, weapon, pill and technique bindings, item quality, pill toxicity | the user or holder entity | Entity family, plus `target_health` / `target_is_living` on a weapon attack |
| Forging, formations, contracts, creature profiles, realm instances, artifacts | the player, owner or creature | Entity family (+ `formation_radius` / `distance` for `entity_tick_action`) |
| Tribulation timeline entry duration and conditions | caster | Entity family + `aura_tribulation_modifier` |
| Formulas evaluated from a `Level` instead of an entity: formation `tick_action` and `deactivate_action`, formation aura bonus, spirit crafting table costs, KubeJS block actions and conditions | nothing | `zero`, `random` only |
| Client-side previews that use an empty context: item and weapon tooltips, item-aura capacity, currency value checks | nothing | `zero`, `random` only |

::: info Empty contexts are common
Several display paths evaluate a formula with an empty context, so a definition that reads `caster_mxt_common` shows the real number in game and `0` in a tooltip. Keep display-only formulas free of entity variables, or accept that they cannot be previewed on the client.
:::

## Overriding a Name

`mxt:expression` accepts `params`, whose values are themselves `NumberProvider`s and replace the variable of the same name inside that expression only:

```json
{
  "type": "mxt:expression",
  "expression": "realm_rank * scale + bonus",
  "params": {
    "scale": 1.5,
    "bonus": "caster_minecraft_attack_damage * 0.5"
  }
}
```

Use `params` when one formula must depend on a value the context does not provide, or when the same expression is reused in several tables with different constants.
