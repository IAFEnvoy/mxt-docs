---
title: Formation (formation)
description: The structure, radius, upkeep, lifecycle hooks and function modules of one formation.
aside: false
---

# Formation (formation) {#formation}

File location: `data/<namespace>/mxt/formation/<path>.json`

A `formation` defines one array: its structure, radius, resource costs, lifecycle behaviour, and **what it does** (the function modules in `actions`). A running array can also provide a temporary aura override and an aura maximum bonus.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `formation.mxt.<namespace>.<path>` | Optional display name. When omitted, the default key in the previous column is used. |
| `description` | Text Component | `formation.mxt.<namespace>.<path>.description` | Optional description. When omitted, the default key in the previous column is used; it is stored and read today, but nothing draws it yet. |
| `structure_template` | Structure template ID | see below | A vanilla structure template; the controller is the template's origin. One of the two structure fields — with `structure_check: "structure"` **exactly one** of them has to be written. |
| `structure_check` | `structure` / `always` | `structure` | Whether the structure is checked when the array is raised. `always` means **this array can be raised anywhere**, and then neither `structure_template` nor `structure` is read — writing one is silently ignored (the same rule as an unknown key). |
| `structure` | Array of `{ "offset": [...], "state": ... }` | `[]` | An inline structure; the controller is the origin of the offsets. One of the two structure fields. |
| `radius` | `NumberProvider` | **required** | The array's radius of effect. |
| `activation_costs` | Array, entries on [`Cost`](../types/shared_data_types.md#cost) | `[]` | Paid on activation out of the **activator's** own account, all or nothing as one array. |
| `maintenance_costs` | Array, entries on [`Cost`](../types/shared_data_types.md#cost) | `[]` | Paid once per maintenance period; **the aura supplied by blocks inside the array offsets it first, and the owner pays the shortfall**, and the array fails when the payment cannot be made. `mxt:item` and `mxt:js` can never be paid here. |
| `storage` | Storage declaration | none (disabled) | The array's own store: `capacity` (a map from aura ID to a number, **required**) says how much of each aura it may hold. It stores the surplus its own ley line supplies, and the paying order becomes ley line → store → owner. A generic field, so any array may write it. |
| `actions` | Array | `[]` | **What this array does**: the list of function modules, see [Formation modules](#formation-modules). |
| `spare_friends` | boolean | `false` | The **friend-or-foe switch**: whether the per-entity work reaches everyone inside the covered range, or goes through a friend-or-foe decision first (friends, and anything it cannot identify, are then unaffected). It only picks "everyone" or "identified", and **does not mean the array is an attacking one** — that is what `actions` says, see "Friend or foe". |
| `activate_action` | Block Action | `mxt:no_op` | The activation block behaviour. |
| `tick_action` | Block Action | `mxt:no_op` | The periodic block behaviour, with a **Level** context. |
| `deactivate_action` | Block Action | `mxt:no_op` | The removal block behaviour, with a **Level** context. |
| `entity_tick_action` | Entity Action | `mxt:no_op` | Run for **every** entity inside the radius each period. |
| `entity_enter_action` | Entity Action | `mxt:no_op` | Run when an entity enters the radius. |
| `entity_exit_action` | Entity Action | `mxt:no_op` | Run when an entity leaves the radius, or when the array is dismantled. |

> **Structure size is not bound by the structure block's 48×48×48 limit.** The two vanilla axis constants are only a clamp applied when the structure block reads its own NBT: that is an **editor limit**, not a format or array limit. The underlying structure template format reads `size` with no ceiling, a structure block in LOAD mode adopts the template's size as it is, and `/place template` checks no size either. So a hand selection made with the structure block cannot exceed 48³, while an `.nbt` produced by an external tool can be referenced by an array without trouble. What an array reaches is decided by `radius`, independently of the size of the structure's bounding box.

## Formation modules (`actions`) {#formation-modules}

`actions` answers "what this array **does**". It is a list of modules; each entry picks one kind of function with `type` and carries only the fields it needs — structure, radius, costs and the lifecycle hooks stay at the top level, while the parameters of a function go inside the module.

```json
{
  "structure": [ { "offset": [0, 0, 0], "state": "minecraft:gold_block" } ],
  "radius": 12,
  "activation_costs": [ { "id": "mxt:spirit_power", "amount": 100 } ],
  "actions": [
    { "type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt" },
    { "type": "mxt:protection", "spare_friends": true }
  ]
}
```

Rules:

- **The same type may appear more than once** and the list is not merged — two attack modules with different numbers are two strikes.
- **Modules and the generic hooks stack**: each period **runs the modules first and `entity_tick_action` after them**, so a custom hook reads the state the modules left behind. A module that acts on the array itself (currently only `mxt:range_display`) works the same way and runs before `tick_action`.
- **A module only runs for the entities the array covers**, and who is covered is decided by the top-level `spare_friends`: write it and the generic hooks and every module act on non-friends only; leave it out and everything inside the radius is covered.
- **A misspelled `type` fails the load** rather than degrading to "does nothing" — nearly every module field is optional, so a silent fallback would turn a typo into an array that just stands there.
- The built-ins are `mxt:attack`, `mxt:buff`, `mxt:protection`, `mxt:range_display`, and `mxt:none` (an empty module, and also the default entry of the dispatch table).

### `mxt:attack`: attacking

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `0` | The damage dealt to every affected entity each period. |
| `damage_type` | damage type | none | The damage type; without it the vanilla "the owner hit it" reading applies. |
| `attribute_to_owner` | boolean | `true` | Credits the **first owner** (the head of the list, the one who raised the array) as the attacker. **This decides kill credit, mob aggro, and every condition that reads the attacker**; set it to `false` for an unowned, "environmental" hit. |
| `effects` | Array | `[]` | The status effects applied each period; the fields are exactly those of `mxt:apply_effect` (`effect` / `duration_ticks` / `amplifier`). |
| `target_condition` | `EntityCondition` | always true | An extra filter on the **target entity** (undead only, players only, …), evaluated after the friend-or-foe decision. |

**This module only says what to hit, not who to hit.** It hits every entity the array covers; whether the owner and friends are spared is up to the top-level `spare_friends` (leave it out and the owner is hit along with everyone else). When it cannot tell friend from foe, an array that declares `spare_friends` **holds fire** — the reason is under "Friend or foe".

Every strike goes through the shared damage pipeline: the owner (when `attribute_to_owner` is true) takes part as the attacker in the first layer of element overcoming, and the entity hit gets the second layer of reduction from its own element adaptation. That is, "the owner has a fire spirit root and the target has a water one" makes this array hit harder, while a target adapted to fire takes less — those multipliers are written in the `mxt:element` definitions, not here.

### `mxt:buff`: buffing

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | List of ability IDs or `#tags` | `[]` | Granted to the entities in range. **The source is automatically `mxt:formation/<namespace>/<path>`**, and the grant is revoked when the entity leaves the radius, the array is dismantled, or it is no longer selected. |
| `target` | `all` / `allies` / `owner` | `all` | Who receives the buff. `allies` goes through the friend check, and **gives nothing to anything it cannot identify**. |
| `aura_zone` | Aura override | none | A high-priority runtime aura override, see "Aura overrides". |
| `max_bonus` | Map from aura ID to a number | `{}` | The aura maximum bonus of the chunks in range (the highest wins when they overlap). |

The three `target` settings are one rule at three widths: `all` filters nothing; `allies` requires the friend check to answer `true` — the check asks **every** owner, any one of them recognising you is enough, and **an owner counts as a friend of themselves** in that check, so `allies` includes the whole list; `owner` only reads the UUID list and is a narrower way of writing the same thing.

**Attribute bonuses do not look for a field here.** Passive attributes are the `modifiers` field of the `mxt:modifier` ability type itself, so granting an ability is what grants its attribute modifiers; the base does not open a second entry point, or the same thing would have two sets of rules — including the easiest part to get wrong, "a modifier outliving the array that granted it".

**An entity that is no longer selected gets its grants taken back**: when you stand inside the array and the friendship goes away, this source is reconciled and cleared without waiting for you to walk out.

### `mxt:protection`: protecting

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `block_break` | boolean | `true` | Blocks breaking. |
| `block_place` | boolean | `true` | Blocks placing. |
| `block_interact` | boolean | `true` | Blocks right-clicking blocks (chests, doors, crafting tables, …), and also "using an item on a block". |
| `explosions` | boolean | `true` | Blocks explosions from changing the terrain; **only blocks are removed, entities still take damage**. |
| `mob_griefing` | boolean | `true` | Blocks mob destruction (an enderman carrying a block, and the like). |
| `entity_interact` | boolean | `true` | Blocks right-clicking entities (villagers, horses, armour stands, …). |
| `attack_entity` | boolean | `true` | Blocks **melee** attacks on entities. |
| `item_use` | boolean | `true` | Blocks item use (buckets, potions and drawing a bow on nothing or on yourself, …). |
| `spare_friends` | boolean | `true` | Exempts the owner's friends. |
| `delegate_to_claims` | boolean | `false` | **Hands the protection over to a claim plugin** (FTB Chunks, say): while a claim protection is in force, the nine switches above are only a declaration and are no longer enforced. See below. |

**All nine switches default to `true`**: declaring the module is that whole sentence, and you write `false` explicitly for the one thing you want to open up. Three of them cost more than the rest and are worth turning off when you do not need them: `block_interact` covers every block with a screen, and `explosions` and `mob_griefing` sweep the registered arrays on high-frequency paths (per-block explosion resolution, every mob destruction).

#### The decision: both ends of the action count

There is only one question: **if the actor, or the block / entity being acted on, is inside the radius, the switch applies.**

- Standing **outside** and clicking a chest **inside** → blocked (the chest is in the array).
- Standing **inside** and clicking a chest **outside** → blocked (the player is in the array).
- `item_use` has no target, so only the actor is looked at.
- Explosions and mob griefing have no actor and only look at the position, so **an owner's own explosion is blocked too** — write `"explosions": false` if you want a way through.

Splitting "ground" and "people" into two modules would produce a sentence whose two halves both have to be declared to say anything, and the right-click-a-block one would even read as a contradiction. Now it is one sentence.

#### Exemptions and other rules

- **The owner is always exempt**, and no configuration changes that — locking yourself out of your own house is a bug, not a rule.
- **The friend exemption** needs `spare_friends` to be true **and** the server setting "Formations → Friend or Foe" to be on.
- **When it cannot identify, it protects as usual**: an array that declares `spare_friends` holds fire when it cannot identify an entity, while a protecting array keeps blocking. A wrong guess should point at the safe side.
- Only **registered arrays** are in force, and dismantling ends that at once; an ownerless array exempts nobody (otherwise an abandoned array would lock a piece of land forever).
- The base ships no land protection of its own: when you need claims, an external claim mod provides them, and this layer steps aside through `delegate_to_claims` below.

#### Handing it to a claim plugin (`delegate_to_claims`)

When it is true **and a claim protection really is in force**, **not one of the nine switches above is enforced**: what actually stops people is the claim plugin's own rules. With FTB Chunks, for instance, it already protects its claims on its own, so "handing it over" needs no API call — the array merely stops adding its own layer.

The "is a claim protection in force" test looks at FTB Chunks: **it is installed, and its global `disable_protection` has not been turned off**. It **cannot see team-level** settings — when a team sets all four privacy modes of its claim to public, this still counts as "protected" (recomputing that layer would mean copying the claim plugin's decision a second time, which is exactly what handing it over is meant to avoid).

The server setting "Compat → Delegation Needs Claim Protection" (**on by default**) decides what happens when there is no claim protection:

| Setting | Behaviour |
| --- | --- |
| On (default) | It only hands over when there really is claim protection; otherwise it **falls back to the nine switches above** and logs a warning at activation, from the definition. |
| Off | Read literally: it always hands over, and with no claim protection **nothing is protected at all**. |

Either way the two costs are the setter's:

- After handing over, the array only protects **claimed** places, and **its own `radius` no longer takes part in the protection decision**;
- in the **fallback branch** the array protects what is **inside its own radius**, independently of the claim plugin's decision.

#### The relationship with claim plugins: three modes (server setting)

That switch is a **content pack's** declaration for one array; a separate server setting (on the "Compat" tab) decides how **all** protecting arrays get along with a claim plugin — "Compat → Claim Integration":

| Value | Behaviour |
| --- | --- |
| No integration (default) | **No integration**: an array applies its own switches anywhere, and when both are present it is an "and" — either one refusing counts as a refusal. |
| Claim only | **A protecting array may only be raised inside a claim**: the chunk the controller sits in has to be claimed already (by any team), or activation fails with a message (`item.mxt.formation_plate.failed.not_claimed`). It only applies to arrays **with a protection module**. |
| Claim first | **An array can be raised anywhere, but inside a claim it switches to that claim's rules**: once the chunk the controller sits in is claimed, the nine switches of this array are handed over entirely and the claim plugin decides; **outside a claim it still uses its own switches**. |

Three boundaries:

- "Inside a claim" is decided by **the chunk the controller sits in**, not by every affected position — an array straddling a claim border is either wholly under the claim or wholly outside it.
- "Claim only" does not require **your own** claim: being able to stand there means the landowner allows it (otherwise he would have stopped you long ago), and this option is about "do not raise a warding array on land that has no owner".
- **With no claim plugin on the server neither mode does anything, rather than stopping arrays from being raised**: there is no claim to require and no claim rule to hand over to. That case logs one warning for "Claim only" (once per session), because "the option did nothing" and "the option worked but nobody came" look exactly the same in game.

#### Protecting arrays cannot be raised on someone else's claim

Server setting "Compat → Raising Needs Permission" (**on by default**, independent of the enum above):

**When the controller falls inside a chunk claimed by someone else, only three kinds of player may raise a protecting array.**

1. **Someone with edit permission** — the claim plugin itself is asked "would you let him place this block" (`canPlayerUse(BLOCK_EDIT_MODE)`), rather than rewriting the privacy mode rules here: whether a public claim, a team rank, an ally or a permitted fake player counts is its rule, and a second copy would only be a copy that drifts.
2. **A friend of the landowner** — the same friend system the protecting array uses (so with FTB Teams installed, **teammates and allies already count as friends** and pass on their own).
3. **Unclaimed land** — a place nobody has claimed has "no landowner", and anyone may raise an array there.

Everything else is refused, including an **actor that cannot be resolved** (the console, a command source): nobody can agree on the landowner's behalf.

Why this is worth a rule of its own (rather than just "the block will not place"): **a protecting array is a claim of jurisdiction, not just a building**. Being allowed to place blocks on someone's land is not the same as being allowed to raise a law there; and **when the structure is already standing** (the template matches natural terrain, or something somebody else built), block protection alone cannot stop anyone.

> With no claim plugin this rule is **inert** in the same way (there is no one else's claim to judge), so it changes nothing on a pure Mxt server. The message on refusal is `item.mxt.formation_plate.failed.foreign_claim`, which says more than "the structure does not match" would.

> Also on record elsewhere: FTB Chunks **does not block item use by default** (only `ftbchunks:right_click_blacklist` can) and **does not block attacking entities** either. So once `item_use` and `attack_entity` are handed over, nobody is minding them.

#### Known gaps

**Projectiles.** `attack_entity` blocks melee swings (the event the game fires on the **attacker's** side), so an arrow shot from inside the array does not count as "the attacker is attacking right now" when it lands, and is not blocked.

### `mxt:range_display`: range display

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `particle` | particle | **required** | Which particle to draw. |
| `shape` | `ring` / `sphere` | `ring` | `ring` is a horizontal circle at the controller's height (a ground line); `sphere` covers the whole sphere. |
| `points` | int (1–512) | `32` | How many points to draw each period. |
| `interval_periods` | int (1–1200) | `1` | How often to draw, in **array periods** (1 period = 20 ticks). |

An array's range is a sphere, and nothing in the world says where it ends — the structure only marks the controller. This module draws that line.

- **It only displays**: it affects no entity, does not make the array hostile, and takes no part in the friend-or-foe decision; an array that does not write this module costs nothing at all.
- It is only sent to **players who can see it**: within the radius **+ 32 blocks**. Vanilla's broadcast call is pinned at 32 blocks, so this sends per player instead — otherwise an array with a radius above 32 would have a ring of its outline cut off. One particle packet per point, so `points` times the number of players who can see it is the cost per period.
- `ring` is drawn at the **centre height of the controller block**; `sphere` lays points out by the golden angle, so a latitude/longitude grid does not bunch them up at the poles.
- It runs after `TickEffects` and before `tick_action`, so **cancelling the period of `TickEffects` stops the range from being drawn along with it**.
- Several may be written to layer different particles.

### `mxt:none`: the empty module

It has no behaviour at all, is the default entry of the dispatch table, and writing it is the same as not writing it.

## Structure: one of the two

`structure_check` decides **whether** a structure is checked when the array is raised:

- **`structure` (default)**: `structure_template` and `structure` **must be given, and only one of them** — both or neither fails the load.
- **`always`**: the array **can be raised anywhere**, and then `structure_template` and `structure` **are not read** — writing one is **silently ignored** (the same rule as an unknown key). It expresses an array that is raised by other means than a structure (left in place by a script or a command, say).

**Prefer `structure`.** What an array wants to express is usually a handful of fixed positions — "a base plus a few flags" — and the inline form is enough; it also resolves the expected values once when the pack loads and pins them down, so every check is one block state lookup per block. `structure_template` is only worth it when the layout is genuinely too complex to list block by block.

- **`structure` (inline, preferred)**: no `.nbt` resource needed, and the offsets are written in the definition.

  ```json
  "structure": [
    { "offset": [0, 0, 0], "state": "minecraft:gold_block" },
    { "offset": [0, 0, -8], "state": "mypack:wood_flag" }
  ]
  ```

  `offset` is relative to the controller. `state` takes a bare block ID (its default state); use vanilla's `{ "Name": "...", "Properties": { ... } }` form only when properties have to be named — a state that one ID can express is exported back as an ID too.

- **`structure_template`**: references a vanilla structure template (`data/<namespace>/structure/<path>.nbt`, the same files the structure block and `/place template` use). Suited to large or complex layouts.

  It costs two things:

  1. **Every check re-serialises and re-parses the template**, plus one block state registry lookup per block — once every 20 ticks, for every array, so do not describe a few coordinates with it.
  2. **Every block in the template has to match, one by one**, except air.

  > **Air takes no part in the check.** When the structure block saves, it records the whole bounding box and writes empty cells into the `.nbt` as air entries; if those cells had to stay air, a torch dropped beside them or one block falling would ruin the array. So an air entry in a template means "this does not matter here", not "this has to be air". Put the other way round, **a template can only require what must be present, never what must be absent** — a "this has to stay empty" test can only be built with a condition of your own.
  >
  > Bear in mind that this is the opposite of vanilla **placing** a template: placing writes air into the world, because a structure reproduces the whole volume; an array only asserts that its own flags are still standing, which is a weaker question.
  >
  > **48×48×48 is the structure block's own limit, not the array's.** Both axis constants are `48` and are only used to clamp when the structure block reads its own NBT; the underlying structure template format (reading `size` from NBT) has no size limit at all, and a structure block in LOAD mode loading a larger template **adopts the template's size** rather than clamping it to 48. So a template above 48³ cannot be made by **hand selection** with the structure block, but a file produced by an external tool and verified with `/place template` (which has no size check either) can be referenced by an array as usual — the problem is only "how to produce the file", not loading it.

## The context of per-entity behaviour

`entity_tick_action` / `entity_enter_action` / `entity_exit_action` run once per entity and can read:

| Name | Where | Meaning |
| --- | --- | --- |
| `formation_radius` | Formula explicit value | The array's radius. |
| `distance` | Formula explicit value | The distance from the entity to the controller. |
| `formation_x` / `formation_y` / `formation_z` | Formula explicit value | The controller's coordinates, ready to feed to `mxt:teleport`. |
| The array's carrier | Context data | Records "which array, the owner list, where the controller is", consumed by `mxt:formation_owner` and `mxt:formation_ally`. |

The context of `tick_action` / `deactivate_action` is **`Level`**, with only the `zero` and `random` variables — **do not write formulas that depend on entity state in them**.

## Array owners

- **`mxt:formation_owner`** — the entity is **one of the owners** of **the array currently being evaluated**. It is always `false` outside an array.
- **`mxt:formation_member`** — the entity owns **any** registered array in this dimension (it is on the ownership list of one). A different question from the one above, so do not mix the two up.

**Ownership is a set**: an array records a group of UUIDs, and **every name on that list counts as an owner** — `mxt:formation_owner`, the dismantle permission, and the "owner / allies" of the function modules all judge by that group, and the friend system also **asks every name on the list in turn** (any one of them recognising you makes you an ally). The placer is written into the list when the plate activates the array; when several people keep one array together, add or remove owners with `/mxt formation owners <pos> [add|remove <player>]` (adding and removing need the gamemaster permission, see [commands](/en/player-guide/commands/formation)), and `/mxt formation list` prints the whole group comma-separated.

The payer is the **first** name on the list (with a single owner, the only owner, and the one who raised the array), so **an array with a maintenance cost is dismantled when its first owner is offline and no payer can be resolved** — unless a script cancels `UpkeepFailed` to carry it through, or its `storage` can still cover that period (see "Storage").

`mxt:formation_owner` **excludes only the owner himself** (any name on the list counts). Ally protection is a separate decision beside it and does not change its meaning — so a pack can express "only the owner is excluded" and "all allies are excluded" separately.

## Friend or foe (ally protection)

The top-level `spare_friends` is a **switch** and answers one thing only: whether this array's per-entity work goes to **everyone inside the covered range**, or through a **friend-or-foe decision** first (friends, and anything it cannot identify, are then unaffected). It **does not mean this array is an attacking one** — whether an array attacks or supports is what its `actions` say: one with `mxt:attack` hits people, one with `mxt:buff` gives buffs. The switch and the nature each mind their own end and neither infers the other.

- **Left out (the default) means it applies to everyone**, owners and friends included. To make an attacking array spare your own side you have to write `"spare_friends": true` explicitly; forgetting it means a punch in the owner's face, and that is deliberate — the runtime no longer guesses the pack's intent.
- **Once written**: friends and owners are unaffected by any per-entity work, strangers are affected as usual, and **anything that cannot be identified is let through too**.

- **Who counts as an ally** is answered by the friend system: it fires a friend-relation event first (other mods may answer, and the event carries the owner's **UUID**, so a source whose data lives on the server — team members and allies with FTB Teams installed, say — **can answer even while the owner is offline**), and only when nobody answers does it read the owner's own friend list. With several owners on the list, it **asks each one in turn**: **any one** of them recognising you makes you an ally (one saying no while the rest say nothing still means no). **The owner himself counts too** — in the friend decision "you are your own friend", so an array that declares the switch will not hurt the person who raised it, and no `mxt:formation_owner` condition is needed.
- **When the owner cannot be resolved (offline, not loaded) it still asks by id first** (every name on the list): the event carries the owner's UUID, so a source such as FTB Teams still answers; the built-in friend system also keeps an offline mirror cache, and an owner who has logged in once still has an answer available. Only when **not one name on the list** can identify the entity (no owner record at all, or neither an entity nor a mirror that has seen this player, and no source that knows the pair) does an array that declares the switch **hold fire**: it does nothing to any entity, rather than "act on everyone". The list hangs on the player entity, and "hit everyone" would hit exactly the people this switch exists to protect, while "pick a few to spare" can only be a guess — when it cannot tell friend from foe, it does not open fire. Holding fire also means the abilities it granted are released (an exempted entity never enters the present set, see the next point). For an array that should "hit anyway while the owner is away" there are two routes: leave `spare_friends` out and write the decision yourself with `mxt:formation_ally` (it is always `false` outside an array or with no owner, so the "hit" branch is taken), or turn the server setting off.
- An exempted entity **never enters the array's present set**, and so gets no `entity_enter_action` / `entity_exit_action`. The upside is that the abilities an array granted are released when the exemption takes effect; the cost is that **a change in friendship produces one "leave and enter again"**, so `entity_enter_action` still has to be idempotent.
- The server setting "Formations → Friend or Foe" (**on** by default) is the master switch: with it off, `spare_friends` might as well not exist and an array applies to everyone (the owner included). Being on by default changes no pack — `spare_friends` defaults to `false`.

A pack can also decide for itself instead of relying on the automatic filter. `mxt:formation_ally` is an **entity condition** and answers, in an array context, "is this entity a friend of an owner" — **any one** owner recognising it is enough (it is always `false` when nobody on the list can answer; an owner who is merely offline is still asked by UUID through the event, down the same pipeline as every other decision). Judging each behaviour separately expresses what a single switch cannot — hurting enemies and healing allies from one array, for instance:

```json
"entity_tick_action": {
  "type": "mxt:if_else",
  "condition": { "type": "mxt:formation_ally" },
  "if_action": { "type": "mxt:heal", "amount": 1 },
  "else_action": { "type": "mxt:damage", "amount": 2 }
}
```

The trade-off between the two routes:

| | `spare_friends` (top-level switch) | `mxt:formation_ally` (entity condition) |
| --- | --- | --- |
| Granularity | The whole array | Each behaviour |
| Who decides whether it applies | The server setting "Formations → Friend or Foe" | The pack itself, unaffected by settings |
| When friend or foe cannot be told | Holds fire (hits nobody) | Takes the `false` branch (hits anyway) |
| Fits | "This array's effects go to everyone except outsiders and whatever it cannot identify" | "Do different things to enemies and allies within one tick" |

> **Do not use both on one array.** `spare_friends: true` has the runtime remove friends entirely first, so per-entity behaviour never runs on them and the "heal allies" branch above can never be reached. To divide and rule, leave the switch out.

`mxt:friend` is the **bi-entity condition** version of the same decision (`actor` treating `target` as its own), used where a bi-entity condition slot exists, such as an ability's `target_condition`: `{"type": "mxt:not", "condition": {"type": "mxt:friend"}}` means "do not apply to friends".

## The period and its three events

Everything runs on a **20 tick** period, and one period fires three events in order (all in the `formation` group in KubeJS, told apart by `isCancellable()` / `getPhase()`):

| Event | Cancellable | Meaning |
| --- | --- | --- |
| `Tick` | ❌ | The upkeep has been settled. **Observation point**: hook here when something has to happen in every period that was paid for. |
| `TickEffects` | ✅ | Blocks only `tick_action` and the per-entity behaviour. Cancelling **does not refund** — the array is still up and still being maintained. |
| `UpkeepFailed` | ✅ | The upkeep cannot be paid. Cancelling = nothing is paid and nothing is done this period, but the array **stays**; only without a cancellation is it dismantled. |

The reason for splitting them: paying and cancelling have to be two different things. By the time `Tick` fires the money is already spent, and if it could be cancelled, "cancel" would mean both "nothing happens" and "the payer is still charged" in one sentence — an unconditional cancelling listener could drain the payer for no effect at all.

## Range and time granularity

- The range is a **sphere**, not a box: the corners of a box would not take effect.
- Everything runs on a **20 tick** period, which is also the granularity of entering and leaving: crossing an array within 20 ticks is not observed.
- Unloading and loading a chunk produces one false "leave and enter", and after a server restart every entity inside is treated as newly arrived. So `entity_enter_action` **has to be idempotent**.

## Releasing the abilities an array granted

The `source` of `mxt:grant_ability` should be the `mxt:formation/<namespace>/<path>` that matches the `formation`'s own id. The base reconciles that source and revokes all of its grants when an entity leaves, when the array is dismantled, and when a player leaves the array — otherwise the abilities stay on the entity forever (the ability record is a persistent attachment, and the context of `deactivate_action` cannot see entities). Not following the convention is not an error, it only loses the automatic cleanup.

## An array devours its ley line (the first source of upkeep)

**Block aura emitters inside an array's radius stop supplying the environment and supply the array instead.** The array pays its own `maintenance_costs` with that aura and the owner only covers the shortfall; if the array supplies enough by itself, **the owner pays nothing at all** (and does not even need to hold that resource).

The rules:

- The range is the sphere of the array's own `radius`, with no second definition.
- The blocks it swallows **disappear from the environmental aura entirely** — they take no part in resolving "how much aura is here" and are not shared with any other query. So an array is a real aura black hole, and one built on a spirit vein drains that vein dry (the vein itself still recovers by `regen_per_tick`).
- **It is offset per resource type, not in general**: aura that is all fire inside the array cannot offset a spirit-power bill. Aura that does not match is neither given to the environment nor to the array — it is simply swallowed.
- **There is no store**: the aura swallowed this period offsets this period's upkeep directly, and the surplus is not returned or carried over. To keep it, write a `storage` field on this array (see "Storage") — the only exception, and a deliberately narrow one.
- Only an **owner** can be the payer. While the owner is offline the array is still dismantled for "being unable to pay the shortfall" — unless the shortfall is fully covered by its own aura, in which case no payer is needed at all. The `storage` stock counts as a payer in the same way: it keeps paying while the owner is away, and the array is dismantled only when it cannot.
- **Optional: also draw the ambient aura of the ground itself.** With the server setting "Formations → Draw Ambient Aura" (**off** by default) on, the ambient aura resolved at the array's **own position** takes part in the offset too. Two things to note:
  - only **natural** aura counts (biome / dimension / artificial regions and the local field aura there), while the share contributed by emitters inside the array is subtracted so it is not counted twice;
  - it makes an array cheaper than what it stands on — a place thick with aura can pay for it with no emitters at all, which is another balance of its own.

The engine requirement that goes with it: **activating or dismantling an array makes the chunks its radius covers recompute their block aura** (otherwise the swallowed blocks would keep supplying the environment and the array's share would come for free). The recomputation is queued and happens at the next boundary of the server setting "Aura → Block Aura Period".

> To make an array run entirely on its own, place enough emitters inside the radius (an `mxt:spirit_stone_block`, say).

## Storage (`storage`)

`storage` is a **generic field**: every array has that property, it is simply **off by default** — writing nothing means storing nothing.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `capacity` | Map from aura ID to a number | **required** | How much of each aura may be held at most; **an aura that is not listed is not stored**. |

```json
{
  "structure": [ { "offset": [0, 0, 0], "state": "minecraft:gold_block" } ],
  "radius": 12,
  "maintenance_costs": [ { "id": "mxt:common", "amount": 10 } ],
  "storage": { "capacity": { "mxt:common": 500 } }
}
```

An array without `storage` is **open to the air**: the aura its own ley line supplies only offsets the current upkeep and the surplus disperses on the spot. Write it and the array starts keeping that surplus — deliberately narrowly: the stock comes from the ley line, pays this array's own bills only, and disappears with the array.

**Paying order: this period's ley line supply → storage → the owner.** Spending the current period's share first is intentional: the ley line share is newly given this period and is gone if unused, while storage is the share that can wait for the next period, so paying with it first would amount to making the owner buy the aura he is standing on this period.

| Case (bill 10, capacity 500) | Ley line gives | Storage | Paid from storage | Paid by owner | Added to storage |
| --- | --- | --- | --- | --- | --- |
| Ley line is enough | 50 | 0 | 0 | 0 | 40 |
| Ley line is cut | 0 | 30 | 10 | 0 | 0 |
| Split three ways | 4 | 3 | 3 | 3 | 0 |
| Store nearly full | 50 | 490 | 0 | 0 | 10 (only up to 500) |
| Not listed in capacity | 50 | 0 | 0 | 0 | 0 |

Each resource is worked out on its own: **a store full of fire aura cannot pay a spirit-power bill**, whether it was collected this period or ten periods ago. One rule per bill: one resource's bill can be paid by the ley line, another's from storage, and a third can land on the owner, all in the same period and without affecting each other.

A few boundaries:

- **Capacity is the ceiling of each resource on its own**, not a total: `{"mxt:common": 500}` says `mxt:common` holds at most 500.
- **Writing `storage` means writing `capacity`**: a storage declaration that stores nothing is a typo, not a configuration (to switch storage off, do not write `storage`).
- **An array without `maintenance_costs` stores nothing** — there is no bill to offset and no outlet for a stock, so not even the sweep is worth doing.
- **Dismantling means dispersing**: the stock belongs to this array and is gone once it comes down. Returning it to the owner would wire the ley line aura into the player's inventory as a pipe, which is another balance of its own.
- **While the owner is offline the stock pays as usual**, and the array pulls through when it covers the shortfall and is dismantled when it does not. The cost is that the bill is then evaluated with a **Level context**: constant costs are unaffected, while a formula that depends on player state cannot read the player.
- The stock **persists with the save**, and `/mxt formation info` also shows a non-empty stock.
- Capacity is a formula, and a result that is non-finite or ≤ 0 means **that resource is not stored** (no clamping, no guessing).

## Aura overrides

`aura_zone` is a field of the `mxt:buff` module and makes this array **replace** the aura resolved at the array's position (at a higher priority than biome / dimension / artificial regions):

- The override is published through a cancellable aura override event — cancel it and the static result returns, with the array still standing.
- The override is only in force **while the array is registered**, and dismantling falls back to the static resolution at once.
- Aura answers are **memoised per tick**, so an array activated within one tick only affects aura queries on the next tick.
- When they overlap, the **nearest array that declares an `aura_zone`** wins; an array that declares no zone (a terrain warding array, say) does not block the override of the cultivation array beside it.

`max_bonus` is also a `mxt:buff` field and adds a ceiling to aura pools, with one coupling that has to be known: **it is only applied together with the override of `aura_zone`**. The bonus goes on the resources provided by "the zone selected after the override", so:

- No `aura_zone` → no override → `max_bonus` has nowhere to go.
- An `aura_zone` whose zone does not provide some aura → no bonus can be added to that aura (it does not conjure aura out of nothing).

## Activating and dismantling

The plate (`mxt:formation_plate`) is the only item that can bring an array into the world: its `mxt:formation_plate` component holds a `formation` reference and is settled on right-clicking a block. The same plate is the switch — right-clicking the controller activates, right-clicking an activated controller dismantles (you have to be an owner or an administrator; with the server setting "Formations → Allies May Dismantle" on, an owner's friends can dismantle too).

**Binding an array**: write it into the plate in your main hand with `/mxt formation bind <formation>` (needs the gamemaster permission), or name it directly in the item component:

```mcfunction
give @s mxt:formation_plate[mxt:formation_plate={formation:"mypack:green_shade_array"}]
```

### An unbound plate identifies the array itself

**A plate with no bound array recognises the array under your feet and activates it on right-click.** The recognition uses the same 3×3×3 controller tolerance, and the candidates are every array this plate **is allowed to activate** (`allowed`; an empty list is read according to the server setting), compared structure by structure in ID order, with the one nearest the clicked position winning; a clicked position that matches on its own always takes priority. The message on success carries the array's name — the player never said which array to raise, and "an array appeared" is not an answer.

- **A binding wins**: a plate with a bound array raises that one only, neither recognising another along the way nor doing this scan. The allow list answers "which arrays may this plate raise" and the binding answers "which one does it raise", and neither replaces the other.
- `/mxt formation bind` is therefore not a prerequisite for "being able to play" but a way to **restrict**: a plate a content pack hands out may be bound or left blank.
- With the server setting "Formations → Plate Auto-Identify" off (it is on by default), an unbound plate says "the plate has no formation bound".
- The cost is **up to 27 × the number of arrays in the allow list** structure checks per click. An inline `structure` is one block query per cell, while `structure_template` re-serialises and re-parses the template on every check — with a large pack, if you do not want a stutter on every click, bind the plates players use (a bound plate does not scan), or turn the option off.

- When no structure is recognised the message is `item.mxt.formation_plate.no_structure` rather than "no formation bound": the two sentences point at different next steps ("move somewhere else / lay the base out first" against "bind it with a command first").

A failed activation says why (structure mismatch / not enough resources / position already occupied / claims do not allow it) instead of returning an internal enum name, and **no failure consumes anything**.

### Plate allow lists

The `mxt:formation_plate` component has two independent fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `allowed` | List of IDs or `#tags` | `[]` | **Which arrays this plate may activate.** The property belongs to the item, so every copy of the same ID is the same. |
| `formation` | Formation ID | none | **Which one this copy has selected**; it has to belong to `allowed` to be usable. |

```mcfunction
# only two concrete arrays
give @s mxt:formation_plate[mxt:formation_plate={allowed:["mypack:thunder_array","mypack:ice_array"],formation:"mypack:thunder_array"}]

# one tag handing a group of arrays to several plates (recommended)
give @s mxt:formation_plate[mxt:formation_plate={allowed:["#mypack:wood_arrays"],formation:"mypack:green_shade_array"}]
```

A tag file goes in `data/<namespace>/tags/mxt/formation/<path>.json` and is written like an item tag:

```json
{ "values": ["mypack:green_shade_array", "mypack:spirit_gathering_array"] }
```

An empty `allowed` is an **ambiguous case**, which is why it is a setting: by default "not restricted", and with the server setting "Formations → Blank Allow List Passes" off, an empty `allowed` means **nothing is allowed** and the entries have to be listed explicitly. Tab completion of `/mxt formation bind` lists every array in the registry; the allow list no longer narrows the completion but checks before the write.

**The allow list only takes effect before the write and before activation**, both ahead of any resource spending: `bind` refuses an array outside the list and **does not touch the item**; and when a plate's `formation` is not inside its own `allowed` (a hand-edited save, or a changed setting), right-clicking says "the plate does not allow activating the formation it has bound" instead of activating as usual — this is an explicit configuration, not a broken item.

**Controller tolerance**: within 3×3×3 of the clicked position the nearest controller that satisfies the structure is looked for. Being one block off does not fail, and a clicked position that is valid on its own is always taken first, so clicking next to a block that could be a controller never moves the activation elsewhere. Dismantling goes through the same lookup.

> Bear in mind that this window is only 3 blocks wide, so it is really only useful for **compact layouts**: for a position to serve as the controller, the whole structure has to be satisfied starting from it, so with a span above one block only the original controller can hit. That is exactly the range the real constraint of "clicking one block off" corresponds to.

## Diagnostics

`/mxt formation list` lists every activated array in the current dimension; `/mxt formation info` lists the arrays covering the player's position; `/mxt formation bind` is the only write in this subtree. All three have a top-level alias `/formation ...` (the alias can be turned off with the server setting "Command Aliases → /formation"; `/mxt formation` is always complete).
