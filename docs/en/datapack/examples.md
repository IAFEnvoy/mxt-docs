---
title: Datapack Examples
description: "Data pack files you can copy outright: switching a definition off, resources and aura, cultivation actions, item bindings and physiques."
---

# Datapack Examples

Every block below carries its own full path above it, so copy the directories along with the file.

## Layout

```text
data/example/mxt/resource/spirit_power.json
data/example/mxt/element/common.json
data/example/mxt/realm_stage/qi_condensation.json
data/example/mxt/aura/qi.json
```

`resource/spirit_power.json` is the value definition that `type` points at in the `item_aura` example below. Element definitions and realm stages (`element/common.json`, `realm_stage/qi_condensation.json`) belong to two other pages and are written the same way as the ones here.

## Switching a Definition Off

Written in **the definition's own file**: when `neoforge:conditions` does not hold, the entry never enters the registry.

```json
// data/example/mxt/resource/old_resource.json
{
  "neoforge:conditions": [
    { "type": "neoforge:mod_loaded", "modid": "example_addon" }
  ],
  "default_value": 0.0
}
```

When the condition holds, `neoforge:conditions` is stripped before the definition decoder sees it, and the remaining fields are read as usual. The conditions available, and the price of there being no middle state, are on [Datapack Development Overview](./overview.md#disabling-a-definition).

Do not invent a `tags` key in place of the vanilla tags; tag files live under `data/<namespace>/tags/...`, and **a tag cannot switch an entry off** (tags are not bound yet when a registry entry is decoded).

## Aura, Elements and Common Bindings

These examples chain the common systems into one minimal loop: resources, realms, the aura environment, cultivation actions and item fuel all come from the data pack; the items you can actually hold are still registered by KubeJS or another mod, and the data pack only attaches values to them. The data map files below all live under `data/mxt/data_maps/item/` (block-keyed tables under `data/mxt/data_maps/block/`) - the first namespace is the table's own `mxt`, not the content pack's, so a content pack adds values by dropping another file into that directory.

Resource definition. `max` is an expression, one entry in `bars` adds an on-screen bar for this resource, `renderer` uses the `mxt:boss_bar` atlas, and `bar_index` picks which cell of that atlas.

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "bars": [
    {
      "anchor": "left",
      "order": 10,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1},
      "value_display": "current_and_maximum"
    }
  ]
}
```

Aura definition. `resource` says which value this aura is recorded on, and `first_realm` is the entry realm of its cultivation chain.

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": 0,
  "first_realm": "example:foundation"
}
```

Item aura. This is an item data map: the value sits in `values` and its key is the item itself, `type` points at a value definition, and `consume_speed` and `release_speed` decide how fast aura flows in and out while right-click is held; `exhausted_action` runs when the reserve bottoms out.

```json
// data/mxt/data_maps/item/item_aura.json
{
  "values": {
    "mxt:spirit_stone": {
      "type": "example:spirit_power",
      "aura": 100,
      "consume_speed": "0.5 + level * 0.05",
      "release_speed": 2,
      "exhausted_action": {"type": "mxt:no_op"}
    }
  }
}
```

Cultivation method. `aura_costs` takes only `mxt:aura` entries and pays from the shared aura pool under the cultivator; `tick_interval` is how many ticks apart a settlement happens — `cultivate_action` runs on that tick, while `tick_action` runs on every tick.

```json
// data/example/mxt/cultivation/meditation.json
{
  "absorb_amount": "1 + level * 0.1",
  "aura_costs": [{"type": "mxt:aura", "aura": "example:spirit_power", "amount": 1}],
  "tick_interval": 20,
  "tick_action": {"type": "mxt:no_op"},
  "cultivate_action": {"type": "mxt:no_op"}
}
```

Item binding. This is an item data map too: an item ID and an item tag each take one key inside `values`; `actions` run when the item is used, and this one grants a spirit root.

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:root_pellet": {
      "actions": [
        {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
      ]
    },
    "#example:root_pellets": {
      "actions": [
        {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
      ]
    }
  }
}
```

Physique. `holder_condition` decides who may hold it, `attribute_modifiers` use vanilla attributes, and `granted_abilities` references ability ids.

```json
// data/example/mxt/physique/innate_sword_bone.json
{
  "holder_condition": {
    "type": "mxt:has_spirit_root",
    "spirit_root": "example:fire_root"
  },
  "attribute_modifiers": [
    {"attribute": "minecraft:attack_damage", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value"}
  ],
  "granted_abilities": ["example:sword_focus"]
}
```

Now bind the same kind of pill again, this time granting the physique above. One item can only match one binding; on a conflict the highest `priority` wins, and a tie goes to whichever value was processed later.

```json
// data/mxt/data_maps/item/item_binding.json (one table may have several files, and several values may share one values object)
{
  "values": {
    "kubejs:body_pill": {
      "actions": [
        {"type": "mxt:grant_physique", "physique": "example:innate_sword_bone"}
      ]
    }
  }
}
```
