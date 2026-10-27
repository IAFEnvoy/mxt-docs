---
title: /resource
---

# `/resource`

`/resource` covers the **value accounts** (`mxt:resource`): reading or rewriting one of your own values, and seeing what the [resource bars](../../datapack/json/resource.md) that value declares would currently compute. **Writing needs the `gamemaster` permission; reading does not.**

<div class="cmd-tree">

- `/resource ...`

  With no arguments, lists **every resource bar**.

  - `... <id>`

    Reads the current value of one of your own accounts.

  - `... <id> bar [index]`

    Looks only at the bars that value declares, optionally narrowed to one of them by `index`.

  - `... <id> set <value>`

    Rewrites your own value outright (needs the `gamemaster` permission).

</div>

**Reading a value and listing bars are one command**: both ask about the same account, so no arguments means "list them all", naming an `id` reads it, and one more word, `bar`, shows its bars.

## bar

A resource bar is **declared in a definition** (the value's own `bars` array); it says where the bar is drawn, what it looks like, which context supplies its numbers and when it is drawn at all. This command prints everything it computes at that moment:

```
/resource
/resource example:qi bar
/resource example:qi bar 0
```

Each bar is one line: the value's ID and its index in `bars`, the display name the context gives it, the context ID, the current value, the minimum, the maximum, the **untruncated percentage**, the anchor and the order. The maximum is the `maximum` written in the definition, falling back to the one the context computes; the percentage is `(current − minimum) / (maximum − minimum)`, so it may exceed 100 or go negative and the command **does not clamp it** — that is exactly its purpose: checking why a bar draws full or empty.

When a context cannot produce values, that bar reports that it is currently unavailable instead of being silently skipped. The two concentration contexts read an aura pool, so a value with **no matching aura** is what produces that line.

## Relation to the HUD

This command prints the **values themselves**, not the pixels drawn on screen. The bars on screen are HUD elements (`resource_bars.left`, `resource_bars.right`, the target and boss overlays), whose toggles, positions and scaling live in [HUD and Panels](../hud.md) and `/hud`. Both read the same definitions and the same contexts, so what the command prints and what a bar shows should agree; when they do not, first check whether a [visibility condition](../../datapack/json/resource.md) is hiding that bar, or whether its anchor has been dragged off the window.

## Top-level alias

`/resource` is controlled by the server configuration's **Command Aliases** tab (entry name `resource`, on by default); switching it off leaves `/mxt resource` working.

## Permissions

`/resource <id> set` needs the `gamemaster` permission; the other nodes do not. `set` **rewrites the value outright**: it does not clamp to the bounds and does not ask any condition — it exists so an operator can tune data, and is not a player action.
