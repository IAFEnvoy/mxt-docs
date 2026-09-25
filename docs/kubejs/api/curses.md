---
title: MxtCurses：诅咒
description: 施加（可带时长）、释放、移除与查询诅咒，以及维持它的来源账本。
---

# `MxtCurses`：诅咒

`MxtCurses` 走与数据包、物品完全相同的 `CurseService`：条件、叠层与来源账本都由它裁定，脚本不绕过任何一条。移除是唯一能给"定义已被停用或删除"的诅咒收尾的路。

## 方法

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

```js
// kubejs/server_scripts/mxt_curse.js
const result = MxtCurses.apply(target, 'example:fire_mark', 2, 'example:trap_trigger')
if (result.applied()) {
  console.info(`stacks now ${MxtCurses.stacks(target, 'example:fire_mark')}`)
} else {
  console.warn(`refused: ${result.failure()}`)
}
```

## 相关

- 数据包侧：[诅咒 `curse`](/datapack/json/curse)。
- 同一套来源账本的另一个使用者：[MxtAbilities](/kubejs/api/abilities)。
- 施加与移除时的回调：[MxtEvents](/kubejs/api/events) 的 `curseApply` 与 `curseRemove`。
- [KubeJS API 参考](/kubejs/api-reference)。
