---
title: /mxt
---

# `/mxt`

| 命令 | 作用 |
| --- | --- |
| `/mxt registries list` | 列出动态注册表及条目数量。 |
| `/mxt registries validate` | 校验数据包定义，并把本次构建**发现的全部问题一次列出**：每条都带出错的文件路径；没有问题时报告注册表与条目数量。 |
| `/mxt attachment status` | 查看自身附件数量和修炼数据。 |
| `/mxt resource <id>` | 查询资源值。 |
| `/mxt resource <id> set <value>` | 设置资源值。 |
| `/mxt resourcebar [resource] [index]` | 查看资源条的原始当前值、上下限、未截断百分比、上下文、位置和顺序；不填参数时列出全部资源条。 |
| `/mxt cultivate status` | 查看修炼状态。 |
| `/mxt breakthrough <aura>` | 尝试突破到这门**灵气**（`mxt:aura` 条目，补全给的就是它）所通往的境界。缺哪一种修炼资源由境界自己声明，失败时会点名。 |
| `/mxt realm set <realm>`、`/mxt realm chain <realm>` | 设置自己的线性境界；`chain` 打印这一档所在的整条境界链。见 [`/realm`](/player-guide/commands/realm)。 |
| `/mxt contract list`、`/mxt contract info <target>` | 列出主人名下的灵兽与读一只灵兽的契约记录。见 [`/contract`](/player-guide/commands/contract)。 |
| `/mxt contract bind <player> <target> <contract_type>`、`/mxt contract break <target>`、`/mxt contract recall <target>`、`/mxt contract behavior <target> <behavior>` | 签订、解除、召回与下行为命令（都需要 gamemaster 权限），与卷轴、御兽铃共用同一条流程。见 [`/contract`](/player-guide/commands/contract)。 |
| `/mxt secret_realm list` | 列出当前所有秘境实例：维度键、序号、定义、在场人数与上限、主人、地形是否已布置、维度当前是否加载。 |
| `/mxt secret_realm info <dimension>` | 查看某一份实例的同一行信息。 |
| `/mxt secret_realm enter <definition>` | 以自己为进入者开一份或加入一份秘境实例（需要 gamemaster 权限）。这是无需令牌就能进秘境的管理入口，走的是与令牌完全相同的那条流程（条件、人数、实例上限、生成）。 |
| `/mxt secret_realm exit` | 把自己从当前秘境送回进入时的位置（定义里的 `exit_condition` 对这条命令同样生效）。 |
| `/mxt secret_realm destroy <dimension>` | 强制结束一份实例：把里面的人送回，然后卸载维度并清空它的地形数据，**认领过的秘境也会被删掉**（需要 gamemaster 权限）。 |
| `/mxt soul reclaim` | 回收可回收的灵魂。 |
| `/mxt trigger list [<entity>]` | 列出该实体当前的运行时触发器订阅：模块/标识/信号/状态。订阅从不存档，这是运行中的服务器里唯一能看见它们的地方；不填实体时用自己。 |
| `/mxt trigger rules <signal>` | 按执行顺序列出响应某个信号的数据包规则，以及每条规则的行为类型。 |
| `/mxt trigger publish <signal> [<entity>]` | 手动发布一个信号（需要 gamemaster 权限），不必等待真实事件就能检查规则或订阅；既没有订阅也没有规则监听时会明确提示。 |
| `/mxt rift …` | 裂隙的运维入口（需要 gamemaster 权限）：查看与改写某个裂隙的目标与颜色，看它连出了几条线、几个三角形，或直接放置一个。完整的行为与用法见[裂隙](/player-guide/rift)。 |

## `/mxt secret_realm`

秘境定义（`mxt:secret_realm`）是模板而不是某个固定维度：每次进入都可能开出一份**新的实例维度**，维度键是 `<定义命名空间>:secret_realm/<定义路径>/<序号>`，序号从 `0` 开始（只能开一份的定义也带序号）。这组命令是它的运维入口，**整棵子树都需要 gamemaster 权限**（`list`、`info`、`exit` 也一样，它们是给管理员看状态用的）。

| 子命令 | 行为 |
| --- | --- |
| `list` | 列出所有实例。`loaded=false` 表示这份实例正在休眠——通常是因为它被认领过、人都走光了，地形留在存档里等着主人再来。 |
| `info <dimension>` | 只看一份，参数写维度键，例如 `mxt:secret_realm/trial_realm/0`。 |
| `enter <definition>` | 自己进去。走完整流程：停用检查、进入条件、找一份没满的实例或新开一份（受 `max_instances` 限制）、生成维度与结构、落到入口。 |
| `exit` | 回进入时的位置。定义里的 `exit_condition` 对这条命令同样生效（和自己用令牌离开一样）。 |
| `destroy <dimension>` | 结束一份实例并**删除它的地形**。被锁在里面的玩家会被送回；`mxt:existing` 型秘境只清空成员，不动那个真实维度。 |

## `/mxt rift`

裂隙（`mxt:rift`）不是数据包定义，而是运行时摆出来的方块：每个裂隙在方块中心画一个点，和 3×3×3 内所有相邻裂隙连线（不看朝向），两条线彼此也相邻时就围出一个三角形并填充内部。这组命令是它的运维入口，**整棵子树都需要 gamemaster 权限**：`info`、`target`、`color`、`place` 和 `bind` 分别查看与改写一个裂隙通往哪里、什么颜色（`info` 还会报出它**是否孤立**，即周围 3×3×3 内有没有第二个裂隙），或直接放一个、把手上的裂隙锚写成某个目标；玩家侧的正常用法是拿着裂隙锚（`mxt:rift` 物品）放和改。

机制与逐条命令的说明见[裂隙](/player-guide/rift)。
