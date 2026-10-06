---
title: KubeJS 综合示例
---

# KubeJS 综合示例

```js
StartupEvents.registry('item', event => {
  event.create('spirit_manual').displayName('无名功法书')
  event.create('spirit_stone').displayName('灵石')
})

ServerEvents.recipes(event => {
  event.shaped('example:spirit_manual', ['ABA', ' C ', 'ABA'], {
    A: 'minecraft:paper',
    B: 'minecraft:lapis_lazuli',
    C: 'minecraft:book'
  })
})
```

```js
// kubejs/server_scripts/mxt_events.js
MxtEvents.abilityUse(event => {
  if (event.isPre() && event.getAbility() === 'example:forbidden') event.cancel()
})

MxtEvents.resourceConsume(event => {
  if (event.isPre()) event.setAmount('example:spirit_power', event.getAmounts()['example:spirit_power'] || 0)
})

MxtEvents.cultivationBreak(event => {
  if (event.getPhase() === 'Pre') {
    // event.getEvent() is the native CultivationBreakEvent.Pre.
    event.getEvent().setCost('example:spirit_power', 20)
  }
})
```

对应的数据包可以把 `example:spirit_manual` 绑定到功法，把 `example:spirit_stone` 接入 `item_aura` 或 `currency`。这样脚本只负责内容注册，规则仍由数据包驱动并同步到各客户端。

回调还可以接收第三个参数——本次派发的公式上下文，用来读取只有触发事件才知道的数值：

```js
MxtActions.entity('example:knockback_on_hit', (entity, params, context) => {
  const damage = context.explicit('damage')
  if (Number.isNaN(damage)) return
  entity.push(0, params.strength * damage, 0)
})
```

## 自定义 Cost

Cost 先检查再支付，所以两半要一起注册；`id` 就是数据包 `costs` 数组里写的那个：

```js
MxtCosts.register('example:quest_token',
  (player, params, context) => player.persistentData.getInt('tokens') >= (params.count || 1),
  (player, params, context) => {
    player.persistentData.putInt('tokens', player.persistentData.getInt('tokens') - (params.count || 1))
  }
)
```

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

脚本 Cost 需要玩家，而且它的上下文只由该玩家构建，所以读玩家自身状态（或该上下文的显式值），不要指望读到事件载荷。

脚本也可以自己发布并等待触发器信号。订阅只存在于运行时，因此要从运行时钩子挂载，并在重载后重新挂载：

```js
// kubejs/server_scripts/mxt_triggers.js
const KEY = 'example:toxicity_watch'

function onPillTaken(signal) {
  const toxicity = signal.context().formula().explicit('toxicity')
  if (!Number.isNaN(toxicity)) console.info(`${signal.type()} with toxicity ${toxicity}`)
}

function watch(entity) {
  if (!MxtTriggers.has(entity, KEY)) {
    MxtTriggers.subscribe(entity, 'example:pill_taken', KEY, onPillTaken)
  }
}

EntityEvents.spawned(event => watch(event.entity))

// /reload 会重新执行本脚本并丢掉它的订阅，这里为仍在线的玩家重新挂上。
ServerEvents.tick(event => event.server.players.forEach(watch))

// 在你自己的逻辑里发布：命令处理、任务钩子或物品使用。
function publishPillTaken(player, toxicity) {
  MxtTriggers.publish(player, 'example:pill_taken', {
    pill: 'example:returning_pill',
    toxicity
  })
}
```

物品本体应由 KubeJS 在启动脚本阶段注册，MXT 数据包随后用真实物品 ID 绑定玩法规则。不要再创建 `mxt:item` 或 `mxt:weapon` 文件。

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('fire_root_pellet')
    .displayName('Fire Root Pellet')
    .food(food => food.nutrition(2).saturation(0.2))

  event.create('returning_pill')
    .displayName('Returning Pill')
    .food(food => food.nutrition(1).saturation(0.1))

  event.create('firebound_sword', 'sword')
    .displayName('Firebound Sword')
    .modifyTier(tier => tier.setAttackDamageBonus(3))
})
```

`food` 回调里的方法是 `nutrition(int)` 和 `saturation(float)`（也可以直接用 `.food(2, 0.2)` 简写）；`.tier(...)` 只接受 `MutableToolTier` 对象，字符串（如 `.tier('diamond')`）没有可用重载，要改材质或数值请用 `.modifyTier(tier => …)`，可调 `setUses`、`setSpeed`、`setAttackDamageBonus`、`setEnchantmentValue` 等。

对应的数据包绑定：

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "actions": [
    {
      "type": "mxt:grant_spirit_root",
      "spirit_root": "example:fire_root"
    }
  ]
}
```

```json
// kubejs/data/example/mxt/weapon_binding/firebound_sword.json
{
  "items": "kubejs:firebound_sword",
  "attributes": [
    {"attribute": "minecraft:attack_damage", "id": "example:firebound_sword/damage", "amount": 8, "operation": "add_value"},
    {"attribute": "minecraft:attack_speed", "id": "example:firebound_sword/speed", "amount": -2.4, "operation": "add_value"}
  ]
}
```

```json
// kubejs/data/example/mxt/pill/returning_pill.json
{
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

```json
// kubejs/data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "pill": "example:returning_pill",
  "max_uses": 3,
  "cooldown": 40
}
```

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual"
}
```

物品绑定与武器绑定是**注册表**：一份文件一条定义，条目按 `items` 认领物品，只引用已经由 KubeJS、原版或其他模组注册的物品，**表里不声明品质链**（链名写在 `quality` 条目自己身上），见 [quality](../datapack/json/quality)。丹药分成两份写：作用在 [pill](../datapack/json/pill.md)，认领物品与次数冷却在 [pill_binding](../datapack/json/pill_binding.md)。「手册」那一份不一样：它是 `technique_binding` 的**定义**，`kubejs:fire_manual` 只通过 `carrier_item` 声明成本体生成的载体，真正教功法的还是**堆上的 `mxt:technique` 组件**——写组件的方式见[功法绑定](../datapack/json/technique_binding.md)。当前各表的运行时接入状态和缺口**以代码为准**（模组仓库两份 README 的「模块完成情况」表是汇总）。

KubeJS 注册物品表后需要重启游戏；MXT 的注册表都在世界加载时读取，因此修改后需要重新加载世界（单机退回标题界面再进入，服务器重启），`/reload` 不会重新读取它们。这几张表的 `items` 里写了不存在的物品 ID 会让数据包加载失败，避免产生无法解析的物品规则。
