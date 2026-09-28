---
title: Lifespan
description: How the lifespan ledger is written, how the server settles it, what running out does, and the panel row, command and server config behind it.
---

# Lifespan

**A lifespan is a ledger kept on each body**, holding two numbers: how many ticks of life are left and the ceiling this life was granted, both in ticks (24000 ticks is one game day) and both stored in the `spirit_stats` attachment. **Every number in the ledger comes from a data pack, a command or the server config** — the mod hard-codes no world-view value of its own — and the server config decides how the line runs. The whole system is **off by default**, so upgrading changes nothing.

## Where the numbers come from

| Source | When it writes |
| --- | --- |
| `lifespan` on a `realm_stage` | Once, on the breakthrough that reaches that stage, as an increment; a literal constant must be finite and non-negative or loading is refused. |
| The `mxt:modify_lifespan` entity action | `add` (negative amounts take life away) or `set` (rewrites both numbers at once). |
| The `mxt:reincarnate` entity action | Makes a body be reborn on the spot: it runs the very same reset list as **On expiry** set to `reincarnate` and reopens the ledger from **Base lifespan** (`0` means not accounting for the body at all); it writes no number of its own, it only reopens the account. The details belong to the [entity action types](/en/datapack/types/action/entity_action_types). |
| The command `/mxt lifespan set` / `add` / `reincarnate` | An administrator rewrites or adjusts it directly; `reincarnate` makes a body be reborn on the spot and reopens the ledger from the **Base lifespan** setting. |
| KubeJS `MxtLifespan` | A script reads or writes it. |
| **Server Config → Lifespan → Base lifespan** | With the master switch on and that value above `0`, this is what a body is seeded with on first login, or on the first settlement of a body that **holds a ledger nobody ever granted life to**; it is also the starting point when `add` opens a brand-new ledger. Reincarnation recomputes to it too. |

A body with **no ledger** reads as "not accounted for": the `lifespan_remaining` / `lifespan_total` formula variables read `NaN` and `/mxt lifespan get` says so outright. **Writes are unaffected by the master switch**, which only decides whether time passes.

## How the server settles it

- One settlement every **Settle interval** (20 ticks by default) spends **Age per settle** (20 ticks by default) of life; the ratio between the two is the rate, and setting the age to `0` settles without ageing at all.
- Every entity in a level shares one settlement beat (taken modulo the level's game time), and each body spends from its own remaining ticks. The countdown runs on entity ticks, so **it does not pass while offline and logging back in never back-pays**.
- Creative and spectator bodies are outside settlement — spectating is what running out leaves a player as, which is also what keeps one death from being replayed.
- The moment the remaining life falls to the **Warning threshold** fraction (0.1 by default) of the ceiling, the action bar warns once. Only the **crossing** warns, not every settlement after it.
- With the **master switch off**, the whole line stands still: no settlement, no seeding, no expiry, no warning and no row on the character panel; turning it on resumes the ledgers from that moment and never back-pays the time it was off.

## After it runs out

**On expiry** has three settings:

| Value | What happens |
| --- | --- |
| `death` (the default) | The player is turned into a **spectator**: nothing drops, no death event fires and no respawn point is set, and the ledger keeps its `0` (which is not "unlimited" — grant life again and it carries on from there). A non-player creature dies of the `mxt:lifespan` damage type instead, whose death message key is `death.attack.mxt.lifespan`; that type is in the `mxt:no_bonus` tag, so it takes no part in bonus settlement (see [The damage system](/en/technical/damage)). |
| `reincarnate` | The body is washed back to a mortal on the spot; what it keeps is on the Reincarnation tab below. The very same reset is also reachable on demand: the `/mxt lifespan reincarnate` command, `MxtLifespan.reincarnate` and the `mxt:reincarnate` data pack action run it. |
| `none` | Nothing is done at all: only the `lifespanEnd` event fires and content decides. |

Before any of that, `Pre` of `lifespanEnd` fires and **can be cancelled**: a listener that writes a positive lifespan inside the event (through the service or straight onto the attachment) has extended the life and the countdown carries on, while a listener that writes nothing only refuses that one end — the account closes (`remaining = -1`, `total = 0`) instead of being retried forever. `Post` carries `outcome()`, naming the branch the base ran. The details are on [MxtEvents](/en/kubejs/api/events).

## Character Information Panel

The character information panel (`Z` by default) gains a **Lifespan** row: the remaining life and the ceiling, read as years through **Ticks per year**, or as ticks when that setting is `1`; a body with no ledger, or one whose ledger has been closed (a negative remainder), shows "Unlimited". With the **master switch off the whole row is not drawn**.

## Command

`/mxt lifespan` (with the top-level alias `/lifespan`, switched by **Server Config → Command Aliases → /lifespan**) reads and rewrites the ledger: `get` prints every target's ledger, `set` rewrites both numbers, `add` adjusts them (a negative amount takes life away and only lowers what is left, never the ceiling) and `reincarnate` makes a target be reborn on the spot (it runs the reset list on the Reincarnation tab and reopens the ledger from **Base lifespan**, where `0` means not accounting for the body at all). The write nodes `set` / `add` and `reincarnate`, and `get` when it names other targets, need the `gamemaster` permission. Each subcommand is described on [`/lifespan`](/en/player-guide/commands/lifespan).

## Server Config

### Lifespan

| Setting | Default | Effect |
| --- | --- | --- |
| **Server Config → Lifespan → Enable lifespan** | off | The master switch, described under "How the server settles it" above. |
| **Server Config → Lifespan → Base lifespan** | 0 | The ticks granted on first login, or on the first settlement of a body that **holds a ledger nobody ever granted life to**; `0` disables seeding. Range `0..1000000000000`. |
| **Server Config → Lifespan → Settle interval** | 20 | How many ticks pass between two settlements. Range `1..72000`. |
| **Server Config → Lifespan → Age per settle** | 20 | How many ticks of life each settlement spends; its ratio to the settle interval is the rate (20/20 is normal, 20/40 half speed, 40/20 double), and `0` settles without ageing. Range `0..72000`. |
| **Server Config → Lifespan → On expiry** | death | The values are `death` / `reincarnate` / `none`, described under "After it runs out". |
| **Server Config → Lifespan → Warning threshold** | 0.1 | The fraction of the ceiling at which the action bar warns once — only on the crossing; `0` turns it off, and `1` never fires either, because the remaining life is never above its own ceiling. Range `0.0..1.0`. |
| **Server Config → Lifespan → Ticks per year** | 24000 | The divisor the character panel and the warning use to read ticks as years; `1` shows ticks. Range `1..1000000`. |

### Reincarnation

With **On expiry** set to `reincarnate`, these switches decide what the rebirth keeps.

| Setting | Default | Effect |
| --- | --- | --- |
| **Server Config → Reincarnation → Die first** | off | On: the body goes through a real death (items drop, the death message is filled in, a respawn point is set) before it is washed back to a mortal. |
| **Server Config → Reincarnation → Reset realm and progress** | on | Clears realm stages, cultivation progress, sitting state and sitting cooldowns, so the body is a mortal again and may break through the first stage afresh; the passive attributes and minor-stage abilities those realms granted are taken back with them. |
| **Server Config → Reincarnation → Clear minor stage records** | on | Clears the record of how far the body ever got inside each realm. Left in place, content gating on a stage count would keep treating the threshold as already reached after a rebirth. |
| **Server Config → Reincarnation → Cancel a running tribulation** | on | Drops a tribulation in progress without its success or its failure action. |
| **Server Config → Reincarnation → Clear resource values** | off | Empties every resource value (each is re-initialized from its definition on the next read). The base leaves resources alone by default, because which value counts as cultivation progress is a data pack's decision. |
| **Server Config → Reincarnation → Keep spirit roots and physiques** | on | Keeps spirit roots, physiques and their enabled/disabled state; off clears them too. |
| **Server Config → Reincarnation → Keep techniques** | on | Keeps learned techniques and their progression levels — the memory stays while the foundation is rebuilt; off clears them too. |
| **Server Config → Reincarnation → Keep the four soul values** | on | Keeps karma, heart demon, soul strength and soul sense range; off returns all four to zero. |

## Related

- Fields: [`lifespan` on realm_stage](/en/datapack/json/realm_stage), [`mxt:modify_lifespan` / `mxt:reincarnate`](/en/datapack/types/action/entity_action_types) and the [`lifespan_remaining` / `lifespan_total`](/en/datapack/types/formula_variables) formula variables.
- Script entry point: [MxtLifespan](/en/kubejs/api/lifespan) (it reads and writes the ledger and can make a body be reborn); the callback when a life runs out: `lifespanEnd` in [MxtEvents](/en/kubejs/api/events).
- The command: [/lifespan](/en/player-guide/commands/lifespan).
