---
title: ContractOperations
---

# ContractOperations

契约之后"这只灵兽自己怎么做"的接口。**每个默认实现就是框架从前写死的那一段**（传送、跟随、寻路），所以实现了接口却什么都不覆写的灵兽，行为与从前完全一致。**不实现它等于不要这套通用行为**：这只生物仍然能被契约，但框架不替它跟随、不替它召回落地、也不上报协战，`follow_action` 与 `combat_action` 因此不跑——它们本来就是给这两个时刻配色的。入参 `ContractContext` 带着生物本身、主人 UUID、在线的主人（离线为空）与契约类型。

| 成员 | 说明 |
| --- | --- |
| `List<ContractBehavior> behaviors()` | 这只兽认哪些命令，顺序就是御兽铃轮盘上的顺序。默认是框架的四个内置项（跟随 / 游荡 / 驻守 / 召回），**两侧都要能答**，御兽铃读它填轮盘页。 |
| `boolean onBehaviorSelected(ContractContext context, ContractBehavior behavior)` | **输入**：主人下了命令。返回 `false` 即拒绝，当前命令保持原样。 |
| `void tick(ContractContext context, ContractBehavior behavior)` | 每 tick 的驱动，默认分派到 `follow` / `wander` / `stay`，不认识的命令什么都不做。 |
| `void recall(ContractContext context)` | 主人摇了铃，落地动作交给它；默认传送到主人。这次调用会消耗召回闩。 |
| `void follow(ContractContext context)` | 每 tick 跟随（主人必须在线且同维度）：默认超过 32 格传送、超过 4 格寻路。 |
| `void wander(ContractContext context)` | 默认在主人 32 格外先传送过去（免得游荡的兽被丢下），否则每约两秒、且寻路空闲时在主人周围 3–8 格挑一个新点走过去。**框架不往实体里塞 goal**，生物自己的游荡目标照旧，要改就自己覆写。 |
| `void stay(ContractContext context)` | 默认停寻路并清攻击目标——"停下来"而不是"冻住"；自己的 goal 会把它走开的话，想要真正不动就覆写。 |
| `void onDealtDamage(ContractContext context, LivingEntity target, double damage)` | 自己打出伤害、结算之后；这一击本身不在这里改。 |

**命令本身是类，不是枚举**：`ContractBehavior`（`id` + `momentary` + `name()`，`equals` 只认 id）配 `ContractBehaviors` 这个装载类，`new` 一个再 `register(...)` 就多一条（"停手""回窝"都行），**内容方不用改框架的清单**；`momentary` 区分常驻与"只此一次"（召回的闩与冷却归框架，所以它走 `ContractService.requestRecall`，不写记录）。

当前命令**只有一份**，在 `mxt:contract` 附件上（存 id；读不出来的 id 一律按跟随处理）。输入端唯一出口是 `ContractBehaviorService`：已绑定 → 主人 → 实现了接口 → **这条命令在它的 `behaviors()` 里** → `onBehaviorSelected` → 写入（常驻）或只执行一次（一次性）。

**御兽铃只是指针**：右键生物＝把"生物 UUID + 显示名 + 它自己答的命令表"写进物品组件 `mxt:contract_bell`，右键空处＝在客户端打开轮盘并停在「契约灵兽」那一页。页面读的正是铃上那份快照，所以**不需要在客户端解析一只可能没加载的灵兽**；命令真正生效前，服务端还会把铃、灵宠的记录、主人与这条命令全部重查一遍。资格接口见 [Contractable](./contractable.md)，玩家侧入口见[命令](/player-guide/commands/contract)。
