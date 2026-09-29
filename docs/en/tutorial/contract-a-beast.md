---
title: Contract a Beast
description: "One contract type definition to claim a beast: who is eligible, what it costs, the four orders, and recall plus the spirit beast bag."
---

# Contract a Beast

A contract type is the rule set for one beast's contract: who may sign, what signing costs, how many one owner may hold at once, how long a recall has to wait, and what each of the four action fields - follow, combat, release and death - does.

**One thing to get straight first: the mod provides no contractable creature of its own.** Whether a beast can be contracted is answered by the beast's own code - a content mod has to make it contractable, and the beast itself answers which orders it takes. A data pack cannot hand out that eligibility, so a JSON file will not let you claim a vanilla pig. This page is about **writing the rules for a beast that another mod (or your own content mod) provides**, not about making a beast out of nothing.

A data pack gets three levers: write the rules, narrow the list, charge a price.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/contract_type/spirit_familiar.json` | One contract type: price, caps, recall cooldown, plus an effect you can see while the beast follows. |
| `data/example/mxt/creature_profile/spirit_beast.json` | This beast's growth chain: the entry level, the value that measures mastery, and what each level grants. |

## Step 1 — Write a Contract Type

Contracts live in one registry only, `mxt:contract_type`, at `data/<namespace>/mxt/contract_type/<path>.json`, where the file name is the path of the id.

An empty object is already a valid definition - **every field is optional**:

```json
// data/example/mxt/contract_type/spirit_familiar.json
{}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | text | `contract_type.mxt.<namespace>.<path>` | Display name. When omitted this key is used. |
| `description` | text | that key plus `.description` | Description. When omitted this key is used. |
| `owner_condition` | entity condition | `mxt:always` | Whether the owner side is eligible. |
| `creature_condition` | entity condition | `mxt:always` | Whether the beast side is eligible. |
| `follow_action` | entity action, or an array of them | `mxt:no_op` | Run every tick while the order in force is "follow". |
| `combat_action` | two-entity action | `mxt:no_op` | An action over the beast and its target. |
| `release_action` | entity action | `mxt:no_op` | Run when the contract is released. |
| `death_action` | entity action | `mxt:no_op` | Run when the beast dies. |
| `costs` | cost array | `[]` | The signing price, **paid by the owner**; an empty array is free. |
| `max_owned` | integer ≥ 0 | `0` | How many one owner may hold at once; `0` means no limit. |
| `recall_cooldown` | integer ≥ 0 | `0` | The recall cooldown in ticks; `0` means no limit. |

Both conditions are entity conditions, one asked about the owner and one about the beast. The name and description need no translation key written by hand: the display name is generated as `contract_type.mxt.<namespace>.<path>`, and the description adds `.description` to it.

## Step 2 — The Price and the Two Caps

```json
// data/example/mxt/contract_type/spirit_familiar.json
{
  "costs": [{"id": "example:qi", "amount": 20}],
  "max_owned": 1,
  "recall_cooldown": 100
}
```

`costs` is an array of costs; this one charges 20 `example:qi` (the resource the example pack already has). **The payer is the owner, not the beast** - the beast pays nothing. Payment sits after every condition and after the event, so a price that cannot be paid signs nothing and deducts nothing.

`max_owned` is how many contracts of this type **one owner** may hold at once, so `1` means one beast each; `0` is the "no limit" value. `recall_cooldown` is in ticks, so `100` is five seconds between two recalls; `0` means no limit.

## Step 3 — Make "Follow" Visible

```json
{
  "follow_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:speed",
    "duration_ticks": 40,
    "amplifier": 0
  }
}
```

`mxt:apply_effect` applies one vanilla status effect: `effect` and `duration_ticks` are required, `amplifier` defaults to `0`. The action lands on the beast itself, so while it follows you it refreshes a 40-tick speed every tick and one glance tells you it is in follow; tell it to wander or stay and the action stops.

`follow_action` also takes an array, so you can hang several actions on the same moment. `release_action` and `death_action` are entity actions too, each running once at its own moment - release, and the beast's death. `combat_action` is a two-entity action and is written the same way.

All of it together:

```json
// data/example/mxt/contract_type/spirit_familiar.json
{
  "costs": [{"id": "example:qi", "amount": 20}],
  "max_owned": 1,
  "recall_cooldown": 100,
  "follow_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:speed",
    "duration_ticks": 40,
    "amplifier": 0
  }
}
```

## Step 4 — Narrow the List

To let this contract sign only certain kinds of creature, use a **vanilla entity type tag**. The tag id comes from the contract type's own id:

`#<contract type namespace>:contract/<contract type path>`

The file goes in `data/<namespace>/tags/entity_type/contract/<path>.json`. For `example:spirit_familiar` the tag is `#example:contract/spirit_familiar` and the file is `data/example/tags/entity_type/contract/spirit_familiar.json`.

**A tag that does not exist, or one written empty, places no restriction.** And a list is just a list: putting a creature in the tag does not give it contract eligibility, which is still answered by its own code - a vanilla pig in the tag still cannot sign.

## Step 5 — Bind It, Then Give Orders

There are three ways in: hold `mxt:contract_scroll` and right-click the beast; run `/contract bind <player> <target> <contract_type> [force]`; or have a content mod call it itself.

The order is fixed, and **payment comes last**:

1. It is not bound yet;
2. the beast can be contracted;
3. the list tag;
4. the owner's `owner_condition`;
5. the beast's `creature_condition`;
6. the `max_owned` cap;
7. the event;
8. the `costs` payment.

Any step that fails stops there, and the message names it: already bound, the beast does not accept contracts, the owner condition is not met, the beast condition is not met, the limit is reached, the price cannot be paid, it is not bound, it is not your beast, the recall is on cooldown, it was cancelled, the beast does not take that order, the beast refused that order.

On success the contract is written, the beast records its owner, it is stopped from despawning naturally, and the owner index is updated.

Four orders are built in and fixed in code, and **neither a data pack nor a script can add one**: follow, wander, stay and recall. The order list is answered by the beast itself - you can only give the orders it takes. Recall is momentary and is over once it runs; follow, wander and stay stay in force until another one **replaces** them.

The player's way in is the Beast Taming Bell (`mxt:beast_taming_bell`): hold it in either hand and right-click a beast that is **bound to you**, and the bell remembers that beast, its display name and the orders it takes; right-click **air** next and the wheel opens on the `mxt:contract` page, where a click gives that order. The operator's equivalent is `/contract behavior <target> <order>`.

## Step 6 — Recall and the Spirit Beast Bag

A recall does not move the beast on the spot: it sets a latch that the beast consumes **on its next tick**, and the default implementation simply teleports it.

A recall only happens when all of these hold: it is bound, the beast takes that order, and the owner is **online and in the same dimension**. In another dimension the beast simply does not move. A recall on cooldown is refused out loud.

The Spirit Beast Bag (`mxt:spirit_beast_bag`) holds one beast at a time, and only when **it is yours, it is contracted, and the bag was empty**. What it stores is the beast's whole save, so **the contract travels with the beast** and is still there when you let it out. The name, contract type and owner on the bag are a tooltip snapshot, not the truth.

Dropping the bag **does not count as death**: `death_action` does not run and the contract is not cleared.

## Step 7 — Creature Growth

**The contract gives the rules; the growth hangs on the profile.** Once a [creature profile](../datapack/json/creature_profile.md) writes `default_level`, the beast has a progression chain of its own - each level lives in [progression](../datapack/json/progression.md), `mastery_resource` names the value that measures mastery, and `configuration` says what each level grants and what reaching it takes.

The entry level's own `configuration` is what the beast is **born with**: grants are **cumulative**, since the level it stands on and every level below it count, so what it knows from birth goes into the entry level and what it learns on advancing goes into the next one. A profile has no `granted_abilities` of its own and no `passive_modifiers` - for attributes, use an `mxt:modifier` ability on the entry level.

```json
// data/example/mxt/creature_profile/spirit_beast.json
{
  "entities": ["example:spirit_beast"],
  "default_level": "example:beast_growth_1",
  "mastery_resource": "example:beast_mastery",
  "configuration": {
    "example:beast_growth_1": { "condition": { "type": "mxt:always" }, "ability": "example:beast_bite" },
    "example:beast_growth_2": { "condition": { "type": "mxt:always" }, "ability": "example:beast_howl" }
  }
}
```

**Mastery grows however a data pack or a script makes it grow**: the mod only provides `mastery_resource` as the yardstick, and the ways to raise a value already exist - the `mxt:add_resource` action, an aura's `regen`, KubeJS. Every 20 ticks the server asks about this chain once: once the value is high enough and that level's `condition` holds, the beast advances, and what it grants is rebuilt.

Ending the contract clears the chain's record (both releasing it and the beast dying count): the beast falls back to its entry level and the abilities the levels granted are revoked with it. While the contract holds, the level travels with the beast, so it survives a trip into the Spirit Beast Bag and back out.

`/contract info <target>` prints two more lines - the level it stands on, what the next one is and how much mastery is still missing. `/contract level <target> <level>` is the operator's way in, and it ignores that level's own `mastery` and `condition`.

## Verify

```text
/contract info <target>
/contract list
/contract bind <player> <target> example:spirit_familiar
/contract behavior <target> mxt:stay
```

1. Drop the file into your data pack and **re-enter the world**: contract definitions are read when the world loads, and `/reload` does not read them again.
2. Find a contractable beast that a content mod provides and run `/contract info <target>`: it reads the contract type, the owner, the signing time, the recall state, the order in force and the cooldown left.
3. Right-click it with the Contract Scroll, or run `/contract bind <player> <target> example:spirit_familiar` (gamemaster permission). It walks the order above and names the step that failed; `force` skips the price and the cap. A price that cannot be paid deducts nothing.
4. Look for it in the owner index with `/contract list` - no permission needed.
5. Right-click it with the bell, then right-click air. Pick follow, wander and stay in turn and the order in force in `/contract info <target>` follows; pick recall and it comes back to you (same dimension), with the recall state and the cooldown left advancing.
6. Capture it with the Spirit Beast Bag and let it out again: the contract is still there and the order is unchanged.

`bind`, `break`, `recall` and `behavior` need gamemaster permission; `list` and `info` do not. The top-level alias `/contract` can be turned off in **Server Config → Command Aliases → /contract**, and `/mxt contract` still works after that.

## Common Mistakes

Some problems have no feedback at all - no message, no log:

- Not bound yet, the contract type cannot be read, the beast does not take that order, or the owner is offline or in another dimension: the beast simply does not move.
- Right-clicking air with the bell opens the screen **on the client**; the server side does nothing because of it.
- Picking the wheel while the bell is not aimed at any beast: one line saying nothing is selected, and no screen.
- Right-clicking a block or air with an empty bag: nothing is consumed and nothing happens.

| Symptom | Cause |
| --- | --- |
| The JSON does not let you claim a vanilla pig | Eligibility is answered by the beast's own code and the mod provides no contractable creature; a data pack writes the rules, narrows the list and charges the price. |
| A changed definition has no effect | Definitions are read when the world loads and `/reload` does not re-read them; re-enter the world. |
| The list tag changes nothing | A tag that is absent, or written empty, places no restriction. |
| The message says the price cannot be paid | `costs` is paid by the owner out of the owner's own accounts; the beast's inventory is not used. |
| The message says the limit is reached | `max_owned` is used up; releasing the contract or the beast dying frees the slot. |
| Clicking recall twice throws an error | The beast is already on its way back, and a second recall throws instead of showing a message; do not click again before that recall lands. |
| `/contract` no longer exists | **Server Config → Command Aliases → /contract** turns the top-level alias off; `/mxt contract` still works. |

## Next

- [Contract Type](../datapack/json/contract_type.md) — the full field list and the tag rule.
- [Commands](../player-guide/commands/contract.md) — every `/contract` subcommand and the bell's behaviour.
- [Entity Action Types](../datapack/types/action/entity_action_types.md) — what you can hang on each of the four moments.
- [Entity Condition Types](../datapack/types/condition/entity_condition_types.md) — what `owner_condition` and `creature_condition` accept.
- [Define an Ability](./add-an-ability.md) — abilities use the same action fields.
