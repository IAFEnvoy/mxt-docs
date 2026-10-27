---
title: /secret_realm
---

# `/secret_realm`

The entire secret realm management subtree requires **operator level 2 (gamemaster)**. It is also available as `/mxt secret_realm`; the root alias follows the server's command alias setting.

<div class="cmd-tree">

- `/secret_realm ...`

  - `... definitions`

    Lists the available secret realm definition IDs.

  - `... list`

    Lists the instance dimensions, their definitions, member limits, owners, and preparation and loading states.

  - `... info <dimension>`

    Shows one instance and the entrance coordinates it has saved.

  - `... enter <definition>`

    Picks a joinable instance of that definition, or creates one under the definition's rules and enters it.

  - `... join <dimension>`

    Enters that specific instance without looking for another one.

  - `... check <dimension>`

    Checks the planned arrival using the executing player's size and state, and reports the safety verdict and the nearby search.

  - `... anchor <dimension> <x> <y> <z>`

    Sets the instance entrance to those safe coordinates.

  - `... exit`

    Returns to the position saved when the secret realm was entered, still subject to the exit conditions.

  - `... destroy <dimension>`

    Force-ends the instance and deletes its terrain; the `mxt:existing` kind only clears instance membership and keeps the real dimension.

</div>

A definition is a template; an instance is an actual dimension. Instance dimension IDs follow `<definition namespace>:secret_realm/<definition path>/<index>`, starting at `0`. Dimension arguments suggest registered instances, including dormant ones.

`loaded=false` means the instance is not currently loaded, not that it has been destroyed. `info` only reads the registered data; `check` and `anchor` open the target instance, prepare terrain as needed and load the arrival area, without teleporting the player or adding membership.

## Diagnosing Failed Travel

Use `list` to find the instance bound to the entrance portal, then run `check`. The output includes the planned coordinates, the position actually found, the safety verdict and the inspection made before loading. An unloaded chunk before preparation followed by a safe result means preparation succeeded. When the nearby search fails, the reported reason describes the planned position.

Landing checks distinguish missing support, collisions, fluids, hazardous blocks, world bounds, unloaded chunks and oversized entities. The nearby search looks at offsets up to 4 blocks along each axis. `check` and `anchor` neither create a landing platform nor clear terrain. Actual travel tries to build a dirt platform in empty space when no existing safe position is found; see [Rifts](../rift.md#destinations-and-travel). Flying or gravity-free entities follow different support rules from walking players, so check with the state of the player who actually had the problem.

Both `enter` and `join` enforce the entry conditions, the member limit, the membership state and landing safety; `join` bypasses none of those rules. If the safety checks pass and the teleport still fails, a developer has to look at the server log for a platform refusal or another mod refusing the teleport.

## Adjusting an Instance Entrance

The coordinates `anchor` takes belong to the target instance dimension, and `~` is relative to the position the command runs at. It changes only the entrance this one instance saved; it moves no structure, no published portal and no player, and it edits no datapack definition. The coordinates themselves have to be safe: the nearby search never substitutes another position for the input.

```text
/secret_realm list
/secret_realm check pack:secret_realm/trial/0
/secret_realm anchor pack:secret_realm/trial/0 9.5 65 9.5
/secret_realm join pack:secret_realm/trial/0
/secret_realm exit
```

Those example coordinates only apply when the target dimension really has a safe platform. The definition's arrival arrangement also affects how individual arrivals are assigned. A prepared instance keeps its own entrance, so editing the datapack entrance does not overwrite it; use `anchor` to fix that instance.

Portal creation, portal selection and portal removal are on [Rifts](../rift.md), and the definition fields are on [secret_realm](../../datapack/json/secret_realm.md).
