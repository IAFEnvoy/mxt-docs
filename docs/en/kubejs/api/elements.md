---
title: 'MxtElements: Elements and Accumulation'
description: Read the elements an entity currently has in effect and the accumulation it has built up, and apply accumulation through the same pipeline a strike uses.
---

# `MxtElements`: Elements and Accumulation

Elements and accumulation are two different things: `list`/`has` read the spirit roots (what the body *is*), while `amount`/`attach` read and write a per-element accumulation table (how much it has *built up*). The four methods share one object, but they read two different states.

## Methods

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | The element IDs the entity's **currently active** spirit roots name, sorted. Disabled elements and switched-off roots contribute nothing; an entity with no roots answers an empty list. |
| `has(entity, element)` | `Entity`, element ID | `boolean` | Whether the entity's spirit roots name that element. |
| `amount(entity, element)` | `Entity`, element ID | `double` | How much of that element has built up on the entity; `0` when none has, and `0` for a disabled or unknown element. A client reads its synchronised copy. |
| `attach(entity, element, amount)` | `Entity`, element ID, finite number | `double` | Builds that element up on the entity (a negative amount wears it off) through the **same** pipeline a strike uses, and returns the new total. A qualifying [`element_reaction`](/en/datapack/json/element_reaction) fires as usual. |

`attach` is equivalent to the entity action `mxt:attach_element`, so a lava bath, a pill or a curse written from a script behaves the same way, and a negative amount cleanses. The three readers work on either side — the accumulation is a synchronised attachment, so a client script reads its local copy, which is exactly what an item tooltip does — and only `attach` is a server operation: on a client, or with an unknown or disabled element, a non-finite value or `0`, it returns `0` and changes nothing.

```js
// kubejs/server_scripts/mxt_element.js
PlayerEvents.tick(event => {
  const player = event.player
  if (player.level().isClientSide()) return
  // "has a water root and has built up 8 fire" — visible before any reaction fires.
  if (MxtElements.has(player, 'mxt_test:water') && MxtElements.amount(player, 'mxt_test:fire') >= 8) {
    console.info(`water cultivator carrying ${MxtElements.list(player)}`)
  }
})

// Let a custom event build fire up on a target; the element_reaction in the data pack settles it.
MxtElements.attach(target, 'mxt_test:fire', 4)
```

## Related

- Data pack side: [`element`](/en/datapack/json/element) and [`element_reaction`](/en/datapack/json/element_reaction).
- Where elements come from: [MxtSpiritRoots](/en/kubejs/api/spirit_roots) (the element a root binds) and [MxtAura](/en/kubejs/api/aura) (the aura around it).
- The element factors on the damage pipeline: [Damage](/en/technical/damage).
- [KubeJS API Reference](/en/kubejs/api-reference).
