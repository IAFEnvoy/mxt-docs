---
title: MountRenderer
---

# MountRenderer

**Let another mod decide how a mount is drawn.** A `mxt:mount` is itself the declaration that the artifact is a flying mount, and how it is drawn is only the half it answers along the way; one entity type can only have one renderer, so the mount entity itself only fixes the direction it faces and then picks a renderer, and what gets drawn is decided by the `render` block of the datapack's `mxt:mount`. **A renderer type is simply a `type` registered in the dispatch table `mxt:mount_render_type`**: the data side hands over the `MapCodec` of its own implementation, the client side hands over the object that draws, and a datapack can then write `{"type": "<your id>", ...your own fields}`.

## Two registrations

A type is registered twice, **keyed by the same codec object** (not by an id, so the two sides cannot drift apart):

| Where | What | When |
| --- | --- | --- |
| common | a `MapCodec<? extends MountRender>` registered into `mxt:mount_render_type` with your own `DeferredRegister` | during mod construction |
| client | the renderer implementing `MountRenderer`, passed to `MountRenderers.register(codec, renderer)` | during client setup |

```java
public static final DeferredRegister<MapCodec<? extends MountRender>> REGISTRY =
        DeferredRegister.create(MxtRegistries.MOUNT_RENDER_TYPE, MyMod.MOD_ID);
public static final DeferredHolder<MapCodec<? extends MountRender>, MapCodec<MyRender>> MY_RENDER =
        REGISTRY.register("my_vehicle", () -> MyRender.CODEC);

MountRenderers.register(MyRender.CODEC, new MyVehicleRenderer());
```

## What a renderer is handed

`MountRenderer` has three methods: `createState()` builds a scratch state that is **one per mount per frame** (never rely on it surviving a frame), `extract(definition, context, state)` captures this frame, and `submit(definition, context, state, poseStack, collector, camera)` draws. `submit` receives **the same context** and the same state you built.

`MountRenderContext` is read-only and snapshotted once per frame:

| Member | What it gives you |
| --- | --- |
| `visual()` | the item the mount carries; its definition is read from here too |
| `vehicle()` | the mount entity itself — its id, passengers and level all come from it |
| `display()` | the `display` the definition wrote, **possibly empty** — empty means use your own default pose |
| `yRot()` / `xRot()` / `partialTick()` | facing, pitch and partial tick |
| `lightCoords()` | packed light |
| `motion()` / `crew()` / `riders()` | the two **pose groups** plus the rider count: movement (`idle` / `moving` / `ascending` / `descending`) and crew (`empty` / `ridden` / `carrying`) |

Three boundaries:

- **The pose stack arrives standing at the mount's origin and already turned by yaw, but not pitched.** A declared `display` is authored in that yaw-turned, un-pitched frame, so applying the pitch is your job (both built-in renderers go `translation → pitch → rotation → scale`).
- **The server never resolves a renderer.** Types are registered on the common side and renderers on the client, matched through the codec. So **a machine that has no renderer for a type falls back to `mxt:item` and logs one warning** (not an error) — one pack has to load on a machine with GeckoLib and on one without.
- **An unregistered `type` is a load-time error.** When the mod that owns the type is missing, a datapack naming it reports an unknown registry key; that is a deliberate loud failure rather than a silent fallback.

For how to write `states`, how the seven poses are decided and what `display` defaults to, see [Mount Renderer Types](../../../datapack/types/other/mount-render.md).
