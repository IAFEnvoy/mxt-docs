---
title: /flight
---

# `/flight`

| Command | Effect |
|---|---|
| `/flight fill` (= `/mxt flight fill`) | Fills every free seat of the **mount the player is flying right now** with zombies (needs the `gamemaster` permission). The zombies have **no AI and never despawn**, and wear an **unbreakable iron helmet** (vanilla's rule: anything on the head stops the daylight burn, so daytime cannot burn them away); the mount places them where the definition's `seat_offsets` say, so they are the reference for **tuning seat offsets in game**: change the definition, `/reload`, and they move on the spot. They disappear with the flight (landing, logging out, hitting the ground). Not flying, or every seat taken, is reported instead. |
