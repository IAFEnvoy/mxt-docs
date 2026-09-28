---
title: 共享数据类型
description: 多个注册表共用的复杂值：Cost、AuraGain、AttributeEntry、图标引用、Holder 与标签、ItemMatcher。
---

# 共享数据类型

这些值不属于某一个注册表，而是被许多字段共用。写一个字段前先在这里对一下形状。

## 基础类型

| 类型 | JSON 形状 | 说明 |
| --- | --- | --- |
| `String` | `"fire"` | 普通字符串。 |
| `Boolean` | `true` | 布尔值。 |
| `Integer` | `20` | 整数，范围以字段表为准。 |
| `Long` | `100000` | 长整数，范围以字段表为准。 |
| `Double` | `1.5` | 双精度数；加载阶段拒绝 `NaN` 和无穷大。 |
| `Identifier` | `"example:fire"` | 带命名空间的资源 ID。 |
| 注册表条目引用 | `"example:resource"` | 指向注册表的一个条目，写条目自己的 id。 |
| 标签引用 | `"#example:fire"` | 原版标签，`#` 不能省略。 |
| 条目或标签 | 字符串或字符串数组 | 单个 id、单个 `#标签`，或两者混在一个数组里。 |
| `ItemMatcher` | ID、标签或混合数组 | 物品绑定表的 `items` 字段；匹配现有物品，不创建物品。 |
| `Text Component` | 字符串或文本对象 | 支持翻译键字符串和原版文本组件。 |
| `ItemStackTemplate` | `{"id":"minecraft:stone"}` 或 `"minecraft:stone"` | 物品堆模板：可只写裸物品 ID，也可写对象（`id` 必填，可带 `count` 与 `components`）。数据包注册表**早于物品组件绑定**解析，所以数据包定义里的物品堆一律用它。 |
| `ItemStack` | `{"id":"minecraft:amethyst_shard"}` | 原版物品堆，**必须写成对象**（`id` 必填，可带 `count` 与 `components`），不接受裸物品 ID 字符串；它要求物品组件已绑定，所以只用于附件与存档状态，数据包定义请用 `ItemStackTemplate`。 |
| `NumberProvider` | 数字、字符串或对象 | 常量、exp4j 表达式或固有数值提供器，见[数值提供器](./number_provider_types)。 |
| `EntityAction` | 对象或对象数组 | 对实体执行行为；数组按顺序执行。 |
| `BiEntityAction` | 对象或对象数组 | 对来源实体和目标实体执行行为。 |
| `BlockAction` | 对象或对象数组 | 对方块位置执行行为。 |
| `ItemAction` | 对象或对象数组 | 对物品堆执行行为。 |
| `EntityCondition` | 对象或对象数组 | 数组表示全部条件都必须满足。 |
| `Weighted` | `{"value": …, "weight": 3}` | 加权列表的一项，全模组只有这一种形状：`value` 必填、`weight` 可选（默认 `1`）。权重 `≤0` 的条目算 `0`（永远不会被选中）。整表权重全为 `0` 时按用法分两支：`mxt:choice` 的 `actions` **等概率**抽一项，写错的表照样能跑；`mxt:weighted_list` 的 `distribution` 一项都不抽，记一条警告后按 `0` 求值（权重之和溢出整数范围时同样按 `0`）。用在 `mxt:choice` 的 `actions` 与 `mxt:weighted_list` 的 `distribution`。`secret_realm` 的 `entry` 数组是唯一例外：`weight` 直接写在落点对象上（它还要带 `pos`、随机半径等字段），而且**负权重在那里的加载期被拒绝**，不按 `0` 算；`0` 一样表示不会被选中。 |

## `Cost`

需要**消耗**东西的字段统一是同一个数组，每项是下面五种之一，同一个 `type` 分派：

| 写法 | 字段 | 说明 |
| --- | --- | --- |
| `{"id": "example:qi", "amount": 5}` | `id`、`amount` | 简写，等价于 `mxt:resource`；定义 id 写在 `id` 里。 |
| `{"type": "mxt:resource", ...}` | `resource`、`amount` | 消耗一个数值；数值定义 id 写在 `resource` 里。 |
| `{"type": "mxt:aura", ...}` | `aura`、`amount` | 消耗一门灵气；灵气 id 写在 `aura` 里。扣什么由通道决定：付款者支付时扣**这门灵气所度量的那个数值**，从共享灵气池或方块存量支付时扣这门灵气本身。 |
| `{"type": "mxt:item", ...}` | `items`、`amount` | 消耗物品；`items` 是物品/标签匹配列表（物品 id、`#标签`，或带 `type` 的匹配条目，见下面的 [`ItemMatcher`](#itemmatcher)）。 |
| `{"type": "mxt:js", ...}` | `id`、`params` | 交给服务端脚本；`id` 是 `MxtCosts.register` 注册的回调 id，`params` 可省略。 |

`amount` 一律是数值提供器，使用时必须求值为**有限正数**，否则这一项付不出。`mxt:resource` 与 `mxt:aura` 问的是两件不同的事：前者点的是一个**数值**，后者点的是一门**灵气身份**。

```json
"costs": [
  {"id": "example:qi", "amount": 5},
  {"type": "mxt:resource", "resource": "example:stamina", "amount": "5 + level"},
  {"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2},
  {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}
]
```

规则：

- **整份数组全有或全无**：任何一项付不出，就什么都不扣——连本来付得出的那几项也不扣。
- **同一数组里两项指向同一个存储是加载错误**（同一个数值 id 写两次，或同一门灵气写两次）。两项只是经由不同路径到达同一个值**不是**错误：一个 `mxt:resource` 与一个用该数值度量的 `mxt:aura` 会把金额**相加**，因为这是唯一不依赖书写顺序的答案。
- 付款者是**活着的实体**（玩家、生物、召唤物都算），不一定是玩家。一项能不能付，取决于付款处提供哪些通道：

| 写法 | 从哪里扣 |
| --- | --- |
| `mxt:resource` | 付款者自己的数值账户。 |
| `mxt:aura` | 扣该灵气所度量的那个数值：付款者自己支付时从数值账户出；由场地从**共享灵气池**支付时（`cultivation.aura_costs`），先按同区块多人修炼的池子分配份额缩放，再由池子全有或全无地扣；从**方块实体的自有存量**支付时（灵气合成配方的 `aura`），扣这门灵气本身、按整单位向上取整。 |
| `mxt:item` | 需要玩家背包。付款者不是玩家（或阵法没有阵主）就是**付不出**，不是定义有问题。 |
| `mxt:js` | 需要玩家，并且在其它通道全部付完之后**最后**运行。脚本消耗不做暂存，所以脚本必须自己对它保持幂等。 |

缺少某个通道只会被报成「付不出」，永远不会被报成定义坏了。**解不出来的条目会让整份定义加载失败**（未知 `type`、缺必填字段都会）：`costs` 数组不套用容错列表的口径，不存在「打一条警告然后把这一项丢掉」。

用这个数组的字段共 12 个：`ability.costs`（**所有技能类型共用**，所以 `mxt:mount` 的每 tick 燃料与 `mxt:upkeep` 的每周期费用也写在这里）、`mxt:channelled` 的 `upkeep_costs`、`realm_stage.costs`、`cultivation.costs` 与 `cultivation.aura_costs`、`formation.activation_costs` 与 `formation.maintenance_costs`、`forging_method.costs`、`contract_type.costs`（签订契约的代价，由主人支付）、`talisman.costs`（`mxt:aura` 条目从载体自己的存量扣，其余向持有者收）、`quality.upgrade_costs`，以及灵气合成配方（`mxt:spirit_shaped` / `mxt:spirit_shapeless`）的 `aura`。其中 `cultivation.aura_costs` 与灵气合成配方的 `aura` **只收 `mxt:aura` 条目**（写其它类型是加载错误），这两个字段也接受 `{"<灵气 id>": 数值提供器}` 的映射写法。

**下面这些故意不是 `Cost`**，别去「修」它们：`talisman.capacity` 是个 **倍率**（double ≥ 1），它说的是「载体装得下几次发动的灵气」而不是「要扣什么」——容量的灵气身份来自同一条符 `costs` 里的灵气条目；`alchemy` 配方的 `minimum_aura` 与 `creature_profile.minimum_aura` 是要求，从不被消耗。货币系统与这套形状无关：`currency` 的 `exchanges[].cost` 是「一次兑换要几个货币物品」的整数价格（`1..99`），`quality.value_multiplier` 是价值修正，两者都不是 `Cost`。

## `AuraGain`

`cultivation.aura_gains` 用的是 `AuraGain`：字段名同样是 `id` 与 `amount`，但 `id` 指向一门灵气，`amount` 允许 `0`（有限非负即可）。它是另一种类型，与 `Cost` 无关，也不会进扣费事务。

这个列表是**容错**的：解不出来的条目会被丢弃并打一条 `Ignoring invalid list element` 警告，其余条目照常生效。

给任意数值加值时用的是 **`mxt:add_resource` 行为**而不是数组，它的字段是 `resource` 与 `amount`，`amount` 可以是负数：

```json
{"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
```

## `AttributeEntry`

属性修正条目。属性 ID 用原版的，例如 `minecraft:attack_damage`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attribute` | Identifier | **必填** | 要改的原版属性 ID。 |
| `id` | Identifier | **必填** | 这条属性修正的唯一 ID。 |
| `amount` | Double | **必填** | 没有动态 `value` 时使用的基础值。 |
| `operation` | Enum | **必填** | `add_value`、`add_multiplied_base` 或 `add_multiplied_total`。 |
| `value` | 数值提供器 | 无 | 填写后每 tick 在服务端按实体上下文重新计算，替代 `amount`。 |

## 图标引用

全模组的图标字段都是同一个值，**直接内联**：贴图写成一个字符串，物品写成一个对象。带这个字段的定义有 `ability`、`resource`、`forging_method` 与 `technique`。

| 写法 | 类型 | 说明 |
| --- | --- | --- |
| 字符串 | Identifier | 16x16 的 GUI 贴图，例如 `example:textures/gui/icon/sword.png`。 |
| 对象 | `ItemStackTemplate` | 物品，写完整的物品堆模板 `{"id": ...}`，可带 `count` 与 `components`。 |

两支是**按解析顺序**区分的：先试贴图，再试物品。因为两者都接受**字符串**，裸字符串会被贴图分支先拿走，所以**物品必须写成对象形式** `{"id": ...}`——写裸字符串只会得到一张同名的贴图，而不是物品。

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

### SpriteIcon

**资源条的贴图是另一种图标**（`SpriteIcon`）：`mxt:boss_bar` 的 `sprite_location` 与 `mxt:textured_bar` 的 `background_sprite` / `fill_sprite` 用它，因为一整套资源条不能只画 16x16。它**不是**上面那种图标引用（`ability.icon` / `resource.icon` 是一张 16x16 贴图或一个物品，只画一格、没有 `region` / `width` / `height`，也不认 `{"sprite": ...}`），反过来它也写不成物品。两者名字像、用途不同，别混。两种写法：

| 写法 | 类型 | 说明 |
| --- | --- | --- |
| 字符串 | Identifier | 沿用这个字段本来的含义：`sprite_location` 是**贴图路径**（默认 `mxt:textures/gui/resource_bar.png`，一张 25 格图集），`background_sprite` / `fill_sprite` 是 **GUI 图集精灵**。 |
| 对象 | 贴图或精灵 | `{"sprite": ...}` 是 GUI 图集精灵；`{"texture": ...}` 是贴图，可带 `region`（`u` / `v` / `texture_width` / `texture_height`，默认起点 `0,0`、整图 `256×256`）。两者都可带 `width` / `height`（画出来的**目标**尺寸，必须成对；省略＝按条自己的宽高画）。 |

`mxt:boss_bar` 的 `sprite_location` **只接受贴图**（它要把图集切成背景 / 填充 / 图标三种格子，精灵没有这个概念）；`mxt:textured_bar` 的两个字段两种都接受。精灵不能声明 `region`——图集已经知道它在哪。`width` / `height` 是**画出来的目标尺寸**，不是裁剪，而且只有背景那一侧会读：`background_sprite` 与 `mxt:boss_bar` 的图集贴图可以写，**`fill_sprite` 上写的尺寸不会被读**——填充是按条自己的进度裁出来的，给它一个固定尺寸没有意义，那两个键只是被解码、不参与绘制。

下面几条是**加载期错误**，会被明确拒绝：`mxt:boss_bar` 的 `sprite_location` 写精灵、精灵带 `region`、`width` / `height` 只写一个。

## Holder、标签与匹配器

跨注册表字段都在数据包加载阶段解析成条目引用，不在运行时重复查询注册表。

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

数组里每一项保留为条目或标签；重复值不会自动改变语义。**列表是有容错的**：容错列表里的坏条目会被丢掉并打一条 `Ignoring invalid list element` 警告，同一个列表里其余的条目照常生效；某个字段用不用这套口径，字段表会写明。

### `ItemMatcher`

`artifact`、`item_binding`、`weapon_binding`、`pill_binding`、`tool_binding`、`blueprint_binding`、`spirit_herb`、`item_aura` 和 `currency` 的 `items` 字段支持以下三种写法（`technique_binding` 的 `items` 是可选的第二条路，见[功法绑定](../json/technique_binding.md)）：

```json
"items": "minecraft:apple"
```

```json
"items": "#minecraft:logs"
```

```json
"items": ["minecraft:apple", "#minecraft:logs", "othermod:token"]
```

匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，按各自声明的 `priority` **从高到低**选择（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。

数组里的每一项也可以写成带 `type` 的对象，类型由固有注册表 `item_matcher_entry_type` 分派：

| `type` | 字段 | 匹配 |
| --- | --- | --- |
| `mxt:item` | `item` | 单个物品，简写的展开形式。 |
| `mxt:tag` | `tag` | 物品标签，简写的展开形式。 |
| `mxt:wildcard` | `pattern` | 物品 ID 的 `*`/`?` 通配符，例如 `{"type": "mxt:wildcard", "pattern": "mxt:*_spirit_stone"}`。 |
| `mxt:regex` | `pattern` | 物品 ID 的正则，例如 `{"type": "mxt:regex", "pattern": "mxt:(medium\|high)_spirit_stone"}`。 |
| `mxt:technique` | 无 | 堆上带 `mxt:technique` 组件的物品，也就是「一叠功法手册」：认的是**这一堆**教的哪一门功法，而不是物品 id，所以同一件玉简可以是任何一门功法。**它只问组件**：被某条 `technique_binding` 的 `items` 认领、却不带组件的物品不算命中。 |
| `mxt:spirit_storage` | 无 | 所有能被按住右键灌注灵气的物品（见[物品灵气数据包](/datapack/json/item_aura)）。这是唯一一个按「能力」而不是按 ID 匹配的条目，因此之后新增的同类物品会被自动覆盖。 |
| `mxt:herb_tag` | `element`、`material` | 匹配**是灵草**（能命中某条 `mxt:spirit_herb` 定义的物品）且该定义带有所问标签的物品：`element` 查 `element_tags`、`material` 查 `material_tags`，两者都写就要同时满足，两个都不写会被加载期拒绝。两边都写元素注册表的引用（条目或 `#` 标签），并**双向**展开成元素集合再取交集——草写的是「火灵草」、问的是「#温热元素」能匹配，反过来也能，所以标签写在哪一边都不影响结果。标签是草的属性而不是物品的属性，所以内容可以写「任意火属性灵草」而不必知道之后有哪些物品被绑到那条草上（例如 `{"type": "mxt:herb_tag", "element": "example:fire"}` 或 `{"type": "mxt:herb_tag", "element": "#example:fire_like"}`）。实体条件里可以套在 `mxt:item_matcher` 中使用，例如用 `mxt:has_equipped_item` 判断「手上拿着火属性灵草」。 |
