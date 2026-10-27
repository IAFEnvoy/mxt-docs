---
title: /technique
---

# `/technique`

修复、移除与遗忘已习得的功法，并诊断手持的功法物品。每个节点也可以写成 `/mxt technique …`。

<div class="cmd-tree">

- `/technique ...`

  - `... repair [dry-run]`

    清理指向已删除功法定义的失效数据；`dry-run` 只报告会删掉什么、不做改动。

  - `... drop <id>`

    移除一项已习得功法，并重建它带来的属性与能力。

  - `... forget <id>`

    遗忘一项功法：连同**这门功法自己的层数记录**一起删掉（重新学会从入口级开始），并重建它带来的属性与能力。

  - `... diagnose`

    逐条检查手持功法物品为何无法使用。

</div>

`forget` 不动境界、修为、资源与正在跑的法门。
