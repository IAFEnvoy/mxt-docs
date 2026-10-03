---
title: WheelMenuEntry
---

# WheelMenuEntry

轮盘上**一样东西**的纯客户端接口：它的名字、图标与"选中它做什么"。一格的身份是它所代表的定义的 id，格子落在第几号、属于哪一页都不归它管。

| 成员 | 说明 |
| --- | --- |
| `WheelEntryKind kind()` | 属于哪一类（见 [WheelEntryKind](./wheel-entry-kind.md)），决定 tooltip 首行、配置界面里的池，以及触发时服务端往哪边分派。 |
| `Identifier id()` | 稳定身份：存档的布局按它寻址，也靠它把定义查回来。 |
| `Component title()` | 指针停在这一格时，轮盘中间显示的名字。 |
| `Optional<IconReference> icon()` | 格子里画的图标，物品或贴图；默认不画。 |
| `int accentColor()` | 配置界面槽位行里标出这一格类别的颜色。 |
| `List<Component> tooltip(Player player)` | 问"这是什么"时显示的行；每帧现算，所以可以读玩家。 |
| `long cooldownTicks(Player player)` | 还剩几 tick 冷却，`0` 就是就绪。 |
| `long cooldownLength(Player player)` | 这一轮冷却**总共多长**，答不出给 `0`。显示按原版物品冷却那样压一层白幕，剩多少盖多少；答不出全长的条目只能画满整格——仍然说明"在冷却"，只是说不出进度。 |
| `boolean usable(Player player)` | 选中它现在有没有用。只影响显示（那一扇的图标上压冷却白幕、中央写"冷却中"），**按下的请求照发**。 |
| `void onSelected(WheelSelection selection)` | 这一格被使用之后回调，轮盘不关。`WheelSelection(source, number, entry, method)` 带着它读自**哪个来源**、是**哪一格的编号**，以及这次是怎么来的。 |

一个来源贡献哪些条目由 `WheelMenuProvider` 回答，**按来源 id 登记**（`WheelMenuContent.register(source, provider)`，内建五页都由 `WheelContent` 登记，所以内容模组加的是自己那一页）。它的返回值**可以比一页长**（一页 12 格，多出来的由 `WheelMenuContent` 开新页）。来源本身见 [WheelSource](./wheel-source.md)，完整实现范例见[轮盘条目](../../wheel.md)。
