---
title: trigger（事件规则）
aside: false
---

# trigger（事件规则） {#trigger}

文件位置：`data/<namespace>/mxt/trigger/<path>.json`

**用途**：事件规则：信号、条件与行为。

`trigger` 是一条独立的事件反应规则：某个信号被发布时，匹配该信号的规则会把条件对"信号的动作主体"求值，条件成立则执行行为。它不隶属于任何技能，因此内容包可以把任意已发布的信号变成效果，例如“破坏方块时给某个资源 +1”。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trigger` | `Trigger` | **必填** | 该规则响应的信号，写法与技能触发器一致：内置信号写 `{"type": "mxt:block_break"}`，脚本匹配器（`mxt:js`）可检查整个信号。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 针对信号主体求值，使用事件提供的公式上下文；写数组表示全部满足。 |
| `action` | `EntityAction` | `mxt:no_op` | 条件成立后对该主体执行；写数组按顺序执行。 |

规则需要动作主体：没有主体的信号只会送达订阅，不会触发规则（条件与行为都属于某一个实体）。

条件与行为拿到的父上下文就是事件上下文，因此发布方写入的公式值可以读取：响应 `mxt:hurt` 的规则可以用 `damage` 决定数值，脚本用 `MxtTriggers.publish` 发布的自定义信号同理。

示例：

```json
// data/example/mxt/trigger/qi_from_mining.json
{
  "trigger": {"type": "mxt:block_break"},
  "condition": {"type": "mxt:health", "comparison": ">=", "compare_to": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 1}
}
```

```json
// data/example/mxt/trigger/qi_from_damage.json
{
  "trigger": {"type": "mxt:hurt"},
  "condition": {"type": "mxt:resource_compare", "resource": "example:qi", "min": 10},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": "damage / 2"}
}
```

规则在服务器缓存构建时按“触发器声明的信号”建索引，发布信号只花一次查表；规则的行为若又发布了自己响应的信号，会在自身执行期间被跳过以避免递归；规则抛异常只记录日志，不影响同一信号的其他规则与订阅。

订阅本身按「信号 → 所有者 → 模块:标识」分层索引：同一个标识只在它自己的实体内部唯一，所以两个实体持有同一份定义不会互相顶掉。发布时先按所有者判空，再取该所有者的订阅快照——一次性订阅在运行中会把自己摘掉，快照是为此存在的。发布主体是假玩家时整个信号被忽略，与 NeoForge 拒绝给假玩家发放进度是同一个道理。

校验与其他数据包定义一样在缓存构建时完成，问题会**全部收集**而不是遇到第一个就中断：`/mxt registries validate` 一次列出所有问题（每条都带 `data/<命名空间>/mxt/<注册表>/<path>` 路径），`/mxt trigger rules <信号>` 可以确认某个信号到底有没有规则响应。规则声明了 `condition` 却漏写 `action` 也算一条问题——默认行为是空操作，规则会永远什么都不做。

三个同名概念要区分：**规则**（本页，数据包注册表 `mxt/trigger`）、**触发器匹配器**（固有注册表 `mxt:trigger_type`，决定信号如何匹配；内置按信号类型匹配，另有 `mxt:js`）、**信号**（运行时通知本身，模组为各类事件发布，脚本也可发布）。

## 移植的原版触发器

第二类匹配器把原版进度的触发器搬了过来：每个对应一个原版 trigger，沿用原版 id，**判定直接交给原版自己的实例代码**，所以 `conditions` 的字段与原版逐字一致（原版进度里那段 `conditions` 可以整段复制过来）。例如原版 `player_killed_entity` 写 `entity` + `killing_blow`，这里同样是这两个字段。

| 信号 / `type` | 原版触发器 | `conditions` 字段 |
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

`player`、`entity`、`victim` 这类字段沿用原版的写法：既可以是一段战利品条件列表（`[{"condition": "minecraft:entity_properties", "entity": "this", "predicate": {...}}]`，多项表示全部满足），也可以直接写实体谓词（`{"type": "minecraft:zombie"}`）。既然是战利品条件，模组自己的条件也能写进去，例如 `{"condition": "mxt:realm", "realm": "mxt:foundation"}`。

与原版进度的差异有两条是**故意的**，另有三条是**时机的差别**：

- 这些信号由模组自己的钩子发布，因此**可重复、只在运行时存在**，并且和内置信号一样能被规则、技能触发器和修炼突破条件共用；原版同一时刻的 criterion 是"某个玩家某条进度上的一次性布尔值"，还会写进存档。
- 信号只对它原本服务的那个玩家发布（原版的进度触发器也只认 `ServerPlayer`），所以带实体谓词的字段总能拿到求值需要的上下文。
- `mxt:changed_dimension` 在传送**之前**发布（原版在传送完成后记账，而 NeoForge 只提供传送前的事件）；`mxt:tame_animal` 在驯服**落地之前**发布（原版在写回驯服标记之后），读驯服状态自身（`nbt`、`flags`）的谓词会看到旧值。
- `mxt:effects_changed` 在一 tick 结束时发布，这样 `effects` 描述的就是变化后的效果集合；同一 tick 内的多次变化合并成一次。
- `mxt:fishing_rod_hooked` 只覆盖"钓上战利品"那一次（原版对"钩住实体"另发一次，NeoForge 没有对应事件），而且事件只带鱼钩不带鱼竿，鱼竿按玩家双手推断。

伤害类信号除了判定用的 `damage`，还额外提供 `original_damage`、`blocked`（`1`/`0`）与 `blocked_damage` 给公式使用；`mxt:consume_item` 提供 `use_duration`，`mxt:levitation` 提供 `duration`（已持续的 tick 数）。

其中 11 条原版**自己就在轮询**（`ServerPlayer` 每 tick 或落地时比较），移植方式就是照抄那段比较，所以节奏与原版一致：`mxt:location` 每 20 tick 一次；`mxt:using_item` 在使用物品期间每 tick 一次；`mxt:levitation` 在效果存续期间每 tick 一次；`mxt:ride_entity_in_lava` 在载具进入岩浆后每 tick 一次；`mxt:fall_from_height` 在开始下落时记起点、落地时发布；`mxt:fall_after_explosion` 同样在起跳时判断，读的是模组能读到的原版公开字段 `currentImpulseImpactPos` 与 `currentExplosionCause`（因此只对风弹一类真正带冲量的爆炸成立，与原版一致）；`mxt:nether_travel` 在进入下界时记位置、回到主世界时发布；`mxt:inventory_changed` 与 `mxt:slept_in_bed` 分别在背包格子变化、睡着那一刻发布。

`mxt:enter_block` 是这一族里唯一的**近似**：原版测的是该 tick 的**移动路径**与方块内部形状的相交（因此站在水里不动也会每 tick 重复触发），模组测的是玩家碰撞箱**新覆盖**到的方块——液体算，无碰撞的草与火把不算。"走进去"这个时机一致，但站住不动不会重复触发，需要持续效果时请用 `mxt:tick` 或加冷却。

最后两条也从那份背包比对里认出来：`mxt:filled_bucket` 看"空桶被非空物品替换"，`mxt:item_durability_changed` 看"同一物品的损伤值上升"（修复不触发，与原版一致）。判定本身仍走原版实例：实例拿到的是**变化前**的那份堆，所以 `delta` 用原版算法时受损为负（写 `{"max": -1}`），`durability` 是变化后的**剩余**耐久。代价是这两条比原版**更宽**：从箱子里取出一个装满的桶、或用命令直接改背包，也会被认作"装满了桶"。

原版还有两条**有意不移植**：`summoned_entity` 需要的"是谁摆下这一块"只存在于方块代码内部（`FinalizeSpawnEvent` 与 `BlockEvent.EntityPlaceEvent` 各拿一半，拼起来会张冠李戴），`cured_zombie_villager` 的起因玩家是 `ZombieVillager` 的私有字段 `conversionStarter`（`LivingConversionEvent` 不暴露它）。

