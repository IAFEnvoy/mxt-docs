---
title: /realm
---

# `/realm`

`/realm` manages the **linear realm chain** (`mxt:realm_stage`). **A realm stage and a secret realm are two different things**: a stage is one rung of the cultivation chain of a `resource`, while a secret realm (`mxt:secret_realm`) is an instance dimension created on demand, managed through [`/mxt secret_realm`](/en/player-guide/commands/mxt#mxt-secret-realm).

| Command | Effect |
| --- | --- |
| `/realm set <realm>` (= `/mxt realm set …`) | Sets **your own** current stage to one rung of the chain and resets that chain's progress to zero (needs the `gamemaster` permission). A stage that is not part of a currently valid cultivation chain is refused with the reason. |
| `/realm chain <realm>` (= `/mxt realm chain …`) | Prints the **whole realm chain** that stage is on; no permission needed. The stages **before** it are grey, the stage itself is green and the stages **after** it are white. The header names the chain's identity, which is the ID of the `mxt:aura` entry the chain belongs to; a disabled stage, or one on no usable chain, reports that no usable realm chain contains it. |

## What a realm chain is

A realm chain belongs to an **aura definition**: every [realm_stage](/en/datapack/json/realm_stage) points back at one [aura](/en/datapack/json/aura) with its `aura` field, that definition's `first_realm` is the entrance of the chain, and the stages are linked by `next_realm` into a line that only moves forward — one chain per definition, and one entity may hold several chains at once. The full rules are on [Define Aura and Realms](/en/tutorial/define-aura-and-realms).

`chain` reads the definitions rather than who currently holds which stage, so what it answers is "what comes before this rung, and what comes after it" — the quickest way to check a `next_realm` for typos. It only walks the stages that are **currently enabled**: a stage disabled by `#mxt:disabled` breaks the chain there (the server refuses to index such a chain for the same reason).

`set` is an administrative entry point for tuning data: it does not run the cultivation or breakthrough checks, it only asks whether the stage is on a currently valid chain. Neither command needs the executor to hold anything, and `chain` is a pure query.

The top-level `/realm` alias is controlled by the **Command Aliases** tab of the server configuration (the entry is named `realm`, and it defaults to on); switching it off leaves `/mxt realm` fully usable.
