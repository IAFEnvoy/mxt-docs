---
title: /realm
---

# `/realm`

`/realm` 管的是**线性境界链**（`mxt:realm_stage`）。**境界和秘境是两套东西**：境界是某个数值（`resource`）修炼链上的一档，秘境（`mxt:secret_realm`）是按需生成的实例维度，后者的运维入口在 [`/mxt secret_realm`](/player-guide/commands/mxt#mxt-secret-realm)。

| 命令 | 作用 |
| --- | --- |
| `/realm set <realm>`（= `/mxt realm set …`） | 把**自己**的当前境界直接设成链上的某一档，并把这条链的修为进度清零（需要 gamemaster 权限）。这一档不在当前有效的修炼链上时会被拒绝并报出原因。 |
| `/realm chain <realm>`（= `/mxt realm chain …`） | 打印这一档所在的**整条境界链**，不需要权限：链上在它**之前**的档是灰色、它自己是绿色、**之后**的是白色。抬头是这条链的身份，也就是该链所属的 `mxt:aura` 条目 ID；被停用、不在任何可用链上的档会报"没有可用的境界链包含它"。 |

## 境界链是什么

境界链属于**灵气定义**：每个 [realm_stage](/datapack/json/realm_stage) 用 `aura` 指回一份 [aura](/datapack/json/aura)，这份定义的 `first_realm` 是链的入口，阶段之间用 `next_realm` 相连，于是同一份定义的阶段连成一条只能前进的线性链——每份定义一条链，一个实体可以同时持有多条链。完整规则见[定义一个灵气与境界链](/tutorial/define-aura-and-realms)。

`chain` 读的是定义本身，而不是谁现在持有哪一档，所以它回答的是"这一档前面是谁、后面又是谁"，核对 `next_realm` 有没有写错时这是最快的办法。它只走**当前生效**的阶段：某一档被 `#mxt:disabled` 停用就从链上断开（服务端重建境界索引时同样会拒绝这样的链）。

`set` 是调数据用的管理入口，不做修炼或突破那一套判定，只看这一档在不在当前有效的链上；`chain` 是纯查询，两者都不需要执行者持有任何东西（`set` 需要 gamemaster 权限）。

顶层别名 `/realm` 由服务端配置的**「命令别名」标签页**控制（条目名 `realm`，默认开启）；关闭后 `/mxt realm` 照旧可用。
