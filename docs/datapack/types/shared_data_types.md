---
title: 共享数据类型
---

# 共享数据类型

## 基础类型

| 类型 | JSON 形状 | 说明 |
| --- | --- | --- |
| `String` | `"fire"` | 普通字符串。 |
| `Boolean` | `true` | 布尔值。 |
| `Integer` | `20` | 整数，范围以字段表为准。 |
| `Long` | `100000` | 长整数，范围以字段表为准。 |
| `Double` | `1.5` | 双精度数；加载阶段拒绝 `NaN` 和无穷大。 |
| `Identifier` | `"example:fire"` | 带命名空间的资源 ID。 |
| `Holder<T>` | `"example:resource"` | 指向动态注册表或原版注册表的单个条目。 |
| `Tag<T>` | `"#example:fire"` | 原版标签引用，`#` 不能省略。 |
| `HolderOrTag<T>` | 字符串或字符串数组 | 单个 ID、单个标签或混合数组。 |
| `ItemMatcher` | ID、标签或混合数组 | 物品绑定表的 `items` 字段；匹配现有物品，不创建物品。 |
| `Text Component` | 字符串或文本对象 | 支持翻译键字符串和原版文本组件。 |
| `ItemStackTemplate` | `{"id":"minecraft:stone"}` | 原版物品堆模板，可附带 `count` 和数据组件。 |
| `NumberProvider` | 数字、字符串或对象 | 常量、exp4j 表达式或固有数值提供器。 |
| `EntityAction` | 对象或对象数组 | 对实体执行行为；数组按顺序执行。 |
| `BiEntityAction` | 对象或对象数组 | 对来源实体和目标实体执行行为。 |
| `BlockAction` | 对象或对象数组 | 对方块位置执行行为。 |
| `ItemAction` | 对象或对象数组 | 对物品堆执行行为。 |
| `EntityCondition` | 对象或对象数组 | 数组表示全部条件都必须满足。 |

### `ResourceCost` 与 `AuraGain`

需要**消耗**资源的字段统一是数组，每项为 `ResourceCost`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `Holder<resource>` | 资源注册表条目。 |
| `amount` | `NumberProvider` | 必须在运行时得到有限**正数**，否则整笔拒绝。 |

```json
"costs": [
  {"id": "example:qi", "amount": "5 + level"},
  {"id": "example:stamina", "amount": 2}
]
```

`cultivate_action.aura_gains` 用的是 `AuraGain`：字段名同样是 `id` 与 `amount`，但 `id` 是 `Holder<aura>`，`amount` 允许 `0`（有限非负即可）。

给任意数值加值时用的是 **`mxt:add_resource` 行为**而不是数组，它的字段是 `resource` 与 `amount`，`amount` 可以是负数：

```json
{"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
```

代码里还有一个 `ResourceGain` 记录（形状同样是 `id` + `amount`），但当前没有任何数据包字段解码它——不要指望某个 `gains` 字段会接受它。

### `AttributeEntry`

属性修正使用 `minecraft:attack_damage` 等原版属性 Holder（26.1.2 的属性 ID 已不再带 `generic.` 前缀）：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attribute` | `Holder<Attribute>` | **必填** | 原版属性 ID。 |
| `id` | `Identifier` | **必填** | 原版 `AttributeModifier` 的唯一 ID。 |
| `amount` | `Double` | **必填** | 没有动态 `value` 时使用的基础值。 |
| `operation` | Enum | **必填** | `add_value`、`add_multiplied_base` 或 `add_multiplied_total`。 |
| `value` | `NumberProvider` | 无 | 填写后每 tick 在服务端按实体上下文重新计算，替代 `amount`。 |

## 图标引用

全模组的图标字段都是同一个值，**直接内联**：贴图写成一个字符串，物品写成一个对象。带这个字段的定义有 `ability`、`resource`、`forging_method` 与 `technique`。

| 写法 | 类型 | 说明 |
| --- | --- | --- |
| 字符串 | Identifier | 16x16 的 GUI 贴图，例如 `example:textures/gui/icon/sword.png`。 |
| 对象 | `ItemStackTemplate` | 物品，写完整的物品堆模板 `{"id": ...}`，可带 `count` 与 `components`。 |

两支是**按解析顺序**区分的：先试贴图（Identifier），再试物品。因为 Identifier 和物品都接受**字符串**，裸字符串会被贴图分支先拿走，所以**物品必须写成对象形式** `{"id": ...}`——写裸字符串只会得到一张同名的贴图，而不是物品。

```json
"icon": "example:textures/gui/icon/sword.png"
```

```json
"icon": { "id": "minecraft:iron_ingot" }
```

```json
"icon": { "id": "minecraft:diamond_sword", "count": 1, "components": { "minecraft:custom_name": "青霄" } }
```

物品图标存的是**模板**而不是现成的堆，因为数据包注册表在物品组件绑定之前就解析完了；客户端绘制时才实体化，所以需要组件的图标也能正确显示。

## Holder、标签与匹配器

跨注册表字段尽量在数据包加载阶段解析成 Holder，不在运行时重复查询注册表。

### 单值和标签

```json
{
  "aura": "example:qi",
  "ability_requirements": "#example:fire_abilities"
}
```

### 混合数组

支持 ID、标签混合的字段可以直接写数组：

```json
{
  "ability_requirements": [
    "example:fireball",
    "#example:basic_fire_abilities"
  ]
}
```

数组中的每一项会保留为 Holder 或 TagKey；重复值不会自动改变语义。`AutoIgnoreListCodec` 允许列表中的无效可选项被忽略，具体字段表会标明是否使用该 Codec。

### `ItemMatcher`

`item_binding`、`weapon_binding`、`pill_binding`、`technique_binding`、`spirit_herb`、`item_aura` 和 `currency` 的 `items` 字段支持以下三种写法：

```json
"items": "minecraft:apple"
```

```json
"items": "#minecraft:logs"
```

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

匹配器只引用已经注册的物品。多个定义同时匹配时，按 `priority` 从低到高选择；当前这些数据类的优先级固定为 `0`。

数组里的每一项也可以写成带 `type` 的对象，类型由固有注册表 `item_matcher_entry_type` 分派：

| `type` | 字段 | 匹配 |
| --- | --- | --- |
| `mxt:item` | `item` | 单个物品，简写的展开形式。 |
| `mxt:tag` | `tag` | 物品标签，简写的展开形式。 |
| `mxt:wildcard` | `pattern` | 物品 ID 的 `*`/`?` 通配符，例如 `{"type": "mxt:wildcard", "pattern": "mxt:*_spirit_stone"}`。 |
| `mxt:regex` | `pattern` | 物品 ID 的正则，例如 `{"type": "mxt:regex", "pattern": "mxt:(medium\|high)_spirit_stone"}`。 |
| `mxt:spirit_storage` | 无 | 所有实现 `ItemAuraAccess` 的物品，即能被按住右键灌注灵气的物品（见 [物品灵气数据包](/datapack/json/item_aura)）。这是唯一一个按「能力」而不是按 ID 匹配的条目，因此之后新增的同类物品会被自动覆盖。 |
| `mxt:herb_tag` | `element`、`material` | 匹配**是灵草**（能命中某条 `mxt:spirit_herb` 定义的物品）且该定义带有所问标签的物品：`element` 查 `element_tags`、`material` 查 `material_tags`，两者都写就要同时满足，两个都不写会被加载期拒绝。标签是草的属性而不是物品的属性，所以内容可以写"任意火属性灵草"而不必知道之后有哪些物品被绑到那条草上（例如 `{"type": "mxt:herb_tag", "element": "example:fire"}`）。实体条件里可以套在 `mxt:item_matcher` 中使用，例如用 `mxt:has_equipped_item` 判断"手上拿着火属性灵草"。 |
