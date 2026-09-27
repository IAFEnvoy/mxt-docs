---
title: /lifespan
---

# `/lifespan`

`/lifespan` (= `/mxt lifespan`) reads and rewrites every body's **lifespan ledger**: how many ticks of life are left and the ceiling this life was granted. Where a ledger comes from, how it is settled and what running out does are on [Lifespan](/en/player-guide/lifespan).

| Command | Effect |
| --- | --- |
| `/mxt lifespan` / `/mxt lifespan get` (= `/lifespan`, `/lifespan get`) | Reads the caller's own ledger. |
| `/mxt lifespan get <targets>` | Prints every target's ledger (needs the `gamemaster` permission); a body that was never accounted for reports "not accounted for". |
| `/mxt lifespan set <targets> <ticks>` | Rewrites both numbers to `ticks` (needs the `gamemaster` permission); `ticks` may not be negative. |
| `/mxt lifespan add <targets> <ticks>` | Adjusts the ledger (needs the `gamemaster` permission): a positive amount raises both the remaining life and its ceiling, while **a negative amount only lowers what is left and never the ceiling**. |
| `/mxt lifespan reincarnate <targets>` | Makes every target be **reborn** on the spot (needs the `gamemaster` permission): it runs the reset list on the **Server Config → Reincarnation** tab and reopens the ledger from **Server Config → Lifespan → Base lifespan**. |

## Notes

- The numbers are ticks, read as years through the rate on **Server Config → Lifespan → Ticks per year** (`1` shows ticks).
- "Not accounted for" and "spent" are two different answers: the first is a body that never had a ledger (its formula variables read `NaN`), the second is one whose ledger sits at `0`. `get` only says "not accounted for" for the first; `set` and `add` can both open the first and extend the second.
- Every target must be a living entity: one that is not is named in a failure line and skipped, while the remaining targets are still processed.
- Writes are **unaffected by the lifespan master switch**, which only decides whether time passes.
- `reincarnate` runs the very same reset list as **On expiry** set to `reincarnate` (the switches on the Reincarnation tab), and then reopens the ledger from **Server Config → Lifespan → Base lifespan**: with that at `0` (the default) the account is closed and the body reads as "not accounted for" again.
- With **Server Config → Reincarnation → Die first** on, the body genuinely dies first — through the normal damage and death path, so items drop, the death message is filled in and a respawn point is set — and only then does the reset list run.
- A rebirth fires **no `lifespanEnd` event at all** — that one belongs to expiry only — it fires `lifespanRebirth`'s `Pre` / `Post` instead, so a listener can refuse it (the details are on [MxtEvents](/en/kubejs/api/events)): when `Pre` is cancelled, **that target is reported as a failure**, with the words "a listener refused it" instead of a success line, while **the other targets are still processed**.
- Like the writes above, `reincarnate` is **unaffected by the lifespan master switch**: it is a verdict handed down on the spot rather than time passing, so it runs with the switch off too.
- A target that is a player is **told in chat** ("You have been remade as a mortal; your former foundation and cultivation are gone"): the command's own feedback only reaches whoever ran it, and a body that just lost everything it was should not be left in the dark.

The top-level `/lifespan` alias is controlled by **Server Config → Command Aliases → /lifespan** (on by default); switching it off leaves `/mxt lifespan` fully usable.

## Related

- [Lifespan](/en/player-guide/lifespan) — the ledger, the settlement rules and the server config.
