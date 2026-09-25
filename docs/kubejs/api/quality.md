---
title: MxtQuality：品质
description: 读一栈物品解析出的品质与它所属的链条，或写覆盖组件、沿链条升一档。
---

# `MxtQuality`：品质

品质长在**物品堆**上，所以这几个方法都点名它们作用的那一栈；`entity` 只是注册表查询的起点。写操作只在服务端生效，客户端一律返回 `null` / `false` 且不改动任何东西。

解析顺序是固定的五步：堆上的 **覆盖组件** → 锻造结果 → **定义默认档**（法器 / 功法的 `quality`）→ 所属**链条的 `default`** → 匹配到的**灵植**声明的 `quality`。完整口径见[品质链条](/datapack/json/quality_chain)。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `get(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 这一栈现在解析出的品质 ID；没有则为 `null`。 |
| `chain(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 这一栈的品质所属的**链条** ID：绑定表声明的优先，否则取唯一持有该档的那条链；有多条时返回 `null`（不猜）。 |
| `next(entity, stack)` | `Entity`、`ItemStack` | `String` 或 `null` | 链条上的下一档 ID；已经在顶端或没有链条时为 `null`。 |
| `set(entity, stack, quality)` | `Entity`、`ItemStack`、品质 ID | `boolean` | 把品质**覆盖组件**写到这一栈上，盖过定义默认档；ID 解析不出来或客户端调用返回 `false`。 |
| `clear(entity, stack)` | `Entity`、`ItemStack` | `boolean` | 摘掉覆盖组件，回到定义默认档；本来就没有覆盖时返回 `false`。 |
| `upgrade(entity, stack)` | `LivingEntity`、`ItemStack` | `{changed, failure, from, to}` | 在链条上**推一档**：先过那一步的 `condition`，再用全局消耗事务付清 `costs`（原子），付不出就一点不动、也不写档。 |

`upgrade` 的 `failure` 取值：`SERVER_ONLY`、`EMPTY`（手上没有物品）、`NO_QUALITY`、`NO_CHAIN`（不属于任何链条）、`AMBIGUOUS_CHAIN`（这一档同时属于多条链，无法确定往哪升）、`NOT_MEMBER`（这一档不在所属链条上）、`AT_TOP`、`NO_STEP`（这一步没有声明代价，不能升）、`DISABLED`（下一档被 `mxt:disabled` 停用）、`CONDITION_FAILED`、`INSUFFICIENT_RESOURCE`、`INSUFFICIENT_COST`。成功时 `from` / `to` 是升级前后的品质 ID（失败时都是 `null`）。

```js
// kubejs/server_scripts/mxt_quality.js
// 一件成品到手时按链条往上推一档，推不动就把原因说出来。
const result = MxtQuality.upgrade(player, event.item)
if (result.changed) {
  player.tell(`品质提升为 ${result.to}`)
} else {
  console.warn(`upgrade refused: ${result.failure}`)
}
// 直接覆盖某一档（无视链条默认），clear 之后回到定义默认。
MxtQuality.set(player, event.item, 'mxt_test:excellent')
```

## 相关

- 数据包侧：品质条目 [quality](/datapack/json/quality) 与链条 [quality_chain](/datapack/json/quality_chain)。
- 同一个入口的命令写法：[`/quality`](/player-guide/commands/quality)。
- [KubeJS API 参考](/kubejs/api-reference)。
