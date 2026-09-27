---
title: 触发器与消耗类型
description: 触发器匹配器 mxt:trigger_type 与消耗 mxt:cost_type 的全部内置条目、字段、默认值与判定规则。
---

# 触发器与消耗类型

## `trigger_type`

触发器匹配器决定技能、突破条件与事件规则响应哪些运行时事件。内置信号匹配器每个条目写死一个信号 id，派发到这一步时回答「到的是不是这个信号」；`mxt:js` 是例外，它的信号由定义自己给出。`type` 写在触发器对象上，取值是下面列出的 id 之一，命名空间固定 `mxt`；整族由固有注册表 `mxt:trigger_type` 分派，数据包只能选用，不能新增。

触发器对象写在[事件规则](../../json/trigger.md#trigger)的 `trigger` 字段下，技能与突破条件把一组触发器写在 `triggers` 数组里：

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:item_use"}]}
```

除 `mxt:js` 外，这些匹配器都不带字段，整个条目就是 `{"type": ...}` 这一层。

### `mxt:tick`

实体周期性 tick。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:tick"}
```

### `mxt:attack`

实体攻击了另一个实体。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:attack"}
```

### `mxt:hurt`

实体受到伤害。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:hurt"}
```

### `mxt:kill`

实体击杀了另一个实体。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:kill"}
```

### `mxt:block_break`

实体破坏了一个方块。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:block_break"}
```

### `mxt:block_use`

实体使用了一个方块。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:block_use"}
```

### `mxt:item_use`

实体完成了一次物品使用。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:item_use"}
```

### `mxt:equip`

实体的装备发生了变化。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:equip"}
```

### `mxt:death`

实体死亡。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:death"}
```

### `mxt:breakthrough`

实体完成了一次突破。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:breakthrough"}
```

### `mxt:technique_stage`

已学会的功法达到新的水平。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:technique_stage"}
```

### `mxt:js`

由服务端脚本回调决定的匹配器。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `signal` | Identifier | **必填** | 该匹配器监听的信号 id；订阅以它为索引 |
| `id` | String | **必填** | 用 `MxtTriggers.matcher` 注册的回调 id |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill"}]}
```

这是数据包响应**自定义**信号 id 的唯一途径：服务端脚本用 `MxtTriggers.publish` 发出信号，然后要么让脚本自己订阅它，要么在技能、事件规则或某个数值的突破条件里声明这个触发器。回调只决定到达订阅的那个信号算不算命中，所以回调缺失或抛异常时永远不会匹配。见 [KubeJS API 参考](../../../kubejs/api-reference.md)。

### 移植的原版触发器

这一族的条目同样属于 `mxt:trigger_type`，每个对应一个原版进度的触发器，沿用原版 id，判定交给原版自己的实例代码，所以字段与原版逐字一致——原版进度里那段 `conditions` 可以整段复制过来。区别只在外层：原版把参数包在 `conditions` 里，这里没有那层包装，字段直接与 `type` 同级（原版 `player_killed_entity` 写 `entity` + `killing_blow`，这里同样是这两个字段）。

左列的 `type` 一律是 `mxt:` 命名空间，原版触发器名只用来对照。

| 信号 / `type` | 原版触发器 | 读取的字段 |
| --- | --- | --- |
| `mxt:consume_item` | `minecraft:consume_item` | `player`、`item` |
| `mxt:brewed_potion` | `minecraft:brewed_potion` | `player`、`potion` |
| `mxt:tame_animal` | `minecraft:tame_animal` | `player`、`entity` |
| `mxt:bred_animals` | `minecraft:bred_animals` | `player`、`parent`、`partner`、`child` |
| `mxt:villager_trade` | `minecraft:villager_trade` | `player`、`villager`、`item` |
| `mxt:used_totem` | `minecraft:used_totem` | `player`、`item` |
| `mxt:started_riding` | `minecraft:started_riding` | `player` |
| `mxt:changed_dimension` | `minecraft:changed_dimension` | `player`、`from`、`to` |
| `mxt:effects_changed` | `minecraft:effects_changed` | `player`、`effects`、`source` |
| `mxt:lightning_strike` | `minecraft:lightning_strike` | `player`、`lightning`、`bystander` |
| `mxt:player_hurt_entity` | `minecraft:player_hurt_entity` | `player`、`damage`、`entity` |
| `mxt:entity_hurt_player` | `minecraft:entity_hurt_player` | `player`、`damage` |
| `mxt:player_killed_entity` | `minecraft:player_killed_entity` | `player`、`entity`、`killing_blow` |
| `mxt:entity_killed_player` | `minecraft:entity_killed_player` | `player`、`entity`、`killing_blow` |
| `mxt:shot_crossbow` | `minecraft:shot_crossbow` | `player`、`item` |
| `mxt:player_interacted_with_entity` | `minecraft:player_interacted_with_entity` | `player`、`item`、`entity` |
| `mxt:fishing_rod_hooked` | `minecraft:fishing_rod_hooked` | `player`、`rod`、`entity`、`item` |
| `mxt:thrown_item_picked_up_by_player` | `minecraft:thrown_item_picked_up_by_player` | `player`、`item`、`entity` |
| `mxt:enter_block` | `minecraft:enter_block` | `player`、`block`、`state` |
| `mxt:location` | `minecraft:location` | `player` |
| `mxt:slept_in_bed` | `minecraft:slept_in_bed` | `player` |
| `mxt:levitation` | `minecraft:levitation` | `player`、`distance`、`duration` |
| `mxt:using_item` | `minecraft:using_item` | `player`、`item` |
| `mxt:fall_from_height` | `minecraft:fall_from_height` | `player`、`start_position`、`distance` |
| `mxt:fall_after_explosion` | `minecraft:fall_after_explosion` | `player`、`start_position`、`distance`、`cause` |
| `mxt:ride_entity_in_lava` | `minecraft:ride_entity_in_lava` | `player`、`start_position`、`distance` |
| `mxt:nether_travel` | `minecraft:nether_travel` | `player`、`start_position`、`distance` |
| `mxt:inventory_changed` | `minecraft:inventory_changed` | `player`、`slots`、`items` |
| `mxt:filled_bucket` | `minecraft:filled_bucket` | `player`、`item` |
| `mxt:item_durability_changed` | `minecraft:item_durability_changed` | `player`、`item`、`durability`、`delta` |

`player`、`entity`、`victim` 这类字段沿用原版的写法：既可以是一段战利品条件列表（`[{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {...}}]`，多项表示全部满足），也可以直接写实体谓词（`{"type": "minecraft:zombie"}`）。既然是战利品条件，模组自己的条件也能写进去，例如 `{"condition": "mxt:realm", "realm": "mxt:foundation"}`。下面三条照抄自原版进度，只去掉了 `conditions` 那一层：

```json
{"type": "mxt:consume_item", "item": {"items": "minecraft:golden_apple"}}
```

```json
{
  "type": "mxt:player_killed_entity",
  "entity": [{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {"type": "minecraft:breeze"}}]
}
```

```json
{"type": "mxt:changed_dimension", "to": "minecraft:the_nether"}
```

这些信号由模组自己的钩子发布，因此**可重复、只在运行时存在**，并且和内置信号一样能被事件规则、技能触发器与突破条件共用。信号只对它原本服务的那个玩家发布（原版的进度触发器也只认玩家），所以带实体谓词的字段总能拿到求值需要的上下文。

三条是时机的差别：

- `mxt:changed_dimension` 在传送**之前**发布（原版在传送完成后记账）；`mxt:tame_animal` 在驯服**落地之前**发布（原版在写回驯服标记之后），读驯服状态自身（`nbt`、`flags`）的谓词会看到旧值。
- `mxt:effects_changed` 在一 tick 结束时发布，这样 `effects` 描述的就是变化后的效果集合；同一 tick 内的多次变化合并成一次。
- `mxt:fishing_rod_hooked` 只覆盖"钓上战利品"那一次（原版对"钩住实体"另发一次），而且事件只带鱼钩不带鱼竿，鱼竿按玩家双手推断。

伤害类信号除了判定用的 `damage`，还额外提供 `original_damage`、`blocked`（`1`/`0`）与 `blocked_damage` 给公式使用；`mxt:consume_item` 提供 `use_duration`，`mxt:levitation` 提供 `duration`（已持续的 tick 数）。

其中 11 条原版**自己就在轮询**（每 tick 或落地时比较），移植方式就是照抄那段比较，所以节奏与原版一致：`mxt:location` 每 20 tick 一次；`mxt:using_item` 在使用物品期间每 tick 一次；`mxt:levitation` 在效果存续期间每 tick 一次；`mxt:ride_entity_in_lava` 在载具进入岩浆后每 tick 一次；`mxt:fall_from_height` 在开始下落时记起点、落地时发布；`mxt:fall_after_explosion` 同样在起跳时判断，因此只对风弹一类真正带冲量的爆炸成立，与原版一致；`mxt:nether_travel` 在进入下界时记位置、回到主世界时发布；`mxt:inventory_changed` 与 `mxt:slept_in_bed` 分别在背包格子变化、睡着那一刻发布。

`mxt:enter_block` 是这一族里唯一的**近似**：原版测的是该 tick 的**移动路径**与方块内部形状的相交，所以站在水里不动也会每 tick 重复触发；这里测的是玩家碰撞箱**新覆盖**到的方块——液体算，无碰撞的草与火把不算。"走进去"这个时机一致，但站住不动不会重复触发。需要持续效果就用 `mxt:tick`，或给规则加 `cooldown`。

`mxt:filled_bucket` 看"空桶被非空物品替换"，`mxt:item_durability_changed` 看"同一物品的损伤值上升"（修复不触发，与原版一致）。判定仍走原版实例：实例拿到的是**变化前**的那份堆，所以 `delta` 用原版算法时受损为负（写 `{"max": -1}`），`durability` 是变化后的**剩余**耐久。代价是这两条比原版**更宽**：从箱子里取出一个装满的桶、或用命令直接改背包，也会被认作"装满了桶"。

原版还有两条有意不移植：`summoned_entity` 需要的"是谁摆下这一块"只存在于方块代码内部，拼起来会张冠李戴；`cured_zombie_villager` 的起因玩家不对外暴露。

---

## `cost_type`

需要消耗东西的字段统一是数组，每项写一种 `Cost`。写 `type` 的四种由固有注册表 `mxt:cost_type` 分派：`mxt:resource`、`mxt:aura`、`mxt:item`、`mxt:js`；另一种是不写 `type`、只写 `id` 与 `amount` 的简写，读作 `mxt:resource`。整份数组的全有或全无语义、通道规则与共用的求值口径见[共享数据类型 · `Cost`](../shared_data_types.md#cost)。

### `mxt:resource`

从付款者的数值账户中消耗一个数据包数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | 数值 id | **必填** | 要消耗的数值 |
| `amount` | `NumberProvider` | **必填** | 要消耗的数量；必须求值为有限正数 |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}
```

### `mxt:aura`

按灵气身份消耗。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id | **必填** | 要消耗的灵气身份 |
| `amount` | `NumberProvider` | **必填** | 要消耗的数量；必须求值为有限正数 |

```json
{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}
```

扣的是什么由付款通道决定：付款者自己支付时扣**这门灵气所度量的那个数值**（付款者身上装的是数值，不是灵气），从共享灵气池或方块存量支付时扣这门灵气本身，后者按整单位向上取整。两条通道的差别见[共享数据类型 · `Cost`](../shared_data_types.md#cost)。

### `mxt:item`

从玩家背包中消耗匹配的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 哪些物品可以被消耗；见 [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **必填** | 要消耗的匹配物品数量，向上取整；结果非正或非有限表示这笔 `Cost` 无法支付 |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

### `mxt:js`

检查与支付都交给服务端脚本回调。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtCosts.register` 注册的回调 id |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

脚本 `Cost` 在服务端先检查、后支付，并且需要一个玩家。回调收到的是付款者与 `params`，而不是技能的公式上下文，因为 `Cost` 只用付款者求值。

**不写 `type` 的简写。** 数组里的一项也可以只写 `id` 与 `amount`，它会被读作 `mxt:resource`：

```json
{"id": "example:qi", "amount": 5}
```

上面这一项等价于 `{"type": "mxt:resource", "resource": "example:qi", "amount": 5}`。

付款者是**活着的实体**（玩家、生物、召唤物都算），不一定是玩家。`mxt:item` 需要玩家背包，付款者不是玩家（或阵法没有阵主）时就是**付不出**，而不是定义写错了；`mxt:js` 需要玩家，并且**在所有其它通道都付完之后最后运行**——脚本消耗不做暂存，所以脚本必须自己对它保持幂等。

整份数组是**全有或全无**的：任何一项付不出，就什么都不扣。同一数组里两项指向同一个存储（同一个数值写两次，或同一门灵气写两次）会让定义**加载失败**；而一个 `mxt:resource` 与一个用该数值度量的 `mxt:aura` 会把金额相加，那不是错误。解不出来的条目也会让定义加载失败，不会被静默丢弃。
