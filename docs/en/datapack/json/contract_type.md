---
title: Contract Type (contract_type)
description: Defines the two sides conditions, the behaviour at each of four moments, the signing price and the two caps of a contract.
aside: false
---

# Contract Type (contract_type) {#contract_type}

File location: `data/<namespace>/mxt/contract_type/<path>.json`

A `contract_type` describes one contract from the moment it is signed to the moment it is released: what each side has to satisfy, what runs at each of the four moments, what signing costs, how many one owner may hold at once, and how long a recall has to wait.

**Who may sign is a code fact**: the target creature has to support contracts itself (see [Special Public Interfaces](../../java/interfaces)), and no data pack can hand an entity that eligibility. Who owns it is answered by the creature as well - the mod stores no owner. A data pack gets three levers: narrow either side with the `*_condition` fields below, charge a price with `costs`, and narrow the list with an **entity type tag** - the tag reuses the contract type's own id, written `#<namespace>:contract/<path>` (file `data/<namespace>/tags/entity_type/contract/<path>.json`). **A tag that is absent, or written empty, places no restriction.**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `contract_type.mxt.<namespace>.<path>` | Display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `contract_type.mxt.<namespace>.<path>.description` | Description. When omitted it is the default key in the previous column; it is only stored and read, nothing draws it. |
| `owner_condition` | `EntityCondition` | `mxt:always` | The owner condition. |
| `creature_condition` | `EntityCondition` | `mxt:always` | The spirit beast condition, checked after eligibility. |
| `follow_action` | `EntityAction` | `mxt:no_op` | The action run every tick **while the order in force is "follow"**. |
| `combat_action` | `BiEntityAction` | `mxt:no_op` | Run after damage this spirit beast dealt has been resolved. |
| `release_action` | `EntityAction` | `mxt:no_op` | Run when the contract is **released**, while the spirit beast is still alive. |
| `death_action` | `EntityAction` | `mxt:no_op` | Run when the **spirit beast dies** and the contract ends with it. |
| `costs` | `Cost` array | `[]` | The signing price, paid by the **owner**; the spirit beast pays nothing. |
| `max_owned` | int | `0` | How many contracts of this type one owner may hold at once; `0` = no limit. |
| `recall_cooldown` | int | `0` | Recall cooldown in ticks; `0` = no limit. |

`follow_action` only runs for a creature that answers an order list, and it runs after that creature's own follow behaviour; switch the order to wander or stay and it stops - all it covers is the follow tick.

Release and death are two fields, and one action answers one moment only: `release_action` covers an owner releasing the contract or an administrator forcing a release, `death_action` covers the spirit beast dying.

`costs` may draw on the owner's resource accounts, inventory and script channel. Payment sits after every condition and after the `Pre` event, so a price that cannot be paid signs nothing and deducts nothing.

`max_owned` is counted per owner, and a release or a death frees the slot. `recall_cooldown` starts from a stamp on the contract record and gates the "recall" order, whether it comes from the Beast Taming Bell's wheel or from the command.

**Orders are not a data pack field here**: the orders an owner can give a spirit beast (follow / wander / stay / recall) are answered by the creature itself, and a content mod may add one of its own; the order in force is kept on the beast's contract record, and an id that does not resolve reads as follow. See the [command](/en/player-guide/commands/contract) and [Special Public Interfaces](../../java/interfaces).

Every refusal reason reads from one table of text keys, `contract.mxt.failure.<lowercase enum name>`; the Contract Scroll, the Beast Taming Bell, the Spirit Beast Bag and the command all print from that same table.

```json
// data/example/mxt/contract_type/familiar.json
{
  "owner_condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
  "creature_condition": { "type": "mxt:health", "comparison": ">=", "compare_to": 20 },
  "follow_action": { "type": "mxt:no_op" },
  "combat_action": { "type": "mxt:no_op" },
  "release_action": { "type": "mxt:no_op" },
  "death_action": { "type": "mxt:no_op" },
  "costs": [{ "id": "example:qi", "amount": 50 }],
  "max_owned": 1,
  "recall_cooldown": 600
}
```
