---
title: Datapack Conventions
description: The rules every definition shares - reference syntax, tags, translation keys, how fields decode, numeric fields and actions and conditions.
---

# Datapack Conventions

This page covers the part **every definition follows the same way**: how to reference another entry, where names come from, what happens to a field you got wrong, and how to write a number. Which fields each registry has is not here; see [JSON Data Formats](/en/datapack/json/index).

## Reference Rules

- A single entry is referenced by the entry's own id; a field that accepts either an entry or a tag also takes `#tag`.
- When a required single entry reference names an entry the current pack does not provide, **the whole data pack load fails**. An optional reference may be omitted entirely, in which case the default in the field table applies; an element a tolerant list or map cannot decode is dropped by the rules below.
- The registries that claim items (`artifact`, `pill_binding`, `technique_binding`, `item_aura`, `default_quality`, `item_binding`, `weapon_binding`, `tool_binding`, `blueprint_binding`) all take an `ItemMatcher` in their `items` field: ids, tags, wildcards, regular expressions and mixed arrays are all accepted, and the three forms and seven entry types are on [`ItemMatcher`](/en/datapack/types/shared_data_types#itemmatcher); `currency` is the exception and calls the field `item`. The three that claim blocks — `block_aura`, `heat_source` and `spirit_herb` — have the same shape with a `blocks` field instead.
- When several definitions match the same item, selection goes by the `priority` each one declares, **highest first** (the field defaults to `0`), and a tie falls back to registry order. `block_aura` has **no** `priority`: when several definitions hit the same block they all apply and **add up**. Which one wins is decided by what the definitions write and has nothing to do with file names (the same direction as `priority` on `aura_zone` and `element_reaction`). **Which kind of matcher entry matched is irrelevant**: a definition that matches is ranked by the number it declares, and naming an item does not move it up.
- The vanilla tags are the only tag system; do not define a `tags` field inside JSON.

## Tags

### The Pass-Through Tag

The mod ships one tag that sits on a **vanilla registry**, so its path looks different — `tags/damage_type`, not `tags/mxt/...`:

```text
data/mxt/tags/damage_type/no_bonus.json
```

A damage type listed in `mxt:no_bonus` takes no part in damage bonus settlement: no progression-level or affinity multiplier, no physique multiplier, no `overcomes`/`adapted_to` relation read, and no element buildup either. The number is handed to vanilla as it arrived, and vanilla's own mitigation (armour, enchantments, resistance, absorption, invulnerability frames) still applies. By default it holds two: the void damage `minecraft:out_of_world`, and `mxt:lifespan`, which the mod uses for a lifespan running out; a content pack can append at the same path (`replace: false`) or replace it outright (`replace: true`). See [The damage system](/en/technical/damage).

### The Mod's Own Grouping Tags

The mod also ships a few **grouping tags** for its own items and blocks, at the vanilla path `data/mxt/tags/<registry>/<name>.json`; a content pack appends to them with `replace: false`:

| Tag | Kind | What it holds |
| --- | --- | --- |
| `#mxt:spirit_stones` | item | The four spirit stones, lesser to supreme: `mxt:spirit_stone`, `mxt:medium_spirit_stone`, `mxt:high_spirit_stone` and `mxt:supreme_spirit_stone`. |
| `#mxt:coins` | item | The six coins: copper, iron, gold, diamond, emerald and netherite (`mxt:copper_coin` onwards). |
| `#mxt:workstations` | item + block | The blocks a player operates: the exchange station, cheque table, trade station, system station, spirit crafting table, forging table and talisman workstation. |
| `#mxt:display_stands` | item + block | The six wooden display stands. |

These are **grouping only** - nothing in the mod reads them - so they are there for recipe ingredients, claiming tables and conditions to reference (an ingredient can simply say `"#mxt:coins"`). A few other tags do carry meaning (`#mxt:talisman_paper`, `#mxt:brush_pigment`, `#mxt:back_equipable` / `#mxt:belt_equipable`); what they are for is on their own pages.

## Translation Keys

### A Definition's Name and Description

The display name of a data-driven definition generates its translation key automatically from the identifier: `<registry namespace>.<category>.<namespace>.<path>`. The category is the registry's own path, and the **registry namespace is always `mxt` for MiXianTu's own registries** (their keys are all written `mxt:<path>`), so every definition key of this mod starts with `mxt.`: `mxt:fire` in `aura` reads `mxt.aura.mxt.fire`, `example:qi` in `resource` reads `mxt.resource.example.qi`, and `mxt_test:flame_sigil` in `talisman` reads `mxt.talisman.mxt_test.flame_sigil`. There is no exception table for the category (`example:refined` in `mxt:quality` reads `mxt.quality.example.refined`). A `/` in the path goes into the key **as written** and is not turned into `.` (`example:foo/bar` produces `mxt.resource.example.foo/bar`), so sorting into subdirectories by category does not introduce a second set of translation-key rules.

JSON has **no** `translation_key` field, and the definitions of these 24 registries **store no text at all**; their names and descriptions are always derived from the registered id: `resource`, `aura`, `realm_stage`, `element`, `spirit_root`, `physique`, `ability`, `curse`, `technique`, `progression`, `cultivation`, `artifact`, `medicinal_property`, `spirit_herb`, `alchemy_furnace`, `alchemy_wall_material`, `pill`, `pill_binding`, `formation`, `tribulation`, `secret_realm`, `contract_type`, `talisman`, `quality`. They carry no `name` / `description` field, and writing one is not read; **the only way a pack can give a definition words is to translate the generated key above**. The description key is the name key plus `.description`.

**Only four kinds of definition draw a description key: `quality` (the line under the quality name), `contract_type` (a contract scroll's tooltip), `pill` (the tooltip of an item the pill claims) and `technique` (a manual's tooltip, and the line a read manual prints in chat)** — and only when that key is actually translated: a key the language file does not have prints nothing at all, never the key name itself; every other registry's description key is read by no screen or tooltip.

An untranslated name never puts a key on screen either: **where something has to be shown - a list row, a title, a panel entry, or an argument inside another sentence - the id stands in** (written like `mxt:aura/example.fire`, which still says which entry it is), and **where nothing has to be shown - a tooltip line that only acts as a heading, such as a pill's, a herb's or a furnace's definition name or a talisman type's usage line - the line is left out**.

`minor_stages` is not a list of names but a count: sub-stage names are always generated as `<this stage's name key>.minor_stage.<index>` (the registry namespace is part of it, and the index starts at `0`). A sub-stage the language file does not name is left out.

### Screen Titles

Each data pack registry's screen title has its own fixed key, `mxt.registry.<registry path>` (such as `mxt.registry.aura` and `mxt.registry.quality`), supplied by this mod's own language files; a data pack only has to provide the key above for its own definitions.

### Command Messages

Every line a command prints is written `command.mxt.<group>.<name>`: **the group is that command's own segment** (`command.mxt.quality.set`, `command.mxt.formation.bind.done`), so looking a line up means looking under the command. **The few lines every subcommand shares live under the `message` group** (`command.mxt.message.requires_player`, `command.mxt.contract.failure.<lowercase enum name>`), because "any subcommand may need it" is not itself a command.

**When one line is used by a command and by something else too, it stays on the other prefix** - shared text like this does not move into `command.*` (`block.mxt.rift.recolored` appears both under `/mxt rift` and in the rift block's own click message, `tooltip.mxt.talisman.mode.*` both in the tooltip and under `/talisman`), so one sentence never has two copies that can drift apart. Commands reference them; they do not rename them.

### Language Files

Translations go in `assets/<namespace>/lang/zh_cn.json` and `en_us.json`, with the full key written out and the two sets of keys matching. **Keys beyond definitions live here too**: items, blocks, screens, commands and tooltips all use the same vanilla language files.

## How Fields Decode

One file is one definition. What you write can end in exactly five ways; know what a mistake looks like before you look at any field.

**A key it does not recognise — dropped silently.** Decoding only reads the keys it knows; an extra key loads as usual, does nothing, and leaves no log line. When a field is renamed or removed no one will point it out for you, so **checking the field table yourself** is the only way to find out while upgrading a pack.

**A `type` it does not recognise — the load fails.** `type` is the dispatch key, and an unregistered value does not degrade into "does nothing"; it fails that definition's decode. A module's fields are almost all optional, and a silent degradation would turn a typo into something that stands there quietly doing nothing, so this one is loud.

**An empty table, an empty list, an invalid value — refused.** A condition that is always true or always false, a number out of range, a key that must be filled but is not: all of these fail the load.

**A tolerant collection — the bad entry is dropped, the rest carries on.** Some lists and maps are tolerant: an element that cannot be decoded logs one `Ignoring invalid list element` and is dropped. So "I wrote an id that does not exist in the array" usually shows up as that one entry being absent. **Cost arrays do not follow that rule**: one entry of an array such as `costs` that cannot be decoded fails the whole definition at load.

**Generic fields do not exist.** A definition has no `schema_version`, `enabled` or `tags`; "should this one enter the registry right now" is answered by `neoforge:conditions` below, not by writing a switch field.

A definition that fails to decode **keeps no previous snapshot**: the world stops loading outright, and that file has to be fixed before you can enter again. Several failures at once are listed together so they can be fixed in one pass.

## Disabling a Definition

**Disabling a definition is load-time work**: the NeoForge resource condition goes into the definition file itself, and an entry whose condition does not hold **never enters the registry**, so no service ever reads it. Every data pack registry uses the same set of conditions:

```json
{
  "neoforge:conditions": [
    { "type": "neoforge:never" }
  ]
}
```

The available conditions all live in the `neoforge:` namespace: `never` / `always` (no fields), `mod_loaded` (`modid`), `registered` (`registry`, defaulting to `minecraft:item`, plus `value`), `and` / `or` (`values`), `not` (`value`) and `feature_flags_enabled` (`flags`). A condition can be written in the file of **any** registry entry, and every data pack registry treats them the same way; one file is one definition, with no `values` wrapper at the top. When the condition holds, `neoforge:conditions` is stripped before the file is handed to the definition decoder, so the normal fields are read as usual. **A tag-based condition such as `tag_empty` cannot be used here**: tags are not bound yet at that layer of decoding and it throws outright; tag checks belong to recipes and loot tables, which load later.

**A condition that does not hold is not a load error**: the loader treats the entry as skipped and leaves only a DEBUG line, `Skipping loading registry entry … as its conditions were not met`, and the world loads as usual. So when "the file is right there but the game does not have it", that DEBUG line is the only clue — the default log level does not show it.

The price is that "gone" means gone: an entry whose condition fails is **the same as a definition that was never written**, and a reference pointing at it fails to decode along with it, so there is no middle state where the definition stays around but does not take effect. For a file you can copy outright, see [Datapack Examples](/en/datapack/examples).

> Spirit roots and physiques have a separate **toggle** (the `disabled_spirit_roots` / `disabled_physiques` in the `spirit_identity` attachment): switching one off means "still held, but inert". Operate it with the scripts `MxtSpiritRoots.setEnabled` / `MxtPhysiques.setEnabled`, or with the administrator commands `/mxt spirit_root enable|disable` and `/mxt physique enable|disable`; the mod ships no player-facing screen for it. It governs whether the body should use that one entry, which is a different question from taking the definition out of the data pack. Quality order is declared by the `quality` tiers themselves (each one's `quality` and `next`) and does not depend on tag order.

## Numeric Fields

A number can be written as a constant, an expression string or a number provider object:

```json
{
  "damage": 8.0,
  "speed": "2 + level * 0.1",
  "amount": {"type": "mxt:constant", "value": 10}
}
```

Expressions use exp4j. Variables are read on demand by the built-in variable table out of the objects the evaluation context carries (caster, target, resources, random source), and `params` can override or add variables. A formula problem that can be decided at load time (an empty expression, a syntax error, an invalid `params` and so on) is a decode error: the loader collects every failing entry and lists them together before failing the load. A variable name the context cannot provide is only found at evaluation — a development environment prints the full ERROR log, production prints one WARN line per distinct message, and both carry on with `0`. For the full fields and value ranges, see [Number Provider Types](/en/datapack/types/number_provider_types).

## Actions and Conditions

Behaviours are uniformly called `action` and are split by target into entity, item, block, bi-entity and so on. When several steps are needed, use meta actions such as sequence/choice/if_else. A `condition` restricts abilities, bound items, cultivation, realms and recipes. An array of actions or conditions is a shorthand meaning "run all of them in order".
