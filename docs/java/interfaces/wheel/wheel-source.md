---
title: WheelSource
---

# WheelSource

轮盘**一页**从哪来，也就是"这一页是哪一页"：玩家自己摆的那一盘读存档，其余每一页都由玩家此刻带在身上的东西现算。内容模组实现它并在自己的模组初始化里调 `WheelSourceTypes#register` 登记，这一页就和内建页一样参与编号与翻页。**同一 id 先注册者胜**，页顺序就是注册顺序也就是编号顺序。内建五个：玩家自己的布局、主手物品、副手物品、Curios 上的法器、契约灵兽。

| 成员 | 说明 |
| --- | --- |
| `Identifier id()` | 客户端与服务端都按它称呼这一页，两侧只要对登记有一致认识，不需要对顺序有共识。 |
| `Component displayName()` | 页名。内建页返回自己的翻译键，内容模组给什么组件都行。 |
| `boolean configured()` | 这一页是不是玩家自己摆的布局，而不是对身上东西的现读。布局页永远显示，哪怕一格都没有——那是玩家自己排的地方。 |
| `List<Identifier> grantSources(LivingEntity entity)` | 这一页由哪些授予来源拼成；不读授予账的页给空表。这些 id 就是装备上的物品记下自己授予时用的那些，所以换掉物品这一页当场就空。 |
| `List<ItemStack> equipment(LivingEntity entity)` | 这一页从哪几件栈上读承载物，按按下时的优先顺序。 |
| `boolean offers(LivingEntity entity, WheelEntryKind kind, Identifier id)` | 这一项此刻能不能从这一页触发。**回答能不代表得到授权**：后面的管线自己会再查授予、冷却与消耗。 |

分页、编号与主盘 / 从盘的完整规则见[轮盘条目](../../wheel.md)；条目契约见 [WheelMenuEntry](./wheel-menu-entry.md)。
