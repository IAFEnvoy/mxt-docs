---
title: forging_method（锻造手法）
---

# forging_method（锻造手法） {#forging_method}

文件位置：`data/<namespace>/mxt/forging_method/<path>.json`

**用途**：单次锻打方式。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value_delta` | Integer | **必填** | 锻打条偏移，不能为 `0`。 |
| `costs` | `List<ResourceCost>` | `[]` | 每次锻打消耗。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 使用该方式的条件。 |
| `icon` | **图标引用** | 无 | 界面里显示的图标；用物品时还会提供该方法在列表中的名称。 |
| `cooldown` | Integer | `0` | 锻打冷却，单位 tick，范围 `0..72000`。同一玩家对同一锻造台的连续锻打会被服务端限流。 |
| `sound` | SoundEvent ID | `minecraft:block.anvil.place` | 使用该方式锻打成功时，在锻造台位置播放的音效。 |

`sound` 在**锻打真正发生**之后播放，范围是台子附近的所有玩家（不只发起者），走 `blocks` 音量通道，音量与音高均为 `1.0`。被拒绝的锻打（资源不足、条件不满足、冷却中、越界）不发声。该字段按音效 ID 在加载期解析为音效事件，写错 ID 会导致该条目被拒绝而不是静默无声。需要**静音**的方法写 `minecraft:intentionally_empty`（原版空音效）。

