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
| `ItemStackTemplate` | `{"id":"minecraft:stone"}` | 原版物品堆模板，可附带 `count` 和数据组件；也接受裸物品 ID 字符串。 |
| `ItemStack` | `{"id":"minecraft:amethyst_shard"}` | 原版物品堆，**必须写成对象**（`id` 必填，可带 `count` 与 `components`），不接受裸物品 ID 字符串；与上面那条模板的区别就在这里。 |
| `NumberProvider` | 数字、字符串或对象 | 常量、exp4j 表达式或固有数值提供器。 |
| `EntityAction` | 对象或对象数组 | 对实体执行行为；数组按顺序执行。 |
| `BiEntityAction` | 对象或对象数组 | 对来源实体和目标实体执行行为。 |
| `BlockAction` | 对象或对象数组 | 对方块位置执行行为。 |
| `ItemAction` | 对象或对象数组 | 对物品堆执行行为。 |
| `EntityCondition` | 对象或对象数组 | 数组表示全部条件都必须满足。 |
| `Weighted<T>` | `{"value": …, "weight": 3}` | 加权列表的一项，全站只有这一种形状：`value` 必填、`weight` 可选（默认 `1`）。权重 `≤0` 的条目算 `0`（永远不会被选中），整表权重全为 `0` 时等概率抽一项。用在 `mxt:choice` 的 `actions` 与 `mxt:weighted_list` 的 `distribution`。`secret_realm` 的 `entry` 数组是唯一例外：`weight` 直接写在落点对象上（它还要带 `pos`、随机半径等字段），而且**负权重在那里的加载期被拒绝**，不按 `0` 算；`0` 一样表示不会被选中。 |

### `Cost`

需要**消耗**的字段统一是同一个数组，每项为一种 `Cost`（这个类型以前叫 `ResourceCost`；**JSON 键名没有改**，变的是它现在也接受灵气、物品与脚本条目），共五种写法：

| 写法 | 说明 |
| --- | --- |
| `{"id": "example:qi", "amount": 5}` | 简写，等价于 `mxt:resource`；定义 id 写在 `id` 里。 |
| `{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}` | 消耗一个数值；数值定义 id 写在 `resource` 里。 |
| `{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}` | 消耗一门灵气；灵气 id 写在 `aura` 里。扣什么由通道决定：付款者支付时扣**这门灵气所度量的那个数值**，从共享灵气池或方块存量支付时扣这门灵气本身。 |
| `{"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}` | 消耗物品；`items` 是物品/标签匹配列表（物品 id、`#标签`，或带 `type` 的匹配条目，见 [`ItemMatcher`](#itemmatcher)）。 |
| `{"type": "mxt:js", "id": "my_cost", "params": {}}` | 交给服务端脚本；`id` 是 `MxtCosts.register` 注册的回调 id，`params` 可省略。 |

`amount` 一律是 `NumberProvider`，使用时必须求值为**有限正数**，否则这一项付不出。`mxt:resource` 与 `mxt:aura` 问的是两件不同的事：前者点的是一个**数值**，后者点的是一门**灵气身份**。付款者自己支付时它从**数值账户**出——扣的就是这门灵气所度量的那个数值，与对应的 `mxt:resource` 条目走同一个账户（付款者持有的是数值，不是灵气）；而由共享灵气池或方块存量支付时，扣的就是这门灵气本身。

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
| `mxt:aura` | 扣该灵气所度量的那个数值：付款者自己支付时从数值账户出；由场地从**共享灵气池**支付时（`cultivate_action.aura_costs`），先按同区块多人修炼的池子分配份额缩放，再由池子全有或全无地扣；从**方块实体的自有存量**支付时（灵气合成配方的 `aura`），扣这门灵气本身、按整单位向上取整。 |
| `mxt:item` | 需要玩家背包。付款者不是玩家（或阵法没有阵主）就是**付不出**，不是定义有问题。 |
| `mxt:js` | 需要玩家，并且在其它通道全部付完之后**最后**运行。脚本消耗不做暂存，所以脚本必须自己对它保持幂等。 |

「从场地（共享灵气池）支付」与「从方块实体自有存量支付」两条通道现在都有真实使用者：前者是 `cultivate_action.aura_costs`（在修炼者所在位置从共享灵气池支付，多人同区块修炼时先按分配份额缩放，再由池子全有或全无地扣），后者是灵气合成配方（`mxt:spirit_shaped` / `mxt:spirit_shapeless`）的 `aura`（从灵气工作台的存量支付，按整单位向上取整）。

缺少某个通道只会被报成「付不出」，永远不会被报成定义坏了。无法解码的条目会让**定义加载失败**，不再有「打一条警告然后把这一项丢掉」的行为。

用这个数组的字段（共 10 个）：`ability.costs`（**所有技能类型共用**，所以 `mxt:mount` 的每 tick 燃料与 `mxt:upkeep` 的每周期费用也写在这里）、`mxt:channelled` 的 `upkeep_costs`、`realm_stage.costs`、`cultivate_action.costs` 与 `cultivate_action.aura_costs`、`formation.activation_costs` 与 `formation.maintenance_costs`、`forging_method.costs`、`contract_type.costs`（签订契约的代价，由主人支付），以及灵气合成配方（`mxt:spirit_shaped` / `mxt:spirit_shapeless`）的 `aura`。最后两项只接受 `mxt:aura` 条目（写其它类型是加载错误），它们旧的 `{"<灵气 id>": NumberProvider}` 映射写法仍然可读（兼容），但序列化时一律写成数组形式。

**下面这些故意不是 `Cost`**，别去「修」它们：`talisman.aura_cost` 仍然是 `{"<灵气 id>": NumberProvider}` 映射，它是「载体要充满多少这门灵气才触发」的**要求**（同时也是灌注容量），不是支付；`alchemy` 配方的 `minimum_aura` 与 `creature_profile.minimum_aura` 是要求，从不被消耗。货币系统与这套形状无关：`currency` 的 `exchanges[].cost` 是「一次兑换要几个货币物品」的整数价格（`1..99`），`quality.value_multiplier` 是价值修正，两者都不是 `Cost`。

### `AuraGain`

`cultivate_action.aura_gains` 用的是 `AuraGain`：字段名同样是 `id` 与 `amount`，但 `id` 是 `Holder<aura>`，`amount` 允许 `0`（有限非负即可）。它是另一种类型，与 `Cost` 无关。

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
