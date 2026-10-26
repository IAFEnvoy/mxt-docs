---
title: /mxt
---

# `/mxt`

| 命令 | 作用 |
| --- | --- |
| `/mxt registries list` | 列出动态注册表及条目数量。 |
| `/mxt registries validate` | 校验数据包定义，并把本次构建**发现的全部问题一次列出**：每条都带出错的文件路径；没有问题时报告注册表与条目数量。 |
| `/mxt attachment status` | 查看自身附件数量和修炼数据。 |
| `/mxt debug on`、`/mxt debug off` | 开启或关闭模块性能分析，普通模式默认关闭，开发模式启动时自动开启，需要 3 级管理员权限。 |
| `/mxt debug status [sources...]` | 查询最近 240 tick 的各模块耗时，需要 3 级管理员权限。 |
| `/mxt debug gui` | 打开性能分析列表与图表，仅玩家可用，需要 3 级管理员权限。 |
| `/mxt resource`、`/mxt resource <id>`、`/mxt resource <id> bar [index]`、`/mxt resource <id> set <value>` | 资源账户：列出全部[资源条](/player-guide/commands/resource)或读一份数值、看它的条、改写它。见 [`/resource`](/player-guide/commands/resource)。 |
| `/mxt cultivate status`、`/mxt cultivate select <action>` | 修炼状态与手动点名一条法门。见 [`/cultivate`](/player-guide/commands/cultivate)。 |
| `/mxt breakthrough <aura>` | 尝试突破到这门**灵气**（`mxt:aura` 条目，补全给的就是它）所通往的境界。缺哪一种修炼资源由境界自己声明，失败时会点名。 |
| `/mxt realm set <realm>`、`/mxt realm chain <realm>` | 设置自己的线性境界；`chain` 打印这一档所在的整条境界链。见 [`/realm`](/player-guide/commands/realm)。 |
| `/mxt lifespan get`、`/mxt lifespan set`、`/mxt lifespan add`、`/mxt lifespan reincarnate` | 读与改写寿元账本，并让目标当场转世（写节点与 `reincarnate` 需要 gamemaster 权限）。见 [`/lifespan`](/player-guide/commands/lifespan)。 |
| `/mxt contract list`、`/mxt contract info <target>` | 列出主人名下的灵兽与读一只灵兽的契约记录。见 [`/contract`](/player-guide/commands/contract)。 |
| `/mxt contract bind <player> <target> <contract_type>`、`/mxt contract break <target>`、`/mxt contract recall <target>`、`/mxt contract behavior <target> <behavior>` | 签订、解除、召回与下行为命令（都需要 gamemaster 权限），与卷轴、御兽铃共用同一条流程。见 [`/contract`](/player-guide/commands/contract)。 |
| `/mxt secret_realm` | 秘境定义、实例、进入/退出、落点检查、入口调整与销毁。见 [`/secret_realm`](/player-guide/commands/secret_realm)。 |
| `/mxt soul reclaim` | 回收可回收的灵魂。 |
| `/mxt trigger list [<entity>]` | 列出该实体当前的运行时触发器订阅：模块/标识/信号/状态。订阅从不存档，这是运行中的服务器里唯一能看见它们的地方；不填实体时用自己。 |
| `/mxt trigger rules <signal>` | 按执行顺序列出响应某个信号的数据包规则，以及每条规则的行为类型。 |
| `/mxt trigger publish <signal> [<entity>]` | 手动发布一个信号（需要 gamemaster 权限），不必等待真实事件就能检查规则或订阅；既没有订阅也没有规则监听时会明确提示。 |
| `/mxt rift …` | 2 级 OP 的传送门创建、编辑、目标、变换与导出入口，见[裂隙](/player-guide/rift)。 |

## `/mxt debug`

整棵命令树和 GUI 数据接收都需要 3 级管理员权限（`admin`）。这组命令没有顶层别名。

按步骤开启记录与使用图表，见[开发模式教程](../../tutorial/dev-mode.md)。

性能分析在普通模式默认关闭，用 `/mxt debug on` 开始记录。开发模式下，服务器启动时会自动开启记录；开发启动环境或启用服务端配置「调试 → 调试模式」均属于开发模式。手动 `/mxt debug off` 后保持关闭，直到再次执行开启指令或重启服务器时重新按开发模式决定初始状态。

用 `/mxt debug gui` 打开列表。每行显示本地化模块名称和 min / avg / max（毫秒），右侧是最近 240 tick 的柱图；可以按模块名称、最小、平均或最大耗时排序，并切换升降序。图表固定为 240 px 宽，纵轴上限标在图表左侧顶部。页面紧凑居中，窄窗口将名称与统计放到图表上方。

列表支持滚轮与右侧滚动条，点击轨道或拖动滑块即可上下查看；顶部按钮保持固定，列表没有悬停提示。父项包含子调用耗时，各项不能直接相加。底部提示建议使用 spark 模组进行更准确的分析。

单人游戏在 GUI 打开时按每个服务端 tick 更新本地快照，界面每帧直接读取最新数据，不受 5 tick 发包周期限制。多人游戏（包括开放到局域网）仅在 GUI 打开时每 5 tick 接收一次数据；关闭界面、断线或失去权限会停止订阅。打开 GUI 不会自动开启记录。

`/mxt debug status` 按需计算最近 240 tick 的 min、avg、max、50%、95%、99%、调用次数与有效 tick 数。可以用空格指定多个 Source，支持补全，例如 `/mxt debug status server/cost server/economy/change`；省略参数则查询全部 Source。不完整的 tick 不参与统计，完整的空闲 tick 计为零。

## `/mxt secret_realm`

整棵子树需要 2 级 OP。`definitions` 查询定义；`list`、`info` 查询实例；`enter` 按定义进入，`join` 点名实例；`check` 检查落点，`anchor` 调整实例入口；`exit` 返回，`destroy` 结束实例。参数和排错说明见 [`/secret_realm`](/player-guide/commands/secret_realm)。

## `/mxt rift`

裂隙是以 UUID 管理的平面多边形门。整棵子树需要 2 级 OP：`spawn`、`edit`、`info`、`target`、`enabled`、`duration`、`copy`、`transform`、`remove`、`export` 调用同一套校验与传送规则。

机制与逐条命令的说明见[裂隙](/player-guide/rift)。
