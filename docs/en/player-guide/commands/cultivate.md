---
title: /cultivate
---

# `/cultivate`

`/cultivate` covers **the cultivation session that is running**: seeing what you are cultivating right now, or naming one [method](../../datapack/json/cultivation.md) to **start it right away**. One node only reads; the other needs the `gamemaster` permission.

| Command | Effect |
|---|---|
| `/cultivate status` (= `/mxt cultivate status`) | Reports the current cultivation state: the method running, the progress stored per aura, and the next settlement tick. |
| `/cultivate select <action>` (= `/mxt cultivate select …`) | Names one method (an entry of `mxt:cultivation`) and starts it right away (needs the `gamemaster` permission). |

## `/cultivate status`

One line: the method running (or "none"), the **cultivation progress**, and the next settlement tick. Progress is stored **per aura**, so there is one item per chain being climbed, written as `aura=value` — with two auras cultivated by the same body at once, this shows at a glance who has accumulated what.

What it reads is the record of the session that is actually running, not "which method `priority` would pick" — picking happens at the moment you sit down, see [Cultivation](../../datapack/json/cultivation.md). To see what was picked, sit down and read this line.

## `/cultivate select`

Names one method, **stops the one running first**, and starts this one immediately. The only thing it skips is `priority`: whether that method should run right now is still decided by its own conditions (`start_condition`, `cultivate_condition`, and the aura-side `start_cultivate_conditions`), and a pick that does not apply is refused — **the running session is left alone and is not stopped**.

It covers this one start only. **It is never persisted and never changes what the next press of the cultivation key picks**: afterwards the key again picks by "applies + `priority`", see [Cultivation](../../datapack/json/cultivation.md). So it is an operator's way to tune data, not a switch that locks a body onto one method.

When it is refused, the chat line reports that method's own failure reason (the same set of text as the on-screen line), so "why it will not start" comes with the answer.

## Top-level alias

`/cultivate` is controlled by the server configuration's **Command Aliases** tab (entry name `cultivate`, on by default); switching it off leaves `/mxt cultivate` working.

## Permissions

`/cultivate select` needs the `gamemaster` permission; `/cultivate status` does not, but it requires an executing player, since it reads that player's own cultivation record.
