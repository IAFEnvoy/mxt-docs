---
title: resource（资源）
aside: false
---

# resource（资源） {#resource}

文件位置：`data/<namespace>/mxt/resource/<path>.json`

**用途**：修为、灵力、体力等实体资源及内联资源条。

`resource` 只是一个按实体存储的数值：它的边界和显示方式。它不关心数值来自哪里、做什么用——把数值变成修炼资源的那些内容（境界链入口、自然恢复、灵气标记、修为换算、可用性门禁）都在 `aura` 里，并通过 `resource` 字段指回该数值。没有对应档案的 resource 就是一个普通计数器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `resource.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `resource.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `default_value` | `NumberProvider` | **必填** | 新建附件时的当前值。 |
| `min` | `NumberProvider` | `0` | 数值下限。 |
| `max` | `NumberProvider` | **必填** | 数值上限。 |
| `icon` | **图标引用** | 无 | 可选灵力热键图标。 |
| `particle_color` | `RGBColor` | `#FFFFFF` | 灵力射线使用的粒子颜色。可写入 `#RRGGBB` 或 `0..16777215` 整数。 |
| `bars` | `List<ResourceBar>` | `[]` | 内联资源条；为空时不显示该数值。 |

数值始终被钳制在 `[min, max]`：越界的变更会**被钳到边界**，而不是被拒绝（`ResourceService.change` 只做钳制，不会因此失败）。数值可以作为消耗数组里的 `mxt:resource` 条目被消耗（见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)）、用 `mxt:resource_compare` 比较、在公式里以 `caster_<名称>` 读取、把**该值所对应的灵气**（`Aura` 定义）通过存取接口（`AuraAccess`/`ItemAuraAccess`）存入物品，并用 `mxt:add_resource` 行为增减。

示例：

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

## `resource.bars`

`bars` 是 `resource` 内联数组，不是独立动态注册表。

`context` 使用固有注册表 `mxt:resource_bar_context` 中的 ID。上下文对象负责从实体或客户端状态提取当前值、最小值、最大值和最近变更时间，并使用传入的资源 ID 生成显示名称。灵气浓度上下文分为 `mxt:environment_concentration`（仅环境）和 `mxt:actual_concentration`（全部来源）；例如配合 `resource.mxt.example.qi=灵气` 会分别显示为“环境灵气浓度”和“实际灵气浓度”。内置上下文还包括 `mxt:self_hud`、`mxt:target_overlay` 和 `mxt:boss_overlay`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `context` | `ResourceBarContext` | `mxt:self_hud` | 上下文固有注册表；负责提取数值、生成名称和决定布局。 |
| `anchor` | `left` / `right` | **必填** | 自我 HUD 的左列或右列。 |
| `order` | Integer | `0` | 同一列中越小越靠近原版热键栏。 |
| `visibility` | `ResourceBarVisibility` | `mxt:always` | 是否显示。 |
| `renderer` | `ResourceBarRenderer` | **必填** | 绘制方式。 |
| `value_display` | `none` / `current` / `current_and_maximum` / `percentage` | `none` | 数值文本显示方式。 |
| `maximum` | Positive Double | 上下文最大值 | 仅覆盖资源条的显示上限，不改变服务端或上下文实际数值。 |

内置绘制器包括 `mxt:boss_bar`、`mxt:textured_bar`、`mxt:segmented_bar`、`mxt:radial_bar` 和 `mxt:text_only`。`mxt:boss_bar` 可配置 `sprite_location`、`bar_index`、`icon_index` 和 `inverted`，贴图默认使用 `mxt:textures/gui/resource_bar.png`。渲染通过 NeoForge GUI Layer 接入，条只显示在左列或右列，不占用屏幕中央。

绘制器参数：

| `type` | 字段 | 默认 | 说明 |
| --- | --- | --- | --- |
| `mxt:boss_bar` | `sprite_location`、`bar_index`、`icon_index`、`inverted` | 见上文 | Origins 风格 71x8 条和图标。 |
| `mxt:textured_bar` | `background_sprite`、`fill_sprite`、`width`、`height`、`fill_color`、`show_value` | `fill_color=#ffffff,show_value=false` | 使用两张独立贴图。宽高范围 `1..1024`。 |
| `mxt:segmented_bar` | `segments`、`gap`、`full_color`、`empty_color` | `gap=1,full_color=#ffffff,empty_color=#555555` | 分段条；`segments` 范围 `1..256`。 |
| `mxt:radial_bar` | `radius`、`thickness`、`start_angle`、`end_angle`、`fill_color` | `start_angle=0,end_angle=360,fill_color=#ffffff` | 径向条。 |
| `mxt:text_only` | `format`、`color`、`show_maximum` | `%current%,#ffffff,false` | 只显示文本；格式支持 `%current%`。 |

> **注**：`sprite_location`、`background_sprite`、`fill_sprite` 目前仍是裸 Identifier，**不是**图标引用——它们是按条自身宽高拉伸的底图/填充对，`sprite_location` 还带 25 格图集索引，与单个 16x16 的图标引用语义不同。后续是否接入见源码里的 TODO。

可见性类型：`mxt:always`、`mxt:non_full`、`mxt:non_zero`、`mxt:recently_changed`（`hold_ticks` 默认 `60`）、`mxt:resource_range`（必填 `min`、`max`）、`mxt:and`、`mxt:or` 和 `mxt:not`。其中 `mxt:non_zero` 仅在 `maximum - minimum > 0` 时显示；差值为零或负数时隐藏。

`resource` 只是一个按实体存储的数值：它的边界（`min`/`max`/`default_value`）和显示方式（`icon`、`particle_color`、`bars`）。它不关心数值来自哪里、做什么用。

把数值变成灵气的那些内容都在 `aura` 定义里（一对一，通过 `resource` 字段指回数值）：境界链入口 `first_realm`、凡人阈值 `start_exp`、开始修炼条件 `start_cultivate_conditions`、自然恢复 `regen`、灵气标记 `aura_type`、灵力射线 `burst_amount`、修为双向换算、可用性门禁 `use_condition` 与信息面板开关 `show_cultivation_info`。没有 `aura` 定义的数值就是一个普通计数器，仍可被消耗、比较和写入公式；但它**不能被存入物品**——存取接口（`AuraAccess`/`ItemAuraAccess`）交换的是灵气，而普通计数器没有灵气身份（它能进玩家池子，因为池子按值开键）。

示例（字段以当前 Codec 为准）：

```json
{
  "min": 0,
  "max": 100,
  "default_value": 0,
  "particle_color": "#66CCFF",
  "bars": [{
    "renderer": {"type": "mxt:boss_bar", "bar_index": 0},
    "anchor": "left",
    "order": 0,
    "context": "mxt:self_hud",
    "value_display": "current_and_maximum"
  }]
}
```

数值上限可以由境界、已吸收灵气和 NumberProvider 计算。需要按玩家条件选择时可使用 `mxt:conditional`：按顺序检查分支，`fallback` 只能是数字或表达式字符串，在没有 `Player` 或所有分支不匹配时使用；不填写时返回 `0`。资源条是数值定义的内联字段，不再是单独的数据包注册表。

资源数值提供器 `mxt:environment_concentration` 只返回环境模板浓度，`mxt:actual_concentration` 返回包含库存、方块和阵法来源的最终浓度。两者均由服务端计算并同步给客户端。

`use_condition`（在 `aura` 定义中）是可选的 `EntityCondition`，用于控制实体能否主动消耗该数值，同时控制其所有资源条的可见性。它不影响修炼、环境吸收、自然恢复或突破。`show_cultivation_info` 默认为 `true`；设为 `false` 时该数值仍可拥有境界链和修为，但不会出现在人物信息面板的“境界”或“修为进度”中。

数值、境界、元素、技能等数据驱动定义不再填写 `translation_key`。显示名称统一由定义文件的标识符自动生成翻译键 `<注册表类别>.<注册表命名空间>.<定义命名空间>.<路径>`：注册表命名空间对 MiXianTu 自己的注册表恒为 `mxt`（注册表键都写作 `mxt:<路径>`），类别默认取注册表自己的 path，所以 `example:qi` 在 `resource` 类别下对应 `resource.mxt.example.qi`。路径里的 `/` **原样**保留（`example:foo/bar` 得到 `resource.mxt.example.foo/bar`），不会被转成 `.`，所以按类别分子文件夹不会多出第二套翻译键规则。数据包作者只需在语言文件中提供该键的翻译。`resource` 也是可以自带可选 `name` / `description` 的 19 个注册表之一：写了就用你自己的文本，省略才用上面的生成键，`description` 再加 `.description`；目前这两个字段只被存储与读取，还没有地方绘制它们。

