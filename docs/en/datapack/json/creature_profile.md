---
title: Creature Profile (creature_profile)
description: The profile attached to a creature type, covering attributes, aura requirements, inner core, the action written once and its own growth chain.
aside: false
---

# Creature Profile (creature_profile) {#creature_profile}

File location: `data/<namespace>/mxt/creature_profile/<path>.json`

A creature profile is attached to a creature type and applied once, when the creature enters the world: it decides that creature's attributes, aura requirements, inner core, and one action that runs at the moment the profile is written. It does **not** decide who can be contracted - eligibility is a code fact of the target creature, see [contract_type](./contract_type.md).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `entities` | array of creature type IDs or `#tags` | `[]` | The creature types or tags this profile applies to. |
| `spawn_action` | `EntityAction` | `mxt:no_op` | The action **run once** when the profile is written onto this creature. |
| `intelligence` | `NumberProvider` | `0` | The intelligence value. |
| `condition` | `EntityCondition` | `mxt:always` | The condition under which the profile applies. |
| `inner_core` | Item stack template | none | The inner core stack template; the creature drops exactly this stack on death. |
| `preferred_aura_elements` | array of element IDs or `#tags` | `[]` | The preferred aura elements. |
| `minimum_aura` | Map of aura ID to value | `{}` | The minimum value of each aura required to spawn or be strengthened. |
| `default_level` | Progression level ID | none | The entry level of this chain. With it the creature has progression; without it, it has none. |
| `mastery_resource` | Value ID | none | Which value measures mastery. Writing it requires `default_level`, otherwise the definition is rejected at load time. |
| `configuration` | Map of progression level ID to an entry object | `{}` | What each level gives it: the condition to reach it (`condition`), the abilities it grants cumulatively (`ability`) and the action it runs once on entering (`action`); the entry fields are the table of the same name on [technique](./technique.md). Writing it requires `default_level`. |

`entities` takes a single entry, a tag, or a mixed array.

`condition` takes a single condition or an array of conditions. It governs whether this profile applies at all; it does not replace the vanilla spawning rules.

`inner_core` is written as `{"id": "..."}` (with an optional `count` (`1..99`) and `components`), or as a bare item ID. It takes a **template**, not an already bound stack: datapack registries are resolved before item components are bound.

A profile is written only once, so `spawn_action` also runs only once: it runs together with the profile the first time the creature enters the server-side world, and a creature that already carries the profile does not run it again. It takes **one action** - an array is rejected at load time, so use `mxt:sequence` to do several things in a row. When the condition or an aura requirement fails, the profile is not written and this action does not run either. It is the only field in the profile that touches the world.

**Creature growth is one progression chain this profile declares** (see [progression](./progression.md)). Write `default_level` and the creature becomes an owner of that chain - the owner id is this profile's own id - and the level it stands on is recorded on the creature, not in the profile. To make **only spirit beasts grow**, write the entity condition [`mxt:contract`](../types/condition/entity_condition_types.md) as that level's `condition`.

The entry level's own `configuration` is what the creature is **born with**: grants are cumulative, since the level it stands on and every level below it count, so what it knows from birth goes into the entry level and what it learns on advancing goes into the next one. That is why a profile has no `granted_abilities` of its own and no `passive_modifiers` - for attributes, use an `mxt:modifier` ability on the entry level. Each `configuration` entry has the same shape as the one on [technique](./technique.md): `condition` is what reaching that level takes, `ability` is what it grants (a `#tag` or an array works too).

**Mastery grows however a data pack or a script makes it grow**: the mod only provides `mastery_resource` as the yardstick, and the ways to raise a value already exist - the `mxt:add_resource` action, an aura's `regen`, KubeJS. The mod does not decide a growth curve for your content.

**Ending the contract clears this chain's record** (both releasing it and the beast dying count): with the record gone the beast falls back to its entry level and the abilities the levels granted are revoked with it. While the contract holds, the level travels with the creature, so it survives a trip into the Spirit Beast Bag and back out; `/contract info` reads out the level it is on.

**Extra drops are not managed by the profile**: anything other than the inner core belongs in a vanilla loot table (the entity's own loot table, or a loot modifier attached to it). To split pools by a cultivator's state, use the loot conditions the mod registers - `mxt:realm`, `mxt:has_ability`, `mxt:has_curse`, `mxt:has_spirit_root`, `mxt:has_element`, `mxt:has_physique`, `mxt:technique`, `mxt:js` - see [Loot and Criteria](../loot-and-criteria.md).

```json
// data/example/mxt/creature_profile/spirit_wolf.json
{
  "entities": ["minecraft:wolf", "#example:spirit_wolves"],
  "spawn_action": { "type": "mxt:set_no_gravity" },
  "intelligence": 12,
  "condition": { "type": "mxt:always" },
  "inner_core": { "id": "minecraft:amethyst_shard" },
  "preferred_aura_elements": ["example:fire", "#example:warm_elements"],
  "minimum_aura": { "mxt:common": 10.0 },
  "default_level": "example:wolf_1",
  "mastery_resource": "example:beast_mastery",
  "configuration": {
    "example:wolf_1": {
      "condition": { "type": "mxt:always" },
      "ability": "example:wolf_bite"
    },
    "example:wolf_2": {
      "condition": { "type": "mxt:contract" },
      "action": { "type": "mxt:heal", "amount": 4 }
    }
  }
}
```
