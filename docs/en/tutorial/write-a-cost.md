---
title: Write a Cost
description: "The one cost array the whole pack reuses: the five shapes, where each of the four types charges, the all-or-nothing boundary and its rollback order, the failure text a player sees, and how to register a script cost."
---

# Write a Cost

**A cost has no file of its own.** `Cost` is one array shared by more than a dozen fields — abilities, cultivation, formations, forging, contracts, talismans and value upgrades all write it — and every entry in it says "take one thing, this much of it". There is exactly one shape, and once you know it you can write the "what does this cost" half of the whole pack.

This tutorial is about that array alone: what it looks like, where each of the four types charges, how several payments inside one action become one boundary, and what happens when it cannot be paid. **When a particular module pays its own `costs` field, and whether its cooldown or condition comes first, belongs to that module's page** — this page does not go into it and only lists where to read on under `## Next`.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/ability/qi_bolt.json` | *(edited)* Replaces the qi bolt's `costs` with an array that carries all four types. |
| `kubejs/server_scripts/mxt_costs.js` | *(new)* Registers one script cost with `MxtCosts.register`, so the script side can implement a price of its own. |

The example pack is already set up and the `example:qi_bolt` ability already exists — it is in the file tree under `## Conventions`. The page also uses the `example:qi` value and the `example:qi` aura; [Define Aura and Realms](./define-aura-and-realms.md) writes both.

This page **adds no registry file at all**.

## Step 1 — The Array and the Shorthand

Every field that needs something spent is the same array, one `Cost` per entry:

```json
"costs": [
  {"id": "example:qi", "amount": 10}
]
```

An entry with only `id` and `amount` is the **shorthand**, and it is read as `mxt:resource` — "take 10 of the `example:qi` value out of the payer's account". The long form says exactly the same thing:

```json
"costs": [
  {"type": "mxt:resource", "resource": "example:qi", "amount": 10}
]
```

The shorthand is the door left open for the older writing; the two mix freely in one array, and `MxtCosts` and `MxtResources.consume` both accept them.

`amount` is always a [number provider](../datapack/types/number_provider_types.md): a constant, a formula string or a built-in provider. It **has to evaluate to a finite positive number at use time** — a value that is not finite, or is `0` or negative, makes that entry unpayable (the failure reason is `INVALID_AMOUNT`) rather than charging nothing.

```json
"costs": [
  {"id": "example:qi", "amount": "5 * caster_example_qi"}
]
```

A formula string works for `amount` too (the entry above is one), and a formula is evaluated against the **payer**. `Cost` is only ever checked with a payer, so it does not see an event payload: names the payer's own context offers are readable, anything an event injects is not — the script callback side says it plainly: `context.value('level')` works and `context.value('damage')` does not. Before a name is used in a cost, check whether the payer is what offers it.

## Step 2 — Four Types, One Job Each

The four that write `type` are dispatched by the built-in `mxt:cost_type` registry; the mod registers them and a data pack may only choose among them, never add one:

| `type` | Fields | Where it charges |
| --- | --- | --- |
| `mxt:resource` | `resource`, `amount` | The payer's own account for that value. |
| `mxt:aura` | `aura`, `amount` | By aura identity; which store it takes from depends on the paying channel, see below. |
| `mxt:item` | `items`, `amount` | Matching items, rounded up. |
| `mxt:js` | `id`, `params` | Handed to a server script callback. |

```json
"costs": [
  {"type": "mxt:resource", "resource": "example:qi", "amount": 10},
  {"type": "mxt:aura", "aura": "example:qi", "amount": 2},
  {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2},
  {"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
]
```

**`mxt:resource` names a value; `mxt:aura` names an aura identity** — two different things. An aura is an identity and a value is a stored amount: the aura definition says which value that aura is measured in, so when the payer pays an `mxt:aura` entry out of their own pocket, what actually comes out is that value.

An `mxt:item` entry's `items` is an [`ItemMatcher`](../datapack/types/shared_data_types.md#itemmatcher): a bare item id, an `#item tag`, or matching entries that write a `type` (`mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique`, `mxt:spirit_storage`, `mxt:herb_tag`, `mxt:quality`, `mxt:ingredient`), all mixed in one array. Its `amount` is **rounded up**, so `1.5` takes 2; a rounded amount that is not positive or not finite means the entry cannot be paid, not that it takes nothing.

`mxt:aura` can do one thing the other three cannot: **it can charge more than one store.** When the payer pays it themselves, it takes the value that aura is measured in; when the venue pays it out of the **shared aura pool** (a cultivation's `aura_costs`), the amounts are first scaled by each cultivator's share of the pool in that chunk and the pool then pays all-or-nothing; and when a **block entity's own store** pays it (the `aura` of a spirit-crafting recipe), it takes that aura itself in whole units rounded up. The same `mxt:aura` entry charges whichever of those the call site offers — the entry does not carry that choice.

Two fields **accept `mxt:aura` entries only**, and any other type in them is a load error: `cultivation.aura_costs` and the `aura` of a spirit-crafting recipe. They also accept the map form: the keys are aura ids and the values are number providers.

## Step 3 — Hang the Array on an Ability

Open the qi bolt the example pack already has and replace nothing but `costs`:

```json
// data/example/mxt/ability/qi_bolt.json
{
  "type": "mxt:active",
  "icon": "example:textures/gui/ability/qi_bolt.png",
  "costs": [
    {"id": "example:qi", "amount": 10},
    {"type": "mxt:aura", "aura": "example:qi", "amount": 2},
    {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}
  ],
  "cooldown": 40,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"}
}
```

Every other field stays as it was: renaming one or leaving one out changes nothing about the array itself — whichever field carries `costs` is what pays it. An ability is the example here because it is the easiest thing to try in game, but only `costs` was replaced.

Twelve fields carry `costs`: `ability.costs` (**shared by every ability type**, which is why `mxt:mount`'s per-tick fuel and `mxt:upkeep`'s per-period fee are written here too), the `upkeep_costs` of `mxt:channelled`, `realm_stage.costs`, `cultivation.costs` and `cultivation.aura_costs`, `formation.activation_costs` and `formation.maintenance_costs`, `forging_method.costs`, `contract_type.costs`, `talisman.costs`, `quality.upgrade_costs`, and the `aura` of a spirit-crafting recipe. What they share is this one shape.

## Step 4 — All or Nothing

**One array is one bill.** If any entry cannot be paid, the whole array charges nothing — the entries that could have been paid are left alone too:

```text
costs = [qi ×10, aura example:qi ×2, emerald ×2]
20 qi on you, no emeralds      →  not one point of qi is taken
```

There is a merge rule inside one payment as well. **Two entries in one array that name the same store are a load error**: writing one value twice, or one aura twice, reports `Duplicate resource cost` or `Duplicate aura cost` with that id. Two entries that merely **reach the same value through different routes** are not an error — a `mxt:resource` and an `mxt:aura` measured in that value **add up**, because that is the one answer which does not depend on the order they were written in. So the array above takes 10 + 2 = 12 `example:qi` out of the account in one go.

That was "one array". **Several arrays inside one action are a different matter**: a talisman firing several abilities, a composite ability carrying several children, and a cultivation tick paying both the environment's aura and the body's fee are all "several payments plus one boundary". The boundary's rules are:

- When a later payment is refused, whatever the earlier ones already wrote is **put back in reverse order** (last written, first returned), the whole action is treated as never having happened and the action itself does not run.
- **The script payment cannot be put back**, so it runs last: `mxt:js` only comes up after every other channel has been paid. The price is that a script must be **idempotent** about its own entry — nothing can undo the outside effects it already had.

## Step 5 — What the Player Sees When It Cannot Be Paid

Payment happens before the action, so a refusal looks like "nothing happened, plus one line of explanation":

| What the player sees | When |
| --- | --- |
| `资源不足` / `某某 不足` (not enough of a resource, named when it can be) | The payer's own account for that value is short (`INSUFFICIENT_RESOURCE`). |
| `消耗付不出（物品或其它代价不足）` (the cost cannot be paid) | Every other channel: not enough items, no player inventory to take from, or no such channel. |
| `灵气不足` / `灵气不足，无法继续修炼` (not enough aura) | The shared aura pool or the block store is short. |
| `该道法配置无效` / `这门技能的数值配置有误` (the numbers are wrong) | Some `amount` cannot evaluate to a finite positive number. |

**The refusal happens before the action runs**, and that matters more than the wording: an ability is not put on cooldown before the money is taken, a talisman is not burned before the error, and a formation is not activated before it falls behind on its fee. `CostFailure` is an enum value, not an exception — the same definition always loads, it simply stops cleanly at the step where it ran out.

A missing channel is **only ever reported as "cannot be paid", never as "the definition is broken"**: `mxt:item` needs a player inventory, so a payer who is not a player (or a formation with no owner) simply cannot pay it, and `mxt:js` needs a player. The payer itself is **a living entity** — a player, a creature or a summon; it does not have to be a player.

The other way round, **an entry that cannot be decoded fails the whole definition** (an unknown `type` or a missing required field will do it): the `costs` array **does not use** the tolerant-list convention, so there is no "log a warning and drop that entry".

## Step 6 — Script Costs

The `mxt:js` type is the door for a script that implements a price of its own, and it is registered from a server script:

```js
// kubejs/server_scripts/mxt_costs.js
MxtCosts.register('example:quest_token',
  (player, params, context) => {
    const needed = params.count || 1
    return player.persistentData.getInt('tokens') >= needed
  },
  (player, params, context) => {
    const needed = params.count || 1
    player.persistentData.putInt('tokens', player.persistentData.getInt('tokens') - needed)
  }
)
```

The callback signature is `(player, params, context)`: the first is the check `(player, params, context) => boolean`, the second the payment `(player, params, context) => void`. `player` is the payer, `params` is exactly the `params` object from the JSON (an empty object `{}` when the field is left out), and `context` is built from that payer — `context.value('level')` works and `context.value('damage')` does not, for the same reason as in Step 1: a `Cost` is evaluated with the payer alone.

Then the data pack side writes:

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

Three things to remember: **do not register the same id twice** (the later registration replaces the earlier one); **an entry whose callback was never registered can never be paid**, and the log writes `Unknown KubeJS cost` with that id and that the cost cannot be paid — the type still loads, there is just nobody to answer for it; and **this type does not need KubeJS to be present**: `mxt:js` is registered unconditionally, so a pack that uses it always loads and merely fails to pay while the script is absent.

## Verify

Data pack registries are read while the world loads, so `/reload` is not enough: leave to the title screen and open the world again (or restart the server). Scripts under `kubejs/server_scripts/` are different — `/reload` empties every callback and runs them again, so an edited `MxtCosts.register` takes effect on `/reload` (only **startup scripts**, the ones registering items or blocks, need a game restart).

```text
(load the world again)
/mxt registries validate           → nothing reported
/mxt resource example:qi set 500   → plenty of value, so each entry can be tried
```

1. Learn `example:qi_bolt` (or grant it to yourself) and press it on the wheel: `example:qi` drops by 12 in one go and the emeralds in your inventory drop by 2.
2. `/mxt resource example:qi set 11` and press it again: the ability does not fire, the chat line reports the shortage, and **not one emerald is taken** — the array is all or nothing.
3. `/mxt resource example:qi set 12` and press it again: it succeeds and the account lands exactly on zero. 10 + 2 = 12 is the resource entry and the aura entry adding up.
4. Change the item entry's `amount` to `1.5`, open the world again and press it: 2 emeralds are taken, rounded up.
5. Change some `amount` to `0`, open the world again and press it: that entry cannot produce a usable amount and the whole array cannot be paid; the line reports an invalid configuration, not "charge 0".
6. Copy `{"id": "example:qi", "amount": 10}` into a second entry and open the world: the world will not load and the log reports `Duplicate resource cost` — one value may be written once per array.
7. Add `{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}` to the ability, comment the whole `register` call in `mxt_costs.js` out and run `/reload`: the log says that no one registered this script cost (the message starts with `Unknown KubeJS cost`) and the ability cannot be paid; put the registration back, `/reload` again, and it fires once there are 3 `tokens`.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| `Duplicate resource cost` | One value is written twice in one array. Two entries that reach the same value by different routes are legal (they add up); the same name twice is not. |
| `Duplicate aura cost` | One aura is written twice in one array. |
| `Every entry of an aura cost list must be an mxt:aura cost` | `cultivation.aura_costs` or a spirit-crafting recipe's `aura` carries another type. Those two fields accept `mxt:aura` only. |
| `Unknown KubeJS cost` (with that id, and that the cost cannot be paid) | The script cost's callback was never registered (the script did not load, the id is misspelled, or it was registered from a client script). The type itself still loads. |
| The whole definition fails to load | One entry of the `costs` array cannot be decoded (an unknown `type`, a missing required field). This array does not use the tolerant-list convention and does not drop just that entry. |
| The cost is never collected | The payer offers no such channel: `mxt:item` and `mxt:js` need a player. That is reported as "cannot be paid", not as a broken definition. |
| The cost is charged twice | Several `MxtCosts.consume` calls were treated as one atomic payment; pay a whole array in one go with `MxtResources`. |
| The script already changed the world and then the payment failed | The script entry runs last and cannot be put back. A callback has to be idempotent — keep irrevocable work out of its first half. |
| Editing the data pack files changes nothing | Data pack registries are read when the world loads, and `/reload` does not read them again. Server scripts are the other way round: `/reload` runs them again. |

## Next

- [cost_type (Costs)](../datapack/types/other/cost-type.md) — the field lists, defaults and checks of the four types.
- [Shared Data Types · `Cost`](../datapack/types/shared_data_types.md#cost) — the channel rules, the load-time validation, and which fields are deliberately *not* a `Cost`.
- [`MxtCosts`: A Single Cost](../kubejs/api/costs.md) — `register` / `check` / `consume` on the script side, plus [`MxtResources`](../kubejs/api/resources.md) for paying several entries in one go.
- [Define an Ability](./add-an-ability.md) — when one module pays its `costs`, and how that orders against its cooldown and condition.
