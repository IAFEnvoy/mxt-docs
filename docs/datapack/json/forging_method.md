---
title: forging_method（锻造手法）
description: 锻造手法是单次锻打：它把锻打条推动多少、收什么代价、什么时候能用、冷却多长、打成功放什么音效。
aside: false
---

# forging_method（锻造手法） {#forging_method}

文件位置：`data/<namespace>/mxt/forging_method/<path>.json`

**用途**：单次锻打方式。

它把当前值推动 `value_delta`、向锻打者收一笔代价，并按条件与冷却决定这一下算不算数。谁能在界面上用到哪些手法，由[工具绑定](./tool_binding.md)决定，图纸的 `allowed_methods` 还能再收窄一遍；一次锻造要打成什么样，见[锻造图纸](./forging_blueprint.md)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value_delta` | Integer | **必填** | 锻打条偏移，不能为 `0`。 |
| `costs` | `Cost` 数组 | `[]` | 每次锻打的消耗，从锻打者身上扣，整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |
| `condition` | `EntityCondition` | `mxt:always` | 使用该方式的条件。 |
| `icon` | **图标引用** | 无 | 界面里显示的图标；用物品时还会提供该方法在列表中的名称。 |
| `cooldown` | Integer | `0` | 锻打冷却，单位 tick，范围 `0..72000`。 |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | 使用该方式锻打成功时，在锻造台位置播放的音效。 |

`icon` 用物品时，方法在列表里的名字取那个物品的悬停名；没有图标时才退回条目自己的 ID。

## 一次锻打的判定

**越界的手法会被直接拒绝。** 每次锻打前都会算一次"打完还在不在条内"，不在就拒绝——别指望用一记越界的重锤把数值"掰"回区间里。

**冷却在扣费与条件判定之前就记下了。** 一次因为资源不足或条件不满足被打回的锻打，照样占掉这段冷却。冷却按（玩家, 锻造台）记，同一玩家对同一台子的连续锻打因此会被服务端限流。

## `sound`

`sound` 在**锻打真正发生**之后播放，范围是台子附近的所有玩家（不只发起者），走 `blocks` 音量通道，音量与音高均为 `1.0`。被拒绝的锻打（资源不足、条件不满足、冷却中、越界）不发声。

这个字段按音效 ID 在加载期解析成音效事件，写错 ID 会导致该条目被拒绝，而不是静默无声。需要**静音**的手法写 `minecraft:intentionally_empty`（原版空音效）。

## 示例

```json
// data/example/mxt/forging_method/heavy_strike.json
{
  "value_delta": 3,
  "costs": [
    { "type": "mxt:resource", "resource": "example:stamina", "amount": 5 }
  ],
  "cooldown": 20,
  "sound": "minecraft:block.anvil.land"
}
```

静音的收尾手法：

```json
{
  "value_delta": -2,
  "sound": "minecraft:intentionally_empty"
}
```
