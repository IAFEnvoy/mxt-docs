---
title: realm_instance（秘境实例）
---

# realm_instance（秘境实例） {#realm_instance}

文件位置：`data/<namespace>/mxt/realm_instance/<path>.json`

**用途**：秘境实例策略。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dimension` | Identifier | 无 | 目标维度；缺省时由入口逻辑决定。 |
| `duration_ticks` | Long | `0` | 实例持续时间，`0` 表示不自动过期。 |
| `max_members` | Integer | `1` | 最大成员数，范围 `1..100000`。 |
| `enter_action` | `EntityAction` | `mxt:no_op` | 进入行为。 |
| `exit_action` | `EntityAction` | `mxt:no_op` | 离开行为。 |

运行时维度加载器目前提供备用的 LevelStem 装载/卸载能力，尚未自动接管所有秘境实例创建。

