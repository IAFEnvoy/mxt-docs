---
title: /cultivate
---

# `/cultivate`

`/cultivate` 管的是**正在跑的那一套修炼**：看自己此刻在修什么，或者点名一条[法门](/datapack/json/cultivation.md)**立刻开练**。这两个节点一个只读、一个需要 gamemaster 权限。

| 命令 | 作用 |
| --- | --- |
| `/cultivate status`（= `/mxt cultivate status`） | 读出当前修炼状态：正在跑的法门、按灵气分开记的修为进度、下一次结算的 tick。 |
| `/cultivate select <action>`（= `/mxt cultivate select …`） | 点名一条法门（`mxt:cultivation` 的条目）立刻开练（需要 gamemaster 权限）。 |

## `/cultivate status`

打一行：正在跑的法门（没在修就是"无"）、**修为进度**、下一个结算 tick。进度是**按灵气分开记**的，有几条链在爬就有几项，格式是 `灵气=数值`，所以同一具身体同时修两门灵气时一眼能看出是谁攒到了哪。

这里读的是附件里那条**正在跑**的记录，不是"按 `priority` 会挑哪一条"——挑选是坐下来那一刻的事，见[修炼方式](/datapack/json/cultivation.md)。要看"选出来的是哪条"，坐下之后看这一行即可。

## `/cultivate select`

点名一条法门，**把正在修的那条先停掉**，然后立刻开这一条。它跳过的只有 `priority`：这条法门此刻该不该跑，仍由它自己的条件决定（`start_condition` / `cultivate_condition`，以及灵气侧那份 `start_cultivate_conditions`），不适用就拒绝——**正在跑的那条不受影响，不会被停掉**。

它只管这一次。**不落盘、也不改变下次按键时的挑选顺序**：之后再按修炼键，仍然按"适用 + `priority`"重新挑，见[修炼方式](/datapack/json/cultivation.md)。所以它是管理员调数据用的入口，不是"锁定某一条修炼"的开关。

被拒绝时聊天栏报的是这条法门自己的失败原因（与界面上那句同一套文案），所以"为什么开不起来"直接就有了。

## 顶层别名

`/cultivate` 由服务端配置的**「命令别名」标签页**控制（条目名 `cultivate`，默认开启）；关闭后 `/mxt cultivate` 照旧可用。

## 权限

`/cultivate select` 需要 gamemaster 权限；`/cultivate status` 不需要，但它要求由玩家执行（读的是执行者自己的修炼记录）。
