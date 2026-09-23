---
title: Curse (curse)
description: Defines a referenceable curse that can be applied, stacked, ticked, expired and cleansed.
aside: false
---

# Curse (curse)

A `curse` defines a referenceable curse: how long it lasts, how it stacks, and which behaviour runs when it is applied, ticks, expires and is cleansed.

## File Location

Curse files go in `data/<namespace>/mxt/curse/` within your datapack.

**Purpose**: Curse definitions that can be referenced.

The filename corresponds to its ID. For example, `data/example/mxt/curse/burning.json` has the ID `example:burning`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `curse.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `curse.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; it is stored and read today, but nothing draws it yet. |
| `type` | `CurseType` | **required** | `mxt:timed`, `mxt:permanent`, `mxt:triggered` or `mxt:empty`. |
| `duration_ticks` | `NumberProvider` | `0` | Duration of a timed curse; the unit is ticks. |
| `tick_interval` | `NumberProvider` | `20` | Interval of the periodic behaviour. |
| `max_stacks` | Integer | `1` | Maximum number of stacks, range `1..256`. |
| `stacking_mode` | Enum | `ignore` | `ignore`, `refresh_duration`, `add_stacks_refresh_duration`, `add_stacks_keep_duration` or `replace`. |
| `application_condition` | `EntityCondition` | `mxt:always_true` | Whether the curse may be applied. |
| `display_condition` | `EntityCondition` | `mxt:always_true` | Whether the character panel **lists** this curse; while it fails, no row is left behind at all. Use `mxt:never` to keep a curse hidden, or a query of the curse's own state to reveal it later. |
| `on_apply` | `EntityAction` | `mxt:no_op` | Behaviour on application; it runs only when an instance is **created**, so stacking onto, or refreshing, a curse that is already held does not repeat it. |
| `on_tick` | `EntityAction` | `mxt:no_op` | Periodic behaviour. For `mxt:triggered` this is the effect a matching signal runs. |
| `on_expire` | `EntityAction` | `mxt:no_op` | Behaviour on **natural expiry**. |
| `on_cleanse` | `EntityAction` | `mxt:no_op` | Behaviour when the curse is **cleansed**. |

## Types

| Type | Expiry | What drives the periodic behaviour |
|------|--------|------------------------------------|
| `mxt:timed` | After `duration_ticks`, which **must be positive**: a constant is checked at load, an expression is judged when it is evaluated, and a duration that cannot be honoured rejects that one application instead of throwing. | `tick_interval` |
| `mxt:permanent` | Never (`duration_ticks` is not read). | `tick_interval` |
| `mxt:triggered` | After `duration_ticks` when one is given, never otherwise. | The **trigger system**: while the curse is held, every signal matched by one of its `triggers` runs `on_tick` once for the holder; `tick_interval` is not read. `"triggers": [{"type": "mxt:hurt"}]` is "act once per hit". |
| `mxt:empty` | Never. | Nothing: the type runs **no behaviour at all**, so it exists only as a marker. |

Loading also rejects a `mxt:timed` curse whose constant duration is not positive and an `mxt:triggered` curse with an empty `triggers` list.

A duration handed in by a reference (`mxt:apply_curse`, `/mxt curse apply`, `MxtCurses.applyFor`) may **shorten** a curse but never outlast what the definition declares; a definition that never expires may be made timed, never the other way round.

A curse owns behaviour for exactly two moments of its own life: natural expiry and being cleansed. Every other removal reason - explicit removal, an administrator, being overwritten by `replace` - is an outside decision, so the definition carries no behaviour for it and the caller decides what to run. Both moments receive the formula context of whoever started that transaction.

## Disabled and deleted definitions

A definition carrying the `#mxt:disabled` tag, and one that was removed from the data pack, both **freeze** the instances that already exist: they stop ticking, never expire, and refuse to be cleansed - an effect must not be quietly turned into a default - while the character panel keeps listing them. The only way off is an explicit removal (`mxt:remove_curse`, `/mxt curse remove`, `MxtCurses.remove`, reason `explicit`). Bringing the definition back restores the instance, because a data pack reload reschedules every holder.

Within one tick the held curses run in the attachment's own order - the order they were applied in, persisted with them - rather than by definition id.

## Cleansing

A curse never declares what may cleanse it. The **cure** side names the `mxt:curse` tags it removes, and the tag files list the curses:

```json
{ "type": "mxt:remove_curses_by_tag", "tags": ["#example:cleanse/poison"] }
```

```json
// data/example/tags/mxt/curse/cleanse/poison.json
{ "values": ["example:dan_toxicity", "example:soul_scorch"] }
```

`tags` takes tag IDs in the usual `"#namespace:path"` form, and a curse carrying **any one** of them is removed. Removal goes through the same transaction as expiry under the `cleansed` reason, so every curse it removes runs its own `on_cleanse` and fires a `CurseRemoveEvent` whose reason is `cleansed`; `mxt:remove_curse` removes one named curse under that same reason. Put the action in a pill's `on_consume`, in an ability's `entity_action` or in an item's `use_action` and you have an antidote: curses need no cooperation, they only have to be listed in that tag.

## Carried Curses

Any item can carry curses through the `mxt:curse_container` component. Entries are `mxt:apply_curse` entries - `curse`, `stacks?` and `duration_ticks?` - and the item itself is the source:

```json
give @s minecraft:diamond_chestplate[mxt:curse_container={curses:[{"curse":"example:soul_scorch","stacks":2}]}]
```

Three moments, all routed through the ordinary curse transaction, so a carried curse obeys its own application condition, stacking and duration:

- **Equipping applies it, or joins it.** The six equipment slots (main hand, off hand, head, chest, legs, feet) and the Curios slots all count; the source is `mxt:equipment/<slot>/<item id>`, or `mxt:curios_equipment` for Curios. A curse another source already holds is not applied again - the stack simply adds its own source to the ledger, so it does not disturb the stacks or the remaining time.
- **Unequipping releases only its own source.** The curse stays while any other source still holds it, and only a release that empties the ledger removes the instance, under the `explicit` reason (so no definition behaviour runs).
- **It heals itself while carried.** A curse that expired, was cleansed, or was removed outright is applied again within 20 ticks - equipment changes reconcile at once, Curios and self-healing on the slow cadence. A `mxt:timed` curse is therefore enough for "wearing this keeps cursing you"; `mxt:permanent` is not required.

## Sources

A curse is kept alive by its **sources**, through the same `SourceLedger` ability grants use: it exists while at least one source holds it, one source letting go only drops its own share, and the last one leaving is what removes it (that is when a removal event fires). Sources are identifiers: `mxt:ability` (from `mxt:apply_curse`), `mxt:loot`, `mxt:command`, `mxt:equipment/<slot>/<item id>`, `mxt:curios_equipment`, and whatever a script passes. `/mxt curse remove` and `mxt:remove_curse` are whole-instance removals, so they take every source with them.

The character panel's "Curses" line lists only instances whose `display_condition` passes, with the stack count and a tooltip naming the source and the remaining time. Carried curses are also written on the item itself: `mxt:curse_container` lists what the stack carries in its tooltip.

## Commands

`/mxt curse list [target]` prints a holder's curses (name, stacks, remaining ticks or "never expires", and the sources still holding each one) and needs no permission; `/mxt curse apply|remove|cleanse` need gamemaster permission and go through the same transactions content uses, `apply` reporting a refused definition as `DISABLED` or `UNKNOWN`. KubeJS exposes the same ground through `MxtCurses`: `apply`, `applyFor`, `remove`, `release`, `has`, `stacks`, `remainingTicks` and `sources`.

## Querying

`mxt:has_curse` - an entity condition, and a loot condition with an extra `entity` target - asks whether one held instance satisfies **every** filter given: `curse`, `tags` (all of them), `stacks` and `remaining_ticks`, the last two as `{min?, max?}` windows. A curse that never expires counts as infinite remaining time, so it answers a `min` but never a `max`. Name no filter at all and the query asks whether any curse is held, which combined with `mxt:not` reads as "carries no curse".

## Example

```json
{
  "type": "mxt:timed",
  "duration_ticks": 600,
  "tick_interval": 20,
  "max_stacks": 3,
  "stacking_mode": "add_stacks_refresh_duration",
  "application_condition": {"type": "mxt:always_true"},
  "on_apply": {"type": "mxt:no_op"},
  "on_tick": {"type": "mxt:damage", "amount": 1},
  "on_expire": {"type": "mxt:no_op"},
  "on_cleanse": {"type": "mxt:no_op"}
}
```

