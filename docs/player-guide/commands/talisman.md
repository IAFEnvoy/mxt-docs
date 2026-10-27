---
title: /talisman
---

# `/talisman`

发放空白或已铭刻的符箓载体。整棵子树都需要 `gamemaster` 权限，也可以写成 `/mxt talisman …`。

<div class="cmd-tree">

- `/talisman ...`

  - `... blank [count <count>]`

    发给你 `count` 个空白载体；数量接受 1–64，默认 1。

  - `... give <talisman> [count <count>] [stored]`

    发给你已铭刻这条符箓定义的载体。`count` 一次给出多份（1–64，默认 1），`stored` 以储存模式铭刻，于是它们靠手动灌注而不是下一次点按发动。

  - `... give <talisman> count <count> charged`

    同上，并同时把整笔灵气灌进去，这正是让载体在下一次点按发动的方式；`charged` 只能写在 `count` 之后。

</div>

单独打出 `/talisman` 就是一个空白载体。

定义声明了 `durability` 时，耐久上限**当场写进载体**——拿到手就有耐久条，而且这时 `count` 给的是**多份单张**（带耐久的载体不叠放），见[符箓定义](../../datapack/json/talisman)。

`give` 一次只收**一个**符箓 ID：一张载体只铭刻一条定义，再刻一条会顶掉前一条。要自己写物品组件，字段是单个 `talisman`——`give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:flame_sigil"}]`，字段见[符箓定义](../../datapack/json/talisman)。
