---
title: /talisman
---

# `/talisman`

| 命令 | 作用 |
| --- | --- |
| `/talisman`（= `/mxt talisman`） | 发给你一个空白符箓载体。该子树的所有节点都需要 `gamemaster` 权限。 |
| `/talisman blank [count <count>]`（= `/mxt talisman blank [count <count>]`） | 发给你 `count` 个空白载体；数量接受 1–64，默认 1。 |
| `/talisman give <talisman> [count <count>] [stored]`（= `/mxt talisman give …`） | 发给你已铭刻这条符箓定义的载体；`count` 一次给出多份（1–64，默认 1），`stored` 以储存模式铭刻，于是它们靠手动灌注而不是下一次点按发动。 |
| `/talisman give <talisman> count <count> charged`（= `/mxt talisman give …`） | 同上，并同时把整笔灵气灌进去，这正是让载体在下一次点按发动的方式。`charged` 只能写在 `count` 之后。 |

`give` 一次只收**一个**符箓 ID，一张载体只铭刻一条定义；以前的逗号列表写法已经取消。要在一张载体上刻多条（例如一条触发符配一条储能符），改用物品组件写法：`give @s mxt:talisman[mxt:talisman={talismans:["mxt_test:flame_sigil","mxt_test:common_sigil"]}]`，字段见[符箓定义](../../datapack/json/talisman)。
