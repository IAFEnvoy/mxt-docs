---
title: MxtTriggers：触发器信号
description: 注册 mxt:js 触发器匹配器，发布自定义信号，并让脚本订阅信号；订阅只存在于运行时。
---

# `MxtTriggers`：触发器信号

触发器信号就是数据包技能在等待的通知（例如持有者命中目标）。`MxtTriggers` 让脚本发布同一种信号，也让脚本等待它；两侧都走运行时 `TriggerDispatcher`，因此脚本订阅、数据包技能触发器与数据包[触发规则](/datapack/json/trigger)看到的是同一次派发——脚本发布的信号能驱动一条规则，规则里的行为也能发布脚本等待的信号。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `matcher(id, callback)` | 回调 ID、`(signal, params, context) => boolean` | `void` | 注册数据包触发器匹配器（`mxt:js`）。 |
| `publish(entity, signal, values)` | `Entity`、带命名空间的信号 ID、`object` 或 `null` | `boolean` | 为该实体发布一次服务端权威信号；实体在客户端时返回 `false`。 |
| `subscribe(entity, signal, key, callback)` | `Entity`、信号 ID、稳定 key、`(signal: TriggerSignal) => void` | `boolean` | 为该实体注册一个运行时订阅。 |
| `subscribeOnce(entity, signal, key, callback)` | 同上 | `boolean` | 注册一次性订阅，首次匹配后自行移除。 |
| `unsubscribe(entity, key)` | `Entity`、注册时使用的 key | `boolean` | 移除一个脚本订阅。 |
| `has(entity, key)` | `Entity`、注册时使用的 key | `boolean` | 当前是否存在该订阅。 |
| `subscriptions(entity)` | `Entity` | `number` | 该实体当前的脚本订阅数量。 |

## 数据包侧：`mxt:js` 匹配器

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

## 订阅

一个 key 在每个实体上只对应一个订阅，请为每个信号使用独立的 key：用同一个 key 再次注册会替换掉旧订阅，无论它原本监听的是哪个信号。key 的作用域只到实体，**不同实体用同一个 key 互不影响**；运行中的服务器可以用 `/mxt trigger list [<实体>]` 查看当前实际挂着的订阅。

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

## 回调收到什么

回调收到一个 `TriggerSignal`，其访问器为 `type()`（信号 ID）、`gameTime()`、`context()` 与 `source()`（可空的来源 ID）。上下文提供 `actor()`、`target()`、`level()`、`position()`、`item()`、`block()`、`damageSource()`、`formula()`，以及读取发布值的 `get(key)`（返回 `Optional`）与 `data()`（原始扩展表）。请把上下文当作只读对象：它会被同一信号的多个订阅者共享。

`values` 会被复制进触发上下文作为扩展数据，其中每个有限数值还会写入触发器的公式上下文。因此脚本回调可以用 `signal.context().formula().explicit('toxicity')` 读到上面的 `toxicity`，与数据包信号携带 `damage` 的方式完全一致。

## 订阅的生命周期

触发器订阅只存在于运行时，永不存档：实体离开世界、服务器关闭、数据包重载或服务器脚本重载都会丢掉它们——重载会替换订阅所引用的回调对象。请使用稳定的 key，并从运行时钩子重新注册，例如上面的写法。一次性订阅在首次匹配后自行移除，适合只能完成一次的任务步骤。

## 相关

- 数据包侧：[触发规则 `trigger`](/datapack/json/trigger)、[触发器与消耗类型](/datapack/types/other/trigger-and-cost)。
- 等待信号的一方：[MxtAbilities](/kubejs/api/abilities)（技能上的触发器）。
- [KubeJS API 参考](/kubejs/api-reference)。
