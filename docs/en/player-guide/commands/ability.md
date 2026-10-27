---
title: /ability
---

# `/ability`

Casts, lists, grants and revokes abilities. Every node also exists as `/mxt ability …`.

<div class="cmd-tree">

- `/ability ...`

  - `... cast <id>`

    Forces one cast of an ability.

  - `... list [<target>]`

    Lists the abilities a holder carries and the sources still keeping them granted; without a target it looks at you.

  - `... grant <targets> <ability>`

    Grants the ability under the command's own source, `mxt:command`.

  - `... revoke <targets> <ability>`

    Drops only the `mxt:command` source.

</div>

`cast`, `grant` and `revoke` need the `gamemaster` permission, `list` needs none, and `/ability` on its own does nothing.

## cast

**Any ability type goes through one ordinary cast** (`AbilityService.use`, with the condition, costs, `cast_time`, cooldown and charges all as usual), even a type that never enters the wheel pool (a non-pressable one included).

An ability with `cast_time > 0` does not count as a failure: an accepted cast (the deadline is registered, nothing has landed yet) reports success, and only a real refusal reports failure, naming the reason.

## list

It reads the attachment rather than the registry, so an ability whose definition is no longer in the current pack is still listed — it is still held, and revoking it by name is still what takes it off.

## grant, revoke

Both report each target separately. `grant` fails on a target that already holds the ability from that source; `revoke` drops only the `mxt:command` source, so nothing happens while another source still holds it and that target is reported as a failure.
