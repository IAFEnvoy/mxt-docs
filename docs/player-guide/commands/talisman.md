---
title: /talisman
---

# `/talisman`

| 命令 | 作用 |
| --- | --- |
| `/talisman`（= `/mxt talisman`） | 发给你一个空白符箓载体。该子树的所有节点都需要 `gamemaster` 权限。 |
| `/talisman blank [count <count>]`（= `/mxt talisman blank [count <count>]`） | 发给你 `count` 个空白载体；数量接受 1–64，默认 1。 |
| `/talisman give <talismans> [count <count>] [stored]`（= `/mxt talisman give …`） | 发给你已铭刻指定符箓定义的载体；`<talismans>` 是逗号分隔的列表，`count` 一次给出多份（1–64，默认 1），`stored` 以储存模式铭刻，于是它们靠手动灌注而不是下一次点按发动。 |
| `/talisman give <talismans> count <count> charged`（= `/mxt talisman give …`） | 同上，并同时把整笔灵气灌进去，这正是让载体在下一次点按发动的方式。`charged` 只能写在 `count` 之后。 |
