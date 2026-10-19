---
title: Attachments
description: Every attachment the mod registers - whether it hangs on an entity, a chunk or a level, what state it holds, which ones save and sync, and how "one per module" is decided.
---

# Attachments

Every piece of state in this mod that **travels with an entity, chunk or level** goes through a NeoForge attachment (`AttachmentType`). There is no "mod-specific key stuffed into entity NBT" anywhere. All 30 are registered in one place, `registry.MxtAttachments`.

Attachments and [data components](/en/technical/data-components) are the same idea on two hosts: a **component hangs on an item stack** and says what that stack is like; an **attachment hangs on an entity, chunk or level** and says what that body or that patch of ground is like right now. Both carry a persistent codec and a network codec, so both save with the world and can sync to the client - but **whether a given attachment syncs is decided per attachment**, as below.

## Three Sync Tiers

Registration goes through three private factories, and which one is used decides whether the attachment syncs and whether it follows the body through death:

| Factory | Saves | Syncs to client | Copies on death | Used by |
| --- | --- | --- | --- | --- |
| `entity` | yes | yes | yes | most entity state |
| `entityWithoutDeathCopy` | yes | yes | **no** | `float_holding_item`, `flight`, `perch` |
| `entityServerOnly` | yes | **no** | yes | `friend`, `trigger_cooldowns` |

Each "no" has its reason. `float_holding_item` holds an **in-progress inventory**, and a copy would conjure a second set of items out of a respawn. `flight` and `perch` describe what is underfoot and who is sitting on whom right now, and that vehicle is gone after a respawn. `friend` and `trigger_cooldowns` do **not** sync because the client has no reader for them - the session half of the friend list is emptied at every login, so a synced copy is stale from the next login onwards, and nothing on the client draws a trigger rule's cooldown.

**Non-entity attachments (chunk and level) have `serialize` only, no `sync`.** They are not "something sent to a client": chunk aura stock and plant rows are server-authoritative, and the level-wide indexes (custom aura areas, secret realm registry, formation index, bound beast index) should never go to a client in the first place.

## Entity Attachments

The fields column lists the JSON key names the codec decodes - that is, the save shape - not the Java field names.

| Attachment id | Holds | What it does | Sync tier |
| --- | --- | --- | --- |
| `mxt:cultivation` | `cultivation_progress`, `realm_stages`, `cultivation`, `cultivating`, `cultivate_started_at`, `next_cultivate_tick`, `cultivate_cooldowns` | Cultivation progress and the current realm, keyed by **cultivation profile**; the method currently running with its clock; and the cooldowns of each method. Progress and realm are stored per profile, so *which profile* is the whole identity and the stored state cannot duplicate what the value already says. | saves + syncs + on death |
| `mxt:minor_stages` | `minor_stage_records` | The **highest minor stage the body has reached in each realm**. The record only ever grows, so an unlock survives a breakthrough even though the progress that reached it restarts. | saves + syncs + on death |
| `mxt:lifespan` | `lifespan_remaining`, `lifespan_total` | The lifespan ledger: how much life is left and the most this body was ever granted in this life. Both numbers are written together by the **one** service that owns the rules, so a half-updated account cannot happen. | saves + syncs + on death |
| `mxt:spirit_identity` | `spirit_roots`, `physiques`, `disabled_spirit_roots`, `disabled_physiques` | Which spirit roots and physiques the body holds, and which of them are **switched off**. The two `disabled_*` sets name things still held, so **held and active are different questions**: ownership reads `spiritRoots()`, every effect reads `activeSpiritRoots()`. | saves + syncs + on death |
| `mxt:technique` | `learned_techniques`, `technique_levels` | Which techniques were learned and how far each has been climbed. The two must live together: the levels of a technique that was given up are state **nothing can read**, so giving one up and dropping its record are the same write. | saves + syncs + on death |
| `mxt:soul_stats` | `karma`, `heart_demon`, `strength`, `sense_range` | Four long-lived soul numbers. **Nothing reads them yet** - only reincarnation writes them, behind the "does the soul survive rebirth" switch - so this is storage reserved for the soul system, not state already in effect. | saves + syncs + on death |
| `mxt:soul` | `active`, `origin`, `created_at`, `manifestation` | The optional **soul-form** state retained after a death transition. A different thing from `soul_stats`: that one holds numbers, this one holds whether the body is currently a soul and where it came from. | saves + syncs + on death |
| `mxt:creature_spirit` | `profile`, `intelligence`, `inner_core`, `profile_levels` | A spirit beast's own profile state (it climbs the `creature_profile` chain, not the player cultivation chain). The levels live here rather than in a shared attachment, so **a profile and a technique that share an id are separate slots and cannot read each other**. | saves + syncs + on death |
| `mxt:resource_holder` | `values`, `audit`, `min_snapshot`, `max_snapshot`, `last_changed_tick` | Server-authoritative current resource values plus their **resolved bound snapshots**. The snapshots sync with the attachment, so the client never has to evaluate a resource formula authoritatively just to draw a bar. | saves + syncs + on death |
| `mxt:element_attachment` | `amounts` | How much of each element has built up on the body: one number per element, no rules. Buildup, the reaction that reads it and the per-tick decay are **three separate things**, which is why this attachment holds no rules of its own. An amount reaching zero drops its key, so "nothing has built up" has exactly one representation. | saves + syncs + on death |
| `mxt:ability_holder` | `sources`, `channelled_ability`, `storage` | Granted abilities are tracked **by source** (so removing one source cannot remove another's), along with the runtime state each granted ability keeps. Revoking the last source drops that state too - **the cooldown excepted**, which keeps running so that putting the item back cannot buy the press again. | saves + syncs + on death |
| `mxt:wheel_layout` | `layout`, `armed` | The configured wheel cells, and which cell the use key would spend while nothing is on screen. `armed` is a bare **number** that deliberately does not name the entry: a number whose entry is gone is still the number that finds it again when it comes back. | saves + syncs + on death |
| `mxt:spirit_burst_cooldowns` | `cooldowns` | Spirit burst cooldowns. This reaches the client **only** so the wheel can draw the remaining fraction, following vanilla item cooldown semantics. | saves + syncs + on death |
| `mxt:curse_holder` | `instances` (containing `stacks`, `applied_at`, `expires_at` and so on) | The curse instances on the body plus the **source ledger** of who keeps each one alive - the same ledger ability grants use, so "removing one source cannot remove another source's curse" means here exactly what it means there. The definition itself is looked up from the curse registry each time rather than copied in. | saves + syncs + on death |
| `mxt:tribulation` | `tribulation`, `timeline`, `cursor`, `state`, `windup` | The tribulation currently running: which definition accepted the attempt, the wind-up left, every beat of the run, and the **cursor** standing on the beat being consumed. The cursor is stored rather than derived, because a branch beat can send the run backwards. | saves + syncs + on death |
| `mxt:contract` | `contract_type`, `bound_at`, `recalled`, `recall_at`, `behavior` | One creature's own contract record, and the **only copy** of it (the owner-side bound beast list is an index, not a second record). The owner is not here: who owns a contracted creature is answered by the creature's own `OwnableEntity`, and the framework keeps no owner of its own. | saves + syncs + on death |
| `mxt:secret_realm_travel` | `realm`, `origin_dimension`, `origin_x/y/z`, `origin_yaw/pitch` | The **return point** kept while a player is inside a temporary secret realm, used to send them back out. | saves + syncs + on death |
| `mxt:pill_toxicity` | `toxicity`, `decay_remainder` | Accumulated pill toxicity. `decay_remainder` is the unfinished 20-tick decay period - **it is not toxicity** - and it only advances while a positive decay rate is configured. | saves + syncs + on death |
| `mxt:pill_usage` | `entries` (containing `uses`, `cooldown_until`) | How many times each pill binding has been used and when its cooldown ends, keyed by **the binding rather than the carrier item**. Counts are not cleared by death, a dimension change or a logout. | saves + syncs + on death |
| `mxt:float_holding_item` | `item` | The one stack **temporarily borrowed** by a server-side item consumer (mid-way through aura fuel handling, for instance). | saves + syncs, **not on death** |
| `mxt:flight` | `active`, `archetype`, `vehicle`, `vehicle_uuid`, `started_at`, `previous_flight`, `previous_flying`, `previous_flying_speed` | The saved flight state: what is stored is the flight **attribute** value rather than the deprecated `mayfly` flag (leave the attribute raised and the player keeps flying after dismounting), plus the previous values needed to restore it. | saves + syncs, **not on death** |
| `mxt:perch` | `offset` | Where the creature on someone's shoulder sits on its vehicle. The offset is **already resolved** (naming a side belongs to whoever writes the record), and y counts down from the vehicle's current top, so a vehicle that changes height with its pose takes the perched creature along. | saves + syncs, **not on death** |
| `mxt:friend` | `permanent`, `temporary` | Which players this one accepts as its own. Both lists save, and the temporary half is emptied at login - **saving is exactly what** keeps a session friend alive through a death. Every match is made on the id; the name is there so the list stays readable offline. | saves, **no sync** |
| `mxt:trigger_cooldowns` | `cooldowns` | The tick each trigger rule of this holder may next fire at, keyed by the rule's own registry id. | saves, **no sync** |

## Chunk and Level Attachments

These six have no "entity" scope. Registration does not declare a scope at all - it is decided by which level of `getData` the caller reads them from:

| Attachment id | Hangs on | Holds | What it does |
| --- | --- | --- | --- |
| `mxt:aura_chunk` | **chunk** | `template`, `block_aura_sections`, `aura` | This chunk's **authoritative aura stock**; `aura` is keyed by sub-chunk like `block_aura_sections`, so every 16-block section has its own amount, ceiling and regeneration. Within one section each value is independently keyed by its own resource, and there is deliberately **no** aggregate aura pool. |
| `mxt:herb_chunk` | **chunk** | `plants` (one row per packed position, with `position`, `age`, `clock`) | One row per spirit herb in this patch of ground. Both numbers are needed: the age cannot be re-derived from the clock alone (growth depends on the age a period starts from), and storing it is what makes a read idempotent. A negative clock is a **naturally generated plant nobody has touched**, turned into a real row on the first read. |
| `mxt:aura_world` | **level** | custom aura areas | Aura areas added **by hand** from a datapack or script. Formation areas are derived live and are **deliberately not stored** here. |
| `mxt:formation_world` | **level** | active formations, indexed by their validated controller position | The index of formations running in one level. It holds **live** `FormationInstance` objects, so a caller that reaches one through this attachment is mutating the stored state in place. |
| `mxt:secret_realm_world` | **level** | claimed secret realms | Kept on the **overworld**, so a claimed secret realm survives a restart together with the region files of its own dimension. |
| `mxt:bound_beasts` | **level (overworld)** | the bound beast index | One per server. **What decides anything lives on the creature** (`mxt:contract`); this list exists so a limit check, a listing or a release does not have to walk loaded levels, and so an offline owner still loses the row when their beast dies. |

Both `aura_chunk` and `herb_chunk` are stored as a **list of rows rather than a map keyed by packed position**: `formation_world` hit that trap - a packed-position key made saving a populated index fail outright.

## Dirty Flags and Sync

Entity attachments keep syncing to the client through a dedicated dirty-flag chain rather than resending everything every tick:

1. The attachment implements `ChangeTrackable`; `markDirty()` only sets a boolean and `checkDirty()` **reads and clears it**.
2. On every tick's `EntityTickEvent.Post`, `MxtAttachments.flushDirtyAttachments` walks **every synced entity attachment** and calls `entity.syncData(type)` for each whose `checkDirty()` is true.
3. The client decides nothing for itself: it merely replaces its copy when the packet arrives.

**State nested inside an attachment has to be merged up by its host.** Some attachments contain things that go dirty on their own (the level records inside `technique`, for instance) and those **hold no attachment reference**, so the flag does not bubble up by itself. The host overrides `checkDirty()` to read its inner state first:

```java
@Override
public boolean checkDirty() {
    if (this.techniqueLevels.checkDirty()) this.markDirty();
    return super.checkDirty();
}
```

That read-and-clear semantics means the walk must not miss a level - one missed inner holder is one thing that never syncs again. The two non-synced entity attachments (`friend`, `trigger_cooldowns`) are not in the synced list at all, so nobody reads their flags.

## Why One Per Module

The rule for splitting attachments: **one attachment per module**. The criterion is **whether the fields belong to one thing**, not how many modules read them:

- **Different owners.** Cultivation progress belongs to a cultivation profile and a beast's levels belong to a creature profile; putting both in one "progress" attachment would let a profile and a technique sharing an id read each other.
- **Different lifecycles.** Which parts are cleared on death has a different answer per module.
- **Separate reincarnation switches.** See below.

So `resource_holder` is read by two dozen modules and is still **not** split - what it holds is one thing, this body's resource account. Conversely, the old single `spirit_stats` held lifespan, minor stage records, soul numbers and techniques/roots/physiques at once: four modules with four independent reincarnation switches, so it became `lifespan` / `minor_stages` / `soul_stats` / `technique` / `spirit_identity`.

**The concrete payoff shows up in reincarnation.** `LifeSpanService.reincarnate` resets state through a set of server config switches, and after the split **one switch can only reach its own module's attachment**; before it, any switch could clear another module's state. The switches are `resetCultivation`, `clearMinorStages`, `cancelTribulation`, `clearResources`, `keepSpiritRoots`, `keepTechniques` and `keepSoul`, defaulting to on, on, on, off, keep, keep and keep.

**Fields that belong to one thing stay together**, even when another module reads them: `technique` keeps "which ones were learned" and "how far each has climbed" in one attachment, because giving up a technique and dropping its levels have to be the same write - split them and you eventually get an orphan record nothing can read.

## See Also

- [Data Components](/en/technical/data-components) - the other half of the "where does state live" question: the things that hang on an item stack.
- [Data Loading](/en/technical/data-loading) - where an attachment's persistent and network codecs are registered, and what it means that **attachments are outside `/reload`**.
- [Java API](/en/java/api) - the service entry points that read attachments, and the difference between `getExistingData` and `getData`.
