---
title: Curse (curse)
aside: false
---

# Curse (curse)

File location: `data/<namespace>/mxt/curse/<path>.json`

A `curse` describes a lasting state that can be put on an entity: how long it lasts, how often it fires, how it stacks, and which behaviour each stage runs. The definition never decides who may cleanse it — that is declared on the antidote side, see [`mxt:remove_curses_by_tag`](#cleansing-tags-live-on-the-antidote-side).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `curse.mxt.<namespace>.<path>` | Optional display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `curse.mxt.<namespace>.<path>.description` | Optional description. When omitted it is the default key in the previous column; today it is only stored and read, nothing draws it yet. |
| `type` | Curse type id | **required** | For the values see [Curse Types](/en/datapack/types/other/curse). |
| `duration_ticks` | `NumberProvider` | `0` | Duration of a timed curse; the unit is ticks. |
| `tick_interval` | `NumberProvider` | `20` | Interval of the periodic behaviour. |
| `max_stacks` | Integer | `1` | Maximum number of stacks, range `1..256`. |
| `stacking_mode` | Enum | `ignore` | `ignore`, `refresh_duration`, `add_stacks_refresh_duration`, `add_stacks_keep_duration` or `replace`. |
| `application_condition` | `EntityCondition` | `mxt:always` | Whether the curse may be applied. |
| `display_condition` | `EntityCondition` | `mxt:always` | Whether the character information panel lists this curse. |
| `on_apply` | `EntityAction` | `mxt:no_op` | Behaviour on application. |
| `on_tick` | `EntityAction` | `mxt:no_op` | Periodic behaviour. |
| `on_expire` | `EntityAction` | `mxt:no_op` | Behaviour on **natural expiry**. |
| `on_cleanse` | `EntityAction` | `mxt:no_op` | Behaviour when the curse is **cleansed**. |

`on_apply` runs **only when an instance is created**: stacking onto, or refreshing, a curse that is already held does not run it again.

While `display_condition` fails, no row is left behind at all. Use `mxt:never` to keep a curse hidden, or query the curse's own state with `mxt:has_curse` to reveal it only once it reaches, say, two stacks.

## `CurseType`

Which lifecycle policy `type` picks, when each one expires, what drives its periodic behaviour and which fields each one reads are on [Curse Types](/en/datapack/types/other/curse).

## Duration Overrides Only Tighten

A duration handed in by a reference can shorten a curse, but never outlast what the definition itself declares. The three places that hand in a duration are `mxt:apply_curse`'s `duration_ticks`, `/mxt curse apply <target> <curse> <stacks> <duration>` and KubeJS `MxtCurses.applyFor`. A definition that never expires on its own (`mxt:permanent` / `mxt:empty` / `mxt:triggered` with no duration) can be overridden into a timed one, not the other way round: a timed curse is never overridden into a permanent one. For a longer curse, write a longer `duration_ticks` in the definition.

## Execution Order

Within one tick the held curses are handled in **the attachment's own order**, that is the order they were applied in. That order is saved with the attachment, so it is stable across relogs. It is not re-sorted by definition id.

## Sources Are a Set, Not a Single Entry

Every curse has a **source ledger** recording who keeps it alive — the same ledger ability grants use, under the same rule: **while at least one source still holds it, the curse exists**. One source letting go only drops its own share; the instance really leaves once the last one is gone, and that is when the removal event fires.

The built-in sources are all identifiers:

| Source | Where it comes from |
| --- | --- |
| `mxt:ability` | `mxt:apply_curse` |
| `mxt:loot` | A loot function |
| `mxt:command` | `/mxt curse apply` |
| `mxt:equipment/<slot>/<item id>` | An equipment slot |
| `mxt:curios_equipment` | A Curios slot |

A KubeJS caller passes its own source, written as `namespace:path`. `/mxt curse remove`, `mxt:remove_curse` and an antidote all do a **whole-instance removal**, so they wipe every source at once.

## Viewing and Manipulating

- `/mxt curse list [target]` lists the curses a holder carries: name, stacks, remaining time or "never expires", and every source.
- `/mxt curse apply <target> <curse> [stacks] [duration]`, `/mxt curse remove <target> <curse>` (reason `explicit`, whole instance) and `/mxt curse cleanse <target> <tag>` (reason `cleansed`, the same road an antidote takes) need administrator permission.
- On the KubeJS side `MxtCurses` has `apply`, `applyFor`, `remove`, `release` (drops one source only), `has`, `stacks`, `remainingTicks` and `sources`.

An item carrying `mxt:curse_container` also lists the curses it carries in its tooltip.

## A Definition That Is Gone Freezes

When a whole definition leaves the data pack (its file was deleted, or a `neoforge:conditions` block keeps it out), the instances already held **stay exactly where they are**: they no longer tick, trigger or expire, and they refuse to be cleansed — an effect must not be quietly "purified" into a default one. The character information panel keeps listing them, unless `display_condition` says otherwise.

The only way off is an **explicit removal**: `/mxt curse remove`, KubeJS `remove`, or unequipping the item that carries it (reason `explicit`). **`mxt:remove_curse` and an antidote cannot take it off** — they go through `cleansed`, and a frozen instance simply does not answer them. Once the definition is back the instance recovers on its own, because reconciliation is scheduled again on `/reload`.

## Only Two Moments Run Behaviour

A curse's own life has exactly two moments that run behaviour — **natural expiry** and **being cleansed** — one field each. Every other removal reason (explicit removal, an administrator, being overwritten by `replace`) is an outside decision, so the definition carries no behaviour for it and the caller decides what to run.

The formula context those two moments receive is the context of whoever started that transaction.

## Cleansing: Tags Live on the Antidote Side

The definition has no cleanse-tag field of its own, so **"who may remove me" is not decided by the curse**. It is the other way round: the **antidote** declares the `mxt:curse` tags it can remove, and the tag files list the curses under those tags. The action is `mxt:remove_curses_by_tag`:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tags` | `#tag[]` | **required** | The curse tags this action removes, written `"#namespace:tag"` (the same form as `mxt:entity_tag`). |

Matching **any one** of the listed tags is enough to remove it.

```json
{ "type": "mxt:remove_curses_by_tag", "tags": ["#example:cleanse/poison"] }
```

```json
// data/example/tags/mxt/curse/cleanse/poison.json
{ "values": ["example:dan_toxicity", "example:soul_scorch"] }
```

It removes under the `cleansed` reason, through the same transaction, so every curse it takes off runs its own `on_cleanse`. Removing **one named curse** under that same reason is `mxt:remove_curse`.

Put this action in a pill's `on_consume`, in an ability's `entity_action` or in an item's `use_action` and you have an antidote pill. Nothing on the curse side has to cooperate: a newly written curse can be removed by it as long as it is listed in that tag.

## Querying: `mxt:has_curse`

The entity condition and the loot condition share the name and the shape (the loot one has an extra `entity` target field). Every field is optional, and **one and the same instance** has to satisfy all of them:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse ID | none | Must be this one definition. |
| `tags` | `#tag[]` | `[]` | This one instance must carry **all** of the listed tags. |
| `stacks` | `{min?, max?}` | none | Stack count window, inclusive on both ends. |
| `remaining_ticks` | `{min?, max?}` | none | Remaining time window, the unit is ticks. |

`tags` wants **all** of them; for "any one of them", combine several `mxt:has_curse` with `mxt:or`.

Nothing written at all means "carries any curse", which combined with `mxt:not` reads as "carries no curse". Either end of a window may be omitted, so one field expresses "at least", "at most" and an exact range. Formulas inside a window are evaluated with the caller's own context.

An instance that never expires counts as **infinite** in `remaining_ticks`, so it satisfies a `min` and never satisfies a `max`.

```json
{"type": "mxt:has_curse", "tags": ["#example:cleanse/poison"], "stacks": {"min": 2}, "remaining_ticks": {"min": 1}}
```

## Items That Carry Curses: `mxt:curse_container`

Any item can carry the `mxt:curse_container` component, declaring **which curses it carries**. Entries have the same shape as `mxt:apply_curse` (`curse`, `stacks`, `duration_ticks`), except that the source is the equipment itself:

```json
give @s minecraft:diamond_chestplate[mxt:curse_container={curses:[{"curse":"example:soul_scorch","stacks":2}]}]
```

One shared reconciliation handles all three moments, and all of them go through the ordinary curse transaction, so the application condition, the stacking and the duration are judged as usual:

- **Equipping applies or joins it**: all six equipment slots (main hand, off hand, head, chest, legs, feet) and the Curios slots count, with `mxt:equipment/<slot>/<item id>` and `mxt:curios_equipment` as their sources. If that curse is **already** held by another source, equipping does not apply it again — it only adds its own source to the ledger, so neither the stacks nor the remaining time are refreshed by it.
- **Unequipping releases only its own share**: taking an item off just releases that item's source, the curse stays while any other source still holds it, and only a release that really empties the ledger removes the instance, under the `explicit` reason, so no definition behaviour runs.
- **It heals itself while carried**: after the curse expires, is cleansed or is removed outright, the carrier gets it again within **at most 20 ticks** as long as the item is still worn. An equipment slot change triggers a reconciliation at once; Curios and the self-healing use the slow 20-tick reconciliation. So `mxt:timed` is enough for "wearing this keeps cursing you" — there is no need to write `mxt:permanent`.

Read that component with the item condition `mxt:curse_container`: `curse` accepts an entry, a `#tag` or an array, and writing none of them means "any curse"; the optional `stacks` is a `{min?, max?}` window, compared against the stack count that entry **is going to apply** (its formula is evaluated with the current context). It asks **what the item has sealed inside it**, which is a different question from the entity condition `mxt:has_curse` (what the holder **already has on them**), so an unequipped piece of armour still answers it.

## Display

The "Curses" line of the character information panel lists only the instances that pass `display_condition`; a hidden one leaves not even a row. That row shows the stack count (`×N`), and the tooltip gives **every source** plus the remaining time.
