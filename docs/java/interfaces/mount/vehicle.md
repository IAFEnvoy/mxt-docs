---
title: MountVehicle
---

# MountVehicle

**让别的模组自带一种载具本体。** `mxt:mount` 的 `entity_type` 只点名一个**已注册的实体类型**（不写就是框架自带的 `mxt:flying_sword`），起剑时框架按它生成实体，之后只通过这份契约与它说话。写包的作者因此可以点上附属自己的"船 / 轿 / 飞舟"，不必改本体一行代码。

## 两处注册

一个实体要当载具，注册两样东西：

```java
// common：实体类 implements MountVehicle，实体类型照常注册
public final class MySkiff extends Entity implements MountVehicle { /* 七个方法 */ }

public static final DeferredHolder<EntityType<?>, EntityType<MySkiff>> MY_SKIFF =
        REGISTRY.registerEntityType("my_skiff", MySkiff::new, MobCategory.MISC,
                b -> b.noLootTable().sized(1.4F, 0.6F));

// client：这个实体类型要有自己的渲染器——原版一个实体类型只认一个
event.registerEntityRenderer(MY_SKIFF.get(), MySkiffRenderer::new);
```

## 七个方法

| 成员 | 说明 |
| --- | --- |
| `setVisual` | 起剑时把承载的那件法器交进来。 |
| `visual` | 读回那件法器；`mxt:mount` 定义也从它读。**框架交还之后会把它清空**，"已经清空"就等于这趟结清。 |
| `setOwner` | 这具载具归谁，起剑时框架写进来。 |
| `setFlightSpeed` | 这一趟的速度，框架已经把"定义的速度 × 术的倍率"夹好。 |
| `seats` | 这具载具总共能坐几个，含驾驶者。 |
| `freeSeats` | 还剩几个空位。 |
| `mountDefinition` | 这一趟飞的是哪条 `mxt:mount` 定义，读不出来就是空。 |

**主人那一侧走原版 `OwnableEntity`**：这份契约继承它，实现它的实体**只需要交出 `getOwnerReference()`**（主人引用，没有主人就给空）——`getOwner()` / `getRootOwner()` 从原版白拿，`level()` 由 `Entity` 提供，不用自己另存一份主人再去同步。**交出去的那件法器也归框架管**：载具离场时由框架还给主人，主人不在线或不在同一维度就落在载具离场的位置；落剑、被 `/kill`、实体自己丢掉都走同一条路（卸载与换维度不算离场，法器留在载具里跟着回来）。写载具的人**不需要实现任何归还逻辑**，只要自己离场时 `visual()` 还是那件法器就够了。

## 其余都是实体自己的事

- **移动与落剑判据**：框架只读 `horizontalCollision` / `verticalCollision`；船怎么走、什么时候算撞上，实体自己写。
- **座位与上座**：坐几个、谁能坐、怎么上，都在实体身上。
- **尺寸与坐姿**：碰撞箱、座位落点、`sit` 给的姿势，实体自己摆。
- **尾迹、存档与同步**：粒子、落盘、发给客户端的东西也都是它的。
- **定义里的字段**（`width` / `height` / `seat_offsets` / `sit` / `step_height` / `render` / `display`）**要它自己去读**，不读就等于那些字段对它无效。

本体**不提供基类**，自带那具载具实体是 `final` 的：所以"船"的水面移动这类差异化行为完全由附属自己写，这正是这份契约存在的理由。

## 三道边界

- **id 没注册＝加载期报错**：`entity_type` 里写一个没注册的 id，走的还是原版实体类型注册表那一套，加载期就报。
- **类型存在但没实现契约＝起剑被拒**：玩家看到的仍是"骑不上去"，日志点名是哪个类型、每个类型只记一次。**加载期判不了这件事**——"实不实现接口"只有运行期知道。
- **生成只发生在服务端**：客户端不生成，画什么由那个实体类型自己的渲染器决定。

`entity_type` 怎么写见[技能类型 · `mxt:mount`](../../../datapack/types/other/ability#mxt-mount)；渲染那一半见 [MountRenderer](./renderer.md)。
