---
title: /ability
---

# `/ability`

| 命令 | 作用 |
| --- | --- |
| `/ability`（= `/mxt ability`） | 打开技能快捷栏配置界面。 |
| `/ability cast <id>`（= `/mxt ability cast <id>`） | 强制施放技能。 |
| `/ability list [<target>]`（= `/mxt ability list …`） | 列出持有者身上的技能：名字与**还在维持它的来源**。读的是附件而不是注册表，所以被停用/定义已删除的技能照样列出来——它仍然被持有，也仍然只能按名字撤销。不填 `target` 时看自己，不需要权限。 |
| `/ability grant <targets> <ability>`（= `/mxt ability grant …`） | 以命令自己的来源 `mxt:command` 授予技能（需要 gamemaster 权限）。逐个目标报告成功或失败，失败发生在该目标已由这一来源持有时。 |
| `/ability revoke <targets> <ability>`（= `/mxt ability revoke …`） | 只撤销 `mxt:command` 这一份来源（需要 gamemaster 权限）；还有别的来源持有就什么都不发生，该目标记为失败。逐个目标报告结果。 |
