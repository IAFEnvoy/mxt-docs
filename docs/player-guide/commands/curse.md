---
title: /curse
---

# `/curse`

查看、施加、移除与净化诅咒。每个节点也可以写成 `/mxt curse …`。

<div class="cmd-tree">

- `/curse ...`

  - `... list [<target>]`

    列出持有者身上的诅咒：名字、层数、剩余 tick 或「永不到期」；不填 `target` 时看自己，不需要权限。

  - `... apply <targets> <curse> [<stacks>] [<duration_ticks>]`

    施加一条诅咒，`stacks` 取 1–256。

  - `... remove <targets> <curse>`

    以 `explicit` 原因移除。

  - `... cleanse <targets> <tag>`

    按 `mxt:curse` 标签解毒。

</div>

`apply`、`remove` 与 `cleanse` 需要 gamemaster 权限。

## apply

它与内容走同一条事务：条件、叠层、`on_apply` 照常。当前包不提供的定义（文件被删、或被 `neoforge:conditions` 挡掉）在解析阶段就被 `ResourceArgument` 拒掉。`duration_ticks` 只能收紧定义自己的时长。

## remove

以 `explicit` 原因移除，这也是**定义已不在当前包里的诅咒的唯一出口**。

## cleanse

与解毒剂共用 `cleansed` 原因；定义已不在当前包里的实例会拒绝并说明原因。
