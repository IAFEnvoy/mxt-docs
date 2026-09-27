---
title: MxtQuality：品质
description: 读一栈物品解析出的品质与它所属的链条，或写覆盖组件、沿链条升一档。
---

# `MxtQuality`：品质

品质长在**物品堆**上，所以这几个方法都点名它们作用的那一栈；`entity` 只是注册表查询的起点。写操作只在服务端生效，客户端一律返回 `null` / `false` 且不改动任何东西。

解析顺序是固定的五步：堆上的 **覆盖组件** → 锻造结果 → **定义默认档**（法器 / 功法的 `quality`）→ 所属**链条的入口档** → 匹配到的**灵植**声明的 `quality`。完整口径见[品质](/datapack/json/quality)。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `get(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 这一栈现在解析出的品质 ID；没有则为 `null`。 |
| `chain(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 这一栈的品质所属的**链条** ID：就是这一档所在那条链的名字；它不在任何链上时返回 `null`。 |
| `next(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 链条上的下一档 ID；已经在顶端或没有链条时为 `null`。 |
| `set(entity, stack, quality)` | `Entity`、`ItemStack`、品质 ID | `boolean` | 把品质**覆盖组件**写到这一栈上，盖过定义默认档；ID 解析不出来或客户端调用返回 `false`。 |
| `clear(entity, stack)` | `Entity`、`ItemStack` | `boolean` | 摘掉覆盖组件，回到定义默认档；本来就没有覆盖时返回 `false`。 |
| `upgrade(entity, stack)` | `LivingEntity`、`ItemStack` | `{changed, failure, from, to}` | 在链条上**推一档**：先过**下一档**的 `upgrade_condition`，再用全局消耗事务付清它的 `upgrade_costs`（原子），付不出就一点不动、也不写档。 |

`upgrade` 的 `failure` 取值：`SERVER_ONLY`、`EMPTY`（手上没有物品）、`NO_QUALITY`、`NO_CHAIN`（不属于任何链条，或声明的链当前包走不出来）、`AT_TOP`、`CONDITION_FAILED`、`INSUFFICIENT_RESOURCE`、`INSUFFICIENT_COST`。成功时 `from` / `to` 是升级前后的品质 ID（失败时都是 `null`）。

```js
// kubejs/server_scripts/mxt_quality.js
// 一件成品到手时按链条往上推一档，推不动就把原因说出来。
const result = MxtQuality.upgrade(player, event.item)
if (result.changed) {
  player.tell(`品质提升为 ${result.to}`)
} else {
  console.warn(`upgrade refused: ${result.failure}`)
}
// 直接覆盖某一档（无视链条入口档），clear 之后回到定义默认。
MxtQuality.set(player, event.item, 'mxt_test:excellent')
```

## 相关

- 数据包侧：品质条目与品质链都在 [quality](/datapack/json/quality)。
- 同一个入口的命令写法：[`/quality`](/player-guide/commands/quality)。
- [KubeJS API 参考](/kubejs/api-reference)。
