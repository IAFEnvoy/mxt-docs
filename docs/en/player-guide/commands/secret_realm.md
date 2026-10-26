---
title: /secret_realm
---

# `/secret_realm`

The entire secret realm management subtree requires **operator level 2 (gamemaster)**. It is also available as `/mxt secret_realm`; the root alias follows the server's command alias setting.

A definition is a template; an instance is an actual dimension. Instance dimension IDs follow `<definition namespace>:secret_realm/<definition path>/<index>`, starting at `0`. Dimension arguments suggest registered instances, including dormant ones.

| Command | Purpose |
| --- | --- |
| `/secret_realm definitions` | List available secret realm definition IDs. |
| `/secret_realm list` | List instance dimensions, definitions, member limits, owners, preparation and loading states. |
| `/secret_realm info <dimension>` | Show an instance and its saved entrance coordinates. |
| `/secret_realm enter <definition>` | Select a joinable instance or create one under the definition's rules, then enter it. |
| `/secret_realm join <dimension>` | Enter that specific instance without selecting another one. |
| `/secret_realm check <dimension>` | Check the planned arrival using the executing player's size and state, reporting safety and nearby search results. |
| `/secret_realm anchor <dimension> <x> <y> <z>` | Set the instance entrance to the specified safe coordinates. |
| `/secret_realm exit` | Return to the saved entry position, subject to exit conditions. |
| `/secret_realm destroy <dimension>` | Force-end an instance and delete its terrain; `mxt:existing` only clears instance membership and preserves the actual dimension. |

`loaded=false` means the instance is not currently loaded, not that it has been destroyed. `info` only reads registry information. `check` and `anchor` open the target instance, prepare terrain as needed and load the arrival area, without teleporting the player or adding membership.

## Diagnosing Failed Travel

Use `list` to find the instance bound to the entrance portal, then run `check`. The output includes the planned coordinates, the position found, the safety result and the inspection before loading. An unloaded chunk before preparation followed by a safe result means preparation succeeded. When nearby search fails, the reported reason describes the planned position.

Landing checks distinguish missing support, collisions, fluids, hazardous blocks, world bounds, unloaded chunks and oversized entities. Nearby search considers offsets up to 4 blocks along each axis. `check` and `anchor` do not create landing platforms or clear terrain. Actual travel tries to build a dirt platform in empty space when no existing safe position is found; see [Rifts](../rift.md#destinations-and-travel). Flying or gravity-free entities follow different support rules from walking players, so check using the affected player's actual state.

Both `enter` and `join` enforce entry conditions, member limits, membership state and landing safety. `join` does not bypass these rules. If safety checks pass but teleportation still fails, developers should inspect server logs for a refusal by the platform or another mod.

## Adjusting an Instance Entrance

`anchor` coordinates belong to the target instance dimension. Relative coordinates `~` use the command execution position as their origin. This changes only that instance's saved entrance; it does not move structures, published portals or players, or edit the datapack definition. The exact input must be safe; nearby search does not substitute another position.

```text
/secret_realm list
/secret_realm check pack:secret_realm/trial/0
/secret_realm anchor pack:secret_realm/trial/0 9.5 65 9.5
/secret_realm join pack:secret_realm/trial/0
/secret_realm exit
```

These example coordinates require a safe platform in the target dimension. The definition's arrival arrangement also affects individual arrivals. Prepared instances retain their own entrance; editing the datapack entrance does not overwrite it. Use `anchor` to adjust that instance.

See [Rifts](../rift.md) for portal creation, selection and removal, and [secret_realm](../../datapack/json/secret_realm.md) for definition fields.
