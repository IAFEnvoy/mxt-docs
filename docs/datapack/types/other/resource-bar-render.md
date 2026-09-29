---
title: resource_bar_render_data_type（资源条绘制器）
description: 资源条绘制器族 resource_bar_render_data_type 的六种绘制器、字段、默认值、范围与贴图写法。
---

# resource_bar_render_data_type（资源条绘制器）

资源条的 `renderer` 字段选一种绘制方式，`type` 写在 `renderer` 里面。资源条写在 [resource](../../json/resource.md) 内联 `bars` 里。

这一族由模组注册，数据包只能选用，不能新增。默认占用空间是 71x8，只有自己覆盖尺寸的绘制器例外。

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

---

分段条的宽度是 `segments * 8 + (segments - 1) * gap` 像素；环形条在两个方向上都占 `radius * 2 + thickness` 像素；`mxt:boss_bar`、`mxt:text_only` 与 `mxt:missing` 用默认的 71x8；`mxt:textured_bar` 用自己声明的宽高。颜色一律写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受），一律按不透明处理。绘制在客户端进行，只显示服务端同步过来的数值。

`mxt:boss_bar` 的 `sprite_location` 与 `mxt:textured_bar` 的两个贴图字段都是 [`SpriteIcon`](../shared_data_types.md#spriteicon)，不是裸 Identifier。裸字符串沿用字段本来的含义：`sprite_location` 是**贴图路径**，`background_sprite` / `fill_sprite` 是 **GUI 图集精灵**。对象形式要么写 `{"sprite": ...}` 点名图集精灵，要么写 `{"texture": ...}` 点名一张贴图。

贴图对象里的 `region` 取贴图的一块，字段是 `u` / `v` / `texture_width` / `texture_height`，默认起点 `0,0`、整图 `256×256`；`width` / `height` 是画出来的**目标**尺寸，必须成对写，省略就按条自己的宽高画。

三条加载期约束：`mxt:boss_bar` 要拿贴图切背景、填充、图标三种格子，所以 `sprite_location` **只接受贴图**；精灵不能声明 `region`；对象里 `sprite` 与 `texture` 必须**恰好写一个**，两个都写或都不写都是错误，`width` / `height` 只写一个同样是错误。

尺寸只属于背景那一侧：`background_sprite` 与 `mxt:boss_bar` 的贴图可以写 `width` / `height`，**`fill_sprite` 上写的尺寸不生效**——填充按条自己的进度裁出来，固定尺寸没有意义，那两个键不参与绘制，画出来的只有背景那一份尺寸。

`SpriteIcon` 与 `ability.icon` / `resource.icon` 用的**图标引用不是同一个值**：图标引用是一张 16x16 贴图或一个物品、只画一格，没有 `region` / `width` / `height`，也不认 `{"sprite": ...}`；反过来 `SpriteIcon` 也写不成物品。
