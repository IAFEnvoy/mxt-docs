---
title: /quality
---

# `/quality`

| 命令 | 作用 |
| --- | --- |
| `/quality`（= `/mxt quality`） | 看自己**主手**物品的品质：现在解析出来的那一档，以及它所属的链条。不需要权限。 |
| `/quality get [<target>]`（= `/mxt quality get …`） | 同上，看别人的（需要 gamemaster 权限）。 |
| `/quality set <targets> <quality>`（= `/mxt quality set …`） | 把品质**覆盖组件**写到目标主手的物品上（需要 gamemaster 权限）。它压过这一堆携带的定义与注册表那一层，`/quality clear` 摘掉；这一档能不能用仍由它自己的 `condition` 与所属链条决定。 |
| `/quality clear <targets>`（= `/mxt quality clear …`） | 摘掉主手物品上的覆盖组件（`/quality set` 写的、**锻造结算**与**画符铭刻**写的都是它），让它退回这一堆携带的定义声明的档位、再退回注册表 `mxt:default_quality` 给的那一档（需要 gamemaster 权限）。本来就没有覆盖时逐个目标报失败。 |
| `/quality upgrade <targets>`（= `/mxt quality upgrade …`） | 把主手物品在它所属的链条上**往上推一档**（需要 gamemaster 权限）：先过**下一档**自己写的 `upgrade_condition`，代价就是它的 `upgrade_costs`（`plan` → `commit` **整组原子**，付不出就一点不动、也不写档）。已经在顶端、或解析出的档不在链上时都会逐个目标报出原因。 |
| `/quality chain <quality>`（= `/mxt quality chain …`） | 打印这一档所在的**整条品质链**，不需要权限：链上在它之前的是灰色、它自己是绿色、之后的是白色。一档只属于一条链（运行时沿 `next` 走出来的那一条）；不在任何链上或链条没走通时报「没有品质链包含它」，当前包不提供这一档时同样会被拒绝。链名写在入口档上，入口档没有名字时这一行开头的链名显示成 `null`。 |

## 品质是哪一档

一条物品堆的品质按固定顺序取**第一个能拿到的**：

1. 堆上的 `mxt:quality` **组件**（整份品质对象）——`/quality set`、一次成功的升级、锻造台结算与画符铭刻写的都是它；组件里那个 id 在当前包里没有对应条目时，这一层等于没答；
2. **这一堆携带的定义**自己声明的档，读的是那件物品上装着定义身份的那份组件。声明 `quality` 的九个定义是 `technique`、`alchemy_furnace`、`alchemy_wall_material`、`spirit_root`、`physique`、`pill`、`formation`、`secret_realm`、`contract_type`；
3. 注册表 [default_quality](/datapack/json/default_quality)：物品在表里写了哪一档。

第 2 层回答的是"一类定义共用一件内置物品、物品说不清是哪一档"的那批：所有功法书、所有丹药、所有炉型规格、灵根石与体质石都是这样。`artifact` 与 `spirit_herb` 按物品认领、堆上没有定义身份可问，`talisman` 的载体装着一列符、同样没有单份定义可问——这三者的档只写在第 3 层里。

链条看这一堆解析出的那一档：链名写在档位自己身上（写在入口档），所以绑定表与组件都不必声明链，见[品质](/datapack/json/quality)。三层都没有答案时这一堆就是没有品质，**不会去补某条链的入口档**。

`set` 写的就是第 1 层那个覆盖组件，所以它压过后面两层；`clear` 之后物品退回第 2 层，只有定义也没声明时，才落到注册表写的档——**锻造结算与画符铭刻写的那一档也一起被清掉**（它们写在同一个组件里，不单独存）。`upgrade` 成功后也把新的那一档写进同一个覆盖组件——所以升级过的物品从此以覆盖组件为准，`/quality clear` 按同样三层重新解析。

## 升级只升一档

`upgrade` 只推**一档**，付的就是**下一档**自己写的 `upgrade_costs`；想爬两级就执行两次，每次各付各的代价。写了 `next` 却没写代价的那一步是空代价，等于白升；想让某一档当顶端就不写它的 `next`。完整规则见[品质](/datapack/json/quality)。

顶层别名 `/quality` 由服务端配置的**「命令别名」标签页**控制（条目名 `quality`，默认开启）；关闭后 `/mxt quality` 照旧可用。
