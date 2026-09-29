---
title: mount_render_type（载具渲染器）
description: mxt:mount_render_type 的内置条目、字段、GeckoLib 资源路径与七个姿态。
---

# mount_render_type（载具渲染器）

## `mount_render_type`

[`mxt:mount`](../../json/ability.md) 的 `render` 用这一族选一套渲染器画载具。数据包只能选用已注册的类型，不能新增。渲染只发生在客户端：专用服务端把 `render` 当一段普通数据解开，既不画也不判断这台机器有没有对应的渲染器。

```json
"render": {
  "type": "mxt:geckolib",
  "model": "example:vehicle/azure_sword",
  "texture": "example:textures/entity/vehicle/azure_sword.png"
}
```

内置两档，内容模组也能注册自己的类型，见下方的「自定义渲染器」。

### `mxt:item`

画承载物品的物品模型，用的是展示框那套上下文（原始大小、没有位移的卡片）。**默认就是它**：`render` 整个不写等于选它。

它没有自己的字段。这一档会自动把模型底面贴到碰撞箱底面，所以换任何物品模型都落在同一个平面上；[`display`](../../json/ability.md#mount-render) 不写时是 `[0,0,0]` / `[90,0,-45]` / `[2,2,2]`。

### `mxt:geckolib`

用 GeckoLib 的模型与动画画。**要求客户端装了 GeckoLib**；没装时只在客户端记一条警告，然后按 `mxt:item` 画（数据包照常加载、照常能飞）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `model` | 模型资源 id | **必填** | 模型文件。 |
| `texture` | 贴图 id | **必填** | 贴图。 |
| `animations` | 动画资源 id | 无 | 动画文件；不写就是静态模型，连动画文件都不查。 |
| `states` | 对象 | 无 | 姿态到动画名的映射，见下表。 |
| `transition_ticks` | int | `5` | 两条动画控制器共用的过渡刻数。 |
| `scale` | double | `1` | 乘在模型自己的尺度上。 |

**三个资源 id 要写成 GeckoLib 缓存键那副样子**（它自己的加载器会把前缀与后缀剥掉当键）：`assets/<命名空间>/geckolib/models/<路径>.geo.json` 写成 `"<命名空间>:<路径>"`，动画文件同理放在 `assets/<命名空间>/geckolib/animations/<路径>.animation.json`，贴图就是普通贴图 id。

| `states` 的键（姿态） | 客户端判据 | 说明 |
| --- | --- | --- |
| `idle` | 这一 tick 位置没变 | 悬停。**朝向变化不算**——驾驶者转头不会被判成在飞 |
| `moving` | 水平位移超过阈值 | 平飞 |
| `ascending` | 竖直向上位移超过阈值 | 爬升；**竖直优先于水平**，所以爬升时不再是 `moving` |
| `descending` | 竖直向下位移超过阈值 | 俯冲 |
| `empty` | 乘客数 `0` | 空车（起剑那一瞬间才可能出现：没人开的载具会自清） |
| `ridden` | 乘客数 `1` | 只有驾驶者 |
| `carrying` | 乘客数 `≥ 2` | 后座有人（多座位载具） |

两组（`idle` / `moving` / `ascending` / `descending` 是**运动**组，`empty` / `ridden` / `carrying` 是**载员**组）各自是一个**总函数**：任何时刻每组恰好命中一个值，两组各由一条动画控制器播放，所以「载人爬升」是两条动画同时播（各管自己的骨骼）。`states` 把姿态映射到**动画文件里的动画名**；**没写的项按姿态自己的名字取**（例如只写 `{"moving": "fly"}` 时，`idle` 仍然去找名叫 `idle` 的动画）。**动画名在文件里不存在时不播**（模型保持静止姿势）并按「动画文件 + 名字」记一条警告，不是每帧刷屏。

这一档**不自动贴地**：模型在建模软件里就以载具原点为原点，要挪就写 `display.translation`。`display` 不写时是 `[0,0,0]` / `[0,0,0]` / `[1,1,1]`。

```json
{
  "type": "mxt:mount",
  "speed": 0.12,
  "render": {
    "type": "mxt:geckolib",
    "model": "example:vehicle/azure_sword",
    "texture": "example:textures/entity/vehicle/azure_sword.png",
    "animations": "example:vehicle/azure_sword",
    "states": { "idle": "hover", "moving": "fly", "ascending": "climb", "descending": "dive" },
    "transition_ticks": 5
  }
}
```

### 自定义渲染器

渲染器是客户端的 Java 对象，数据包与脚本都进不来。内容模组注册一档之后，数据包就能写 `{"type": "<那个模组的 id>", ...它自己的字段}`。三条边界：

- **类型没注册**时写这个 `type` 会在加载期报「未知注册表键」——响亮的失败，不是静默回落。
- **注册了类型、但这台客户端没有对应渲染器**（例如渲染器来自一个没装的模组）时回落到物品模型，并记一条警告。
- **服务端永远不解析渲染器**：自定义类型在专用服务端上只是一段解出来的数据。

怎么注册见[载具渲染器](../../../java/interfaces/mount/renderer.md)。
