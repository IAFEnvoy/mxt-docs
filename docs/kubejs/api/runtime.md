---
title: 运行时领域 API
---

# 运行时领域 API

## `MxtAbilities`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `use(entity, ability)` | `Entity`、技能 ID | `AbilityService.UseResult` | 施放实体已持有的技能，仅在服务端生效。 |
| `selector(id, callback)` | 回调 ID、`(actor, context, params) => Entity[]` | `void` | 注册数据包类型 `mxt:js` 的技能目标选择器。 |
| `grant(entity, ability, source)` | `Entity`、技能 ID、来源 ID（`命名空间:路径`） | `boolean` | 以该来源授予技能；来源此前未持有该技能才返回 `true`。未知技能返回 `false`（不是错误），客户端不改动任何东西。 |
| `revoke(entity, ability, source)` | `Entity`、技能 ID、来源 ID | `boolean` | 只撤这一份来源，成功时返回 `true`；**技能本身要等最后一份来源松手才消失**，那时它的冷却和按技能存储的状态一并丢弃。目标没有这一来源时返回 `false`。 |
| `has(entity, ability)` | `Entity`、技能 ID | `boolean` | 是否持有；读的是附件，因此停用或已删除的定义也答得出来。 |
| `list(entity)` | `Entity` | `List<String>` | 当前持有的全部技能 ID，按 ID 排序。 |
| `sources(entity, ability)` | `Entity`、技能 ID | `List<String>` | 当前还在维持这项技能的来源，按 ID 排序；没持有则为空列表。 |

技能和诅咒授予用的是同一套来源账本：**只要还有一份来源持有，它就存在**，最后一份松手才真的移除。来源必须是命名空间标识符（如 `example:quest_reward`），写错会抛 `IllegalArgumentException`。授予、撤销、查询都只在服务端生效，客户端一律返回 `false` 或空列表且不改动任何东西。`use` 的结果 record：`committed()` 表示立即完成，`casting()` 表示已开始吟唱，`failure()` 为失败枚举，`failedResource()` 为不足的资源 ID，`amounts()` 为实际支付资源。

```js
const result = MxtAbilities.use(player, 'example:fireball')
if (result.failure() !== null) console.warn(String(result.failure()))
```

`selector` 注册数据包类型 `mxt:js` 的技能目标选择器。回调返回要作用的实体数组，数组里的 `null` 会被丢弃：

```js
MxtAbilities.selector('example:nearest_three', (actor, context, params) => {
  const range = params.range || 8
  const found = []
  actor.level().getEntities(actor, actor.getBoundingBox().inflate(range))
    .forEach(entity => found.push(entity))
  found.sort((a, b) => a.distanceToSqr(actor) - b.distanceToSqr(actor))
  return found.slice(0, 3)
})
```

```json
{
  "target_selector": {"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}},
  "bi_entity_action": {"type": "mxt:heal", "amount": 4}
}
```

## `MxtCultivation`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `add(entity, resource, amount)` | `LivingEntity`、资源 ID、有限非负数 | `boolean` | 向该资源对应的修为进度增加数值。客户端、未知资源、负数或非有限数返回 `false`。 |
| `tryBreakthrough(entity, resource)` | `LivingEntity`、资源 ID | `CultivationService.BreakthroughResult` | 按对应资源的境界链尝试突破。 |

突破结果的 record 访问器为 `advanced()`、`failure()`、`failedResource()`、`costs()`。它会正常触发 `cultivationBreak`、突破动作、粒子、天劫和关联技能流程。

## `MxtCurses`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `apply(entity, curse, stacks, source)` | `Entity`、诅咒 ID、正整数层数、来源 ID（`命名空间:路径`） | `CurseService.ApplyResult` | 走完整条件和合并逻辑；来源加入账本。 |
| `applyFor(entity, curse, stacks, source, durationTicks)` | 同上，另加时长（tick） | `CurseService.ApplyResult` | 时长只能**收紧**：超过定义声明的时长会被定义本身的时长盖住。 |
| `remove(entity, curse)` | `Entity`、诅咒 ID | `boolean` | 以 `EXPLICIT` 原因**整条**移除（所有来源一起抹掉）；触发移除事件。被停用/已删除的定义只有这条路能取下来。 |
| `release(entity, curse, source)` | `Entity`、诅咒 ID、来源 ID | `boolean` | 只撤这一份来源；返回 `true` 表示正是这一撤把诅咒取了下来，`false` 则表示它还在（别的来源仍持有，或者这份来源本来就不在账上——两种情况都返回 `false`，想知道是谁在维持就读 `sources`）。 |
| `has(entity, curse)` | `Entity`、诅咒 ID | `boolean` | 是否持有；读的是附件，因此停用或已删除的定义也答得出来。 |
| `stacks(entity, curse)` | `Entity`、诅咒 ID | `int` | 层数，没持有为 `0`。 |
| `remainingTicks(entity, curse)` | `Entity`、诅咒 ID | `long` | 剩余 tick；永不到期为 `-1`，没持有为 `0`。 |
| `sources(entity, curse)` | `Entity`、诅咒 ID | `List<String>` | 当前还在维持这条诅咒的来源，按 ID 排序。 |

诅咒和技能授予用的是同一套来源账本：**只要还有一份来源持有，它就存在**，最后一份松手才真的移除。`ApplyResult` 可调用 `applied()`、`cancelled()`、`failure()`、`instance()`；`failure()` 除 `CONDITION`/`CANCELLED`/`SERVER_ONLY` 外还有 `DISABLED`（定义被 `#mxt:disabled` 停用）、`UNKNOWN`（定义已不在注册表）、`REENTRANT`（同一实体的同一条诅咒正在事务中，自引用被拒）、`INVALID_DURATION`（时长无法兑现，未写入）。`source` 建议写稳定来源，如 `example:quest_reward`，以便数据和事件追踪。

## `MxtAura`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `get(level, pos)` | `Level`、`BlockPos` | `AuraResult` | 读取该位置最终解析后的多资源灵气。只读，客户端可查询其本地可用状态。 |
| `addBox(level, zone, minX, minY, minZ, maxX, maxY, maxZ, priority)` | 服务端 `Level`、已加载 aura zone ID、两个方块坐标、整数优先级 | `string` | 添加持久化长方体区域，返回生成的区域 ID。 |
| `remove(level, area)` | 服务端 `Level`、`addBox` 返回的区域 ID | `boolean` | 删除对应持久化区域。 |

`addBox` 仅接受 `ServerLevel`，且 `zone` 必须是已加载的 `aura_zone` 数据包 ID；否则抛出异常。`AuraResult` 常用只读方法：`aura()`、`concentration()`、`maximum()`、`regenPerTick()`、`cultivationSpeed()`、`source()`、`sourceKind()`、`suppressCultivate()`。

## `MxtElements`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**当前生效**的灵根所指的元素 ID，按 ID 排序。停用的元素与关闭的灵根都不算，没有灵根则为空列表。 |
| `has(entity, element)` | `Entity`、元素 ID | `boolean` | 该实体的灵根是否指向这个元素。 |
| `amount(entity, element)` | `Entity`、元素 ID | `double` | 这个元素在该实体身上的附着量；没有则为 `0`，元素被停用或不存在也返回 `0`。客户端读同步过来的副本。 |
| `attach(entity, element, amount)` | `Entity`、元素 ID、有限数值 | `double` | 走与打击**同一条**管线给实体加上（负数则扣掉）该元素的附着，返回新的附着量。攒够时 [`element_reaction`](/datapack/json/element_reaction) 照常触发。 |

元素与附着是两件事：`list`/`has` 读的是灵根（这个身体"是什么"），`amount`/`attach` 读写的是一张按元素记数的附着表（这个身体"攒了多少"）。`attach` 与实体行为 `mxt:attach_element` 等价，因此"泡在岩浆里""服丹""诅咒持续喂火"这类来源用脚本写也一样；负数可以用来净化。三个读方法两侧都能用（附着表是同步过来的附件，客户端脚本读的是本地副本，物品悬浮提示那类逻辑正是这么用的）；只有 `attach` 是服务端操作，客户端、未知或被停用的元素、非有限值、`0` 一律返回 `0` 且不改动任何东西。

```js
// kubejs/server_scripts/mxt_element.js
PlayerEvents.tick(event => {
  const player = event.player
  if (player.level().isClientSide()) return
  // "身上有水灵根、且火气攒到 8 了" —— 反应还没触发就能先看到苗头。
  if (MxtElements.has(player, 'mxt_test:water') && MxtElements.amount(player, 'mxt_test:fire') >= 8) {
    console.info(`water cultivator carrying ${MxtElements.list(player)}`)
  }
})

// 让一次自定义事件给目标攒火气；攒够时数据包里的 element_reaction 会自己结算。
MxtElements.attach(target, 'mxt_test:fire', 4)
```

## `MxtSpiritRoots`

灵根是身体修炼身份的**元素那一半**：持有它就绑定了元素、改变该元素灵气的修炼速度，并缩放亲和这个元素的技能。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**持有**的灵根 ID，按 ID 排序。关闭的灵根、定义已被停用或删除的灵根仍会列出——它确实还持有。 |
| `active(entity)` | `Entity` | `List<String>` | 现在**生效**的灵根：关掉的、以及绑定元素被停用的都不算。 |
| `has(entity, root)` | `Entity`、灵根 ID | `boolean` | 是否持有（与 `mxt:has_spirit_root` 同义：关闭也算持有）。 |
| `enabled(entity, root)` | `Entity`、灵根 ID | `boolean` | 该灵根是否处于开启状态；不持有则为 `false`。 |
| `grant(entity, root)` | `LivingEntity`、灵根 ID | `{changed, failure}` | 走权威服务授予，[`conflicting_elements`](/datapack/json/spirit_root) 与授予的能力都照常处理。 |
| `remove(entity, root)` | `LivingEntity`、灵根 ID | `boolean` | 放弃该灵根及其元素与一切授予；本来没持有则为 `false`。 |
| `setEnabled(entity, root, enabled)` | `LivingEntity`、灵根 ID、`boolean` | `{changed, failure}` | 「关闭但不失去」：状态真的变了并重算了授予才返回 `changed: true`，没持有则 `failure: "NOT_HELD"`。 |

## `MxtPhysiques`

体质是同一身份的**元素无关那一半**：授予原版属性与能力、缩放持有者打出与受到的伤害，并通过互斥标签排除其他体质。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**持有**的体质 ID，按 ID 排序（`allow_stacking` 时同一个 ID 可能出现多次）。 |
| `active(entity)` | `Entity` | `List<String>` | 现在**生效**的体质。 |
| `has(entity, physique)` | `Entity`、体质 ID | `boolean` | 是否持有。 |
| `enabled(entity, physique)` | `Entity`、体质 ID | `boolean` | 该体质是否处于开启状态；不持有则为 `false`。 |
| `grant(entity, physique)` | `LivingEntity`、体质 ID | `{changed, failure}` | 走权威服务授予，[`holder_condition`](/datapack/json/physique) 与 `exclusive_tags` 按**当前**实体判定。 |
| `remove(entity, physique)` | `LivingEntity`、体质 ID | `boolean` | 移除该体质及其属性、能力与伤害倍率；本来没持有则为 `false`。 |
| `setEnabled(entity, physique, enabled)` | `LivingEntity`、体质 ID、`boolean` | `{changed, failure}` | 与灵根同义的开关。 |

两者的 `failure` 是同一套词表：`DISABLED`（定义不存在或被 `mxt:disabled` 停用）、`ALREADY_HELD`、`CONDITIONS`（体质 `holder_condition` 不满足）、`EXCLUSIVE_CONFLICT`、`ELEMENT_CONFLICT`（灵根 `conflicting_elements`）、`NOT_HELD`、`SERVER_ONLY`（在客户端调用）。四个读方法两侧都能用（`spirit_identity` 附件是同步的，物品悬浮提示问"你是不是火灵根"正是这个用途），四个改变状态的方法是服务端操作。

```js
// kubejs/server_scripts/mxt_identity.js
// 洗练：把一条灵根换成另一条，并顺手把新体质打开。
const result = MxtSpiritRoots.grant(player, 'mxt_test:qingxiao_fire_root')
if (result.changed) {
  MxtSpiritRoots.remove(player, 'mxt_test:water_root')
  MxtPhysiques.setEnabled(player, 'mxt_test:blazing_body', true)
} else {
  console.warn(`grant refused: ${result.failure}`)
}
// "他是不是正在火灵根上" —— 关闭的灵根仍然持有，所以要问 active 而不是 has。
const active = MxtSpiritRoots.active(player)
```

## `MxtSouls`

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `reclaim(entity)` | `Entity` | `boolean` | 使用权威魂魄回收流程。仅适用于可转移魂魄；会触发 `soul` 的回收 pre/post 事件。 |

## `MxtTriggers`

触发器信号就是数据包技能在等待的通知（例如持有者命中目标）。`MxtTriggers` 让脚本发布同一种信号，也让脚本等待它；两侧都走运行时 `TriggerDispatcher`，因此脚本订阅和数据包技能触发器看到的是同一次派发。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `matcher(id, callback)` | 回调 ID、`(signal, params, context) => boolean` | `void` | 注册数据包触发器匹配器（`mxt:js`）。 |
| `publish(entity, signal, values)` | `Entity`、带命名空间的信号 ID、`object` 或 `null` | `boolean` | 为该实体发布一次服务端权威信号；实体在客户端时返回 `false`。 |
| `subscribe(entity, signal, key, callback)` | `Entity`、信号 ID、稳定 key、`(signal: TriggerSignal) => void` | `boolean` | 为该实体注册一个运行时订阅。 |
| `subscribeOnce(entity, signal, key, callback)` | 同上 | `boolean` | 注册一次性订阅，首次匹配后自行移除。 |
| `unsubscribe(entity, key)` | `Entity`、注册时使用的 key | `boolean` | 移除一个脚本订阅。 |
| `has(entity, key)` | `Entity`、注册时使用的 key | `boolean` | 当前是否存在该订阅。 |
| `subscriptions(entity)` | `Entity` | `number` | 该实体当前的脚本订阅数量。 |

`matcher` 是同一套机制的数据包侧：`mxt:js` 触发器声明自己监听哪个信号，再由回调决定是否触发。这是数据包技能或突破条件等待**自定义**信号 ID 的唯一方式，内置的 `mxt:tick` 一类匹配器表达不了：

```js
MxtTriggers.matcher('example:on_pill', (signal, params, context) => {
  return context.explicit('toxicity') >= (params.minimum || 0)
})
```

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill", "params": {"minimum": 10}}]
}
```

回调收到 `TriggerSignal` 与该信号的公式上下文，因此能读到脚本用 `MxtTriggers.publish` 发布的载荷值。回调缺失或抛异常时该触发器永不匹配。

```js
// kubejs/server_scripts/mxt_triggers.js
const KEY = 'example:toxicity_watch'

function onPillTaken(signal) {
  const toxicity = signal.context().formula().explicit('toxicity')
  if (!Number.isNaN(toxicity)) console.info(`${signal.type()} with toxicity ${toxicity}`)
}

function watch(entity) {
  // 同一个 key 重复注册会替换旧订阅，所以这里可以安全地反复调用。
  if (!MxtTriggers.has(entity, KEY)) {
    MxtTriggers.subscribe(entity, 'example:pill_taken', KEY, onPillTaken)
  }
}

EntityEvents.spawned(event => watch(event.entity))

// /reload 会重新执行本脚本并丢掉它的订阅；这里为仍在线的玩家重新挂上。
// 发布信号时不要求存在订阅者。
ServerEvents.tick(event => event.server.players.forEach(watch))

// 在你自己的逻辑里发布：命令处理、任务钩子或物品使用。
function publishPillTaken(player, toxicity) {
  MxtTriggers.publish(player, 'example:pill_taken', { pill: 'example:returning_pill', toxicity })
}
```

`values` 会被复制进触发上下文作为扩展数据，其中每个有限数值还会写入触发器的公式上下文。因此脚本回调可以用 `signal.context().formula().explicit('toxicity')` 读到上面的 `toxicity`，与数据包信号携带 `damage` 的方式完全一致。

一个 key 在每个实体上只对应一个订阅，请为每个信号使用独立的 key：用同一个 key 再次注册会替换掉旧订阅，无论它原本监听的是哪个信号。key 的作用域只到实体，**不同实体用同一个 key 互不影响**；运行中的服务器可以用 `/mxt trigger list [<实体>]` 查看当前实际挂着的订阅。

回调收到一个 `TriggerSignal`，其访问器为 `type()`（信号 ID）、`gameTime()`、`context()` 与 `source()`（可空的来源 ID）。上下文提供 `actor()`、`target()`、`level()`、`position()`、`item()`、`block()`、`damageSource()`、`formula()`，以及读取发布值的 `get(key)`（返回 `Optional`）与 `data()`（原始扩展表）。请把上下文当作只读对象：它会被同一信号的多个订阅者共享。

触发器订阅只存在于运行时，永不存档：实体离开世界、服务器关闭、数据包重载或服务器脚本重载都会丢掉它们——重载会替换订阅所引用的回调对象。请使用稳定的 key，并从运行时钩子重新注册，例如上面的写法。一次性订阅在首次匹配后自行移除，适合只能完成一次的任务步骤。

## `MxtLoot`

MiXianTu 给原版战利品表加了几个类型，其中两个可以由脚本提供，于是普通战利品表也能调用服务端脚本，而不需要依赖某个物品或方块。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `condition(id, callback)` | 回调 ID、`(lootContext, params) => boolean` | `void` | 注册原版战利品条件类型 `mxt:js`。 |
| `function(id, callback)` | 回调 ID、`(stack, lootContext, params) => ItemStack` | `void` | 注册原版战利品函数类型 `mxt:js`。 |

```js
// KubeJS 没有把原版战利品参数键绑定为全局，先加载一次类。
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')

MxtLoot.condition('example:first_clear', (loot, params) => {
  const player = loot.getParam(LootParams.THIS_ENTITY)
  return player != null && player.tags.contains(`cleared_${params.dungeon}`)
})

MxtLoot.function('example:bless', (stack, loot, params) => {
  stack.grow((params.multiplier || 1) - 1)
  return stack
})
```

```json
{
  "conditions": [{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}],
  "functions": [{"function": "mxt:js", "id": "example:bless", "params": {"multiplier": 3}}]
}
```

两个回调都在服务端生成战利品时执行，且都不接收 `FormulaContext`：请直接读原版 `LootContext`，例如 `loot.getParam(LootParams.THIS_ENTITY)`。战利品函数返回要保留的 stack——原样返回表示不改动掉落，返回新 stack 表示替换，返回 `null` 表示保留原样。回调缺失时条件为 `false`、函数保留原 stack，并记录一条警告。
