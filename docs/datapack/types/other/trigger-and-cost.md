---
title: 触发器与消耗类型
---

# 触发器与消耗类型

## `trigger_type`

触发器匹配器决定技能或突破条件响应哪些运行时事件。每个内置触发器都是无字段的匹配器；注册表条目自身提供它要比较的信号标识符。

| `type` | 说明 |
| --- | --- |
| `mxt:tick` | 实体周期性 tick |
| `mxt:attack` | 实体攻击了另一个实体 |
| `mxt:hurt` | 实体受到伤害 |
| `mxt:kill` | 实体击杀了另一个实体 |
| `mxt:block_break` | 实体破坏了一个方块 |
| `mxt:block_use` | 实体使用了一个方块 |
| `mxt:item_use` | 实体完成了一次物品使用 |
| `mxt:equip` | 实体的装备发生变化 |
| `mxt:death` | 实体死亡 |
| `mxt:breakthrough` | 实体完成了一次突破 |
| `mxt:technique_stage` | 已学会的功法达到新的水平 |
| `mxt:js` | 由服务端脚本决定的匹配器 |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:item_use"}]}
```

所有内置触发器都没有额外字段。

`mxt:js`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `signal` | Identifier | **必填** | 该匹配器监听的信号；订阅以它为索引 |
| `id` | String | **必填** | 通过 `MxtTriggers.matcher(...)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:triggered", "triggers": [{"type": "mxt:js", "signal": "example:pill_taken", "id": "example:on_pill"}]}
```

这是数据包响应**自定义**信号 ID 的唯一途径：在服务端脚本中用 `MxtTriggers.publish` 发出信号，然后要么让脚本订阅它，要么在技能上、或在某个数值的突破条件中声明这个触发器。回调只决定到达订阅的那个信号是否触发，因此回调缺失时永远不会匹配。见 [KubeJS API 参考](../../../kubejs/api-reference.md)。

---

## `cost_type`

Cost 可以先检查，再从玩家身上扣除。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:resource` | `resource`、`amount` | 从玩家的资源附件中消耗一个数据包数值 |
| `mxt:item` | `items`、`amount` | 从玩家背包中消耗匹配的物品 |
| `mxt:js` | `id`、`params?` | 由服务端脚本回调检查并支付 |

`mxt:resource`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | `Holder<resource>` | **必填** | 要消耗的数值 |
| `amount` | `NumberProvider` | **必填** | 要消耗的数量；必须求值为有限正数 |

`mxt:item`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 哪些物品可以被消耗；见 [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **必填** | 要消耗的匹配物品数量，向上取整；结果非正或非有限表示这笔 Cost 无法支付 |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

`mxt:js`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 通过 `MxtCosts.register(...)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

脚本 Cost 在服务端先检查、后支付，并且需要一个玩家：只要有一项不是 `resource` Cost，整个技能就会要求玩家。回调收到的是支付者与 `params`，而不是技能的公式上下文，因为 `Cost` 只用玩家求值。

`costs` 数组也接受 `{"id": ..., "amount": ...}` 这样的纯简写，它会被读作 `mxt:resource`。保留简写是为了兼容；新条目应显式写出类型。

---
