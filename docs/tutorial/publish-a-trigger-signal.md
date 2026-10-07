---
title: 发布触发器信号
description: "从服务端脚本发布一个自定义触发器信号，再让数据包规则与脚本订阅各自消费它：载荷、公式值、订阅的 key 与生命周期。"
---

# 发布触发器信号

触发器信号是模组内部在等待的通知：实体挨了一刀、击杀了一个东西、到达了新的进度等级。内置信号由模组自己发布，而**内容包也能发布自己的信号**——服务端脚本用 `MxtTriggers.publish` 发一次，然后由两种消费方之一接住：一条数据包[触发规则](../datapack/json/trigger.md)，或脚本自己的一个订阅。

两侧走的是**同一套派发**，所以脚本发布的信号能驱动数据包规则，规则里的行为也能发布脚本等待的信号。这条通路是数据包响应一个**自定义**信号 id 的唯一途径：内置匹配器（`mxt:tick`、`mxt:kill` 那一族）每个写死一个信号 id，表达不了你新起的名字，能表达的是 `mxt:js` 匹配器加一个脚本回调。

**前提：** [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) 已完成。本页不新建任何定义：用到的 `example:qi`、`example:azure_mastery` 与那门功法 `example:azure_breath` 都是示例包里已经有的。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `kubejs/server_scripts/mxt_signals.js` | 发布 `example:azure_mastery_signal`，并按 key 订阅它，用来验证派发确实到了。 |
| `data/example/mxt/trigger/azure_mastery_signal.json` | *（新增）* 收到这个信号就给主体加熟练度；结构与已有的 `azure_mastery_from_kill.json` 同形。 |

信号本身没有文件、没有注册表、也没有 id 要注册：它就是一个带命名空间的字符串，只要发布方与消费方写得一模一样就成立。

## 第 1 步 —— 脚本放在服务端

发布与订阅都是服务端行为，所以这个脚本必须放在 `kubejs/server_scripts/` 下（本篇用 `mxt_signals.js`）。放在 `startup_scripts/` 里不会生效：启动脚本在游戏注册物品之前跑一次，那里没有服务器，也没有实体可发。

服务端脚本会随 `/reload` 重新执行，而订阅**只存在于运行时**、从不存档——`/reload` 会连订阅一起丢掉。下文的订阅因此挂在 `EntityEvents.spawned` 与 `ServerEvents.tick` 上重建，而不是写一次就算完。

## 第 2 步 —— 发布一个信号

```js
// kubejs/server_scripts/mxt_signals.js
const SIGNAL = 'example:azure_mastery_signal'
const WATCH_KEY = 'example:azure_mastery_watch'

// 发布：为该实体发一次服务端权威信号；载荷里的每个有限数值同时进入公式上下文。
function publishMasteryGain(entity, amount) {
  return MxtTriggers.publish(entity, SIGNAL, { source: 'example:ritual', amount })
}
```

`publish(entity, signal, values)` 三个参数：

| 参数 | 说明 |
| --- | --- |
| `entity` | 这条信号的**主体**，也是它作用的对象。规则的 `condition` 与 `action` 都对这个实体求值。 |
| `signal` | 带命名空间的信号 ID。内置信号列表里没有它也没关系，本页用的名字就是自己起的。 |
| `values` | `object` 或 `null`：信号的载荷。每个**有限数值**会同时写进触发器公式上下文，非数值（这里是字符串 `source`）只留在扩展数据里，要用 `signal.context().get('source')` 读。 |

返回值是布尔：实体在客户端时返回 `false`，什么都不发。信号没有订阅者时依然会发出去（规则照跑），所以**发布方不需要先确认有人在听**。

## 第 3 步 —— 用数据包规则接住它

一条触发规则不挂在任何技能上：某个信号到达时，匹配它的规则把 `condition` 对"信号的主体"求一次，成立就跑 `action`。

```json
// data/example/mxt/trigger/azure_mastery_signal.json
{
  "trigger": {
    "type": "mxt:js",
    "signal": "example:azure_mastery_signal",
    "id": "example:azure_mastery_watch"
  },
  "condition": {"type": "mxt:resource_compare", "resource": "example:azure_mastery", "min": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:azure_mastery", "amount": "amount"},
  "cooldown": 20
}
```

- 脚本发布的信号 id 在内置信号表里没有条目，所以 `trigger` 只能写 `mxt:js`：它的 `signal` 声明监听哪个信号 id，`id` 指向 `MxtTriggers.matcher(id, callback)` 注册的回调。**回调缺失时这个触发器永不匹配**——只注册规则、不注册回调，规则会安静地什么都不做。
- `condition` / `action` 的父上下文就是事件上下文，所以发布方写进 `values` 的**数值**在这里读得到：`action` 的 `"amount"` 读的就是发布时给的那个数。写成 `"amount * 2"` 就是"发布方定基数，规则定倍率"。
- `cooldown` 是**按规则 id 分别记在主体身上**的（存档保留、死亡不清），不是全局限流；同一条规则被两个实体触发，各记各的。
- 规则需要主体：没有主体的信号只会送达订阅，不会触发规则。

只注册规则的话，`mxt:js` 的回调还是得有一个（哪怕只 `return true`），因为"算不算命中"由它回答：

```js
// kubejs/server_scripts/mxt_signals.js
MxtTriggers.matcher('example:azure_mastery_watch', (signal, params, context) => true)
```

## 第 4 步 —— 用脚本订阅接住它

订阅是脚本自己那一侧：`subscribe(entity, signal, key, callback)` 为**某一个实体**挂一个回调，返回布尔。key 是订阅的身份，**在每个实体上唯一**——同一个 key 再次注册会替换掉旧订阅，无论它原本监听的是哪个信号；不同实体用同一个 key 互不影响。所以每个信号都该有自己的 key。

```js
// kubejs/server_scripts/mxt_signals.js
function onMasterySignal(signal) {
  const amount = signal.context().formula().explicit('amount')
  console.info(`[example] ${signal.type()} -> +${amount}`)
}

function watch(entity) {
  // 同一个 key 重复注册会替换旧订阅，所以这里可以安全地反复调用。
  if (!MxtTriggers.has(entity, WATCH_KEY)) {
    MxtTriggers.subscribe(entity, SIGNAL, WATCH_KEY, onMasterySignal)
  }
}

// 新实体进来时挂上；/reload 丢掉订阅，所以还在线的玩家由 tick 补挂。
EntityEvents.spawned(event => watch(event.entity))
ServerEvents.tick(event => event.server.players.forEach(watch))
```

- **实体作用域**是这套形状的全部：信号只送给"发布时点名的那个实体"名下的订阅。同一个信号发给另一个玩家，你的回调不会响。
- 回调收到一个 `TriggerSignal`，访问器是 `type()`（信号 id）、`gameTime()`、`context()` 与 `source()`（可空的来源 id）。上下文提供 `actor()`、`target()`、`level()`、`position()`、`item()`、`block()`、`damageSource()`、`formula()`，以及读发布值的 `get(key)` 与 `data()`。**上下文是只读的**：同一信号的多个订阅者共享它。
- 订阅的存续由运行时管：`has(entity, key)` 问在不在，`unsubscribe(entity, key)` 摘掉它，`subscriptions(entity)` 数当前有几个。运行中的服务器用 `/mxt trigger list`（在游戏里看自己，或补一个实体参数看别人）看实际挂着的订阅。
- `subscribeOnce(entity, signal, key, callback)` 注册的是一次性订阅：**首次匹配后它自己摘掉自己**，适合只能完成一次的任务步骤。它与 `subscribe` 用同一张表、同一个 key 空间，`has` / `unsubscribe` 一视同仁。
- 移除是即时的：`unsubscribe` 之后同一 tick 再发布的信号不会再进这个回调。

## 第 5 步 —— 生命周期与边界

| 边界 | 表现 |
| --- | --- |
| 实体离开世界、服务器关闭、数据包重载、服务端脚本重载 | 订阅全部丢掉，**绝不存档**；重载会替换订阅引用的回调对象，所以要从运行时钩子重建。 |
| `publish` 在客户端实体上 | 返回 `false`，什么都不发。两个端点都只在服务端存在。 |
| 主体是假玩家 | 整个信号被丢弃：自动化与命令管道的假玩家没有会话可记，所以连订阅都不派发（但**返回值仍然是 `true`**，发布方看不出这一条）。 |
| 规则的行为又发布了它自己响应的信号 | 在自身执行期间被跳过，避免无限递归。 |
| 规则抛异常 | 只记一条日志，不影响同一信号的其他规则与订阅。 |
| 订阅回调抛异常 | 只记一条日志，不影响这个实体的其他订阅。 |
| 信号没有主体 | 只送达订阅；规则的 `condition` / `action` 都要求一个实体。 |
| 自定义信号与内置信号 | 两侧看到的是同一次派发：订阅内置的 `mxt:kill` 与订阅自己起的名字走同一条路，脚本按内置 id 发布也会被等待它的规则接住。区别只在写法——内置 id 有写死它的匹配器，自定义 id 只能写 `mxt:js` 加回调。 |

服务端脚本重载会连 `MxtTriggers.matcher` 注册的回调一起换掉，所以 `mxt:js` 的回调也写在同一个脚本里、跟着重载重新注册。

## 在游戏里验证

```text
（重新打开世界）→ 注册表这时才加载
/mxt registries validate                       → 没有 Codec 错误
/mxt trigger rules example:azure_mastery_signal → 列出这条规则（1 条）
/mxt resource example:azure_mastery            → 当前熟练度
/mxt trigger publish example:azure_mastery_signal   → 手动发一次（需要 gamemaster）
/mxt trigger list                              → 当前挂着的订阅
```

1. 重开世界后 `/mxt trigger rules example:azure_mastery_signal` 报 1 条规则。这里补全列出的信号来自"有规则响应、或有订阅挂着的信号"，所以规则加载成功它才会出现在补全里。
2. `/mxt trigger publish example:azure_mastery_signal` 只会带 `actor` 与 `level`，**没有** `amount` 载荷——规则里 `action` 的 `"amount"` 求值为 0，于是这一发什么都没加；`cooldown` 的公式同样读到 0，那条冷却也不生效。还要先让主体身上至少有 `1` 点熟练度，否则 `condition` 直接把这一发挡掉。
3. 在游戏里调用一次 `publishMasteryGain(player, 5)`（例如接到一条物品使用或命令处理上），熟练度加 5、规则进入 20 tick 冷却；这 20 tick 内再发一次不会加。把 `action` 改成 `"amount * 2"` 再发一次，加的就会是 10。
4. 脚本订阅那一侧：`/mxt trigger list` 里应该能看到一条模块 `kubejs`、身份是 `example:azure_mastery_watch`、信号是 `example:azure_mastery_signal` 的订阅。把订阅 `unsubscribe` 掉，`/mxt trigger list` 那一条立刻消失。
5. 把 `MxtTriggers.matcher('example:azure_mastery_watch', ...)` 那一行注释掉、`/reload`，再发一次信号：规则不再触发（回调缺失＝永不匹配），订阅照旧收得到——这正是"规则与订阅是两条独立的路"。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 信号发了，规则却没反应 | `mxt:js` 的 `id` 没有对应的 `MxtTriggers.matcher` 回调；回调缺失或抛异常时该触发器永不匹配。**不报错**。 |
| 信号发了，订阅却没反应 | 发布时点名的实体与订阅挂的实体不是同一个。订阅是按实体存的，把信号发给别人不会送到你这一份。 |
| 脚本重载后订阅全没了 | 订阅只存在于运行时、从不存档，重载会替换回调对象；要从运行时钩子重建。 |
| 同一实体上新订阅顶掉了旧的 | key 在每个实体上唯一。同一个 key 再次注册会替换旧订阅，哪怕它监听的是另一个信号。 |
| 回调里读不到 `source` | 只有**有限数值**会进公式上下文；字符串等非数值载荷要用 `signal.context().get('source')` 读。 |
| `/mxt trigger publish` 报了一句"没人听" | 这条信号此刻既没有规则响应、也没有订阅挂着。规则加载成功或订阅挂上之后就好了。 |
| 规则要加的资源被加了两次 | 同一条信号上同时挂了规则与订阅，两边都在改同一个数值。规则与订阅是两条独立的路，各跑各的。 |
| 客户端上发布返回 `false` | 发布与订阅都是服务端行为；客户端实体上什么都不做。 |
| 信号发了但主体不对 | 规则的 `condition` 与 `action` 都对**信号的主体**求值，也就是 `publish` 的第一个参数。 |
| 改了 JSON 却没生效 | 规则是数据包注册表，世界加载时读一次，`/reload` 不重读。 |

## 接下来

- [MxtTriggers：触发器信号](../kubejs/api/triggers.md) —— 每个方法、载荷与订阅生命周期的完整说明。
- [MxtEvents：事件](../kubejs/api/events.md) —— 与信号成对的另一套脚本入口：事件是可取消的一次调用，信号是事后通知。
- [trigger（事件规则）](../datapack/json/trigger.md) —— 规则的字段、`chance` 与 `cooldown` 的口径。
- [定义功法与晋级](./define-a-technique.md) —— 本页那条规则挂上的数值属于哪条链。
- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 本篇假定已完成的那一篇。
