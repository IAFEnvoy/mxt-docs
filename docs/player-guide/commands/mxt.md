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
| `/mxt breakthrough <resource>` | 尝试突破指定资源对应的境界。 |
| `/mxt realm set <realm>` | 设置线性境界。 |
| `/mxt soul reclaim` | 回收可回收的灵魂。 |
| `/mxt trigger list [<entity>]` | 列出该实体当前的运行时触发器订阅：模块/标识/信号/状态。订阅从不存档，这是运行中的服务器里唯一能看见它们的地方；不填实体时用自己。 |
| `/mxt trigger rules <signal>` | 按执行顺序列出响应某个信号的数据包规则，以及每条规则的行为类型。 |
| `/mxt trigger publish <signal> [<entity>]` | 手动发布一个信号（需要 gamemaster 权限），不必等待真实事件就能检查规则或订阅；既没有订阅也没有规则监听时会明确提示。 |
