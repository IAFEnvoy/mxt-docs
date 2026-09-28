---
title: resource（资源）
description: 定义一个按实体存储的数值、它的边界与内联资源条。
aside: false
---

# resource（资源） {#resource}

`resource` 是按实体存的一个数值：它的边界，以及显示方式。它不关心这个数从哪来、做什么用。把一个数值变成修炼资源的东西——境界链入口、自然恢复、灵气标记、修为换算、可用性门禁——全在 [aura](./aura.md) 里，由灵气定义通过 `resource` 字段指回这个数值。没有对应灵气定义的数值就是一个普通计数器。

## 文件位置

数值文件放在数据包的 `data/<namespace>/mxt/resource/`。文件名对应它的 ID，例如 `data/example/mxt/resource/qi.json` 的 ID 是 `example:qi`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `resource.mxt.<命名空间>.<路径>` | 显示名；省略时用左列的生成键，写了就用你给的文本。 |
| `description` | 文本组件 | `resource.mxt.<命名空间>.<路径>.description` | 定义描述；省略时用左列的生成键。目前只被存储与读取，还没有界面绘制它。 |
| `default_value` | `NumberProvider` | **必填** | 新建附件时的当前值。 |
| `min` | `NumberProvider` | `0` | 数值下限。 |
| `max` | `NumberProvider` | **必填** | 数值上限。 |
| `icon` | **图标引用** | 无 | 可选图标，画在灵气轮盘里这一条数值上。 |
| `particle_color` | `RGBColor` | `#FFFFFF` | 灵力射线使用的粒子颜色。写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受），一律按不透明处理。 |
| `bars` | 资源条数组 | `[]` | 内联资源条；为空时不显示该数值。 |

数值可以做这些事：作为消耗数组里的 `mxt:resource` 条目被扣掉（见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)）、用 `mxt:resource_compare` 比较（判定"当前值 **≥** 你写的 `min`"，没有上界比较）、在公式里以 `caster_<压平后的数值 id>` 读取（见[公式变量](../types/formula_variables.md)）、用 `mxt:add_resource` 行为增减、把**该值所对应的灵气**（`aura` 定义）存入物品。能进物品的是灵气：存取接口交换的是灵气身份，所以没有灵气定义的计数器存不进物品，但它照样能进玩家自己的池子，因为池子按值开键。

初始化和每次变更都重新求值 `min` 与 `max`。两个都是有限数、并且 `min <= max`，这次操作才写得进去；不成立就整个失败，不写入、也不退回默认值。变更量本身不是有限数同样不写入。

越界的变更**被钳到边界**，而不是被拒绝：钳制只改落下来的结果，不让这次操作失败。

`max` 可以写成公式：

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "particle_color": "#66CCFF",
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "order": 0,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1}
    }
  ]
}
```

公式里能用的境界变量（`realm_rank`、`absorbed_aura`、`level`）只在这条数值对应的灵气定义的链里存在。

需要按玩家条件选择不同的上限时用 `mxt:conditional`：按顺序检查分支，`fallback` 只能写数字或表达式字符串，在没有玩家或所有分支都不匹配时使用；不写 `fallback` 返回 `0`。

## `resource.bars`

`bars` 是 `resource` 的内联数组，不是独立的数据包注册表。

`context` 使用固有注册表 `mxt:resource_bar_context` 里的 ID。上下文对象从实体或客户端状态里提取当前值、最小值、最大值和最近变更时间，并用传入的资源 ID 生成显示名。内置五项固定，数据包只能选，不能自己加：`mxt:self_hud`、`mxt:target_overlay`、`mxt:boss_overlay` 读实体上存下来的数值，`mxt:environment_concentration`、`mxt:actual_concentration` 改读客户端同步过来的灵气池。两种浓度上下文分别是"只算环境模板"与"环境、库存、方块、阵法全都算上"；例如语言文件里 `resource.mxt.example.qi` 写的是「灵气」时，两条会分别显示成「环境灵气浓度」与「实际灵气浓度」。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `context` | 上下文 id | `mxt:self_hud` | 从哪取数：提取数值、生成名称并决定布局。 |
| `anchor` | `left` / `right` | **必填** | 落在自我 HUD 的左列还是右列。 |
| `order` | Integer | `0` | 同一列里越小越靠近原版热键栏。 |
| `visibility` | 可见性对象 | `mxt:always` | 什么时候显示。 |
| `renderer` | 绘制器对象 | **必填** | 怎么画。 |
| `value_display` | Enum | `none` | 数值文本的显示方式：`none`、`current`、`current_and_maximum`、`percentage`。 |
| `maximum` | Positive Double | 上下文最大值 | 只覆盖资源条的**显示**上限，不改变服务端或上下文的实际数值。 |

三个读取已存数值的上下文（`mxt:self_hud`、`mxt:target_overlay`、`mxt:boss_overlay`）在这条数值还没被初始化时不给值，那条资源条不画。`maximum` 不是有限正数时视同没写，照旧用上下文的最大值，加载期不报错。

两个浓度上下文要求这条数值有灵气定义：没有定义、或这个池子的最大值与当前值都不为正，就不给值，资源条也不画。它们报的最小值恒为 `0`，最近变更时间没有记录。

自我 HUD 的两列由玩家拖动，位置存在客户端配置里，数据包只决定这一条落进哪一列。

内置绘制器有 `mxt:boss_bar`、`mxt:textured_bar`、`mxt:segmented_bar`、`mxt:radial_bar` 和 `mxt:text_only`。资源条走 NeoForge 的 GUI Layer，只画在左列或右列，不占屏幕中央。

### 绘制器

下面四列是"绘制器有哪些字段"，第一列按 `renderer.type` 分组，一格里的字段一一对应同一行的类型、默认与说明。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sprite_location``<br>``bar_index``<br>``icon_index``<br>``inverted` | `SpriteIcon``<br>`Integer`<br>`Integer`<br>`Boolean | `mxt:textures/gui/resource_bar.png``<br>``0``<br>``bar_index``<br>``false` | `mxt:boss_bar`：Origins 风格 71x8 的条与 8x8 图标，要拿贴图切出背景、填充、图标三种格子，所以 `sprite_location` **只收贴图**，写精灵是加载期错误。贴图默认视为 `256×256` 的图集，可用 `region.texture_width` / `texture_height` 改成别的尺寸。`bar_index` 与 `icon_index` 范围都是 `0..24`。 |
| `background_sprite``<br>``fill_sprite``<br>``width``<br>``height``<br>``fill_color``<br>``show_value` | `SpriteIcon``<br>``SpriteIcon``<br>`Integer`<br>`Integer`<br>``RGBColor``<br>`Boolean | **必填**`<br>`**必填**`<br>`**必填**`<br>`**必填**`<br>``#FFFFFF``<br>``false` | `mxt:textured_bar`：底图与填充各画一次，按条自己的宽高。`width` / `height` 范围 `1..1024`。填充按进度裁，写在 `fill_sprite` 上的尺寸不参与绘制。 |
| `segments``<br>``gap``<br>``full_color``<br>``empty_color` | Integer`<br>`Integer`<br>``RGBColor``<br>``RGBColor` | **必填**`<br>``1``<br>``#FFFFFF``<br>``#555555` | `mxt:segmented_bar`：分段条。`segments` 范围 `1..256`，`gap` 范围 `0..32`。 |
| `radius``<br>``thickness``<br>``start_angle``<br>``end_angle``<br>``fill_color` | Integer`<br>`Integer`<br>`Double`<br>`Double`<br>``RGBColor` | **必填**`<br>`**必填**`<br>``0``<br>``360``<br>``#FFFFFF` | `mxt:radial_bar`：径向条。`radius` 范围 `1..512`，`thickness` 范围 `1..128`，两个角度以度为单位。 |
| `format``<br>``color``<br>``show_maximum` | String`<br>``RGBColor``<br>`Boolean | `%current%``<br>``#FFFFFF``<br>``false` | `mxt:text_only`：只显示文本；格式里可以用 `%current%`。 |

分段条的宽度是 `segments * 8 + (segments - 1) * gap` 像素，径向条在两个方向上都占 `radius * 2 + thickness` 像素；`mxt:textured_bar` 用自己声明的宽高，其余绘制器各自算尺寸。

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

**资源条的三个贴图字段用的是 [`SpriteIcon`](../types/shared_data_types.md#spriteicon)，不是 `ability.icon` / `resource.icon` 那种图标引用。** 后者是一张 16x16 贴图或一个物品，只画一格，没有 `region` / `width` / `height`，也不认 `{"sprite": ...}`；反过来 `SpriteIcon` 也写不成物品。两种写法：

| 写法 | 说明 |
| --- | --- |
| 裸字符串 | 沿用字段本来的含义：`sprite_location` 是**贴图路径**，`background_sprite` / `fill_sprite` 是 GUI 图集精灵。 |
| 对象 | `{"sprite": ...}` 是 GUI 图集精灵；`{"texture": ...}` 是贴图，可带 `region`（`u` / `v` / `texture_width` / `texture_height`，默认起点 `0,0`、整图 `256×256`）。两者都可以带 `width` / `height`。 |

`width` / `height` 是画出来的**目标尺寸**（不是裁剪），必须成对写，省略就按条自己的宽高画。三条边界：

- `mxt:boss_bar` 的 `sprite_location` **只接受贴图**。精灵没有"图集里切哪一格"这个概念。
- 精灵**不能声明 `region`**，图集已经知道它在哪，写了是加载期错误。
- `mxt:textured_bar` 的 **`fill_sprite` 上写的 `width` / `height` 不生效**：填充按条自己的进度裁，固定尺寸没有意义，那两个键不参与绘制。尺寸只属于 `background_sprite`（以及 `mxt:boss_bar` 的图集贴图）。

一个对象写法里 `sprite` 与 `texture` 必须**恰好写一个**，两个都写或都不写都是加载期错误。`width` / `height` 只写一个也是加载期错误。

### 可见性

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | 见下表 | **必填** | 用哪一种显示条件。 |
| `hold_ticks` | Long | `60` | 只有 `mxt:recently_changed` 读：最近变过之后还显示多久，必须非负。 |
| `min` | Double | **必填** | 只有 `mxt:resource_range` 读：包含下界，必须有限。 |
| `max` | Double | **必填** | 只有 `mxt:resource_range` 读：包含上界，必须有限且不低于 `min`。 |
| `values` | 显示条件数组 | **必填** | 只有 `mxt:and` / `mxt:or` 读：嵌套条件。 |
| `value` | 显示条件 | **必填** | 只有 `mxt:not` 读：要取反的那一条。 |

| `type` | 说明 |
| --- | --- |
| `mxt:always` | 一直显示。 |
| `mxt:non_full` | 当前值低于最大值时显示。 |
| `mxt:non_zero` | 仅在 `maximum - minimum > 0` 时显示；差值为零或负数时隐藏。 |
| `mxt:recently_changed` | 最近变过之后还显示 `hold_ticks` 那么久。 |
| `mxt:resource_range` | 当前值落在 `[min, max]` 闭区间内时显示。 |
| `mxt:and` / `mxt:or` / `mxt:not` | 组合上面几种。 |

可见性只决定画不画，绝不改数值的结算。

```json
{
  "type": "mxt:and",
  "values": [
    {"type": "mxt:non_full"},
    {"type": "mxt:resource_range", "min": 1, "max": 50}
  ]
}
```

::: info 两套浓度

`mxt:environment_concentration` 与 `mxt:actual_concentration` 这两个 ID 同时存在于两处：写在 `bars[].context` 里是资源条上下文，按上面那段读客户端同步下来的灵气池；写在资源数值提供器里是另一个类型，要有实体才读得出来，没有实体就是 `0`，服务端从世界状态算。完整清单见[资源条与灵气类型](../types/other/resource-bar.md#resource-value-provider-type)。

:::

::: info 显示名

数据包定义不写 `translation_key`，显示名由标识符自动生成：`<类别>.<注册表命名空间>.<定义命名空间>.<路径>`。`resource` 的类别就是 `resource`、注册表命名空间对 MiXianTu 自己的注册表恒为 `mxt`，所以 `example:qi` 查 `resource.mxt.example.qi`。路径里的 `/` **原样**进键（`example:foo/bar` 得到 `resource.mxt.example.foo/bar`），按类别分子文件夹不会多出第二套翻译键规则。

`resource` 是可以自带可选 `name` / `description` 的 23 张表之一，写了就用你的文本，省略才用上面的生成键（`description` 再加 `.description`）；这两个字段目前只被存储与读取，还没有地方绘制它们。

:::
