---
title: Datapack Overview
description: "How MiXianTu loads data pack JSON: file locations, IDs, pack priority, the mxt:disabled tag, holder references, validation, when changes take effect and client sync."
---

# Datapack Overview

This page is the general overview of MiXianTu data pack definitions. Every entry of a datapack registry is one JSON file. The Java-side built-in registries only provide `type` dispatch and codecs: a data pack can fill in fields that already exist, but it cannot create new Java behaviour from JSON.

Whether a registry already forms a complete runtime loop depends on the implementation state of its module. This page records the loading contract of the current code, and consumers that are not implemented are not described as implemented.

## File Location

Datapack registry files all go in:

```text
data/<namespace>/mxt/<registry>/<path>.json
```

For example:

```text
data/example/mxt/ability/firebolt.json
```

The definition ID of that file is `example:firebolt`. The filename may contain directories, and those directories become part of the ID path.

Data pack tags use the vanilla tag path:

```text
data/<namespace>/tags/mxt/<registry>/<tag path>.json
```

## IDs and Translation Keys

The display name of a data-driven definition is generated automatically from its identifier: `Identifier.toLanguageKey` builds `<category>.<namespace>.<path>` for the registry category.

The category defaults to the registry's own path, so `mxt:fire` in `mxt:aura` is `aura.mxt.fire`. The single override is `mxt:item_quality`, whose definitions are always translated under `quality` (`quality.example.refined`).

A `/` inside the path stays in the key: `Identifier#toLanguageKey` does not turn it into `.`, so `example:foo/bar` produces `resource.example.foo/bar`. Keep definition files out of subdirectories.

JSON no longer contains a `translation_key` field. Provide the matching translation in `assets/<namespace>/lang/en_us.json` (and `zh_cn.json` if you ship it).

```json
{
  "aura.example.fire": "Fire Aura"
}
```

Registry titles use their own fixed key, `mxt.registry.<registry path>` — `mxt.registry.aura`, `mxt.registry.item_quality` and so on. The mod ships those; a data pack only supplies the key described above.

## Loading and Overriding

- The data pack registries are loaded by the native NeoForge data pack registry system **while the world loads**. They are validated at that point, and a read-only snapshot is sent to the client on join through the vanilla synchronisation mechanism.
- File conflicts follow Minecraft data pack priority: a higher priority data pack overrides the same path from a lower priority data pack.
- When a vanilla tag uses `replace: false`, values are appended in data pack merge order. Apart from quality ordering tags, gameplay does not depend on tag value order.
- Data packs are read-only. There is no generic `schema_version`, `enabled` or `tags` field in a definition.
- Data pack objects are treated as immutable after loading; do not modify the collections returned by a codec at runtime.
- When a **required** single holder reference does not exist, the whole data pack load fails. Optional holders and tolerant list references are handled by their own codecs.

::: warning

The codec is the only loading contract. Defaults, field ranges and examples on this site follow the current source. Writing a field that is not listed has no effect, and writing an unknown `type` makes the load fail.

:::

## Disabling a Definition

Every datapack registry supports a fixed disabled tag:

```text
data/mxt/tags/mxt/<registry>/disabled.json
```

```json
{
  "replace": false,
  "values": [
    "example:old_definition",
    "othermod:disabled_definition"
  ]
}
```

The tag ID is `mxt:disabled`. Entries listed in it are not actively used by the matching service, but they are still kept in the registry, so other definitions can safely hold a reference to them. Editing this tag is subject to the same rule as every other data pack file: it is applied when the world loads.

Elements are covered by the same tag: a disabled element stops holding relations (`overcomes`/`adapted_to` are no longer settled), stops being coloured, cannot be bound by a spirit root and takes no part in any element matching. That is a different switch from the spirit-root and physique toggle: `mxt:disabled` is a data pack's seal over a whole definition, invisible to every consumer, while each **held** spirit root and physique can be switched off without being lost (see [Spirit Root](./json/spirit_root.md)) — that path only affects the one entry, and `mxt:has_spirit_root` / `mxt:has_physique` stay true.

::: info

The mod has not been released yet, so no compatibility with old JSON or old saves is promised.

:::

## Holders, Tags and Matchers

Cross-registry fields are resolved into holders as early as possible during data pack loading, instead of querying the registry again at runtime.

- A single reference to a built-in registry uses the `Holder` codec, for example `"example:resource"`.
- An optional reference uses `optionalFieldOf`.
- Lists and maps use the tolerant holder/collection codecs.
- A single tag reference is written with `#`, for example `#example:fire_abilities`.
- Fields that accept both items and tags accept a mixed array.

```json
{
  "aura": "example:qi",
  "ability_requirements": [
    "example:fireball",
    "#example:basic_fire_abilities"
  ]
}
```

Each element of the array stays a holder or a tag key; duplicate values do not change the semantics automatically. `AutoIgnoreListCodec` lets invalid optional entries of a list be ignored, and the field table of a registry marks whether it uses that codec.

The `items` field of `item_binding`, `weapon_binding`, `pill_binding`, `technique_binding`, `spirit_herb`, `item_aura` and `currency` uses an `ItemMatcher`:

```json
"items": "minecraft:apple"
```

```json
"items": "#minecraft:logs"
```

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

A matcher only references items that are already registered; it never creates an item. Besides the item ID and tag shorthands you can write a typed matcher entry: `mxt:item`, `mxt:tag`, `mxt:wildcard` and `mxt:regex`, the last two taking a `pattern`, plus `mxt:herb_tag`, which matches a spirit herb carrying a given element or material tag.

When several definitions match at the same time, they are selected by `priority` from low to high. For these data classes the priority is currently fixed at `0`.

::: tip

The only tag system is the vanilla one. Data packs define tags with files under `data/<namespace>/tags/...`, not with a `tags` key inside a definition.

:::

See [Shared Data Types](./types/shared_data_types.md) for the full reference of these shapes.

## Numbers and Formulas

Every field that has to change with level, realm or event context accepts a number provider. Evaluation happens on the server; the client only uses the synchronised result.

```json
{
  "damage": 8.0,
  "speed": "2 + level * 0.1",
  "amount": {"type": "mxt:constant", "value": 10}
}
```

Expressions use exp4j. Variables are read out of the objects the formula context carries, and `params` can override or add variables. A `NaN` or infinity during loading makes the data pack fail; at runtime it logs a single-line warning and is treated as `0`.

See [Number Provider Types](./types/number_provider_types.md) for every built-in provider and [Formula Variables](./types/formula_variables.md) for the complete variable list, the availability matrix and the error policy.

## Actions and Conditions

Behaviours are uniformly called `action` and are split by target into entity, item, block, bi-entity and so on. When several steps are needed, use the meta actions such as `sequence`, `choice` and `if_else`. A `condition` restricts abilities, bound items, cultivation, realms and recipes.

```json
"entity_action": [
  {"type": "mxt:heal", "amount": 2},
  {"type": "mxt:apply_curse", "curse": "example:burning", "stacks": 1}
]
```

Action and condition arrays are a shorthand. All built-in types are grouped and registered by classes such as `MxtEntityActions`, `MxtBiEntityActions`, `MxtBlockActions`, `MxtItemActions` and `MxtEntityConditions`; a data pack never adds entries to those built-in registries.

See [Types Reference](./types/index.md) for the built-in action and condition types, and [Ability](./json/ability.md) for the data shape that uses them.

## Registry Index

The mod registers **34** data pack registries, all of them declared in `MxtDatapackRegistries`:

| Category | Registries |
| --- | --- |
| Resources and cultivation | `resource`, `aura`, `element`, `element_reaction`, `realm_stage`, `spirit_root`, `physique`, `technique`, `skill_stage`, `cultivate_action` |
| Abilities and rules | `ability`, `curse`, `formation`, `tribulation`, `trigger`, `talisman` |
| Aura and world | `aura_zone`, `block_aura`, `item_aura`, `realm_instance` |
| Items and quality | `item_binding`, `weapon_binding`, `pill_binding`, `technique_binding`, `item_archetype`, `item_quality` |
| Economy and content | `currency`, `spirit_herb`, `forging_method`, `forging_blueprint`, `tool_binding`, `blueprint_binding`, `creature_profile`, `contract_type` |

`mxt:aura` is the registry that used to be called `mxt:cultivation`; it holds the aura identity and cultivation behaviour of one stored value, while the value itself lives in `resource`. `title`, `badge` and `sect` no longer exist. Alchemy recipes use the vanilla recipe system (`mxt:alchemy`) rather than a data pack registry.

[Registry List](./json/index.md) lists every registry with its directory and purpose, and links to the field reference of each one.

Advancements and loot tables use vanilla JSON instead of a registry; the criteria, loot functions and loot conditions the mod provides are listed in [Loot and Advancement Criteria](./loot-and-criteria.md).

## Validating a Datapack

The mod registers a small server-side diagnostic command tree:

| Command | Purpose |
| --- | --- |
| `/mxt registries list` | Lists the datapack registries and their entry counts. |
| `/mxt registries validate` | Reports every problem the last build found, each with the file it comes from: the cultivation, skill and technique chains, and any trigger rule that forgot its action. With no problems it reports the number of registries, the total number of entries and that validation passed. |

Run `/mxt registries validate` after the world has loaded to confirm that the data pack produced a usable registry state.

## Loading, Reloading and Syncing

MiXianTu data tables are native Minecraft data pack registries, and Minecraft reads those **while the world loads**. `/reload` does not re-read them: it only refreshes the vanilla reload listeners — recipes, loot tables, advancements and functions — and the KubeJS server scripts.

To apply an edit to a data pack file, load the world again:

| Environment | How to apply the change |
| --- | --- |
| Single player | Leave to the title screen and open the world again. Restarting the game works too. |
| Server | Restart the server. |

- JSON parsing, holder resolution and codec validation all happen while the world loads, and every read skips entries that carry the `mxt:disabled` tag.
- The registries keep no previous snapshot, so an invalid definition stops the world from loading instead of being skipped. Fix or remove the file and load again; the log names the failing file and the codec error.
- The data pack registries are synchronised to the client by the vanilla mechanism when it joins. The client HUD, fog effects and textures are only responsible for display: they never decide the result of resource deduction, breakthroughs, forging or currency exchange.
- `/mxt aura query` queries the final aura at the current position, and `/mxt aura vein` queries spirit stone vein information.
- The test mod data lives in `src/test-mod/resources/data/mxt_test/mxt`; starting the test server verifies the whole data pack loop.

A first definition is easier to write by copying a complete file: continue with [Datapack Examples](./examples.md), and see [Commands](../player-guide/commands.md) for the full command list.

## Error Reporting

- A missing required holder reference, an unknown `type`, a malformed formula or any other codec error fails the whole load rather than skipping the broken file.
- Because there is no previous snapshot to fall back on, a broken file prevents the world from loading until it is fixed; the log reports the file and the codec error.
- Errors are collected, not thrown one at a time: the loader lists every failing entry of a load and then fails the load, so a data pack with several broken formulas shows all of them in one report instead of only the first.
- An expression that names a variable its context cannot provide is reported when it is evaluated: a development environment logs the whole error, production logs one warning line per distinct message, and both continue with `0`.
- A `NaN` or infinity produced at runtime is reported the same way and is handled as `0` instead of aborting the operation.
- The loading contract is defined by the codecs, so the mod does not report fields it does not know: silently ignored unknown fields are not errors.

::: info

For a definition that is not finished yet, prefer adding it to the `mxt:disabled` tag instead of deleting the file, so other definitions that hold its holder reference keep resolving. The tag only stops the entry from being used; a file that cannot be decoded is still an error.

:::

## Related Pages

- [Tutorials](../tutorial/index.md)
- [Datapack Examples](./examples.md)
- [Loot and Advancement Criteria](./loot-and-criteria.md)
- [Registry List](./json/index.md)
- [Types Reference](./types/index.md)
- [KubeJS](../kubejs/index.md)
- [Java API](../java/index.md)
