---
title: Define a Curse
description: Write a curse that stacks and fires on a period, put it on an entity, then take it off with commands, tags and cleansing actions.
---

# Define a Curse

A curse is a lasting state carried by an entity. The definition decides how long it lasts, how often it fires, how it stacks and what behaviour runs at each stage. **What may remove it is not decided here** — that sentence lives on the antidote side, in a tag.

This tutorial adds one curse to the example pack: `example:qi_backlash`, a backlash of qi. It expires on a timer, fires every 100 ticks, stacks up to three times, and refreshes its remaining time whenever it stacks.

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/curse/qi_backlash.json` | A curse that expires on a timer: stacks, periodic behaviour, and what happens on apply and on expiry. |

## Step 1 — The Four Types

A curse definition lives in `data/<namespace>/mxt/curse/<path>.json`. `type` is the only required field, and it decides only how this definition lives out its life. The mod registers those four types; a data pack picks one and cannot add another.

| `type` | Lifecycle |
| --- | --- |
| `mxt:timed` | Expires after `duration_ticks`; a constant duration must be greater than `0`, and loading checks that. |
| `mxt:permanent` | Never expires. |
| `mxt:triggered` | Driven by the signals in `triggers`: every matching signal runs `on_tick` once on the holder. `triggers` may not be empty, and loading rejects an empty list. |
| `mxt:empty` | Runs nothing at all: none of the four behaviour fields fires, and all four stay optional. |

`mxt:triggered` never looks at `tick_interval` — its beat is the signals. `mxt:timed` and `mxt:permanent` drive `on_tick` on the `tick_interval` period; `mxt:empty` runs nothing.

## Step 2 — The Definition and Its Fields

```json
{
  "type": "mxt:timed",
  "duration_ticks": 600,
  "tick_interval": 100,
  "max_stacks": 3,
  "stacking_mode": "add_stacks_refresh_duration",
  "on_apply": {"type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200},
  "on_tick": {"type": "mxt:apply_effect", "effect": "minecraft:hunger", "duration_ticks": 100}
}
```

| Field | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | Text component | `curse.mxt.<namespace>.<path>` | Display name. Omitted, it is the generated key in the previous column. |
| `description` | Text component | that key with `.description` appended | Description. Same fallback. |
| `type` | Curse type | **required** | One of the four above. |
| `duration_ticks` | Number or formula string | `0` | How long it lasts, in ticks. |
| `tick_interval` | Number or formula string | `20` | Interval of the periodic behaviour; only a finite value greater than `0` drives `on_tick` on a period. |
| `max_stacks` | Integer | `1` | Stack ceiling, `1..256`. |
| `stacking_mode` | Enum | `ignore` | What happens while it is already held, see the next step. |
| `application_condition` | Entity condition | `mxt:always` | Whether it may be applied; failing it makes the application fail. |
| `display_condition` | Entity condition | `mxt:always` | Whether the character information panel lists this row. |
| `on_apply` | Entity action | `mxt:no_op` | Runs once when an instance is created. |
| `on_tick` | Entity action | `mxt:no_op` | The periodic behaviour. |
| `on_expire` | Entity action | `mxt:no_op` | Runs on natural expiry. |
| `on_cleanse` | Entity action | `mxt:no_op` | Runs when it is cleansed. |

Each behaviour field takes a single action or an array of them. `on_apply` runs **only when an instance is created**: stacking onto, or refreshing, one already held does not run it again.

Only two moments in a curse's own life run behaviour — natural expiry runs `on_expire`, being cleansed runs `on_cleanse`. Outside decisions such as an explicit removal or a `replace` displacing the old instance run neither.

## Step 3 — Stacking

`stacking_mode` decides what a second application does while that curse is already held:

| Value | While it is already held |
| --- | --- |
| `ignore` | Nothing at all: the stacks stay, the remaining time stays, `on_apply` does not run again, and **nothing is reported**. |
| `refresh_duration` | The stacks stay and the remaining time is refreshed by this request. |
| `add_stacks_refresh_duration` | The stacks become `min(max_stacks, current + requested)` and the remaining time is refreshed. |
| `add_stacks_keep_duration` | The stacks become the same `min`, but the original remaining time stays. |
| `replace` | The old instance is removed as "replaced" and runs none of its behaviour; then the new instance goes through, `on_apply` included. |

The default is `ignore`: leave `stacking_mode` alone and a second application does nothing, so the stack count stays at whatever the first one set. The example writes `add_stacks_refresh_duration`, so applying it three times climbs to three stacks.

Two different curses **can coexist**: the framework has no exclusion rule. To get exclusion, write it into `application_condition` yourself — a "carries no other curse" condition (`mxt:not` around `mxt:has_curse`).

## Step 4 — Applying and Conditions

| Entry point | Effect |
| --- | --- |
| Entity action `mxt:apply_curse` | Applies one curse; it takes `stacks` and `duration_ticks`. |
| Entity action `mxt:apply_curses` | A list of entries, each applied on its own. |
| Vanilla loot function `mxt:apply_curse` | Applies a curse, with the source recorded as loot. |
| An item's `mxt:curse_container` | Applies on equipping, across all six equipment slots and the Curios slots. While that curse is **already** held it only registers this item's source and does **not** apply it again — neither the stacks nor the remaining time move. |
| Command `/curse apply` | See the command table in the next step. |

Places that name one specific definition (`mxt:apply_curse`, `mxt:remove_curse`, an item's `mxt:curse_container`) take a concrete id only. `mxt:remove_curses_by_tag` and vanilla tag filtering take a `#` tag, whose file lives in `data/<namespace>/tags/mxt/curse/<path>.json`. A definition has no "who may remove me" field: list the curse under an `mxt:curse` tag and the cleansing side recognizes it.

`application_condition` decides whether an application is allowed at all, and `display_condition` decides whether the character information panel shows the row; both default to `mxt:always`. Elsewhere, these read or write curses: the entity condition `mxt:has_curse` (all four filters optional), the item condition `mxt:curse_container`, and the loot condition `mxt:has_curse` (one extra `entity` field, choosing which entity in the loot context to ask about).

## Step 5 — Removal and Commands

| Entry point | Result |
| --- | --- |
| Natural expiry | A `mxt:timed` duration runs out and `on_expire` runs. |
| Entity action `mxt:remove_curse` | Removes one named curse under the cleansing reason, so `on_cleanse` runs. |
| Entity action `mxt:remove_curses_by_tag` | Removes every held curse carrying any one of the given tags, each running its own `on_cleanse`. |
| `/curse cleanse <target> <tag>` | The command side of cleansing; the tag is a bare id (`example:cleanse/poison`), without the `#`. |
| `/curse remove <target> <curse>` | Removes the whole instance and wipes every source at once, under the explicit reason, so no definition behaviour runs. |
| An item's `mxt:curse_container` being cleansed | Once the component stops carrying that curse, this item's own source is released; the instance only leaves once the last source is gone. |
| `purge_self_curses` on the `mxt:word` ability type | Clears the caster's own curses, also under the explicit reason, so `on_cleanse` does not run. |

Every removal posts an event, cancellable at the `Pre` stage by default; the one where `replace` displaces the old instance only posts an after-the-fact notice.

**There is no "irremovable" switch.** The two things closest to it: `mxt:empty` runs nothing at all, and when a definition is not in the current data pack (the file is gone, or a `neoforge:conditions` block keeps it out) an instance already held is **frozen** — no periodic behaviour, no natural expiry, cleansing refused, and an explicit removal the only way off.

| Command | Effect |
| --- | --- |
| `/curse list [target]` | Lists names, stacks, ticks left or "never expires", and every source. Without a target it looks at you, and it **needs no permission**. |
| `/curse apply <target> <curse> [stacks] [duration]` | Needs administrator permission; `stacks` is `1..256`, and the duration can only tighten what the definition declares. |
| `/curse remove <target> <curse>` | Needs administrator permission. |
| `/curse cleanse <target> <tag>` | Needs administrator permission, and the argument is a bare id without `#`. |

The top-level alias `/curse` is switched by **Server Config → Command Aliases → /curse**; `/mxt curse` stays complete when it is off.

## Verify

```text
/mxt registries validate
/curse list
/curse apply @s example:qi_backlash 2
/curse list
```

1. Data packs are read **when the world loads**, not on `/reload`; after editing the file, back out to the title screen and reopen the world (or restart the server).
2. `/mxt registries validate` passing means the definition made it into the registry.
3. `/curse apply @s example:qi_backlash 2` puts two stacks on you, and `/curse list` shows the name, the stacks, the ticks left and every source.
4. Apply one more stack: `add_stacks_refresh_duration` climbs it to three and refreshes the remaining time. Applying again still leaves three — `max_stacks` caps it.
5. 600 ticks later it expires on its own; `/curse remove @s example:qi_backlash` ends it right away.
6. `display_condition` decides whether the character information panel lists the row.
7. The test pack ships curse probes (granted by `/mxt_test kit` and then fired by hand) — use one on yourself to watch applying, stacking and cleansing.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The world will not load, pointing at an `mxt:timed` duration | The constant `duration_ticks` is not greater than `0`. Loading stops it. |
| The world will not load, pointing at an empty `triggers` | An `mxt:triggered` curse needs at least one trigger. Loading stops it. |
| The definition never makes it into the registry | `max_stacks` is outside `1..256`, so decoding fails. |
| Nothing was applied and the log says nothing | `duration_ticks` evaluated to something non-finite or negative, so that application is void; a `mxt:timed` formula that evaluates to `0` or less does the same, because loading can only judge constants. |
| An action stays silent while the command says the application failed | `application_condition` did not hold: the action side never reads the result back, so it says nothing; the command reports the failure. |
| `mxt:apply_curse` does nothing at all | The stack count evaluated outside `1..256`, which is skipped silently and leaves nothing in the log. |
| Applying a second time had no effect | `stacking_mode` defaults to `ignore`: while the curse is held it does nothing and reports nothing. |
| `/curse cleanse` says it cannot be done | The definition is not in the current pack, so the instance is frozen and only an explicit removal is left. |
| Two curses that should exclude each other both landed | The framework has no exclusion rule; write it into `application_condition` yourself. |
| A second piece of gear carrying the same curse did not raise the stacks | While it is already held, equipping only registers that item's source and does not apply it again. |

## Next

- [curse](../datapack/json/curse.md) — the complete field table, the source ledger, the three moments of `mxt:curse_container` and the display rules.
- [Curse Types](../datapack/types/other/curse.md) — the fields and duration rules of each lifecycle.
- [`/curse`](../player-guide/commands/curse.md) — every subcommand.
- [Entity Action Types](../datapack/types/action/entity_action_types.md) — the fields of `mxt:apply_curse`, `mxt:apply_curses`, `mxt:remove_curse`, `mxt:remove_curses_by_tag` and `mxt:apply_effect`.
- [Entity Condition Types](../datapack/types/condition/entity_condition_types.md) — the filters of `mxt:has_curse`.
- [Loot and Criteria](../datapack/loot-and-criteria.md) — curses in loot conditions and loot functions.
- [Ability Types](../datapack/types/other/ability.md) — `purge_self_curses` on `mxt:word`.
