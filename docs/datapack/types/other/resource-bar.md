---
title: 资源条与灵气类型
description: 资源条的上下文、绘制器、显示条件与资源数值来源四族类型的全部 ID、字段、默认值、范围与颜色写法。
---

# 资源条与灵气类型

资源条写在 [resource](../../json/resource.md) 的内联 `bars` 里，一条资源条由三族类型拼成：上下文取数并决定布局，绘制器决定怎么画，显示条件决定画不画。资源数值来源是第四族，它只负责给一个数值解析出一个数字，由脚本求值。

四族都是模组注册的固有类型，数据包只能选用，不能新增。灵气区块的环境储存上限是另一族，见[灵气上限类型](./aura-maximum.md)。

## `resource_bar_context`

上下文从实体或客户端状态里提取当前值、最小值、最大值和最后变化 tick，并用传入的数值 ID 生成显示名。

上下文通过 **ID 字符串**选择，不是 `type` 对象：它写在资源条的 `context` 里，只写那一串 ID 本身。`context` 省略时按 `mxt:self_hud` 算。上下文没有 JSON 字段，数据包也加不了第六项。

| ID | 布局 | 说明 |
| --- | --- | --- |
| `mxt:self_hud` | 自我 HUD | 读取实体上存下来的数值 |
| `mxt:target_overlay` | 目标浮层 | 读取实体上存下来的数值 |
| `mxt:boss_overlay` | Boss 浮层 | 读取实体上存下来的数值 |
| `mxt:environment_concentration` | 自我 HUD | 只在客户端读同步下来的环境灵气模板 |
| `mxt:actual_concentration` | 自我 HUD | 只在客户端读同步下来的最终浓度 |

```json
{
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1}
    }
  ]
}
```

三个读已存数值的上下文在这条数值还没被初始化时不给值，那条资源条不画。两条浓度上下文要求这条数值有对应的[灵气定义](../../json/aura.md)：没有定义，或那个池子的最大值与当前值都不为正时，它们同样不给值。

两条浓度上下文报的最小值恒为 `0`，也没有变更时刻，所以 `mxt:recently_changed` 对它们永远不成立。显示名按数值名生成：`mxt:self_hud` 直接用数值名，`mxt:target_overlay` 与 `mxt:boss_overlay` 加「目标 / Boss」前缀，两条浓度上下文加「环境 / 实际」前缀与「浓度」后缀，所以数值名是「灵气」时分别显示成「环境灵气浓度」与「实际灵气浓度」。

`mxt:target_overlay` 与 `mxt:boss_overlay` 按 `anchor` 分左右两遍绘制，写 `anchor: right` 的目标条就画在右边。

---

## `resource_bar_render_data_type`

资源条的 `renderer` 字段选一种绘制方式，`type` 写在 `renderer` 里面。默认占用空间是 71x8，只有自己覆盖尺寸的绘制器例外。

### `mxt:boss_bar`

Origins 风格的条加图标：从一张贴图集里切出背景、填充与一列 8x8 图标，图标与条索引共用同一行号。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sprite_location` | `SpriteIcon`，只接受贴图 | `mxt:textures/gui/resource_bar.png` | 贴图集 |
| `bar_index` | Integer，`0..24` | `0` | 用贴图集里的哪一条 |
| `icon_index` | Integer，`0..24` | `bar_index` | 用贴图集里的哪一个图标 |
| `inverted` | Boolean | `false` | 反转填充方向 |

```json
{"type": "mxt:boss_bar", "bar_index": 1}
```

### `mxt:textured_bar`

底图与填充各画一次，按条自己声明的宽高。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `background_sprite` | `SpriteIcon` | **必填** | 底图 |
| `fill_sprite` | `SpriteIcon` | **必填** | 填充 |
| `width` | Integer，`1..1024` | **必填** | 宽度 |
| `height` | Integer，`1..1024` | **必填** | 高度 |
| `fill_color` | RGB 颜色 | `#FFFFFF` | 填充着色 |
| `show_value` | Boolean | `false` | 是否把当前值画在条上 |

```json
{
  "type": "mxt:textured_bar",
  "background_sprite": {"texture": "example:textures/gui/qi_bar.png"},
  "fill_sprite": {"texture": "example:textures/gui/qi_bar_fill.png"},
  "width": 71,
  "height": 8,
  "fill_color": "#66CCFF"
}
```

### `mxt:segmented_bar`

离散分段，每段 8 像素宽。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `segments` | Integer，`1..256` | **必填** | 分段数量 |
| `gap` | Integer，`0..32` | `1` | 分段之间的间隔 |
| `full_color` | RGB 颜色 | `#FFFFFF` | 已填充分段的颜色 |
| `empty_color` | RGB 颜色 | `#555555` | 空分段的颜色 |

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

### `mxt:radial_bar`

环形条。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `radius` | Integer，`1..512` | **必填** | 半径 |
| `thickness` | Integer，`1..128` | **必填** | 环的粗细 |
| `start_angle` | Double | `0` | 起始角度，单位为度 |
| `end_angle` | Double | `360` | 结束角度，单位为度 |
| `fill_color` | RGB 颜色 | `#FFFFFF` | 填充着色 |

```json
{"type": "mxt:radial_bar", "radius": 16, "thickness": 3, "fill_color": "#66CCFF"}
```

### `mxt:text_only`

只画文本，不画条。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `format` | String | `%current%` | 文本格式 |
| `color` | RGB 颜色 | `#FFFFFF` | 文本颜色 |
| `show_maximum` | Boolean | `false` | 格式里没写 `%maximum%` 时是否把最大值缀在末尾 |

```json
{"type": "mxt:text_only", "format": "%current% / %maximum%", "color": "#66CCFF"}
```

格式里的 `%current%` 与 `%maximum%` 分别替换成当前值与最大值；`show_maximum` 只在格式里没有 `%maximum%` 时才补一次最大值。

### `mxt:missing`

没有任何视觉表现的占位绘制数据。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:missing"}
```

分段条的宽度是 `segments * 8 + (segments - 1) * gap` 像素；环形条在两个方向上都占 `radius * 2 + thickness` 像素；`mxt:boss_bar`、`mxt:text_only` 与 `mxt:missing` 用默认的 71x8；`mxt:textured_bar` 用自己声明的宽高。颜色一律可写 `#RRGGBB` 或 `0` 到 `16777215` 的整数。绘制在客户端进行，只显示服务端同步过来的数值。

`mxt:boss_bar` 的 `sprite_location` 与 `mxt:textured_bar` 的两个贴图字段都是 [`SpriteIcon`](../shared_data_types.md#spriteicon)，不是裸 Identifier。裸字符串沿用字段本来的含义：`sprite_location` 是**贴图路径**，`background_sprite` / `fill_sprite` 是 **GUI 图集精灵**。对象形式要么写 `{"sprite": ...}` 点名图集精灵，要么写 `{"texture": ...}` 点名一张贴图。

贴图对象里的 `region` 取贴图的一块，字段是 `u` / `v` / `texture_width` / `texture_height`，默认起点 `0,0`、整图 `256×256`；`width` / `height` 是画出来的**目标**尺寸，必须成对写，省略就按条自己的宽高画。

三条加载期约束：`mxt:boss_bar` 要拿贴图切背景、填充、图标三种格子，所以 `sprite_location` **只接受贴图**；精灵不能声明 `region`；对象里 `sprite` 与 `texture` 必须**恰好写一个**，两个都写或都不写都是错误，`width` / `height` 只写一个同样是错误。

尺寸只属于背景那一侧：`background_sprite` 与 `mxt:boss_bar` 的贴图可以写 `width` / `height`，**`fill_sprite` 上写的尺寸不生效**——填充按条自己的进度裁出来，固定尺寸没有意义，那两个键不参与绘制，画出来的只有背景那一份尺寸。

`SpriteIcon` 与 `ability.icon` / `resource.icon` 用的**图标引用不是同一个值**：图标引用是一张 16x16 贴图或一个物品、只画一格，没有 `region` / `width` / `height`，也不认 `{"sprite": ...}`；反过来 `SpriteIcon` 也写不成物品。

---

## `resource_bar_visibility_type`

显示条件纯粹是显示策略：它决定是否绘制资源条，绝不影响数值的结算。不写 `visibility` 时按 `mxt:always` 算。

### `mxt:always`

始终可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:always"}
```

### `mxt:non_full`

当前值低于最大值时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:non_full"}
```

### `mxt:non_zero`

`maximum - minimum` 为正时可见，差值为零或负数时隐藏。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:non_zero"}
```

### `mxt:recently_changed`

在数值最后一次变化后的一段时间里可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hold_ticks` | Long | `60` | 变化后保持可见的 tick 数 |

```json
{"type": "mxt:recently_changed", "hold_ticks": 120}
```

### `mxt:resource_range`

当前值落在闭区间里时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `min` | Double | **必填** | 包含下界 |
| `max` | Double | **必填** | 包含上界 |

```json
{"type": "mxt:resource_range", "min": 1, "max": 50}
```

### `mxt:and`

每个嵌套显示条件都可见时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | 显示条件数组 | **必填** | 嵌套的显示条件 |

```json
{"type": "mxt:and", "values": [{"type": "mxt:non_full"}, {"type": "mxt:non_zero"}]}
```

### `mxt:or`

任意一个嵌套显示条件可见时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | 显示条件数组 | **必填** | 嵌套的显示条件 |

```json
{"type": "mxt:or", "values": [{"type": "mxt:non_full"}, {"type": "mxt:recently_changed"}]}
```

### `mxt:not`

取反一个嵌套显示条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 显示条件 | **必填** | 要取反的显示条件 |

```json
{"type": "mxt:not", "value": {"type": "mxt:non_full"}}
```

`hold_ticks` 必须非负，`resource_range` 的 `min` / `max` 都必须有限、且 `max` 不低于 `min`，两端都包含。`mxt:non_zero` 看的是 `maximum - minimum`，跟当前值无关。这几条不满足都在加载期报错。

---

## `resource_value_provider_type`

资源数值来源为一条数值解析出一个数字：当前值、定义上限、恢复速度、距离上限还差多少，以及两种灵气浓度。它不写在资源条里，而是由脚本求值——把对象交给 `MxtValues.evaluateResource(entity, resource, definition)`，`mxt:js` 的回调用 `MxtValues.resourceValue(id, callback)` 注册，见 [KubeJS API 参考](../../../kubejs/api/values.md)。

### `mxt:current`

实体上存下来的当前值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:current"}
```

### `mxt:max`

这条数值的定义里求值出来的 `max`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:max"}
```

### `mxt:regen`

该数值的灵气定义里的 `regen`，也就是每 tick 的自然恢复量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:regen"}
```

### `mxt:missing`

距离上限还差多少，永远不低于 `0`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:missing"}
```

### `mxt:environment_concentration`

该位置的环境模板浓度，不含区块库存以及方块、阵法的贡献。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:environment_concentration"}
```

### `mxt:actual_concentration`

该位置最终解析出来的浓度，包含所有已生效来源。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:actual_concentration"}
```

### `mxt:constant`

一个固定的数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `NumberProvider` | **必填** | 要解析的数值 |

```json
{"type": "mxt:constant", "value": "level * 10"}
```

### `mxt:js`

由脚本回调决定的数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtValues.resourceValue(id, callback)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:qi_bonus", "params": {"scale": 2}}
```

`mxt:regen` 读不到对应的灵气定义时解析为 `0`。两个浓度来源读世界状态，因此需要一个实体：没有实体时解析为 `0`，服务端从世界状态算，客户端读同步下来的灵气池。`mxt:js` 的回调缺失或抛异常时记一条警告，并按 `0` 解析。

两个浓度 ID 同时存在于两处，别混：写在资源条的 `context` 里时它们是上下文，读客户端同步下来的池子、不需要实体；写成本页的类型时要有实体，服务端自己从世界状态算。
