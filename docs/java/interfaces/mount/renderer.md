---
title: MountRenderer
---

# MountRenderer

**让别的模组决定载具怎么画。** `mxt:mount` 本身是"这件法器是飞行法器"的声明，怎么画只是它顺带回答的一半；一个实体类型只能有一个渲染器，所以载具实体自己只负责摆好朝向、再挑一个渲染器，画什么由数据包 `mxt:mount` 的 `render` 决定。**渲染器类型就是一个注册进固有分派表 `mxt:mount_render_type` 的 `type`**：数据侧交出自己 `MountRender` 实现的 `MapCodec`，客户端交出那个画东西的对象，数据包随后就能写 `{"type": "<你的 id>", ...你自己的字段}`。

## 两处注册

自己的类型要注册两件东西，**以同一个 codec 对象为键**（不是 id，所以两边不可能写歪）：

| 在哪 | 注册什么 | 什么时候 |
| --- | --- | --- |
| common | 一个 `MapCodec<? extends MountRender>`，用自己的 `DeferredRegister` 注册进 `mxt:mount_render_type` | 模组构造期 |
| client | 实现 `MountRenderer` 的那个渲染器，调 `MountRenderers.register(codec, renderer)` | 客户端初始化 |

```java
public static final DeferredRegister<MapCodec<? extends MountRender>> REGISTRY =
        DeferredRegister.create(MxtRegistries.MOUNT_RENDER_TYPE, MyMod.MOD_ID);
public static final DeferredHolder<MapCodec<? extends MountRender>, MapCodec<MyRender>> MY_RENDER =
        REGISTRY.register("my_vehicle", () -> MyRender.CODEC);

MountRenderers.register(MyRender.CODEC, new MyVehicleRenderer());
```

## 渲染器拿到什么

`MountRenderer` 有三个方法：`createState()` 造一份**每辆车每帧一份**的草稿状态（别指望它跨帧），`extract(definition, context, state)` 在这一帧提取，`submit(definition, context, state, poseStack, collector, camera)` 真正画。`submit` 拿到的还是**同一份 context** 与你自己造的那份状态。

`MountRenderContext` 是只读的，一帧快照一次：

| 成员 | 说明 |
| --- | --- |
| `visual()` | 载具承载的那件物品；它的定义也是从这里读的 |
| `vehicle()` | 载具实体本身，id / 乘客 / 维度都从它读 |
| `display()` | 定义里写的 `display`，**可能为空**——空就用你这个渲染器自己的默认姿势 |
| `yRot()` / `xRot()` / `partialTick()` | 朝向、俯仰与部分刻 |
| `lightCoords()` | 光照 |
| `motion()` / `crew()` / `riders()` | 两条**姿态轴**与乘客数：运动组（`idle` / `moving` / `ascending` / `descending`）与载员组（`empty` / `ridden` / `carrying`） |

三条边界：

- **姿态栈交给你时已经站在载具原点、已经转过 yaw，`pitch` 没有转。** 声明过的 `display` 是在"已转 yaw、未俯仰"的坐标系里写的，所以俯仰要你自己接（内置两个渲染器的顺序都是 `translation → pitch → rotation → scale`）。
- **服务端永远不解析渲染器**：类型注册在 common、渲染器注册在 client，中间靠 codec 对上。所以**这台机器没有对应渲染器时回落成 `mxt:item` 并记一条警告**（不是报错）——同一份数据包要在装了与没装 GeckoLib 的两台机器上都能进。
- **没注册的 `type` 才是加载期错误**：那个模组不在时，数据包写它的 `type` 会报"未知注册表键"，这是有意的响亮失败，不是静默回落。

`states` 怎么写、七个姿态怎么判、`display` 的默认值见 [载具渲染器类型](../../../datapack/types/other/mount-render.md)。
