---
title: MxtAbilities：技能
description: 施放技能，并授予、撤销、查询实体持有的技能，以及维持它的来源账本。
---

# `MxtAbilities`：技能

`MxtAbilities` 负责"这个身体持有哪些技能、由谁授予"，以及就地施放一次技能。授予、撤销、查询都读同一份来源账本，施放走与数据包技能完全相同的一条闸门（条件、消耗、冷却）。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `use(entity, ability)` | `Entity`、技能 ID | `AbilityService.UseResult` | 施放实体已持有的技能，仅在服务端生效。 |
| `selector(id, callback)` | 回调 ID、`(actor, context, params) => Entity[]` | `void` | 注册数据包类型 `mxt:js` 的技能目标选择器。 |
| `grant(entity, ability, source)` | `Entity`、技能 ID、来源 ID（`命名空间:路径`） | `boolean` | 以该来源授予技能；来源此前未持有该技能才返回 `true`。未知技能返回 `false`（不是错误），客户端不改动任何东西。 |
| `revoke(entity, ability, source)` | `Entity`、技能 ID、来源 ID | `boolean` | 只撤这一份来源，成功时返回 `true`；**技能本身要等最后一份来源松手才消失**，那时它的冷却和按技能存储的状态一并丢弃。目标没有这一来源时返回 `false`。 |
| `has(entity, ability)` | `Entity`、技能 ID | `boolean` | 是否持有；读的是附件，因此停用或已删除的定义也答得出来。 |
| `list(entity)` | `Entity` | `List<String>` | 当前持有的全部技能 ID，按 ID 排序。 |
| `sources(entity, ability)` | `Entity`、技能 ID | `List<String>` | 当前还在维持这项技能的来源，按 ID 排序；没持有则为空列表。 |

技能和诅咒授予用的是同一套来源账本：**只要还有一份来源持有，它就存在**，最后一份松手才真的移除。来源必须是命名空间标识符（如 `example:quest_reward`），写错会抛 `IllegalArgumentException`。授予、撤销、查询都只在服务端生效，客户端一律返回 `false` 或空列表且不改动任何东西。

`use` 的结果 record：`committed()` 表示立即完成，`casting()` 表示已开始吟唱，`failure()` 为失败枚举，`failedResource()` 为不足的资源 ID，`amounts()` 为实际支付资源。

```js
const result = MxtAbilities.use(player, 'example:fireball')
if (result.failure() !== null) console.warn(String(result.failure()))
```

## 技能目标选择器

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

## 相关

- 数据包侧：技能定义 [`ability`](/datapack/json/ability)、法器 [`artifact`](/datapack/json/artifact)、功法 [`technique`](/datapack/json/technique)。
- 同一套来源账本的另一个使用者：[MxtCurses](/kubejs/api/curses)。
- 技能被触发时的回调：[MxtEvents](/kubejs/api/events) 的 `abilityUse` 与 `abilityTriggered`。
- [KubeJS API 参考](/kubejs/api-reference)。
