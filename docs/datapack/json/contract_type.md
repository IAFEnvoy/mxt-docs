---
title: contract_type（契约类型）
description: 定义契约的双方条件、灵宠侧与主人侧各自的行为、存续期授予主人的能力、签订代价与两个上限。
aside: false
---

# contract_type（契约类型） {#contract_type}

文件位置：`data/<namespace>/mxt/contract_type/<path>.json`

一个 `contract_type` 描述一条契约从签下到解除的过程：双方各自要满足什么条件、灵宠侧四个时刻与主人侧三个时刻各跑什么行为、存续期间授予主人哪些能力、签的时候付什么、一个主人最多能同时持几条、召回要等多久。

**谁能签由代码决定**：目标生物自己得是可契约的（见[接口](../../java/interfaces/index.md)），数据包无法给一个实体加上契约资格。主人也由生物自己回答，本体不存主人。数据包能做的是四件事：用下面的 `*_condition` 收窄双方条件、用 `costs` 收代价、用**实体类型标签**收窄名单、用 `owner_abilities` 在契约存续期间给主人能力——标签与契约类型同 id，写作 `#<命名空间>:contract/<路径>`（文件 `data/<命名空间>/tags/entity_type/contract/<路径>.json`）；**没写这个标签、或标签是空的，都表示不限制**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `contract_type.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `contract_type.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；契约卷轴的提示框会把它显示出来，默认键没被翻译时不显示。 |
| `quality` | 品质 id | 无 | 可选。这份契约的卷轴起始的档位。 |
| `owner_condition` | `EntityCondition` | `mxt:always` | 主人条件。 |
| `creature_condition` | `EntityCondition` | `mxt:always` | 灵宠条件，资格判定之后。 |
| `follow_action` | `EntityAction` | `mxt:no_op` | **当前命令是「跟随」时**每 tick 执行的行为。 |
| `combat_action` | `BiEntityAction` | `mxt:no_op` | 灵宠打出伤害、结算之后执行。 |
| `release_action` | `EntityAction` | `mxt:no_op` | **解除契约**时执行，灵宠还活着。 |
| `death_action` | `EntityAction` | `mxt:no_op` | **灵宠死亡**带动契约结束时执行。 |
| `owner_bind_action` | `EntityAction` | `mxt:no_op` | **签订成功**时对**主人**执行一次。 |
| `owner_release_action` | `EntityAction` | `mxt:no_op` | **解除契约**时对主人执行一次。 |
| `owner_death_action` | `EntityAction` | `mxt:no_op` | **灵宠死亡**带动契约结束时对主人执行一次。 |
| `owner_abilities` | 能力 id 或 `#标签` 的数组 | `[]` | 契约存续期间授予**主人**的能力。 |
| `costs` | `Cost` 数组 | `[]` | 签订代价，由**主人**支付，灵宠不付。 |
| `max_owned` | int | `0` | 每个主人同时能持有的本类型契约数，`0` = 不限。 |
| `recall_cooldown` | int | `0` | 召回冷却（tick），`0` = 不限。 |

`quality` 是可选的：契约卷轴是所有契约共用的一件物品，物品本身说不清是哪一档，只有堆上携带的这份定义报得出——这份契约的卷轴起始就在这一档。堆上写了自己的 `mxt:quality` 组件时以组件为准；这份定义没写 `quality` 时这一层不作答，继续落到注册表 [default_quality](./default_quality.md)。

`follow_action` 只对回答了命令表的实体生效，且排在该实体自己的跟随行为之后；命令换成游荡 / 驻守时这条不跑——它给的是"跟随那一刻"。

解除与死亡是两个字段，一个动作只负责一个时刻：`release_action` 管主人主动解除或管理员强制解除，`death_action` 管灵宠死亡。

**主人侧的动作与授予都只落在主人身上**：`follow_action` / `combat_action` / `release_action` / `death_action` 的宿主是灵宠，三个 `owner_*_action` 的宿主是主人。主人侧三个动作拿到的是**双实体上下文**（`caster_*` 读主人、`target_*` 读那只灵宠），灵宠侧四个动作是单实体上下文。`owner_bind_action` 跑的时候契约已经立好、`owner_abilities` 也已经生效；`owner_release_action` / `owner_death_action` 跑完之后才收回这些能力。**主人不在线时三个 `owner_*_action` 一个都不执行**（解除与死亡照常完成）；`owner_abilities` 会在主人下次登录时按手里的契约重新对一遍，所以不会残留。授予按**契约类型**记账：同一类型的第二只灵宠不重复授予，解掉其中一只也不收回，另一只还在就照旧持有；同一条能力被两种契约同时授予时，解掉一种也不会拿走另一种给的。

`costs` 可用主人的资源账户、背包与脚本通道，付款排在全部条件与 `Pre` 事件之后，付不出就不签、也不扣。

`max_owned` 按主人索引计数，解除或死亡即腾出名额。`recall_cooldown` 的起点记在契约记录上，作用于御兽铃轮盘/命令下的那条「召回」命令。

**命令不是这里的数据包字段**：主人能给灵宠下的命令（跟随 / 游荡 / 驻守 / 召回）由**生物自己回答**，内容模组可以自己再加一条；当前那条记在灵宠的契约记录里，读不出来的 id 按「跟随」处理。见 [命令](/player-guide/commands/contract) 与 [接口](../../java/interfaces/index.md)。

**读契约状态用实体条件 [`mxt:contract`](../types/condition/entity_condition_types.md)**：`bound` 问身上有没有一份契约记录，`type` 把问题限定到某几种契约类型，`behavior` 问它当前那条命令是不是其中之一。

失败原因共用一套文案键 `contract.mxt.failure.<小写枚举名>`，卷轴、御兽铃、灵兽袋与命令打的是同一张表。

```json
// data/example/mxt/contract_type/familiar.json
{
  "owner_condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
  "creature_condition": { "type": "mxt:health", "comparison": ">=", "compare_to": 20 },
  "follow_action": { "type": "mxt:no_op" },
  "combat_action": { "type": "mxt:no_op" },
  "release_action": { "type": "mxt:no_op" },
  "death_action": { "type": "mxt:no_op" },
  "owner_bind_action": { "type": "mxt:no_op" },
  "owner_release_action": { "type": "mxt:no_op" },
  "owner_death_action": { "type": "mxt:no_op" },
  "owner_abilities": ["example:familiar_bond"],
  "costs": [{ "id": "example:qi", "amount": 50 }],
  "max_owned": 1,
  "recall_cooldown": 600
}
```
