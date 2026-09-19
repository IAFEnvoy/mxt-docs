---
title: Registries and Data Tables
description: How MiXianTu registers built-in MapCodec types, which codec each definition exposes, and how to read the datapack data tables.
---

# Registries and Data Tables

MiXianTu has two kinds of registries. Built-in registries hold the `MapCodec` implementations that a datapack selects with the `type` field, and are populated in Java code. Dynamic data tables are native datapack registries whose entries live in JSON files: Minecraft reads them while the world loads, and they are synchronised to the client by the registry system. Because they are read at world load, `/reload` does not re-read them — see [Loading, Reloading and Syncing](../datapack/overview.md#loading-reloading-and-syncing).

## Built-In Type Registries

Built-in registries use NeoForge's `DeferredRegister<MapCodec<?>>`, and a datapack is dispatched to the matching implementation through `type`:

```java
public static final DeferredRegister<MapCodec<? extends Cost>> REGISTRY =
        DeferredRegister.create(MxtRegistries.COST_TYPE, MiXianTu.MOD_ID);
```

The registry instances are declared in `MxtRegistries`, and their keys are declared once in `MxtResourceKeys`:

| Registry | Key | Contents |
|----------|-----|----------|
| `MxtRegistries.ABILITY_TYPE` | `mxt:ability_type` | Ability type codecs. |
| `MxtRegistries.ABILITY_TARGET_SELECTOR_TYPE` | `mxt:ability_target_selector_type` | Ability target selector codecs. |
| `MxtRegistries.COST_TYPE` | `mxt:cost_type` | Cost type codecs. |
| `MxtRegistries.CURSE_TYPE` | `mxt:curse_type` | Curse type codecs. |
| `MxtRegistries.DATA_STORAGE_TYPE` | `mxt:data_storage_type` | Storage kind codecs, dispatched by a host's `components` entry; the built-in ones are registered in `MxtDataStorages`. |
| `MxtRegistries.TRIGGER_TYPE` | `mxt:trigger_type` | Ability trigger codecs. |
| `MxtRegistries.NUMBER_PROVIDER_TYPE` | `mxt:number_provider_type` | Number provider codecs. |
| `MxtRegistries.AURA_MAXIMUM_TYPE` | `mxt:aura_maximum_type` | Aura maximum codecs. |
| `MxtRegistries.FORMULA_FUNCTION` | `mxt:formula_function` | Formula functions available to expressions. |
| `MxtRegistries.FORMULA_VARIABLE` | `mxt:formula_variable` | Built-in formula variables. Each entry reads a number out of the objects the formula context carries, and a data pack cannot add entries; the names are listed in [Formula Variables](../datapack/types/formula_variables.md). |
| `MxtRegistries.RESOURCE_VALUE_PROVIDER_TYPE` | `mxt:resource_value_provider_type` | Resource value provider codecs. |
| `MxtRegistries.ENTITY_ACTION_TYPE` | `mxt:entity_action_type` | Entity action codecs. |
| `MxtRegistries.BI_ENTITY_ACTION_TYPE` | `mxt:bi_entity_action_type` | Bi-entity action codecs. |
| `MxtRegistries.BLOCK_ACTION_TYPE` | `mxt:block_action_type` | Block action codecs. |
| `MxtRegistries.ITEM_ACTION_TYPE` | `mxt:item_action_type` | Item action codecs. |
| `MxtRegistries.ENTITY_CONDITION_TYPE` | `mxt:entity_condition_type` | Entity condition codecs. |
| `MxtRegistries.BI_ENTITY_CONDITION_TYPE` | `mxt:bi_entity_condition_type` | Bi-entity condition codecs. |
| `MxtRegistries.BLOCK_CONDITION_TYPE` | `mxt:block_condition_type` | Block condition codecs. |
| `MxtRegistries.ITEM_CONDITION_TYPE` | `mxt:item_condition_type` | Item condition codecs. |
| `MxtRegistries.DAMAGE_CONDITION_TYPE` | `mxt:damage_condition_type` | Damage condition codecs. |
| `MxtRegistries.RESOURCE_BAR_RENDER_DATA_TYPE` | `mxt:resource_bar_render_data_type` | Resource bar render data codecs. |
| `MxtRegistries.RESOURCE_BAR_CONTEXT` | `mxt:resource_bar_context` | Resource bar contexts. |
| `MxtRegistries.RESOURCE_BAR_VISIBILITY_TYPE` | `mxt:resource_bar_visibility_type` | Resource bar visibility codecs. |
| `MxtRegistries.ITEM_MATCHER_ENTRY_TYPE` | `mxt:item_matcher_entry_type` | Item matcher entry codecs. |
| `MxtRegistries.FORMATION_ACTION_TYPE` | `mxt:formation_action_type` | Formation module codecs, dispatched by a module's `type`; the built-in ones are registered in `MxtFormationActionTypes`. |
| `MxtRegistries.TIMELINE_ENTRY_TYPE` | `mxt:timeline_entry_type` | Tribulation timeline entry codecs, dispatched by an entry's `type`; the built-in ones are registered in `MxtTimelineEntries`. |

The built-in types are grouped and registered by classes such as `MxtEntityActions`, `MxtBiEntityActions`, `MxtBlockActions`, `MxtItemActions` and `MxtEntityConditions`. Registering a new built-in type means providing a `MapCodec` and adding it to the matching `DeferredRegister`; a data pack never adds entries to these registries.

These registries are open to other mods: a third-party module may add its own codecs to any of them — the built-in trigger table documents this explicitly — and the new `type` ids then become available to datapacks.

## Formula Variables

`mxt:formula_variable` holds the built-in variables a formula can read. An entry implements `FormulaVariable` and reads its number out of the objects the `FormulaContext` carries, so nothing is precomputed:

| Member | Description |
|--------|-------------|
| `names()` | The exact names the variable provides. They are indexed once, and a name may only be claimed by a single variable; a collision is reported. |
| `prefixes()` | Name prefixes the variable provides, each including its separator, such as `caster_`. A requested name that starts with a prefix is handed to the variable with that prefix removed. |
| `value(key, suffix, context)` | The value for a name the variable claimed. `key` is the name or prefix that matched and `suffix` is what follows it, so `caster_mxt_common` arrives as key `caster_` plus suffix `mxt_common`. Return `Double.NaN` to decline the name, which lets the next variable that claims it be asked; the resolver reports a declined or non-finite value once and continues with `0`. |

Register an entry with `DeferredRegister.create(MxtRegistries.FORMULA_VARIABLE, MODID)`. Unavailable names and non-finite values go through `FormulaDiagnostics`, which logs the whole error in a development environment and one warning line per distinct message in production, so an addon does not need its own error policy; problems a codec can already see while parsing are reported as decode errors instead. `FormulaNames` flattens a registry ID into a formula identifier and keeps the resource and attribute name indexes.

A requested name is split into the variables that claim it once per expression, not once per evaluation: `Expression` keeps the resulting binding next to its compiled exp4j expression, so a formula evaluated every tick resolves each name a single time and afterwards only re-reads the values. The names themselves are documented in [Formula Variables](../datapack/types/formula_variables.md).

## Dynamic Data Tables

Every table the mod declares is listed — with its file directory, its purpose and every field — in [JSON Data Formats](../datapack/json/index.md). An addon normally adds entries to those tables rather than new tables.

## Reading Data Tables

`MxtDatapackRegistries` is the supported entry point for both the server and the synchronised client copy. Every read skips entries that carry the mod's `mxt:disabled` tag.

| Member | Description |
|--------|-------------|
| `registries()` | Every registry key owned by the mod, in registration order. |
| `get(key, id)` / `get(key, holder)` | Reads an enabled value by ID or by holder. |
| `holder(key, id)` | Resolves an enabled entry while keeping its stable holder reference. |
| `holders(key)` | Streams all enabled entries of a registry. |
| `holders(access, key)` / `holders(provider, key)` | Streams enabled entries from a `RegistryAccess` or a `HolderLookup.Provider`, which is how the client reads the synchronised copy. |
| `get(access, key, id)` / `get(access, key, holder)` | Reads an enabled value from a client-synchronised lookup. |
| `isDisabled(key, id)` / `isDisabled(key, holder)` | Checks whether an entry carries the `mxt:disabled` tag. |
| `isTagged(key, id, tagId)` / `isTagged(key, holder, tagId)` | Checks a native datapack tag on one entry. |
| `size(key)` / `registry(key)` | The underlying `Registry`; only available while a server is running. |

::: info

`registry(key)` and `size(key)` throw an `IllegalStateException` when no server is running. On the client, use the `holders(access, key)` and `get(access, key, id)` overloads that take the synchronised lookup instead.

:::

## Codecs

A definition class exposes two codecs. `CODEC` reads and writes a `Holder<Definition>` reference and is what a field or another JSON file uses to point at a definition; `DIRECT_CODEC` reads and writes the whole object and is what a datapack registry uses for the entry itself. Read `DIRECT_CODEC` when you need the values of a definition, for example `Resource.DIRECT_CODEC` or `ItemQuality.DIRECT_CODEC`.
