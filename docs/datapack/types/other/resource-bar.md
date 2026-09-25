---
title: 资源条与灵气类型
---

# 资源条与灵气类型

## `resource_bar_context`

上下文提取一个资源条的值、最小值、最大值和最后变化 tick，并决定它的布局与显示名。与其他类型族不同，上下文通过 **ID 字符串**选择，而不是通过 `type` 对象，它写在内联资源条的 `context` 字段里。上下文没有 JSON 字段，只能从 Java 或 KubeJS 扩展。

| ID | 说明 |
| --- | --- |
| `mxt:self_hud` | 自身 HUD 布局；读取实体上存储的数值 |
| `mxt:target_overlay` | 目标浮层布局；读取实体上存储的数值 |
| `mxt:boss_overlay` | Boss 浮层布局；读取实体上存储的数值 |
| `mxt:environment_concentration` | 自身 HUD 布局；仅在客户端读取环境灵气模板 |
| `mxt:actual_concentration` | 自身 HUD 布局；仅在客户端读取完全解析后的浓度 |

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

浓度上下文在客户端收到灵气数据之前不报告任何值，并且它们以数值命名，因此 `resource.mxt.example.qi=Spirit Qi` 会按该数值显示为环境灵气浓度或实际灵气浓度。

---

## `resource_bar_render_data_type`

资源条的 `renderer` 字段选择下列绘制模式之一。除非某个模式覆盖了尺寸，默认占用空间为 71x8。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:boss_bar` | `sprite_location`（`SpriteIcon`，只接受贴图）、`bar_index`、`icon_index`、`inverted` | Origins 风格 71x8 带图标的条 |
| `mxt:textured_bar` | `background_sprite`、`fill_sprite`（都是 `SpriteIcon`，填充不许声明尺寸）、`width`、`height`、`fill_color`、`show_value` | 两张独立贴图 |
| `mxt:segmented_bar` | `segments`、`gap`、`full_color`、`empty_color` | 离散分段 |
| `mxt:radial_bar` | `radius`、`thickness`、`start_angle`、`end_angle`、`fill_color` | 环形条 |
| `mxt:text_only` | `format`、`color`、`show_maximum` | 仅文本 |
| `mxt:missing` | 无 | 没有任何视觉表现的占位绘制数据 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:boss_bar` | `sprite_location` | `SpriteIcon`（**只接受贴图**） | `mxt:textures/gui/resource_bar.png` | 贴图集；默认视为 `256×256`，可用 `region.texture_width` / `texture_height` 改成别的尺寸，也可以带目标尺寸 `width` / `height` |
| `mxt:boss_bar` | `bar_index` | Integer | `0` | 贴图集中的条索引，`0..24` |
| `mxt:boss_bar` | `icon_index` | Integer | `bar_index` | 贴图集中的图标索引，`0..24` |
| `mxt:boss_bar` | `inverted` | Boolean | `false` | 反转填充方向 |
| `mxt:textured_bar` | `background_sprite` | `SpriteIcon` | **必填** | 背景：贴图或 GUI 图集精灵；可以带目标尺寸 `width` / `height` |
| `mxt:textured_bar` | `fill_sprite` | `SpriteIcon` | **必填** | 填充：贴图或 GUI 图集精灵；**不许声明 `width` / `height`**（加载期报错） |
| `mxt:textured_bar` | `width` | Integer | **必填** | 宽度，`1..1024` |
| `mxt:textured_bar` | `height` | Integer | **必填** | 高度，`1..1024` |
| `mxt:textured_bar` | `fill_color` | RGB 颜色 | `#FFFFFF` | 填充着色 |
| `mxt:textured_bar` | `show_value` | Boolean | `false` | 是否绘制数值 |
| `mxt:segmented_bar` | `segments` | Integer | **必填** | 分段数量，`1..256` |
| `mxt:segmented_bar` | `gap` | Integer | `1` | 分段之间的间隔，`0..32` |
| `mxt:segmented_bar` | `full_color` | RGB 颜色 | `#FFFFFF` | 已填充分段的颜色 |
| `mxt:segmented_bar` | `empty_color` | RGB 颜色 | `#555555` | 空分段的颜色 |
| `mxt:radial_bar` | `radius` | Integer | **必填** | 半径，`1..512` |
| `mxt:radial_bar` | `thickness` | Integer | **必填** | 粗细，`1..128` |
| `mxt:radial_bar` | `start_angle` | Double | `0` | 起始角度，单位为度 |
| `mxt:radial_bar` | `end_angle` | Double | `360` | 结束角度，单位为度 |
| `mxt:radial_bar` | `fill_color` | RGB 颜色 | `#FFFFFF` | 填充着色 |
| `mxt:text_only` | `format` | String | `%current%` | 文本格式 |
| `mxt:text_only` | `color` | RGB 颜色 | `#FFFFFF` | 文本颜色 |
| `mxt:text_only` | `show_maximum` | Boolean | `false` | 是否在数值旁显示最大值 |

分段条的宽度为 `segments * 8 + (segments - 1) * gap` 像素，环形条在两个方向上都占用 `radius * 2 + thickness` 像素。颜色接受 `#RRGGBB` 或 `0` 到 `16777215` 的整数。绘制在客户端进行，并且只显示服务端同步过来的数值。

`mxt:boss_bar` 的 `sprite_location` 与 `mxt:textured_bar` 的两个贴图字段自 2026-09-25 起是 **`SpriteIcon`**，不再是裸 Identifier：裸字符串沿用字段本来的含义，对象形式可以点名 GUI 图集精灵（`{"sprite": ...}`）或一张贴图（`{"texture": ..., "region": {...}, "width": ..., "height": ...}`，`region` 用来取贴图的一块、`width` / `height` 用来指定画出来的**目标**尺寸且必须成对）。`mxt:boss_bar` 要拿它切背景 / 填充 / 图标三种格子，所以**只接受贴图**；精灵不能声明 `region`；尺寸只属于背景那一侧——`background_sprite`（与 `mxt:boss_bar` 的图集贴图）可以写 `width` / `height`，**`fill_sprite` 声明尺寸是加载期错误**：填充是按条自己的进度裁出来的，给它一个固定尺寸只会把条冻结在一个宽度上。写法与全部加载期约束见[共享数据类型 · `SpriteIcon`](../shared_data_types.md#spriteicon)。

`SpriteIcon` 与 `ability.icon` / `resource.icon` 用的**图标引用不是同一个值**：图标引用是一张 16x16 贴图或一个物品、只画一格，没有 `region` / `width` / `height`，也不认 `{"sprite": ...}`；反过来 `SpriteIcon` 也写不成物品——`SpriteIcon` 画的是资源条自己的底图/填充，两者别混用。

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

---

## `resource_bar_visibility_type`

显示条件纯粹是显示策略：它决定是否绘制资源条，绝不影响数值的结算。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:always` | 无 | 始终可见 |
| `mxt:non_full` | 无 | 当前值低于最大值时可见 |
| `mxt:non_zero` | 无 | `maximum - minimum` 为正时可见，差为零或负时隐藏 |
| `mxt:recently_changed` | `hold_ticks` | 在数值最后一次变化后的一段时间内可见 |
| `mxt:resource_range` | `min`、`max` | 当前值落在某个范围内时可见 |
| `mxt:and` | `values` | 每个嵌套显示条件都可见时可见 |
| `mxt:or` | `values` | 任意一个嵌套显示条件可见时可见 |
| `mxt:not` | `value` | 取反一个嵌套显示条件 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:recently_changed` | `hold_ticks` | Long | `60` | 变化后保持可见的 tick 数；必须非负 |
| `mxt:resource_range` | `min` | Double | **必填** | 包含下界；必须有限 |
| `mxt:resource_range` | `max` | Double | **必填** | 包含上界；必须有限且不低于 `min` |
| `mxt:and` | `values` | `ResourceBarVisibility` 列表 | **必填** | 嵌套的显示条件 |
| `mxt:or` | `values` | `ResourceBarVisibility` 列表 | **必填** | 嵌套的显示条件 |
| `mxt:not` | `value` | `ResourceBarVisibility` | **必填** | 要取反的嵌套显示条件 |

```json
{
  "type": "mxt:and",
  "values": [
    {"type": "mxt:non_full"},
    {"type": "mxt:resource_range", "min": 1, "max": 50}
  ]
}
```

---

## `resource_value_provider_type`

资源数值提供器为一个数值解析出一个数字，通常用于资源条或脚本求值。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:current` | 无 | 实体上存储的值 |
| `mxt:max` | 无 | 数值定义的 `max` |
| `mxt:regen` | 无 | 该值[修炼档案](../../json/aura.md) 的 `regen` |
| `mxt:missing` | 无 | 距离最大值还差多少，永远不低于 `0` |
| `mxt:environment_concentration` | 无 | 该位置的环境模板浓度，不含区块库存以及方块或阵法的贡献 |
| `mxt:actual_concentration` | 无 | 该位置最终解析出的浓度，包含所有已生效来源 |
| `mxt:constant` | `value` | 固定的 `NumberProvider` |
| `mxt:js` | `id`、`params` | KubeJS 资源数值回调 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:constant` | `value` | `NumberProvider` | **必填** | 要解析的数值 |
| `mxt:js` | `id` | String | **必填** | 通过 `MxtValues.resourceValue(...)` 注册的回调 ID |
| `mxt:js` | `params` | Object | `{}` | 传给回调的任意 JSON |

两个浓度提供器都读取世界状态，因此需要拥有它的实体；在没有实体的情况下调用它们会解析为 `0`。`mxt:js` 回调缺失时会记录一条警告并解析为 `0`。

```json
{"type": "mxt:constant", "value": "level * 10"}
```

---

## `aura_maximum_type`

这个注册表解析一个灵气区块的环境储存上限。方块贡献和阵法加成在运行时另行应用。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:fixed` | `value` | 固定上限 |
| `mxt:initial_multiplier` | `multiplier` | 区块的初始灵气乘以一个系数 |
| `mxt:unlimited` | 无 | 没有上限 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:fixed` | `value` | Double | **必填** | 固定上限，`0` 或更大 |
| `mxt:initial_multiplier` | `multiplier` | Double | `1` | 作用于非负初始灵气的系数 |

裸的非负数字是 `{"type": "mxt:fixed", "value": ...}` 的简写。在拥有该字段的定义上完全省略它，表示上限等于该区块的初始环境灵气。

```json
{"type": "mxt:initial_multiplier", "multiplier": 2}
```

---
