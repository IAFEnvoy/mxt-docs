---
title: Datapack Examples
description: "Complete JSON examples for MiXianTu data packs: resources, item aura, cultivation actions, item bindings and physiques, each with the registry it belongs to."
---

# Datapack Examples

The examples below chain the common systems into a minimal loop: resources, realms, the aura environment, cultivation actions and item fuel all come from the data pack, while the physical items are still registered by KubeJS or another mod.

Read [Datapack Overview](./overview.md) first if you are not yet familiar with file locations, IDs and the `mxt:disabled` tag.

## Example Layout

A small data pack with these files looks like this:

```text
data/example/mxt/resource/spirit_power.json
data/example/mxt/element/common.json
data/example/mxt/realm_stage/qi_condensation.json
data/example/tags/mxt/resource/disabled.json
```

## Disabling a Definition

This is a tag file, not a registry entry. It belongs to the `mxt:disabled` tag of the target registry — here `resource` — and each listed ID stops being used by the matching service while staying resolvable for other definitions.

```json
{
  "replace": false,
  "values": ["example:old_resource"]
}
```

Do not replace vanilla tags with a custom `tags` key: tag files always live under `data/<namespace>/tags/...`. See [Disabling a Definition](./overview.md#disabling-a-definition) for the fixed path and the full rules.

## Resource: Qi

Registry: `resource` — [Resource](./json/resource.md), plus its cultivation behaviour in [Aura (aura)](./json/aura.md).

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "order": 10,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1},
      "value_display": "current_and_maximum"
    }
  ]
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "regen": 0.25
}
```

The maximum is a formula that reads the realm rank and the aura the player has absorbed, and the inline bar draws the current and maximum value on a boss bar. The value stores nothing about cultivation: the `aura` definition points back at it through `resource`, adds a passive regeneration and enters the realm chain at `example:foundation`.

## Item Aura: Spirit Stone

Registry: `item_aura` — [Item Aura](./json/item_aura.md).

```json
// data/example/mxt/item_aura/spirit_stone.json
{
  "items": "mxt:spirit_stone",
  "type": "example:spirit_power",
  "aura": 100,
  "consume_speed": "0.5 + level * 0.05",
  "release_speed": 2,
  "exhausted_action": {"type": "mxt:no_op"}
}
```

`items` uses an [item matcher](./overview.md#holders-tags-and-matchers), so an item tag works here as well as a single item ID. `type` is the **aura** the item carries, not the stored value: the value itself is read from that aura's `resource`.

## Cultivation Action: Meditation

Registry: `cultivate_action` — [Cultivate Action](./json/cultivate_action.md).

```json
// data/example/mxt/cultivate_action/meditation.json
{
  "start_condition": {"type": "mxt:aura_range", "aura": {"example:spirit_power": {"min": 90, "max": 100000}}},
  "condition": {"type": "mxt:aura_range", "aura": {"example:spirit_power": {"min": 90, "max": 100000}}},
  "absorb_amount": "1 + level * 0.1",
  "aura_costs": [{"type": "mxt:aura", "aura": "example:spirit_power", "amount": 1}],
  "aura_gains": [{"id": "example:qi", "amount": "2 + level * 0.1"}],
  "tick_interval": 20,
  "tick_action": {"type": "mxt:no_op"}
}
```

There is no environment-kind field: where the action may be practised is said with `start_condition`, checked once when it starts, and `condition`, checked before every tick. Both read the environment and can demand a concentration, a dimension, a block or a biome. The amount absorbed scales with the player's level.

## Item Binding: Granting a Spirit Root

Registry: `item_binding` — [Item Binding](./json/item_binding.md).

```json
{
  "items": ["kubejs:root_pellet", "#example:root_pellets"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "quality_chain": "example:root_pellet"
}
```

`kubejs:root_pellet` must already be registered, for example by a KubeJS startup script ([KubeJS](../kubejs/index.md)); the binding only attaches the action to it.

## Physique: Innate Sword Bone

Registry: `physique` — [Physique](./json/physique.md).

```json
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

The entity condition decides who may hold the physique, the attribute modifiers are applied while it is held, and `granted_abilities` lists the abilities it grants.

## Item Binding: Granting a Physique

Registry: `item_binding` — [Item Binding](./json/item_binding.md).

```json
{
  "items": "kubejs:body_pill",
  "actions": [
    {"type": "mxt:grant_physique", "physique": "example:innate_sword_bone"}
  ]
}
```

This is the other half of the pair: the pill grants the `example:innate_sword_bone` physique whose own condition is checked when it is applied.

## Where to Go Next

- [Tutorials](../tutorial/index.md) — the same content built up step by step, with verification steps.
- [Registry List](./json/index.md) — every registry with its directory and purpose.
- [Types Reference](./types/index.md) — the actions and conditions used above.
- [KubeJS Examples](../kubejs/examples.md) — register the items these bindings refer to.
