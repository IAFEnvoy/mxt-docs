---
title: MountVehicle
---

# MountVehicle

**Let another mod ship a mount body of its own.** The `entity_type` of a `mxt:mount` only names an **already registered entity type** (leave it out and the framework's own `mxt:flying_sword` is used); at take-off the framework creates an entity of that type and talks to it through this contract alone. A pack author can therefore point at a skiff, a palanquin or an airship the addon registers, without the framework changing a line.

## Two registrations

A body that wants to be a mount registers two things:

```java
// common: the entity class implements MountVehicle, and the type is registered as usual
public final class MySkiff extends Entity implements MountVehicle { /* the seven members */ }

public static final DeferredHolder<EntityType<?>, EntityType<MySkiff>> MY_SKIFF =
        REGISTRY.registerEntityType("my_skiff", MySkiff::new, MobCategory.MISC,
                b -> b.noLootTable().sized(1.4F, 0.6F));

// client: that entity type needs a renderer of its own - vanilla allows one per type
event.registerEntityRenderer(MY_SKIFF.get(), MySkiffRenderer::new);
```

## The Seven Members

| Member | What it is |
| --- | --- |
| `setVisual` | The artifact handed in at take-off. |
| `visual` | Reads it back; the `mxt:mount` definition is read from it too. **The framework empties it once the artifact has been handed back**, so "already empty" means this flight is settled. |
| `setOwner` | Whose mount this is; the framework writes it at take-off. |
| `setFlightSpeed` | The speed of this flight, already clamped from "the definition's speed x the skill's multiplier". |
| `seats` | How many the body carries in total, driver included. |
| `freeSeats` | How many of those are still free. |
| `mountDefinition` | Which `mxt:mount` definition this flight is flying; empty when it cannot be read. |

**The owner side is vanilla `OwnableEntity`**: this contract extends it, so the one thing an implementing entity hands out is `getOwnerReference()` (the owner reference, empty when there is none) - `getOwner()` / `getRootOwner()` come from vanilla and `level()` from `Entity`, so there is no owner of your own to keep in sync. **The artifact is the framework's business too**: when the mount leaves, the framework hands it back to the owner, and when the owner is offline or in another dimension it drops where the mount left. Landing, `/kill` and the entity discarding itself all take that one path, while unloading or changing dimension is not a departure - the artifact stays inside the mount and comes back with it. **There is no hand-back to implement**: the only requirement is that `visual()` still holds the artifact when the mount leaves.

## Everything Else Belongs to the Entity

- **Movement and the landing test**: the framework only reads `horizontalCollision` / `verticalCollision`; how a boat moves and what counts as a collision is the entity's own code.
- **Seats and boarding**: how many, who may board and how all live on the entity.
- **Size and sitting pose**: the collision box, the seat points and the pose `sit` asks for are the entity's to place.
- **Trails, saving and syncing**: particles, stored data and what the client is told are its business too.
- **The definition's own fields** (`width` / `height` / `seat_offsets` / `sit` / `step_height` / `render` / `display`) **have to be read by that entity**; a field nobody reads is a field that does nothing.

The framework **ships no base class** - its own mount entity is `final` - so a difference like a boat's movement over water is written entirely by the addon, which is exactly why this contract exists.

## Three Boundaries

- **An id that is not registered is a load-time error**: an `entity_type` naming one goes through the vanilla entity type registry like any other registry reference, so it fails at load.
- **A type that exists but does not implement the contract is refused at take-off**: the player still sees "cannot be boarded", and the log names that type, once per type. **Load time cannot decide this** - whether an interface is implemented is only known at runtime.
- **Creation happens on the server only**: the client creates nothing and draws whatever that entity type's own renderer draws.

For how to write `entity_type`, see [Ability Types · `mxt:mount`](../../../datapack/types/other/ability#mxt-mount); for the drawing half, see [MountRenderer](./renderer.md).
