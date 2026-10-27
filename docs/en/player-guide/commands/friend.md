---
title: /friend
---

# `/friend`

<div class="cmd-tree">

- `/friend ...`

  Prints the friend command help, each row clickable to fill the command into the chat box (without sending it).

  - `... list`

    Lists the permanent and temporary friend lists; every name in them is clickable and fills in the matching removal command.

  - `... add <player>`

    Adds a **temporary** friend, which is gone after the next login.

  - `... remove <player>`

    Removes a temporary friend; a permanent friend is refused with a pointer to the next command.

  - `... permanent add <player>`

    Adds a **permanent** friend, which is written to the save; a temporary friend is upgraded rather than duplicated.

  - `... permanent remove <player>`

    Removes a permanent friend.

</div>

## The friend list

"Temporary" here means **cleared at the next login**: both a relog and a server restart clear it, while **a respawn does not**. Adding and removing both resolve the player profile, so an offline player works too — type the name and it is added. The details are on [Identification](/en/technical/identification).
