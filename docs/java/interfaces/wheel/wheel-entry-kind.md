---
title: WheelEntryKind
---

# WheelEntryKind

轮盘**一类格子**是什么：这一类说清一个 id 该在哪个注册表、列表或代码表里解析——正因为有它，一个十二格的轮盘才能把技能、灵气与内容模组自己加的东西混在一起。内容模组实现它并在模组初始化里调 `WheelEntryKinds#register` 登记，这一类就和内建的一样进存档布局、进配置界面的候选池，也由它决定按下这一格做什么。**同一 id 先注册者胜**。内建四个：`mxt:empty`、`mxt:ability`、`mxt:aura`、`mxt:behavior`。

| 成员 | 说明 |
| --- | --- |
| `Identifier id()` | 这一类在布局与网络请求里的名字。 |
| `Component displayName()` | 配置界面里这一类的名字。 |
| `boolean holdsEntry()` | 这一类的格子持不持有条目。`mxt:empty` 是唯一答否的那一个，空格子就靠它拼出来，所以一份布局永远有十二格。 |
| `boolean exists(RegistryAccess access, Identifier id)` | 这个 id 现在还算不算数。两侧各自传自己的注册表访问器；解析不出来的定义就让它从所有轮盘上消失。 |
| `boolean trigger(ServerPlayer player, WheelSource source, Identifier id)` | **按下这一格做什么**，只有服务端调。请求里点名的页已经被重新读过；要报拒绝就返回 `false`，文案由实现自己负责。 |
| `boolean directed(ServerPlayer player, WheelSource source, Identifier id, boolean wanted)` | 同一个请求的带方向形式：界面或脚本直接点名想要的状态，而不是让服务端读当前状态。只有"有状态"的那类有状态可点，默认答 `false`。 |

服务端受理的顺序是"先要求这个来源现在仍然认这一项"（来源自己的 `offers`），再把这次按压交给 `kind.trigger`；请求里带 `enabled` 时走 `directed`，它按 id 单独寻址、没有格子。来源见 [WheelSource](./wheel-source.md)，条目见 [WheelMenuEntry](./wheel-menu-entry.md)，内建三种怎么实现的见[轮盘条目](../../wheel.md)。
