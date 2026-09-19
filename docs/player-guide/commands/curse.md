---
title: /curse
---

# `/curse`

| 命令 | 作用 |
| --- | --- |
| `/mxt curse list [<target>]`（= `/curse`） | 列出持有者身上的诅咒：名字、层数、剩余 tick 或「永不到期」。不填 `target` 时看自己，不需要权限。 |
| `/mxt curse apply <targets> <curse> [<stacks>] [<duration_ticks>]`（= `/curse apply …`） | 施加一条诅咒（需要 gamemaster 权限），`stacks` 取 1–256，走与内容同一条事务：条件、叠层、`on_apply` 照常；被 `#mxt:disabled` 停用或已删除的定义会被拒绝并报出原因。`duration_ticks` 只能收紧定义自己的时长。 |
| `/mxt curse remove <targets> <curse>`（= `/curse remove …`） | 以 `explicit` 原因移除（需要 gamemaster 权限）。这也是**被停用/已删除定义的唯一出口**。 |
| `/mxt curse cleanse <targets> <tag>`（= `/curse cleanse …`） | 按 `mxt:curse` 标签解毒（需要 gamemaster 权限），与解毒剂同一个 `cleansed` 原因；被停用的实例会拒绝并说明原因。 |
