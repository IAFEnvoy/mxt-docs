---
title: /ability
---

# `/ability`

施放、查看、授予与撤销技能。每个节点也可以写成 `/mxt ability …`。

<div class="cmd-tree">

- `/ability ...`

  - `... cast <id>`

    强制施放一次技能。

  - `... list [<target>]`

    列出持有者身上的技能与还在维持它的来源，不填 `target` 时看自己。

  - `... grant <targets> <ability>`

    以命令自己的来源 `mxt:command` 授予技能。

  - `... revoke <targets> <ability>`

    只撤销 `mxt:command` 这一份来源。

</div>

`cast`、`grant`、`revoke` 需要 gamemaster 权限，`list` 不需要；单独打出 `/ability` 什么都不做。

## cast

**对任何技能类型都走一次普通施放**（`AbilityService.use`：条件、代价、`cast_time`、冷却、充能都照常），即使那个类型平时不进轮盘池（非按键型也一样）。

`cast_time > 0` 的技能不算失败：只要被受理（登记了截止时间、还没落地）就算成功，只有真正的拒绝才报失败，报的是那条原因名。

## list

读的是附件而不是注册表，所以定义已经不在当前包里的技能照样列出来——它仍然被持有，也仍然只能按名字撤销。

## grant、revoke

两者都逐个目标报告成功或失败。`grant` 的目标已由这一来源持有时记为失败；`revoke` 只撤销 `mxt:command` 这一份来源，还有别的来源持有就什么都不发生，该目标记为失败。
