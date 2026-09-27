---
title: /quality
---

# `/quality`

| 命令 | 作用 |
| --- | --- |
| `/quality`（= `/mxt quality`） | 看自己**主手**物品的品质：现在解析出来的那一档，以及它所属的链条。不需要权限。 |
| `/quality get [<target>]`（= `/mxt quality get …`） | 同上，看别人的（需要 gamemaster 权限）。 |
| `/quality set <targets> <quality>`（= `/mxt quality set …`） | 把品质**覆盖组件**写到目标主手的物品上（需要 gamemaster 权限）。它盖过定义默认档，`/quality clear` 摘掉；这一档能不能用仍由它自己的 `condition` 与所属链条决定。 |
| `/quality clear <targets>`（= `/mxt quality clear …`） | 摘掉主手物品上的覆盖组件，让它回到定义默认档（需要 gamemaster 权限）。本来就没有覆盖时逐个目标报失败。 |
| `/quality upgrade <targets>`（= `/mxt quality upgrade …`） | 把主手物品在它所属的链条上**往上推一档**（需要 gamemaster 权限）：先过**下一档**自己写的 `upgrade_condition`，代价就是它的 `upgrade_costs`（`plan` → `commit` **整组原子**，付不出就一点不动、也不写档）。已经在顶端、或解析出的档不在链上时都会逐个目标报出原因。 |
| `/quality chain <quality>`（= `/mxt quality chain …`） | 打印这一档所在的**整条品质链**，不需要权限：链上在它之前的是灰色、它自己是绿色、之后的是白色。一档只属于一条链（它自己声明的 `quality`）；没有链或链条没走通时报"没有品质链包含它"，当前包不提供这一档时同样会被拒绝。 |

## 品质是哪一档

一条物品堆的品质按固定顺序取**第一个能拿到的**：

1. 堆上的 `mxt:quality` **组件**（整份品质对象）；
2. 堆上的锻造结果 `mxt:forging_result` 记着的那一档；
3. **定义默认档**：法器 [artifact](/datapack/json/artifact) 的 `quality`、功法 [technique](/datapack/json/technique) 的 `quality`；
4. 这一栈所属**链条的入口档**；
5. 匹配到的灵植 [spirit_herb](/datapack/json/spirit_herb) 声明的 `quality`。

链条看这一堆解析出的那一档：链名写在 `quality` 自己身上，所以绑定表与组件都不必声明链，见[品质](/datapack/json/quality)。

`set` 写的就是第 1 格那个覆盖组件，所以它盖过后面四步；`clear` 之后物品回到定义默认档。`upgrade` 成功后也把新的那一档写进同一个覆盖组件——所以升级过的物品从此以覆盖组件为准，`/quality clear` 能把它退回定义默认档。

## 升级只升一档

`upgrade` 只推**一档**，付的就是**下一档**自己写的 `upgrade_costs`；想爬两级就执行两次，每次各付各的代价。写了 `next` 却没写代价的那一步是空代价，等于白升；想让某一档当顶端就不写它的 `next`。完整规则见[品质](/datapack/json/quality)。

顶层别名 `/quality` 由服务端配置的**「命令别名」标签页**控制（条目名 `quality`，默认开启）；关闭后 `/mxt quality` 照旧可用。
