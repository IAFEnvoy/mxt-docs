---
title: 命令
---

# 命令

所有命令都挂在 `/mxt` 根节点下，需要管理员权限的命令会在命令树中校验 `gamemaster` 权限；纯查询的入口（例如 `/mxt curse list`、`/ability list`、`/mxt trigger list`）不需要权限，只是不填目标时要用到自己，因此仍需由玩家执行。

面向玩家的部分命令同时注册了顶层别名，所以 `/aura` 和 `/mxt aura` 是同一棵树。每个别名都在服务端配置的**「命令别名」标签页**里单独开关（条目名就是命令本身，默认全开），例如关闭 `aura` 只移除 `/aura` 这个顶层写法；`/mxt` 下的入口始终完整，不会出现配置误关导致命令完全不可用的情况。别名一共 12 个：`ability`、`aura`、`curse`、`display`、`formation`、`friend`、`lightning`、`picker`、`talisman`、`technique`、`trade`、`tribulation`。

## 子页面

- [/mxt（含子命令）](/player-guide/commands/mxt)
- [/ability](/player-guide/commands/ability)
- [/aura](/player-guide/commands/aura)
- [/curse](/player-guide/commands/curse)
- [/display](/player-guide/commands/display)
- [/formation](/player-guide/commands/formation)
- [/friend](/player-guide/commands/friend)
- [/lightning](/player-guide/commands/lightning)
- [/picker](/player-guide/commands/picker)
- [/talisman](/player-guide/commands/talisman)
- [/technique](/player-guide/commands/technique)
- [/trade](/player-guide/commands/trade)
- [/tribulation](/player-guide/commands/tribulation)
